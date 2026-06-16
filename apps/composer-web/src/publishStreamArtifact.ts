import {
  type AstraCard,
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
  ctaLabel?: string;
  ctaAction?: AstraCard["ctaAction"];
  position?: number;
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
    lane: input.lane ?? "today",
    tone: input.tone ?? "grounded",
    ctaLabel: input.ctaLabel,
    ctaAction: input.ctaAction,
    publishedAt: createdAt
  };
  const streamItem: StreamItem = {
    id: input.streamItemId,
    cardId: input.cardId,
    kind: "card",
    position: input.position ?? 0,
    status: "draft",
    audience: input.audience ?? "all"
  };

  return {
    ok: true,
    artifact: composerStreamArtifactSchema.parse({
      id: input.id,
      target: "stream",
      publisher: "composer",
      voiceCard: validation.card,
      card,
      streamItem,
      createdAt
    })
  };
}
