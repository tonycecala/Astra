import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  LOCAL_DETERMINISTIC_REPORT_WRITER,
  buildAstrologyReportResult
} from "@astra/astrology";
import { astrologyReportRequestSchema } from "@astra/contracts";
import { appUserProfiles, creditLedgerEntries, db, getCreditBalance, listRecentBetaFeedback, mirrorCreditBalanceToProfile } from "@astra/db";
import { eq } from "drizzle-orm";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
const configuredWriter = clean(process.env[ASTRA_REPORT_WRITER_ENV]) || LOCAL_DETERMINISTIC_REPORT_WRITER;
const email = clean(process.env.ASTRA_REPORT_SMOKE_EMAIL) || `report-smoke-${Date.now()}@example.com`;
const name = clean(process.env.ASTRA_REPORT_SMOKE_NAME) || "Tony C";

let cookieHeader = "";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

if (!internalToken) {
  throw new Error("ASTRA_INTERNAL_API_TOKEN is required for the report API smoke.");
}

function appendCookies(headers: Headers) {
  const raw = headers.get("set-cookie");
  if (!raw) return;

  const cookies = raw
    .split(/,(?=[^;,]+=)/)
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean);

  const existing = new Map(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, rest.join("=")] as const;
      })
  );

  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key) existing.set(key, rest.join("="));
  }

  cookieHeader = [...existing.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function requestJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("origin", appBaseUrl);
  if (cookieHeader) headers.set("cookie", cookieHeader);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, { ...init, headers });
  appendCookies(response.headers);

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}: ${text}`);
  }

  return text ? (JSON.parse(text) as JsonObject) : {};
}

async function expectStatus(url: string, expectedStatus: number, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, { ...init, headers });
  if (response.status !== expectedStatus) {
    throw new Error(`${url} expected ${expectedStatus} but returned ${response.status}: ${await response.text()}`);
  }
}

async function expectAuthedStatus(url: string, expectedStatus: number, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("origin", appBaseUrl);
  if (cookieHeader) headers.set("cookie", cookieHeader);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, { ...init, headers });
  if (response.status !== expectedStatus) {
    throw new Error(`${url} expected ${expectedStatus} but returned ${response.status}: ${await response.text()}`);
  }
}

function findOtp(value: unknown): string | null {
  if (typeof value === "string") return value.match(/\b\d{6}\b/)?.[0] ?? null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const otp = findOtp(item);
      if (otp) return otp;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as JsonObject)) {
      const otp = findOtp(item);
      if (otp) return otp;
    }
  }
  return null;
}

async function readOtpFromMailpit() {
  const searchUrl = new URL("/api/v1/search", mailpitUrl);
  searchUrl.searchParams.set("query", email);
  searchUrl.searchParams.set("limit", "10");

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`Mailpit search failed with ${searchResponse.status}. Is Mailpit running at ${mailpitUrl}?`);
  }

  const search = (await searchResponse.json()) as JsonObject;
  const messages = Array.isArray(search.messages)
    ? search.messages
    : Array.isArray(search.Messages)
      ? search.Messages
      : [];

  for (const summary of messages as JsonObject[]) {
    const id = String(summary.ID ?? summary.Id ?? summary.id ?? "");
    if (!id) continue;

    const messageResponse = await fetch(new URL(`/api/v1/message/${id}`, mailpitUrl));
    if (!messageResponse.ok) continue;
    const message = (await messageResponse.json()) as JsonObject;
    const otp = findOtp(message);
    if (otp) return otp;
  }

  throw new Error(`No OTP found in Mailpit for ${email}.`);
}

await expectStatus(`${appBaseUrl}/api/reports`, 401);

await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
  method: "POST",
  body: JSON.stringify({ email, type: "sign-in" })
});

await requestJson(`${authBaseUrl}/sign-in/email-otp`, {
  method: "POST",
  body: JSON.stringify({ email, otp: await readOtpFromMailpit(), name })
});
await requestJson(`${appBaseUrl}/api/reports`);
const [smokeProfile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
if (!smokeProfile) throw new Error(`Smoke profile was not created for ${email}.`);
await db.update(appUserProfiles).set({ role: "customer", updatedAt: new Date() }).where(eq(appUserProfiles.userId, smokeProfile.userId));
await db
  .insert(creditLedgerEntries)
  .values({
    userId: smokeProfile.userId,
    amount: 11,
    eventType: "admin_adjustment",
    source: "report_api_smoke",
    description: "Report API smoke Stars grant",
    idempotencyKey: `report_api_smoke_grant:${smokeProfile.userId}`,
    metadata: { actor: "script" }
  })
  .onConflictDoNothing();
await mirrorCreditBalanceToProfile(db, smokeProfile.userId);
const startingBalance = await getCreditBalance(db, smokeProfile.userId);
if (startingBalance < 11) throw new Error(`Expected at least 11 ledger Stars for report smoke, found ${startingBalance}.`);

const primaryChart = await requestJson(`${appBaseUrl}/api/chart-requests`, {
  method: "POST",
  body: JSON.stringify({
    subjectName: name,
    birthData: {
      date: "1961-05-23",
      time: "09:30",
      timezone: "America/New_York",
      birthTimeKnown: true,
      location: "New York, NY, USA",
      latitude: 40.7128,
      longitude: -74.006
    },
    context: {
      subject: { subjectType: "self", displayName: name },
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    },
    source: "self"
  })
});
const primaryChartId = String((primaryChart.request as JsonObject | undefined)?.id ?? "");
if (!primaryChartId) throw new Error("Report API smoke did not create the primary chart.");

const noPlaceChart = await requestJson(`${appBaseUrl}/api/chart-requests`, {
  method: "POST",
  body: JSON.stringify({
    subjectName: "No Place",
    birthData: {
      date: "1961-05-23",
      time: "09:30",
      timezone: "America/New_York",
      birthTimeKnown: true
    },
    context: {
      subject: { subjectType: "self", displayName: "No Place" },
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    },
    source: "self"
  })
});
const noPlaceChartId = String((noPlaceChart.request as JsonObject | undefined)?.id ?? "");
if (!noPlaceChartId) throw new Error("Report API smoke did not create the location-independent chart.");

const publicChart = await requestJson(`${appBaseUrl}/api/chart-requests`, {
  method: "POST",
  body: JSON.stringify({
    subjectName: "Albert Einstein",
    birthData: {
      date: "1879-03-14",
      time: "11:30",
      timezone: "Europe/Berlin",
      birthTimeKnown: true,
      location: "Ulm, Germany",
      latitude: 48.4011,
      longitude: 9.9876
    },
    context: {
      subject: { subjectType: "self", displayName: "Albert Einstein" },
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    },
    source: "import"
  })
});
const publicChartId = String((publicChart.request as JsonObject | undefined)?.id ?? "");
if (!publicChartId) throw new Error("Report API smoke did not create the public sample chart.");

await expectAuthedStatus(`${appBaseUrl}/api/reports`, 400, {
  method: "POST",
  body: JSON.stringify({
    reportType: "identity",
    chartRequestId: primaryChartId
  })
});
await expectAuthedStatus(`${appBaseUrl}/api/reports`, 400, {
  method: "POST",
  body: JSON.stringify({
    chartRequestId: "not-owned-chart",
    reportType: "identity",
    reportBasis: {
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    }
  })
});
await expectAuthedStatus(`${appBaseUrl}/api/reports`, 400, {
  method: "POST",
  body: JSON.stringify({
    chartRequestId: primaryChartId,
    reportType: "identity",
    reportBasis: {
      type: "progressed",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      asOfDate: "2026-07-15"
    }
  })
});

const introductoryBalance = await getCreditBalance(db, smokeProfile.userId);
const introductoryDeep = await requestJson(`${appBaseUrl}/api/reports`, {
  method: "POST",
  body: JSON.stringify({
    chartRequestId: primaryChartId,
    reportType: "identity",
    kimiIntro: true,
    reportBasis: {
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    }
  })
});
const introductoryRequest = astrologyReportRequestSchema.parse(introductoryDeep.request);
if (introductoryRequest.costCredits !== 0) {
  throw new Error("The free introductory Identity Report must have a zero-Star cost.");
}
if (introductoryRequest.context?.modelPilot !== "kimi-intro-identity") {
  throw new Error("The free introductory Identity Report must route through the model pilot.");
}
if (await getCreditBalance(db, smokeProfile.userId) !== introductoryBalance) {
  throw new Error("The free introductory Identity Report must not debit Stars.");
}
await expectAuthedStatus(`${appBaseUrl}/api/reports`, 400, {
  method: "POST",
  body: JSON.stringify({
    chartRequestId: primaryChartId,
    reportType: "core",
    kimiIntro: true,
    reportBasis: {
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    }
  })
});

const created = await requestJson(`${appBaseUrl}/api/reports`, {
  method: "POST",
  body: JSON.stringify({
    chartRequestId: primaryChartId,
    reportType: "core",
    reportBasis: {
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    },
    question: "What report shape should Astra preserve for the stream?",
    intent: "tony-report-api-smoke"
  })
});

const publicCreated = await requestJson(`${appBaseUrl}/api/reports`, {
  method: "POST",
  body: JSON.stringify({
    chartRequestId: publicChartId,
    reportType: "core",
    reportBasis: {
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    },
    question: "What should this public sample preserve?",
    intent: "public-sample-report-api-smoke"
  })
});

const noPlaceCreated = await requestJson(`${appBaseUrl}/api/reports`, {
  method: "POST",
  body: JSON.stringify({
    chartRequestId: noPlaceChartId,
    reportType: "identity",
    reportBasis: {
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    }
  })
});

const requestId = (created.request as JsonObject | undefined)?.id;
if (!requestId) throw new Error("Report API did not return a request id.");
const publicRequestId = (publicCreated.request as JsonObject | undefined)?.id;
if (!publicRequestId) throw new Error("Report API did not return a public sample request id.");
const endingBalance = await getCreditBalance(db, smokeProfile.userId);
if (endingBalance !== startingBalance - 11) {
  throw new Error(`Report creation did not debit two Core reports and one Identity report: started ${startingBalance}, ended ${endingBalance}.`);
}
if (endingBalance > 0) {
  await db.insert(creditLedgerEntries).values({
    userId: smokeProfile.userId,
    amount: -endingBalance,
    eventType: "admin_adjustment",
    source: "report_api_smoke",
    description: "Drain isolated smoke balance for insufficient-Stars coverage",
    idempotencyKey: `report_api_smoke_drain:${smokeProfile.userId}`,
    metadata: { actor: "script" }
  });
  await mirrorCreditBalanceToProfile(db, smokeProfile.userId);
}
const requestsBeforeInsufficient = await requestJson(`${appBaseUrl}/api/reports`);
const requestCountBeforeInsufficient = Array.isArray(requestsBeforeInsufficient.requests) ? requestsBeforeInsufficient.requests.length : 0;
await expectAuthedStatus(`${appBaseUrl}/api/reports`, 402, {
  method: "POST",
  body: JSON.stringify({
    chartRequestId: primaryChartId,
    reportType: "identity",
    reportBasis: {
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    }
  })
});
const requestsAfterInsufficient = await requestJson(`${appBaseUrl}/api/reports`);
const requestCountAfterInsufficient = Array.isArray(requestsAfterInsufficient.requests) ? requestsAfterInsufficient.requests.length : 0;
if (requestCountAfterInsufficient !== requestCountBeforeInsufficient) {
  throw new Error("An insufficient-Stars purchase must not create a report request.");
}
const reportRequest = astrologyReportRequestSchema.parse(created.request);
if (!reportRequest.reportBasis) throw new Error("Report API did not persist the report basis snapshot.");
if (reportRequest.reportBasis.schemaVersion !== 2 || reportRequest.reportBasis.primary.calculationMode !== "full") {
  throw new Error("Report API must persist server-derived version 2 full-chart provenance.");
}
const noPlaceReportRequest = astrologyReportRequestSchema.parse(noPlaceCreated.request);
if (noPlaceReportRequest.reportBasis?.schemaVersion !== 2 || noPlaceReportRequest.reportBasis.primary.calculationMode !== "signs-aspects-only") {
  throw new Error("Report API must persist server-derived signs-and-aspects-only provenance when place is unresolved.");
}
const previousEngine = process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
const previousWriter = process.env[ASTRA_REPORT_WRITER_ENV];
process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = LOCAL_CHART_ROUTINE_ENGINE;
process.env[ASTRA_REPORT_WRITER_ENV] = LOCAL_DETERMINISTIC_REPORT_WRITER;
const alternateChartSettingsPayload = buildAstrologyReportResult({
  ...reportRequest,
  id: `${reportRequest.id}:sidereal-placidus`,
  reportBasis: {
    ...reportRequest.reportBasis,
    chartSettings: {
      zodiacMode: "sidereal",
      houseSystem: "placidus"
    }
  }
});
if (!String(alternateChartSettingsPayload.publicSignal?.provenanceSummary).includes("sidereal, placidus")) {
  throw new Error("Report engine did not preserve sidereal + placidus chart settings.");
}
if (previousEngine === undefined) {
  delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
} else {
  process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = previousEngine;
}
if (previousWriter === undefined) {
  delete process.env[ASTRA_REPORT_WRITER_ENV];
} else {
  process.env[ASTRA_REPORT_WRITER_ENV] = previousWriter;
}

const listed = await requestJson(`${appBaseUrl}/api/reports`);
const requests = Array.isArray(listed.requests) ? listed.requests : [];
if (!requests.some((request) => (request as JsonObject).id === requestId)) {
  throw new Error("Report API did not list the created request for the authenticated user.");
}

const generated = await requestJson(`${appBaseUrl}/api/reports/${requestId}/generate`, {
  method: "POST"
});
if ((generated.result as JsonObject | undefined)?.status !== "completed") {
  throw new Error("User report generation route did not record a completed result.");
}
if (!((generated.result as JsonObject).publicSignal as JsonObject | undefined)?.headline) {
  throw new Error("User report generation route did not return a public signal.");
}
if (((generated.result as JsonObject).publicSignal as JsonObject).headline !== "Tony C — Core Report") {
  throw new Error(
    `User report generation route returned the wrong Tony report headline: ${((generated.result as JsonObject).publicSignal as JsonObject).headline}`
  );
}
if (!String(((generated.result as JsonObject).publicSignal as JsonObject).provenanceSummary).includes("tropical, whole-sign")) {
  throw new Error("User report generation route did not preserve tropical + whole-sign provenance.");
}
if (!String(((generated.result as JsonObject).publicSignal as JsonObject).provenanceSummary).includes(LOCAL_DETERMINISTIC_REPORT_WRITER)) {
  throw new Error("User report generation route did not preserve deterministic writer provenance.");
}
const generatedSections = Array.isArray((generated.result as JsonObject).sections) ? ((generated.result as JsonObject).sections as JsonObject[]) : [];
if (generatedSections.some((section) => /local-deterministic-writer|external model call|intent marker/i.test(String(section.body)))) {
  throw new Error("User report generation route exposed writer or generation internals in customer prose.");
}
if (configuredWriter === DEBUG_MODEL_REPORT_WRITER && !String(((generated.result as JsonObject).publicSignal as JsonObject).provenanceSummary).includes(DEBUG_MODEL_REPORT_WRITER)) {
  throw new Error("User report generation route did not preserve debug model writer provenance.");
}
if ((generated.request as JsonObject | undefined)?.status !== "completed") {
  throw new Error("User report generation route did not return the completed report request.");
}

await expectStatus(`${appBaseUrl}/api/beta-feedback`, 401, {
  method: "POST",
  body: JSON.stringify({
    category: "report_quality",
    message: "Anonymous feedback should not be accepted.",
    rating: 5,
    reportId: requestId
  })
});
const feedbackCreated = await requestJson(`${appBaseUrl}/api/beta-feedback`, {
  method: "POST",
  body: JSON.stringify({
    category: "report_quality",
    message: "Report API smoke feedback landed with this portrait.",
    rating: 5,
    reportId: requestId
  })
});
if (!feedbackCreated.feedbackId) {
  throw new Error(`Feedback API did not return a feedback id: ${JSON.stringify(feedbackCreated)}`);
}
const latestFeedback = await listRecentBetaFeedback(db, { limit: 5 });
if (!latestFeedback.some((feedback) => feedback.id === feedbackCreated.feedbackId && feedback.reportRequestId === requestId)) {
  throw new Error("Admin feedback list did not include the newly submitted report feedback.");
}

await expectStatus(`${appBaseUrl}/api/reports/${requestId}/share`, 401, {
  method: "POST"
});
const createdShare = await requestJson(`${appBaseUrl}/api/reports/${requestId}/share`, {
  method: "POST"
});
const shareUrl = String(((createdShare.share as JsonObject | undefined)?.shareUrl ?? ""));
if (!shareUrl.includes("/reports/share/")) {
  throw new Error(`Report share route returned an invalid share URL: ${shareUrl || "missing"}`);
}
const sharedReportResponse = await fetch(shareUrl);
if (!sharedReportResponse.ok) {
  throw new Error(`Shared report page failed with ${sharedReportResponse.status}: ${await sharedReportResponse.text()}`);
}
const sharedReportHtml = await sharedReportResponse.text();
if (!sharedReportHtml.includes("Shared Astra Report") || !sharedReportHtml.includes("Tony C — Core Report")) {
  throw new Error("Shared report page did not render the shared report shell.");
}
await requestJson(`${appBaseUrl}/api/reports/${requestId}/share`, {
  method: "DELETE"
});
const revokedShareResponse = await fetch(shareUrl);
if (!revokedShareResponse.ok) {
  throw new Error(`Revoked shared report page should render unavailable state, got ${revokedShareResponse.status}.`);
}
const revokedShareHtml = await revokedShareResponse.text();
if (!revokedShareHtml.includes("Shared report unavailable")) {
  throw new Error("Revoked shared report page did not render the unavailable state.");
}

const publicGenerated = await requestJson(`${appBaseUrl}/api/reports/${publicRequestId}/generate`, {
  method: "POST"
});
if ((publicGenerated.result as JsonObject | undefined)?.status !== "completed") {
  throw new Error(`Einstein public generation did not complete: ${JSON.stringify(publicGenerated.result ?? publicGenerated)}`);
}
if (((publicGenerated.result as JsonObject).publicSignal as JsonObject | undefined)?.headline !== "Albert Einstein — Core Report") {
  throw new Error(
    `User report generation route returned the wrong Einstein public headline: ${((publicGenerated.result as JsonObject).publicSignal as JsonObject | undefined)?.headline ?? "missing"}`
  );
}

const publishedSignal = await requestJson(`${appBaseUrl}/api/reports/${requestId}/publish-signal`, {
  method: "POST"
});
if ((publishedSignal.artifact as JsonObject | undefined)?.id !== `report_signal:${requestId}`) {
  throw new Error("User report signal publish route did not return the expected stream artifact.");
}
if ((publishedSignal.feedItem as JsonObject | undefined)?.feedKind !== "report_signal") {
  throw new Error("User report signal publish route must create a private report-signal feed item.");
}
if ((publishedSignal.feedItem as JsonObject | undefined)?.userId !== reportRequest.userId) {
  throw new Error("User report signal publish route returned a feed item for the wrong user.");
}

delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
process.env[ASTRA_REPORT_WRITER_ENV] = LOCAL_DETERMINISTIC_REPORT_WRITER;
const recordPayload = buildAstrologyReportResult(reportRequest);

await expectStatus(`${appBaseUrl}/api/report-results`, 401, {
  method: "POST",
  body: JSON.stringify(recordPayload)
});
await expectStatus(`${appBaseUrl}/api/report-results`, 401, {
  method: "POST",
  headers: {
    "x-astra-internal-token": "wrong-token"
  },
  body: JSON.stringify(recordPayload)
});

process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = LOCAL_CHART_ROUTINE_ENGINE;
process.env[ASTRA_REPORT_WRITER_ENV] = LOCAL_DETERMINISTIC_REPORT_WRITER;
const completedRecordPayload = buildAstrologyReportResult(reportRequest);
const result = await requestJson(`${appBaseUrl}/api/report-results`, {
  method: "POST",
  headers: {
    "x-astra-internal-token": internalToken
  },
  body: JSON.stringify(completedRecordPayload)
});

if (!(result.result as JsonObject | undefined)?.id) {
  throw new Error("Report result API did not return a result id.");
}
if ((result.result as JsonObject).status !== "completed") {
  throw new Error(`Report result smoke expected configured engine completion, got ${(result.result as JsonObject).status}.`);
}
if ((result.result as JsonObject).engine !== LOCAL_CHART_ROUTINE_ENGINE) {
  throw new Error(`Report result smoke expected ${LOCAL_CHART_ROUTINE_ENGINE}, got ${(result.result as JsonObject).engine}.`);
}
if (!((result.result as JsonObject).publicSignal as JsonObject | undefined)?.headline) {
  throw new Error("Report result API did not preserve the public report signal.");
}
if (((result.result as JsonObject).publicSignal as JsonObject).headline !== "Tony C — Core Report") {
  throw new Error(
    `Report result API preserved the wrong Tony report headline: ${((result.result as JsonObject).publicSignal as JsonObject).headline}`
  );
}

if (previousEngine === undefined) {
  delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
} else {
  process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = previousEngine;
}
if (previousWriter === undefined) {
  delete process.env[ASTRA_REPORT_WRITER_ENV];
} else {
  process.env[ASTRA_REPORT_WRITER_ENV] = previousWriter;
}

console.log(`Report API smoke passed for ${email}: ${requestId}.`);
process.exit(0);
