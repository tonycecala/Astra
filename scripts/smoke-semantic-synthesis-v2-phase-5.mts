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

const familyHistoryFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Emotions"
    ? { ...section, body: "Your early home life taught you to preserve the emotional truth of the household." }
    : section)
});
assert.ok(evaluateReportDeterministically(familyHistoryFailure, {
  key: "family-history/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("invented biography"));

const socialEffectFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Gifts"
    ? { ...section, body: "People lean in and rely on you when a group needs direction." }
    : section)
});
assert.ok(evaluateReportDeterministically(socialEffectFailure, {
  key: "social-effect/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("another-person inner-state claim"));

const orbPrecisionFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Drive"
    ? { ...section, body: "Mars square Neptune is less than one degree from exact." }
    : section)
});
assert.ok(evaluateReportDeterministically(orbPrecisionFailure, {
  key: "orb-precision/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("unnecessary orb precision"));
assert.equal(evaluateReportDeterministically(orbPrecisionFailure, {
  key: "historical-orb/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true,
  historicalControl: true
}).hardGateIssues.includes("unnecessary orb precision"), false);

const orbDisclaimerFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Gifts"
    ? { ...section, body: "Uranus conjunct Neptune is present, without any claim about its intensity or precision." }
    : section)
});
assert.ok(evaluateReportDeterministically(orbDisclaimerFailure, {
  key: "orb-disclaimer/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("unnecessary orb precision"));

const genericDispositorChainFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Gifts"
    ? { ...section, body: "The dispositor chain shows how planets hand off their expression through sign rulership." }
    : section)
});
assert.ok(evaluateReportDeterministically(genericDispositorChainFailure, {
  key: "generic-dispositor-chain/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("generic dispositor-chain narration"));

const marissaLunarChainFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Relationships"
    ? { ...section, body: "The chain tracing back to Chiron suggests this reciprocity pattern is not automatic or fully settled." }
    : section)
});
assert.ok(evaluateReportDeterministically(marissaLunarChainFailure, {
  key: "marissa-lunar-chain/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("generic dispositor-chain narration"));

for (const validDirectRulership of [
  "The Moon is disposed by Jupiter.",
  "Jupiter is the Moon's dispositor.",
  "Saturn is the final dispositor."
]) {
  const validDirectRulershipReport = report("deep", {
    sections: deep.sections.map((section) => section.title === "Relationships"
      ? { ...section, body: validDirectRulership }
      : section)
  });
  assert.equal(evaluateReportDeterministically(validDirectRulershipReport, {
    key: "valid-direct-rulership/deep",
    family: "deep",
    canonicalIdentityHash: identityHash,
    contextIsUnspecified: true
  }).hardGateIssues.includes("generic dispositor-chain narration"), false);
}

const currentActivationFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Growth"
    ? { ...section, body: "A personal activation means this energy is currently pressing on something close to you." }
    : section)
});
assert.ok(evaluateReportDeterministically(currentActivationFailure, {
  key: "activation/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("natal activation presented as current timing"));

const qualitativeActivationFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Gifts"
    ? { ...section, body: "Uranus carries personal activation in this chart. This suggests unpredictability or inspiration that can clarify or destabilize the Venus pattern." }
    : section)
});
assert.ok(evaluateReportDeterministically(qualitativeActivationFailure, {
  key: "qualitative-activation/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("personal activation qualitative overreach"));

const aspectChainFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Emotions"
    ? { ...section, body: "An opposition links this lunar dispositor chain to Chiron." }
    : section)
});
assert.ok(evaluateReportDeterministically(aspectChainFailure, {
  key: "aspect-chain/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("rulership or dispositor chain rewritten as an aspect"));

const rulershipLabeledAsAspectFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Gifts"
    ? { ...section, body: "Pluto is disposed by Mars, a square aspect." }
    : section)
});
assert.ok(evaluateReportDeterministically(rulershipLabeledAsAspectFailure, {
  key: "rulership-labeled-as-aspect/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("rulership or dispositor relationship labeled as an aspect"));

const privilegedPerceptionFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Blind Spots"
    ? { ...section, body: "Neptune sextile Pluto sharpens your read of hidden group undercurrents." }
    : section)
});
assert.ok(evaluateReportDeterministically(privilegedPerceptionFailure, {
  key: "privileged-perception/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("privileged social perception inferred from symbolic evidence"));

const marissaNeptunePlutoPerceptionFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Blind Spots"
    ? {
        ...section,
        body: "Pluto's intensity can shape how you read a room or friend group. Neptune sextile Pluto can make a first impression feel complete and convincing. The feeling of knowing can arrive fast."
      }
    : section)
});
assert.ok(evaluateReportDeterministically(marissaNeptunePlutoPerceptionFailure, {
  key: "marissa-neptune-pluto-perception/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("privileged social perception inferred from symbolic evidence"));

for (const boundedPerception of [
  "Pluto in the eleventh house may make group matters feel important.",
  "Neptune sextile Pluto does not establish accurate perception.",
  "A strong impression is not proof of accuracy.",
  "This aspect does not confirm that you read hidden group dynamics accurately.",
  "It does not mean your first impression is complete or convincing."
]) {
  const boundedPerceptionReport = report("deep", {
    sections: deep.sections.map((section) => section.title === "Blind Spots"
      ? { ...section, body: boundedPerception }
      : section)
  });
  assert.equal(evaluateReportDeterministically(boundedPerceptionReport, {
    key: "bounded-perception/deep",
    family: "deep",
    canonicalIdentityHash: identityHash,
    contextIsUnspecified: true
  }).hardGateIssues.includes("privileged social perception inferred from symbolic evidence"), false);
}

const certaintyFailure = report("deep", {
  sections: deep.sections.map((section) => section.title === "Growth"
    ? { ...section, body: "That part of you already knows how to check a read before acting on it." }
    : section)
});
assert.ok(evaluateReportDeterministically(certaintyFailure, {
  key: "certainty/deep",
  family: "deep",
  canonicalIdentityHash: identityHash,
  contextIsUnspecified: true
}).hardGateIssues.includes("rapid certainty, wholesale change, or established self-correction inferred"));

const repeatedFramingFailure = report("deep", {
  sections: deep.sections.map((section) => {
    if (section.title === "Work") {
      return { ...section, body: "Mars in Cancer in the fifth house works through a final dispositor. Saturn square Mars sets the pace." };
    }
    if (section.title === "Drive") {
      return { ...section, body: "Mars in Cancer in the fifth house returns to the final dispositor. Saturn square Mars sets proportion." };
    }
    return section;
  })
});
assert.equal(crossChapterRepetition(repeatedFramingFailure).pass, false);

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

const historicalEvaluation = semanticEvaluation("tony/deep", 1);
const historicalRepetition: Phase5RepetitionEvaluation = {
  key: "tony/deep",
  score: 1,
  rationale: "Historical comparison retains its original weaknesses.",
  repeatedMechanisms: ["historical mechanism"],
  offendingExcerpts: ["historical excerpt"]
};
const candidateGateWithHistoricalControl = evaluateSemanticGate(
  [...semanticEvaluations, historicalEvaluation],
  [...repetitionEvaluations, historicalRepetition],
  { historicalKeys: ["tony/deep"] }
);
assert.equal(candidateGateWithHistoricalControl.pass, true);
assert.deepEqual(candidateGateWithHistoricalControl.candidateKeys, ["control/core", "control/deep"]);
assert.deepEqual(candidateGateWithHistoricalControl.historicalKeys, ["tony/deep"]);
assert.deepEqual(
  validateSemanticEvaluation(
    ["control/core", "control/deep", "tony/deep"],
    [...semanticEvaluations, historicalEvaluation]
  ),
  [],
  "Historical controls remain mandatory evaluator coverage even when excluded from candidate thresholds."
);

console.log("Semantic Synthesis V2 Phase 5 evaluator thresholds, hard-gate scans, repetition metric, and payload coverage checks passed.");
