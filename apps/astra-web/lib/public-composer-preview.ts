import type { AstraCard, ComposerAvailabilityResponse } from "@astra/contracts";

export const PUBLIC_COMPOSER_SAMPLE_COUNT = 4;

export type PublicComposerPreviewCard = {
  item: {
    id: string;
    kind: "composer_public_sample";
    status: "published";
    audience: "public_composer";
    publishedAt: string;
    source: "composer_public";
  };
  card: AstraCard;
};

function laneForPublicCard(card: ComposerAvailabilityResponse["collection"]["cards"][number]): AstraCard["lane"] {
  if (card.ontologyType === "quiz" || card.ontologyType === "test" || card.ontologyType === "certification") return "practice";
  if (card.ontologyType === "reflection") return "know_yourself";
  if (card.ontologyType === "art") return "myth_and_symbol";
  return card.lane === "gift" ? "gift" : card.lane === "myth_and_symbol" ? "myth_and_symbol" : "today";
}

export function buildPublicComposerPreview(
  availability: ComposerAvailabilityResponse,
  openLabel: string
): PublicComposerPreviewCard[] {
  return availability.collection.cards.slice(0, PUBLIC_COMPOSER_SAMPLE_COUNT).map((card) => ({
    item: {
      id: `composer_public:${availability.collection.id}:${card.id}`,
      kind: "composer_public_sample",
      status: "published",
      audience: "public_composer",
      publishedAt: availability.collection.generatedAt,
      source: "composer_public"
    },
    card: {
      id: `composer_public:${card.id}`,
      title: card.title,
      subtitle: card.subtitle ?? card.collectionTitle,
      body: card.excerpt ?? card.body,
      lane: laneForPublicCard(card),
      tone: "grounded",
      ctaLabel: openLabel,
      ctaAction: "open",
      imageUrl: card.imageUrl,
      publishedAt: availability.collection.generatedAt
    }
  }));
}
