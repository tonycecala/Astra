import {
  type AstraCard,
  type AstrologyReportPublicSignal,
  type ComposerArtifactRationale,
  type ComposerStreamArtifact,
  type ComposerVoiceCard,
  type ComposerVoiceValidationError,
  type StreamItem,
  composerStreamArtifactSchema
} from "@astra/contracts";
import { validateComposerVoiceCard } from "./voices/validateVoiceCard";

export type ComposerStreamPublishInput = {
  id: string;
  cardId: string;
  streamItemId: string;
  voiceCard: ComposerVoiceCard;
  lane?: AstraCard["lane"];
  tone?: AstraCard["tone"];
  rationale: ComposerArtifactRationale;
  ctaLabel?: string;
  ctaAction?: AstraCard["ctaAction"];
  kind?: StreamItem["kind"];
  position?: number;
  status?: StreamItem["status"];
  audience?: StreamItem["audience"];
  createdAt?: string;
};

export type ComposerStreamPublishResult =
  | { ok: true; artifact: ComposerStreamArtifact }
  | ComposerVoiceValidationError;

export function publishComposerStreamArtifact(input: ComposerStreamPublishInput): ComposerStreamPublishResult {
  const validation = validateComposerVoiceCard(input.voiceCard);
  if (!validation.ok) return validation;

  const createdAt = input.createdAt ?? new Date().toISOString();
  const card: AstraCard = {
    id: input.cardId,
    title: validation.card.header,
    body: validation.card.body,
    subtitle: input.rationale.reason,
    lane: input.lane ?? "today",
    tone: input.tone ?? "grounded",
    ctaLabel: input.ctaLabel,
    ctaAction: input.ctaAction,
    publishedAt: createdAt
  };
  const streamItem: StreamItem = {
    id: input.streamItemId,
    cardId: input.cardId,
    kind: input.kind ?? "card",
    position: input.position ?? 0,
    status: input.status ?? "published",
    audience: input.audience ?? "all"
  };

  return {
    ok: true,
    artifact: composerStreamArtifactSchema.parse({
      id: input.id,
      target: "stream",
      publisher: "composer",
      rationale: input.rationale,
      voiceCard: validation.card,
      card,
      streamItem,
      createdAt
    })
  };
}

export type ComposerReportSignalPublishInput = {
  id: string;
  cardId: string;
  streamItemId: string;
  signal: AstrologyReportPublicSignal;
  voiceCard: ComposerVoiceCard;
  position?: number;
  status?: StreamItem["status"];
  audience?: StreamItem["audience"];
  createdAt?: string;
};

export function publishAstrologyReportSignalArtifact(
  input: ComposerReportSignalPublishInput
): ComposerStreamPublishResult {
  return publishComposerStreamArtifact({
    id: input.id,
    cardId: input.cardId,
    streamItemId: input.streamItemId,
    voiceCard: input.voiceCard,
    lane: "know_yourself",
    tone: input.signal.tone,
    rationale: {
      reason: input.signal.provenanceSummary,
      source: "chart_result"
    },
    ctaLabel: "Open",
    ctaAction: "open",
    kind: "artifact",
    position: input.position,
    status: input.status,
    audience: input.audience,
    createdAt: input.createdAt
  });
}
