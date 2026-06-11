import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";
import { ui } from "../../lib/i18n";

export default function AlliesPage() {
  const view = getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow={ui.allies.eyebrow} title={ui.allies.title}>
        {ui.allies.intro}
      </PageHeader>
      <section className="list" aria-label={ui.allies.listLabel}>
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
