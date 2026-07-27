import type {
  MeaningComplex,
  MeaningComplexNetwork,
  ReportDomain
} from "./meaningComplexNetwork";

export const ASTRA_V2_PHASE_4_RULESET_VERSION = "2.0.0-phase-4";
export const ASTRA_CORE_MEANING_COMPLEX_LIMIT = 3;
export const ASTRA_DEEP_MEANING_COMPLEX_LIMIT = 7;
export const ASTRA_CANONICAL_IDENTITY_COMPLEX_LIMIT = 4;

export type PersonReportChapter =
  | "Identity"
  | "Emotions"
  | "Relationships"
  | "Work"
  | "Drive"
  | "Gifts"
  | "Blind Spots"
  | "Growth"
  | "Integration";

export type MeaningComplexChapterSelection = {
  title: PersonReportChapter;
  primaryComplexId: string;
  supportingComplexIds: string[];
  domainFocus: ReportDomain[];
  interpretiveJob: string;
};

export type MeaningComplexReportView = {
  view: "identity" | "core" | "deep";
  canonicalIdentityComplexIds: string[];
  selectedComplexIds: string[];
  chapters: MeaningComplexChapterSelection[];
};

export type MeaningComplexReportViews = {
  rulesetVersion: typeof ASTRA_V2_PHASE_4_RULESET_VERSION;
  networkRulesetVersion: MeaningComplexNetwork["rulesetVersion"];
  canonicalIdentityComplexIds: string[];
  identity: MeaningComplexReportView;
  core: MeaningComplexReportView;
  deep: MeaningComplexReportView;
};

type ChapterPolicy = {
  title: PersonReportChapter;
  domains: ReportDomain[];
  interpretiveJob: string;
};

const identityPolicy: ChapterPolicy = {
  title: "Identity",
  domains: ["identity"],
  interpretiveJob: "central organizing structure"
};

const corePolicies: ChapterPolicy[] = [
  {
    title: "Relationships",
    domains: ["relationships"],
    interpretiveJob: "connection, reciprocity, and explicit relational conditions"
  },
  {
    title: "Work",
    domains: ["work", "resources", "agency"],
    interpretiveJob: "contribution, allocation, craft, and useful effort"
  },
  {
    title: "Integration",
    domains: ["integration", "identity", "growth"],
    interpretiveJob: "cross-domain decision criteria without repeating Identity"
  }
];

const deepPolicies: ChapterPolicy[] = [
  {
    title: "Emotions",
    domains: ["emotions"],
    interpretiveJob: "emotional processing, information, and recovery conditions"
  },
  ...corePolicies.slice(0, 2),
  {
    title: "Drive",
    domains: ["agency"],
    interpretiveJob: "agency, force, pacing, and proportion"
  },
  {
    title: "Gifts",
    domains: ["resources", "identity"],
    interpretiveJob: "a usable capacity and the contribution it can make"
  },
  {
    title: "Blind Spots",
    domains: ["growth", "agency", "emotions"],
    interpretiveJob: "counterevidence, verification, and the limits of a first interpretation"
  },
  {
    title: "Growth",
    domains: ["growth"],
    interpretiveJob: "developmental range and how a stable self-concept can update"
  },
  corePolicies[2]!
];

const confidenceRank: Record<MeaningComplex["confidence"], number> = {
  exploratory: 0,
  supported: 1,
  strong: 2
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function hasDomain(complex: MeaningComplex, domains: ReportDomain[]) {
  return complex.domains.some((domain) => domains.includes(domain));
}

function counterevidenceRatio(complex: MeaningComplex) {
  const evidenceCount = complex.supportPaths.length + complex.counterevidence.length;
  return evidenceCount ? complex.counterevidence.length / evidenceCount : 0;
}

function roleScore(
  complex: MeaningComplex,
  policy: ChapterPolicy,
  view: MeaningComplexReportView["view"]
) {
  const domainMatches = complex.domains.filter((domain) => policy.domains.includes(domain)).length;
  const preferredView = complex.preferredView === view || complex.preferredView === "all" ? 0.08 : 0;
  const confidence = confidenceRank[complex.confidence] * 0.04;
  const focalConfiguration = complex.mechanism.startsWith("configuration_") ? 0.025 : 0;
  const counterweight = policy.title === "Blind Spots"
    ? counterevidenceRatio(complex) * 0.12
    : 0;
  const lunarIntegration = policy.title === "Integration" && complex.mechanism === "solar_lunar_cycle"
    ? 0.24
    : 0;
  const directIntegration = policy.title === "Integration" && complex.domains.includes("integration")
    ? 0.14
    : 0;
  const personalResource = policy.title === "Gifts" && complex.domains.includes("resources")
    ? 0.22
    : 0;
  const lunarEmphasis = policy.title === "Emotions" && complex.mechanism === "lunar_processing"
    ? 0.14
    : 0;
  const marsAgency = policy.title === "Drive" && complex.seedNodeIds.includes("point:mars")
    ? 0.16
    : 0;
  return (
    complex.score.total +
    domainMatches * 0.18 +
    preferredView +
    confidence +
    focalConfiguration +
    counterweight +
    lunarIntegration +
    directIntegration +
    personalResource +
    lunarEmphasis +
    marsAgency
  );
}

function compareForPolicy(
  left: MeaningComplex,
  right: MeaningComplex,
  policy: ChapterPolicy,
  view: MeaningComplexReportView["view"],
  selected: MeaningComplex[] = []
) {
  return diversityAdjustedRoleScore(right, policy, view, selected) -
      diversityAdjustedRoleScore(left, policy, view, selected) ||
    right.score.total - left.score.total ||
    left.id.localeCompare(right.id);
}

function sharedSeedRatio(left: MeaningComplex, right: MeaningComplex) {
  const leftSeeds = new Set(left.seedNodeIds);
  const rightSeeds = new Set(right.seedNodeIds);
  const union = new Set([...leftSeeds, ...rightSeeds]);
  const shared = [...leftSeeds].filter((seed) => rightSeeds.has(seed)).length;
  const seedRatio = union.size ? shared / union.size : 0;
  const bodyPattern = /(?:^|[-:])(north-node|south-node|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron)(?=$|-)/g;
  const bodies = (complex: MeaningComplex) =>
    new Set([...complex.id.matchAll(bodyPattern)].map((match) => match[1]!));
  const leftBodies = bodies(left);
  const rightBodies = bodies(right);
  const bodyUnion = new Set([...leftBodies, ...rightBodies]);
  const sharedBodies = [...leftBodies].filter((body) => rightBodies.has(body)).length;
  const bodyRatio = bodyUnion.size ? sharedBodies / bodyUnion.size : 0;
  return Math.max(seedRatio, bodyRatio);
}

function diversityAdjustedRoleScore(
  complex: MeaningComplex,
  policy: ChapterPolicy,
  view: MeaningComplexReportView["view"],
  selected: MeaningComplex[]
) {
  const strongestSeedOverlap = selected.reduce(
    (maximum, candidate) => Math.max(maximum, sharedSeedRatio(complex, candidate)),
    0
  );
  const mechanismAlreadyOwned = selected.some((candidate) => candidate.mechanism === complex.mechanism);
  return roleScore(complex, policy, view) -
    strongestSeedOverlap * 0.35 -
    (mechanismAlreadyOwned ? 0.08 : 0);
}

function pickForPolicy(
  complexes: MeaningComplex[],
  policy: ChapterPolicy,
  view: MeaningComplexReportView["view"],
  excludedIds: Set<string>,
  selected: MeaningComplex[] = []
) {
  const unused = complexes.filter((complex) =>
    !excludedIds.has(complex.id) && hasDomain(complex, policy.domains)
  );
  const diverseUnused = unused.filter((complex) =>
    selected.every((candidate) => sharedSeedRatio(complex, candidate) < 0.75)
  );
  const candidates = diverseUnused.length
    ? diverseUnused
    : unused.length
    ? unused
    : complexes.filter((complex) => !excludedIds.has(complex.id));
  return candidates.sort((left, right) => compareForPolicy(left, right, policy, view, selected))[0] ?? null;
}

function complexForSeed(complexes: MeaningComplex[], seedNodeId: string) {
  return complexes
    .filter((complex) => complex.seedNodeIds.includes(seedNodeId))
    .sort((left, right) => right.score.total - left.score.total || left.id.localeCompare(right.id))[0] ?? null;
}

function canonicalIdentityComplexes(complexes: MeaningComplex[]) {
  const selected: MeaningComplex[] = [];
  const selectedIds = new Set<string>();
  const add = (complex: MeaningComplex | null) => {
    if (!complex || selectedIds.has(complex.id) || selected.length >= ASTRA_CANONICAL_IDENTITY_COMPLEX_LIMIT) {
      return;
    }
    selected.push(complex);
    selectedIds.add(complex.id);
  };

  add(complexForSeed(complexes, "point:sun"));
  add(complexForSeed(complexes, "point:moon"));
  add(
    complexes
      .filter((complex) => complex.mechanism === "chart_ruler")
      .sort((left, right) => right.score.total - left.score.total || left.id.localeCompare(right.id))[0] ?? null
  );
  add(complexForSeed(complexes, "point:ascendant"));
  add(
    complexes
      .filter((complex) =>
        complex.mechanism.startsWith("configuration_") && complex.domains.includes("identity")
      )
      .sort((left, right) => right.score.total - left.score.total || left.id.localeCompare(right.id))[0] ?? null
  );

  const remainingIdentity = complexes
    .filter((complex) => complex.domains.includes("identity"))
    .sort((left, right) => compareForPolicy(left, right, identityPolicy, "identity"));
  for (const complex of remainingIdentity) add(complex);
  return selected;
}

function chapter(
  policy: ChapterPolicy,
  primary: MeaningComplex,
  supportingComplexIds: string[] = []
): MeaningComplexChapterSelection {
  return {
    title: policy.title,
    primaryComplexId: primary.id,
    supportingComplexIds: unique(supportingComplexIds).filter((id) => id !== primary.id),
    domainFocus: policy.domains,
    interpretiveJob: policy.interpretiveJob
  };
}

function selectDistinctForPolicies(
  complexes: MeaningComplex[],
  policies: ChapterPolicy[],
  view: MeaningComplexReportView["view"],
  initialIds: string[] = []
) {
  const selected = initialIds
    .map((id) => complexes.find((complex) => complex.id === id))
    .filter((complex): complex is MeaningComplex => Boolean(complex));
  const selectedIds = new Set(selected.map((complex) => complex.id));
  const byTitle = new Map<PersonReportChapter, MeaningComplex>();

  for (const policy of policies) {
    const primary = pickForPolicy(complexes, policy, view, selectedIds, selected);
    if (!primary) continue;
    selected.push(primary);
    selectedIds.add(primary.id);
    byTitle.set(policy.title, primary);
  }
  return { selected, byTitle };
}

function bestSelectedForPolicy(
  selected: MeaningComplex[],
  policy: ChapterPolicy,
  view: MeaningComplexReportView["view"],
  assigned: MeaningComplex[] = []
) {
  return [...selected]
    .sort((left, right) => {
      const leftReuse = assigned.some((complex) => complex.id === left.id) ? 0.3 : 0;
      const rightReuse = assigned.some((complex) => complex.id === right.id) ? 0.3 : 0;
      return (
        diversityAdjustedRoleScore(right, policy, view, assigned) - rightReuse -
          (diversityAdjustedRoleScore(left, policy, view, assigned) - leftReuse) ||
        right.score.total - left.score.total ||
        left.id.localeCompare(right.id)
      );
    })[0] ?? null;
}

function domainPathOrigins(complex: MeaningComplex, policy: ChapterPolicy) {
  return new Set(
    complex.supportPaths
      .filter((path) => path.domains.some((domain) => policy.domains.includes(domain)))
      .map((path) => path.originKey)
  );
}

function canReuseAcrossPolicies(
  complex: MeaningComplex,
  existingPolicies: ChapterPolicy[],
  nextPolicy: ChapterPolicy
) {
  if (existingPolicies.some((policy) =>
    (policy.title === "Blind Spots" && nextPolicy.title === "Growth") ||
    (policy.title === "Growth" && nextPolicy.title === "Blind Spots")
  )) {
    return false;
  }
  const nextOrigins = domainPathOrigins(complex, nextPolicy);
  if (!nextOrigins.size) return false;
  return existingPolicies.every((policy) => {
    const existingOrigins = domainPathOrigins(complex, policy);
    return [...existingOrigins].some((origin) =>
      [...nextOrigins].some((nextOrigin) => nextOrigin !== origin)
    );
  });
}

function exploratoryPenalty(
  complex: MeaningComplex,
  policy: ChapterPolicy,
  candidates: MeaningComplex[]
) {
  if (complex.confidence !== "exploratory") return 0;
  const score = roleScore(complex, policy, "deep");
  const supportedNearby = candidates.some((candidate) =>
    candidate.confidence !== "exploratory" &&
    roleScore(candidate, policy, "deep") >= score - 0.15
  );
  return supportedNearby ? 0.2 : 0;
}

type DeepAssignmentPlan = {
  score: number;
  key: string;
  byTitle: Map<PersonReportChapter, MeaningComplex>;
  selectedIds: Set<string>;
};

function planDeepAssignments(
  complexes: MeaningComplex[],
  fixedByTitle: Map<PersonReportChapter, MeaningComplex>
): DeepAssignmentPlan | null {
  const fixedPolicies = deepPolicies.filter((policy) => fixedByTitle.has(policy.title));
  const plannedPolicies = deepPolicies.filter((policy) => !fixedByTitle.has(policy.title));
  const initialOwners = new Map<string, ChapterPolicy[]>();
  for (const policy of fixedPolicies) {
    const complex = fixedByTitle.get(policy.title);
    if (!complex) continue;
    initialOwners.set(complex.id, [...(initialOwners.get(complex.id) ?? []), policy]);
  }
  const initialSelectedIds = new Set(initialOwners.keys());
  const candidatePools = new Map(plannedPolicies.map((policy) => {
    const matching = complexes.filter((complex) => hasDomain(complex, policy.domains));
    const ranked = [...matching]
      .sort((left, right) => compareForPolicy(left, right, policy, "deep"))
      .slice(0, 8);
    for (const fixed of fixedByTitle.values()) {
      if (hasDomain(fixed, policy.domains) && !ranked.some((candidate) => candidate.id === fixed.id)) {
        ranked.push(fixed);
      }
    }
    return [policy.title, ranked] as const;
  }));

  let best: DeepAssignmentPlan | null = null;

  const visit = (
    policyIndex: number,
    byTitle: Map<PersonReportChapter, MeaningComplex>,
    owners: Map<string, ChapterPolicy[]>,
    selectedIds: Set<string>,
    score: number
  ) => {
    if (policyIndex >= plannedPolicies.length) {
      const key = deepPolicies.map((policy) =>
        `${policy.title}:${(byTitle.get(policy.title) ?? fixedByTitle.get(policy.title))?.id ?? ""}`
      ).join("|");
      if (!best || score > best.score || (score === best.score && key.localeCompare(best.key) < 0)) {
        best = {
          score,
          key,
          byTitle: new Map([...fixedByTitle, ...byTitle]),
          selectedIds: new Set(selectedIds)
        };
      }
      return;
    }

    const policy = plannedPolicies[policyIndex]!;
    const candidates = candidatePools.get(policy.title) ?? [];
    for (const candidate of candidates) {
      const existingOwners = owners.get(candidate.id) ?? [];
      if (existingOwners.length >= 2) continue;
      if (existingOwners.length && !canReuseAcrossPolicies(candidate, existingOwners, policy)) continue;
      if (!selectedIds.has(candidate.id) && selectedIds.size >= ASTRA_DEEP_MEANING_COMPLEX_LIMIT) continue;
      if (!selectedIds.has(candidate.id) && [...selectedIds].some((id) => {
        const selected = complexes.find((complex) => complex.id === id);
        return selected ? sharedSeedRatio(candidate, selected) >= 0.75 : false;
      })) {
        continue;
      }

      const nextByTitle = new Map(byTitle).set(policy.title, candidate);
      const nextOwners = new Map(owners).set(candidate.id, [...existingOwners, policy]);
      const nextSelectedIds = new Set(selectedIds).add(candidate.id);
      const reusePenalty = existingOwners.length ? 0.12 : 0;
      visit(
        policyIndex + 1,
        nextByTitle,
        nextOwners,
        nextSelectedIds,
        score + roleScore(candidate, policy, "deep") -
          reusePenalty -
          exploratoryPenalty(candidate, policy, candidates)
      );
    }
  };

  visit(0, new Map(), initialOwners, initialSelectedIds, 0);
  return best as DeepAssignmentPlan | null;
}

export function selectMeaningComplexReportViews(
  network: MeaningComplexNetwork
): MeaningComplexReportViews | null {
  if (!network.complexes.length) return null;
  const complexes = [...network.complexes];
  const canonical = canonicalIdentityComplexes(complexes);
  const identityPrimary = canonical[0] ?? pickForPolicy(complexes, identityPolicy, "identity", new Set());
  if (!identityPrimary) return null;
  const canonicalIdentityComplexIds = canonical.length
    ? canonical.map((complex) => complex.id)
    : [identityPrimary.id];
  const identityChapter = chapter(
    identityPolicy,
    identityPrimary,
    canonicalIdentityComplexIds
  );

  const coreSelection = selectDistinctForPolicies(complexes, corePolicies, "core");
  const coreSelected = coreSelection.selected.slice(0, ASTRA_CORE_MEANING_COMPLEX_LIMIT);
  const coreChapters = corePolicies.flatMap((policy) => {
    const primary = coreSelection.byTitle.get(policy.title) ??
      bestSelectedForPolicy(coreSelected, policy, "core");
    return primary ? [chapter(policy, primary)] : [];
  });

  const plannedDeep = complexes.length >= ASTRA_DEEP_MEANING_COMPLEX_LIMIT
    ? planDeepAssignments(complexes, coreSelection.byTitle)
    : null;
  const deepSelected = plannedDeep
    ? [...plannedDeep.selectedIds]
        .map((id) => complexes.find((complex) => complex.id === id))
        .filter((complex): complex is MeaningComplex => Boolean(complex))
    : selectDistinctForPolicies(
        complexes,
        deepPolicies,
        "deep"
      ).selected.slice(0, ASTRA_DEEP_MEANING_COMPLEX_LIMIT);
  const assignedDeepPrimaries: MeaningComplex[] = [];
  const deepChapters = deepPolicies.flatMap((policy) => {
    const primary = plannedDeep?.byTitle.get(policy.title) ??
      bestSelectedForPolicy(deepSelected, policy, "deep", assignedDeepPrimaries);
    if (!primary) return [];
    assignedDeepPrimaries.push(primary);
    return [chapter(policy, primary)];
  });

  return {
    rulesetVersion: ASTRA_V2_PHASE_4_RULESET_VERSION,
    networkRulesetVersion: network.rulesetVersion,
    canonicalIdentityComplexIds,
    identity: {
      view: "identity",
      canonicalIdentityComplexIds,
      selectedComplexIds: canonicalIdentityComplexIds,
      chapters: [identityChapter]
    },
    core: {
      view: "core",
      canonicalIdentityComplexIds,
      selectedComplexIds: coreSelected.map((complex) => complex.id),
      chapters: [identityChapter, ...coreChapters]
    },
    deep: {
      view: "deep",
      canonicalIdentityComplexIds,
      selectedComplexIds: deepSelected.map((complex) => complex.id),
      chapters: [identityChapter, ...deepChapters]
    }
  };
}
