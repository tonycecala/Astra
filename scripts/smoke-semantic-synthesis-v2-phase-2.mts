import assert from "node:assert/strict";

import {
  ASTRA_CUSP_PROXIMITY_ORB,
  ASTRA_V2_PHASE_2_RULESET_VERSION,
  buildAstrologyStructuralChartFacts,
  deriveStructuralChartFacts,
  normalizeAstrologyChartFacts,
  type ConfigurationType,
  type NormalizeAstrologyChartFactsInput,
  type RawNormalizedPointInput,
  type StructuralChartFacts
} from "@astra/astrology";
import { astrologyReportRequestSchema, type ChartSettings } from "@astra/contracts";

type FixturePoint = {
  id: string;
  longitude: number;
  house?: number;
  kind?: RawNormalizedPointInput["kind"];
};

function fixturePoint(input: FixturePoint): RawNormalizedPointInput {
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

function normalizedFixture(
  fixturePoints: FixturePoint[],
  options: Partial<NormalizeAstrologyChartFactsInput> = {}
) {
  return normalizeAstrologyChartFacts({
    zodiacMode: "tropical",
    houseSystem: "whole-sign",
    calculationMode: "full",
    points: fixturePoints.map(fixturePoint),
    ...options
  });
}

function structuralFixture(
  fixturePoints: FixturePoint[],
  options: Partial<NormalizeAstrologyChartFactsInput> = {}
) {
  return deriveStructuralChartFacts(normalizedFixture(fixturePoints, options));
}

function hasConfiguration(facts: StructuralChartFacts, type: ConfigurationType) {
  return facts.configurations.some((configuration) => configuration.type === type);
}

function configurationFixture(longitudes: number[]) {
  const ids = ["sun", "moon", "mercury", "venus"] as const;
  return structuralFixture(longitudes.map((longitude, index) => ({
    id: ids[index]!,
    longitude
  })));
}

const classicalPoints: FixturePoint[] = [
  { id: "sun", longitude: 120, house: 5 },
  { id: "moon", longitude: 5, house: 1 },
  { id: "mercury", longitude: 95, house: 4 },
  { id: "venus", longitude: 65, house: 3 },
  { id: "mars", longitude: 125, house: 10 },
  { id: "jupiter", longitude: 10, house: 1 },
  { id: "saturn", longitude: 130, house: 5 }
];
const wholeSignCusps = Array.from({ length: 12 }, (_, index) => ({
  house: index + 1,
  longitude: index * 30,
  sourceFactId: `fixture:cusp:${index + 1}`
}));
const rulerFacts = structuralFixture(classicalPoints, {
  angles: [
    { id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" },
    { id: "midheaven", label: "Midheaven", longitude: 270, sourceFactId: "fixture:midheaven" }
  ],
  houseCusps: wholeSignCusps
});
assert.equal(rulerFacts.chartRuler?.rulerPointId, "mars");
assert.equal(rulerFacts.chartRuler?.rulerHouse, 10);
assert.equal(rulerFacts.houseRulers.length, 12);
assert.deepEqual(
  rulerFacts.houseRulers.map((fact) => fact.rulerPointId),
  ["mars", "venus", "mercury", "moon", "sun", "mercury", "venus", "mars", "jupiter", "saturn", "saturn", "jupiter"],
  "All twelve signs must use the locked traditional ruler table."
);
assert.equal(rulerFacts.houseRulers.find((fact) => fact.house === 1)?.rulerPointId, "mars");
assert.equal(rulerFacts.houseRulers.find((fact) => fact.house === 1)?.rulerHouse, 10);
assert.ok(rulerFacts.dispositors.some((edge) => edge.sourcePointId === "moon" && edge.rulerPointId === "mars"));
assert.ok(rulerFacts.dispositorChains.every((chain) => chain.outcome === "final_dispositor"));
assert.deepEqual(
  rulerFacts.finalDispositors.map((fact) => [fact.pointId, fact.scope]),
  [["sun", "global"]]
);

const noHouseRulerFacts = structuralFixture(classicalPoints.map((point) => ({
  id: point.id,
  longitude: point.longitude,
  ...(point.kind ? { kind: point.kind } : {})
})), {
  calculationMode: "signs-aspects-only",
  angles: [
    { id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" }
  ],
  houseCusps: wholeSignCusps
});
assert.equal(noHouseRulerFacts.chartRuler, undefined);
assert.equal(noHouseRulerFacts.houseRulers.length, 0);

const receptionPositive = structuralFixture([
  { id: "sun", longitude: 120 },
  { id: "moon", longitude: 5 },
  { id: "mercury", longitude: 35 },
  { id: "venus", longitude: 65 }
]);
assert.ok(receptionPositive.dispositorLoops.some((loop) =>
  loop.participantIds.join(":") === "mercury:venus"
));
assert.ok(receptionPositive.mutualReceptions.some((reception) =>
  reception.participantIds.join(":") === "mercury:venus"
));
assert.equal(
  receptionPositive.dispositorChains.find((chain) => chain.sourcePointId === "mercury")?.edgeIds.length,
  2,
  "A loop outcome must retain the complete raw-fact path around the loop."
);

const receptionNearMiss = structuralFixture([
  { id: "sun", longitude: 120 },
  { id: "moon", longitude: 5 },
  { id: "mercury", longitude: 35 },
  { id: "venus", longitude: 95 }
]);
assert.ok(!receptionNearMiss.dispositorLoops.some((loop) =>
  loop.participantIds.includes("mercury") && loop.participantIds.includes("venus")
));
assert.ok(!receptionNearMiss.mutualReceptions.some((reception) =>
  reception.participantIds.includes("mercury") && reception.participantIds.includes("venus")
));

const affinityPositive = structuralFixture([
  { id: "sun", longitude: 120 },
  { id: "moon", longitude: 5 },
  { id: "mars", longitude: 215 }
]);
assert.ok(affinityPositive.modernAffinities.some((affinity) =>
  affinity.sourcePointId === "mars" && affinity.affinityPointId === "pluto"
));
const affinityNearMiss = structuralFixture([
  { id: "sun", longitude: 120 },
  { id: "moon", longitude: 5 },
  { id: "mars", longitude: 185 }
]);
assert.ok(!affinityNearMiss.modernAffinities.some((affinity) =>
  affinity.sourcePointId === "mars"
));

const angularPositive = structuralFixture([
  { id: "sun", longitude: 4.9 },
  { id: "moon", longitude: 100 }
], {
  angles: [{ id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" }]
});
assert.ok(angularPositive.angularContacts.some((contact) =>
  contact.pointId === "sun" && contact.angleId === "ascendant"
));
const angularNearMiss = structuralFixture([
  { id: "sun", longitude: 5.1 },
  { id: "moon", longitude: 100 }
], {
  angles: [{ id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" }]
});
assert.ok(!angularNearMiss.angularContacts.some((contact) =>
  contact.pointId === "sun" && contact.angleId === "ascendant"
));

const nodalAnglePositive = structuralFixture([
  { id: "sun", longitude: 100 },
  { id: "moon", longitude: 200 }
], {
  lunarNodes: [{
    id: "north-node",
    label: "North Node",
    longitude: 2.9,
    sourceFactId: "fixture:north-node"
  }],
  angles: [{ id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" }]
});
assert.ok(nodalAnglePositive.angularContacts.some((contact) =>
  contact.pointId === "north-node" && contact.angleId === "ascendant"
));
assert.equal(
  nodalAnglePositive.personalActivations.find((fact) => fact.targetPointId === "north-node")?.personalized,
  true
);
const nodalAngleNearMiss = structuralFixture([
  { id: "sun", longitude: 100 },
  { id: "moon", longitude: 200 }
], {
  lunarNodes: [{
    id: "north-node",
    label: "North Node",
    longitude: 3.1,
    sourceFactId: "fixture:north-node"
  }],
  angles: [{ id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" }]
});
assert.ok(!nodalAngleNearMiss.angularContacts.some((contact) =>
  contact.pointId === "north-node" && contact.angleId === "ascendant"
));
assert.equal(
  nodalAngleNearMiss.personalActivations.find((fact) => fact.targetPointId === "north-node")?.personalized,
  false
);

const cuspPositive = structuralFixture([
  { id: "sun", longitude: 12.9, house: 1 },
  { id: "moon", longitude: 100, house: 4 }
], {
  houseSystem: "placidus",
  houseCusps: [
    { house: 1, longitude: 10, sourceFactId: "fixture:cusp:1" },
    { house: 2, longitude: 40, sourceFactId: "fixture:cusp:2" }
  ]
});
assert.ok(cuspPositive.cuspProximities.some((fact) =>
  fact.pointId === "sun" &&
  fact.cuspHouse === 1 &&
  fact.distance === 2.9 &&
  fact.provenance.measurements.allowableOrb === ASTRA_CUSP_PROXIMITY_ORB
));
const cuspNearMiss = structuralFixture([
  { id: "sun", longitude: 13.1, house: 1 },
  { id: "moon", longitude: 100, house: 4 }
], {
  houseSystem: "placidus",
  houseCusps: [{ house: 1, longitude: 10, sourceFactId: "fixture:cusp:1" }]
});
assert.ok(!cuspNearMiss.cuspProximities.some((fact) => fact.pointId === "sun"));
const wholeSignCuspSuppressed = structuralFixture([
  { id: "sun", longitude: 2, house: 1 },
  { id: "moon", longitude: 100, house: 4 }
], {
  houseSystem: "whole-sign",
  houseCusps: [{ house: 1, longitude: 0, sourceFactId: "fixture:cusp:1" }]
});
assert.equal(wholeSignCuspSuppressed.cuspProximities.length, 0);

const clusterPositive = configurationFixture([0, 5.9, 11.8]);
assert.ok(hasConfiguration(clusterPositive, "conjunction_cluster"));
const clusterNearMiss = configurationFixture([0, 6.1, 12.2]);
assert.ok(!hasConfiguration(clusterNearMiss, "conjunction_cluster"));

const stelliumPositive = configurationFixture([0, 8, 16]);
assert.ok(hasConfiguration(stelliumPositive, "stellium"));
const stelliumNearMiss = configurationFixture([0, 8.1, 16.2]);
assert.ok(!hasConfiguration(stelliumNearMiss, "stellium"));

const houseStelliumPositive = structuralFixture([
  { id: "sun", longitude: 359, house: 1 },
  { id: "moon", longitude: 5, house: 1 },
  { id: "mercury", longitude: 12, house: 1 }
]);
assert.ok(houseStelliumPositive.configurations.some((configuration) =>
  configuration.type === "stellium" &&
  configuration.dimension === "house" &&
  configuration.dimensionValue === "1"
));
const houseStelliumNearMiss = structuralFixture([
  { id: "sun", longitude: 350, house: 1 },
  { id: "moon", longitude: 358.1, house: 1 },
  { id: "mercury", longitude: 6.2, house: 1 }
]);
assert.ok(!houseStelliumNearMiss.configurations.some((configuration) =>
  configuration.type === "stellium" && configuration.dimension === "house"
));

const excludedConfigurationParticipants = structuralFixture([
  { id: "sun", longitude: 0 },
  { id: "moon", longitude: 120 },
  { id: "chiron", longitude: 240 }
], {
  lunarNodes: [{
    id: "north-node",
    label: "North Node",
    longitude: 240,
    sourceFactId: "fixture:north-node"
  }]
});
assert.ok(
  !hasConfiguration(excludedConfigurationParticipants, "grand_trine"),
  "Chiron and lunar nodes must not satisfy configuration participant counts."
);

const configurationCases: Array<{
  type: ConfigurationType;
  positive: number[];
  nearMiss: number[];
}> = [
  { type: "t_square", positive: [0, 180, 90], nearMiss: [0, 180, 95.1] },
  { type: "grand_cross", positive: [0, 90, 180, 270], nearMiss: [0, 90, 180, 275.1] },
  { type: "grand_trine", positive: [0, 120, 240], nearMiss: [0, 120, 245.1] },
  { type: "kite", positive: [0, 120, 240, 180], nearMiss: [0, 120, 240, 184.1] },
  { type: "yod", positive: [0, 150, 210], nearMiss: [0, 150, 214.1] },
  { type: "mystic_rectangle", positive: [0, 60, 180, 240], nearMiss: [0, 60, 180, 244.1] }
];
for (const fixture of configurationCases) {
  const positive = configurationFixture(fixture.positive);
  const configuration = positive.configurations.find((candidate) => candidate.type === fixture.type);
  assert.ok(configuration, `${fixture.type}: exact positive geometry must derive.`);
  assert.equal(configuration.geometryConfidence, "exact");
  assert.ok(configuration.aspectIds.length >= 3);
  assert.ok(configuration.provenance.sourceFactIds.length >= fixture.positive.length);

  const nearMiss = configurationFixture(fixture.nearMiss);
  assert.ok(!hasConfiguration(nearMiss, fixture.type), `${fixture.type}: outside-orb near miss must not derive.`);
}

const distributionFixture = structuralFixture([
  { id: "sun", longitude: 0, house: 1 },
  { id: "moon", longitude: 120, house: 4 },
  { id: "mercury", longitude: 30, house: 7 },
  { id: "venus", longitude: 60, house: 10 },
  { id: "chiron", longitude: 90, house: 2 }
], {
  lunarNodes: [{
    id: "north-node",
    label: "North Node",
    longitude: 210,
    house: 8,
    sourceFactId: "fixture:north-node"
  }]
});
assert.deepEqual(
  distributionFixture.distributions.find((fact) => fact.dimension === "element")?.counts,
  { fire: 2, earth: 1, air: 1, water: 0 }
);
assert.deepEqual(
  distributionFixture.distributions.find((fact) => fact.dimension === "quadrant")?.counts,
  { first: 1, second: 1, third: 1, fourth: 1 }
);
assert.deepEqual(
  distributionFixture.distributions.find((fact) => fact.dimension === "modality")?.counts,
  { cardinal: 1, fixed: 2, mutable: 1 }
);
assert.deepEqual(
  distributionFixture.distributions.find((fact) => fact.dimension === "polarity")?.counts,
  { positive: 3, negative: 1 }
);
assert.deepEqual(
  distributionFixture.distributions.find((fact) => fact.dimension === "horizontal_hemisphere")?.counts,
  { northern: 2, southern: 2 }
);
assert.deepEqual(
  distributionFixture.distributions.find((fact) => fact.dimension === "vertical_hemisphere")?.counts,
  { eastern: 2, western: 2 }
);
assert.deepEqual(
  distributionFixture.distributions.find((fact) => fact.dimension === "house_mode")?.counts,
  { angular: 4, succedent: 0, cadent: 0 }
);
assert.ok(
  distributionFixture.distributions.every((fact) =>
    fact.claimBoundary.includes("not evidence that a human capacity is absent")
  ),
  "Relative absence must carry its non-categorical boundary."
);

const phaseCases: Array<[number, string]> = [
  [0, "new"],
  [45, "waxing_crescent"],
  [90, "first_quarter"],
  [135, "waxing_gibbous"],
  [180, "full"],
  [225, "waning_gibbous"],
  [270, "last_quarter"],
  [315, "waning_crescent"]
];
for (const [elongation, expected] of phaseCases) {
  const phase = structuralFixture([
    { id: "sun", longitude: 0 },
    { id: "moon", longitude: elongation }
  ]).lunarPhase;
  assert.equal(phase.phase, expected);
}
assert.equal(
  structuralFixture([
    { id: "sun", longitude: 0 },
    { id: "moon", longitude: 22.49 }
  ]).lunarPhase.phase,
  "new"
);
assert.equal(
  structuralFixture([
    { id: "sun", longitude: 0 },
    { id: "moon", longitude: 22.5 }
  ]).lunarPhase.phase,
  "waxing_crescent"
);

const outerPersonalPositive = structuralFixture([
  { id: "sun", longitude: 120 },
  { id: "moon", longitude: 30 },
  { id: "uranus", longitude: 0 }
]);
assert.equal(
  outerPersonalPositive.personalActivations.find((fact) => fact.targetPointId === "uranus")?.personalized,
  true
);
const outerPersonalNearMiss = structuralFixture([
  { id: "sun", longitude: 125.1 },
  { id: "moon", longitude: 30 },
  { id: "uranus", longitude: 0 }
]);
assert.equal(
  outerPersonalNearMiss.personalActivations.find((fact) => fact.targetPointId === "uranus")?.personalized,
  false
);
assert.ok(
  outerPersonalNearMiss.personalActivations
    .find((fact) => fact.targetPointId === "uranus")
    ?.provenance.confidenceReductionReasons.some((reason) =>
      reason.includes("cannot anchor a strong personal claim")
    )
);

const chironPersonalPositive = structuralFixture([
  { id: "sun", longitude: 200 },
  { id: "moon", longitude: 250 },
  { id: "venus", longitude: 60 },
  { id: "chiron", longitude: 0 }
]);
assert.equal(
  chironPersonalPositive.personalActivations.find((fact) => fact.targetPointId === "chiron")?.personalized,
  true
);
const chironPersonalNearMiss = structuralFixture([
  { id: "sun", longitude: 200 },
  { id: "moon", longitude: 250 },
  { id: "venus", longitude: 64.1 },
  { id: "chiron", longitude: 0 }
]);
assert.equal(
  chironPersonalNearMiss.personalActivations.find((fact) => fact.targetPointId === "chiron")?.personalized,
  false
);

const nodePersonalPositive = structuralFixture([
  { id: "sun", longitude: 100 },
  { id: "moon", longitude: 200 },
  { id: "mars", longitude: 2.9 }
], {
  lunarNodes: [{
    id: "north-node",
    label: "North Node",
    longitude: 0,
    sourceFactId: "fixture:north-node"
  }]
});
assert.equal(
  nodePersonalPositive.personalActivations.find((fact) => fact.targetPointId === "north-node")?.personalized,
  true
);
const nodePersonalNearMiss = structuralFixture([
  { id: "sun", longitude: 100 },
  { id: "moon", longitude: 200 },
  { id: "mars", longitude: 3.1 }
], {
  lunarNodes: [{
    id: "north-node",
    label: "North Node",
    longitude: 0,
    sourceFactId: "fixture:north-node"
  }]
});
assert.equal(
  nodePersonalNearMiss.personalActivations.find((fact) => fact.targetPointId === "north-node")?.personalized,
  false
);

const chartRulerActivation = structuralFixture([
  { id: "sun", longitude: 100 },
  { id: "moon", longitude: 200 },
  { id: "jupiter", longitude: 60, house: 2 },
  { id: "neptune", longitude: 0, house: 1 }
], {
  angles: [{ id: "ascendant", label: "Ascendant", longitude: 240, sourceFactId: "fixture:ascendant" }]
});
assert.equal(chartRulerActivation.chartRuler?.rulerPointId, "jupiter");
assert.equal(
  chartRulerActivation.personalActivations.find((fact) => fact.targetPointId === "neptune")?.personalized,
  true
);

const angleActivation = structuralFixture([
  { id: "sun", longitude: 110 },
  { id: "moon", longitude: 220 },
  { id: "pluto", longitude: 4.9 }
], {
  angles: [{ id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" }]
});
assert.equal(
  angleActivation.personalActivations.find((fact) => fact.targetPointId === "pluto")?.personalized,
  true
);

const angleActivationNearMiss = structuralFixture([
  { id: "sun", longitude: 110 },
  { id: "moon", longitude: 220 },
  { id: "pluto", longitude: 5.1 }
], {
  angles: [{ id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" }]
});
assert.equal(
  angleActivationNearMiss.personalActivations.find((fact) => fact.targetPointId === "pluto")?.personalized,
  false
);
assert.equal(
  angleActivation.personalActivations.find((fact) => fact.targetPointId === "pluto")?.evidenceIds.length,
  1,
  "An angle contact must not count once as a Phase 1 aspect and again as a Phase 2 angular-contact label."
);

const nodeActivatesOuter = structuralFixture([
  { id: "sun", longitude: 100 },
  { id: "moon", longitude: 200 },
  { id: "uranus", longitude: 0 }
], {
  lunarNodes: [{
    id: "north-node",
    label: "North Node",
    longitude: 2.9,
    sourceFactId: "fixture:north-node"
  }]
});
assert.equal(
  nodeActivatesOuter.personalActivations.find((fact) => fact.targetPointId === "uranus")?.personalized,
  true
);
assert.equal(
  nodeActivatesOuter.personalActivations.find((fact) => fact.targetPointId === "uranus")?.evidenceIds.length,
  1,
  "North/South labels from one nodal axis contact must not duplicate activation evidence."
);

const signsOnly = structuralFixture([
  { id: "sun", longitude: 0 },
  { id: "moon", longitude: 90 },
  { id: "mercury", longitude: 180 },
  { id: "neptune", longitude: 240 }
], {
  calculationMode: "signs-aspects-only",
  houseSystem: "placidus",
  angles: [{ id: "ascendant", label: "Ascendant", longitude: 0, sourceFactId: "fixture:ascendant" }],
  houseCusps: [{ house: 1, longitude: 0, sourceFactId: "fixture:cusp:1" }]
});
assert.equal(signsOnly.chartRuler, undefined);
assert.equal(signsOnly.houseRulers.length, 0);
assert.equal(signsOnly.angularContacts.length, 0);
assert.equal(signsOnly.cuspProximities.length, 0);
assert.deepEqual(
  signsOnly.distributions.map((fact) => fact.dimension),
  ["element", "modality", "polarity"]
);
assert.ok(signsOnly.configurations.every((configuration) =>
  configuration.houses === undefined &&
  configuration.dimension !== "house"
));
assert.ok(signsOnly.personalActivations.every((activation) =>
  !activation.activatorPointIds.some((id) =>
    ["ascendant", "descendant", "midheaven", "imum-coeli"].includes(id)
  )
));

function assertProvenanceTree(value: unknown) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) assertProvenanceTree(item);
    return;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id === "string") {
    const provenance = record.provenance as Record<string, unknown> | undefined;
    assert.ok(provenance, `${record.id}: every derived fact must retain provenance.`);
    assert.ok(
      Array.isArray(provenance.sourceFactIds) && provenance.sourceFactIds.length > 0,
      `${record.id}: provenance must reach raw source fact identifiers.`
    );
  }
  for (const [key, nested] of Object.entries(record)) {
    if (key !== "provenance") assertProvenanceTree(nested);
  }
}
assertProvenanceTree(rulerFacts);
assertProvenanceTree(configurationFixture([0, 90, 180, 270]));
assertProvenanceTree(distributionFixture);
assertProvenanceTree(nodeActivatesOuter);

const birthData = {
  date: "1961-05-23",
  time: "09:30",
  birthTimeKnown: true,
  timezone: "America/New_York",
  location: "New York, NY, USA",
  latitude: 40.7127281,
  longitude: -74.0060152
} as const;
const settingsMatrix: ChartSettings[] = [
  { zodiacMode: "tropical", houseSystem: "whole-sign" },
  { zodiacMode: "tropical", houseSystem: "placidus" },
  { zodiacMode: "sidereal", houseSystem: "whole-sign" },
  { zodiacMode: "sidereal", houseSystem: "placidus" }
];

function requestFor(chartSettings: ChartSettings, calculationMode: "full" | "signs-aspects-only") {
  const scopedBirthData = calculationMode === "full"
    ? birthData
    : {
        date: birthData.date,
        time: birthData.time,
        birthTimeKnown: true,
        timezone: birthData.timezone
      };
  return astrologyReportRequestSchema.parse({
    id: `v2-phase2-${chartSettings.zodiacMode}-${chartSettings.houseSystem}-${calculationMode}`,
    userId: "v2-phase2-user",
    chartRequestId: "v2-phase2-chart",
    reportType: "deep",
    subjectName: "Tony Phase 2 Control",
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
      chartSettings,
      primary: {
        chartRequestId: "v2-phase2-chart",
        subjectType: "self",
        subjectId: "v2-phase2-user",
        subjectName: "Tony Phase 2 Control",
        birthData: scopedBirthData,
        calculationMode
      }
    }
  });
}

const actualFull = settingsMatrix.map((settings) =>
  buildAstrologyStructuralChartFacts(requestFor(settings, "full"))
);
for (const facts of actualFull) {
  assert.equal(facts.rulesetVersion, ASTRA_V2_PHASE_2_RULESET_VERSION);
  assert.ok(facts.chartRuler);
  assert.equal(facts.houseRulers.length, 12);
  assert.ok(facts.dispositors.length >= 13);
  assert.ok(facts.dispositorChains.length >= 13);
  assert.equal(facts.distributions.length, 7);
  assert.equal(facts.personalActivations.length, 6);
  assert.ok(facts.lunarPhase.provenance.sourceFactIds.length >= 2);
}
assert.equal(actualFull[0]?.cuspProximities.length, 0);
assert.ok((actualFull[1]?.cuspProximities.length ?? 0) > 0);
assert.notDeepEqual(actualFull[0]?.houseRulers, actualFull[2]?.houseRulers);

const actualSignsOnly = settingsMatrix.map((settings) =>
  buildAstrologyStructuralChartFacts(requestFor(settings, "signs-aspects-only"))
);
for (const facts of actualSignsOnly) {
  assert.equal(facts.chartRuler, undefined);
  assert.equal(facts.houseRulers.length, 0);
  assert.equal(facts.angularContacts.length, 0);
  assert.equal(facts.cuspProximities.length, 0);
  assert.deepEqual(
    facts.distributions.map((distribution) => distribution.dimension),
    ["element", "modality", "polarity"]
  );
}
assert.deepEqual(
  buildAstrologyStructuralChartFacts(requestFor(settingsMatrix[0]!, "full")),
  buildAstrologyStructuralChartFacts(requestFor(settingsMatrix[0]!, "full")),
  "Phase 2 structural facts must be deterministic for identical input."
);

console.log("Semantic Synthesis V2 Phase 2 structural derivation, near-miss, provenance, and leakage gates passed.");
