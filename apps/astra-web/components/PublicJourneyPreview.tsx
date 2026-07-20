import type { PublicJourneyCard } from "../lib/journey";
import { ui } from "../lib/i18n";

export function PublicJourneyPreview({ cards }: { cards: PublicJourneyCard[] }) {
  return <section className="public-journey-preview" aria-label={ui.journey.publicPreviewLabel}>{cards.map(({ item, card }) => <article className="card" key={item.id}><h2>{card.title}</h2>{card.subtitle ? <p className="journey-step-subtitle">{card.subtitle}</p> : null}<p>{card.body}</p></article>)}</section>;
}
