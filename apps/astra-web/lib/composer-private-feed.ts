import "server-only";

import {
  type ComposerOnboardingCardsWrite,
  type ComposerOnboardingCardsWriteResponse,
  type ComposerPrivateFeedWrite,
  type ComposerPrivateFeedWriteResponse,
  composerOnboardingCardsWriteResponseSchema,
  composerOnboardingCardsWriteSchema,
  composerPrivateFeedWriteResponseSchema,
  composerPrivateFeedWriteSchema
} from "@astra/contracts";
import { createComposerDecision, createUserFeedItem, db, markAuthUserOnboardingComplete, upsertSourceCard } from "@astra/db";

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

export async function persistComposerOnboardingCardsWrite(
  input: ComposerOnboardingCardsWrite
): Promise<ComposerOnboardingCardsWriteResponse> {
  const parsed = composerOnboardingCardsWriteSchema.parse(input);
  const writes: ComposerPrivateFeedWriteResponse[] = [];

  for (const card of parsed.cards) {
    writes.push(await persistComposerPrivateFeedWrite(card));
  }
  await markAuthUserOnboardingComplete(db, parsed.targetUserId);

  return composerOnboardingCardsWriteResponseSchema.parse({
    id: parsed.id,
    targetUserId: parsed.targetUserId,
    writes,
    createdAt: parsed.createdAt
  });
}
