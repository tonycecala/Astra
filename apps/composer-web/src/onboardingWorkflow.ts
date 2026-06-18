import {
  type ComposerOnboardingCardsWrite,
  type ComposerPrivateFeedWrite,
  type ComposerVoiceCard,
  type SourceCard,
  type UserFeedItem,
  sourceCardSchema
} from "@astra/contracts";
import seedPayload from "../data/stream-cards.seed.json";
import { publishComposerPrivateFeedItem } from "./publishPrivateFeedItem";

type ComposerOnboardingIssue = {
  field: string;
  message: string;
};

export type ComposerOnboardingSeedCard = {
  id: string;
  title: string;
  body: string;
  subtitle?: string;
  order: number;
  lane: "today" | "know_yourself" | "practice" | "gift";
  ctaLabel: string;
};

export type ComposerOnboardingBatchInput = {
  targetUserId: string;
  cards?: ComposerOnboardingSeedCard[];
  batchId?: string;
  createdAt?: string;
};

export type ComposerOnboardingBatchResult =
  | { ok: true; batch: ComposerOnboardingCardsWrite }
  | { ok: false; error: "COMPOSER_ONBOARDING_BATCH_FAILED"; issues: ComposerOnboardingIssue[] };

type QuarryOnboardingCard = {
  id?: string;
  title?: string;
  body?: string;
  subtitle?: string;
  isOnboarding?: boolean;
  onboardingOrder?: number;
  lane?: string;
  ctaLabel?: string;
};

const composerOnboardingSeedCards: ComposerOnboardingSeedCard[] = ((seedPayload as { cards?: QuarryOnboardingCard[] }).cards ?? [])
  .filter((card) => card.isOnboarding)
  .sort((a, b) => (a.onboardingOrder ?? 999) - (b.onboardingOrder ?? 999))
  .map((card, index) => ({
    id: card.id ?? `onboarding-${index + 1}`,
    title: card.title ?? `Onboarding ${index + 1}`,
    subtitle: card.subtitle,
    body: card.body ?? "",
    order: card.onboardingOrder ?? index + 1,
    lane: card.lane === "practice" || card.lane === "gift" || card.lane === "know_yourself" ? card.lane : "today",
    ctaLabel: card.ctaLabel ?? "Open"
  }));

function nowIso() {
  return new Date().toISOString();
}

function sourceCardFromOnboardingCard(card: ComposerOnboardingSeedCard, createdAt: string): SourceCard {
  return sourceCardSchema.parse({
    id: `source_card:onboarding:${card.id}`,
    slug: `onboarding-${card.id}`,
    title: card.title,
    bodyTemplate: card.body,
    cardType: card.lane === "practice" ? "practice" : card.lane === "gift" ? "gift" : "reflection",
    topicTags: ["onboarding", "private-feed"],
    symbolicTags: [],
    eligibilityRules: {
      requiresAuthenticatedUser: true,
      onboardingOrder: card.order,
      composerSet: "astria-onboarding-v0"
    },
    safetyFlags: [],
    status: "active",
    createdAt,
    updatedAt: createdAt
  });
}

function voiceCardFromOnboardingCard(card: ComposerOnboardingSeedCard): ComposerVoiceCard {
  return {
    voice: { id: "guide" },
    header: card.title,
    body: card.body
  };
}

function feedKindFromLane(lane: ComposerOnboardingSeedCard["lane"]): UserFeedItem["feedKind"] {
  if (lane === "gift") return "gift";
  return "source_card";
}

export function createComposerOnboardingSeedCards() {
  return [...composerOnboardingSeedCards];
}

export function prepareComposerOnboardingCardsBatch(input: ComposerOnboardingBatchInput): ComposerOnboardingBatchResult {
  const targetUserId = input.targetUserId.trim();
  const createdAt = input.createdAt ?? nowIso();
  const cards = input.cards ?? composerOnboardingSeedCards;
  const issues: ComposerOnboardingIssue[] = [];

  if (!targetUserId) issues.push({ field: "targetUserId", message: "Target user id is required." });
  if (!cards.length) issues.push({ field: "cards", message: "At least one onboarding card is required." });

  const writes: ComposerPrivateFeedWrite[] = [];
  for (const card of cards) {
    const sourceCard = sourceCardFromOnboardingCard(card, createdAt);
    const published = publishComposerPrivateFeedItem({
      id: `composer_onboarding_write:${card.id}:${targetUserId}`,
      userId: targetUserId,
      feedItemId: `composer_onboarding_feed:${card.id}:${targetUserId}`,
      sourceCard,
      voiceCard: voiceCardFromOnboardingCard(card),
      feedKind: feedKindFromLane(card.lane),
      rankScore: 10_000 - card.order,
      reasonCode: "composer_onboarding_card",
      decision: {
        decisionVersion: "composer-onboarding-v1",
        inputContextHash: `onboarding:${targetUserId}:astria-onboarding-v0`,
        candidateIds: [sourceCard.id],
        selectedCandidateId: sourceCard.id,
        rankFeatures: {
          onboardingOrder: card.order,
          lane: card.lane,
          composerSet: "astria-onboarding-v0"
        },
        suppressionReasons: [],
        safetyNotes: ["Onboarding card contains public-safe copy but is projected only to the target user's private feed."]
      },
      createdAt
    });

    if (!published.ok) {
      issues.push(
        ...published.violations.map((violation) => ({
          field: `cards.${card.id}.${violation.field}`,
          message: violation.type
        }))
      );
      continue;
    }

    writes.push({
      ...published.write,
      feedItem: {
        ...published.write.feedItem,
        displayPayload: {
          ...published.write.feedItem.displayPayload,
          subtitle: card.subtitle,
          lane: card.lane,
          ctaLabel: card.ctaLabel,
          ctaAction: card.lane === "practice" ? "reflect" : card.lane === "gift" ? "claim" : "open",
          onboarding: true,
          onboardingOrder: card.order,
          composerSet: "astria-onboarding-v0"
        }
      }
    });
  }

  if (issues.length) {
    return { ok: false, error: "COMPOSER_ONBOARDING_BATCH_FAILED", issues };
  }

  return {
    ok: true,
    batch: {
      id: input.batchId ?? `composer_onboarding_batch:${targetUserId}:${createdAt}`,
      publisher: "composer",
      targetUserId,
      cards: writes,
      createdAt
    }
  };
}
