import type { ComposerPrivateFeedWrite, UserFeedItem } from "@astra/contracts";
import { getComposerCardFeeds, listComposerCards, type ComposerStreamCard } from "./cardLibrary";
import { publishComposerPrivateFeedItem } from "../src";

export type ComposerQueueState = "reviewing" | "approved" | "held";

export const COMPOSER_QUEUE_BATCH_LIMIT = 48;

export type ComposerQueuePublishItemInput = {
  cardId?: string;
  queueState?: ComposerQueueState;
  decisionNotes?: string;
};

export type ComposerQueuePublishInput = ComposerQueuePublishItemInput & {
  targetUserId?: string;
  createdAt?: string;
};

export type ComposerQueuePublishIssue = {
  field: string;
  message: string;
};

export type ComposerQueueBatchPlanInput = {
  cards?: ComposerQueuePublishItemInput[];
  createdAt?: string;
  targetUserId?: string;
};

export type ComposerQueueBatchPlanIssue = ComposerQueuePublishIssue & {
  cardId?: string;
  index: number;
};

export type ComposerQueueBatchPlan = {
  ok: boolean;
  error?: "BATCH_PARTIAL_VALIDATION_FAILED" | "CARDS_REQUIRED" | "TARGET_USER_REQUIRED";
  issues: ComposerQueueBatchPlanIssue[];
  items: Array<{
    cardId: string;
    index: number;
    ok: boolean;
    write?: ComposerPrivateFeedWrite;
  }>;
  planId: string;
  summary: {
    cappedAt: number;
    duplicateCount: number;
    needsReview: number;
    publishable: number;
    requested: number;
    targetUserIdPresent: boolean;
  };
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function slugFor(card: ComposerStreamCard) {
  return card.id.replace(/^card_/, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function cardTypeFor(card: ComposerStreamCard) {
  if (card.kind === "learning" || card.kind === "quiz" || card.kind === "test" || card.kind === "certification") return "lesson";
  if (card.kind === "gift" || card.lane === "gift") return "gift";
  if (card.kind === "practice" || card.lane === "practice") return "practice";
  if (card.kind === "announcement") return "announcement";
  return "reflection";
}

function feedKindFor(card: ComposerStreamCard): UserFeedItem["feedKind"] {
  if (card.kind === "gift" || card.lane === "gift") return "gift";
  return "source_card";
}

export function prepareComposerQueuePrivateFeedWrite(input: ComposerQueuePublishInput) {
  const cardId = input.cardId?.trim() ?? "";
  const targetUserId = input.targetUserId?.trim() ?? "";
  const queueState = input.queueState ?? "reviewing";
  const decisionNotes = input.decisionNotes?.trim() ?? "";

  if (!cardId) {
    return { ok: false as const, error: "CARD_REQUIRED", issues: [{ field: "cardId", message: "Card id is required before publish." }] };
  }

  if (queueState !== "approved") {
    return { ok: false as const, error: "CARD_NOT_APPROVED", issues: [{ field: "queueState", message: "Approve this card before publish." }] };
  }

  if (!targetUserId) {
    return { ok: false as const, error: "TARGET_USER_REQUIRED", issues: [{ field: "targetUserId", message: "Target user id is required before publish." }] };
  }

  const card = listComposerCards().find((item) => item.id === cardId);
  if (!card) {
    return { ok: false as const, error: "CARD_NOT_FOUND", issues: [{ field: "cardId", message: "Card was not found in the Composer quarry fixture." }] };
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const sourceCardId = `source_card:${card.id}`;
  const feeds = getComposerCardFeeds(card);
  const lane = card.seriesId ?? card.lane ?? card.kind;
  const rankScore = card.priority ?? card.seriesOrder ?? card.onboardingOrder ?? 0;
  const published = publishComposerPrivateFeedItem({
    id: `composer_queue_write:${card.id}:${targetUserId}`,
    userId: targetUserId,
    feedItemId: `composer_queue_feed:${card.id}:${targetUserId}`,
    feedKind: feedKindFor(card),
    rankScore,
    reasonCode: "composer_queue_reviewed_card",
    sourceCard: {
      id: sourceCardId,
      slug: slugFor(card),
      title: card.title,
      bodyTemplate: card.body,
      cardType: cardTypeFor(card),
      topicTags: [...new Set([card.kind, lane, ...feeds, ...card.tags].filter(Boolean))],
      symbolicTags: card.tags.slice(0, 8),
      eligibilityRules: {
        requiresAuthenticatedUser: true,
        operatorReviewed: true,
        composerQueueState: queueState,
        feeds
      },
      safetyFlags: [],
      status: "active",
      createdAt,
      updatedAt: createdAt
    },
    voiceCard: {
      voice: { id: "guide" },
      header: card.title,
      body: card.excerpt ?? card.subtitle ?? card.body
    },
    decision: {
      decisionVersion: "composer-card-queue-review-v1",
      inputContextHash: `composer-card:${card.id}:target:${targetUserId}`,
      candidateIds: [sourceCardId],
      selectedCandidateId: sourceCardId,
      rankFeatures: {
        cardId: card.id,
        kind: card.kind,
        status: card.status,
        lane,
        feeds,
        operatorQueueState: queueState,
        decisionNotes
      },
      suppressionReasons: [],
      safetyNotes: ["Queue publish contains only reviewed Composer card fixture material."]
    },
    createdAt
  });

  if (!published.ok) {
    return { ok: false as const, error: published.error, issues: published.violations.map((issue) => ({ field: issue.field, message: issue.type })) };
  }

  return { ok: true as const, write: published.write };
}

export function prepareComposerQueueBatchPlan(input: ComposerQueueBatchPlanInput): ComposerQueueBatchPlan {
  const targetUserId = input.targetUserId?.trim() ?? "";
  const requestedCards = Array.isArray(input.cards) ? input.cards : [];
  const cards = requestedCards.slice(0, COMPOSER_QUEUE_BATCH_LIMIT);
  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();
  const issues: ComposerQueueBatchPlanIssue[] = [];

  if (!targetUserId) {
    return {
      ok: false,
      error: "TARGET_USER_REQUIRED",
      issues: [{ field: "targetUserId", index: -1, message: "Target user id is required before publish." }],
      items: [],
      planId: "composer_queue_plan:missing-target",
      summary: {
        cappedAt: COMPOSER_QUEUE_BATCH_LIMIT,
        duplicateCount: 0,
        needsReview: requestedCards.length,
        publishable: 0,
        requested: requestedCards.length,
        targetUserIdPresent: false
      }
    };
  }

  if (!cards.length) {
    return {
      ok: false,
      error: "CARDS_REQUIRED",
      issues: [{ field: "cards", index: -1, message: "Select at least one card before batch publish." }],
      items: [],
      planId: `composer_queue_plan:${stableHash(`${targetUserId}:empty`)}`,
      summary: {
        cappedAt: COMPOSER_QUEUE_BATCH_LIMIT,
        duplicateCount: 0,
        needsReview: 0,
        publishable: 0,
        requested: requestedCards.length,
        targetUserIdPresent: true
      }
    };
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const items: ComposerQueueBatchPlan["items"] = cards.map((card, index) => {
    const cardId = card.cardId?.trim() ?? "";
    if (cardId) {
      if (seenIds.has(cardId)) duplicateIds.add(cardId);
      seenIds.add(cardId);
    }
    const result = prepareComposerQueuePrivateFeedWrite({ ...card, targetUserId, createdAt });
    if (!result.ok) {
      issues.push(...result.issues.map((issue) => ({ ...issue, cardId, index })));
      return { cardId, index, ok: false };
    }
    return { cardId, index, ok: true, write: result.write };
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
      targetUserId
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
      duplicateCount: duplicateIds.size,
      needsReview,
      publishable,
      requested: requestedCards.length,
      targetUserIdPresent: true
    }
  };
}
