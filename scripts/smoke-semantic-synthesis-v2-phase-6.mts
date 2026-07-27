import assert from "node:assert/strict";

import {
  DEEP_CHAPTER_ORDER,
  FUNCTIONAL_HEADINGS,
  buildPhase6Variants,
  parseDeepMarkdown,
  renderPhase6Preview,
  type Phase6Evidence
} from "./lib/semantic-synthesis-v2-phase-6";

const markdown = [
  "# Subject — Deep",
  ...DEEP_CHAPTER_ORDER.map((title) => `\n## ${title}\n\nOriginal ${title} prose.`)
].join("\n");
const primary: Record<string, string> = {
  Identity: "sun",
  Emotions: "moon",
  Relationships: "moon",
  Work: "mars",
  Drive: "sun",
  Gifts: "venus",
  "Blind Spots": "neptune",
  Growth: "saturn",
  Integration: "phase"
};
const scores: Record<string, number> = {
  sun: 0.59,
  moon: 0.58,
  mars: 0.57,
  venus: 0.65,
  neptune: 0.53,
  saturn: 0.51,
  phase: 0.27
};
const labels: Record<string, string> = {
  Identity: "Sun in Scorpio",
  Emotions: "Moon in Capricorn",
  Relationships: "Moon sextile Mercury",
  Work: "Mars in Libra",
  Drive: "Sun sextile Neptune",
  Gifts: "Venus in Sagittarius",
  "Blind Spots": "Neptune in Capricorn",
  Growth: "Saturn in Capricorn",
  Integration: "Moon sextile Sun"
};
const evidence: Phase6Evidence = {
  family: "deep",
  chapters: DEEP_CHAPTER_ORDER.map((title) => ({
    title,
    primaryComplexId: primary[title]!
  })),
  chapterEvidence: DEEP_CHAPTER_ORDER.map((title) => ({
    title,
    evidenceBullets: [{ label: labels[title]!, meaning: labels[title]! }]
  })),
  selectedComplexes: Object.entries(scores).map(([id, total]) => ({ id, score: { total } }))
};

const parsed = parseDeepMarkdown(markdown);
assert.equal(parsed.sections[0]!.body, "Original Identity prose.");
const variants = buildPhase6Variants(parsed.sections, evidence);
assert.equal(variants.length, 4);
assert.deepEqual(variants[0]!.sections.map((section) => section.title), DEEP_CHAPTER_ORDER);
assert.deepEqual(variants[0]!.sections.map((section) => section.body), parsed.sections.map((section) => section.body));
assert.equal(variants[1]!.sections[0]!.displayHeading, FUNCTIONAL_HEADINGS.Identity);
assert.equal(variants[2]!.metrics.subtitleCoverage, 9);
assert.equal(variants[2]!.metrics.prohibitedSubtitleTermCount, 0);
assert.equal(variants[2]!.sections.find((section) => section.title === "Work")!.subtitle,
  "Mars in Libra · contribution and useful effort");
assert.deepEqual(
  variants[3]!.sections.map((section) => section.title),
  ["Identity", "Gifts", "Drive", "Emotions", "Relationships", "Work", "Blind Spots", "Growth", "Integration"]
);
assert.equal(variants[3]!.metrics.identityFirst, true);
assert.equal(variants[3]!.metrics.integrationLast, true);
assert.ok(variants[3]!.metrics.movedChapterCount > 0);
assert.match(renderPhase6Preview(parsed.documentTitle, variants),
  /class="variant" id="current-fixed-subtitles"/);

const graphOnly = buildPhase6Variants(parsed.sections, {
  ...evidence,
  chapterEvidence: evidence.chapterEvidence.map((chapter) => chapter.title === "Growth"
    ? {
      ...chapter,
      evidenceBullets: [{ label: "dispositor graph", meaning: "rulership provenance" }]
    }
    : chapter)
});
assert.equal(
  graphOnly[2]!.sections.find((section) => section.title === "Growth")!.subtitle,
  undefined
);
assert.equal(graphOnly[2]!.metrics.prohibitedSubtitleTermCount, 0);

assert.throws(() => parseDeepMarkdown(markdown.replace("## Drive", "## Motivation")),
  /Expected canonical Deep sections/);

console.log("Semantic Synthesis V2 Phase 6 deterministic presentation gates passed.");
