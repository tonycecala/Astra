import { PageHeader } from "../../components/PageHeader";
import { db, listUserArtifacts, listUserAstrologyReportResults } from "@astra/db";
import { getFoundationViewModel } from "../../lib/foundation";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const { profile } = await getAstraAuthContext();
  const view = profile ? { artifacts: await getUserLibraryArtifacts(profile.userId) } : await getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow={ui.library.eyebrow} title={ui.library.title}>
        {ui.library.intro}
      </PageHeader>
      <section className="list" aria-label={ui.library.listLabel}>
        {view.artifacts.map((artifact) => (
          <article className="card" key={artifact.id}>
            <div className="eyebrow">{artifact.kind}</div>
            <h2>{artifact.title}</h2>
            <p>{artifact.summary}</p>
          </article>
        ))}
      </section>
    </>
  );
}

async function getUserLibraryArtifacts(userId: string) {
  const [artifacts, reportResults] = await Promise.all([listUserArtifacts(db, userId), listUserAstrologyReportResults(db, userId)]);
  const artifactIds = new Set(artifacts.map((artifact) => artifact.id));
  const reportArtifacts = reportResults
    .filter((result) => result.status === "completed")
    .map((result) => ({
      id: `report:${result.requestId}`,
      userId: result.userId,
      title: result.publicSignal?.headline ?? "Astrology report",
      kind: "report" as const,
      summary: result.summary ?? "Completed astrology report.",
      createdAt: result.createdAt
    }))
    .filter((artifact) => !artifactIds.has(artifact.id));

  return [...artifacts, ...reportArtifacts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
