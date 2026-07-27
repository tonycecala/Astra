import type { ChartCalculationMode, ChartSettings } from "@astra/contracts";

type ZodiacMode = ChartSettings["zodiacMode"];
type HouseSystemMode = ChartSettings["houseSystem"];

export const ASTRA_V2_DOCTRINE_VERSION = "2.0.0-phase-3";
export const ASTRA_LUNAR_NODE_POLICY = "mean" as const;

export const ASTRA_NATAL_ASPECT_RULES = {
  conjunction: { angle: 0, ordinaryOrb: 8, configurationOrb: 6 },
  opposition: { angle: 180, ordinaryOrb: 8, configurationOrb: 6 },
  square: { angle: 90, ordinaryOrb: 7, configurationOrb: 5 },
  trine: { angle: 120, ordinaryOrb: 7, configurationOrb: 5 },
  sextile: { angle: 60, ordinaryOrb: 5, configurationOrb: 4 },
  quincunx: { angle: 150, ordinaryOrb: 3, configurationOrb: 2.5 }
} as const;

export const ASTRA_NODE_CONTACT_ORB = 3;
export const ASTRA_ANGLE_CONJUNCTION_ORB = 5;

export type NormalizedAspectType = keyof typeof ASTRA_NATAL_ASPECT_RULES;
export type NormalizedPointKind = "luminary" | "planet" | "chiron" | "lunar_node" | "angle";
export type HouseMode = "angular" | "succedent" | "cadent";
export type AspectPhase = "applying" | "separating" | "exact" | "stationary" | "unknown" | "not_applicable";
export type ProvenanceConfidence = "exact" | "high" | "bounded";

export type FactProvenance = {
  ruleId: string;
  sourceFactIds: string[];
  zodiacMode: ZodiacMode;
  houseSystem: HouseSystemMode;
  calculationMode: ChartCalculationMode | "legacy";
  measurements: Record<string, number | string | boolean>;
  derivationPath: string[];
  confidenceTier: ProvenanceConfidence;
  inclusionReasons: string[];
  confidenceReductionReasons: string[];
};

export type RawNormalizedPointInput = {
  id: string;
  label: string;
  kind: Exclude<NormalizedPointKind, "angle" | "lunar_node">;
  longitude: number;
  house?: number;
  retrograde?: boolean;
  dailyMotion?: number;
  sourceFactId?: string;
};

export type RawLunarNodeInput = {
  id: "north-node" | "south-node";
  label: "North Node" | "South Node";
  longitude: number;
  house?: number;
  dailyMotion?: number;
  sourceFactId?: string;
};

export type RawAngleInput = {
  id: "ascendant" | "midheaven";
  label: "Ascendant" | "Midheaven";
  longitude: number;
  sourceFactId?: string;
};

type AnyAngleInput = Omit<RawAngleInput, "id" | "label"> & {
  id: string;
  label: string;
};

export type RawHouseCuspInput = {
  house: number;
  longitude: number;
  sourceFactId?: string;
};

export type NormalizeAstrologyChartFactsInput = {
  zodiacMode: ZodiacMode;
  houseSystem: HouseSystemMode;
  calculationMode: ChartCalculationMode | "legacy";
  points: RawNormalizedPointInput[];
  lunarNodes?: RawLunarNodeInput[];
  angles?: RawAngleInput[];
  houseCusps?: RawHouseCuspInput[];
};

export type NormalizedChartPoint = {
  id: string;
  label: string;
  kind: NormalizedPointKind;
  longitude: number;
  sign: string;
  degree: number;
  house?: number;
  houseMode?: HouseMode;
  retrograde: boolean | null;
  dailyMotion?: number;
  provenance: FactProvenance;
};

export type NormalizedAspect = {
  id: string;
  type: NormalizedAspectType;
  sourceId: string;
  targetId: string;
  exactAngle: number;
  measuredDistance: number;
  orb: number;
  allowableOrb: number;
  configurationOrb: number;
  geometryEligible: boolean;
  phase: AspectPhase;
  phaseDelta?: number;
  provenance: FactProvenance;
};

export type NormalizedHouseCusp = {
  id: string;
  house: number;
  longitude: number;
  provenance: FactProvenance;
};

export type NormalizedChartFacts = {
  doctrineVersion: typeof ASTRA_V2_DOCTRINE_VERSION;
  zodiacMode: ZodiacMode;
  houseSystem: HouseSystemMode;
  calculationMode: ChartCalculationMode | "legacy";
  nodePolicy: typeof ASTRA_LUNAR_NODE_POLICY;
  points: NormalizedChartPoint[];
  aspects: NormalizedAspect[];
  houseCusps: NormalizedHouseCusp[];
};

const zodiacSignNames = [
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

const angleOpposites = {
  ascendant: { id: "descendant", label: "Descendant" },
  midheaven: { id: "imum-coeli", label: "IC" }
} as const;

function round(value: number, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function shortestSignedDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function angularDistance(left: number, right: number) {
  return Math.abs(shortestSignedDelta(left, right));
}

function signForLongitude(longitude: number) {
  return zodiacSignNames[Math.floor(normalizeDegrees(longitude) / 30)] ?? zodiacSignNames[0];
}

function validHouse(house: number | undefined) {
  return Number.isInteger(house) && (house ?? 0) >= 1 && (house ?? 0) <= 12 ? house : undefined;
}

export function classifyHouseMode(house: number): HouseMode {
  if ([1, 4, 7, 10].includes(house)) return "angular";
  if ([2, 5, 8, 11].includes(house)) return "succedent";
  return "cadent";
}

function provenance(
  input: NormalizeAstrologyChartFactsInput,
  detail: Omit<FactProvenance, "zodiacMode" | "houseSystem" | "calculationMode">
): FactProvenance {
  return {
    ...detail,
    zodiacMode: input.zodiacMode,
    houseSystem: input.houseSystem,
    calculationMode: input.calculationMode
  };
}

function normalizedPoint(
  input: NormalizeAstrologyChartFactsInput,
  point: RawNormalizedPointInput | RawLunarNodeInput,
  kind: Exclude<NormalizedPointKind, "angle">,
  ruleId: string,
  sourceFactIds = [point.sourceFactId ?? `raw:${point.id}`]
): NormalizedChartPoint {
  const longitude = round(normalizeDegrees(point.longitude));
  const house = input.calculationMode === "signs-aspects-only" ? undefined : validHouse(point.house);
  const retrograde = kind === "lunar_node"
    ? null
    : "retrograde" in point
      ? point.retrograde ?? false
      : false;
  return {
    id: point.id,
    label: point.label,
    kind,
    longitude,
    sign: signForLongitude(longitude),
    degree: round(longitude % 30),
    ...(house ? { house, houseMode: classifyHouseMode(house) } : {}),
    retrograde,
    ...(Number.isFinite(point.dailyMotion) ? { dailyMotion: round(point.dailyMotion ?? 0, 6) } : {}),
    provenance: provenance(input, {
      ruleId,
      sourceFactIds,
      measurements: {
        longitude,
        ...(house ? { house } : {}),
        ...(kind !== "lunar_node" ? { retrograde: retrograde ?? false } : {})
      },
      derivationPath: sourceFactIds,
      confidenceTier: "exact",
      inclusionReasons: [kind === "lunar_node" ? "Mean lunar node supplied by the calculation engine." : "First-class calculated chart point."],
      confidenceReductionReasons: []
    })
  };
}

function normalizedAngle(
  input: NormalizeAstrologyChartFactsInput,
  angle: AnyAngleInput,
  derived = false
): NormalizedChartPoint {
  const longitude = round(normalizeDegrees(angle.longitude));
  const sourceFactId = angle.sourceFactId ?? `raw:${angle.id}`;
  return {
    id: angle.id,
    label: angle.label,
    kind: "angle",
    longitude,
    sign: signForLongitude(longitude),
    degree: round(longitude % 30),
    retrograde: null,
    provenance: provenance(input, {
      ruleId: derived ? "v2.phase1.angle.opposite" : "v2.phase1.angle.calculated",
      sourceFactIds: [sourceFactId],
      measurements: { longitude },
      derivationPath: [sourceFactId, ...(derived ? ["add 180 degrees"] : [])],
      confidenceTier: derived ? "high" : "exact",
      inclusionReasons: [derived ? "Opposite angle derived from its calculated axis origin." : "Calculated angle is eligible in full mode."],
      confidenceReductionReasons: []
    })
  };
}

function nodePair(input: NormalizeAstrologyChartFactsInput) {
  const north = input.lunarNodes?.find((node) => node.id === "north-node");
  const suppliedSouth = input.lunarNodes?.find((node) => node.id === "south-node");
  if (!north && !suppliedSouth) return [];
  const source = north ?? {
    ...suppliedSouth!,
    id: "north-node" as const,
    label: "North Node" as const,
    longitude: normalizeDegrees(suppliedSouth!.longitude + 180)
  };
  const southLongitude = normalizeDegrees(source.longitude + 180);
  const south: RawLunarNodeInput = {
    id: "south-node",
    label: "South Node",
    longitude: southLongitude,
    ...(suppliedSouth?.house ? { house: suppliedSouth.house } : {}),
    ...(Number.isFinite(source.dailyMotion) ? { dailyMotion: source.dailyMotion } : {}),
    sourceFactId: suppliedSouth?.sourceFactId ?? source.sourceFactId
  };
  const sourceFactIds = [
    source.sourceFactId ?? "raw:north-node",
    ...(suppliedSouth ? [suppliedSouth.sourceFactId ?? "raw:south-node"] : [])
  ];
  return [
    normalizedPoint(input, source, "lunar_node", "v2.phase1.node.mean.north", sourceFactIds),
    normalizedPoint(input, south, "lunar_node", "v2.phase1.node.mean.south-opposite", sourceFactIds)
  ];
}

function aspectPhase(
  source: NormalizedChartPoint,
  target: NormalizedChartPoint,
  exactAngle: number,
  orb: number
): { phase: AspectPhase; phaseDelta?: number } {
  if (source.kind === "angle" || target.kind === "angle") return { phase: "not_applicable" };
  if (orb <= 0.01) return { phase: "exact", phaseDelta: 0 };
  if (!Number.isFinite(source.dailyMotion) || !Number.isFinite(target.dailyMotion)) return { phase: "unknown" };
  const sampleDays = 1 / 24;
  const futureSource = source.longitude + (source.dailyMotion ?? 0) * sampleDays;
  const futureTarget = target.longitude + (target.dailyMotion ?? 0) * sampleDays;
  const futureOrb = Math.abs(angularDistance(futureSource, futureTarget) - exactAngle);
  const phaseDelta = round(futureOrb - orb, 6);
  if (Math.abs(phaseDelta) <= 0.0001) return { phase: "stationary", phaseDelta };
  return { phase: phaseDelta < 0 ? "applying" : "separating", phaseDelta };
}

function aspectCandidate(
  input: NormalizeAstrologyChartFactsInput,
  source: NormalizedChartPoint,
  target: NormalizedChartPoint
): NormalizedAspect | null {
  const distance = angularDistance(source.longitude, target.longitude);
  const hasNode = source.kind === "lunar_node" || target.kind === "lunar_node";
  const hasAngle = source.kind === "angle" || target.kind === "angle";
  if (source.kind === "lunar_node" && target.kind === "lunar_node") return null;
  if (hasAngle && hasNode) return null;

  const candidates = (Object.entries(ASTRA_NATAL_ASPECT_RULES) as Array<
    [NormalizedAspectType, (typeof ASTRA_NATAL_ASPECT_RULES)[NormalizedAspectType]]
  >).filter(([type]) => {
    if (hasAngle) return type === "conjunction";
    if (hasNode) return type === "conjunction" || type === "opposition";
    return true;
  });

  for (const [type, rule] of candidates) {
    const orb = Math.abs(distance - rule.angle);
    const allowableOrb = hasAngle
      ? ASTRA_ANGLE_CONJUNCTION_ORB
      : hasNode
        ? ASTRA_NODE_CONTACT_ORB
        : rule.ordinaryOrb;
    if (orb > allowableOrb) continue;
    const phase = aspectPhase(source, target, rule.angle, orb);
    const ids = [source.id, target.id].sort();
    const sourceFactIds = [source.provenance.sourceFactIds, target.provenance.sourceFactIds].flat();
    return {
      id: `${ids[0]}:${ids[1]}:${type}`,
      type,
      sourceId: source.id,
      targetId: target.id,
      exactAngle: rule.angle,
      measuredDistance: round(distance),
      orb: round(orb),
      allowableOrb,
      configurationOrb: rule.configurationOrb,
      geometryEligible: !hasAngle && !hasNode && orb <= rule.configurationOrb,
      phase: phase.phase,
      ...(phase.phaseDelta !== undefined ? { phaseDelta: phase.phaseDelta } : {}),
      provenance: provenance(input, {
        ruleId: hasAngle
          ? "v2.phase1.aspect.angle-conjunction"
          : hasNode
            ? "v2.phase1.aspect.node-contact"
            : `v2.phase1.aspect.${type}`,
        sourceFactIds,
        measurements: {
          sourceLongitude: source.longitude,
          targetLongitude: target.longitude,
          measuredDistance: round(distance),
          exactAngle: rule.angle,
          orb: round(orb),
          allowableOrb,
          configurationOrb: rule.configurationOrb
        },
        derivationPath: [...sourceFactIds, `shortest angular distance`, `match ${type}`],
        confidenceTier: "exact",
        inclusionReasons: [
          hasAngle
            ? "Planet is within the approved conjunction orb of a calculated angle."
            : hasNode
              ? "Point is within the approved tight conjunction or opposition orb of a mean lunar node."
              : "Interplanetary geometry is within the approved aspect-specific orb."
        ],
        confidenceReductionReasons: phase.phase === "unknown" ? ["Applying or separating phase is unavailable without motion data."] : []
      })
    };
  }
  return null;
}

export function normalizeAstrologyChartFacts(input: NormalizeAstrologyChartFactsInput): NormalizedChartFacts {
  const points = input.points.map((point) =>
    normalizedPoint(input, point, point.kind, `v2.phase1.point.${point.kind}`)
  );
  points.push(...nodePair(input));

  if (input.calculationMode !== "signs-aspects-only") {
    for (const angle of input.angles ?? []) {
      points.push(normalizedAngle(input, angle));
      const opposite = angleOpposites[angle.id];
      points.push(normalizedAngle(input, {
        id: opposite.id,
        label: opposite.label,
        longitude: normalizeDegrees(angle.longitude + 180),
        sourceFactId: angle.sourceFactId ?? `raw:${angle.id}`
      }, true));
    }
  }

  const aspectPoints = points.filter((point) => point.kind !== "angle");
  const aspects: NormalizedAspect[] = [];
  for (let leftIndex = 0; leftIndex < aspectPoints.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < aspectPoints.length; rightIndex += 1) {
      const left = aspectPoints[leftIndex];
      const right = aspectPoints[rightIndex];
      if (!left || !right) continue;
      const aspect = aspectCandidate(input, left, right);
      if (aspect) aspects.push(aspect);
    }
  }

  if (input.calculationMode !== "signs-aspects-only") {
    const angles = points.filter((point) => point.kind === "angle");
    const bodies = points.filter((point) => point.kind !== "angle" && point.kind !== "lunar_node");
    for (const body of bodies) {
      for (const angle of angles) {
        const aspect = aspectCandidate(input, body, angle);
        if (aspect) aspects.push(aspect);
      }
    }
  }

  const houseCusps = input.calculationMode === "signs-aspects-only"
    ? []
    : (input.houseCusps ?? []).flatMap((cusp) => {
        const house = validHouse(cusp.house);
        if (!house) return [];
        const longitude = round(normalizeDegrees(cusp.longitude));
        const sourceFactId = cusp.sourceFactId ?? `raw:house-cusp:${house}`;
        return [{
          id: `house-cusp:${house}`,
          house,
          longitude,
          provenance: provenance(input, {
            ruleId: "v2.phase1.house-cusp.calculated",
            sourceFactIds: [sourceFactId],
            measurements: { house, longitude },
            derivationPath: [sourceFactId],
            confidenceTier: "exact",
            inclusionReasons: ["Calculated cusp is eligible in full mode."],
            confidenceReductionReasons: []
          })
        }];
      });

  return {
    doctrineVersion: ASTRA_V2_DOCTRINE_VERSION,
    zodiacMode: input.zodiacMode,
    houseSystem: input.houseSystem,
    calculationMode: input.calculationMode,
    nodePolicy: ASTRA_LUNAR_NODE_POLICY,
    points: points.sort((left, right) => left.id.localeCompare(right.id)),
    aspects: aspects.sort((left, right) => left.id.localeCompare(right.id)),
    houseCusps: houseCusps.sort((left, right) => left.house - right.house)
  };
}
