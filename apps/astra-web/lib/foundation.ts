import { getFoundationSeed } from "@astra/testkit";

export function getFoundationViewModel() {
  const seed = getFoundationSeed();
  const cardsById = new Map(seed.cards.map((card) => [card.id, card]));
  const streamCards = [...seed.streamItems]
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const card = cardsById.get(item.cardId);
      if (!card) throw new Error(`Missing card for stream item ${item.id}`);
      return { item, card };
    });

  return {
    ...seed,
    streamCards
  };
}
