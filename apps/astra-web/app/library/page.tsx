import Link from "next/link";

import type { Artifact, AstrologyReportResult } from "@astra/contracts";
import { PageHeader } from "../../components/PageHeader";
import { db, getUserAstrologyReportResult, listUserArtifacts, listUserAstrologyReportResults } from "@astra/db";
import { getFoundationViewModel } from "../../lib/foundation";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";

export const dynamic = "force-dynamic";

type LibraryArtifact = Artifact & {
  requestId?: string;
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
      {selectedReport ? <SelectedReportCard report={selectedReport} onCloseHref="/library" /> : normalizedReportId ? <SelectedReportMissingCard reportId={normalizedReportId} /> : null}
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
        <div className="eyebrow">{artifact.kind}</div>
        <h2>{artifact.title}</h2>
        <p>{artifact.summary}</p>
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

function SelectedReportCard({
  report,
  onCloseHref
}: {
  report: AstrologyReportResult;
  onCloseHref: string;
}) {
  return (
    <section className="card" aria-label={ui.library.selectedReportLabel}>
      <p>
        <a href={onCloseHref}>{ui.library.selectedReportBack}</a>
      </p>
      {ui.library.selectedReportEyebrow ? <div className="eyebrow">{ui.library.selectedReportEyebrow}</div> : null}
      <h2>{report.publicSignal?.headline ?? "Report details"}</h2>
      {report.summary ? <p>{report.summary}</p> : <p>{ui.library.selectedReportNoSummary}</p>}

      <div className="report-reader-content">
        {report.sections.length ? (
          report.sections.map((section) => (
            <article className="card" key={section.id || section.title}>
              <div className="eyebrow">{section.emphasis}</div>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))
        ) : (
          <p>{ui.library.selectedReportNoSections}</p>
        )}
      </div>
    </section>
  );
}

function SelectedReportMissingCard({ reportId }: { reportId: string }) {
  return (
    <section className="card" aria-label={ui.library.selectedReportLabel}>
      <p>
        <a href="/library">{ui.library.selectedReportBack}</a>
      </p>
      <p>{ui.library.selectedReportMissing}</p>
      <p>{ui.library.selectedReportMissingId}</p>
      <pre>{reportId}</pre>
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
  const [artifacts, reportResults] = await Promise.all([listUserArtifacts(db, userId), listUserAstrologyReportResults(db, userId)]);
  const artifactIds = new Set(artifacts.map((artifact) => artifact.id));
  const reportArtifacts = reportResults
    .filter((result) => result.status === "completed")
    .map((result): LibraryArtifact => ({
      id: `report:${result.requestId}`,
      userId: result.userId,
      title: result.publicSignal?.headline ?? "Astrology report",
      kind: "report" as const,
      summary: result.summary ?? "Completed astrology report.",
      createdAt: result.createdAt,
      requestId: result.requestId
    }))
    .filter((artifact) => !artifactIds.has(artifact.id));

  return [...artifacts, ...reportArtifacts]
    .map((artifact) => ({
      ...artifact,
      requestId: (artifact as LibraryArtifact).requestId ?? reportRequestIdFromArtifactId(artifact.id)
    }) as LibraryArtifact)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
