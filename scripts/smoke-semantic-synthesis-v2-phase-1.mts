import assert from "node:assert/strict";

import {
  ASTRA_ANGLE_CONJUNCTION_ORB,
  ASTRA_LUNAR_NODE_POLICY,
  ASTRA_NATAL_ASPECT_RULES,
  ASTRA_NODE_CONTACT_ORB,
  ASTRA_V2_DOCTRINE_VERSION,
  buildAstrologyNormalizedChartFacts,
  classifyHouseMode,
  normalizeAstrologyChartFacts,
  type NormalizedAspectType,
  type RawNormalizedPointInput
} from "@astra/astrology";
import { astrologyReportRequestSchema, type ChartSettings } from "@astra/contracts";

const basis = {
  zodiacMode: "tropical" as const,
  houseSystem: "whole-sign" as const,
  calculationMode: "full" as const
};

function point(
  id: string,
  longitude: number,
  overrides: Partial<RawNormalizedPointInput> = {}
): RawNormalizedPointInput {
  return {
    id,
    label: id,
    kind: "planet",
    longitude,
    dailyMotion: 0,
    sourceFactId: `fixture:${id}`,
    ...overrides
  };
}

for (const [type, rule] of Object.entries(ASTRA_NATAL_ASPECT_RULES) as Array<
  [NormalizedAspectType, (typeof ASTRA_NATAL_ASPECT_RULES)[NormalizedAspectType]]
>) {
  const exact = normalizeAstrologyChartFacts({
    ...basis,
    points: [point("alpha", 0), point("beta", rule.angle)]
  });
  const aspect = exact.aspects.find((candidate) => candidate.type === type);
  assert.ok(aspect, `${type}: exact geometry must normalize.`);
  assert.equal(aspect.orb, 0);
  assert.equal(aspect.allowableOrb, rule.ordinaryOrb);
  assert.equal(aspect.configurationOrb, rule.configurationOrb);
  assert.equal(aspect.geometryEligible, true);
  assert.equal(aspect.phase, "exact");
  assert.equal(aspect.provenance.ruleId, `v2.phase1.aspect.${type}`);

  const outside = normalizeAstrologyChartFacts({
    ...basis,
    points: [point("alpha", 0), point("beta", rule.angle + rule.ordinaryOrb + 0.1)]
  });
  assert.ok(!outside.aspects.some((candidate) => candidate.type === type), `${type}: outside-orb near miss must not normalize.`);
}

const ordinaryOnly = normalizeAstrologyChartFacts({
  ...basis,
  points: [point("alpha", 0), point("beta", 64.5)]
}).aspects.find((aspect) => aspect.type === "sextile");
assert.ok(ordinaryOnly);
assert.equal(ordinaryOnly.geometryEligible, false, "An ordinary aspect outside the tighter configuration orb must not qualify for pattern geometry.");

const applying = normalizeAstrologyChartFacts({
  ...basis,
  points: [point("alpha", 0, { dailyMotion: 1 }), point("beta", 62)]
}).aspects.find((aspect) => aspect.type === "sextile");
const separating = normalizeAstrologyChartFacts({
  ...basis,
  points: [point("alpha", 0, { dailyMotion: -1 }), point("beta", 62)]
}).aspects.find((aspect) => aspect.type === "sextile");
assert.equal(applying?.phase, "applying");
assert.ok((applying?.phaseDelta ?? 0) < 0);
assert.equal(separating?.phase, "separating");
assert.ok((separating?.phaseDelta ?? 0) > 0);

const classified = normalizeAstrologyChartFacts({
  ...basis,
  points: [
    point("angular", 1, { house: 1 }),
    point("succedent", 31, { house: 2 }),
    point("cadent", 61, { house: 3 }),
    point("retrograde", 220, { house: 8, retrograde: true })
  ]
});
assert.equal(classifyHouseMode(10), "angular");
assert.equal(classifyHouseMode(11), "succedent");
assert.equal(classifyHouseMode(12), "cadent");
assert.equal(classified.points.find((candidate) => candidate.id === "angular")?.houseMode, "angular");
assert.equal(classified.points.find((candidate) => candidate.id === "succedent")?.houseMode, "succedent");
assert.equal(classified.points.find((candidate) => candidate.id === "cadent")?.houseMode, "cadent");
assert.equal(classified.points.find((candidate) => candidate.id === "retrograde")?.retrograde, true);

const angleFixture = normalizeAstrologyChartFacts({
  ...basis,
  points: [
    point("inside", 104),
    point("outside", 100 + ASTRA_ANGLE_CONJUNCTION_ORB + 0.1)
  ],
  angles: [{ id: "ascendant", label: "Ascendant", longitude: 100, sourceFactId: "fixture:ascendant" }]
});
assert.deepEqual(
  angleFixture.points.filter((candidate) => candidate.kind === "angle").map((candidate) => candidate.id),
  ["ascendant", "descendant"]
);
assert.ok(angleFixture.aspects.some((aspect) => aspect.sourceId === "inside" && aspect.targetId === "ascendant"));
assert.ok(!angleFixture.aspects.some((aspect) => aspect.sourceId === "outside" && aspect.targetId === "ascendant"));
assert.ok(angleFixture.aspects.filter((aspect) => aspect.targetId === "ascendant").every((aspect) => aspect.phase === "not_applicable"));

const nodeFixture = normalizeAstrologyChartFacts({
  ...basis,
  points: [
    point("node-contact", 12.5),
    point("node-near-miss", 10 + ASTRA_NODE_CONTACT_ORB + 0.1)
  ],
  lunarNodes: [{
    id: "north-node",
    label: "North Node",
    longitude: 10,
    dailyMotion: -0.05,
    sourceFactId: "fixture:mean-north-node"
  }]
});
const northNode = nodeFixture.points.find((candidate) => candidate.id === "north-node");
const southNode = nodeFixture.points.find((candidate) => candidate.id === "south-node");
assert.equal(nodeFixture.nodePolicy, ASTRA_LUNAR_NODE_POLICY);
assert.ok(northNode && southNode);
assert.equal(((southNode.longitude - northNode.longitude) + 360) % 360, 180);
assert.ok(nodeFixture.aspects.some((aspect) => aspect.sourceId === "node-contact" && aspect.targetId === "north-node"));
assert.ok(!nodeFixture.aspects.some((aspect) => aspect.sourceId === "node-near-miss" && aspect.targetId === "north-node"));

const leakageFixture = normalizeAstrologyChartFacts({
  ...basis,
  calculationMode: "signs-aspects-only",
  points: [point("leak-check", 14, { house: 9 })],
  lunarNodes: [{ id: "north-node", label: "North Node", longitude: 20, house: 4 }],
  angles: [
    { id: "ascendant", label: "Ascendant", longitude: 90 },
    { id: "midheaven", label: "Midheaven", longitude: 10 }
  ],
  houseCusps: [{ house: 1, longitude: 90 }]
});
assert.equal(leakageFixture.houseCusps.length, 0);
assert.ok(!leakageFixture.points.some((candidate) => candidate.kind === "angle"));
assert.ok(leakageFixture.points.every((candidate) => candidate.house === undefined && candidate.houseMode === undefined));
assert.ok(leakageFixture.aspects.every((aspect) => !/angle|house|cusp/.test(aspect.provenance.ruleId)));

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
    id: `v2-phase1-${chartSettings.zodiacMode}-${chartSettings.houseSystem}-${calculationMode}`,
    userId: "v2-phase1-user",
    chartRequestId: "v2-phase1-chart",
    reportType: "identity",
    subjectName: "Phase 1 Control",
    birthData: scopedBirthData,
    source: "self",
    boundary: "private",
    status: "queued",
    costCredits: 1,
    createdAt: "2026-07-26T12:00:00.000Z",
    updatedAt: "2026-07-26T12:00:00.000Z",
    reportBasis: {
      schemaVersion: 2,
      type: "natal",
      chartSettings,
      primary: {
        chartRequestId: "v2-phase1-chart",
        subjectType: "self",
        subjectId: "v2-phase1-user",
        subjectName: "Phase 1 Control",
        birthData: scopedBirthData,
        calculationMode
      }
    }
  });
}

const fullFacts = settingsMatrix.map((settings) =>
  buildAstrologyNormalizedChartFacts(requestFor(settings, "full"))
);
for (const facts of fullFacts) {
  assert.equal(facts.doctrineVersion, ASTRA_V2_DOCTRINE_VERSION);
  assert.equal(facts.nodePolicy, "mean");
  assert.deepEqual(
    facts.points.filter((candidate) => candidate.kind === "angle").map((candidate) => candidate.id),
    ["ascendant", "descendant", "imum-coeli", "midheaven"]
  );
  assert.deepEqual(
    facts.points.filter((candidate) => candidate.kind === "lunar_node").map((candidate) => candidate.id),
    ["north-node", "south-node"]
  );
  assert.equal(facts.houseCusps.length, 12);
  assert.ok(facts.points.filter((candidate) => candidate.kind !== "angle").some((candidate) => candidate.houseMode));
  assert.ok(facts.points.filter((candidate) => candidate.kind === "planet").every((candidate) => typeof candidate.retrograde === "boolean"));
  assert.ok(facts.aspects.every((aspect) => aspect.provenance.sourceFactIds.length >= 2));
  assert.ok(
    facts.aspects
      .filter((aspect) => aspect.phase !== "not_applicable")
      .every((aspect) => ["applying", "separating", "exact", "stationary"].includes(aspect.phase)),
    "Calculated non-angle aspects must retain a deterministic phase."
  );
}

const tropicalWhole = fullFacts[0]!;
const tropicalPlacidus = fullFacts[1]!;
const siderealWhole = fullFacts[2]!;
assert.notEqual(
  tropicalWhole.points.find((candidate) => candidate.id === "sun")?.longitude,
  siderealWhole.points.find((candidate) => candidate.id === "sun")?.longitude,
  "Tropical and Sidereal calculations must change normalized longitude evidence."
);
assert.notDeepEqual(
  tropicalWhole.houseCusps.map((cusp) => cusp.longitude),
  tropicalPlacidus.houseCusps.map((cusp) => cusp.longitude),
  "Whole Sign and Placidus calculations must change normalized cusp evidence."
);

const signsOnlyFacts = settingsMatrix.map((settings) =>
  buildAstrologyNormalizedChartFacts(requestFor(settings, "signs-aspects-only"))
);
for (const facts of signsOnlyFacts) {
  assert.equal(facts.houseCusps.length, 0);
  assert.ok(!facts.points.some((candidate) => candidate.kind === "angle"));
  assert.ok(facts.points.every((candidate) => candidate.house === undefined && candidate.houseMode === undefined));
  assert.ok(facts.aspects.length > 0);
}

function locationIndependentEvidence(facts: (typeof signsOnlyFacts)[number]) {
  return {
    points: facts.points.map(({ id, longitude, sign, degree, retrograde }) => ({ id, longitude, sign, degree, retrograde })),
    aspects: facts.aspects.map(({ id, type, sourceId, targetId, orb, phase }) => ({ id, type, sourceId, targetId, orb, phase }))
  };
}
assert.deepEqual(
  locationIndependentEvidence(signsOnlyFacts[0]!),
  locationIndependentEvidence(signsOnlyFacts[1]!),
  "House-system selection must not alter signs-and-aspects-only evidence."
);
assert.deepEqual(
  buildAstrologyNormalizedChartFacts(requestFor(settingsMatrix[0]!, "full")),
  buildAstrologyNormalizedChartFacts(requestFor(settingsMatrix[0]!, "full")),
  "Normalized chart facts must be deterministic for identical input."
);

console.log("Semantic Synthesis V2 Phase 1 normalized-fact, geometry, provenance, and calculation-mode gates passed.");
