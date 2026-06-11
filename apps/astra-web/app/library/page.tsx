import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";

export default function LibraryPage() {
  const view = getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow="Library" title="Artifacts worth keeping">
        Saved reports, reflections, notes, chart objects, and cards live behind one simple artifact contract.
      </PageHeader>
      <section className="list" aria-label="Artifacts list">
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
