import { createHash } from "node:crypto";
import { reportRuleCatalog } from "../../packages/astrology/src/report/rules/catalog";
import { hasAffirmedClaim, reportDetectors } from "../../packages/astrology/src/report/rules/detectors";

export const PHASE_5_EVALUATION_VERSION = "2.0.0-phase-5";
export const PHASE_5_SEMANTIC_AVERAGE_MINIMUM = reportRuleCatalog.evaluation.semanticAverageMinimum;
export const PHASE_5_CONTEXT_SAFETY_MINIMUM = reportRuleCatalog.evaluation.contextSafetyMinimum;
export const PHASE_5_REPETITION_SCORE_MINIMUM = reportRuleCatalog.evaluation.repetitionScoreMinimum;

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

const inventedBiographyPattern = reportDetectors.inventedBiography;
const categoricalBehaviorPattern = reportDetectors.categoricalBehavior;
const unsupportedScenarioPattern = reportDetectors.unsupportedScenario;
const otherPersonInnerLifePattern = reportDetectors.otherPersonInnerLife;
const contextInferencePattern = reportDetectors.contextInference;
const unsafeClinicalPattern = reportDetectors.unsafeClinical;
const signsOnlyLeakagePattern = reportDetectors.signsOnlyLeakage;
const unnecessaryOrbPrecisionPattern = reportDetectors.unnecessaryOrbPrecision;
const impliedNatalActivationPattern = reportDetectors.impliedNatalActivation;
const personalActivationQualitativeOverreachPattern = reportDetectors.personalActivationQualitativeOverreach;
const aspectChainInventionPattern = reportDetectors.aspectChainInvention;
const rulershipAsAspectPattern = reportDetectors.rulershipAsAspect;
const genericDispositorChainPattern = reportDetectors.genericDispositorChain;
const privilegedPerceptionPattern = reportDetectors.privilegedPerception;
const categoricalCertaintyOrChangePattern = reportDetectors.categoricalCertaintyOrChange;

export function evaluateReportDeterministically(
  result: ReportLike,
  options: {
    key: string;
    family: "core" | "deep";
    canonicalIdentityHash: string;
    contextIsUnspecified: boolean;
    historicalControl?: boolean;
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
  if (!options.historicalControl && unsupportedScenarioPattern.test(prose)) hardGateIssues.push("invented routine, history, or categorical scenario");
  if (otherPersonInnerLifePattern.test(prose)) hardGateIssues.push("another-person inner-state claim");
  if (options.contextIsUnspecified && contextInferencePattern.test(prose)) hardGateIssues.push("relationship-context inference");
  if (unsafeClinicalPattern.test(prose)) hardGateIssues.push("unsupported clinical or safety claim");
  if (!options.historicalControl && unnecessaryOrbPrecisionPattern.test(prose)) hardGateIssues.push("unnecessary orb precision");
  if (!options.historicalControl && impliedNatalActivationPattern.test(prose)) hardGateIssues.push("natal activation presented as current timing");
  if (!options.historicalControl && personalActivationQualitativeOverreachPattern.test(prose)) hardGateIssues.push("personal activation qualitative overreach");
  if (!options.historicalControl && aspectChainInventionPattern.test(prose)) hardGateIssues.push("rulership or dispositor chain rewritten as an aspect");
  if (!options.historicalControl && rulershipAsAspectPattern.test(prose)) hardGateIssues.push("rulership or dispositor relationship labeled as an aspect");
  if (!options.historicalControl && genericDispositorChainPattern.test(prose)) hardGateIssues.push("generic dispositor-chain narration");
  if (!options.historicalControl && hasAffirmedClaim(prose, privilegedPerceptionPattern)) hardGateIssues.push("privileged social perception inferred from symbolic evidence");
  if (!options.historicalControl && categoricalCertaintyOrChangePattern.test(prose)) hardGateIssues.push("rapid certainty, wholesale change, or established self-correction inferred");
  const drive = result.sections.find((section) => section.title === "Drive")?.body ?? "";
  if (!options.historicalControl && reportDetectors.driveWorkAllocationRepetition.test(drive)) {
    hardGateIssues.push("Drive repeats Work's task-importance or allocation conclusion instead of owning force and pacing.");
  }

  const repetition = crossChapterRepetition(result);
  if (!options.historicalControl && options.family === "deep" && !repetition.pass) {
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
  const repeatedFramePairs: Array<{ left: string; right: string; frames: string[] }> = [];
  const framesBySection = new Map(sections.map((section) => [section.title, astrologicalFrames(section.body)]));
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
      const leftFrames = framesBySection.get(sections[left]!.title) ?? new Set<string>();
      const rightFrames = framesBySection.get(sections[right]!.title) ?? new Set<string>();
      const sharedFrames = [...leftFrames].filter((frame) => rightFrames.has(frame));
      if (sharedFrames.length >= 2) {
        repeatedFramePairs.push({
          left: sections[left]!.title,
          right: sections[right]!.title,
          frames: sharedFrames
        });
      }
    }
  }
  const frameChapterCounts = new Map<string, Set<string>>();
  for (const [title, frames] of framesBySection) {
    for (const frame of frames) {
      const owners = frameChapterCounts.get(frame) ?? new Set<string>();
      owners.add(title);
      frameChapterCounts.set(frame, owners);
    }
  }
  const saturatedFrames = [...frameChapterCounts]
    .filter(([, owners]) => owners.size >= 3)
    .map(([frame, owners]) => ({ frame, chapters: [...owners] }));
  const failures = [
    ...(similarPairs.length > 2
      ? [`repeated chapter conclusions ${similarPairs.map((pair) => `${pair.left}/${pair.right}`).join(", ")}`]
      : []),
    ...(repeatedFramePairs.length
      ? [`repeated astrological framing ${repeatedFramePairs.map((pair) => `${pair.left}/${pair.right}`).join(", ")}`]
      : []),
    ...(saturatedFrames.length
      ? [`saturated astrological roots ${saturatedFrames.map((entry) => `${entry.frame} (${entry.chapters.join("/")})`).join(", ")}`]
      : [])
  ];
  return { pass: failures.length === 0, similarPairs, repeatedFramePairs, saturatedFrames, failures };
}

export function evaluateSemanticGate(
  evaluations: Phase5SemanticEvaluation[],
  repetitionEvaluations: Phase5RepetitionEvaluation[],
  options: {
    historicalKeys?: string[];
    semanticAverageMinimum?: number;
    contextSafetyAverageMinimum?: number | null;
    minimumCategories?: readonly Phase5SemanticCategory[];
    repetitionScoreMinimum?: number;
  } = {}
) {
  const historicalKeys = new Set(options.historicalKeys ?? []);
  const semanticAverageMinimum = options.semanticAverageMinimum ?? PHASE_5_SEMANTIC_AVERAGE_MINIMUM;
  const contextSafetyAverageMinimum = options.contextSafetyAverageMinimum === undefined
    ? PHASE_5_CONTEXT_SAFETY_MINIMUM
    : options.contextSafetyAverageMinimum;
  const minimumCategories = options.minimumCategories ?? phase5SemanticCategories;
  const repetitionScoreMinimum = options.repetitionScoreMinimum ?? PHASE_5_REPETITION_SCORE_MINIMUM;
  const candidateEvaluations = evaluations.filter((evaluation) => !historicalKeys.has(evaluation.key));
  const candidateRepetitionEvaluations = repetitionEvaluations.filter((evaluation) =>
    !historicalKeys.has(evaluation.key)
  );
  const allScores = candidateEvaluations.flatMap((evaluation) =>
    phase5SemanticCategories.map((category) => evaluation.scores[category])
  );
  const average = allScores.length
    ? allScores.reduce((sum, value) => sum + value, 0) / allScores.length
    : 0;
  const minimumPass = candidateEvaluations.length > 0 && candidateEvaluations.every((evaluation) =>
    minimumCategories.every((category) => evaluation.scores[category] >= 2)
  );
  const safetyScores = candidateEvaluations.map((evaluation) => evaluation.scores.context_safety);
  const contextSafetyAverage = safetyScores.length
    ? safetyScores.reduce((sum, value) => sum + value, 0) / safetyScores.length
    : 0;
  const repetitionPass = candidateRepetitionEvaluations.length > 0 && candidateRepetitionEvaluations.every(
    (evaluation) => evaluation.score >= repetitionScoreMinimum
  );
  const contextSafetyAveragePass = contextSafetyAverageMinimum === null || contextSafetyAverage >= contextSafetyAverageMinimum;
  return {
    pass:
      minimumPass &&
      average >= semanticAverageMinimum &&
      contextSafetyAveragePass &&
      repetitionPass,
    average: Number(average.toFixed(3)),
    minimumPass,
    contextSafetyAverage: Number(contextSafetyAverage.toFixed(3)),
    contextSafetyAveragePass,
    repetitionPass,
    thresholds: {
      semanticAverage: semanticAverageMinimum,
      contextSafetyAverage: contextSafetyAverageMinimum,
      minimumCategories,
      minimumCategoryScore: 2,
      repetitionScore: repetitionScoreMinimum
    },
    candidateKeys: candidateEvaluations.map((evaluation) => evaluation.key),
    historicalKeys: evaluations.filter((evaluation) => historicalKeys.has(evaluation.key))
      .map((evaluation) => evaluation.key)
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

function astrologicalFrames(value: string) {
  const frames = new Set<string>();
  const body = "(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|North Node|South Node|Ascendant|Midheaven)";
  const sign = "(?:Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)";
  const aspect = "(?:conjunct(?:ion)?|trine|sextile|square|oppos(?:e|es|ition)|quincunx)";
  for (const match of value.matchAll(new RegExp(`\\b(${body})\\s+in\\s+(${sign})(?:\\s+in\\s+(?:your\\s+|the\\s+)?(?:\\d+(?:st|nd|rd|th)?|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\\s+house)?`, "gi"))) {
    frames.add(match[0]!.toLowerCase().replace(/\byour\b|\bthe\b/g, "").replace(/\s+/g, " ").trim());
  }
  for (const match of value.matchAll(new RegExp(`\\b(${body})\\s+(${aspect})\\s+(?:to\\s+|with\\s+)?(${body})\\b`, "gi"))) {
    const endpoints = [match[1]!.toLowerCase(), match[3]!.toLowerCase()].sort();
    frames.add(`${endpoints[0]} ${match[2]!.toLowerCase()} ${endpoints[1]}`);
  }
  for (const match of value.matchAll(new RegExp(`\\b(${aspect})\\s+between\\s+(${body})\\s+and\\s+(${body})\\b`, "gi"))) {
    const endpoints = [match[2]!.toLowerCase(), match[3]!.toLowerCase()].sort();
    frames.add(`${endpoints[0]} ${match[1]!.toLowerCase()} ${endpoints[1]}`);
  }
  for (const match of value.matchAll(/\b(?:t[- ]square|stellium|conjunction cluster|final dispositor|dispositor chain)\b/gi)) {
    frames.add(match[0]!.toLowerCase().replace(/\s+/g, " "));
  }
  return frames;
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
