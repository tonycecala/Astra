import type { SynastryToneSnapshot } from "@astra/contracts";

export type SynastryV3TraceRow = {
  chapter: string;
  paragraphIndex: number;
  evidenceIds: string[];
  supportedFeeling: string;
  mechanism: string;
  livedExpression: string;
  relationalConsequence: string;
};
export type SynastryV3EvidenceRow = { id: string; label: string; meaning: string; evidenceJobs: string[] };
export type SynastryV3FatalCategory =
  | "format_integrity"
  | "technical_surface"
  | "invented_reality"
  | "perspective_erasure"
  | "semantic_fidelity"
  | "comparative_verdict"
  | "identity_integrity";

const technicalTermPattern = /\b(?:astrology|astrological|chart|planet|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|ascendant|midheaven|zodiac|natal|synastry|interaspect|aspect|conjunction|conjunct|trine|square|sextile|quincunx|opposition|orb|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/i;
const technicalTermsPattern = /\b(?:astrology|astrological|chart|planet|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|ascendant|midheaven|zodiac|natal|synastry|interaspect|aspect|conjunction|conjunct|trine|square|sextile|quincunx|opposition|orb|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b|\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|\d+(?:st|nd|rd|th)?)\s+house\b|\b\d+(?:\.\d+)?\s*(?:degrees?|°)\b/gi;
const technicalLeadPattern = /^(?:(?:your|her|his|their|the|a|an)\s+)?(?:astrology|astrological|chart|planet|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|ascendant|midheaven|zodiac|natal|synastry|interaspect|aspect|conjunction|conjunct|trine|square|sextile|quincunx|opposition|orb|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/i;
const technicalHousePattern = /\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|\d+(?:st|nd|rd|th)?)\s+house\b/i;
const technicalDegreePattern = /\b\d+(?:\.\d+)?\s*(?:degrees?|°)\b/i;
const technicalOppositePattern = /\b(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|ascendant|midheaven)\s+(?:is\s+)?opposite\b|\bopposite\s+(?:the\s+)?(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|ascendant|midheaven)\b/i;
const inventedHistoryPattern = /\b(?:you learned (?:early|in childhood)|when you (?:first met|fell in love)|throughout your (?:marriage|relationship)|always have|never have|built to last|meant to be|fate|destiny|destined|fated|past lives?|ancient bond|what happened between you|after the breakup|old (?:wounds?|ache|sensitivity|history|defenses?)|unhealed (?:place|wound)|inherited expectations?|unconscious (?:pattern|history))\b/i;
const fabricatedDialoguePattern = /(?:["“][^"”]*(?:\bI\b|\bme\b|\bmy\b)[^"”]*["”])|(?:\*[^*]*(?:\bI\b|\bme\b|\bmy\b)[^*]*\*[,;:]?\s+(?:she|he|they|\w+)\s+(?:thinks?|feels?|says?))/i;
const comparativeVerdictPattern = /\b(?:you|\w+)\s+(?:carry|carries|give|gives|contribute|contributes|sacrifice|sacrifices|cost|costs|earn|earns)\s+(?:more|less|most|least)\b|\bmore (?:invested|important|responsible|burdened) than\b/i;
const containmentBurdenPattern = /\b(?:you|\w+)\s+(?:contain|contains|carry|carries|hold|holds|bear|bears)\s+(?:the other person|their|his|her|your)\s+(?:burden|feelings?|chaos|pain|weight)\b|\bone of you (?:contains|carries|holds|bears) (?:more|the relationship|the bond)\b|\bemotional labor\b/i;
const romanticPattern = /\b(?:romantic|romance|sexual|sexually|erotic|lover|lovers|chemistry|attraction|arousal|kiss|naked|bedroom)\b/i;

export function synastryV3WordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function technicalLeakageMatches(value: string) {
  return [technicalTermPattern, technicalHousePattern, technicalDegreePattern, technicalOppositePattern]
    .filter((pattern) => pattern.test(value))
    .map((pattern) => pattern.source);
}

export function synastryV3TechnicalMetrics(value: string) {
  const terms = [...value.matchAll(technicalTermsPattern)].map((match) => match[0]);
  const words = synastryV3WordCount(value);
  const paragraphs = value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !/^#+\s/.test(paragraph));
  const paragraphTermCounts = paragraphs.map((paragraph) => [...paragraph.matchAll(technicalTermsPattern)].length);
  return {
    terms,
    termsPerThousandWords: Number(((terms.length / Math.max(words, 1)) * 1_000).toFixed(1)),
    heavyParagraphCount: paragraphTermCounts.filter((count) => count >= 3).length,
    astrologyParagraphCount: paragraphTermCounts.filter((count) => count > 0).length,
    leadingParagraphCount: paragraphs.filter((paragraph) => technicalLeadPattern.test(paragraph)).length
  };
}

export function validateSynastryV3(input: {
  portrait: string;
  sections: Array<{ title: string; body: string }>;
  headings: string[];
  trace: SynastryV3TraceRow[];
  evidenceIndex: SynastryV3EvidenceRow[];
  tone: SynastryToneSnapshot;
  readerName: string;
  allyName: string;
  semanticSeverity?: "none" | "minor" | "severe";
  semanticReviewUnavailable?: boolean;
}) {
  const boundaryViolations: string[] = [];
  const fatal = new Set<SynastryV3FatalCategory>();
  const reviewNotes: string[] = [];
  const wordCount = synastryV3WordCount(input.portrait.replace(/^#+\s+.*$/gm, ""));
  const expectedTitles = input.headings.map((value) => value.toLocaleLowerCase());
  const actualTitles = input.sections.map((section) => section.title.toLocaleLowerCase());

  if (input.sections.length !== 6 || expectedTitles.some((title, index) => actualTitles[index] !== title)) {
    fatal.add("format_integrity");
  }
  const technicalMetrics = synastryV3TechnicalMetrics(input.portrait);
  if (technicalMetrics.terms.length > 15 || technicalMetrics.heavyParagraphCount > 3 || technicalMetrics.astrologyParagraphCount > 5 || technicalMetrics.leadingParagraphCount > 0 || /\bS\d{2,}\b/.test(input.portrait)) {
    fatal.add("technical_surface");
  } else if (technicalMetrics.terms.length) {
    reviewNotes.push(`Portrait uses ${technicalMetrics.terms.length} contextual astrology terms across ${technicalMetrics.astrologyParagraphCount} paragraphs without leading with astrology.`);
  }
  if (inventedHistoryPattern.test(input.portrait) || fabricatedDialoguePattern.test(input.portrait)) fatal.add("invented_reality");
  if (comparativeVerdictPattern.test(input.portrait) || containmentBurdenPattern.test(input.portrait)) fatal.add("comparative_verdict");
  if (new RegExp(`\\b${escapeRegExp(input.allyName)}(?:,| is| as) (?:the |your )?${escapeRegExp(input.tone.authoredRelationship)}\\b`, "i").test(input.portrait)) {
    fatal.add("identity_integrity");
  }

  const paragraphRows = input.sections.flatMap((section) => section.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && paragraph !== "---")
    .map((paragraph, index) => ({ chapter: section.title, paragraphIndex: index + 1, paragraph }))
  );
  const observational = new Set(["observational", "symbolic", "ancestral-symbolic"]).has(input.tone.structuralLens);
  const allyFirstName = input.allyName.trim().split(/\s+/)[0] ?? input.allyName;
  const allyReferencePattern = new RegExp(`\\b${escapeRegExp(allyFirstName)}\\b`, "i");
  for (const [index, section] of input.sections.entries()) {
    if (!allyReferencePattern.test(section.body)) fatal.add("perspective_erasure");
    if (!observational && !/\b(?:relationship|connection|bond|between you|what forms between)\b/i.test(section.body)) fatal.add("perspective_erasure");
    if (!/\b(?:you|your|yours)\b/i.test(section.body)) {
      boundaryViolations.push(`Chapter ${index + 1} does not address the selected reader as you.`);
    }
    if (new RegExp(`\\b${escapeRegExp(input.readerName)}\\b`, "i").test(section.body)) {
      boundaryViolations.push(`Chapter ${index + 1} names the selected reader instead of addressing them as you.`);
    }
  }
  const paragraphsWithoutReader = paragraphRows.filter(({ paragraph }) => !/\b(?:you|your|yours)\b/i.test(paragraph)).length;
  if (paragraphsWithoutReader) {
    fatal.add("perspective_erasure");
    reviewNotes.push(`${paragraphsWithoutReader} prose paragraphs do not directly address the selected reader as you or your.`);
  }
  if (input.semanticSeverity === "severe") fatal.add("semantic_fidelity");
  if (input.semanticReviewUnavailable) reviewNotes.push("Semantic support reviewer was unavailable after one reviewer-only retry; deterministic Evidence and boundary validation passed.");

  const evidenceIds = new Set(input.evidenceIndex.map((row) => row.id));
  if (input.trace.length !== paragraphRows.length) boundaryViolations.push("Evidence trace must contain exactly one row for every prose paragraph.");
  for (let index = 0; index < input.trace.length; index += 1) {
    const row = input.trace[index];
    const paragraph = paragraphRows[index];
    if (!row || row.chapter !== paragraph?.chapter || row.paragraphIndex !== paragraph?.paragraphIndex) {
      boundaryViolations.push(`Evidence trace row ${index + 1} does not match its prose paragraph.`);
    }
    if (!row?.evidenceIds.length || row.evidenceIds.length > 4) boundaryViolations.push(`Evidence trace row ${index + 1} must have 1-4 evidence IDs.`);
    if (!row?.mechanism?.trim() || !row?.livedExpression?.trim() || !row?.relationalConsequence?.trim() || !row?.supportedFeeling?.trim()) {
      boundaryViolations.push(`Evidence trace row ${index + 1} is missing its mechanism, lived expression, consequence, or supported feeling.`);
    }
    for (const id of row?.evidenceIds ?? []) if (!evidenceIds.has(id)) boundaryViolations.push(`Evidence trace references unknown ID ${id}.`);
  }
  const finalChapterWords = synastryV3WordCount(input.sections.at(-1)?.body ?? "");
  if (finalChapterWords < 270) reviewNotes.push(`Final relationship-potential synthesis is ${finalChapterWords} words; the tolerated minimum is 270.`);
  const conditionalOpenings = paragraphRows.filter(({ paragraph }) => /^(?:if|when|may|could|perhaps|should)\b/i.test(paragraph)).length;
  if (conditionalOpenings > Math.ceil(paragraphRows.length * 0.35)) {
    reviewNotes.push(`${conditionalOpenings} of ${paragraphRows.length} paragraphs open with a conditional marker; vary the formula.`);
  }
  if (input.tone.romanticLanguage === "prohibit" && romanticPattern.test(input.portrait)) {
    boundaryViolations.push("Romantic or sexual framing is prohibited for this Ally tone.");
  }
  if (input.tone.romanticLanguage === "lead-romantic-sexual") {
    const opening = input.sections[0]?.body.slice(0, 900) ?? "";
    const romanticOpening = /\b(?:romantic|romance|desire|chemistry|lover)\b/i.test(opening);
    const sexualOpening = /\b(?:sexual|sexually|erotic|arousal)\b/i.test(opening);
    if (!romanticOpening || !sexualOpening) {
      reviewNotes.push("Lover opening does not clearly lead with romantic and sexual charge.");
      fatal.add("format_integrity");
    }
  }
  if (wordCount < 1350 || wordCount > 1650) reviewNotes.push(`Portrait is ${wordCount} words; the accepted range is 1,350-1,650.`);
  if (input.evidenceIndex.length !== 15) reviewNotes.push(`The strongest-15 selection policy produced ${input.evidenceIndex.length} unique Evidence rows; it was not padded.`);

  const fatalCategories = [...fatal];
  return {
    wordCount,
    acceptedWordRange: { minimum: 1350 as const, maximum: 1650 as const },
    boundaryViolations: [...new Set(boundaryViolations)],
    fatalCategories,
    reviewNotes,
    technicalMetrics,
    finalChapterWords,
    paragraphCount: paragraphRows.length,
    greenLight: boundaryViolations.length === 0 && fatalCategories.length <= 2
  };
}

export function synastryV3CorrectionMessages(validation: ReturnType<typeof validateSynastryV3>) {
  const messages = [...validation.boundaryViolations];
  for (const category of validation.fatalCategories) {
    if (category === "technical_surface") {
      messages.push("Technical surface: thin the astrology commentary. Keep only occasional direct-aspect references that sharpen the psychology, never lead with astrology, and move the remaining chart support into the private Evidence trace.");
    } else if (category === "perspective_erasure") {
      messages.push("Perspective: address the selected reader as you or your in every prose paragraph; name the Ally by first name in every chapter; give the Ally a balanced possible response and the relationship a consequence in every chapter.");
    } else {
      messages.push(`Fatal category: ${category}`);
    }
  }
  return [...new Set(messages)];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
