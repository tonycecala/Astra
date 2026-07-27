import type { PersonReportChapter } from "../meaningComplexReportViews";

export type ChapterEvidencePlanningPolicy = {
  intendedConclusion: string;
  prohibitedInference: string;
  semanticScope: string;
};

const chapterEvidencePlanningPolicies: Record<PersonReportChapter, ChapterEvidencePlanningPolicy> = {
  Identity: {
    intendedConclusion: "Describe the organizing identity pattern without fixing personality or behavior.",
    prohibitedInference: "infer a fixed personality, private routine, social presentation, or established behavior",
    semanticScope: "the Identity question about organizing self-understanding"
  },
  Emotions: {
    intendedConclusion: "Describe a possible condition for emotional information to become clearer without assigning a coping routine.",
    prohibitedInference: "infer a current feeling, recovery method, private routine, reaction history, or established coping behavior",
    semanticScope: "the Emotions question about emotional information and clarity conditions"
  },
  Relationships: {
    intendedConclusion: "Describe a possible condition for reciprocity or explicit terms without describing an actual bond.",
    prohibitedInference: "infer relationship status, a current or past bond, another person's response, or unstated motives",
    semanticScope: "the Relationships question about reciprocity and explicit terms"
  },
  Work: {
    intendedConclusion: "Describe where effort or contribution may be allocated usefully without claiming a work history.",
    prohibitedInference: "infer career history, task circumstances, reputation, recognition, workload, or proven contribution",
    semanticScope: "the Work question about allocation, contribution, and useful effort"
  },
  Drive: {
    intendedConclusion: "Describe possible pacing or proportion of force without deciding which work deserves effort.",
    prohibitedInference: "infer task importance, work allocation, current momentum, timing, stamina, or a proven action style",
    semanticScope: "the Drive question about force, pacing, and proportion"
  },
  Gifts: {
    intendedConclusion: "Name a capacity available for contribution without claiming skill or a known effect on others.",
    prohibitedInference: "infer proven skill, routine performance, reputation, social impact, or how other people receive the subject",
    semanticScope: "the Gifts question about a possible resource available for contribution"
  },
  "Blind Spots": {
    intendedConclusion: "Name where an interpretation needs verification without inventing a real-world scenario or privileged perception.",
    prohibitedInference: "infer a home, family, work, or relationship circumstance, a concrete event, rapid certainty, or privileged perception",
    semanticScope: "the Blind Spots question about verification and interpretive limits"
  },
  Growth: {
    intendedConclusion: "Describe how self-understanding may admit new information without claiming past change or future timing.",
    prohibitedInference: "infer biography, a past correction, wholesale change, current development, future timing, or an established growth habit",
    semanticScope: "the Growth question about admitting new information into self-understanding"
  },
  Integration: {
    intendedConclusion: "Offer cross-domain decision criteria without asserting a current decision or prescribed action.",
    prohibitedInference: "infer a current choice, timing, a familiar life event, an established decision habit, or a required action",
    semanticScope: "the Integration question about cross-domain decision criteria"
  }
};

export function chapterEvidencePlanningPolicy(title: PersonReportChapter) {
  return chapterEvidencePlanningPolicies[title];
}

export type WriterEvidenceRole = "primary" | "support" | "counterweight";

export type EvidencePlanningSignal = {
  label: string;
  facts: readonly string[];
};

const bodyMeanings: Record<string, string> = {
  sun: "orientation and self-definition",
  moon: "emotional information and felt security",
  mercury: "naming, comparison, and interpretation",
  venus: "value, attraction, and connection",
  mars: "force, effort, and initiation",
  jupiter: "expansion, confidence, and meaning",
  saturn: "limits, structure, and accountability",
  uranus: "variation, discontinuity, and independence",
  neptune: "imagination, permeability, and uncertainty",
  pluto: "depth, intensity, and pressure",
  chiron: "sensitivity and adjustment",
  "north node": "directional emphasis",
  "south node": "familiarity emphasis",
  ascendant: "self-presentation and approach",
  midheaven: "public-direction symbolism"
};

const signMeanings: Record<string, string> = {
  aries: "initiative and directness",
  taurus: "continuity and material stability",
  gemini: "comparison and exchange",
  cancer: "protection and belonging",
  leo: "visibility and creative expression",
  virgo: "discrimination and refinement",
  libra: "balance and relational comparison",
  scorpio: "intensity and privacy",
  sagittarius: "exploration and meaning",
  capricorn: "structure and limits",
  aquarius: "systems and difference",
  pisces: "permeability and synthesis"
};

const houseMeanings: Record<number, string> = {
  1: "self-directed presence",
  2: "resources and value",
  3: "communication and learning",
  4: "private foundation",
  5: "creative expression",
  6: "maintenance and service",
  7: "one-to-one relating",
  8: "shared resources and intimacy",
  9: "worldview and extended learning",
  10: "public role and responsibility",
  11: "groups and shared aims",
  12: "private and liminal processing"
};

const aspectMeanings: Record<string, string> = {
  conjunction: "combined emphasis",
  opposition: "a polarity that requires comparison",
  square: "friction that requires adjustment",
  trine: "potential compatibility",
  sextile: "possible cooperation",
  quincunx: "a mismatch that requires calibration"
};

const angleMeanings: Record<string, string> = {
  ascendant: "the chart's self-directed horizon and approach",
  descendant: "the chart's one-to-one relational horizon",
  midheaven: "the chart's public-direction horizon",
  "imum coeli": "the chart's private-foundation horizon"
};

const bodyPattern = /\b(north node|south node|ascendant|midheaven|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron)\b/gi;
const anglePattern = /\b(ascendant|descendant|midheaven|imum coeli|ic|mc)\b/i;
const signPattern = /\b(aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/i;
const aspectPattern = /\b(conjunction|opposition|square|trine|sextile|quincunx)\b/i;
const lunarPhasePattern = /\b(new|waxing crescent|first quarter|waxing gibbous|full|waning gibbous|last quarter|waning crescent)\b(?:\s+(?:moon|lunar phase))?/i;
const configurationPattern = /\b(stellium|conjunction cluster|t[- ]square|grand trine|grand cross|yod|kite)\b/i;

function readable(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\s+/g, " ").trim();
}

function signalText(signal: EvidencePlanningSignal) {
  return readable(`${signal.label}; ${signal.facts.join("; ")}`);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function signalBodies(signal: EvidencePlanningSignal) {
  const matches = [...signalText(signal).matchAll(bodyPattern)].map((match) => match[1]!.toLowerCase());
  return [...new Set(matches)];
}

function signalSign(signal: EvidencePlanningSignal) {
  return signalText(signal).match(signPattern)?.[1]?.toLowerCase();
}

function signalHouse(signal: EvidencePlanningSignal) {
  const match = signalText(signal).match(/\b(1[0-2]|[1-9])(?:st|nd|rd|th)?\s+house\b/i);
  return match?.[1] ? Number.parseInt(match[1], 10) : undefined;
}

function directRulership(signal: EvidencePlanningSignal) {
  const text = signalText(signal);
  const disposed = text.match(/\b(north node|south node|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron)\s+disposed by\s+(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)\b/i);
  if (disposed) return { subject: disposed[1]!.toLowerCase(), ruler: disposed[2]!.toLowerCase() };
  const houseRuler = text.match(/\b(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)\s+rules\s+(?:the\s+)?(1[0-2]|[1-9])(?:st|nd|rd|th)?\s+house\b/i);
  if (houseRuler) return { subject: `${houseRuler[2]} house`, ruler: houseRuler[1]!.toLowerCase() };
  return null;
}

function exactFactLabel(signal: EvidencePlanningSignal) {
  const text = signalText(signal);
  const rulership = directRulership(signal);
  if (rulership) {
    return rulership.subject.endsWith("house")
      ? `${titleCase(rulership.ruler)} rules ${rulership.subject}`
      : `${titleCase(rulership.subject)} disposed by ${titleCase(rulership.ruler)}`;
  }
  const aspect = text.match(aspectPattern)?.[1]?.toLowerCase();
  const bodies = signalBodies(signal);
  if (aspect && bodies.length >= 2) {
    return `${titleCase(bodies[0]!)} ${aspect} ${titleCase(bodies[1]!)}`;
  }
  const phase = text.match(lunarPhasePattern)?.[1];
  if (phase) return `${titleCase(phase)} lunar phase`;
  const body = bodies[0];
  const sign = signalSign(signal);
  const house = signalHouse(signal);
  if (body && (sign || house)) {
    return `${titleCase(body)}${sign ? ` in ${titleCase(sign)}` : ""}${house ? ` in the ${house} house` : ""}`;
  }
  const configuration = text.match(configurationPattern)?.[1];
  if (configuration) return titleCase(readable(configuration));
  return titleCase(readable(signal.label));
}

function roleVerb(role: WriterEvidenceRole) {
  if (role === "primary") return "anchor";
  if (role === "counterweight") return "limit or qualify";
  return "support or qualify";
}

function chapterPlacementBoundary(title: PersonReportChapter) {
  if (title === "Work") return "It does not establish mediation, teamwork, leadership, a group role, or any work outcome.";
  if (title === "Gifts") return "It does not prove contribution, skill, reputation, social effect, or how anyone receives the subject.";
  if (title === "Relationships") return "It does not establish an actual bond, spoken request, relational behavior, or another person's response.";
  if (title === "Blind Spots") return "It does not establish an actual home, family, work, or relationship circumstance.";
  return "It does not establish behavior, biography, a concrete situation, or an outcome.";
}

export function planWriterFact(
  title: PersonReportChapter,
  signal: EvidencePlanningSignal,
  role: WriterEvidenceRole
) {
  const policy = chapterEvidencePlanningPolicy(title);
  const text = signalText(signal);
  const fact = exactFactLabel(signal);
  const aspect = text.match(aspectPattern)?.[1]?.toLowerCase();
  const bodies = signalBodies(signal);
  const rulership = directRulership(signal);
  const phase = text.match(lunarPhasePattern)?.[1]?.toLowerCase();
  const configuration = text.match(configurationPattern)?.[1];
  const sign = signalSign(signal);
  const house = signalHouse(signal);
  const chartRuler = text.match(/\bchart ruler\s+(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)\b/i)?.[1]?.toLowerCase();
  const rawAngle = text.match(anglePattern)?.[1]?.toLowerCase();
  const angle = rawAngle === "ic" ? "imum coeli" : rawAngle === "mc" ? "midheaven" : rawAngle;
  const contributionVerb = roleVerb(role);

  if (angle) {
    const signScope = sign ? `, expressed through ${signMeanings[sign]}` : "";
    return {
      allowedContribution: `${fact} may ${contributionVerb} ${policy.semanticScope} by locating the question at ${angleMeanings[angle]}${signScope}.`,
      prohibitedInference: `${fact} cannot establish a personality, behavior, relationship condition, public or private circumstance, another person's state, or outcome; it also cannot be used to ${policy.prohibitedInference}.`
    };
  }

  if (chartRuler) {
    const rulerMeaning = bodyMeanings[chartRuler] ?? `${chartRuler} symbolism`;
    return {
      allowedContribution: `${fact} may ${contributionVerb} ${policy.semanticScope} by giving ${rulerMeaning} chart-wide orienting emphasis through rulership of the calculated Ascendant sign.`,
      prohibitedInference: `${fact} cannot establish a dominant personality, behavior, skill, outcome, causal mechanism, or greater factual importance than the other selected facts; it also cannot be used to ${policy.prohibitedInference}.`
    };
  }

  if (rulership) {
    const subjectMeaning = rulership.subject.endsWith("house")
      ? houseMeanings[Number.parseInt(rulership.subject, 10)] ?? "the selected house domain"
      : bodyMeanings[rulership.subject] ?? `${rulership.subject} symbolism`;
    const rulerMeaning = bodyMeanings[rulership.ruler] ?? `${rulership.ruler} symbolism`;
    return {
      allowedContribution: `${fact} may ${contributionVerb} ${policy.semanticScope} by making ${rulerMeaning} structurally relevant to ${subjectMeaning} through one direct sign-rulership fact.`,
      prohibitedInference: `${fact} cannot establish causal flow, a chain, self-containment, outside-validation resistance, personality, behavior, or skill; it also cannot be used to ${policy.prohibitedInference}.`
    };
  }

  if (aspect && bodies.length >= 2) {
    const leftMeaning = bodyMeanings[bodies[0]!] ?? `${bodies[0]} symbolism`;
    const rightMeaning = bodyMeanings[bodies[1]!] ?? `${bodies[1]} symbolism`;
    return {
      allowedContribution: `${fact} may ${contributionVerb} ${policy.semanticScope} by placing ${leftMeaning} and ${rightMeaning} in ${aspectMeanings[aspect] ?? "a defined angular relationship"}.`,
      prohibitedInference: `${fact} cannot establish ease, difficulty, skill, habit, action, communication, outcome, or another person's response; it also cannot be used to ${policy.prohibitedInference}.`
    };
  }

  if (phase) {
    return {
      allowedContribution: `${fact} may ${contributionVerb} ${policy.semanticScope} by supplying the natal ${phase} Sun-Moon geometry as one comparison frame.`,
      prohibitedInference: `${fact} cannot establish a preference for early or delayed action, current timing, developmental stage, behavior, or outcome; it also cannot be used to ${policy.prohibitedInference}.`
    };
  }

  if (configuration) {
    return {
      allowedContribution: `${fact} may ${contributionVerb} ${policy.semanticScope} by marking the named factors as a co-present natal configuration.`,
      prohibitedInference: `${fact} cannot establish that the factors act as one causal system, that change ripples between life areas, or any behavior, biography, timing, skill, or outcome; it also cannot be used to ${policy.prohibitedInference}.`
    };
  }

  if (/\b(?:element|modality|polarity|hemisphere|quadrant|distribution)\b/i.test(text)) {
    return {
      allowedContribution: `${fact} may ${contributionVerb} ${policy.semanticScope} by comparing relative chart emphasis within the named distribution.`,
      prohibitedInference: `${fact} cannot establish a personality type, missing human capacity, preference, behavior, outcome, or concrete situation; it also cannot be used to ${policy.prohibitedInference}.`
    };
  }

  if (/\b(?:personal activation|natal relevance)\b/i.test(text)) {
    const target = bodies[0] ? titleCase(bodies[0]) : fact;
    return {
      allowedContribution: `${fact} may ${contributionVerb} ${policy.semanticScope} only by marking ${target} as natally relevant.`,
      prohibitedInference: `${fact} cannot establish timing, pressure, behavior, special ability, accuracy, biography, or outcome; it also cannot be used to ${policy.prohibitedInference}.`
    };
  }

  if (bodies[0] && (sign || house)) {
    const bodyMeaning = bodyMeanings[bodies[0]!] ?? `${bodies[0]} symbolism`;
    const scopes = [
      sign ? signMeanings[sign] : null,
      house ? houseMeanings[house] : null
    ].filter((value): value is string => Boolean(value));
    return {
      allowedContribution: `${fact} may ${contributionVerb} ${policy.semanticScope} by locating ${bodyMeaning} within ${scopes.join(" and ")}.`,
      prohibitedInference: `${fact} defines symbolic scope only. ${chapterPlacementBoundary(title)} It also cannot be used to ${policy.prohibitedInference}.`
    };
  }

  throw new Error(`Semantic Synthesis V2 has no fact-specific semantic bridge for ${title}: ${fact}.`);
}
