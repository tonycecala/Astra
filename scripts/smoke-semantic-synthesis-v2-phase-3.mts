import assert from "node:assert/strict";

import {
  ASTRA_MEANING_COMPLEX_MAX_PATH_DEPTH,
  ASTRA_V2_PHASE_3_RULESET_VERSION,
  buildAstrologyMeaningComplexNetwork,
  buildMeaningComplexNetwork,
  deriveStructuralChartFacts,
  normalizeAstrologyChartFacts,
  type MeaningComplexNetwork,
  type NormalizeAstrologyChartFactsInput,
  type NormalizedChartFacts,
  type RawNormalizedPointInput,
  type SemanticEdgeType,
  type SemanticNodeType
} from "@astra/astrology";
import { astrologyReportRequestSchema, type ChartSettings } from "@astra/contracts";

type FixturePoint = {
  id: string;
  longitude: number;
  house?: number;
  kind?: RawNormalizedPointInput["kind"];
};

function point(input: FixturePoint): RawNormalizedPointInput {
  return {
    id: input.id,
    label: input.id,
    kind: input.kind ?? (
      input.id === "sun" || input.id === "moon"
        ? "luminary"
        : input.id === "chiron"
          ? "chiron"
          : "planet"
    ),
    longitude: input.longitude,
    ...(input.house ? { house: input.house } : {}),
    retrograde: false,
    dailyMotion: input.id === "moon" ? 13 : input.id === "sun" ? 1 : 0.5,
    sourceFactId: `fixture:${input.id}`
  };
}

function facts(
  points: FixturePoint[],
  options: Partial<NormalizeAstrologyChartFactsInput> = {}
) {
  const normalized = normalizeAstrologyChartFacts({
    zodiacMode: "tropical",
    houseSystem: "whole-sign",
    calculationMode: "full",
    points: points.map(point),
    ...options
  });
  return {
    normalized,
    structural: deriveStructuralChartFacts(normalized),
    network: buildMeaningComplexNetwork(normalized, deriveStructuralChartFacts(normalized))
  };
}

function assertProvenance(network: MeaningComplexNetwork) {
  for (const item of [...network.nodes, ...network.edges, ...network.complexes]) {
    assert.ok(item.provenance.sourceFactIds.length > 0, `${item.id} lacks provenance.`);
  }
  for (const complex of network.complexes) {
    for (const path of [...complex.supportPaths, ...complex.counterevidence]) {
      assert.ok(path.provenance.sourceFactIds.length > 0, `${path.id} lacks provenance.`);
      assert.ok(path.sourceFactIds.length > 0, `${path.id} lacks raw source facts.`);
      assert.ok(path.independentOriginIds.length > 0, `${path.id} lacks an independent origin.`);
    }
  }
}

const fullFixture = facts(
  [
    { id: "sun", longitude: 0, house: 1 },
    { id: "moon", longitude: 120, house: 5 },
    { id: "mercury", longitude: 2, house: 1 },
    { id: "venus", longitude: 60, house: 3 },
    { id: "mars", longitude: 90, house: 4 },
    { id: "jupiter", longitude: 240, house: 9 },
    { id: "saturn", longitude: 180, house: 7 },
    { id: "pluto", longitude: 4.9, house: 1 }
  ],
  {
    houseSystem: "placidus",
    angles: [
      { id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" },
      { id: "midheaven", label: "Midheaven", longitude: 270, sourceFactId: "fixture:midheaven" }
    ],
    houseCusps: Array.from({ length: 12 }, (_, index) => ({
      house: index + 1,
      longitude: index * 30,
      sourceFactId: `fixture:cusp:${index + 1}`
    }))
  }
);
assert.equal(fullFixture.network.rulesetVersion, ASTRA_V2_PHASE_3_RULESET_VERSION);
assert.deepEqual(
  buildMeaningComplexNetwork(fullFixture.normalized, fullFixture.structural),
  fullFixture.network,
  "Identical normalized and structural facts must produce identical networks."
);
assert.ok(fullFixture.network.complexes.length > 0);
assert.ok(
  fullFixture.network.audit.maximumObservedPathDepth <= ASTRA_MEANING_COMPLEX_MAX_PATH_DEPTH
);
assert.ok(
  fullFixture.network.complexes.every((complex) =>
    [...complex.supportPaths, ...complex.counterevidence]
      .every((path) => path.derivationDistance <= ASTRA_MEANING_COMPLEX_MAX_PATH_DEPTH)
  )
);
assertProvenance(fullFixture.network);

const nodeTypes = new Set(fullFixture.network.nodes.map((node) => node.type));
for (const required of [
  "Luminary",
  "Planet",
  "Angle",
  "Sign",
  "House",
  "HouseCusp",
  "Aspect",
  "Distribution",
  "RulershipPath",
  "LifeDomain",
  "InterpretiveHypothesis"
] satisfies SemanticNodeType[]) {
  assert.ok(nodeTypes.has(required), `Missing representative ${required} node.`);
}
const edgeTypes = new Set(fullFixture.network.edges.map((edge) => edge.type));
for (const required of [
  "located_in_sign",
  "located_in_house",
  "rules_sign",
  "rules_house",
  "disposes",
  "aspects",
  "conjunct_angle",
  "near_cusp",
  "routes_domain_to",
  "reinforces",
  "qualifies",
  "contradicts",
  "derived_from"
] satisfies SemanticEdgeType[]) {
  assert.ok(edgeTypes.has(required), `Missing representative ${required} edge.`);
}

const scoreKeys = [
  "structuralImportance",
  "aspectPrecision",
  "angularity",
  "chartRulerRelevance",
  "luminaryOrPersonalRelevance",
  "configurationRole",
  "independentReinforcement",
  "lifeDomainRelevance",
  "contextualActivation",
  "counterevidenceStrength",
  "generationalWeakness",
  "derivationDistance",
  "semanticRedundancy",
  "total"
].sort();
for (const complex of fullFixture.network.complexes) {
  assert.deepEqual(Object.keys(complex.score).sort(), scoreKeys);
  assert.ok(Object.values(complex.score).every((value) => value >= 0 && value <= 1));
  assert.ok(complex.confidenceReasons.length > 0);
  assert.ok(complex.claimBoundary.length > 0);
  if (complex.confidence === "strong") {
    assert.ok(complex.independentSupportCount >= 3);
  }
}

const plutoBaseline = fullFixture.network.complexes.find((complex) =>
  complex.seedNodeIds.includes("point:pluto")
);
assert.ok(plutoBaseline, "The personalized angular Pluto seed should form a complex.");
const plutoAspect = fullFixture.normalized.aspects.find((aspect) =>
  aspect.sourceId === "pluto" || aspect.targetId === "pluto"
);
assert.ok(plutoAspect);
const duplicateAlias: NormalizedChartFacts = {
  ...fullFixture.normalized,
  aspects: [
    ...fullFixture.normalized.aspects,
    { ...plutoAspect, id: `${plutoAspect.id}:semantic-alias` }
  ].sort((left, right) => left.id.localeCompare(right.id))
};
const aliasNetwork = buildMeaningComplexNetwork(
  duplicateAlias,
  deriveStructuralChartFacts(duplicateAlias)
);
const plutoWithAlias = aliasNetwork.complexes.find((complex) =>
  complex.seedNodeIds.includes("point:pluto")
);
assert.ok(plutoWithAlias);
assert.equal(plutoWithAlias.independentSupportCount, plutoBaseline.independentSupportCount);
assert.equal(plutoWithAlias.confidence, plutoBaseline.confidence);
assert.ok(
  plutoWithAlias.score.total <= plutoBaseline.score.total,
  "A duplicate semantic alias must never inflate a meaning-complex score."
);
assert.ok(
  plutoWithAlias.collapsedAliasCount >= plutoBaseline.collapsedAliasCount,
  "A duplicate semantic alias may be audited but must not increase evidence strength."
);

const contradiction = facts([
  { id: "sun", longitude: 15 },
  { id: "moon", longitude: 205 },
  { id: "mars", longitude: 0 },
  { id: "jupiter", longitude: 120 },
  { id: "saturn", longitude: 90 }
]);
const marsComplex = contradiction.network.complexes.find((complex) =>
  complex.seedNodeIds.includes("point:mars")
);
assert.ok(marsComplex);
assert.ok(marsComplex.supportPaths.length > 0);
assert.ok(marsComplex.counterevidence.length > 0);
assert.ok(marsComplex.independentCounterevidenceCount > 0);
assert.ok(marsComplex.confidenceReductionReasons.some((reason) => reason.includes("counter")));
assert.ok(contradiction.network.edges.some((edge) => edge.type === "contradicts"));

const slowFactors = facts(
  [
    { id: "sun", longitude: 15 },
    { id: "moon", longitude: 80 },
    { id: "mars", longitude: 202.5 },
    { id: "uranus", longitude: 155 },
    { id: "chiron", longitude: 275 }
  ],
  {
    lunarNodes: [{
      id: "north-node",
      label: "North Node",
      longitude: 200,
      sourceFactId: "fixture:north-node"
    }]
  }
);
assert.ok(slowFactors.network.audit.suppressedSeedNodeIds.includes("point:uranus"));
assert.ok(slowFactors.network.audit.suppressedSeedNodeIds.includes("point:chiron"));
assert.ok(!slowFactors.network.audit.suppressedSeedNodeIds.includes("point:north-node"));
assert.ok(!slowFactors.network.complexes.some((complex) =>
  complex.seedNodeIds.includes("point:uranus") || complex.seedNodeIds.includes("point:chiron")
));
assert.ok(slowFactors.network.complexes.every((complex) =>
  complex.confidence !== "strong" || complex.independentSupportCount >= 3
));

const signsOnly = facts(
  [
    { id: "sun", longitude: 0 },
    { id: "moon", longitude: 120 },
    { id: "mercury", longitude: 2 },
    { id: "venus", longitude: 60 },
    { id: "mars", longitude: 90 }
  ],
  {
    calculationMode: "signs-aspects-only",
    angles: [{ id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" }],
    houseCusps: Array.from({ length: 12 }, (_, index) => ({
      house: index + 1,
      longitude: index * 30,
      sourceFactId: `fixture:cusp:${index + 1}`
    }))
  }
);
assert.equal(signsOnly.network.calculationMode, "signs-aspects-only");
assert.ok(!signsOnly.network.nodes.some((node) =>
  node.type === "Angle" || node.type === "House" || node.type === "HouseCusp"
));
assert.ok(!signsOnly.network.edges.some((edge) =>
  edge.type === "located_in_house" ||
  edge.type === "rules_house" ||
  edge.type === "conjunct_angle" ||
  edge.type === "near_cusp"
));
for (const complex of signsOnly.network.complexes) {
  assert.match(complex.claimBoundary, /no claims about houses, angles, cusps/i);
  assert.ok([...complex.supportPaths, ...complex.counterevidence].every((path) =>
    path.nodeIds.every((nodeId) =>
      !nodeId.startsWith("angle:") &&
      !nodeId.startsWith("house:") &&
      !nodeId.startsWith("house-cusp:")
    )
  ));
}

const birthData = {
  date: "1961-05-23",
  time: "09:30",
  birthTimeKnown: true,
  timezone: "America/New_York",
  location: "New York, NY, USA",
  latitude: 40.7127281,
  longitude: -74.0060152
} as const;
const settings: ChartSettings = { zodiacMode: "tropical", houseSystem: "whole-sign" };

function request(calculationMode: "full" | "signs-aspects-only") {
  const scopedBirthData = calculationMode === "full"
    ? birthData
    : {
        date: birthData.date,
        time: birthData.time,
        birthTimeKnown: true,
        timezone: birthData.timezone
      };
  return astrologyReportRequestSchema.parse({
    id: `v2-phase3-${calculationMode}`,
    userId: "v2-phase3-user",
    chartRequestId: "v2-phase3-chart",
    reportType: "deep",
    subjectName: "Tony Phase 3 Control",
    birthData: scopedBirthData,
    source: "self",
    boundary: "private",
    status: "queued",
    costCredits: 10,
    createdAt: "2026-07-26T12:00:00.000Z",
    updatedAt: "2026-07-26T12:00:00.000Z",
    reportBasis: {
      schemaVersion: 2,
      type: "natal",
      chartSettings: settings,
      primary: {
        chartRequestId: "v2-phase3-chart",
        subjectType: "self",
        subjectId: "v2-phase3-user",
        subjectName: "Tony Phase 3 Control",
        birthData: scopedBirthData,
        calculationMode
      }
    }
  });
}

const actualFull = buildAstrologyMeaningComplexNetwork(request("full"));
const actualSignsOnly = buildAstrologyMeaningComplexNetwork(request("signs-aspects-only"));
assert.deepEqual(actualFull, buildAstrologyMeaningComplexNetwork(request("full")));
assert.ok(actualFull.complexes.length > 0);
assert.ok(actualSignsOnly.complexes.length > 0);
assert.ok(actualFull.nodes.some((node) => node.type === "House"));
assert.ok(!actualSignsOnly.nodes.some((node) =>
  node.type === "Angle" || node.type === "House" || node.type === "HouseCusp"
));
assertProvenance(actualFull);
assertProvenance(actualSignsOnly);

console.log("Semantic Synthesis V2 Phase 3 graph, evidence, alias, contradiction, confidence, provenance, determinism, and leakage gates passed.");
