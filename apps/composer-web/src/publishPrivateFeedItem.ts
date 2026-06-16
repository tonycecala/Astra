import {
  type AstrologyReportPublicSignal,
  type ComposerPrivateFeedWrite,
  type ComposerVoiceCard,
  type ComposerVoiceValidationError,
  type SourceCard,
  type UserFeedItem,
  composerPrivateFeedWriteSchema
} from "@astra/contracts";
import { validateComposerVoiceCard } from "./voices/validateVoiceCard";

export type ComposerPrivateFeedPublishInput = {
  id: string;
  userId: string;
  sourceCard: SourceCard;
  voiceCard: ComposerVoiceCard;
  feedItemId?: string;
  feedKind?: UserFeedItem["feedKind"];
  rankScore?: number;
  reasonCode: string;
  decision?: ComposerPrivateFeedWrite["decision"];
  createdAt?: string;
};

export type ComposerPrivateFeedPublishResult =
  | { ok: true; write: ComposerPrivateFeedWrite }
  | ComposerVoiceValidationError;

export function publishComposerPrivateFeedItem(input: ComposerPrivateFeedPublishInput): ComposerPrivateFeedPublishResult {
  const validation = validateComposerVoiceCard(input.voiceCard);
  if (!validation.ok) return validation;

  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    ok: true,
    write: composerPrivateFeedWriteSchema.parse({
      id: input.id,
      publisher: "composer",
      sourceCard: input.sourceCard,
      feedItem: {
        id: input.feedItemId,
        userId: input.userId,
        sourceCardId: input.sourceCard.id,
        feedKind: input.feedKind ?? "source_card",
        title: validation.card.header,
        body: validation.card.body,
        displayPayload: {
          subtitle: input.sourceCard.title,
          sourceCardSlug: input.sourceCard.slug,
          lane: input.sourceCard.cardType === "practice" ? "practice" : "today",
          tone: "grounded",
          ctaLabel: "Open",
          ctaAction: "open"
        },
        rankScore: input.rankScore ?? 0,
        reasonCode: input.reasonCode,
        state: "available",
        availableAt: createdAt
      },
      decision: input.decision,
      createdAt
    })
  };
}

export type ComposerReportSignalPrivateFeedInput = {
  id: string;
  userId: string;
  signal: AstrologyReportPublicSignal;
  voiceCard: ComposerVoiceCard;
  feedItemId?: string;
  rankScore?: number;
  createdAt?: string;
};

export function publishAstrologyReportSignalPrivateFeedItem(
  input: ComposerReportSignalPrivateFeedInput
): ComposerPrivateFeedPublishResult {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return publishComposerPrivateFeedItem({
    id: input.id,
    userId: input.userId,
    feedItemId: input.feedItemId,
    feedKind: "report_signal",
    rankScore: input.rankScore,
    reasonCode: "explicit_report_signal_publish",
    sourceCard: {
      id: `source_card:${input.signal.reportId}`,
      slug: `report-signal-${input.signal.requestId}`,
      title: input.signal.headline,
      bodyTemplate: input.signal.summary,
      cardType: "report_signal",
      topicTags: ["report", input.signal.reportType],
      symbolicTags: [],
      eligibilityRules: { requiresAuthenticatedUser: true, reportId: input.signal.reportId },
      safetyFlags: [],
      status: "active",
      createdAt,
      updatedAt: createdAt
    },
    voiceCard: input.voiceCard,
    decision: {
      decisionVersion: "report-signal-private-feed-v1",
      inputContextHash: `report:${input.signal.reportId}`,
      candidateIds: [`source_card:${input.signal.reportId}`],
      selectedCandidateId: `source_card:${input.signal.reportId}`,
      rankFeatures: {
        reportType: input.signal.reportType,
        boundary: input.signal.boundary,
        provenanceSummary: input.signal.provenanceSummary
      },
      suppressionReasons: [],
      safetyNotes: ["Raw private report sections are not included in this feed write."]
    },
    createdAt
  });
}
