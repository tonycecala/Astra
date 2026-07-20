import { PublishedCard } from "@astra/ui";
import type { PublicJourneyCard } from "../lib/journey";
import { ui } from "../lib/i18n";

export function PublicJourneyPreview({ cards }: { cards: PublicJourneyCard[] }) {
  return (
    <section className="public-journey-preview" aria-label={ui.journey.publicPreviewLabel}>
      {cards.map(({ item, card }) => {
        const laneLabel = ui.journey.lanes[card.lane];
        return (
          <article className="stream-card astraPublishedCard" key={item.id}>
            <PublishedCard
              bodyText={card.body}
              className="stream-card-open"
              contentClassName="stream-card-content"
              eyebrow={laneLabel}
              imageAlt={card.imageUrl ? card.title : ""}
              imageFallback={laneLabel}
              imageUrl={card.imageUrl}
              mediaClassName="stream-card-media astraStreamArtFrame"
              showLessLabel={ui.journey.showLess}
              showMoreLabel={ui.journey.showMore}
              subtitle={card.subtitle}
              title={card.title}
            />
          </article>
        );
      })}
    </section>
  );
}
