import type { ComposerVoiceId } from "@astra/contracts";

export type ComposerVoiceDefinition = {
  id: ComposerVoiceId;
  temperature: number;
  headerMaxWords: number;
  bodyMaxWords: number;
  avoidTerms: string[];
};

export const composerVoiceRegistry = {
  guide: {
    id: "guide",
    temperature: 0.2,
    headerMaxWords: 14,
    bodyMaxWords: 40,
    avoidTerms: ["must", "shouldn't", "shame"]
  },
  companion: {
    id: "companion",
    temperature: 0.4,
    headerMaxWords: 14,
    bodyMaxWords: 45,
    avoidTerms: ["blame", "shame", "moralize"]
  },
  prompt: {
    id: "prompt",
    temperature: 0.1,
    headerMaxWords: 14,
    bodyMaxWords: 30,
    avoidTerms: ["always", "never", "should"]
  }
} satisfies Record<ComposerVoiceId, ComposerVoiceDefinition>;

export const globalComposerBannedTerms = [
  "shame",
  "blame",
  "guilt",
  "failed",
  "wrong",
  "you need to",
  "you must",
  "you should have"
];

export const moralizingPatterns = [
  "you failed",
  "you are wrong",
  "you need to",
  "you must",
  "you should have",
  "should feel bad",
  "feel guilty"
];
