import "server-only";

import { db, readFoundationSnapshot } from "@astra/db";

export async function getFoundationViewModel() {
  const snapshot = await readFoundationSnapshot(db);
  const cardsById = new Map(snapshot.cards.map((card) => [card.id, card]));
  const streamCards = [...snapshot.streamItems]
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const card = cardsById.get(item.cardId);
      if (!card) throw new Error(`Missing card for stream item ${item.id}`);
      return { item, card };
    });

  return {
    ...snapshot,
    streamCards
  };
}
