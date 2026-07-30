import Link from "next/link";
import { Search } from "lucide-react";

import type { Artifact } from "@astra/contracts";
import { PageHeader } from "../../components/PageHeader";
import { ReportReader, formatReportDate, reportSubjectContext } from "../../components/ReportReader";
import { astrologyReportShares, db, getUserAstrologyReportResult, getUserAstrologyReportRequest, listUserArtifacts, listUserAstrologyReportRequests, listUserAstrologyReportResults, listUserChartMakerRequests } from "@astra/db";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";
import {
  reportCardMetadata,
  reportDisplayName,
  reportDisplayTitle,
  reportFamilyLabel,
  isWelcomeReport,
  resolveLegacySynastryPartnerBirthDate
} from "../../lib/report-display";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type LibraryArtifact = Artifact & {
  cardMetadata?: string;
  requestId?: string;
  reportType?: string;
  isWelcome?: boolean;
  subjectName?: string;
  subjectType?: "self" | "ally";
  status?: string;
  isShared?: boolean;
};

type LibraryReportFilter = "all" | "identity" | "core" | "deep" | "progressed" | "synastry" | "shared";

type LibraryPageParams = {
  searchParams: Promise<{
    filter?: string;
    q?: string;
    reportId?: string;
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageParams) {
  const { filter, q, reportId } = await searchParams;
  const normalizedReportId = normalizeReportId(reportId);
  const activeFilter = normalizeReportFilter(filter);
  const query = normalizeQuery(q);

  const { profile } = await getAstraAuthContext();
  if (!profile) {
    return (
      <>
        <PageHeader eyebrow={ui.library.eyebrow} title={ui.library.title}>
          {ui.library.intro}
        </PageHeader>
        <section className="auth-gate-grid" aria-label={ui.library.listLabel}>
          <article className="card auth-gate-card">
            <div className="eyebrow">{ui.login.codeFlowEyebrow}</div>
            <h2>{ui.login.title}</h2>
            <p>{ui.login.intro}</p>
            <Link className="button" href="/login?next=/library">
              {ui.self.signInCta}
            </Link>
          </article>
        </section>
      </>
    );
  }

  const view = { artifacts: await getUserLibraryArtifacts(profile.userId) };
  const filteredArtifacts = filterLibraryArtifacts(view.artifacts as LibraryArtifact[], activeFilter, query);
  const filterCounts = reportFilterCounts(view.artifacts as LibraryArtifact[]);
  const selectedReport =
    normalizedReportId
      ? await getUserAstrologyReportResult(db, {
          requestId: normalizedReportId,
          userId: profile.userId
        })
      : null;
  const selectedRequest =
    normalizedReportId
      ? await getUserAstrologyReportRequest(db, {
          requestId: normalizedReportId,
          userId: profile.userId
        })
      : null;
  const shouldShowList = !normalizedReportId;

  return (
    <>
      <PageHeader eyebrow={ui.library.eyebrow} title={ui.library.title}>
        {ui.library.intro}
      </PageHeader>
      {shouldShowList ? (
        <>
          <LibraryControls activeFilter={activeFilter} filterCounts={filterCounts} query={query} />
          <section className="list" aria-label={ui.library.listLabel}>
          {filteredArtifacts.map((artifact) => (
            <ArtifactCard artifact={artifact} key={artifact.id} />
          ))}
          {!filteredArtifacts.length ? <EmptyLibraryCard /> : null}
          </section>
        </>
      ) : null}
      {selectedReport ? (
        <ReportReader report={selectedReport} request={selectedRequest} backHref={libraryHref(activeFilter, query)} actions debug={profile?.role === "admin"} />
      ) : normalizedReportId ? <SelectedReportMissingCard /> : null}
    </>
  );
}

const reportFilters: Array<{ label: string; value: LibraryReportFilter }> = [
  { value: "all", label: ui.library.filterAll },
  { value: "identity", label: ui.library.filterIdentity },
  { value: "core", label: ui.library.filterCore },
  { value: "deep", label: ui.library.filterDeep },
  { value: "progressed", label: ui.library.filterProgressed },
  { value: "synastry", label: ui.library.filterSynastry },
  { value: "shared", label: ui.library.filterShared }
];

function LibraryControls({
  activeFilter,
  filterCounts,
  query
}: {
  activeFilter: LibraryReportFilter;
  filterCounts: Record<LibraryReportFilter, number>;
  query: string;
}) {
  const clearHref = "/library";
  return (
    <section aria-label={ui.library.filtersLabel}>
      <form className="list-filter-bar library-list-filter-bar" action="/library">
        <div className="list-filter-control list-filter-search-control">
          <span className="list-filter-search">
            <Search aria-hidden="true" size={15} />
            <input aria-label={ui.library.searchLabel} name="q" type="search" defaultValue={query} placeholder={ui.library.searchPlaceholder} />
          </span>
        </div>
        <div className="list-filter-control">
          <span className="list-filter-select">
            <select aria-label={ui.library.filtersLabel} defaultValue={activeFilter} name="filter">
              {reportFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label} ({filterCounts[filter.value]})
                </option>
              ))}
            </select>
          </span>
        </div>
        <button className="button secondary" type="submit">{ui.library.searchSubmit}</button>
        {query || activeFilter !== "all" ? (
          <Link className="button secondary" href={clearHref}>
            {ui.allies.filterClear}
          </Link>
        ) : null}
      </form>
    </section>
  );
}

function ArtifactCard({ artifact }: { artifact: LibraryArtifact }) {
  if (artifact.kind === "report" && artifact.requestId) {
    return (
      <Link
        className="card card-link library-report-card"
        href={`/library?reportId=${encodeURIComponent(artifact.requestId)}`}
        aria-label={`${ui.library.openReportAction}: ${artifact.title}`}
      >
        <div className="library-report-title-row">
          <h2>{reportCardName(artifact)}</h2>
          <span className="library-report-type-pill">{reportCardType(artifact)}</span>
        </div>
        <p className="library-report-subject">{artifact.cardMetadata ?? `${ui.library.reportCardDateLabel} ${formatReportDate(artifact.createdAt)}`}</p>
      </Link>
    );
  }

  return (
    <article className="card">
      <div className="eyebrow">{artifact.kind}</div>
      <h2>{artifact.title}</h2>
      <p>{artifact.summary}</p>
    </article>
  );
}

function SelectedReportMissingCard() {
  return (
    <section className="card" aria-label={ui.library.selectedReportLabel}>
      <p>
        <a href="/library">{ui.library.selectedReportBack}</a>
      </p>
      <p>{ui.library.selectedReportMissing}</p>
      <p>{ui.library.selectedReportMissingId}</p>
    </section>
  );
}

function EmptyLibraryCard() {
  return (
    <article className="card">
      <div className="eyebrow">{ui.library.emptyEyebrow}</div>
      <h2>{ui.library.emptyTitle}</h2>
      <p>{ui.library.emptyBody}</p>
    </article>
  );
}

function normalizeReportId(reportId?: string) {
  if (!reportId) return null;
  const trimmed = reportId.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("report:") ? trimmed.slice("report:".length) : trimmed;
}

function normalizeReportFilter(filter?: string): LibraryReportFilter {
  if (filter === "identity" || filter === "core" || filter === "deep" || filter === "progressed" || filter === "synastry" || filter === "shared") return filter;
  return "all";
}

function normalizeQuery(query?: string) {
  return query?.trim().slice(0, 80) ?? "";
}

function canonicalReportType(reportType?: string) {
  if (reportType === "core_self") return "core";
  if (reportType === "identity" || reportType === "core" || reportType === "deep" || reportType === "progressed" || reportType === "synastry") return reportType;
  return "core";
}

function reportCardName(artifact: LibraryArtifact) {
  return artifact.subjectName?.trim() || artifact.title.split(/\s+[—-]\s+/)[0]?.trim() || artifact.title;
}

function reportCardType(artifact: LibraryArtifact) {
  return artifact.isWelcome ? ui.library.reportTypeWelcome : reportFamilyLabel(artifact.reportType);
}

function artifactMatchesFilter(artifact: LibraryArtifact, filter: LibraryReportFilter) {
  if (filter === "all") return true;
  if (filter === "shared") return artifact.kind === "report" && Boolean(artifact.isShared);
  return artifact.kind === "report" && canonicalReportType(artifact.reportType) === filter;
}

function artifactMatchesQuery(artifact: LibraryArtifact, query: string) {
  if (!query) return true;
  const haystack = [artifact.title, artifact.summary, artifact.subjectName, artifact.reportType, artifact.status].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function filterLibraryArtifacts(artifacts: LibraryArtifact[], filter: LibraryReportFilter, query: string) {
  return artifacts.filter((artifact) => artifactMatchesFilter(artifact, filter) && artifactMatchesQuery(artifact, query));
}

function reportFilterCounts(artifacts: LibraryArtifact[]): Record<LibraryReportFilter, number> {
  return reportFilters.reduce(
    (counts, filter) => ({
      ...counts,
      [filter.value]: artifacts.filter((artifact) => artifactMatchesFilter(artifact, filter.value)).length
    }),
    {} as Record<LibraryReportFilter, number>
  );
}

function libraryHref(filter: LibraryReportFilter = "all", query = "") {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (query) params.set("q", query);
  const suffix = params.toString();
  return suffix ? `/library?${suffix}` : "/library";
}

function reportRequestIdFromArtifactId(id: string) {
  if (!id.startsWith("report:")) return undefined;
  const requestId = id.slice("report:".length);
  return requestId ? requestId : undefined;
}

async function getUserLibraryArtifacts(userId: string) {
  const [artifacts, chartRequests, reportRequests, reportResults, reportShares] = await Promise.all([
    listUserArtifacts(db, userId),
    listUserChartMakerRequests(db, userId),
    listUserAstrologyReportRequests(db, userId),
    listUserAstrologyReportResults(db, userId),
    db
      .select({ requestId: astrologyReportShares.requestId })
      .from(astrologyReportShares)
      .where(and(eq(astrologyReportShares.userId, userId), eq(astrologyReportShares.status, "active")))
  ]);
  const requestById = new Map(reportRequests.map((request) => [request.id, request]));
  const sharedRequestIds = new Set(reportShares.map((share) => share.requestId));
  const nonReportArtifacts = artifacts.filter((artifact) => artifact.kind !== "report");
  const reportArtifacts = reportResults
    .filter((result) => result.status === "completed" && !isWelcomeReport(requestById.get(result.requestId)))
    .map((result): LibraryArtifact => {
      const request = requestById.get(result.requestId);
      const subject = reportSubjectContext(request);
      return {
        id: `report:${result.requestId}`,
        userId: result.userId,
        title: reportDisplayTitle(request, result.publicSignal?.headline),
        kind: "report" as const,
        summary: result.summary ?? ui.library.completedReportSummary,
        createdAt: result.createdAt,
        cardMetadata: reportCardMetadata(request, result.createdAt, resolveLegacySynastryPartnerBirthDate(request, chartRequests)),
        requestId: result.requestId,
        reportType: request?.reportType,
        isWelcome: request?.context?.modelPilot === "gemini-intro-identity",
        subjectName: reportDisplayName(request),
        subjectType: subject.type,
        status: result.status,
        isShared: sharedRequestIds.has(result.requestId)
      };
    });

  return [...nonReportArtifacts, ...reportArtifacts]
    .map((artifact) => ({
      ...artifact,
      requestId: (artifact as LibraryArtifact).requestId ?? reportRequestIdFromArtifactId(artifact.id)
    }) as LibraryArtifact)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
