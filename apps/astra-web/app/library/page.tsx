import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";
import { ui } from "../../lib/i18n";

export default function LibraryPage() {
  const view = getFoundationViewModel();

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
