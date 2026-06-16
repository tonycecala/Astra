import "server-only";

import {
  type ComposerPrivateFeedWrite,
  type ComposerPrivateFeedWriteResponse,
  composerPrivateFeedWriteResponseSchema,
  composerPrivateFeedWriteSchema
} from "@astra/contracts";
import { createComposerDecision, createUserFeedItem, db, upsertSourceCard } from "@astra/db";

export async function persistComposerPrivateFeedWrite(
  input: ComposerPrivateFeedWrite
): Promise<ComposerPrivateFeedWriteResponse> {
  const parsed = composerPrivateFeedWriteSchema.parse(input);
  const sourceCard = parsed.sourceCard ? await upsertSourceCard(db, parsed.sourceCard) : undefined;
  const feedItem = await createUserFeedItem(db, parsed.feedItem);
  const decision = parsed.decision
    ? await createComposerDecision(db, {
        userId: feedItem.userId,
        userFeedItemId: feedItem.id,
        ...parsed.decision
      })
    : undefined;

  return composerPrivateFeedWriteResponseSchema.parse({
    id: parsed.id,
    sourceCard,
    feedItem,
    decision,
    createdAt: parsed.createdAt
  });
}
