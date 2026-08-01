import { synastryToneSnapshot, synastryV3CorrectionMessages, synastryV3Headings, synastryV3TechnicalMetrics, technicalLeakageMatches, validateSynastryV3 } from "@astra/astrology";

const allyName = "Cheyenne";
const readerName = "Tony";
const tone = synastryToneSnapshot({ relationship: "Lover" });
const headings = synastryV3Headings(tone, allyName);
const evidenceIndex = [{ id: "S01", label: "private technical label", meaning: "mutual emotional recognition", evidenceJobs: ["Attraction"] }];
const trace = headings.map((chapter) => ({
  chapter,
  paragraphIndex: 1,
  evidenceIds: ["S01"],
  mechanism: "Recognition creates interpersonal legibility.",
  livedExpression: "If active, each person may feel understood.",
  relationalConsequence: "The potential can open closeness or complicate pacing.",
  supportedFeeling: "mutual recognition"
}));

function portraitWith(wordTarget: number, additions = "") {
  const bodies = headings.map((title, index) => {
    const required = `${index === 0 ? "Romantic sexual desire feels immediate. " : ""}Cheyenne remains distinct, and the relationship between you develops its own pressure. ${additions}`.trim().split(/\s+/);
    return { title, words: required };
  });
  let remaining = wordTarget - bodies.reduce((sum, body) => sum + body.words.length, 0);
  for (let index = 0; remaining > 0; index = (index + 1) % bodies.length, remaining -= 1) bodies[index]!.words.push("feeling");
  const sections = bodies.map((body) => ({ title: body.title, body: body.words.join(" ") }));
  const portrait = sections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
  return { portrait, sections };
}

function appendToChapters(sample: ReturnType<typeof portraitWith>, additions: string[]) {
  const sections = sample.sections.map((section, index) => ({
    ...section,
    body: `${section.body} ${additions[index] ?? ""}`.trim()
  }));
  return {
    sections,
    portrait: sections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n")
  };
}

for (const boundary of [1350, 1650]) {
  const sample = portraitWith(boundary);
  const result = validateSynastryV3({ ...sample, headings, trace, evidenceIndex, tone, readerName, allyName });
  if (result.wordCount !== boundary || result.reviewNotes.some((note) => note.includes("accepted range"))) {
    throw new Error(`${boundary} words must be inside the accepted numeric range.`);
  }
}
const short = portraitWith(1349);
if (!validateSynastryV3({ ...short, headings, trace, evidenceIndex, tone, readerName, allyName }).reviewNotes.some((note) => note.includes("accepted range"))) {
  throw new Error("An out-of-band word count must produce a review note.");
}

const contextualAstrology = appendToChapters(portraitWith(1498), ["Venus.", "Mars."]);
const contextualResult = validateSynastryV3({ ...contextualAstrology, headings, trace, evidenceIndex, tone, readerName, allyName });
if (contextualResult.fatalCategories.includes("technical_surface") || !contextualResult.reviewNotes.some((note) => note.includes("contextual astrology"))) {
  throw new Error("Occasional astrology must remain a review note while psychology leads.");
}
const contextualMetrics = synastryV3TechnicalMetrics(contextualAstrology.portrait);
if (contextualMetrics.terms.length !== 2 || contextualMetrics.astrologyParagraphCount !== 2 || contextualMetrics.leadingParagraphCount !== 0) {
  throw new Error("Contextual astrology metrics did not preserve the two-paragraph, psychology-first allowance.");
}
const denseAstrology = appendToChapters(portraitWith(1482), ["Venus trine Uranus.", "Mars trine Saturn.", "Moon opposite Sun.", "Mercury trine Jupiter.", "Pluto sextile Venus.", "Saturn trine Sun."]);
const denseAstrologyResult = validateSynastryV3({ ...denseAstrology, headings, trace, evidenceIndex, tone, readerName, allyName });
if (!denseAstrologyResult.fatalCategories.includes("technical_surface")) throw new Error("Astrology recurring across more than five paragraphs must trigger technical-surface review.");
const astrologyLed = appendToChapters(portraitWith(1499), [""]);
astrologyLed.sections[0]!.body = `Venus ${astrologyLed.sections[0]!.body}`;
astrologyLed.portrait = astrologyLed.sections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
if (!validateSynastryV3({ ...astrologyLed, headings, trace, evidenceIndex, tone, readerName, allyName }).fatalCategories.includes("technical_surface")) {
  throw new Error("A paragraph led by astrology must trigger technical-surface review.");
}
const twoCategory = portraitWith(1500, "Venus Mars Saturn Uranus Neptune Pluto Sun Moon Mercury Jupiter Chiron Aries Taurus Gemini Cancer Leo. You carry more.");
const twoResult = validateSynastryV3({ ...twoCategory, headings, trace, evidenceIndex, tone, readerName, allyName });
if (!twoResult.greenLight || twoResult.fatalCategories.length !== 2) throw new Error("Two editorial fatal categories must remain green.");
const correctionMessages = synastryV3CorrectionMessages(twoResult).join(" ");
if (!correctionMessages.includes("occasional direct-aspect references") || correctionMessages.includes("no more than four terms total")) {
  throw new Error("A corrective retry must request psychology-first thinning without imposing a prose quota.");
}
const threeCategory = portraitWith(1500, "Venus Mars Saturn Uranus Neptune Pluto Sun Moon Mercury Jupiter Chiron Aries Taurus Gemini Cancer Leo. You carry more. You learned early.");
if (validateSynastryV3({ ...threeCategory, headings, trace, evidenceIndex, tone, readerName, allyName }).greenLight) {
  throw new Error("Three editorial fatal categories must be rejected.");
}
const invalidTrace = trace.map((row) => ({ ...row }));
invalidTrace[0]!.evidenceIds = ["S99"];
if (validateSynastryV3({ ...portraitWith(1500), headings, trace: invalidTrace, evidenceIndex, tone, readerName, allyName }).greenLight) {
  throw new Error("Unknown Evidence IDs are a hard boundary failure.");
}
const italicSpeech = portraitWith(1500, "*I need you*, Cheyenne thinks.");
if (!validateSynastryV3({ ...italicSpeech, headings, trace, evidenceIndex, tone, readerName, allyName }).fatalCategories.includes("invented_reality")) {
  throw new Error("Attributed italic first-person speech must count as fabricated dialogue.");
}
if (technicalLeakageMatches("Pressure grows in the house by degrees, while the opposite fear appears.").length) {
  throw new Error("Ordinary house, degrees, and opposite language must not leak-match without technical context.");
}
if (technicalLeakageMatches("The seventh house sits at 12 degrees, opposite Venus.").length < 3) {
  throw new Error("Technical house, degree, and opposite language must be detected contextually.");
}

const childTone = synastryToneSnapshot({ relationship: "Child" });
const childHeadings = synastryV3Headings(childTone, allyName);
const childSections = childHeadings.map((title) => ({
  title,
  body: "Romantic chemistry appears. Cheyenne remains distinct, and the family bond between you develops its own pressure. " + Array.from({ length: 230 }, () => "feeling").join(" ")
}));
const childPortrait = childSections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
const childTrace = childHeadings.map((chapter) => ({
  chapter,
  paragraphIndex: 1,
  evidenceIds: ["S01"],
  mechanism: "Recognition creates family awareness.",
  livedExpression: "If active, each person may feel understood.",
  relationalConsequence: "The potential can open trust or complicate autonomy.",
  supportedFeeling: "family recognition"
}));
const childResult = validateSynastryV3({ portrait: childPortrait, sections: childSections, headings: childHeadings, trace: childTrace, evidenceIndex, tone: childTone, readerName, allyName });
if (childResult.greenLight || !childResult.boundaryViolations.some((message) => message.includes("prohibited"))) {
  throw new Error("Child and every prohibit lens must reject romantic framing as a hard boundary.");
}
const childAutonomySections = childSections.map((section) => ({ ...section, body: section.body.replace("Romantic chemistry appears.", "A desire for autonomy appears.") }));
const childAutonomyPortrait = childAutonomySections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
if (validateSynastryV3({ portrait: childAutonomyPortrait, sections: childAutonomySections, headings: childHeadings, trace: childTrace, evidenceIndex, tone: childTone, readerName, allyName }).boundaryViolations.length) {
  throw new Error("A child's ordinary desire for autonomy must not be misclassified as romantic language.");
}
const burden = portraitWith(1500, "You carry her burden and fate joins you.");
const burdenResult = validateSynastryV3({ ...burden, headings, trace, evidenceIndex, tone, readerName, allyName });
if (!burdenResult.fatalCategories.includes("comparative_verdict") || !burdenResult.fatalCategories.includes("invented_reality")) {
  throw new Error("Containment, burden assignment, and fate must remain strict editorial violations.");
}

const wrongReaderSections = portraitWith(1500).sections.map((section) => ({ ...section, body: section.body.replace("Cheyenne remains", "Tony watches while Cheyenne remains") }));
const wrongReaderPortrait = wrongReaderSections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
const wrongReader = validateSynastryV3({ portrait: wrongReaderPortrait, sections: wrongReaderSections, headings, trace, evidenceIndex, tone, readerName, allyName });
if (wrongReader.greenLight || !wrongReader.boundaryViolations.some((message) => message.includes("selected reader"))) {
  throw new Error("Naming the selected reader in third person must fail the instruction boundary even under the fluid fatal-error policy.");
}

const shortNamePerspective = validateSynastryV3({ ...portraitWith(1500), headings, trace, evidenceIndex, tone, readerName, allyName: "Cheyenne Autumn" });
if (shortNamePerspective.fatalCategories.includes("perspective_erasure")) {
  throw new Error("Using an Ally's first name in every chapter must satisfy the named-perspective check.");
}

console.log("Synastry V3.1 validation smoke passed for numeric, fatal-budget, paragraph trace, dialogue, and contextual astrology rules.");
