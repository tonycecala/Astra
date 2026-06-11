import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";

export default function JourneyPage() {
  const view = getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow="Journey" title="A living stream">
        Meaningful cards, reflections, achievements, allies, artifacts, and gifts begin here as one calm reader surface.
      </PageHeader>
      <div className="status-strip">
        <span className="pill">Seeded stream</span>
        <span className="pill">No legacy data</span>
        <span className="pill">{view.streamCards.length} cards</span>
      </div>
      <section className="grid" aria-label="Stream cards">
        {view.streamCards.map(({ item, card }) => (
          <article className="card stream-card" key={item.id}>
            <div className="art" aria-hidden="true" />
            <div>
              <div className="eyebrow">{card.lane.replaceAll("_", " ")}</div>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
