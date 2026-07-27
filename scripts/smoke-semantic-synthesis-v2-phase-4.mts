import assert from "node:assert/strict";

import {
  ASTRA_CANONICAL_IDENTITY_COMPLEX_LIMIT,
  ASTRA_CORE_MEANING_COMPLEX_LIMIT,
  ASTRA_DEEP_MEANING_COMPLEX_LIMIT,
  ASTRA_V2_PHASE_3_RULESET_VERSION,
  ASTRA_V2_PHASE_4_RULESET_VERSION,
  buildAstrologyMeaningComplexNetwork,
  buildAstrologyMeaningComplexReportViews,
  buildAstrologyReportSectionEvidence,
  selectMeaningComplexReportViews,
  type MeaningComplexNetwork
} from "@astra/astrology";
import {
  astrologyReportRequestSchema,
  type AstrologyReportRequest
} from "@astra/contracts";

const birthData = {
  date: "1961-05-23",
  time: "09:30",
  birthTimeKnown: true,
  timezone: "America/New_York",
  location: "New York, NY, USA",
  latitude: 40.7127281,
  longitude: -74.0060152
} as const;

const personHeadings = {
  identity: ["Identity"],
  core: ["Identity", "Relationships", "Work", "Integration"],
  deep: ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Integration"]
} as const;

function request(
  reportType: "identity" | "core" | "deep",
  context?: AstrologyReportRequest["context"],
  calculationMode: "full" | "signs-aspects-only" = "full"
) {
  const scopedBirthData = calculationMode === "full"
    ? birthData
    : {
        date: birthData.date,
        time: birthData.time,
        birthTimeKnown: true,
        timezone: birthData.timezone
      };
  return astrologyReportRequestSchema.parse({
    id: "phase4-tony-control",
    userId: "phase4-user",
    chartRequestId: "phase4-chart",
    reportType,
    subjectName: "Tony Phase 4 Control",
    birthData: scopedBirthData,
    ...(context ? { context } : {}),
    source: "self",
    boundary: "private",
    status: "queued",
    costCredits: reportType === "identity" ? 1 : reportType === "core" ? 5 : 10,
    createdAt: "2026-07-26T12:00:00.000Z",
    updatedAt: "2026-07-26T12:00:00.000Z",
    reportBasis: {
      schemaVersion: 2,
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      primary: {
        chartRequestId: "phase4-chart",
        subjectType: "self",
        subjectId: "phase4-user",
        subjectName: "Tony Phase 4 Control",
        birthData: scopedBirthData,
        calculationMode
      }
    }
  });
}

const deepRequest = request("deep");
const network = buildAstrologyMeaningComplexNetwork(deepRequest);
const views = buildAstrologyMeaningComplexReportViews(deepRequest);
assert.ok(views);
assert.equal(views.rulesetVersion, ASTRA_V2_PHASE_4_RULESET_VERSION);
assert.equal(views.networkRulesetVersion, ASTRA_V2_PHASE_3_RULESET_VERSION);
assert.deepEqual(
  views,
  buildAstrologyMeaningComplexReportViews(deepRequest),
  "Phase 4 selection must be deterministic for identical input."
);

const networkComplexIds = new Set(network.complexes.map((complex) => complex.id));
assert.ok(views.canonicalIdentityComplexIds.length > 0);
assert.ok(views.canonicalIdentityComplexIds.length <= ASTRA_CANONICAL_IDENTITY_COMPLEX_LIMIT);
assert.ok(views.canonicalIdentityComplexIds.some((id) =>
  network.complexes.find((complex) => complex.id === id)?.seedNodeIds.includes("point:sun")
));
assert.ok(views.canonicalIdentityComplexIds.some((id) =>
  network.complexes.find((complex) => complex.id === id)?.seedNodeIds.includes("point:moon")
));
assert.ok(views.canonicalIdentityComplexIds.every((id) => networkComplexIds.has(id)));
assert.deepEqual(views.identity.canonicalIdentityComplexIds, views.canonicalIdentityComplexIds);
assert.deepEqual(views.core.canonicalIdentityComplexIds, views.canonicalIdentityComplexIds);
assert.deepEqual(views.deep.canonicalIdentityComplexIds, views.canonicalIdentityComplexIds);
assert.deepEqual(
  views.identity.chapters[0],
  views.core.chapters.find((chapter) => chapter.title === "Identity")
);
assert.deepEqual(
  views.identity.chapters[0],
  views.deep.chapters.find((chapter) => chapter.title === "Identity")
);

assert.equal(views.core.selectedComplexIds.length, ASTRA_CORE_MEANING_COMPLEX_LIMIT);
assert.equal(new Set(views.core.selectedComplexIds).size, views.core.selectedComplexIds.length);
assert.deepEqual(
  views.core.chapters.map((chapter) => chapter.title),
  personHeadings.core
);
assert.equal(
  new Set(views.core.chapters.filter((chapter) => chapter.title !== "Identity").map((chapter) => chapter.primaryComplexId)).size,
  ASTRA_CORE_MEANING_COMPLEX_LIMIT,
  "Core must assign one distinct primary complex to each non-Identity chapter."
);

assert.ok(views.deep.selectedComplexIds.length >= 5);
assert.ok(views.deep.selectedComplexIds.length <= ASTRA_DEEP_MEANING_COMPLEX_LIMIT);
assert.ok(views.deep.selectedComplexIds.length > views.core.selectedComplexIds.length);
assert.ok(views.core.selectedComplexIds.every((id) => views.deep.selectedComplexIds.includes(id)));
assert.ok(views.deep.selectedComplexIds.every((id) => networkComplexIds.has(id)));
assert.deepEqual(
  views.deep.chapters.map((chapter) => chapter.title),
  personHeadings.deep
);
assert.ok(
  new Set(views.deep.chapters.map((chapter) => chapter.primaryComplexId)).size >= 6,
  "Deep must use a materially broader set of primary complexes than Core."
);
assert.ok(
  views.deep.chapters
    .filter((chapter) => chapter.title !== "Identity")
    .every((chapter) => views.deep.selectedComplexIds.includes(chapter.primaryComplexId))
);
assert.ok(
  views.deep.selectedComplexIds.every((id) =>
    views.deep.chapters.some((chapter) => chapter.primaryComplexId === id)
  ),
  "Every selected Deep complex must do a visible chapter job."
);
for (const primaryComplexId of new Set(views.deep.chapters.map((chapter) => chapter.primaryComplexId))) {
  const repeatedUses: Array<(typeof views.deep.chapters)[number]> = views.deep.chapters.filter(
    (chapter) => chapter.primaryComplexId === primaryComplexId
  );
  assert.equal(
    new Set(repeatedUses.map((chapter) => chapter.interpretiveJob)).size,
    repeatedUses.length,
    "A shared Deep root must receive a distinct interpretive job in every chapter."
  );
}

const identityEvidence = buildAstrologyReportSectionEvidence(
  request("identity"),
  personHeadings.identity
)[0];
const coreIdentityEvidence = buildAstrologyReportSectionEvidence(
  request("core"),
  personHeadings.core
).find((section) => section.title === "Identity");
const deepIdentityEvidence = buildAstrologyReportSectionEvidence(
  deepRequest,
  personHeadings.deep
).find((section) => section.title === "Identity");
assert.ok(identityEvidence);
assert.deepEqual(coreIdentityEvidence, identityEvidence);
assert.deepEqual(deepIdentityEvidence, identityEvidence);

const singleContext = {
  relationshipContext: {
    status: "single",
    condition: "unspecified",
    structure: "unspecified",
    intention: "open_to_connection",
    recency: "unspecified",
    partnerPronouns: null,
    notes: null
  }
} as const;
const partneredContext = {
  relationshipContext: {
    status: "partnered",
    condition: "strained",
    structure: "other",
    intention: "discern",
    recency: "established",
    partnerPronouns: null,
    notes: null
  }
} as const;
const singleViews = buildAstrologyMeaningComplexReportViews(request("deep", singleContext));
const partneredViews = buildAstrologyMeaningComplexReportViews(request("deep", partneredContext));
assert.ok(singleViews);
assert.ok(partneredViews);
assert.deepEqual(singleViews.canonicalIdentityComplexIds, partneredViews.canonicalIdentityComplexIds);
assert.deepEqual(singleViews.identity, partneredViews.identity);
assert.deepEqual(
  buildAstrologyReportSectionEvidence(request("deep", singleContext), personHeadings.deep)
    .find((section) => section.title === "Identity"),
  buildAstrologyReportSectionEvidence(request("deep", partneredContext), personHeadings.deep)
    .find((section) => section.title === "Identity"),
  "Relationship context may change application, never canonical Identity evidence."
);

const legacyRequest = astrologyReportRequestSchema.parse({
  id: "phase4-legacy",
  userId: "phase4-user",
  chartRequestId: "phase4-chart",
  reportType: "core",
  subjectName: "Tony",
  birthData,
  source: "self",
  boundary: "private",
  status: "queued",
  costCredits: 5,
  createdAt: "2026-07-26T12:00:00.000Z",
  updatedAt: "2026-07-26T12:00:00.000Z"
});
assert.deepEqual(
  buildAstrologyReportSectionEvidence(legacyRequest, personHeadings.core),
  [
    {
      title: "Identity",
      evidenceBullets: [
        { label: "Sun in Gemini in the 12th house", meaning: "Sun; Gemini; 12th house" },
        { label: "Sun trine Saturn", meaning: "Sun; trine; Saturn; orb 2.5 degrees" },
        { label: "Sun square Pluto", meaning: "Sun; square; Pluto; orb 3.4 degrees" },
        { label: "Sun square Chiron", meaning: "Sun; square; Chiron; orb 4.8 degrees" }
      ]
    },
    {
      title: "Relationships",
      evidenceBullets: [
        { label: "Mars square Neptune", meaning: "Mars; square; Neptune; orb 0 degrees" },
        { label: "Venus trine Uranus", meaning: "Venus; trine; Uranus; orb 1.7 degrees" },
        { label: "Mercury sextile Venus", meaning: "Mercury; sextile; Venus; orb 2.9 degrees" },
        { label: "Venus in Aries in the 10th house", meaning: "Venus; Aries; 10th house" }
      ]
    },
    {
      title: "Work",
      evidenceBullets: [
        { label: "Mercury sextile Uranus", meaning: "Mercury; sextile; Uranus; orb 1.2 degrees" },
        { label: "Mars opposition Jupiter", meaning: "Mars; opposition; Jupiter; orb 2.2 degrees" },
        { label: "2nd house emphasis", meaning: "2nd house; 2 placements" },
        { label: "Mercury in Gemini in the 12th house", meaning: "Mercury; Gemini; 12th house" }
      ]
    },
    {
      title: "Integration",
      evidenceBullets: [
        { label: "Sun in Gemini in the 12th house", meaning: "Sun; Gemini; 12th house" },
        { label: "Moon in Virgo in the 3rd house", meaning: "Moon; Virgo; 3rd house" },
        { label: "Ascendant in Cancer", meaning: "Ascendant; Cancer" }
      ]
    }
  ],
  "A legacy request that receives no V2 complexes must retain the exact V1 evidence cards."
);

const emptyNetwork: MeaningComplexNetwork = {
  rulesetVersion: ASTRA_V2_PHASE_3_RULESET_VERSION,
  calculationMode: "full",
  nodes: [],
  edges: [],
  complexes: [],
  audit: {
    seedNodeIds: [],
    suppressedSeedNodeIds: [],
    suppressedSeedReasons: {},
    collapsedEvidenceAliasCount: 0,
    maximumObservedPathDepth: 0
  }
};
assert.equal(selectMeaningComplexReportViews(emptyNetwork), null);

const modernEvidence = buildAstrologyReportSectionEvidence(deepRequest, personHeadings.deep);
assert.ok(modernEvidence.every((section) => section.evidenceBullets.length > 0));
assert.notDeepEqual(
  modernEvidence.find((section) => section.title === "Emotions"),
  modernEvidence.find((section) => section.title === "Growth"),
  "A shared Neptune root must not receive the same evidence packet in Emotions and Growth."
);
assert.notDeepEqual(
  modernEvidence.find((section) => section.title === "Work"),
  modernEvidence.find((section) => section.title === "Blind Spots"),
  "A shared configuration must not receive the same evidence packet in Work and Blind Spots."
);
assert.notDeepEqual(
  modernEvidence.find((section) => section.title === "Relationships"),
  buildAstrologyReportSectionEvidence(legacyRequest, personHeadings.core)
    .find((section) => section.title === "Relationships"),
  "A V2 natal report must consume selected meaning-complex evidence through the existing card path."
);

const signsOnlyEvidence = buildAstrologyReportSectionEvidence(
  request("deep", undefined, "signs-aspects-only"),
  personHeadings.deep
);
for (const section of signsOnlyEvidence) {
  const text = JSON.stringify(section);
  assert.doesNotMatch(text, /\b(?:house|ascendant|descendant|midheaven|imum coeli|cusp)\b/i);
}

console.log("Semantic Synthesis V2 Phase 4 canonical Identity, Core/Deep depth, V1 fallback, context stability, card adaptation, determinism, and leakage gates passed.");
