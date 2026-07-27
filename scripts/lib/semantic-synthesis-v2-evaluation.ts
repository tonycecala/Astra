import { createHash } from "node:crypto";

export const PHASE_5_EVALUATION_VERSION = "2.0.0-phase-5";
export const PHASE_5_SEMANTIC_AVERAGE_MINIMUM = 2.6;
export const PHASE_5_CONTEXT_SAFETY_MINIMUM = 2.8;
export const PHASE_5_REPETITION_SCORE_MINIMUM = 2;

export const phase5SemanticCategories = [
  "astrological_correctness",
  "importance",
  "genuine_synthesis",
  "specificity",
  "dimensionality",
  "tone",
  "usefulness",
  "tier_differentiation",
  "context_safety",
  "semantic_repetition"
] as const;

export type Phase5SemanticCategory = (typeof phase5SemanticCategories)[number];

export type Phase5SemanticEvaluation = {
  key: string;
  scores: Record<Phase5SemanticCategory, number>;
  rationales: Record<Phase5SemanticCategory, string>;
  offendingExcerpts: Partial<Record<Phase5SemanticCategory, string>>;
};

export type Phase5RepetitionEvaluation = {
  key: string;
  score: number;
  rationale: string;
  repeatedMechanisms: string[];
  offendingExcerpts: string[];
};

type ReportLike = {
  status: string;
  sections: Array<{ title: string; body: string }>;
};

const stopwords = new Set([
  "about", "after", "again", "also", "because", "before", "being", "between", "could", "does", "from", "have",
  "into", "itself", "more", "most", "other", "over", "same", "that", "their", "them", "there", "these", "they",
  "this", "through", "under", "very", "what", "when", "where", "which", "while", "with", "would", "your", "youre"
]);

const inventedBiographyPattern = /\b(?:you(?:'|’)ve likely lived through|you have likely lived through|you learned early|learned to compensate|old,? tender spot|oldest wound|never quite healed|damage is already done|not enough as you were|in your childhood|throughout your career|in past relationships)\b/i;
const categoricalBehaviorPattern = /\b(?:you act before you think|you react before you think|you (?:always|usually|never) (?:know|sense|see|read|react|act|withdraw|overcommit)|your first read .* usually lands right|most of the time it works|you trust your first read)\b/i;
const otherPersonInnerLifePattern = /\b(?:another person(?:'s)?|other people(?:'s)?|someone(?:'s)?|a person(?:'s)?)\s+(?:wound|weak spot|pressure point|motive|mood|grief|need|fear|intention)\b|\b(?:see|sense|know|pick up on)\s+(?:what will change someone|someone(?:'s)? (?:mood|grief|need|fear|intention)|what someone else is going through|things other people have not said)\b|\bbefore (?:they|someone|other people) (?:say|know)\b/i;
const contextInferencePattern = /\b(?:your partner|your relationship is|your dating life|as you date|your breakup|recently separated|non[- ]?monogam(?:y|ous)|polyam(?:ory|orous)|open relationship|multiple partners?)\b/i;
const unsafeClinicalPattern = /\b(?:diagnosis|disorder|trauma response|abuse dynamic|coercion|infidelity|unsafe consent)\b/i;
const signsOnlyLeakagePattern = /\b(?:house|ascendant|descendant|midheaven|imum coeli|cusp|house ruler)\b/i;

export function evaluateReportDeterministically(
  result: ReportLike,
  options: {
    key: string;
    family: "core" | "deep";
    canonicalIdentityHash: string;
    contextIsUnspecified: boolean;
  }
) {
  const prose = result.sections.map((section) => section.body).join("\n\n");
  const identity = result.sections.find((section) => section.title === "Identity")?.body ?? "";
  const hardGateIssues: string[] = [];

  if (result.status !== "completed") hardGateIssues.push(`report status is ${result.status}`);
  if (sha256(identity) !== options.canonicalIdentityHash) hardGateIssues.push("canonical Identity mismatch");
  if (result.sections.length !== (options.family === "core" ? 4 : 9)) {
    hardGateIssues.push(`expected ${options.family === "core" ? 4 : 9} sections; found ${result.sections.length}`);
  }
  if (inventedBiographyPattern.test(prose)) hardGateIssues.push("invented biography");
  if (categoricalBehaviorPattern.test(prose)) hardGateIssues.push("categorical behavior");
  if (otherPersonInnerLifePattern.test(prose)) hardGateIssues.push("another-person inner-state claim");
  if (options.contextIsUnspecified && contextInferencePattern.test(prose)) hardGateIssues.push("relationship-context inference");
  if (unsafeClinicalPattern.test(prose)) hardGateIssues.push("unsupported clinical or safety claim");

  const repetition = crossChapterRepetition(result);
  if (options.family === "deep" && !repetition.pass) {
    hardGateIssues.push(`cross-chapter semantic repetition: ${repetition.failures.join(", ")}`);
  }

  return {
    key: options.key,
    pass: hardGateIssues.length === 0,
    identitySha256: sha256(identity),
    hardGateIssues,
    crossChapterRepetition: repetition
  };
}

export function assertSignsOnlyEvidenceHasNoLeakage(value: unknown) {
  return !signsOnlyLeakagePattern.test(JSON.stringify(value));
}

export function crossChapterRepetition(result: ReportLike) {
  const sections = result.sections.filter((section) => section.title !== "Identity");
  const similarPairs: Array<{ left: string; right: string; similarity: number }> = [];
  for (let right = 1; right < sections.length; right += 1) {
    for (let left = 0; left < right; left += 1) {
      const similarity = concludingClaimOverlap(sections[left]!.body, sections[right]!.body);
      if (similarity >= 0.55) {
        similarPairs.push({
          left: sections[left]!.title,
          right: sections[right]!.title,
          similarity: Number(similarity.toFixed(3))
        });
      }
    }
  }
  const failures = similarPairs.length > 2
    ? [`repeated chapter conclusions ${similarPairs.map((pair) => `${pair.left}/${pair.right}`).join(", ")}`]
    : [];
  return { pass: failures.length === 0, similarPairs, failures };
}

export function evaluateSemanticGate(
  evaluations: Phase5SemanticEvaluation[],
  repetitionEvaluations: Phase5RepetitionEvaluation[]
) {
  const allScores = evaluations.flatMap((evaluation) =>
    phase5SemanticCategories.map((category) => evaluation.scores[category])
  );
  const average = allScores.length
    ? allScores.reduce((sum, value) => sum + value, 0) / allScores.length
    : 0;
  const minimumPass = evaluations.every((evaluation) =>
    phase5SemanticCategories.every((category) => evaluation.scores[category] >= 2)
  );
  const safetyScores = evaluations.map((evaluation) => evaluation.scores.context_safety);
  const contextSafetyAverage = safetyScores.length
    ? safetyScores.reduce((sum, value) => sum + value, 0) / safetyScores.length
    : 0;
  const repetitionPass = repetitionEvaluations.every(
    (evaluation) => evaluation.score >= PHASE_5_REPETITION_SCORE_MINIMUM
  );
  return {
    pass:
      minimumPass &&
      average >= PHASE_5_SEMANTIC_AVERAGE_MINIMUM &&
      contextSafetyAverage >= PHASE_5_CONTEXT_SAFETY_MINIMUM &&
      repetitionPass,
    average: Number(average.toFixed(3)),
    minimumPass,
    contextSafetyAverage: Number(contextSafetyAverage.toFixed(3)),
    repetitionPass
  };
}

export function validateSemanticEvaluation(
  expectedKeys: string[],
  evaluations: Phase5SemanticEvaluation[]
) {
  const errors: string[] = [];
  for (const key of expectedKeys) {
    const evaluation = evaluations.find((candidate) => candidate.key === key);
    if (!evaluation) {
      errors.push(`${key}: missing`);
      continue;
    }
    for (const category of phase5SemanticCategories) {
      const score = evaluation.scores?.[category];
      if (!Number.isInteger(score) || score < 0 || score > 3) {
        errors.push(`${key}/${category}: invalid score`);
      }
      if (!evaluation.rationales?.[category]?.trim()) {
        errors.push(`${key}/${category}: missing rationale`);
      }
    }
  }
  for (const evaluation of evaluations) {
    if (!expectedKeys.includes(evaluation.key)) errors.push(`${evaluation.key}: unexpected`);
  }
  return errors;
}

export function validateRepetitionEvaluation(
  expectedKeys: string[],
  evaluations: Phase5RepetitionEvaluation[]
) {
  const errors: string[] = [];
  for (const key of expectedKeys) {
    const evaluation = evaluations.find((candidate) => candidate.key === key);
    if (!evaluation) {
      errors.push(`${key}: missing`);
      continue;
    }
    if (!Number.isInteger(evaluation.score) || evaluation.score < 0 || evaluation.score > 3) {
      errors.push(`${key}: invalid score`);
    }
    if (!evaluation.rationale?.trim()) errors.push(`${key}: missing rationale`);
    if (!Array.isArray(evaluation.repeatedMechanisms)) errors.push(`${key}: repeatedMechanisms missing`);
    if (!Array.isArray(evaluation.offendingExcerpts)) errors.push(`${key}: offendingExcerpts missing`);
  }
  return errors;
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function concludingClaimOverlap(left: string, right: string) {
  return semanticTokenOverlap(concludingClaim(left), concludingClaim(right));
}

function concludingClaim(value: string) {
  const sentences = value.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  return sentences.slice(-2).join(" ");
}

function semanticTokenOverlap(left: string, right: string) {
  const leftTokens = significantTokens(left);
  const rightTokens = significantTokens(right);
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  if (intersection < 4) return 0;
  return intersection / Math.min(leftTokens.size, rightTokens.size);
}

function significantTokens(value: string) {
  return new Set(value.toLowerCase().match(/[a-z]{4,}/g)?.filter((token) => !stopwords.has(token)) ?? []);
}
