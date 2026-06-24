import Link from "next/link";

import type { Artifact } from "@astra/contracts";
import { PageHeader } from "../../components/PageHeader";
import { ReportReader, formatReportDate, reportSubjectContext, reportTypeLabel } from "../../components/ReportReader";
import { astrologyReportShares, db, getUserAstrologyReportResult, getUserAstrologyReportRequest, listUserArtifacts, listUserAstrologyReportRequests, listUserAstrologyReportResults } from "@astra/db";
import { getFoundationViewModel } from "../../lib/foundation";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type LibraryArtifact = Artifact & {
  requestId?: string;
  reportType?: string;
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
  const view = profile ? { artifacts: await getUserLibraryArtifacts(profile.userId) } : await getFoundationViewModel();
  const filteredArtifacts = filterLibraryArtifacts(view.artifacts as LibraryArtifact[], activeFilter, query);
  const filterCounts = reportFilterCounts(view.artifacts as LibraryArtifact[]);
  const selectedReport =
    normalizedReportId && profile
      ? await getUserAstrologyReportResult(db, {
          requestId: normalizedReportId,
          userId: profile.userId
        })
      : null;
  const selectedRequest =
    normalizedReportId && profile
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
  return (
    <section className="libraryControls" aria-label={ui.library.filtersLabel}>
      <form className="librarySearchForm" action="/library">
        <input name="filter" type="hidden" value={activeFilter} />
        <label>
          <span>{ui.library.searchLabel}</span>
          <input name="q" type="search" defaultValue={query} placeholder={ui.library.searchPlaceholder} />
        </label>
        <button className="button secondary" type="submit">{ui.library.searchSubmit}</button>
      </form>
      <nav className="libraryFilterNav" aria-label={ui.library.filtersLabel}>
        {reportFilters.map((filter) => (
          <Link
            aria-current={activeFilter === filter.value ? "page" : undefined}
            className={activeFilter === filter.value ? "libraryFilterChip libraryFilterChipActive" : "libraryFilterChip"}
            href={libraryHref(filter.value, query)}
            key={filter.value}
          >
            <span>{filter.label}</span>
            <strong>{filterCounts[filter.value]}</strong>
          </Link>
        ))}
      </nav>
    </section>
  );
}

function ArtifactCard({ artifact }: { artifact: LibraryArtifact }) {
  if (artifact.kind === "report" && artifact.requestId) {
    return (
      <Link
        className="card card-link"
        href={`/library?reportId=${encodeURIComponent(artifact.requestId)}`}
        aria-label={`${ui.library.openReportAction}: ${artifact.title}`}
      >
        <div className="library-report-card-meta">
          <span>{artifact.subjectType === "ally" ? ui.library.subjectAlly : ui.library.subjectSelf}</span>
          <span>{reportTypeLabel(artifact.reportType)}</span>
          <span>{artifact.status ?? ui.library.statusGenerated}</span>
        </div>
        <h2>{artifact.title}</h2>
        {artifact.subjectName ? <p className="library-report-subject">{artifact.subjectName}</p> : null}
        <p className="library-report-date">{ui.library.reportCardDateLabel} {formatReportDate(artifact.createdAt)}</p>
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
  const [artifacts, reportRequests, reportResults, reportShares] = await Promise.all([
    listUserArtifacts(db, userId),
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
    .filter((result) => result.status === "completed")
    .map((result): LibraryArtifact => {
      const request = requestById.get(result.requestId);
      const subject = reportSubjectContext(request);
      return {
        id: `report:${result.requestId}`,
        userId: result.userId,
        title: result.publicSignal?.headline ?? ui.library.selectedReportFallbackTitle,
        kind: "report" as const,
        summary: result.summary ?? ui.library.completedReportSummary,
        createdAt: result.createdAt,
        requestId: result.requestId,
        reportType: request?.reportType,
        subjectName: subject.name,
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
