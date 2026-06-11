import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";
import { ui } from "../../lib/i18n";

export default function JourneyPage() {
  const view = getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow={ui.journey.eyebrow} title={ui.journey.title}>
        {ui.journey.intro}
      </PageHeader>
      <div className="status-strip">
        <span className="pill">{ui.journey.seededStream}</span>
        <span className="pill">{ui.journey.noLegacyData}</span>
        <span className="pill">{ui.journey.cardCount(view.streamCards.length)}</span>
      </div>
      <section className="grid" aria-label={ui.journey.streamCardsLabel}>
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
