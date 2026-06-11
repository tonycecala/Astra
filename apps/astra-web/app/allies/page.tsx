import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";

export default function AlliesPage() {
  const view = getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow="Allies" title="Companions with clear names">
        People, guides, mentors, archetypes, and symbolic companions stay legible as first-class records.
      </PageHeader>
      <section className="list" aria-label="Allies list">
        {view.allies.map((ally) => (
          <article className="card" key={ally.id}>
            <div className="eyebrow">{ally.kind}</div>
            <h2>{ally.name}</h2>
            <p>{ally.relationship}</p>
            {ally.note ? <p>{ally.note}</p> : null}
          </article>
        ))}
      </section>
    </>
  );
}
