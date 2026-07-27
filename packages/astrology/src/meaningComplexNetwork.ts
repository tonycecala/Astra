import {
  ASTRA_TRADITIONAL_SIGN_RULERS,
  type StructuralChartFacts
} from "./structuralChartFacts";
import {
  type FactProvenance,
  type NormalizedChartFacts,
  type NormalizedChartPoint,
  type ProvenanceConfidence
} from "./normalizedChartFacts";

export const ASTRA_V2_PHASE_3_RULESET_VERSION = "2.0.0-phase-3";
export const ASTRA_MEANING_COMPLEX_MAX_PATH_DEPTH = 3;

export type ReportDomain =
  | "identity"
  | "emotions"
  | "relationships"
  | "work"
  | "agency"
  | "resources"
  | "growth"
  | "integration";

export type SemanticNodeType =
  | "Planet"
  | "Luminary"
  | "Angle"
  | "LunarNode"
  | "Chiron"
  | "Sign"
  | "House"
  | "HouseCusp"
  | "Aspect"
  | "Configuration"
  | "Distribution"
  | "RulershipPath"
  | "PersonalActivation"
  | "LunarPhase"
  | "LifeDomain"
  | "InterpretiveHypothesis";

export type SemanticEdgeType =
  | "located_in_sign"
  | "located_in_house"
  | "rules_sign"
  | "rules_house"
  | "disposes"
  | "modern_affinity"
  | "aspects"
  | "conjunct_angle"
  | "near_cusp"
  | "participates_in_configuration"
  | "routes_domain_to"
  | "reinforces"
  | "qualifies"
  | "contradicts"
  | "derived_from";

type SemanticAttribute = string | number | boolean | string[] | number[] | null;

export type SemanticNode = {
  id: string;
  type: SemanticNodeType;
  label: string;
  domains: ReportDomain[];
  attributes: Record<string, SemanticAttribute>;
  provenance: FactProvenance;
};

export type SemanticEdge = {
  id: string;
  type: SemanticEdgeType;
  sourceNodeId: string;
  targetNodeId: string;
  provenance: FactProvenance;
};

export type EvidencePathRole = "support" | "counterevidence" | "qualifier";

export type EvidencePath = {
  id: string;
  seedNodeId: string;
  terminalNodeId: string;
  nodeIds: string[];
  edgeIds: string[];
  role: EvidencePathRole;
  mechanism: string;
  domains: ReportDomain[];
  sourceFactIds: string[];
  independentOriginIds: string[];
  originKey: string;
  derivationDistance: number;
  pathScore: number;
  aliasPathIds: string[];
  provenance: FactProvenance;
};

export type MeaningComplexScoreComponents = {
  structuralImportance: number;
  aspectPrecision: number;
  angularity: number;
  chartRulerRelevance: number;
  luminaryOrPersonalRelevance: number;
  configurationRole: number;
  independentReinforcement: number;
  lifeDomainRelevance: number;
  contextualActivation: number;
  counterevidenceStrength: number;
  generationalWeakness: number;
  derivationDistance: number;
  semanticRedundancy: number;
  total: number;
};

export type MeaningComplexConfidence = "exploratory" | "supported" | "strong";
export type MeaningComplexPreferredView = "identity" | "core" | "deep" | "all";

export type MeaningComplex = {
  id: string;
  seedNodeIds: string[];
  mechanism: string;
  hypothesis: string;
  domains: ReportDomain[];
  supportPaths: EvidencePath[];
  counterevidence: EvidencePath[];
  qualifiers: string[];
  independentSupportPathIds: string[];
  independentSupportCount: number;
  independentCounterevidenceCount: number;
  collapsedAliasCount: number;
  score: MeaningComplexScoreComponents;
  confidence: MeaningComplexConfidence;
  confidenceReasons: string[];
  confidenceReductionReasons: string[];
  claimBoundary: string;
  preferredView: MeaningComplexPreferredView;
  provenance: FactProvenance;
};

export type MeaningComplexNetwork = {
  rulesetVersion: typeof ASTRA_V2_PHASE_3_RULESET_VERSION;
  calculationMode: NormalizedChartFacts["calculationMode"];
  nodes: SemanticNode[];
  edges: SemanticEdge[];
  complexes: MeaningComplex[];
  audit: {
    seedNodeIds: string[];
    suppressedSeedNodeIds: string[];
    suppressedSeedReasons: Record<string, string>;
    collapsedEvidenceAliasCount: number;
    maximumObservedPathDepth: number;
  };
};

type ProvenanceSource = { provenance: FactProvenance };

type SeedCandidate = {
  nodeId: string;
  mechanism: string;
  domains: ReportDomain[];
  structuralImportance: number;
  preferredView: MeaningComplexPreferredView;
};

type GraphBuilder = {
  nodes: Map<string, SemanticNode>;
  edges: Map<string, SemanticEdge>;
};

const supportiveAspectTypes = new Set(["conjunction", "trine", "sextile"]);
const challengingAspectTypes = new Set(["square", "opposition", "quincunx"]);
const personalPointIds = new Set(["sun", "moon", "mercury", "venus", "mars"]);
const slowerPointIds = new Set(["uranus", "neptune", "pluto", "chiron", "north-node", "south-node"]);

const scoreWeights = {
  structuralImportance: 0.16,
  aspectPrecision: 0.08,
  angularity: 0.08,
  chartRulerRelevance: 0.1,
  luminaryOrPersonalRelevance: 0.12,
  configurationRole: 0.1,
  independentReinforcement: 0.14,
  lifeDomainRelevance: 0.06,
  contextualActivation: 0.06,
  counterevidenceStrength: -0.06,
  generationalWeakness: -0.1,
  derivationDistance: -0.06,
  semanticRedundancy: -0.08
} as const;

const pointDomains: Record<string, ReportDomain[]> = {
  sun: ["identity", "agency"],
  moon: ["emotions", "relationships"],
  mercury: ["identity", "work"],
  venus: ["relationships", "resources"],
  mars: ["agency", "work"],
  jupiter: ["growth", "work"],
  saturn: ["work", "growth"],
  uranus: ["growth", "identity"],
  neptune: ["growth", "emotions"],
  pluto: ["growth", "agency"],
  chiron: ["growth", "relationships"],
  "north-node": ["growth", "integration"],
  "south-node": ["growth", "integration"],
  ascendant: ["identity"],
  descendant: ["relationships"],
  midheaven: ["work"],
  "imum-coeli": ["emotions"]
};

const houseDomains: Record<number, ReportDomain[]> = {
  1: ["identity"],
  2: ["resources"],
  3: ["identity"],
  4: ["emotions"],
  5: ["identity"],
  6: ["work"],
  7: ["relationships"],
  8: ["relationships", "growth"],
  9: ["growth"],
  10: ["work"],
  11: ["relationships"],
  12: ["growth"]
};

function round(value: number, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function sortedUnique(values: string[]) {
  return unique(values).sort();
}

function intersect<T>(left: T[], right: T[]) {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
}

function sourcesFrom(values: Array<ProvenanceSource | undefined>) {
  return values.filter((value): value is ProvenanceSource => Boolean(value));
}

function combinedProvenance(
  facts: NormalizedChartFacts,
  ruleId: string,
  sources: ProvenanceSource[],
  options: {
    measurements?: Record<string, number | string | boolean>;
    derivationPath?: string[];
    confidenceTier?: ProvenanceConfidence;
    inclusionReasons: string[];
    confidenceReductionReasons?: string[];
  }
): FactProvenance {
  return {
    ruleId,
    sourceFactIds: sortedUnique(sources.flatMap((source) => source.provenance.sourceFactIds)),
    zodiacMode: facts.zodiacMode,
    houseSystem: facts.houseSystem,
    calculationMode: facts.calculationMode,
    measurements: options.measurements ?? {},
    derivationPath: options.derivationPath ?? sources.map((source) => source.provenance.ruleId),
    confidenceTier: options.confidenceTier ?? "exact",
    inclusionReasons: options.inclusionReasons,
    confidenceReductionReasons: options.confidenceReductionReasons ?? []
  };
}

function nodeTypeForPoint(point: NormalizedChartPoint): SemanticNodeType {
  if (point.kind === "luminary") return "Luminary";
  if (point.kind === "angle") return "Angle";
  if (point.kind === "lunar_node") return "LunarNode";
  if (point.kind === "chiron") return "Chiron";
  return "Planet";
}

function domainsForPoint(point: NormalizedChartPoint) {
  return pointDomains[point.id] ?? ["integration"];
}

function nodeIdForPoint(pointId: string) {
  return `point:${pointId}`;
}

function nodeIdForAspect(aspectId: string) {
  return `aspect:${aspectId}`;
}

function addNode(builder: GraphBuilder, node: SemanticNode) {
  builder.nodes.set(node.id, node);
}

function addEdge(builder: GraphBuilder, edge: SemanticEdge) {
  builder.edges.set(edge.id, edge);
}

function edge(
  facts: NormalizedChartFacts,
  type: SemanticEdgeType,
  sourceNodeId: string,
  targetNodeId: string,
  sources: ProvenanceSource[],
  ruleId: string,
  measurements: Record<string, number | string | boolean> = {}
): SemanticEdge {
  return {
    id: `edge:${type}:${sourceNodeId}:${targetNodeId}`,
    type,
    sourceNodeId,
    targetNodeId,
    provenance: combinedProvenance(facts, ruleId, sources, {
      measurements,
      derivationPath: [
        ...sources.map((source) => source.provenance.ruleId),
        `${sourceNodeId} -> ${type} -> ${targetNodeId}`
      ],
      inclusionReasons: [`Typed semantic edge ${type} is supported by the cited chart facts.`]
    })
  };
}

function signNodeSources(
  sign: string,
  facts: NormalizedChartFacts,
  structural: StructuralChartFacts
) {
  return sourcesFrom([
    ...facts.points.filter((point) => point.sign === sign),
    ...structural.houseRulers.filter((ruler) => ruler.cuspSign === sign)
  ]);
}

function createBaseGraph(
  facts: NormalizedChartFacts,
  structural: StructuralChartFacts
): GraphBuilder {
  const builder: GraphBuilder = { nodes: new Map(), edges: new Map() };
  const pointById = new Map(facts.points.map((point) => [point.id, point]));

  for (const point of facts.points) {
    addNode(builder, {
      id: nodeIdForPoint(point.id),
      type: nodeTypeForPoint(point),
      label: point.label,
      domains: domainsForPoint(point),
      attributes: {
        pointId: point.id,
        kind: point.kind,
        longitude: point.longitude,
        sign: point.sign,
        degree: point.degree,
        house: point.house ?? null,
        houseMode: point.houseMode ?? null,
        retrograde: point.retrograde
      },
      provenance: point.provenance
    });
  }

  const representedSigns = sortedUnique([
    ...facts.points.map((point) => point.sign),
    ...structural.houseRulers.map((ruler) => ruler.cuspSign)
  ]);
  for (const sign of representedSigns) {
    const sources = signNodeSources(sign, facts, structural);
    if (sources.length === 0) continue;
    addNode(builder, {
      id: `sign:${sign.toLowerCase()}`,
      type: "Sign",
      label: sign,
      domains: ["integration"],
      attributes: { sign },
      provenance: combinedProvenance(facts, "v2.phase3.node.sign", sources, {
        measurements: { placementCount: facts.points.filter((point) => point.sign === sign).length },
        inclusionReasons: ["The sign is represented by one or more normalized placements or house cusps."]
      })
    });
  }

  if (facts.calculationMode !== "signs-aspects-only") {
    for (let house = 1; house <= 12; house += 1) {
      const houseSources = sourcesFrom([
        ...facts.points.filter((point) => point.house === house),
        facts.houseCusps.find((cusp) => cusp.house === house),
        structural.houseRulers.find((ruler) => ruler.house === house)
      ]);
      if (houseSources.length === 0) continue;
      addNode(builder, {
        id: `house:${house}`,
        type: "House",
        label: `House ${house}`,
        domains: houseDomains[house] ?? ["integration"],
        attributes: { house },
        provenance: combinedProvenance(facts, "v2.phase3.node.house", houseSources, {
          measurements: { house },
          inclusionReasons: ["The house exists in the full-mode normalized and structural chart facts."]
        })
      });
    }
  }

  for (const cusp of facts.houseCusps) {
    const nodeId = `house-cusp:${cusp.house}`;
    addNode(builder, {
      id: nodeId,
      type: "HouseCusp",
      label: `House ${cusp.house} cusp`,
      domains: houseDomains[cusp.house] ?? ["integration"],
      attributes: { house: cusp.house, longitude: cusp.longitude },
      provenance: cusp.provenance
    });
  }

  for (const aspect of facts.aspects) {
    const sourcePoint = pointById.get(aspect.sourceId);
    const targetPoint = pointById.get(aspect.targetId);
    const nodeId = nodeIdForAspect(aspect.id);
    addNode(builder, {
      id: nodeId,
      type: "Aspect",
      label: `${aspect.sourceId} ${aspect.type} ${aspect.targetId}`,
      domains: unique([
        ...(sourcePoint ? domainsForPoint(sourcePoint) : []),
        ...(targetPoint ? domainsForPoint(targetPoint) : [])
      ]),
      attributes: {
        aspectId: aspect.id,
        aspectType: aspect.type,
        sourcePointId: aspect.sourceId,
        targetPointId: aspect.targetId,
        orb: aspect.orb,
        allowableOrb: aspect.allowableOrb,
        phase: aspect.phase,
        geometryEligible: aspect.geometryEligible,
        valence: supportiveAspectTypes.has(aspect.type)
          ? "supportive"
          : challengingAspectTypes.has(aspect.type)
            ? "challenging"
            : "neutral"
      },
      provenance: aspect.provenance
    });
    for (const pointId of [aspect.sourceId, aspect.targetId]) {
      const pointNode = builder.nodes.get(nodeIdForPoint(pointId));
      if (!pointNode) continue;
      addEdge(builder, edge(
        facts,
        "aspects",
        pointNode.id,
        nodeId,
        [aspect],
        "v2.phase3.edge.point-aspect",
        { orb: aspect.orb }
      ));
    }
  }

  for (const configuration of structural.configurations) {
    const nodeId = `configuration:${configuration.id}`;
    addNode(builder, {
      id: nodeId,
      type: "Configuration",
      label: configuration.type,
      domains: unique(configuration.participantIds.flatMap((participantId) =>
        pointById.get(participantId)
          ? domainsForPoint(pointById.get(participantId)!)
          : []
      )),
      attributes: {
        configurationId: configuration.id,
        configurationType: configuration.type,
        participantIds: configuration.participantIds,
        focalPointId: configuration.focalPointId ?? null,
        maxOrb: configuration.maxOrb
      },
      provenance: configuration.provenance
    });
    for (const participantId of configuration.participantIds) {
      const pointNodeId = nodeIdForPoint(participantId);
      if (!builder.nodes.has(pointNodeId)) continue;
      addEdge(builder, edge(
        facts,
        "participates_in_configuration",
        pointNodeId,
        nodeId,
        [configuration],
        "v2.phase3.edge.configuration-participant",
        { focal: configuration.focalPointId === participantId }
      ));
    }
  }

  for (const distribution of structural.distributions) {
    const nodeId = `distribution:${distribution.dimension}`;
    addNode(builder, {
      id: nodeId,
      type: "Distribution",
      label: `${distribution.dimension} distribution`,
      domains: ["identity", "integration"],
      attributes: {
        dimension: distribution.dimension,
        leaders: distribution.leaders,
        relativeAbsences: distribution.relativeAbsences
      },
      provenance: distribution.provenance
    });
    for (const point of facts.points.filter((candidate) =>
      candidate.kind === "luminary" || candidate.kind === "planet"
    )) {
      if (!distribution.provenance.sourceFactIds.some((sourceId) =>
        point.provenance.sourceFactIds.includes(sourceId)
      )) {
        continue;
      }
      addEdge(builder, edge(
        facts,
        "derived_from",
        nodeIdForPoint(point.id),
        nodeId,
        [point, distribution],
        "v2.phase3.edge.distribution-source"
      ));
    }
  }

  addRulershipNodesAndEdges(builder, facts, structural, pointById);
  addLocationEdges(builder, facts, pointById);
  addAngularAndCuspEdges(builder, facts, structural);
  addActivationAndLunarNodes(builder, facts, structural, pointById);
  return builder;
}

function addRulershipNode(
  builder: GraphBuilder,
  id: string,
  label: string,
  domains: ReportDomain[],
  attributes: Record<string, SemanticAttribute>,
  source: ProvenanceSource
) {
  addNode(builder, {
    id,
    type: "RulershipPath",
    label,
    domains,
    attributes,
    provenance: source.provenance
  });
}

function addRulershipNodesAndEdges(
  builder: GraphBuilder,
  facts: NormalizedChartFacts,
  structural: StructuralChartFacts,
  pointById: Map<string, NormalizedChartPoint>
) {
  if (structural.chartRuler) {
    const ruler = structural.chartRuler;
    const nodeId = "rulership:chart-ruler";
    const rulerPoint = pointById.get(ruler.rulerPointId);
    addRulershipNode(
      builder,
      nodeId,
      `Chart ruler ${ruler.rulerPointId}`,
      unique(["identity", "agency", ...(rulerPoint ? domainsForPoint(rulerPoint) : [])]),
      {
        pathType: "chart_ruler",
        rulerPointId: ruler.rulerPointId,
        ascendantSign: ruler.ascendantSign,
        rulerHouse: ruler.rulerHouse ?? null
      },
      ruler
    );
    const rulerNodeId = nodeIdForPoint(ruler.rulerPointId);
    if (builder.nodes.has(rulerNodeId)) {
      addEdge(builder, edge(
        facts,
        "derived_from",
        rulerNodeId,
        nodeId,
        [ruler],
        "v2.phase3.edge.chart-ruler"
      ));
    }
  }

  for (const houseRuler of structural.houseRulers) {
    const nodeId = `rulership:${houseRuler.id}`;
    addRulershipNode(
      builder,
      nodeId,
      `House ${houseRuler.house} ruler ${houseRuler.rulerPointId}`,
      houseDomains[houseRuler.house] ?? ["integration"],
      {
        pathType: "house_ruler",
        house: houseRuler.house,
        cuspSign: houseRuler.cuspSign,
        rulerPointId: houseRuler.rulerPointId,
        rulerHouse: houseRuler.rulerHouse ?? null
      },
      houseRuler
    );
    const rulerPointNodeId = nodeIdForPoint(houseRuler.rulerPointId);
    const houseNodeId = `house:${houseRuler.house}`;
    if (builder.nodes.has(rulerPointNodeId)) {
      addEdge(builder, edge(
        facts,
        "derived_from",
        rulerPointNodeId,
        nodeId,
        [houseRuler],
        "v2.phase3.edge.house-ruler-source"
      ));
    }
    if (builder.nodes.has(rulerPointNodeId) && builder.nodes.has(houseNodeId)) {
      addEdge(builder, edge(
        facts,
        "rules_house",
        rulerPointNodeId,
        houseNodeId,
        [houseRuler],
        "v2.phase3.edge.rules-house",
        { house: houseRuler.house }
      ));
    }
  }

  for (const dispositor of structural.dispositors) {
    const nodeId = `rulership:${dispositor.id}`;
    const sourcePoint = pointById.get(dispositor.sourcePointId);
    addRulershipNode(
      builder,
      nodeId,
      `${dispositor.sourcePointId} disposed by ${dispositor.rulerPointId}`,
      sourcePoint ? domainsForPoint(sourcePoint) : ["integration"],
      {
        pathType: "dispositor",
        sourcePointId: dispositor.sourcePointId,
        rulerPointId: dispositor.rulerPointId,
        selfDispositing: dispositor.selfDispositing
      },
      dispositor
    );
    const sourceNodeId = nodeIdForPoint(dispositor.sourcePointId);
    const rulerNodeId = nodeIdForPoint(dispositor.rulerPointId);
    if (builder.nodes.has(sourceNodeId) && builder.nodes.has(rulerNodeId)) {
      addEdge(builder, edge(
        facts,
        "disposes",
        sourceNodeId,
        rulerNodeId,
        [dispositor],
        "v2.phase3.edge.disposes"
      ));
      addEdge(builder, edge(
        facts,
        "derived_from",
        sourceNodeId,
        nodeId,
        [dispositor],
        "v2.phase3.edge.dispositor-source"
      ));
    }
  }

  const aggregateRulershipSources = [
    ...structural.dispositorChains,
    ...structural.dispositorLoops,
    ...structural.finalDispositors,
    ...structural.mutualReceptions
  ];
  for (const source of aggregateRulershipSources) {
    const nodeId = `rulership:${source.id}`;
    const participantIds: string[] = "participantIds" in source
      ? source.participantIds
      : "pointPath" in source
        ? source.pointPath
        : "sourcePointIds" in source
          ? unique([source.pointId, ...source.sourcePointIds])
          : [];
    addRulershipNode(
      builder,
      nodeId,
      source.id,
      unique(participantIds.flatMap((participantId) => {
        const point = pointById.get(participantId);
        return point ? domainsForPoint(point) : [];
      })),
      {
        pathType: source.provenance.ruleId.split(".").at(-1) ?? "rulership",
        participantIds
      },
      source
    );
    for (const participantId of participantIds) {
      const participantNodeId = nodeIdForPoint(participantId);
      if (!builder.nodes.has(participantNodeId)) continue;
      addEdge(builder, edge(
        facts,
        "derived_from",
        participantNodeId,
        nodeId,
        [source],
        "v2.phase3.edge.rulership-aggregate"
      ));
    }
  }

  for (const affinity of structural.modernAffinities) {
    const sourceNodeId = nodeIdForPoint(affinity.sourcePointId);
    const affinityNodeId = nodeIdForPoint(affinity.affinityPointId);
    if (!builder.nodes.has(sourceNodeId) || !builder.nodes.has(affinityNodeId)) continue;
    addEdge(builder, edge(
      facts,
      "modern_affinity",
      sourceNodeId,
      affinityNodeId,
      [affinity],
      "v2.phase3.edge.modern-affinity"
    ));
  }
}

function addLocationEdges(
  builder: GraphBuilder,
  facts: NormalizedChartFacts,
  pointById: Map<string, NormalizedChartPoint>
) {
  for (const point of facts.points) {
    const pointNodeId = nodeIdForPoint(point.id);
    const signNodeId = `sign:${point.sign.toLowerCase()}`;
    if (builder.nodes.has(signNodeId)) {
      addEdge(builder, edge(
        facts,
        "located_in_sign",
        pointNodeId,
        signNodeId,
        [point],
        "v2.phase3.edge.located-in-sign",
        { longitude: point.longitude }
      ));
    }
    if (point.house) {
      const houseNodeId = `house:${point.house}`;
      if (builder.nodes.has(houseNodeId)) {
        addEdge(builder, edge(
          facts,
          "located_in_house",
          pointNodeId,
          houseNodeId,
          [point],
          "v2.phase3.edge.located-in-house",
          { house: point.house }
        ));
      }
    }
  }

  for (const [sign, rulerPointId] of Object.entries(ASTRA_TRADITIONAL_SIGN_RULERS)) {
    const signNodeId = `sign:${sign.toLowerCase()}`;
    const rulerNodeId = nodeIdForPoint(rulerPointId);
    const rulerPoint = pointById.get(rulerPointId);
    const signNode = builder.nodes.get(signNodeId);
    if (!rulerPoint || !signNode) continue;
    addEdge(builder, edge(
      facts,
      "rules_sign",
      rulerNodeId,
      signNodeId,
      [rulerPoint, signNode],
      "v2.phase3.edge.rules-sign"
    ));
  }

  for (const cusp of facts.houseCusps) {
    const cuspNodeId = `house-cusp:${cusp.house}`;
    const houseNodeId = `house:${cusp.house}`;
    if (!builder.nodes.has(cuspNodeId) || !builder.nodes.has(houseNodeId)) continue;
    addEdge(builder, edge(
      facts,
      "derived_from",
      houseNodeId,
      cuspNodeId,
      [cusp],
      "v2.phase3.edge.house-cusp"
    ));
  }
}

function addAngularAndCuspEdges(
  builder: GraphBuilder,
  facts: NormalizedChartFacts,
  structural: StructuralChartFacts
) {
  for (const contact of structural.angularContacts) {
    const pointNodeId = nodeIdForPoint(contact.pointId);
    const angleNodeId = nodeIdForPoint(contact.angleId);
    if (!builder.nodes.has(pointNodeId) || !builder.nodes.has(angleNodeId)) continue;
    addEdge(builder, edge(
      facts,
      "conjunct_angle",
      pointNodeId,
      angleNodeId,
      [contact],
      "v2.phase3.edge.conjunct-angle",
      { orb: contact.orb }
    ));
  }
  for (const proximity of structural.cuspProximities) {
    const pointNodeId = nodeIdForPoint(proximity.pointId);
    const cuspNodeId = `house-cusp:${proximity.cuspHouse}`;
    if (!builder.nodes.has(pointNodeId) || !builder.nodes.has(cuspNodeId)) continue;
    addEdge(builder, edge(
      facts,
      "near_cusp",
      pointNodeId,
      cuspNodeId,
      [proximity],
      "v2.phase3.edge.near-cusp",
      { distance: proximity.distance }
    ));
  }
}

function addActivationAndLunarNodes(
  builder: GraphBuilder,
  facts: NormalizedChartFacts,
  structural: StructuralChartFacts,
  pointById: Map<string, NormalizedChartPoint>
) {
  for (const activation of structural.personalActivations) {
    const nodeId = `activation:${activation.targetPointId}`;
    const targetPoint = pointById.get(activation.targetPointId);
    addNode(builder, {
      id: nodeId,
      type: "PersonalActivation",
      label: `${activation.targetPointId} personal activation`,
      domains: targetPoint ? domainsForPoint(targetPoint) : ["growth"],
      attributes: {
        targetPointId: activation.targetPointId,
        targetKind: activation.targetKind,
        personalized: activation.personalized,
        activatorPointIds: activation.activatorPointIds,
        evidenceIds: activation.evidenceIds
      },
      provenance: activation.provenance
    });
    const targetNodeId = nodeIdForPoint(activation.targetPointId);
    if (builder.nodes.has(targetNodeId)) {
      addEdge(builder, edge(
        facts,
        activation.personalized ? "reinforces" : "qualifies",
        targetNodeId,
        nodeId,
        [activation],
        "v2.phase3.edge.personal-activation"
      ));
    }
    for (const activatorPointId of activation.activatorPointIds) {
      const activatorNodeId = nodeIdForPoint(activatorPointId);
      if (!builder.nodes.has(activatorNodeId)) continue;
      addEdge(builder, edge(
        facts,
        "reinforces",
        activatorNodeId,
        nodeId,
        [activation],
        "v2.phase3.edge.activation-source"
      ));
    }
  }

  const phase = structural.lunarPhase;
  const phaseNodeId = "lunar-phase";
  addNode(builder, {
    id: phaseNodeId,
    type: "LunarPhase",
    label: phase.phase,
    domains: ["identity", "emotions", "integration"],
    attributes: {
      phase: phase.phase,
      elongation: phase.elongation,
      cycle: phase.cycle,
      sunMoonAspectId: phase.sunMoonAspectId ?? null
    },
    provenance: phase.provenance
  });
  for (const pointId of ["sun", "moon"]) {
    const pointNodeId = nodeIdForPoint(pointId);
    if (!builder.nodes.has(pointNodeId)) continue;
    addEdge(builder, edge(
      facts,
      "derived_from",
      pointNodeId,
      phaseNodeId,
      [phase],
      "v2.phase3.edge.lunar-phase"
    ));
  }
}

function seedCandidates(
  facts: NormalizedChartFacts,
  structural: StructuralChartFacts,
  builder: GraphBuilder
) {
  const seeds = new Map<string, SeedCandidate>();
  const suppressed = new Map<string, string>();
  const pointById = new Map(facts.points.map((point) => [point.id, point]));
  const activationByTarget = new Map(
    structural.personalActivations.map((activation) => [activation.targetPointId, activation])
  );

  function register(seed: SeedCandidate) {
    const existing = seeds.get(seed.nodeId);
    if (!existing || existing.structuralImportance < seed.structuralImportance) {
      seeds.set(seed.nodeId, seed);
    }
  }

  for (const point of facts.points) {
    const nodeId = nodeIdForPoint(point.id);
    if (!builder.nodes.has(nodeId)) continue;
    if (point.kind === "luminary") {
      register({
        nodeId,
        mechanism: point.id === "sun" ? "solar_orientation" : "lunar_processing",
        domains: domainsForPoint(point),
        structuralImportance: 0.95,
        preferredView: "all"
      });
      continue;
    }
    if (["mercury", "venus", "mars"].includes(point.id)) {
      register({
        nodeId,
        mechanism: `${point.id}_personal_function`,
        domains: domainsForPoint(point),
        structuralImportance: 0.75,
        preferredView: "core"
      });
      continue;
    }
    if (point.kind === "angle") {
      register({
        nodeId,
        mechanism: `${point.id}_angle`,
        domains: domainsForPoint(point),
        structuralImportance: 0.8,
        preferredView: point.id === "ascendant" ? "identity" : "deep"
      });
      continue;
    }
    if (slowerPointIds.has(point.id)) {
      const activation = activationByTarget.get(point.id);
      if (activation?.personalized) {
        register({
          nodeId,
          mechanism: `${point.id}_personalized_slow_factor`,
          domains: domainsForPoint(point),
          structuralImportance: 0.7,
          preferredView: "deep"
        });
      } else {
        suppressed.set(
          nodeId,
          "Unpersonalized outer-planet, Chiron, or lunar-node evidence cannot seed a strong personal meaning complex."
        );
      }
    }
  }

  if (structural.chartRuler) {
    const rulerPoint = pointById.get(structural.chartRuler.rulerPointId);
    if (rulerPoint) {
      register({
        nodeId: nodeIdForPoint(rulerPoint.id),
        mechanism: "chart_ruler",
        domains: unique(["identity", "agency", ...domainsForPoint(rulerPoint)]),
        structuralImportance: 1,
        preferredView: "identity"
      });
    }
  }

  for (const contact of structural.angularContacts) {
    const point = pointById.get(contact.pointId);
    if (!point || point.kind === "angle") continue;
    register({
      nodeId: nodeIdForPoint(point.id),
      mechanism: `${point.id}_angular_emphasis`,
      domains: domainsForPoint(point),
      structuralImportance: 0.9,
      preferredView: personalPointIds.has(point.id) ? "core" : "deep"
    });
  }

  for (const configuration of structural.configurations) {
    const nodeId = `configuration:${configuration.id}`;
    const node = builder.nodes.get(nodeId);
    if (!node) continue;
    register({
      nodeId,
      mechanism: `configuration_${configuration.type}`,
      domains: node.domains,
      structuralImportance: configuration.focalPointId ? 0.95 : 0.85,
      preferredView: "deep"
    });
    if (configuration.focalPointId) {
      const focal = pointById.get(configuration.focalPointId);
      if (focal) {
        register({
          nodeId: nodeIdForPoint(focal.id),
          mechanism: `${focal.id}_configuration_focus`,
          domains: domainsForPoint(focal),
          structuralImportance: 0.95,
          preferredView: personalPointIds.has(focal.id) ? "core" : "deep"
        });
      }
    }
  }

  for (const distribution of structural.distributions) {
    const nodeId = `distribution:${distribution.dimension}`;
    if (!builder.nodes.has(nodeId)) continue;
    register({
      nodeId,
      mechanism: `chart_wide_${distribution.dimension}`,
      domains: ["identity", "integration"],
      structuralImportance: 0.65,
      preferredView: "deep"
    });
  }

  if (builder.nodes.has("lunar-phase")) {
    register({
      nodeId: "lunar-phase",
      mechanism: "solar_lunar_cycle",
      domains: ["identity", "emotions", "integration"],
      structuralImportance: 0.8,
      preferredView: "core"
    });
  }

  return {
    seeds: [...seeds.values()].sort((left, right) => left.nodeId.localeCompare(right.nodeId)),
    suppressed
  };
}

function adjacencyFor(builder: GraphBuilder) {
  const adjacency = new Map<string, SemanticEdge[]>();
  for (const edgeValue of builder.edges.values()) {
    adjacency.set(edgeValue.sourceNodeId, [
      ...(adjacency.get(edgeValue.sourceNodeId) ?? []),
      edgeValue
    ]);
    adjacency.set(edgeValue.targetNodeId, [
      ...(adjacency.get(edgeValue.targetNodeId) ?? []),
      edgeValue
    ]);
  }
  for (const edges of adjacency.values()) {
    edges.sort((left, right) => left.id.localeCompare(right.id));
  }
  return adjacency;
}

function oppositeNodeId(edgeValue: SemanticEdge, nodeId: string) {
  return edgeValue.sourceNodeId === nodeId
    ? edgeValue.targetNodeId
    : edgeValue.sourceNodeId;
}

function pathRole(
  nodes: SemanticNode[],
  terminal: SemanticNode
): EvidencePathRole {
  const aspectNode = [...nodes].reverse().find((node) => node.type === "Aspect");
  const aspectValence = aspectNode?.attributes.valence;
  if (aspectValence === "challenging") return "counterevidence";
  if (
    terminal.type === "Sign" ||
    terminal.type === "House" ||
    terminal.type === "HouseCusp" ||
    (
      terminal.type === "PersonalActivation" &&
      terminal.attributes.personalized === false
    )
  ) {
    return "qualifier";
  }
  return "support";
}

function isEvidenceTerminal(node: SemanticNode) {
  return [
    "Aspect",
    "Configuration",
    "Distribution",
    "RulershipPath",
    "PersonalActivation",
    "LunarPhase",
    "HouseCusp",
    "Angle",
    "Sign",
    "House"
  ].includes(node.type);
}

function mayExpandFrom(node: SemanticNode) {
  return [
    "Planet",
    "Luminary",
    "Angle",
    "LunarNode",
    "Chiron",
    "Aspect",
    "RulershipPath",
    "PersonalActivation"
  ].includes(node.type);
}

function mechanismForPath(nodes: SemanticNode[], terminal: SemanticNode) {
  const aspect = [...nodes].reverse().find((node) => node.type === "Aspect");
  if (aspect) return `aspect_${String(aspect.attributes.aspectType)}`;
  if (terminal.type === "Configuration") {
    return `configuration_${String(terminal.attributes.configurationType)}`;
  }
  if (terminal.type === "Distribution") {
    return `distribution_${String(terminal.attributes.dimension)}`;
  }
  if (terminal.type === "RulershipPath") {
    return `rulership_${String(terminal.attributes.pathType)}`;
  }
  if (terminal.type === "PersonalActivation") return "personal_activation";
  if (terminal.type === "LunarPhase") return "lunar_phase";
  if (terminal.type === "Angle") return "angular_contact";
  if (terminal.type === "HouseCusp") return "cusp_proximity";
  if (terminal.type === "Sign") return "sign_placement";
  if (terminal.type === "House") return "house_placement";
  return terminal.type.toLowerCase();
}

function pathScoreFor(nodes: SemanticNode[], terminal: SemanticNode, distance: number) {
  let base = 0.4;
  if (terminal.type === "Configuration") base = 0.95;
  else if (terminal.type === "RulershipPath") base = 0.85;
  else if (terminal.type === "PersonalActivation") {
    base = terminal.attributes.personalized === true ? 0.85 : 0.25;
  } else if (terminal.type === "LunarPhase") base = 0.8;
  else if (terminal.type === "Distribution") base = 0.65;
  else if (terminal.type === "Angle") base = 0.8;
  else if (terminal.type === "Aspect") {
    const orb = Number(terminal.attributes.orb ?? 0);
    const allowable = Number(terminal.attributes.allowableOrb ?? 1);
    base = 0.55 + 0.4 * clamp(1 - orb / Math.max(allowable, 0.0001));
  } else if (terminal.type === "HouseCusp") base = 0.45;
  else if (terminal.type === "Sign" || terminal.type === "House") base = 0.3;
  const hasConfiguration = nodes.some((node) => node.type === "Configuration");
  if (hasConfiguration) base = Math.max(base, 0.85);
  return round(clamp(base - Math.max(0, distance - 1) * 0.12));
}

function pathProvenance(
  facts: NormalizedChartFacts,
  seed: SemanticNode,
  pathNodes: SemanticNode[],
  pathEdges: SemanticEdge[],
  role: EvidencePathRole
) {
  return combinedProvenance(
    facts,
    "v2.phase3.evidence-path",
    [seed, ...pathNodes, ...pathEdges],
    {
      measurements: {
        edgeCount: pathEdges.length,
        nodeCount: pathNodes.length + 1,
        role
      },
      derivationPath: [
        seed.id,
        ...pathEdges.flatMap((edgeValue, index) => [
          edgeValue.id,
          pathNodes[index]?.id ?? ""
        ]).filter(Boolean)
      ],
      confidenceTier: pathEdges.length <= 2 ? "exact" : "high",
      inclusionReasons: ["The evidence path follows only typed astrological edges within the maximum derivation distance."],
      confidenceReductionReasons: pathEdges.length >= 3
        ? ["This is a maximum-depth path and receives a derivation-distance penalty."]
        : []
    }
  );
}

function evidencePathsForSeed(
  facts: NormalizedChartFacts,
  builder: GraphBuilder,
  seed: SeedCandidate
) {
  const seedNode = builder.nodes.get(seed.nodeId);
  if (!seedNode) return [];
  const adjacency = adjacencyFor(builder);
  const paths: EvidencePath[] = [];
  const seedSources = new Set(seedNode.provenance.sourceFactIds);

  const baseOrigin = `anchor:${seed.nodeId}`;
  paths.push({
    id: `evidence:${seed.nodeId}:base`,
    seedNodeId: seed.nodeId,
    terminalNodeId: seed.nodeId,
    nodeIds: [seed.nodeId],
    edgeIds: [],
    role: "support",
    mechanism: seed.mechanism,
    domains: seed.domains,
    sourceFactIds: seedNode.provenance.sourceFactIds,
    independentOriginIds: [baseOrigin],
    originKey: baseOrigin,
    derivationDistance: 0,
    pathScore: seed.structuralImportance,
    aliasPathIds: [],
    provenance: combinedProvenance(facts, "v2.phase3.evidence-path.seed", [seedNode], {
      measurements: { structuralImportance: seed.structuralImportance },
      derivationPath: [seed.nodeId],
      inclusionReasons: ["The structurally important seed is the base evidence for its candidate complex."]
    })
  });

  type QueueItem = {
    currentNodeId: string;
    nodeIds: string[];
    edgeIds: string[];
  };
  const queue: QueueItem[] = [{
    currentNodeId: seed.nodeId,
    nodeIds: [seed.nodeId],
    edgeIds: []
  }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.edgeIds.length >= ASTRA_MEANING_COMPLEX_MAX_PATH_DEPTH) continue;
    for (const edgeValue of adjacency.get(current.currentNodeId) ?? []) {
      const nextNodeId = oppositeNodeId(edgeValue, current.currentNodeId);
      if (current.nodeIds.includes(nextNodeId)) continue;
      const nextNode = builder.nodes.get(nextNodeId);
      if (!nextNode) continue;
      const nextNodeIds = [...current.nodeIds, nextNodeId];
      const nextEdgeIds = [...current.edgeIds, edgeValue.id];
      const pathNodes = nextNodeIds.slice(1).flatMap((nodeId) => {
        const node = builder.nodes.get(nodeId);
        return node ? [node] : [];
      });
      const pathEdges = nextEdgeIds.flatMap((edgeId) => {
        const matched = builder.edges.get(edgeId);
        return matched ? [matched] : [];
      });

      if (isEvidenceTerminal(nextNode)) {
        const role = pathRole(pathNodes, nextNode);
        const provenance = pathProvenance(facts, seedNode, pathNodes, pathEdges, role);
        const independentOriginIds = provenance.sourceFactIds.filter((sourceId) => !seedSources.has(sourceId));
        const normalizedOrigins = independentOriginIds.length > 0
          ? independentOriginIds
          : [`derived:${nextNode.id}`];
        const originKey = sortedUnique(normalizedOrigins).join("|");
        paths.push({
          id: `evidence:${seed.nodeId}:${nextNode.id}:${nextEdgeIds.join("+")}`,
          seedNodeId: seed.nodeId,
          terminalNodeId: nextNode.id,
          nodeIds: nextNodeIds,
          edgeIds: nextEdgeIds,
          role,
          mechanism: mechanismForPath(pathNodes, nextNode),
          domains: unique([...seed.domains, ...nextNode.domains]),
          sourceFactIds: provenance.sourceFactIds,
          independentOriginIds: sortedUnique(normalizedOrigins),
          originKey,
          derivationDistance: nextEdgeIds.length,
          pathScore: pathScoreFor(pathNodes, nextNode, nextEdgeIds.length),
          aliasPathIds: [],
          provenance
        });
      }

      if (
        nextEdgeIds.length < ASTRA_MEANING_COMPLEX_MAX_PATH_DEPTH &&
        mayExpandFrom(nextNode)
      ) {
        queue.push({
          currentNodeId: nextNodeId,
          nodeIds: nextNodeIds,
          edgeIds: nextEdgeIds
        });
      }
    }
  }

  return paths.sort((left, right) =>
    right.pathScore - left.pathScore || left.id.localeCompare(right.id)
  );
}

function collapseAliasPaths(paths: EvidencePath[]) {
  const byOrigin = new Map<string, EvidencePath>();
  let collapsedCount = 0;
  for (const path of paths) {
    const key = `${path.role}:${path.originKey}`;
    const existing = byOrigin.get(key);
    if (!existing) {
      byOrigin.set(key, path);
      continue;
    }
    collapsedCount += 1;
    const preferred = path.pathScore > existing.pathScore ||
      (path.pathScore === existing.pathScore && path.derivationDistance < existing.derivationDistance)
      ? path
      : existing;
    const alias = preferred === path ? existing : path;
    byOrigin.set(key, {
      ...preferred,
      aliasPathIds: sortedUnique([
        ...preferred.aliasPathIds,
        alias.id,
        ...alias.aliasPathIds
      ])
    });
  }
  return {
    paths: [...byOrigin.values()].sort((left, right) =>
      right.pathScore - left.pathScore || left.id.localeCompare(right.id)
    ),
    collapsedCount
  };
}

function independentPaths(paths: EvidencePath[]) {
  const selected: EvidencePath[] = [];
  const usedOrigins = new Set<string>();
  for (const path of [...paths].sort((left, right) =>
    right.pathScore - left.pathScore ||
    left.derivationDistance - right.derivationDistance ||
    left.id.localeCompare(right.id)
  )) {
    if (path.independentOriginIds.some((origin) => usedOrigins.has(origin))) continue;
    selected.push(path);
    for (const origin of path.independentOriginIds) usedOrigins.add(origin);
  }
  return selected;
}

function aspectPrecision(paths: EvidencePath[], builder: GraphBuilder) {
  const aspectNodes = unique(paths.flatMap((path) =>
    path.nodeIds.flatMap((nodeId) => {
      const node = builder.nodes.get(nodeId);
      return node?.type === "Aspect" ? [node] : [];
    })
  ));
  if (aspectNodes.length === 0) return 0;
  return round(aspectNodes.reduce((sum, node) => {
    const orb = Number(node.attributes.orb ?? 0);
    const allowable = Number(node.attributes.allowableOrb ?? 1);
    return sum + clamp(1 - orb / Math.max(allowable, 0.0001));
  }, 0) / aspectNodes.length);
}

function angularityForSeed(
  seedNode: SemanticNode,
  supportPaths: EvidencePath[],
  builder: GraphBuilder
) {
  if (seedNode.type === "Angle") return 1;
  if (supportPaths.some((path) => path.mechanism === "angular_contact")) return 1;
  const houseMode = seedNode.attributes.houseMode;
  if (houseMode === "angular") return 0.8;
  if (houseMode === "succedent") return 0.45;
  if (houseMode === "cadent") return 0.2;
  const containsAngle = supportPaths.some((path) =>
    path.nodeIds.some((nodeId) => builder.nodes.get(nodeId)?.type === "Angle")
  );
  return containsAngle ? 0.8 : 0;
}

function chartRulerRelevance(
  seedNode: SemanticNode,
  supportPaths: EvidencePath[],
  structural: StructuralChartFacts
) {
  const chartRulerNodeId = structural.chartRuler
    ? nodeIdForPoint(structural.chartRuler.rulerPointId)
    : undefined;
  if (!chartRulerNodeId) return 0;
  if (seedNode.id === chartRulerNodeId) return 1;
  return supportPaths.some((path) => path.nodeIds.includes(chartRulerNodeId)) ? 0.65 : 0;
}

function personalRelevance(
  seedNode: SemanticNode,
  structural: StructuralChartFacts
) {
  const pointId = String(seedNode.attributes.pointId ?? "");
  if (seedNode.type === "Luminary") return 1;
  if (personalPointIds.has(pointId)) return 0.9;
  const activation = structural.personalActivations.find((candidate) =>
    candidate.targetPointId === pointId
  );
  if (activation?.personalized) return 0.8;
  if (seedNode.type === "Angle") return 0.85;
  return 0.35;
}

function configurationRole(
  seedNode: SemanticNode,
  supportPaths: EvidencePath[],
  structural: StructuralChartFacts
) {
  if (seedNode.type === "Configuration") return 1;
  const pointId = String(seedNode.attributes.pointId ?? "");
  if (!pointId) return 0;
  if (structural.configurations.some((configuration) => configuration.focalPointId === pointId)) {
    return 1;
  }
  if (structural.configurations.some((configuration) => configuration.participantIds.includes(pointId))) {
    return 0.7;
  }
  return supportPaths.some((path) => path.mechanism.startsWith("configuration_")) ? 0.5 : 0;
}

function contextualActivation(
  seedNode: SemanticNode,
  structural: StructuralChartFacts
) {
  const pointId = String(seedNode.attributes.pointId ?? "");
  if (personalPointIds.has(pointId) || seedNode.type === "Luminary") return 0.8;
  const activation = structural.personalActivations.find((candidate) =>
    candidate.targetPointId === pointId
  );
  if (activation?.personalized) return 1;
  if (slowerPointIds.has(pointId)) return 0;
  return 0.4;
}

function generationalWeakness(
  seedNode: SemanticNode,
  structural: StructuralChartFacts
) {
  const pointId = String(seedNode.attributes.pointId ?? "");
  if (!slowerPointIds.has(pointId)) return 0;
  const activation = structural.personalActivations.find((candidate) =>
    candidate.targetPointId === pointId
  );
  return activation?.personalized ? 0.1 : 1;
}

function scoreComplex(
  seed: SeedCandidate,
  seedNode: SemanticNode,
  supportPaths: EvidencePath[],
  counterevidence: EvidencePath[],
  rawPathCount: number,
  collapsedPathCount: number,
  independentSupport: EvidencePath[],
  independentCounter: EvidencePath[],
  builder: GraphBuilder,
  structural: StructuralChartFacts
): MeaningComplexScoreComponents {
  const structuralImportance = round(seed.structuralImportance);
  const precision = aspectPrecision([...supportPaths, ...counterevidence], builder);
  const angularity = round(angularityForSeed(seedNode, supportPaths, builder));
  const rulerRelevance = round(chartRulerRelevance(seedNode, supportPaths, structural));
  const personal = round(personalRelevance(seedNode, structural));
  const configRole = round(configurationRole(seedNode, supportPaths, structural));
  const reinforcement = round(clamp(independentSupport.length / 3));
  const lifeDomain = round(
    supportPaths.length === 0
      ? 0
      : supportPaths.filter((path) => intersect(path.domains, seed.domains).length > 0).length /
        supportPaths.length
  );
  const activation = round(contextualActivation(seedNode, structural));
  const counterStrength = round(clamp(independentCounter.length / 2));
  const generational = round(generationalWeakness(seedNode, structural));
  const distance = round(
    supportPaths.length === 0
      ? 0
      : supportPaths.reduce((sum, path) => sum + path.derivationDistance, 0) /
        supportPaths.length /
        ASTRA_MEANING_COMPLEX_MAX_PATH_DEPTH
  );
  const redundancy = round(
    rawPathCount === 0 ? 0 : clamp((rawPathCount - collapsedPathCount) / rawPathCount)
  );
  const values = {
    structuralImportance,
    aspectPrecision: precision,
    angularity,
    chartRulerRelevance: rulerRelevance,
    luminaryOrPersonalRelevance: personal,
    configurationRole: configRole,
    independentReinforcement: reinforcement,
    lifeDomainRelevance: lifeDomain,
    contextualActivation: activation,
    counterevidenceStrength: counterStrength,
    generationalWeakness: generational,
    derivationDistance: distance,
    semanticRedundancy: redundancy
  };
  const total = round(clamp(
    Object.entries(scoreWeights).reduce((sum, [key, weight]) =>
      sum + values[key as keyof typeof values] * weight
    , 0)
  ));
  return { ...values, total };
}

function technicalHypothesis(seed: SeedCandidate, seedNode: SemanticNode) {
  if (seedNode.type === "Configuration") {
    return `${String(seedNode.attributes.configurationType)} organizes a connected structural mechanism across ${seed.domains.join(" and ")}.`;
  }
  if (seedNode.type === "Distribution") {
    return `${String(seedNode.attributes.dimension)} distribution supplies chart-wide emphasis across ${seed.domains.join(" and ")}.`;
  }
  if (seedNode.type === "LunarPhase") {
    return `${String(seedNode.attributes.phase)} lunar phase links solar orientation and lunar processing.`;
  }
  return `${seedNode.label} is a structurally connected mechanism across ${seed.domains.join(" and ")}.`;
}

function claimBoundaryFor(
  facts: NormalizedChartFacts,
  seedNode: SemanticNode,
  structural: StructuralChartFacts
) {
  const pointId = String(seedNode.attributes.pointId ?? "");
  const activation = structural.personalActivations.find((candidate) =>
    candidate.targetPointId === pointId
  );
  const pieces: string[] = [];
  if (slowerPointIds.has(pointId) && !activation?.personalized) {
    pieces.push(
      "This factor may supply generational or developmental context only; it cannot establish categorical personality, biography, events, motives, or another person's inner state."
    );
  } else if (seedNode.type === "LunarNode") {
    pieces.push(
      "The node may describe developmental direction or familiar tendencies; it cannot establish fate, past lives, categorical biography, events, motives, or another person's inner state."
    );
  } else {
    pieces.push(
      "This complex describes a supported natal tendency, not categorical behavior, biography, events, motives, or another person's inner state."
    );
  }
  if (facts.calculationMode === "signs-aspects-only") {
    pieces.push("It makes no claims about houses, angles, cusps, or life-area emphasis.");
  }
  return pieces.join(" ");
}

function confidenceFor(
  score: MeaningComplexScoreComponents,
  independentSupportCount: number,
  independentCounterCount: number,
  seedNode: SemanticNode,
  structural: StructuralChartFacts
) {
  const confidenceReasons: string[] = [];
  const confidenceReductionReasons: string[] = [];
  const pointId = String(seedNode.attributes.pointId ?? "");
  const unpersonalizedSlowFactor = slowerPointIds.has(pointId) &&
    !structural.personalActivations.find((activation) =>
      activation.targetPointId === pointId
    )?.personalized;

  let confidence: MeaningComplexConfidence = "exploratory";
  if (
    independentSupportCount >= 3 &&
    score.total >= 0.58 &&
    score.generationalWeakness < 0.5 &&
    independentCounterCount < independentSupportCount
  ) {
    confidence = "strong";
    confidenceReasons.push("At least three independent support paths and the strong-score threshold are present.");
  } else if (
    independentSupportCount >= 2 &&
    score.total >= 0.38 &&
    !unpersonalizedSlowFactor
  ) {
    confidence = "supported";
    confidenceReasons.push("At least two independent support paths and the supported-score threshold are present.");
  } else {
    confidenceReasons.push("The complex remains exploratory because independent support or score is limited.");
  }

  if (unpersonalizedSlowFactor) {
    confidence = "exploratory";
    confidenceReductionReasons.push("Unpersonalized slower-factor evidence cannot anchor a supported or strong personal complex.");
  }
  if (independentCounterCount > 0) {
    confidenceReductionReasons.push("Independent counterevidence remains active and qualifies the hypothesis.");
    if (confidence === "strong" && independentCounterCount >= independentSupportCount / 2) {
      confidence = "supported";
      confidenceReductionReasons.push("Counterevidence density reduces strong confidence to supported.");
    }
  }
  if (score.semanticRedundancy >= 0.5) {
    confidenceReductionReasons.push("High alias density reduces the value of repeated labels.");
  }
  if (score.derivationDistance >= 0.75) {
    confidenceReductionReasons.push("Most evidence is remote from the seed and receives a derivation-distance penalty.");
  }

  return { confidence, confidenceReasons, confidenceReductionReasons };
}

function qualifierStrings(
  facts: NormalizedChartFacts,
  seedNode: SemanticNode,
  qualifierPaths: EvidencePath[],
  counterevidence: EvidencePath[]
) {
  const qualifiers = qualifierPaths.map((path) => {
    if (path.mechanism === "house_placement") return "House placement qualifies where the mechanism is most directly expressed.";
    if (path.mechanism === "sign_placement") return "Sign placement qualifies the mechanism's style without proving behavior.";
    if (path.mechanism === "cusp_proximity") return "Cusp proximity qualifies but does not replace the calculated house placement.";
    if (path.mechanism === "personal_activation") return "Unpersonalized slower-factor evidence remains contextual rather than personally determinative.";
    return `Qualified by ${path.mechanism.replaceAll("_", " ")}.`;
  });
  if (seedNode.attributes.retrograde === true) {
    qualifiers.push("Retrograde qualifies the planet's existing role; it does not prove weakness, delay, trauma, failure, or inwardness.");
  }
  if (counterevidence.length > 0) {
    qualifiers.push("Distinct counterevidence remains visible rather than being resolved into a single clean thesis.");
  }
  if (facts.calculationMode === "signs-aspects-only") {
    qualifiers.push("Reduced calculation mode omits all house, angle, cusp, and life-area conclusions.");
  }
  return sortedUnique(qualifiers);
}

function meaningComplexForSeed(
  facts: NormalizedChartFacts,
  structural: StructuralChartFacts,
  builder: GraphBuilder,
  seed: SeedCandidate
) {
  const seedNode = builder.nodes.get(seed.nodeId);
  if (!seedNode) return { complex: null, reason: "Seed node is unavailable.", collapsedCount: 0 };
  const rawPaths = evidencePathsForSeed(facts, builder, seed);
  const collapsed = collapseAliasPaths(rawPaths);
  const supportPaths = collapsed.paths.filter((path) => path.role === "support");
  const counterevidence = collapsed.paths.filter((path) => path.role === "counterevidence");
  const qualifierPaths = collapsed.paths.filter((path) => path.role === "qualifier");
  const independentSupport = independentPaths(supportPaths);
  const independentCounter = independentPaths(counterevidence);
  const uniqueSupportOrigins = sortedUnique(supportPaths.flatMap((path) => path.independentOriginIds));
  if (supportPaths.length < 2 || uniqueSupportOrigins.length < 2) {
    return {
      complex: null,
      reason: "A meaning complex requires more than one supported origin.",
      collapsedCount: collapsed.collapsedCount
    };
  }

  const score = scoreComplex(
    seed,
    seedNode,
    supportPaths,
    counterevidence,
    rawPaths.length,
    collapsed.paths.length,
    independentSupport,
    independentCounter,
    builder,
    structural
  );
  const confidenceDecision = confidenceFor(
    score,
    independentSupport.length,
    independentCounter.length,
    seedNode,
    structural
  );
  const complexId = `meaning-complex:${seed.nodeId.replaceAll(":", "-")}`;
  const allEvidence = [...supportPaths, ...counterevidence, ...qualifierPaths];
  const provenance = combinedProvenance(
    facts,
    "v2.phase3.meaning-complex",
    allEvidence,
    {
      measurements: {
        supportPathCount: supportPaths.length,
        independentSupportCount: independentSupport.length,
        counterevidenceCount: counterevidence.length,
        independentCounterevidenceCount: independentCounter.length,
        collapsedAliasCount: collapsed.collapsedCount,
        totalScore: score.total
      },
      derivationPath: allEvidence.map((path) => path.id),
      confidenceTier: confidenceDecision.confidence === "strong"
        ? "exact"
        : confidenceDecision.confidence === "supported"
          ? "high"
          : "bounded",
      inclusionReasons: ["The candidate has multiple supported origins connected through typed astrological paths."],
      confidenceReductionReasons: confidenceDecision.confidenceReductionReasons
    }
  );
  const complex: MeaningComplex = {
    id: complexId,
    seedNodeIds: [seed.nodeId],
    mechanism: seed.mechanism,
    hypothesis: technicalHypothesis(seed, seedNode),
    domains: seed.domains,
    supportPaths,
    counterevidence,
    qualifiers: qualifierStrings(facts, seedNode, qualifierPaths, counterevidence),
    independentSupportPathIds: independentSupport.map((path) => path.id),
    independentSupportCount: independentSupport.length,
    independentCounterevidenceCount: independentCounter.length,
    collapsedAliasCount: collapsed.collapsedCount,
    score,
    confidence: confidenceDecision.confidence,
    confidenceReasons: confidenceDecision.confidenceReasons,
    confidenceReductionReasons: confidenceDecision.confidenceReductionReasons,
    claimBoundary: claimBoundaryFor(facts, seedNode, structural),
    preferredView: seed.preferredView,
    provenance
  };
  return { complex, reason: null, collapsedCount: collapsed.collapsedCount };
}

function addComplexNodesAndEdges(
  facts: NormalizedChartFacts,
  builder: GraphBuilder,
  complexes: MeaningComplex[]
) {
  const domainSources = new Map<ReportDomain, ProvenanceSource[]>();
  for (const complex of complexes) {
    for (const domain of complex.domains) {
      domainSources.set(domain, [...(domainSources.get(domain) ?? []), complex]);
    }
  }
  for (const [domain, sources] of domainSources) {
    addNode(builder, {
      id: `domain:${domain}`,
      type: "LifeDomain",
      label: domain,
      domains: [domain],
      attributes: { domain },
      provenance: combinedProvenance(facts, "v2.phase3.node.life-domain", sources, {
        measurements: { complexCount: sources.length },
        inclusionReasons: ["The life domain is routed from one or more supported meaning complexes."]
      })
    });
  }

  for (const complex of complexes) {
    const hypothesisNodeId = `hypothesis:${complex.id}`;
    addNode(builder, {
      id: hypothesisNodeId,
      type: "InterpretiveHypothesis",
      label: complex.hypothesis,
      domains: complex.domains,
      attributes: {
        meaningComplexId: complex.id,
        confidence: complex.confidence,
        totalScore: complex.score.total,
        preferredView: complex.preferredView
      },
      provenance: complex.provenance
    });
    for (const domain of complex.domains) {
      const domainNodeId = `domain:${domain}`;
      if (!builder.nodes.has(domainNodeId)) continue;
      addEdge(builder, edge(
        facts,
        "routes_domain_to",
        hypothesisNodeId,
        domainNodeId,
        [complex],
        "v2.phase3.edge.routes-domain"
      ));
    }
    for (const path of complex.supportPaths) {
      if (!builder.nodes.has(path.terminalNodeId)) continue;
      addEdge(builder, edge(
        facts,
        "reinforces",
        path.terminalNodeId,
        hypothesisNodeId,
        [path, complex],
        "v2.phase3.edge.reinforces"
      ));
    }
    for (const path of complex.counterevidence) {
      if (!builder.nodes.has(path.terminalNodeId)) continue;
      addEdge(builder, edge(
        facts,
        "contradicts",
        path.terminalNodeId,
        hypothesisNodeId,
        [path, complex],
        "v2.phase3.edge.contradicts"
      ));
    }
    if (complex.qualifiers.length > 0) {
      const seedNodeId = complex.seedNodeIds[0];
      if (seedNodeId && builder.nodes.has(seedNodeId)) {
        addEdge(builder, edge(
          facts,
          "qualifies",
          seedNodeId,
          hypothesisNodeId,
          [complex],
          "v2.phase3.edge.qualifies"
        ));
      }
    }
    for (const path of complex.supportPaths.filter((candidate) =>
      candidate.derivationDistance > 0
    )) {
      if (!builder.nodes.has(path.terminalNodeId)) continue;
      addEdge(builder, edge(
        facts,
        "derived_from",
        hypothesisNodeId,
        path.terminalNodeId,
        [path, complex],
        "v2.phase3.edge.hypothesis-derived-from"
      ));
    }
  }
}

export function buildMeaningComplexNetwork(
  facts: NormalizedChartFacts,
  structural: StructuralChartFacts
): MeaningComplexNetwork {
  if (facts.calculationMode !== structural.calculationMode) {
    throw new Error("Meaning-complex inputs must use the same calculation mode.");
  }
  const builder = createBaseGraph(facts, structural);
  const seedResult = seedCandidates(facts, structural, builder);
  const complexes: MeaningComplex[] = [];
  const suppressed = new Map(seedResult.suppressed);
  let collapsedEvidenceAliasCount = 0;

  for (const seed of seedResult.seeds) {
    const result = meaningComplexForSeed(facts, structural, builder, seed);
    collapsedEvidenceAliasCount += result.collapsedCount;
    if (result.complex) {
      complexes.push(result.complex);
    } else {
      suppressed.set(seed.nodeId, result.reason ?? "Candidate did not satisfy the formation gate.");
    }
  }

  complexes.sort((left, right) =>
    right.score.total - left.score.total || left.id.localeCompare(right.id)
  );
  addComplexNodesAndEdges(facts, builder, complexes);

  const nodes = [...builder.nodes.values()].sort((left, right) => left.id.localeCompare(right.id));
  const edges = [...builder.edges.values()].sort((left, right) => left.id.localeCompare(right.id));
  const allPaths = complexes.flatMap((complex) => [
    ...complex.supportPaths,
    ...complex.counterevidence
  ]);
  return {
    rulesetVersion: ASTRA_V2_PHASE_3_RULESET_VERSION,
    calculationMode: facts.calculationMode,
    nodes,
    edges,
    complexes,
    audit: {
      seedNodeIds: seedResult.seeds.map((seed) => seed.nodeId),
      suppressedSeedNodeIds: [...suppressed.keys()].sort(),
      suppressedSeedReasons: Object.fromEntries(
        [...suppressed.entries()].sort(([left], [right]) => left.localeCompare(right))
      ),
      collapsedEvidenceAliasCount,
      maximumObservedPathDepth: Math.max(0, ...allPaths.map((path) => path.derivationDistance))
    }
  };
}
