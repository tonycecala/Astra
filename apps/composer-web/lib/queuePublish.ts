import type { ComposerAvailabilityResponse } from "@astra/contracts";
import { buildComposerAvailability, listComposerCards, type ComposerCardScope } from "./cardLibrary";

export type ComposerQueueState = "reviewing" | "approved" | "held";

export const COMPOSER_QUEUE_BATCH_LIMIT = 48;
export const COMPOSER_QUEUE_DEFAULT_POOL_ID = "operator_approved_pool";

export type ComposerQueuePublishItemInput = {
  cardId?: string;
  queueState?: ComposerQueueState;
  decisionNotes?: string;
};

export type ComposerQueuePublishIssue = {
  field: string;
  message: string;
};

export type ComposerQueueBatchPlanInput = {
  cards?: ComposerQueuePublishItemInput[];
  scope?: ComposerCardScope;
  createdAt?: string;
};

export type ComposerQueueBatchPlanIssue = ComposerQueuePublishIssue & {
  cardId?: string;
  index: number;
};

export type ComposerQueueBatchPlan = {
  ok: boolean;
  error?: "BATCH_PARTIAL_VALIDATION_FAILED" | "CARDS_REQUIRED";
  issues: ComposerQueueBatchPlanIssue[];
  items: Array<{
    cardId: string;
    index: number;
    ok: boolean;
  }>;
  planId: string;
  summary: {
    cappedAt: number;
    collectionId: string;
    duplicateCount: number;
    needsReview: number;
    publishable: number;
    requested: number;
  };
};

export function composerQueuePoolId(scope: ComposerCardScope = "all") {
  if (scope === "course") return "operator_approved_course";
  if (scope === "drafts") return "operator_approved_drafts";
  return COMPOSER_QUEUE_DEFAULT_POOL_ID;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function prepareComposerQueueBatchPlan(input: ComposerQueueBatchPlanInput): ComposerQueueBatchPlan {
  const requestedCards = Array.isArray(input.cards) ? input.cards : [];
  const cards = requestedCards.slice(0, COMPOSER_QUEUE_BATCH_LIMIT);
  const collectionId = composerQueuePoolId(input.scope);
  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();
  const issues: ComposerQueueBatchPlanIssue[] = [];

  if (!cards.length) {
    return {
      ok: false,
      error: "CARDS_REQUIRED",
      issues: [{ field: "cards", index: -1, message: "Select at least one card before batch publish." }],
      items: [],
      planId: `composer_queue_plan:${stableHash(`${collectionId}:empty`)}`,
      summary: {
        cappedAt: COMPOSER_QUEUE_BATCH_LIMIT,
        collectionId,
        duplicateCount: 0,
        needsReview: 0,
        publishable: 0,
        requested: requestedCards.length
      }
    };
  }

  const cardsById = new Map(listComposerCards().map((card) => [card.id, card]));
  const items: ComposerQueueBatchPlan["items"] = cards.map((card, index) => {
    const cardId = card.cardId?.trim() ?? "";
    if (cardId) {
      if (seenIds.has(cardId)) duplicateIds.add(cardId);
      seenIds.add(cardId);
    }
    if (!cardId) {
      issues.push({ field: "cardId", cardId, index, message: "Card id is required before publish." });
      return { cardId, index, ok: false };
    }
    if (card.queueState !== "approved") {
      issues.push({ field: "queueState", cardId, index, message: "Approve this card before publishing it to the pool." });
      return { cardId, index, ok: false };
    }
    if (!cardsById.has(cardId)) {
      issues.push({ field: "cardId", cardId, index, message: "Card was not found in the Composer library." });
      return { cardId, index, ok: false };
    }
    return { cardId, index, ok: true };
  });

  for (const duplicateId of duplicateIds) {
    const firstIndex = cards.findIndex((card) => card.cardId?.trim() === duplicateId);
    issues.push({ cardId: duplicateId, field: "cardId", index: firstIndex, message: "Duplicate card id is already selected for this batch." });
  }

  const publishable = items.filter((item) => item.ok).length;
  const needsReview = cards.length - publishable + duplicateIds.size;
  const planId = `composer_queue_plan:${stableHash(
    JSON.stringify({
      cards: cards.map((card) => ({ cardId: card.cardId ?? "", queueState: card.queueState ?? "reviewing" })),
      collectionId
    })
  )}`;

  return {
    ok: issues.length === 0,
    error: issues.length ? "BATCH_PARTIAL_VALIDATION_FAILED" : undefined,
    issues,
    items,
    planId,
    summary: {
      cappedAt: COMPOSER_QUEUE_BATCH_LIMIT,
      collectionId,
      duplicateCount: duplicateIds.size,
      needsReview,
      publishable,
      requested: requestedCards.length
    }
  };
}

export function buildComposerQueueAvailability(plan: ComposerQueueBatchPlan, createdAt = new Date().toISOString()): ComposerAvailabilityResponse {
  const cardIds = plan.items.filter((item) => item.ok).map((item) => item.cardId);
  const availability = buildComposerAvailability({
    requestType: "ordered_list",
    id: plan.summary.collectionId,
    cardIds,
    limit: Math.max(1, cardIds.length)
  });

  return {
    ...availability,
    collection: {
      ...availability.collection,
      kind: "pool",
      title: "Operator approved pool",
      description: "Approved Composer cards available for Astra per-user selection.",
      generatedAt: createdAt
    }
  };
}
