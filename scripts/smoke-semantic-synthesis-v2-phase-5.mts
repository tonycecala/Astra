import assert from "node:assert/strict";

import {
  PHASE_5_CONTEXT_SAFETY_MINIMUM,
  PHASE_5_EVALUATION_VERSION,
  PHASE_5_REPETITION_SCORE_MINIMUM,
  PHASE_5_SEMANTIC_AVERAGE_MINIMUM,
  assertSignsOnlyEvidenceHasNoLeakage,
  crossChapterRepetition,
  evaluateReportDeterministically,
  evaluateSemanticGate,
  phase5SemanticCategories,
  sha256,
  validateRepetitionEvaluation,
  validateSemanticEvaluation,
  type Phase5RepetitionEvaluation,
  type Phase5SemanticEvaluation
} from "./lib/semantic-synthesis-v2-evaluation";

const identity = "A canonical Identity chapter grounded in the same natal chart truth.";
type ReportFixture = {
  status: "completed";
  sections: Array<{ title: string; body: string }>;
};

function report(
  family: "core" | "deep",
  overrides: Partial<ReportFixture> = {}
): ReportFixture {
  const titles = family === "core"
    ? ["Identity", "Relationships", "Work", "Integration"]
    : ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Integration"];
  const distinctConclusions: Record<string, string> = {
    Emotions: "Allow quiet weather to settle before naming its message.",
    Relationships: "Let mutual terms make affection and independence visible.",
    Work: "Direct patient craft toward one concrete contribution.",
    Drive: "Match available force to the actual scale of resistance.",
    Gifts: "Develop the promising capacity through deliberate practice.",
    "Blind Spots": "Separate observed facts from an attractive interpretation.",
    Growth: "Let fresh evidence revise an established self-concept.",
    Integration: "Choose by weighing which value deserves protection now."
  };
  return {
    status: "completed",
    sections: titles.map((title, index) => ({
      title,
      body: title === "Identity"
        ? identity
        : `${title} uses chart evidence for a distinct interpretive job number ${index}. ${distinctConclusions[title]}`
    })),
    ...overrides
  };
}

assert.equal(PHASE_5_EVALUATION_VERSION, "2.0.0-phase-5");
assert.equal(PHASE_5_SEMANTIC_AVERAGE_MINIMUM, 2.6);
assert.equal(PHASE_5_CONTEXT_SAFETY_MINIMUM, 2.8);
assert.equal(PHASE_5_REPETITION_SCORE_MINIMUM, 2);

const core = report("core");
const deep = report("deep");
const identityHash = sha256(identity);
assert.equal(evaluateReportDeterministically(core, {
  key: "control/core",
  family: "core",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).pass, true);
assert.equal(evaluateReportDeterministically(deep, {
  key: "control/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).pass, true);
assert.equal(crossChapterRepetition(deep).pass, true);

const biographyFailure = report("core", {
  sections: core.sections.map((section) => section.title === "Work"
    ? { ...section, body: "You learned early that your career would require this." }
    : section)
});
assert.ok(evaluateReportDeterministically(biographyFailure, {
  key: "biography/core",
  family: "core",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("invented biography"));

const contextFailure = report("core", {
  sections: core.sections.map((section) => section.title === "Relationships"
    ? { ...section, body: "Your partner is under strain in your relationship." }
    : section)
});
assert.ok(evaluateReportDeterministically(contextFailure, {
  key: "context/core",
  family: "core",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("relationship-context inference"));

const innerStateFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Blind Spots"
    ? { ...section, body: "You can sense someone’s hidden need before they say it." }
    : section)
});
assert.ok(evaluateReportDeterministically(innerStateFailure, {
  key: "inner-state/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("another-person inner-state claim"));

assert.equal(assertSignsOnlyEvidenceHasNoLeakage({ label: "Sun trine Saturn" }), true);
assert.equal(assertSignsOnlyEvidenceHasNoLeakage({ label: "Sun in the 12th house" }), false);

function semanticEvaluation(key: string, score = 3): Phase5SemanticEvaluation {
  return {
    key,
    scores: Object.fromEntries(phase5SemanticCategories.map((category) => [category, score])) as Record<
      (typeof phase5SemanticCategories)[number],
      number
    >,
    rationales: Object.fromEntries(phase5SemanticCategories.map((category) => [category, `${category} covered.`])) as Record<
      (typeof phase5SemanticCategories)[number],
      string
    >,
    offendingExcerpts: {}
  };
}

const semanticEvaluations = [semanticEvaluation("control/core"), semanticEvaluation("control/deep")];
const repetitionEvaluations: Phase5RepetitionEvaluation[] = [{
  key: "control/deep",
  score: 3,
  rationale: "Each chapter has a distinct mechanism and conclusion.",
  repeatedMechanisms: [],
  offendingExcerpts: []
}];
assert.deepEqual(validateSemanticEvaluation(["control/core", "control/deep"], semanticEvaluations), []);
assert.deepEqual(validateRepetitionEvaluation(["control/deep"], repetitionEvaluations), []);
assert.equal(evaluateSemanticGate(semanticEvaluations, repetitionEvaluations).pass, true);

const unsafeEvaluation = semanticEvaluation("control/deep");
unsafeEvaluation.scores.context_safety = 1;
assert.equal(evaluateSemanticGate([semanticEvaluation("control/core"), unsafeEvaluation], repetitionEvaluations).pass, false);

console.log("Semantic Synthesis V2 Phase 5 evaluator thresholds, hard-gate scans, repetition metric, and payload coverage checks passed.");
