import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROFILE_ENV,
  ASTRA_REPORT_MODEL_PROVIDER_ENV,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_DETERMINISTIC_REPORT_WRITER,
  buildAstrologyReportResultAsync,
  reportModelProfileKeys,
  reportModelProfileModels,
  type ReportModelProfile
} from "@astra/astrology";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import {
  adminAdjustCredits,
  adminUpdateUserRole,
  astrologyReportRequests,
  astrologyReportResults,
  db,
  getAstrologyReportRequest,
  getCreditLedgerSummary,
  getUserChartMakerRequest,
  listCreditUsers,
  listRecentBetaFeedback,
  listRecentCreditLedger,
  recordAstrologyReportResult,
  recordChartMakerResult
} from "@astra/db";
import { desc, eq } from "drizzle-orm";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";

export const dynamic = "force-dynamic";

type AdminSearchParams = {
  creditSearch?: string | string[];
  creditUser?: string | string[];
  replayProfile?: string | string[];
  replayRequest?: string | string[];
  replayStatus?: string | string[];
};

const replayProfileOptions = reportModelProfileKeys;

function normalizeModelProfile(value: FormDataEntryValue | null): ReportModelProfile {
  const profile = String(value ?? "production");
  return reportModelProfileKeys.includes(profile as ReportModelProfile) ? (profile as ReportModelProfile) : "production";
}

function optionalFormString(value: FormDataEntryValue | null) {
  const clean = String(value ?? "").trim();
  return clean || undefined;
}

async function adjustCreditsAction(formData: FormData) {
  "use server";
  const { profile } = await getAstraAuthContext();
  if (profile?.role !== "admin") throw new Error("Admin access is required.");

  const direction = String(formData.get("direction") ?? "grant") === "revoke" ? "revoke" : "grant";
  const amount = Number.parseInt(String(formData.get("amount") ?? ""), 10);
  await adminAdjustCredits(db, {
    actorEmail: profile.email,
    amount,
    direction,
    notes: String(formData.get("notes") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    targetEmail: String(formData.get("targetEmail") ?? "")
  });
  revalidatePath("/admin");
}

async function replayReportAction(formData: FormData) {
  "use server";
  const { profile } = await getAstraAuthContext();
  if (profile?.role !== "admin") throw new Error("Admin access is required.");

  const requestId = optionalFormString(formData.get("requestId"));
  const modelProfile = normalizeModelProfile(formData.get("modelProfile"));
  const reportWriter = optionalFormString(formData.get("reportWriter")) ?? DEBUG_MODEL_REPORT_WRITER;
  const modelProvider = optionalFormString(formData.get("modelProvider"));
  const model = optionalFormString(formData.get("model"));

  if (!requestId) {
    redirect("/admin?replayStatus=missing-request");
  }

  const reportRequest = await getAstrologyReportRequest(db, requestId);
  if (!reportRequest) {
    redirect(`/admin?replayStatus=not-found&replayRequest=${encodeURIComponent(requestId)}&replayProfile=${modelProfile}`);
  }

  if (reportRequest.chartRequestId) {
    const chartRequest = await getUserChartMakerRequest(db, {
      requestId: reportRequest.chartRequestId,
      userId: reportRequest.userId
    });
    if (chartRequest) {
      await recordChartMakerResult(db, buildChartMakerRecordResult(chartRequest));
    }
  }

  const env = {
    ...process.env,
    [ASTRA_REPORT_WRITER_ENV]: reportWriter,
    [ASTRA_REPORT_MODEL_PROFILE_ENV]: modelProfile,
    [ASTRA_REPORT_MODEL_PROVIDER_ENV]: modelProvider ?? (model ? process.env[ASTRA_REPORT_MODEL_PROVIDER_ENV] : undefined),
    [ASTRA_REPORT_MODEL_ENV]: model
  };
  const resultPayload = await buildAstrologyReportResultAsync(reportRequest, { env });
  const result = await recordAstrologyReportResult(db, resultPayload);
  revalidatePath("/admin");
  redirect(`/admin?replayStatus=${encodeURIComponent(result.status)}&replayRequest=${encodeURIComponent(requestId)}&replayProfile=${modelProfile}`);
}

async function updateUserRoleAction(formData: FormData) {
  "use server";
  const { profile } = await getAstraAuthContext();
  if (profile?.role !== "admin") throw new Error("Admin access is required.");

  await adminUpdateUserRole(db, {
    role: String(formData.get("role") ?? "customer"),
    targetEmail: String(formData.get("targetEmail") ?? "")
  });
  revalidatePath("/admin");
}

function firstSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function creditUserHref(userId: string, search: string) {
  const params = new URLSearchParams({ creditUser: userId });
  if (search) params.set("creditSearch", search);
  return `/admin?${params.toString()}`;
}

function formatAdminDate(value: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago"
  });
}

function formatCreditAmount(amount: number) {
  return amount > 0 ? `+${amount}` : String(amount);
}

function roleLabel(role: string) {
  return role === "admin" ? ui.admin.adminRole : ui.admin.customerRole;
}

function ledgerReason(entry: { description: string | null; metadata: Record<string, unknown>; source: string }) {
  const reason = typeof entry.metadata.reason === "string" ? entry.metadata.reason : null;
  return reason ?? entry.description ?? entry.source;
}

function ledgerActor(entry: { metadata: Record<string, unknown>; source: string }) {
  if (typeof entry.metadata.actor === "string" && entry.metadata.actor) return entry.metadata.actor;
  if (typeof entry.metadata.adminEmail === "string" && entry.metadata.adminEmail) return entry.metadata.adminEmail;
  if (entry.source === "report_generation") return "system";
  return entry.source;
}

function ledgerRelatedObject(entry: { idempotencyKey: string; relatedReportDocumentId: string | null; relatedReportRequestId: string | null; stripeCheckoutSessionId: string | null; stripeEventId: string | null }) {
  if (entry.relatedReportDocumentId) return `report ${entry.relatedReportDocumentId.slice(0, 8)}`;
  if (entry.relatedReportRequestId) return `request ${entry.relatedReportRequestId.slice(0, 8)}`;
  if (entry.stripeCheckoutSessionId) return `checkout ${entry.stripeCheckoutSessionId.slice(0, 14)}`;
  if (entry.stripeEventId) return `stripe ${entry.stripeEventId.slice(0, 14)}`;
  return entry.idempotencyKey.split(":").slice(0, 2).join(":");
}

function reportTypeLabel(reportType: string) {
  if (reportType === "identity") return ui.library.reportTypeIdentity;
  if (reportType === "deep") return ui.library.reportTypeDeep;
  if (reportType === "progressed") return ui.library.reportTypeProgressed;
  if (reportType === "synastry") return ui.library.reportTypeSynastry;
  return ui.library.reportTypeCore;
}

function defaultModelFor(profile: ReportModelProfile) {
  return reportModelProfileModels[profile][0] ?? "";
}

function feedbackActor(feedback: { userDisplayName: string | null; userEmail: string | null }) {
  return feedback.userDisplayName || feedback.userEmail || ui.admin.feedbackActorUnknown;
}

export default async function AdminPage({ searchParams }: { searchParams?: Promise<AdminSearchParams> }) {
  const { profile } = await getAstraAuthContext();
  if (!profile) redirect("/login?next=/admin");

  if (profile.role !== "admin") {
    return (
      <section className="adminPage" aria-labelledby="admin-access-title">
        <header className="adminHeader">
          <p className="eyebrow">{ui.admin.headerEyebrow}</p>
          <h1 id="admin-access-title">{ui.admin.accessDeniedTitle}</h1>
          <p>{ui.admin.accessDeniedBody}</p>
        </header>
      </section>
    );
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const creditSearch = firstSearchParam(resolvedSearchParams.creditSearch).trim();
  const requestedCreditUserId = firstSearchParam(resolvedSearchParams.creditUser).trim();
  const replayStatus = firstSearchParam(resolvedSearchParams.replayStatus).trim();
  const replayRequest = firstSearchParam(resolvedSearchParams.replayRequest).trim();
  const replayProfile = firstSearchParam(resolvedSearchParams.replayProfile).trim() || "production";
  const creditUsers = await listCreditUsers(db, { limit: 100, search: creditSearch });
  const selectedCreditUser =
    creditUsers.find((user) => user.userId === requestedCreditUserId) ??
    creditUsers.find((user) => user.userId === profile.userId) ??
    creditUsers[0] ??
    null;
  const [creditSummary, creditLedger, selectedReportRequests, selectedReportResults, betaFeedback] = await Promise.all([
    getCreditLedgerSummary(db, selectedCreditUser?.userId ?? null),
    listRecentCreditLedger(db, { userId: selectedCreditUser?.userId ?? null, limit: 100 }),
    selectedCreditUser
      ? db
          .select()
          .from(astrologyReportRequests)
          .where(eq(astrologyReportRequests.userId, selectedCreditUser.userId))
          .orderBy(desc(astrologyReportRequests.createdAt))
          .limit(20)
      : [],
    selectedCreditUser
      ? db
          .select({
            requestId: astrologyReportResults.requestId,
            status: astrologyReportResults.status,
            engine: astrologyReportResults.engine,
            error: astrologyReportResults.error
          })
          .from(astrologyReportResults)
          .where(eq(astrologyReportResults.userId, selectedCreditUser.userId))
      : [],
    listRecentBetaFeedback(db, { limit: 20 })
  ]);
  const reportResultByRequestId = new Map(selectedReportResults.map((result) => [result.requestId, result]));
  const defaultReplayRequestId = replayRequest || selectedReportRequests[0]?.id || "";
  const normalizedReplayProfile = reportModelProfileKeys.includes(replayProfile as ReportModelProfile)
    ? (replayProfile as ReportModelProfile)
    : "production";

  return (
    <section className="adminPage" aria-labelledby="admin-title">
      <header className="adminHeader">
        <p className="eyebrow">{ui.admin.headerEyebrow}</p>
        <h1 id="admin-title">{ui.admin.headerTitle}</h1>
        <p>{ui.admin.headerIntro}</p>
        <span className="pill">{ui.admin.signedInAs(profile.email, roleLabel(profile.role))}</span>
      </header>

      <section className="adminPanel" aria-labelledby="admin-ledger-heading">
        <div className="adminPanelHeader">
          <div>
            <h2 id="admin-ledger-heading">{ui.admin.ledger}</h2>
            <p>{ui.stars.introSignedIn}</p>
          </div>
          <form className="adminSearchForm" action="/admin">
            <label>
              <span>{ui.admin.searchLabel}</span>
              <input name="creditSearch" type="search" defaultValue={creditSearch} placeholder={ui.admin.searchPlaceholder} />
            </label>
            <button className="button secondary" type="submit">{ui.admin.search}</button>
          </form>
        </div>

        {selectedCreditUser ? (
          <div className="adminMetricGrid" aria-label={ui.admin.selectedUser}>
            <div>
              <span>{ui.admin.selectedUser}</span>
              <strong>{selectedCreditUser.email ?? selectedCreditUser.displayName}</strong>
              <p>{selectedCreditUser.userId}</p>
            </div>
            <div>
              <span>{ui.admin.balance}</span>
              <strong>{creditSummary.currentBalance}</strong>
              <p>{roleLabel(selectedCreditUser.role)}</p>
            </div>
            <div>
              <span>{ui.admin.granted}</span>
              <strong>{creditSummary.lifetimeCreditsGranted}</strong>
              <p>{formatAdminDate(creditSummary.lastCreditEventAt)}</p>
            </div>
            <div>
              <span>{ui.admin.purchased}</span>
              <strong>{creditSummary.lifetimeCreditsPurchased}</strong>
              <p>{ui.admin.spent}: {creditSummary.lifetimeCreditsSpent}</p>
            </div>
          </div>
        ) : null}

        <form className="adminCreditForm" action={adjustCreditsAction}>
          <input name="targetEmail" type="hidden" value={selectedCreditUser?.email ?? ""} />
          <label>
            <span>{ui.admin.adjustmentDirection}</span>
            <select name="direction" defaultValue="grant" required>
              <option value="grant">{ui.admin.grant}</option>
              <option value="revoke">{ui.admin.revoke}</option>
            </select>
          </label>
          <label>
            <span>{ui.admin.adjustmentAmount}</span>
            <input name="amount" type="number" min="1" step="1" placeholder="3" required />
          </label>
          <label>
            <span>{ui.admin.adjustmentReason}</span>
            <select name="reason" defaultValue="Beta tester grant" required>
              <option>Beta Explorer Pack</option>
              <option>Beta tester grant</option>
              <option>Manual correction</option>
              <option>Failed generation refund</option>
              <option>Courtesy Star</option>
              <option>Promo campaign</option>
              <option>Test transaction</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            <span>{ui.admin.adjustmentNotes}</span>
            <input name="notes" type="text" placeholder="Optional operator note" />
          </label>
          <button className="button" type="submit" disabled={!selectedCreditUser?.email}>{ui.admin.adjustmentSubmit}</button>
        </form>

        <p className="adminCount">{ui.admin.usersLoaded(creditUsers.length)}</p>
        <div className="adminTableShell">
          <div className="adminTable" role="table" aria-label={ui.admin.searchLabel}>
            <div className="adminRow adminRowHeader" role="row">
              <div role="columnheader">{ui.admin.selectedUser}</div>
              <div role="columnheader">{ui.admin.stars}</div>
              <div role="columnheader">{ui.admin.event}</div>
              <time role="columnheader">{ui.admin.joined}</time>
            </div>
            {creditUsers.map((user) => (
              <Link className={`adminRow adminRowData ${selectedCreditUser?.userId === user.userId ? "adminRowActive" : ""}`} href={creditUserHref(user.userId, creditSearch)} key={user.userId} role="row">
                <div role="cell">
                  <strong>{user.displayName}</strong>
                  <p>{user.email}</p>
                </div>
                <div role="cell">
                  <strong>{user.creditBalance}</strong>
                  <p>{roleLabel(user.role)}</p>
                </div>
                <div role="cell">
                  <strong>{user.chartCount} charts · {user.reportCount} reports</strong>
                  <p>{user.userId}</p>
                </div>
                <time role="cell">{formatAdminDate(user.createdAt)}</time>
              </Link>
            ))}
            {!creditUsers.length ? <p>{ui.admin.noUsers}</p> : null}
          </div>
        </div>

        <h3 className="adminSubheading">{ui.admin.ledgerTitle}</h3>
        <div className="adminTableShell">
          <div className="adminTable adminLedgerTable" role="table" aria-label={ui.admin.ledgerTitle}>
            <div className="adminRow adminRowHeader" role="row">
              <div role="columnheader">{ui.admin.event}</div>
              <div role="columnheader">{ui.admin.adjustmentAmount}</div>
              <div role="columnheader">{ui.admin.adjustmentReason}</div>
              <div role="columnheader">{ui.admin.ledgerActor}</div>
              <div role="columnheader">{ui.admin.ledgerRelated}</div>
              <time role="columnheader">{ui.admin.joined}</time>
            </div>
            {creditLedger.map((entry) => (
              <div className="adminRow adminRowData" key={entry.id} role="row">
                <div role="cell">
                  <strong>{entry.eventType}</strong>
                  <p>{entry.source}</p>
                </div>
                <div role="cell">
                  <strong>{formatCreditAmount(entry.amount)}</strong>
                  <p>{entry.userEmail ?? entry.userId}</p>
                </div>
                <div role="cell">
                  <strong>{ledgerReason(entry)}</strong>
                  <p>{entry.description ?? entry.idempotencyKey}</p>
                </div>
                <div role="cell">
                  <strong>{ledgerActor(entry)}</strong>
                  <p>{entry.userDisplayName ?? entry.userId}</p>
                </div>
                <div role="cell">
                  <strong>{ledgerRelatedObject(entry)}</strong>
                  <p>{entry.idempotencyKey}</p>
                </div>
                <time role="cell">{formatAdminDate(entry.createdAt)}</time>
              </div>
            ))}
            {!creditLedger.length ? <p>{ui.admin.noLedger}</p> : null}
          </div>
        </div>
      </section>

      <section className="adminPanel" aria-labelledby="admin-feedback-heading">
        <div className="adminPanelHeader">
          <div>
            <h2 id="admin-feedback-heading">{ui.admin.feedbackTitle}</h2>
            <p>{ui.admin.feedbackLoaded(betaFeedback.length)}</p>
          </div>
        </div>
        <div className="adminTableShell">
          <div className="adminTable adminCompactTable" role="table" aria-label={ui.admin.feedbackTitle}>
            <div className="adminRow adminRowHeader" role="row">
              <div role="columnheader">{ui.admin.feedbackMessage}</div>
              <div role="columnheader">{ui.admin.feedbackReport}</div>
              <time role="columnheader">{ui.admin.joined}</time>
            </div>
            {betaFeedback.map((feedback) => (
              <div className="adminRow adminRowData" key={feedback.id} role="row">
                <div role="cell">
                  <strong>{feedbackActor(feedback)}</strong>
                  <p>{feedback.rating ? `${feedback.rating}/5 · ` : ""}{feedback.category.replace(/_/g, " ")}</p>
                  <p className="adminFeedbackMessage">{feedback.message}</p>
                </div>
                <div role="cell">
                  {feedback.reportRequestId ? (
                    <Link href={`/library?reportId=${feedback.reportRequestId}`}>{feedback.reportRequestId.slice(0, 8)}</Link>
                  ) : (
                    <span>{ui.library.reportUnknownChartValue}</span>
                  )}
                  <p>{reportTypeLabel(feedback.reportType)}</p>
                </div>
                <time role="cell">{formatAdminDate(feedback.createdAt)}</time>
              </div>
            ))}
            {!betaFeedback.length ? <p>{ui.admin.feedbackEmpty}</p> : null}
          </div>
        </div>
      </section>

      <section className="adminOpsGrid" aria-label={ui.admin.bakeoffTitle}>
        <div className="adminPanel">
          <h2>{ui.admin.bakeoffTitle}</h2>
          <p>{ui.admin.bakeoffBody}</p>
          {replayStatus ? (
            <p className="form-status" role="status">
              {ui.admin.replayResult(replayStatus, replayRequest || "unknown request", replayProfile || "default profile")}
            </p>
          ) : null}
          <form className="adminCreditForm adminReplayForm" action={replayReportAction}>
            <label>
              <span>{ui.admin.reportId}</span>
              <input name="requestId" defaultValue={defaultReplayRequestId} required />
            </label>
            <label>
              <span>{ui.admin.reportWriter}</span>
              <select name="reportWriter" defaultValue={DEBUG_MODEL_REPORT_WRITER}>
                <option value={LOCAL_DETERMINISTIC_REPORT_WRITER}>{ui.admin.reportWriters.deterministic}</option>
                <option value={DEBUG_MODEL_REPORT_WRITER}>{ui.admin.reportWriters.debug}</option>
              </select>
            </label>
            <label>
              <span>{ui.admin.modelProfile}</span>
              <select name="modelProfile" defaultValue={normalizedReplayProfile}>
                {replayProfileOptions.map((profileKey) => (
                  <option key={profileKey} value={profileKey}>
                    {ui.admin.modelProfiles[profileKey]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{ui.admin.modelProvider}</span>
              <select name="modelProvider" defaultValue="openrouter">
                <option value="openrouter">openrouter</option>
                <option value="openai">openai</option>
              </select>
            </label>
            <label>
              <span>{ui.admin.model}</span>
              <input name="model" defaultValue={defaultModelFor(normalizedReplayProfile)} />
            </label>
            <button className="button" type="submit">{ui.admin.runReplay}</button>
          </form>
          <dl className="adminCommandList">
            <div>
              <dt>{ui.admin.bakeoffCommand}</dt>
              <dd><code>npm run report:bakeoff -- --profiles debug,production</code></dd>
            </div>
            <div>
              <dt>{ui.admin.bakeoffCommandPreview}</dt>
              <dd><code>{`ASTRA_REPORT_BAKEOFF_PROFILES=debug,production npm run report:bakeoff`}</code></dd>
            </div>
            <div>
              <dt>{ui.admin.bakeoffReplay}</dt>
              <dd><code>/api/admin/replay-report</code></dd>
            </div>
          </dl>
        </div>
        <div className="adminPanel">
          <h2>{ui.admin.roleTitle}</h2>
          <form className="adminCreditForm adminRoleForm" action={updateUserRoleAction}>
            <label>
              <span>{ui.admin.targetEmail}</span>
              <input name="targetEmail" type="email" defaultValue={selectedCreditUser?.email ?? ""} required />
            </label>
            <label>
              <span>{ui.admin.role}</span>
              <select name="role" defaultValue={selectedCreditUser?.role === "admin" ? "admin" : "customer"}>
                <option value="admin">{ui.admin.adminRole}</option>
                <option value="customer">{ui.admin.customerRole}</option>
              </select>
            </label>
            <button className="button secondary" type="submit">{ui.admin.roleSubmit}</button>
          </form>
        </div>
      </section>

      <section className="adminPanel" aria-labelledby="admin-reports-heading">
        <h2 id="admin-reports-heading">{ui.admin.recentReports}</h2>
        <div className="adminTableShell">
          <div className="adminTable adminReportTable" role="table" aria-label={ui.admin.recentReports}>
            <div className="adminRow adminRowHeader" role="row">
              <div role="columnheader">{ui.admin.reportId}</div>
              <div role="columnheader">{ui.admin.event}</div>
              <div role="columnheader">{ui.admin.adjustmentAmount}</div>
              <div role="columnheader">{ui.admin.reportResult}</div>
              <time role="columnheader">{ui.admin.joined}</time>
              <div role="columnheader">{ui.admin.bakeoffReplay}</div>
            </div>
            {selectedReportRequests.map((request) => {
              const result = reportResultByRequestId.get(request.id);
              return (
                <div className="adminRow adminRowData" key={request.id} role="row">
                  <div role="cell">
                    <strong>{request.id.slice(0, 8)}</strong>
                    <p>{request.subjectName}</p>
                    {result?.status === "completed" ? <Link href={`/library?reportId=${request.id}`}>{ui.admin.reportOpenLibrary}</Link> : null}
                  </div>
                  <div role="cell">
                    <strong>{reportTypeLabel(request.reportType)}</strong>
                    <p>{request.status}</p>
                  </div>
                  <div role="cell">
                    <strong>{request.costCredits}</strong>
                    <p>{request.source}</p>
                  </div>
                  <div role="cell">
                    <strong>{result?.status ?? ui.library.reportUnknownChartValue}</strong>
                    <p>{result?.error ?? result?.engine ?? ui.library.reportUnknownChartValue}</p>
                  </div>
                  <time role="cell">{formatAdminDate(request.createdAt)}</time>
                  <div role="cell">
                    <form action={replayReportAction}>
                      <input name="requestId" type="hidden" value={request.id} />
                      <input name="reportWriter" type="hidden" value={DEBUG_MODEL_REPORT_WRITER} />
                      <input name="modelProfile" type="hidden" value="debug" />
                      <input name="modelProvider" type="hidden" value="openrouter" />
                      <input name="model" type="hidden" value={defaultModelFor("debug")} />
                      <button className="button secondary" type="submit">{ui.admin.runReplay}</button>
                    </form>
                  </div>
                </div>
              );
            })}
            {!selectedReportRequests.length ? <p>{ui.admin.noReports}</p> : null}
          </div>
        </div>
      </section>
    </section>
  );
}
