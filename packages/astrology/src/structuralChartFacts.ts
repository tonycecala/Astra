import {
  ASTRA_ANGLE_CONJUNCTION_ORB,
  ASTRA_NODE_CONTACT_ORB,
  type FactProvenance,
  type NormalizedAspect,
  type NormalizedChartFacts,
  type NormalizedChartPoint,
  type ProvenanceConfidence
} from "./normalizedChartFacts";

export const ASTRA_V2_PHASE_2_RULESET_VERSION = "2.0.0-phase-2";
export const ASTRA_CUSP_PROXIMITY_ORB = 3;

const signNames = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
] as const;

export type SignName = (typeof signNames)[number];
export type TraditionalPlanetId =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn";

export const ASTRA_TRADITIONAL_SIGN_RULERS: Record<SignName, TraditionalPlanetId> = {
  Aries: "mars",
  Taurus: "venus",
  Gemini: "mercury",
  Cancer: "moon",
  Leo: "sun",
  Virgo: "mercury",
  Libra: "venus",
  Scorpio: "mars",
  Sagittarius: "jupiter",
  Capricorn: "saturn",
  Aquarius: "saturn",
  Pisces: "jupiter"
};

export const ASTRA_MODERN_RULERSHIP_AFFINITIES = {
  Scorpio: "pluto",
  Aquarius: "uranus",
  Pisces: "neptune"
} as const;

export type ChartRulerFact = {
  id: "chart-ruler";
  ascendantSign: SignName;
  rulerPointId: TraditionalPlanetId;
  rulerHouse?: number;
  provenance: FactProvenance;
};

export type HouseRulerFact = {
  id: string;
  house: number;
  cuspSign: SignName;
  rulerPointId: TraditionalPlanetId;
  rulerHouse?: number;
  provenance: FactProvenance;
};

export type DispositorEdge = {
  id: string;
  sourcePointId: string;
  sourceSign: SignName;
  rulerPointId: TraditionalPlanetId;
  selfDispositing: boolean;
  provenance: FactProvenance;
};

export type DispositorChain = {
  id: string;
  sourcePointId: string;
  pointPath: string[];
  edgeIds: string[];
  outcome: "final_dispositor" | "loop" | "missing_ruler";
  terminalPointId?: string;
  loopId?: string;
  provenance: FactProvenance;
};

export type DispositorLoop = {
  id: string;
  participantIds: string[];
  edgeIds: string[];
  provenance: FactProvenance;
};

export type FinalDispositorFact = {
  id: string;
  pointId: TraditionalPlanetId;
  sourcePointIds: string[];
  scope: "global" | "component";
  provenance: FactProvenance;
};

export type MutualReceptionFact = {
  id: string;
  participantIds: [string, string];
  edgeIds: [string, string];
  provenance: FactProvenance;
};

export type ModernAffinityFact = {
  id: string;
  sourcePointId: string;
  sign: keyof typeof ASTRA_MODERN_RULERSHIP_AFFINITIES;
  affinityPointId: (typeof ASTRA_MODERN_RULERSHIP_AFFINITIES)[keyof typeof ASTRA_MODERN_RULERSHIP_AFFINITIES];
  provenance: FactProvenance;
};

export type AngularContactFact = {
  id: string;
  pointId: string;
  angleId: string;
  orb: number;
  allowableOrb: number;
  provenance: FactProvenance;
};

export type CuspProximityFact = {
  id: string;
  pointId: string;
  cuspHouse: number;
  distance: number;
  side: "before" | "after" | "exact";
  provenance: FactProvenance;
};

export type ConfigurationType =
  | "conjunction_cluster"
  | "stellium"
  | "t_square"
  | "grand_cross"
  | "grand_trine"
  | "kite"
  | "yod"
  | "mystic_rectangle";

export type ConfigurationFact = {
  id: string;
  type: ConfigurationType;
  participantIds: string[];
  focalPointId?: string;
  aspectIds: string[];
  signs: string[];
  houses?: number[];
  dimension?: "sign" | "house";
  dimensionValue?: string;
  fullSpan?: number;
  maxOrb: number;
  geometryConfidence: "exact";
  provenance: FactProvenance;
};

export type DistributionDimension =
  | "element"
  | "modality"
  | "polarity"
  | "horizontal_hemisphere"
  | "vertical_hemisphere"
  | "quadrant"
  | "house_mode";

export type DistributionFact = {
  id: string;
  dimension: DistributionDimension;
  counts: Record<string, number>;
  leaders: string[];
  relativeAbsences: string[];
  claimBoundary: string;
  provenance: FactProvenance;
};

export type LunarPhaseName =
  | "new"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

export type LunarPhaseFact = {
  id: "lunar-phase";
  phase: LunarPhaseName;
  elongation: number;
  cycle: "waxing" | "waning" | "lunation";
  sunMoonAspectId?: string;
  provenance: FactProvenance;
};

export type PersonalActivationFact = {
  id: string;
  targetPointId: string;
  targetKind: "outer_planet" | "chiron" | "lunar_node";
  personalized: boolean;
  activatorPointIds: string[];
  evidenceIds: string[];
  provenance: FactProvenance;
};

export type StructuralChartFacts = {
  rulesetVersion: typeof ASTRA_V2_PHASE_2_RULESET_VERSION;
  calculationMode: NormalizedChartFacts["calculationMode"];
  chartRuler?: ChartRulerFact;
  houseRulers: HouseRulerFact[];
  dispositors: DispositorEdge[];
  dispositorChains: DispositorChain[];
  dispositorLoops: DispositorLoop[];
  finalDispositors: FinalDispositorFact[];
  mutualReceptions: MutualReceptionFact[];
  modernAffinities: ModernAffinityFact[];
  angularContacts: AngularContactFact[];
  cuspProximities: CuspProximityFact[];
  configurations: ConfigurationFact[];
  distributions: DistributionFact[];
  lunarPhase: LunarPhaseFact;
  personalActivations: PersonalActivationFact[];
};

type ProvenanceOptions = {
  ruleId: string;
  sources: Array<{ provenance: FactProvenance }>;
  measurements?: Record<string, number | string | boolean>;
  derivationPath: string[];
  confidenceTier?: ProvenanceConfidence;
  inclusionReasons: string[];
  confidenceReductionReasons?: string[];
};

const signTraits: Record<SignName, { element: string; modality: string; polarity: string }> = {
  Aries: { element: "fire", modality: "cardinal", polarity: "positive" },
  Taurus: { element: "earth", modality: "fixed", polarity: "negative" },
  Gemini: { element: "air", modality: "mutable", polarity: "positive" },
  Cancer: { element: "water", modality: "cardinal", polarity: "negative" },
  Leo: { element: "fire", modality: "fixed", polarity: "positive" },
  Virgo: { element: "earth", modality: "mutable", polarity: "negative" },
  Libra: { element: "air", modality: "cardinal", polarity: "positive" },
  Scorpio: { element: "water", modality: "fixed", polarity: "negative" },
  Sagittarius: { element: "fire", modality: "mutable", polarity: "positive" },
  Capricorn: { element: "earth", modality: "cardinal", polarity: "negative" },
  Aquarius: { element: "air", modality: "fixed", polarity: "positive" },
  Pisces: { element: "water", modality: "mutable", polarity: "negative" }
};

function round(value: number, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function signedDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function angularDistance(left: number, right: number) {
  return Math.abs(signedDelta(left, right));
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function sortedUnique(values: string[]) {
  return unique(values).sort();
}

function isSignName(value: string): value is SignName {
  return signNames.includes(value as SignName);
}

function structuralProvenance(
  facts: NormalizedChartFacts,
  options: ProvenanceOptions
): FactProvenance {
  return {
    ruleId: options.ruleId,
    sourceFactIds: sortedUnique(
      options.sources.flatMap((source) => source.provenance.sourceFactIds)
    ),
    zodiacMode: facts.zodiacMode,
    houseSystem: facts.houseSystem,
    calculationMode: facts.calculationMode,
    measurements: options.measurements ?? {},
    derivationPath: options.derivationPath,
    confidenceTier: options.confidenceTier ?? "exact",
    inclusionReasons: options.inclusionReasons,
    confidenceReductionReasons: options.confidenceReductionReasons ?? []
  };
}

function pointMap(facts: NormalizedChartFacts) {
  return new Map(facts.points.map((point) => [point.id, point]));
}

function rulerForSign(sign: string) {
  return isSignName(sign) ? ASTRA_TRADITIONAL_SIGN_RULERS[sign] : undefined;
}

function eligibleDispositorPoints(facts: NormalizedChartFacts) {
  return facts.points.filter((point) => point.kind !== "angle");
}

function chartRulerFor(
  facts: NormalizedChartFacts,
  points: Map<string, NormalizedChartPoint>
): ChartRulerFact | undefined {
  if (facts.calculationMode === "signs-aspects-only") return undefined;
  const ascendant = points.get("ascendant");
  if (!ascendant || !isSignName(ascendant.sign)) return undefined;
  const rulerPointId = ASTRA_TRADITIONAL_SIGN_RULERS[ascendant.sign];
  const rulerPoint = points.get(rulerPointId);
  return {
    id: "chart-ruler",
    ascendantSign: ascendant.sign,
    rulerPointId,
    ...(rulerPoint?.house ? { rulerHouse: rulerPoint.house } : {}),
    provenance: structuralProvenance(facts, {
      ruleId: "v2.phase2.rulership.chart-ruler",
      sources: [ascendant, ...(rulerPoint ? [rulerPoint] : [])],
      measurements: {
        ascendantLongitude: ascendant.longitude,
        ...(rulerPoint?.house ? { rulerHouse: rulerPoint.house } : {})
      },
      derivationPath: [
        ascendant.provenance.ruleId,
        `traditional ruler of ${ascendant.sign}`,
        rulerPointId
      ],
      confidenceTier: rulerPoint ? "exact" : "bounded",
      inclusionReasons: ["The traditional ruler of the calculated Ascendant sign is the chart ruler."],
      confidenceReductionReasons: rulerPoint ? [] : ["The ruler point is not present in the normalized chart facts."]
    })
  };
}

function houseRulersFor(
  facts: NormalizedChartFacts,
  points: Map<string, NormalizedChartPoint>
): HouseRulerFact[] {
  if (facts.calculationMode === "signs-aspects-only") return [];
  return facts.houseCusps.flatMap((cusp) => {
    const signIndex = Math.floor(normalizeDegrees(cusp.longitude) / 30);
    const cuspSign = signNames[signIndex];
    if (!cuspSign) return [];
    const rulerPointId = ASTRA_TRADITIONAL_SIGN_RULERS[cuspSign];
    const rulerPoint = points.get(rulerPointId);
    return [{
      id: `house-ruler:${cusp.house}:${rulerPointId}`,
      house: cusp.house,
      cuspSign,
      rulerPointId,
      ...(rulerPoint?.house ? { rulerHouse: rulerPoint.house } : {}),
      provenance: structuralProvenance(facts, {
        ruleId: "v2.phase2.rulership.house-ruler",
        sources: [cusp, ...(rulerPoint ? [rulerPoint] : [])],
        measurements: {
          house: cusp.house,
          cuspLongitude: cusp.longitude,
          ...(rulerPoint?.house ? { rulerHouse: rulerPoint.house } : {})
        },
        derivationPath: [
          cusp.provenance.ruleId,
          `cusp sign ${cuspSign}`,
          `traditional ruler ${rulerPointId}`,
          ...(rulerPoint?.house ? [`ruler located in house ${rulerPoint.house}`] : [])
        ],
        confidenceTier: rulerPoint ? "exact" : "bounded",
        inclusionReasons: ["The selected house cusp sign routes the house to its traditional ruler."],
        confidenceReductionReasons: rulerPoint ? [] : ["The ruler point is not present in the normalized chart facts."]
      })
    }];
  });
}

function dispositorsFor(
  facts: NormalizedChartFacts,
  points: Map<string, NormalizedChartPoint>
): DispositorEdge[] {
  return eligibleDispositorPoints(facts).flatMap((point) => {
    const rulerPointId = rulerForSign(point.sign);
    if (!rulerPointId) return [];
    const rulerPoint = points.get(rulerPointId);
    return [{
      id: `dispositor:${point.id}:${rulerPointId}`,
      sourcePointId: point.id,
      sourceSign: point.sign as SignName,
      rulerPointId,
      selfDispositing: point.id === rulerPointId,
      provenance: structuralProvenance(facts, {
        ruleId: "v2.phase2.rulership.dispositor",
        sources: [point, ...(rulerPoint ? [rulerPoint] : [])],
        measurements: {
          sourceLongitude: point.longitude,
          selfDispositing: point.id === rulerPointId
        },
        derivationPath: [
          point.provenance.ruleId,
          `traditional ruler of ${point.sign}`,
          rulerPointId
        ],
        confidenceTier: rulerPoint ? "exact" : "bounded",
        inclusionReasons: ["A point is disposed by the traditional ruler of its sign."],
        confidenceReductionReasons: rulerPoint ? [] : ["The ruler point is not present in the normalized chart facts."]
      })
    }];
  });
}

function canonicalCycle(values: string[]) {
  if (values.length === 0) return values;
  const rotations = values.map((_, index) => [
    ...values.slice(index),
    ...values.slice(0, index)
  ]);
  rotations.sort((left, right) => left.join(":").localeCompare(right.join(":")));
  return rotations[0] ?? values;
}

function dispositorLoopsFor(
  facts: NormalizedChartFacts,
  edges: DispositorEdge[]
): DispositorLoop[] {
  const bySource = new Map(edges.map((edge) => [edge.sourcePointId, edge]));
  const loops = new Map<string, DispositorLoop>();

  for (const start of edges.map((edge) => edge.sourcePointId)) {
    const path: string[] = [];
    const positions = new Map<string, number>();
    let current: string | undefined = start;
    while (current) {
      const seenAt = positions.get(current);
      if (seenAt !== undefined) {
        const cycle = path.slice(seenAt);
        if (cycle.length >= 2) {
          const participants = canonicalCycle(cycle);
          const id = `dispositor-loop:${participants.join(":")}`;
          if (!loops.has(id)) {
            const loopEdges = participants.flatMap((participant) => {
              const edge = bySource.get(participant);
              return edge ? [edge] : [];
            });
            loops.set(id, {
              id,
              participantIds: participants,
              edgeIds: loopEdges.map((edge) => edge.id),
              provenance: structuralProvenance(facts, {
                ruleId: "v2.phase2.rulership.dispositor-loop",
                sources: loopEdges,
                measurements: { participantCount: participants.length },
                derivationPath: loopEdges.map((edge) => edge.id),
                inclusionReasons: ["Following traditional dispositors returns to an earlier planet without reaching a self-dispositor."]
              })
            });
          }
        }
        break;
      }
      positions.set(current, path.length);
      path.push(current);
      const edge = bySource.get(current);
      if (!edge || edge.selfDispositing) break;
      current = edge.rulerPointId;
    }
  }

  return [...loops.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function dispositorChainsFor(
  facts: NormalizedChartFacts,
  edges: DispositorEdge[],
  loops: DispositorLoop[]
): DispositorChain[] {
  const bySource = new Map(edges.map((edge) => [edge.sourcePointId, edge]));
  const loopByParticipant = new Map(
    loops.flatMap((loop) => loop.participantIds.map((participant) => [participant, loop] as const))
  );

  return edges.map((startEdge) => {
    const pointPath: string[] = [];
    const chainEdges: DispositorEdge[] = [];
    const visited = new Set<string>();
    let current = startEdge.sourcePointId;
    let outcome: DispositorChain["outcome"] = "missing_ruler";
    let terminalPointId: string | undefined;
    let loopId: string | undefined;

    while (true) {
      if (visited.has(current)) {
        const loop = loopByParticipant.get(current);
        outcome = "loop";
        loopId = loop?.id;
        terminalPointId = current;
        break;
      }
      visited.add(current);
      pointPath.push(current);
      const edge = bySource.get(current);
      if (!edge) {
        terminalPointId = current;
        break;
      }
      chainEdges.push(edge);
      if (edge.selfDispositing) {
        outcome = "final_dispositor";
        terminalPointId = current;
        break;
      }
      current = edge.rulerPointId;
    }

    return {
      id: `dispositor-chain:${startEdge.sourcePointId}`,
      sourcePointId: startEdge.sourcePointId,
      pointPath,
      edgeIds: chainEdges.map((edge) => edge.id),
      outcome,
      ...(terminalPointId ? { terminalPointId } : {}),
      ...(loopId ? { loopId } : {}),
      provenance: structuralProvenance(facts, {
        ruleId: "v2.phase2.rulership.dispositor-chain",
        sources: chainEdges,
        measurements: {
          pathLength: chainEdges.length,
          outcome
        },
        derivationPath: chainEdges.map((edge) => edge.id),
        confidenceTier: outcome === "missing_ruler" ? "bounded" : "exact",
        inclusionReasons: ["The chain follows each point's traditional dispositor until it reaches a fixed point, loop, or unavailable ruler."],
        confidenceReductionReasons: outcome === "missing_ruler" ? ["A required ruler point or edge is unavailable."] : []
      })
    };
  });
}

function finalDispositorsFor(
  facts: NormalizedChartFacts,
  chains: DispositorChain[],
  edges: DispositorEdge[]
): FinalDispositorFact[] {
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
  const grouped = new Map<TraditionalPlanetId, DispositorChain[]>();
  for (const chain of chains) {
    if (chain.outcome !== "final_dispositor" || !chain.terminalPointId) continue;
    const pointId = chain.terminalPointId as TraditionalPlanetId;
    grouped.set(pointId, [...(grouped.get(pointId) ?? []), chain]);
  }
  const totalChains = chains.length;
  return [...grouped.entries()].map(([pointId, supportingChains]) => {
    const supportingEdges = supportingChains.flatMap((chain) =>
      chain.edgeIds.flatMap((edgeId) => {
        const edge = edgeById.get(edgeId);
        return edge ? [edge] : [];
      })
    );
    return {
      id: `final-dispositor:${pointId}`,
      pointId,
      sourcePointIds: supportingChains.map((chain) => chain.sourcePointId).sort(),
      scope: supportingChains.length === totalChains ? "global" as const : "component" as const,
      provenance: structuralProvenance(facts, {
        ruleId: "v2.phase2.rulership.final-dispositor",
        sources: supportingEdges,
        measurements: {
          supportedChainCount: supportingChains.length,
          totalChainCount: totalChains,
          global: supportingChains.length === totalChains
        },
        derivationPath: supportingChains.map((chain) => chain.id),
        inclusionReasons: ["One or more dispositor chains terminate at a planet in a sign it traditionally rules."]
      })
    };
  }).sort((left, right) => left.id.localeCompare(right.id));
}

function mutualReceptionsFor(
  facts: NormalizedChartFacts,
  edges: DispositorEdge[]
): MutualReceptionFact[] {
  const bySource = new Map(edges.map((edge) => [edge.sourcePointId, edge]));
  const receptions = new Map<string, MutualReceptionFact>();
  for (const edge of edges) {
    if (edge.selfDispositing) continue;
    const reverse = bySource.get(edge.rulerPointId);
    if (!reverse || reverse.rulerPointId !== edge.sourcePointId) continue;
    const participants = [edge.sourcePointId, reverse.sourcePointId].sort() as [string, string];
    const id = `mutual-reception:${participants.join(":")}`;
    if (receptions.has(id)) continue;
    const orderedEdges = [edge, reverse].sort((left, right) =>
      left.sourcePointId.localeCompare(right.sourcePointId)
    ) as [DispositorEdge, DispositorEdge];
    receptions.set(id, {
      id,
      participantIds: participants,
      edgeIds: [orderedEdges[0].id, orderedEdges[1].id],
      provenance: structuralProvenance(facts, {
        ruleId: "v2.phase2.rulership.mutual-reception",
        sources: orderedEdges,
        measurements: { participantCount: 2 },
        derivationPath: orderedEdges.map((candidate) => candidate.id),
        inclusionReasons: ["Each planet occupies a sign traditionally ruled by the other."]
      })
    });
  }
  return [...receptions.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function modernAffinitiesFor(facts: NormalizedChartFacts): ModernAffinityFact[] {
  return facts.points.flatMap((point) => {
    if (!(point.sign in ASTRA_MODERN_RULERSHIP_AFFINITIES)) return [];
    const sign = point.sign as keyof typeof ASTRA_MODERN_RULERSHIP_AFFINITIES;
    const affinityPointId = ASTRA_MODERN_RULERSHIP_AFFINITIES[sign];
    return [{
      id: `modern-affinity:${point.id}:${affinityPointId}`,
      sourcePointId: point.id,
      sign,
      affinityPointId,
      provenance: structuralProvenance(facts, {
        ruleId: "v2.phase2.rulership.modern-affinity",
        sources: [point],
        measurements: { longitude: point.longitude },
        derivationPath: [point.provenance.ruleId, `labeled modern affinity for ${sign}`, affinityPointId],
        confidenceTier: "high",
        inclusionReasons: ["Modern rulership is retained as a labeled secondary affinity, separate from the traditional ruler graph."]
      })
    }];
  });
}

function angularContactsFor(facts: NormalizedChartFacts): AngularContactFact[] {
  if (facts.calculationMode === "signs-aspects-only") return [];
  const angles = facts.points.filter((point) => point.kind === "angle");
  const points = facts.points.filter((point) => point.kind !== "angle");
  const contacts: AngularContactFact[] = [];
  for (const point of points) {
    for (const angle of angles) {
      const orb = angularDistance(point.longitude, angle.longitude);
      const allowableOrb = point.kind === "lunar_node"
        ? ASTRA_NODE_CONTACT_ORB
        : ASTRA_ANGLE_CONJUNCTION_ORB;
      if (orb > allowableOrb) continue;
      contacts.push({
        id: `angular-contact:${point.id}:${angle.id}`,
        pointId: point.id,
        angleId: angle.id,
        orb: round(orb),
        allowableOrb,
        provenance: structuralProvenance(facts, {
          ruleId: point.kind === "lunar_node"
            ? "v2.phase2.angular-contact.node"
            : "v2.phase2.angular-contact.point",
          sources: [point, angle],
          measurements: {
            pointLongitude: point.longitude,
            angleLongitude: angle.longitude,
            orb: round(orb),
            allowableOrb
          },
          derivationPath: [point.provenance.ruleId, angle.provenance.ruleId, "shortest angular distance"],
          inclusionReasons: [
            point.kind === "lunar_node"
              ? "A mean lunar node is tightly conjunct a calculated angle."
              : "A chart point is conjunct a calculated angle within the approved orb."
          ]
        })
      });
    }
  }
  return contacts.sort((left, right) => left.id.localeCompare(right.id));
}

function cuspProximitiesFor(facts: NormalizedChartFacts): CuspProximityFact[] {
  if (
    facts.calculationMode === "signs-aspects-only" ||
    facts.houseSystem !== "placidus"
  ) {
    return [];
  }
  const points = facts.points.filter((point) => point.kind !== "angle");
  const proximities: CuspProximityFact[] = [];
  for (const point of points) {
    for (const cusp of facts.houseCusps) {
      const delta = signedDelta(cusp.longitude, point.longitude);
      const distance = Math.abs(delta);
      if (distance > ASTRA_CUSP_PROXIMITY_ORB) continue;
      proximities.push({
        id: `cusp-proximity:${point.id}:${cusp.house}`,
        pointId: point.id,
        cuspHouse: cusp.house,
        distance: round(distance),
        side: distance <= 0.0001 ? "exact" : delta < 0 ? "before" : "after",
        provenance: structuralProvenance(facts, {
          ruleId: "v2.phase2.cusp-proximity.placidus",
          sources: [point, cusp],
          measurements: {
            pointLongitude: point.longitude,
            cuspLongitude: cusp.longitude,
            distance: round(distance),
            allowableOrb: ASTRA_CUSP_PROXIMITY_ORB
          },
          derivationPath: [point.provenance.ruleId, cusp.provenance.ruleId, "shortest signed cusp distance"],
          confidenceTier: "high",
          inclusionReasons: ["The point lies within the accepted Placidus cusp-proximity orb."],
          confidenceReductionReasons: ["Cusp proximity qualifies house emphasis; it does not replace the calculated house placement."]
        })
      });
    }
  }
  return proximities.sort((left, right) => left.id.localeCompare(right.id));
}

function combinations<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  function visit(start: number, selected: T[]) {
    if (selected.length === size) {
      result.push([...selected]);
      return;
    }
    for (let index = start; index <= values.length - (size - selected.length); index += 1) {
      const value = values[index];
      if (value === undefined) continue;
      selected.push(value);
      visit(index + 1, selected);
      selected.pop();
    }
  }
  visit(0, []);
  return result;
}

function aspectKey(left: string, right: string, type: NormalizedAspect["type"]) {
  return `${[left, right].sort().join(":")}:${type}`;
}

function configurationAspectMap(facts: NormalizedChartFacts) {
  return new Map(
    facts.aspects
      .filter((aspect) => aspect.geometryEligible)
      .map((aspect) => [aspectKey(aspect.sourceId, aspect.targetId, aspect.type), aspect])
  );
}

function aspectFor(
  aspects: Map<string, NormalizedAspect>,
  left: string,
  right: string,
  type: NormalizedAspect["type"]
) {
  return aspects.get(aspectKey(left, right, type));
}

function participantPoints(
  ids: string[],
  points: Map<string, NormalizedChartPoint>
) {
  return ids.flatMap((id) => {
    const point = points.get(id);
    return point ? [point] : [];
  });
}

function configurationFact(
  facts: NormalizedChartFacts,
  points: Map<string, NormalizedChartPoint>,
  type: ConfigurationType,
  ids: string[],
  aspects: NormalizedAspect[],
  options: {
    focalPointId?: string;
    dimension?: "sign" | "house";
    dimensionValue?: string;
    fullSpan?: number;
    extraSources?: Array<{ provenance: FactProvenance }>;
  } = {}
): ConfigurationFact {
  const participantIds = [...ids].sort();
  const participants = participantPoints(participantIds, points);
  const houses = facts.calculationMode === "signs-aspects-only"
    ? []
    : unique(participants.flatMap((point) => point.house ? [point.house] : [])).sort((a, b) => a - b);
  const maxOrb = aspects.length > 0 ? Math.max(...aspects.map((aspect) => aspect.orb)) : 0;
  const suffix = [
    participantIds.join(":"),
    ...(options.focalPointId ? [`focal-${options.focalPointId}`] : []),
    ...(options.dimension ? [options.dimension, options.dimensionValue ?? ""] : [])
  ].join(":");
  return {
    id: `configuration:${type}:${suffix}`,
    type,
    participantIds,
    ...(options.focalPointId ? { focalPointId: options.focalPointId } : {}),
    aspectIds: aspects.map((aspect) => aspect.id).sort(),
    signs: unique(participants.map((point) => point.sign)).sort(),
    ...(houses.length > 0 ? { houses } : {}),
    ...(options.dimension ? { dimension: options.dimension } : {}),
    ...(options.dimensionValue ? { dimensionValue: options.dimensionValue } : {}),
    ...(options.fullSpan !== undefined ? { fullSpan: round(options.fullSpan) } : {}),
    maxOrb: round(maxOrb),
    geometryConfidence: "exact",
    provenance: structuralProvenance(facts, {
      ruleId: `v2.phase2.configuration.${type.replaceAll("_", "-")}`,
      sources: [...participants, ...aspects, ...(options.extraSources ?? [])],
      measurements: {
        participantCount: participantIds.length,
        aspectCount: aspects.length,
        maxOrb: round(maxOrb),
        ...(options.fullSpan !== undefined ? { fullSpan: round(options.fullSpan) } : {})
      },
      derivationPath: [
        ...aspects.map((aspect) => aspect.id),
        ...(options.dimension ? [`${options.dimension}:${options.dimensionValue}`] : [])
      ],
      inclusionReasons: ["Every required participant and geometric relationship satisfies the accepted Phase 2 rule."]
    })
  };
}

function conjunctionClusters(
  facts: NormalizedChartFacts,
  points: Map<string, NormalizedChartPoint>,
  eligibleIds: string[],
  aspects: Map<string, NormalizedAspect>
) {
  const adjacency = new Map<string, Set<string>>();
  for (const left of eligibleIds) adjacency.set(left, new Set());
  for (const [left, right] of combinations(eligibleIds, 2)) {
    if (!left || !right) continue;
    if (!aspectFor(aspects, left, right, "conjunction")) continue;
    adjacency.get(left)?.add(right);
    adjacency.get(right)?.add(left);
  }
  const visited = new Set<string>();
  const results: ConfigurationFact[] = [];
  for (const start of eligibleIds) {
    if (visited.has(start)) continue;
    const stack = [start];
    const component: string[] = [];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      component.push(current);
      stack.push(...(adjacency.get(current) ?? []));
    }
    if (component.length < 3) continue;
    const componentAspects = combinations(component, 2).flatMap(([left, right]) => {
      if (!left || !right) return [];
      const aspect = aspectFor(aspects, left, right, "conjunction");
      return aspect ? [aspect] : [];
    });
    results.push(configurationFact(
      facts,
      points,
      "conjunction_cluster",
      component,
      componentAspects
    ));
  }
  return results;
}

function circularSpan(values: number[]) {
  const sorted = values.map(normalizeDegrees).sort((left, right) => left - right);
  if (sorted.length <= 1) return { span: 0, adjacentGaps: [] as number[] };
  const gaps = sorted.map((value, index) => {
    const next = sorted[(index + 1) % sorted.length];
    if (next === undefined) return 0;
    return normalizeDegrees(next - value);
  });
  const largestGap = Math.max(...gaps);
  const largestIndex = gaps.indexOf(largestGap);
  const ordered = [
    ...sorted.slice(largestIndex + 1),
    ...sorted.slice(0, largestIndex + 1).map((value) => value + 360)
  ];
  return {
    span: (ordered[ordered.length - 1] ?? 0) - (ordered[0] ?? 0),
    adjacentGaps: ordered.slice(1).map((value, index) => value - (ordered[index] ?? value))
  };
}

function maximalQualifyingSubsets(points: NormalizedChartPoint[]) {
  const qualifying: Array<{ ids: string[]; span: number }> = [];
  for (let size = 3; size <= points.length; size += 1) {
    for (const candidate of combinations(points, size)) {
      const geometry = circularSpan(candidate.map((point) => point.longitude));
      if (geometry.span > 16 || geometry.adjacentGaps.some((gap) => gap > 8)) continue;
      qualifying.push({ ids: candidate.map((point) => point.id).sort(), span: geometry.span });
    }
  }
  return qualifying.filter((candidate) =>
    !qualifying.some((other) =>
      other.ids.length > candidate.ids.length &&
      candidate.ids.every((id) => other.ids.includes(id))
    )
  );
}

function stellia(
  facts: NormalizedChartFacts,
  points: Map<string, NormalizedChartPoint>,
  eligible: NormalizedChartPoint[],
  aspects: Map<string, NormalizedAspect>
) {
  const groups: Array<{
    dimension: "sign" | "house";
    value: string;
    points: NormalizedChartPoint[];
  }> = [];
  for (const sign of signNames) {
    groups.push({
      dimension: "sign",
      value: sign,
      points: eligible.filter((point) => point.sign === sign)
    });
  }
  if (facts.calculationMode !== "signs-aspects-only") {
    for (let house = 1; house <= 12; house += 1) {
      groups.push({
        dimension: "house",
        value: String(house),
        points: eligible.filter((point) => point.house === house)
      });
    }
  }
  return groups.flatMap((group) =>
    maximalQualifyingSubsets(group.points).map((candidate) => {
      const memberAspects = combinations(candidate.ids, 2).flatMap(([left, right]) => {
        if (!left || !right) return [];
        const aspect = aspectFor(aspects, left, right, "conjunction");
        return aspect ? [aspect] : [];
      });
      return configurationFact(
        facts,
        points,
        "stellium",
        candidate.ids,
        memberAspects,
        {
          dimension: group.dimension,
          dimensionValue: group.value,
          fullSpan: candidate.span
        }
      );
    })
  );
}

function aspectSet(
  aspects: Map<string, NormalizedAspect>,
  requirements: Array<[string, string, NormalizedAspect["type"]]>
) {
  const found = requirements.map(([left, right, type]) => aspectFor(aspects, left, right, type));
  return found.every(Boolean) ? found as NormalizedAspect[] : null;
}

function majorConfigurations(
  facts: NormalizedChartFacts,
  points: Map<string, NormalizedChartPoint>,
  eligibleIds: string[],
  aspects: Map<string, NormalizedAspect>
) {
  const results = new Map<string, ConfigurationFact>();

  for (const trio of combinations(eligibleIds, 3)) {
    for (const apex of trio) {
      const bases = trio.filter((id) => id !== apex);
      const left = bases[0];
      const right = bases[1];
      if (!left || !right) continue;
      const tSquareAspects = aspectSet(aspects, [
        [apex, left, "square"],
        [apex, right, "square"],
        [left, right, "opposition"]
      ]);
      if (tSquareAspects) {
        const fact = configurationFact(facts, points, "t_square", trio, tSquareAspects, {
          focalPointId: apex
        });
        results.set(fact.id, fact);
      }
      const yodAspects = aspectSet(aspects, [
        [apex, left, "quincunx"],
        [apex, right, "quincunx"],
        [left, right, "sextile"]
      ]);
      if (yodAspects) {
        const fact = configurationFact(facts, points, "yod", trio, yodAspects, {
          focalPointId: apex
        });
        results.set(fact.id, fact);
      }
    }
    const [first, second, third] = trio;
    if (!first || !second || !third) continue;
    const trines = aspectSet(aspects, [
      [first, second, "trine"],
      [first, third, "trine"],
      [second, third, "trine"]
    ]);
    if (trines) {
      const fact = configurationFact(facts, points, "grand_trine", trio, trines);
      results.set(fact.id, fact);
    }
  }

  for (const quartet of combinations(eligibleIds, 4)) {
    const pairs = combinations(quartet, 2) as Array<[string, string]>;
    const squareAspects = pairs.flatMap(([left, right]) => {
      const aspect = aspectFor(aspects, left, right, "square");
      return aspect ? [aspect] : [];
    });
    const oppositionAspects = pairs.flatMap(([left, right]) => {
      const aspect = aspectFor(aspects, left, right, "opposition");
      return aspect ? [aspect] : [];
    });
    if (squareAspects.length === 4 && oppositionAspects.length === 2) {
      const fact = configurationFact(
        facts,
        points,
        "grand_cross",
        quartet,
        [...squareAspects, ...oppositionAspects]
      );
      results.set(fact.id, fact);
    }

    const trineAspects = pairs.flatMap(([left, right]) => {
      const aspect = aspectFor(aspects, left, right, "trine");
      return aspect ? [aspect] : [];
    });
    const sextileAspects = pairs.flatMap(([left, right]) => {
      const aspect = aspectFor(aspects, left, right, "sextile");
      return aspect ? [aspect] : [];
    });
    if (
      oppositionAspects.length === 2 &&
      trineAspects.length === 2 &&
      sextileAspects.length === 2
    ) {
      const fact = configurationFact(
        facts,
        points,
        "mystic_rectangle",
        quartet,
        [...oppositionAspects, ...trineAspects, ...sextileAspects]
      );
      results.set(fact.id, fact);
    }

    for (const tail of quartet) {
      const trineParticipants = quartet.filter((id) => id !== tail);
      const [first, second, third] = trineParticipants;
      if (!first || !second || !third) continue;
      const grandTrine = aspectSet(aspects, [
        [first, second, "trine"],
        [first, third, "trine"],
        [second, third, "trine"]
      ]);
      if (!grandTrine) continue;
      for (const opposed of trineParticipants) {
        const sextileTargets = trineParticipants.filter((id) => id !== opposed);
        const [left, right] = sextileTargets;
        if (!left || !right) continue;
        const kiteEdges = aspectSet(aspects, [
          [tail, opposed, "opposition"],
          [tail, left, "sextile"],
          [tail, right, "sextile"]
        ]);
        if (!kiteEdges) continue;
        const fact = configurationFact(
          facts,
          points,
          "kite",
          quartet,
          [...grandTrine, ...kiteEdges],
          { focalPointId: opposed }
        );
        results.set(fact.id, fact);
      }
    }
  }

  return [...results.values()];
}

function configurationsFor(
  facts: NormalizedChartFacts,
  points: Map<string, NormalizedChartPoint>
) {
  const eligible = facts.points.filter((point) =>
    point.kind === "luminary" || point.kind === "planet"
  );
  const eligibleIds = eligible.map((point) => point.id);
  const aspects = configurationAspectMap(facts);
  return [
    ...conjunctionClusters(facts, points, eligibleIds, aspects),
    ...stellia(facts, points, eligible, aspects),
    ...majorConfigurations(facts, points, eligibleIds, aspects)
  ].sort((left, right) => left.id.localeCompare(right.id));
}

function countBy(
  points: NormalizedChartPoint[],
  categories: string[],
  classify: (point: NormalizedChartPoint) => string | undefined
) {
  const counts = Object.fromEntries(categories.map((category) => [category, 0]));
  for (const point of points) {
    const category = classify(point);
    if (category && category in counts) counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}

function distributionFact(
  facts: NormalizedChartFacts,
  dimension: DistributionDimension,
  counts: Record<string, number>,
  sources: NormalizedChartPoint[]
): DistributionFact {
  const maximum = Math.max(...Object.values(counts));
  return {
    id: `distribution:${dimension}`,
    dimension,
    counts,
    leaders: Object.entries(counts)
      .filter(([, count]) => count === maximum)
      .map(([name]) => name)
      .sort(),
    relativeAbsences: Object.entries(counts)
      .filter(([, count]) => count === 0)
      .map(([name]) => name)
      .sort(),
    claimBoundary: "A zero count is relative chart emphasis, not evidence that a human capacity is absent.",
    provenance: structuralProvenance(facts, {
      ruleId: `v2.phase2.distribution.${dimension.replaceAll("_", "-")}`,
      sources,
      measurements: Object.fromEntries(
        Object.entries(counts).map(([name, count]) => [`count:${name}`, count])
      ),
      derivationPath: sources.map((point) => point.provenance.ruleId),
      inclusionReasons: ["Eligible luminary and planetary placements were counted once in the declared distribution."]
    })
  };
}

function distributionsFor(facts: NormalizedChartFacts): DistributionFact[] {
  const eligible = facts.points.filter((point) =>
    point.kind === "luminary" || point.kind === "planet"
  );
  const signDistributions = [
    distributionFact(
      facts,
      "element",
      countBy(eligible, ["fire", "earth", "air", "water"], (point) =>
        isSignName(point.sign) ? signTraits[point.sign].element : undefined
      ),
      eligible
    ),
    distributionFact(
      facts,
      "modality",
      countBy(eligible, ["cardinal", "fixed", "mutable"], (point) =>
        isSignName(point.sign) ? signTraits[point.sign].modality : undefined
      ),
      eligible
    ),
    distributionFact(
      facts,
      "polarity",
      countBy(eligible, ["positive", "negative"], (point) =>
        isSignName(point.sign) ? signTraits[point.sign].polarity : undefined
      ),
      eligible
    )
  ];
  if (facts.calculationMode === "signs-aspects-only") return signDistributions;
  const houseEligible = eligible.filter((point) => point.house !== undefined);
  if (houseEligible.length === 0) return signDistributions;
  return [
    ...signDistributions,
    distributionFact(
      facts,
      "horizontal_hemisphere",
      countBy(houseEligible, ["northern", "southern"], (point) =>
        (point.house ?? 0) <= 6 ? "northern" : "southern"
      ),
      houseEligible
    ),
    distributionFact(
      facts,
      "vertical_hemisphere",
      countBy(houseEligible, ["eastern", "western"], (point) =>
        [10, 11, 12, 1, 2, 3].includes(point.house ?? 0) ? "eastern" : "western"
      ),
      houseEligible
    ),
    distributionFact(
      facts,
      "quadrant",
      countBy(houseEligible, ["first", "second", "third", "fourth"], (point) => {
        const house = point.house ?? 0;
        if (house <= 3) return "first";
        if (house <= 6) return "second";
        if (house <= 9) return "third";
        return "fourth";
      }),
      houseEligible
    ),
    distributionFact(
      facts,
      "house_mode",
      countBy(houseEligible, ["angular", "succedent", "cadent"], (point) =>
        point.houseMode
      ),
      houseEligible
    )
  ];
}

function lunarPhaseFor(facts: NormalizedChartFacts): LunarPhaseFact {
  const sun = facts.points.find((point) => point.id === "sun");
  const moon = facts.points.find((point) => point.id === "moon");
  if (!sun || !moon) {
    throw new Error("Phase 2 lunar phase requires normalized Sun and Moon facts.");
  }
  const elongation = round(normalizeDegrees(moon.longitude - sun.longitude));
  const phaseIndex = Math.floor(normalizeDegrees(elongation + 22.5) / 45) % 8;
  const phases: LunarPhaseName[] = [
    "new",
    "waxing_crescent",
    "first_quarter",
    "waxing_gibbous",
    "full",
    "waning_gibbous",
    "last_quarter",
    "waning_crescent"
  ];
  const phase = phases[phaseIndex] ?? "new";
  const sunMoonAspect = facts.aspects.find((aspect) =>
    [aspect.sourceId, aspect.targetId].includes("sun") &&
    [aspect.sourceId, aspect.targetId].includes("moon")
  );
  return {
    id: "lunar-phase",
    phase,
    elongation,
    cycle: elongation <= 0.01 || Math.abs(elongation - 180) <= 0.01
      ? "lunation"
      : elongation < 180
        ? "waxing"
        : "waning",
    ...(sunMoonAspect ? { sunMoonAspectId: sunMoonAspect.id } : {}),
    provenance: structuralProvenance(facts, {
      ruleId: "v2.phase2.solar-lunar.lunar-phase",
      sources: [sun, moon, ...(sunMoonAspect ? [sunMoonAspect] : [])],
      measurements: {
        sunLongitude: sun.longitude,
        moonLongitude: moon.longitude,
        elongation
      },
      derivationPath: [
        sun.provenance.ruleId,
        moon.provenance.ruleId,
        "directed Moon-minus-Sun elongation",
        "eight 45-degree phase sectors centered on the principal phases"
      ],
      inclusionReasons: ["The directed elongation places the Moon in one deterministic eight-phase sector."]
    })
  };
}

function personalActivationsFor(
  facts: NormalizedChartFacts,
  chartRuler: ChartRulerFact | undefined,
  angularContacts: AngularContactFact[]
): PersonalActivationFact[] {
  const outerIds = new Set(["uranus", "neptune", "pluto"]);
  const personalIds = new Set(["sun", "moon", "mercury", "venus", "mars"]);
  const targets = facts.points.filter((point) =>
    outerIds.has(point.id) || point.kind === "chiron" || point.kind === "lunar_node"
  );
  const angleIds = new Set(
    facts.calculationMode === "signs-aspects-only"
      ? []
      : facts.points.filter((point) => point.kind === "angle").map((point) => point.id)
  );

  return targets.map((target) => {
    const activatorIds = new Set(personalIds);
    if (chartRuler) activatorIds.add(chartRuler.rulerPointId);
    if (outerIds.has(target.id) || target.kind === "chiron") {
      for (const node of facts.points.filter((point) => point.kind === "lunar_node")) {
        activatorIds.add(node.id);
      }
    }
    for (const angleId of angleIds) activatorIds.add(angleId);
    activatorIds.delete(target.id);

    const candidateAspectEvidence = facts.aspects.filter((aspect) => {
      if (![aspect.sourceId, aspect.targetId].includes(target.id)) return false;
      const otherId = aspect.sourceId === target.id ? aspect.targetId : aspect.sourceId;
      if (!activatorIds.has(otherId)) return false;
      if (angleIds.has(otherId)) return false;
      if (
        otherId === "north-node" ||
        otherId === "south-node" ||
        target.kind === "lunar_node"
      ) {
        return aspect.orb <= ASTRA_NODE_CONTACT_ORB;
      }
      return aspect.orb <= aspect.configurationOrb;
    });
    const seenAspectOrigins = new Set<string>();
    const aspectEvidence = candidateAspectEvidence.filter((aspect) => {
      const originKey = sortedUnique(aspect.provenance.sourceFactIds).join("|");
      if (seenAspectOrigins.has(originKey)) return false;
      seenAspectOrigins.add(originKey);
      return true;
    });
    const angularEvidence = angularContacts.filter((contact) =>
      contact.pointId === target.id && activatorIds.has(contact.angleId)
    );
    const evidenceIds = [
      ...aspectEvidence.map((aspect) => aspect.id),
      ...angularEvidence.map((contact) => contact.id)
    ].sort();
    const activatorPointIds = sortedUnique([
      ...aspectEvidence.map((aspect) =>
        aspect.sourceId === target.id ? aspect.targetId : aspect.sourceId
      ),
      ...angularEvidence.map((contact) => contact.angleId)
    ]);
    const personalized = evidenceIds.length > 0;
    const targetKind: PersonalActivationFact["targetKind"] = outerIds.has(target.id)
      ? "outer_planet"
      : target.kind === "chiron"
        ? "chiron"
        : "lunar_node";
    return {
      id: `personal-activation:${target.id}`,
      targetPointId: target.id,
      targetKind,
      personalized,
      activatorPointIds,
      evidenceIds,
      provenance: structuralProvenance(facts, {
        ruleId: `v2.phase2.personal-activation.${targetKind.replaceAll("_", "-")}`,
        sources: [target, ...aspectEvidence, ...angularEvidence],
        measurements: {
          evidenceCount: evidenceIds.length,
          activatorCount: activatorPointIds.length,
          personalized
        },
        derivationPath: [
          target.provenance.ruleId,
          ...evidenceIds,
          "approved personal-activation contacts"
        ],
        confidenceTier: personalized ? "exact" : "bounded",
        inclusionReasons: [
          personalized
            ? "At least one approved tight contact connects the slower factor to a personal activator."
            : "The slower factor is retained with an explicit unpersonalized status."
        ],
        confidenceReductionReasons: personalized
          ? []
          : ["No approved tight personal activation is present; this factor cannot anchor a strong personal claim."]
      })
    };
  }).sort((left, right) => left.id.localeCompare(right.id));
}

export function deriveStructuralChartFacts(facts: NormalizedChartFacts): StructuralChartFacts {
  const points = pointMap(facts);
  const chartRuler = chartRulerFor(facts, points);
  const houseRulers = houseRulersFor(facts, points);
  const dispositors = dispositorsFor(facts, points);
  const dispositorLoops = dispositorLoopsFor(facts, dispositors);
  const dispositorChains = dispositorChainsFor(facts, dispositors, dispositorLoops);
  const finalDispositors = finalDispositorsFor(facts, dispositorChains, dispositors);
  const mutualReceptions = mutualReceptionsFor(facts, dispositors);
  const angularContacts = angularContactsFor(facts);

  return {
    rulesetVersion: ASTRA_V2_PHASE_2_RULESET_VERSION,
    calculationMode: facts.calculationMode,
    ...(chartRuler ? { chartRuler } : {}),
    houseRulers,
    dispositors,
    dispositorChains,
    dispositorLoops,
    finalDispositors,
    mutualReceptions,
    modernAffinities: modernAffinitiesFor(facts),
    angularContacts,
    cuspProximities: cuspProximitiesFor(facts),
    configurations: configurationsFor(facts, points),
    distributions: distributionsFor(facts),
    lunarPhase: lunarPhaseFor(facts),
    personalActivations: personalActivationsFor(facts, chartRuler, angularContacts)
  };
}
