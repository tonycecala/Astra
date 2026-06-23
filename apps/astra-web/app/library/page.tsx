import Link from "next/link";

import type { Artifact } from "@astra/contracts";
import { PageHeader } from "../../components/PageHeader";
import { ReportReader, formatReportDate, reportSubjectContext, reportTypeLabel } from "../../components/ReportReader";
import { db, getUserAstrologyReportResult, getUserAstrologyReportRequest, listUserArtifacts, listUserAstrologyReportRequests, listUserAstrologyReportResults } from "@astra/db";
import { getFoundationViewModel } from "../../lib/foundation";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";

export const dynamic = "force-dynamic";

type LibraryArtifact = Artifact & {
  requestId?: string;
  reportType?: string;
  subjectName?: string;
  subjectType?: "self" | "ally";
  status?: string;
};

type LibraryPageParams = {
  searchParams: Promise<{
    reportId?: string;
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageParams) {
  const { reportId } = await searchParams;
  const normalizedReportId = normalizeReportId(reportId);

  const { profile } = await getAstraAuthContext();
  const view = profile ? { artifacts: await getUserLibraryArtifacts(profile.userId) } : await getFoundationViewModel();
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
        <section className="list" aria-label={ui.library.listLabel}>
          {view.artifacts.map((artifact) => (
            <ArtifactCard artifact={artifact} key={artifact.id} />
          ))}
        </section>
      ) : null}
      {selectedReport ? <ReportReader report={selectedReport} request={selectedRequest} backHref="/library" actions /> : normalizedReportId ? <SelectedReportMissingCard /> : null}
    </>
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

function normalizeReportId(reportId?: string) {
  if (!reportId) return null;
  const trimmed = reportId.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("report:") ? trimmed.slice("report:".length) : trimmed;
}

function reportRequestIdFromArtifactId(id: string) {
  if (!id.startsWith("report:")) return undefined;
  const requestId = id.slice("report:".length);
  return requestId ? requestId : undefined;
}

async function getUserLibraryArtifacts(userId: string) {
  const [artifacts, reportRequests, reportResults] = await Promise.all([
    listUserArtifacts(db, userId),
    listUserAstrologyReportRequests(db, userId),
    listUserAstrologyReportResults(db, userId)
  ]);
  const requestById = new Map(reportRequests.map((request) => [request.id, request]));
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
        status: result.status
      };
    });

  return [...nonReportArtifacts, ...reportArtifacts]
    .map((artifact) => ({
      ...artifact,
      requestId: (artifact as LibraryArtifact).requestId ?? reportRequestIdFromArtifactId(artifact.id)
    }) as LibraryArtifact)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
