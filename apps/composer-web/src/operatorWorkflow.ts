import {
  type ComposerPrivateFeedWrite,
  type ComposerVoiceCard,
  type SourceCard,
  type UserFeedItem,
  sourceCardSchema
} from "@astra/contracts";
import { publishComposerPrivateFeedItem } from "./publishPrivateFeedItem";
import { validateComposerVoiceCard } from "./voices/validateVoiceCard";

type ComposerOperatorWorkflowIssue = {
  field: string;
  message: string;
};

export type ComposerOperatorSourceCardDraft = {
  draftId: string;
  sourceCard: SourceCard;
  voiceCard: ComposerVoiceCard;
  reasonCode: string;
  rankScore?: number;
  decisionVersion?: string;
  createdAt?: string;
};

export type ComposerOperatorPreview = {
  draftId: string;
  sourceCard: SourceCard;
  voiceCard: ComposerVoiceCard;
  feedKind: UserFeedItem["feedKind"];
  previewFeedItem: Pick<UserFeedItem, "feedKind" | "title" | "body" | "displayPayload" | "rankScore" | "reasonCode">;
  decisionPreview: NonNullable<ComposerPrivateFeedWrite["decision"]>;
  targetUserRequired: true;
  createdAt: string;
};

export type ComposerOperatorPreviewResult =
  | { ok: true; preview: ComposerOperatorPreview }
  | { ok: false; error: "OPERATOR_DRAFT_VALIDATION_FAILED"; issues: ComposerOperatorWorkflowIssue[] };

export type ComposerOperatorPublishReviewInput = {
  preview: ComposerOperatorPreview;
  targetUserId: string;
  feedItemId?: string;
  createdAt?: string;
};

export type ComposerOperatorPublishReviewResult =
  | { ok: true; write: ComposerPrivateFeedWrite }
  | { ok: false; error: "OPERATOR_PUBLISH_REVIEW_FAILED"; issues: ComposerOperatorWorkflowIssue[] };

function nowIso() {
  return new Date().toISOString();
}

function activeSourceCard(sourceCard: SourceCard, createdAt: string): SourceCard {
  return sourceCardSchema.parse({
    ...sourceCard,
    status: "active",
    updatedAt: createdAt
  });
}

export function createComposerOperatorDraftFixture(createdAt = nowIso()): ComposerOperatorSourceCardDraft {
  return {
    draftId: "composer_operator_threshold_checkin",
    sourceCard: {
      id: "source_card:composer-operator-threshold-checkin",
      slug: "composer-operator-threshold-checkin",
      title: "Threshold check-in",
      bodyTemplate: "A compact private feed source card for a user who needs a grounded next step.",
      cardType: "reflection",
      topicTags: ["operator-review", "private-feed"],
      symbolicTags: ["threshold", "attention"],
      eligibilityRules: { requiresAuthenticatedUser: true, operatorReviewed: true },
      safetyFlags: [],
      status: "draft",
      createdAt,
      updatedAt: createdAt
    },
    voiceCard: {
      voice: { id: "guide" },
      header: "A quiet threshold",
      body: "Name the next honest step, then leave the rest of the room uncluttered."
    },
    reasonCode: "composer_operator_reviewed_source_card",
    rankScore: 7_500,
    decisionVersion: "composer-operator-review-v1",
    createdAt
  };
}

export function previewComposerOperatorDraft(input: ComposerOperatorSourceCardDraft): ComposerOperatorPreviewResult {
  const createdAt = input.createdAt ?? nowIso();
  const sourceCard = sourceCardSchema.safeParse(input.sourceCard);
  const issues: ComposerOperatorWorkflowIssue[] = [];

  if (!sourceCard.success) {
    issues.push(
      ...sourceCard.error.issues.map((issue) => ({
        field: `sourceCard.${issue.path.join(".")}`,
        message: issue.message
      }))
    );
  }

  const voice = validateComposerVoiceCard(input.voiceCard);
  if (!voice.ok) {
    issues.push(
      ...voice.violations.map((violation) => ({
        field: `voiceCard.${violation.field}`,
        message: violation.type
      }))
    );
  }

  if (!input.draftId.trim()) {
    issues.push({ field: "draftId", message: "Draft id is required." });
  }

  if (!input.reasonCode.trim()) {
    issues.push({ field: "reasonCode", message: "Reason code is required." });
  }

  if (issues.length || !sourceCard.success || !voice.ok) {
    return { ok: false, error: "OPERATOR_DRAFT_VALIDATION_FAILED", issues };
  }

  const publishableSourceCard = activeSourceCard(sourceCard.data, createdAt);
  const feedKind: UserFeedItem["feedKind"] = "source_card";
  return {
    ok: true,
    preview: {
      draftId: input.draftId,
      sourceCard: publishableSourceCard,
      voiceCard: voice.card,
      feedKind,
      previewFeedItem: {
        feedKind,
        title: voice.card.header,
        body: voice.card.body,
        displayPayload: {
          subtitle: publishableSourceCard.title,
          sourceCardSlug: publishableSourceCard.slug,
          lane: publishableSourceCard.cardType === "practice" ? "practice" : "today",
          tone: "grounded",
          ctaLabel: "Open",
          ctaAction: "open",
          operatorReviewed: true
        },
        rankScore: input.rankScore ?? 0,
        reasonCode: input.reasonCode
      },
      decisionPreview: {
        decisionVersion: input.decisionVersion ?? "composer-operator-review-v1",
        inputContextHash: `operator-draft:${input.draftId}`,
        candidateIds: [publishableSourceCard.id],
        selectedCandidateId: publishableSourceCard.id,
        rankFeatures: {
          operatorReviewed: true,
          sourceCardType: publishableSourceCard.cardType,
          topicTags: publishableSourceCard.topicTags
        },
        suppressionReasons: [],
        safetyNotes: ["Operator preview contains only public-safe source-card material."]
      },
      targetUserRequired: true,
      createdAt
    }
  };
}

export function prepareComposerOperatorPrivateFeedWrite(
  input: ComposerOperatorPublishReviewInput
): ComposerOperatorPublishReviewResult {
  const targetUserId = input.targetUserId.trim();
  if (!targetUserId) {
    return {
      ok: false,
      error: "OPERATOR_PUBLISH_REVIEW_FAILED",
      issues: [{ field: "targetUserId", message: "Target user id is required before publish." }]
    };
  }

  const createdAt = input.createdAt ?? input.preview.createdAt;
  const published = publishComposerPrivateFeedItem({
    id: `composer_operator_write:${input.preview.draftId}:${targetUserId}`,
    userId: targetUserId,
    feedItemId: input.feedItemId ?? `composer_operator_feed:${input.preview.draftId}:${targetUserId}`,
    sourceCard: input.preview.sourceCard,
    voiceCard: input.preview.voiceCard,
    feedKind: input.preview.feedKind,
    rankScore: input.preview.previewFeedItem.rankScore,
    reasonCode: input.preview.previewFeedItem.reasonCode,
    decision: {
      ...input.preview.decisionPreview,
      inputContextHash: `${input.preview.decisionPreview.inputContextHash}:target:${targetUserId}`
    },
    createdAt
  });

  if (!published.ok) {
    return {
      ok: false,
      error: "OPERATOR_PUBLISH_REVIEW_FAILED",
      issues: published.violations.map((violation) => ({
        field: `voiceCard.${violation.field}`,
        message: violation.type
      }))
    };
  }

  return published;
}
