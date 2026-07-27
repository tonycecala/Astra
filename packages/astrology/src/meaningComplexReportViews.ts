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
    interpretiveJob: "counterevidence, perception, and the limits of a first interpretation"
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
  view: MeaningComplexReportView["view"]
) {
  return roleScore(right, policy, view) - roleScore(left, policy, view) ||
    right.score.total - left.score.total ||
    left.id.localeCompare(right.id);
}

function pickForPolicy(
  complexes: MeaningComplex[],
  policy: ChapterPolicy,
  view: MeaningComplexReportView["view"],
  excludedIds: Set<string>
) {
  const unused = complexes.filter((complex) =>
    !excludedIds.has(complex.id) && hasDomain(complex, policy.domains)
  );
  const candidates = unused.length
    ? unused
    : complexes.filter((complex) => !excludedIds.has(complex.id));
  return candidates.sort((left, right) => compareForPolicy(left, right, policy, view))[0] ?? null;
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
    const primary = pickForPolicy(complexes, policy, view, selectedIds);
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
  view: MeaningComplexReportView["view"]
) {
  return [...selected]
    .sort((left, right) => compareForPolicy(left, right, policy, view))[0] ?? null;
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

  const deepAdditionalPolicies = deepPolicies.filter((policy) =>
    !corePolicies.some((corePolicy) => corePolicy.title === policy.title)
  );
  const deepSelection = selectDistinctForPolicies(
    complexes,
    deepAdditionalPolicies,
    "deep",
    coreSelected.map((complex) => complex.id)
  );
  const deepSelected = deepSelection.selected.slice(0, ASTRA_DEEP_MEANING_COMPLEX_LIMIT);
  while (deepSelected.length < Math.min(ASTRA_DEEP_MEANING_COMPLEX_LIMIT, complexes.length)) {
    const excluded = new Set(deepSelected.map((complex) => complex.id));
    const next = complexes
      .filter((complex) => !excluded.has(complex.id))
      .sort((left, right) => right.score.total - left.score.total || left.id.localeCompare(right.id))[0];
    if (!next) break;
    deepSelected.push(next);
  }
  const deepChapters = deepPolicies.flatMap((policy) => {
    const distinctGift = policy.title === "Gifts"
      ? deepSelection.byTitle.get("Gifts")
      : null;
    const primary = distinctGift && deepSelected.some((complex) => complex.id === distinctGift.id)
      ? distinctGift
      : bestSelectedForPolicy(deepSelected, policy, "deep");
    return primary ? [chapter(policy, primary)] : [];
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
