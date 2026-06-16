import {
  type ComposerVoiceCard,
  type ComposerVoiceValidationError,
  composerVoiceCardSchema
} from "@astra/contracts";
import { composerVoiceRegistry, globalComposerBannedTerms, moralizingPatterns } from "./registry";

type VoiceViolation = ComposerVoiceValidationError["violations"][number];

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean);
}

function includesTerm(value: string, term: string) {
  return value.toLocaleLowerCase().includes(term.toLocaleLowerCase());
}

function bannedTermViolations(card: ComposerVoiceCard, terms: string[]): VoiceViolation[] {
  const violations: VoiceViolation[] = [];
  for (const field of ["header", "body"] as const) {
    for (const term of terms) {
      if (includesTerm(card[field], term)) {
        violations.push({ field, type: "BANNED_TERM", term });
      }
    }
  }
  return violations;
}

function moralizingViolations(card: ComposerVoiceCard): VoiceViolation[] {
  const violations: VoiceViolation[] = [];
  for (const field of ["header", "body"] as const) {
    if (moralizingPatterns.some((pattern) => includesTerm(card[field], pattern))) {
      violations.push({ field, type: "MORALIZING" });
    }
  }
  return violations;
}

export function validateComposerVoiceCard(input: unknown): { ok: true; card: ComposerVoiceCard } | ComposerVoiceValidationError {
  const parsed = composerVoiceCardSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "VOICE_VALIDATION_FAILED",
      voice_id: "guide",
      violations: parsed.error.issues.map((issue) => ({
        field: issue.path.includes("body") ? "body" : "header",
        type: "BANNED_TERM",
        term: issue.message
      }))
    };
  }

  const card = parsed.data;
  const voice = composerVoiceRegistry[card.voice.id];
  const violations: VoiceViolation[] = [];
  const headerWords = words(card.header).length;
  const bodyWords = words(card.body).length;

  if (headerWords > voice.headerMaxWords) {
    violations.push({ field: "header", type: "WORD_LIMIT", limit: voice.headerMaxWords, actual: headerWords });
  }

  if (bodyWords > voice.bodyMaxWords) {
    violations.push({ field: "body", type: "WORD_LIMIT", limit: voice.bodyMaxWords, actual: bodyWords });
  }

  violations.push(...bannedTermViolations(card, [...globalComposerBannedTerms, ...voice.avoidTerms]));
  violations.push(...moralizingViolations(card));

  if (violations.length) {
    return {
      ok: false,
      error: "VOICE_VALIDATION_FAILED",
      voice_id: card.voice.id,
      violations
    };
  }

  return { ok: true, card };
}
