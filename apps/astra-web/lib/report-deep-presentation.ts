import type { AstrologyReportRequest } from "@astra/contracts";

type ReportEvidenceByTitle = Record<string, Array<{ label: string; meaning: string }>>;

export type DeepSubtitleFocuses = {
  identity: string;
  emotions: string;
  relationships: string;
  work: string;
  drive: string;
  gifts: string;
  blindSpots: string;
  growth: string;
  integration: string;
};

const focusKeyByTitle = {
  Identity: "identity",
  Emotions: "emotions",
  Relationships: "relationships",
  Work: "work",
  Drive: "drive",
  Gifts: "gifts",
  "Blind Spots": "blindSpots",
  Growth: "growth",
  Integration: "integration"
} as const;

const forbiddenEvidenceTerms = /\b(?:dispositor|rulership|network|graph|provenance|meaning[- ]complex|selected complex|chapter job|configuration)\b/i;
const directAtomicFact = /^(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|ascendant|north node|south node)\s+(?:in\s+[a-z]+|(?:conjunct|conjunction|sextile|square|trine|opposition|quincunx)\s+(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|ascendant|north node|south node))$/i;

/**
 * Presentation-only Deep subtitles. The existing selected evidence remains the
 * authority: this helper never derives a new signal or traverses chart links.
 */
export function deepChapterSubtitles(
  request: AstrologyReportRequest | null,
  evidenceByTitle: ReportEvidenceByTitle,
  focuses: DeepSubtitleFocuses
) {
  if (request?.reportType !== "deep") return {};

  return Object.fromEntries(
    Object.entries(focusKeyByTitle).flatMap(([title, focusKey]) => {
      const fact = firstDirectAtomicFact(evidenceByTitle[title] ?? []);
      return fact ? [[title, `${fact} · ${focuses[focusKey]}`]] : [];
    })
  ) as Record<string, string>;
}

export function firstDirectAtomicFact(evidence: Array<{ label: string; meaning: string }>) {
  for (const item of evidence) {
    const source = `${item.label};${item.meaning}`;
    if (forbiddenEvidenceTerms.test(source)) continue;
    const fact = source.split(";").map((part) => part.trim()).find((part) => directAtomicFact.test(part));
    if (fact) return fact.slice(0, 1).toUpperCase() + fact.slice(1);
  }
  return undefined;
}
