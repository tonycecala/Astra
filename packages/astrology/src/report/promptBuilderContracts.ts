import type { AstrologyReportRequest } from "@astra/contracts";
import {
  atomicWriterFact,
  buildWriterChapterClaimPlan,
  selectedWriterSignals
} from "./writerClaimPlanning";

export type PromptBuilderSignalCard = {
  hypothesis?: string;
};

export type SectionDepthRule = { target: string; minimum: number; maximum: number };

export function interpretiveContractFor(
  cards: readonly PromptBuilderSignalCard[],
  interpretiveContract: readonly string[]
) {
  if (!cards.some((card) => card.hypothesis)) return interpretiveContract;
  return interpretiveContract.map((line) => line === "Build each section from chart factor to human pattern to its relevant tension or cost, then offer one section-specific useful response."
    ? "Build each section from chart factor to human pattern. Use the curated hypothesis, counterweight, and claim boundary when supplied; do not force every chapter through a cost-and-response sequence."
    : line
  );
}

export function plainspokenParagraphRule(
  request: AstrologyReportRequest,
  unit: "section" | "chapter",
  isWelcomeReportRequest: (request: AstrologyReportRequest) => boolean
) {
  if (isWelcomeReportRequest(request)) {
    return "Write the Identity section in exactly 3 short paragraphs. Give each paragraph one coherent move; do not deliver it as one wall of text.";
  }
  return `Write each ${unit} in 2 or 3 paragraphs. Give each paragraph one coherent move; do not deliver it as one wall of text.`;
}

export function familyDepthRules(
  request: AstrologyReportRequest,
  isWelcomeReportRequest: (request: AstrologyReportRequest) => boolean,
  paidReportSectionDepth: Partial<Record<AstrologyReportRequest["reportType"], Record<string, SectionDepthRule>>>
) {
  if (isWelcomeReportRequest(request)) {
    return [
      "Welcome Report depth rules:",
      "- Write 250-350 words total.",
      "- Open with a clear, warm orientation to the reader's central pattern.",
      "- End with one grounded next move."
    ].join("\n");
  }
  if (request.reportType === "deep") {
    return [
      "Deep Report depth rules:",
      "- Identity should be 400-500 words.",
      "- Do not undershoot the Identity minimum; 350 words is a hard floor.",
      "- Emotions, Relationships, and Work should each be 300-425 words.",
      "- Drive, Gifts, Blind Spots, and Growth should each be 275-400 words.",
      "- Integration should be 225-325 words.",
      "- The complete Deep Report should be at least 2,625 words across its nine chapters.",
      "- Identity must feel expanded beyond an Identity Report.",
      "- Include fuller synthesis, chart ruler when relevant, and major identity aspects from the Identity card.",
      "- Give each section its own governing question and section-specific secondary signal.",
      "- Identity must not carry the report alone. The remaining eight sections must sustain premium interpretive depth."
    ].join("\n");
  }
  const rules = paidReportSectionDepth[request.reportType];
  if (!rules) return "Keep the report complete, specific, and readable for the selected report type.";
  const family = request.reportType === "identity" ? "Identity" : request.reportType === "progressed" ? "Progressed" : request.reportType === "synastry" ? "Synastry" : "Core";
  return [
    `${family} Report depth rules:`,
    ...Object.entries(rules).map(([section, depth]) => `- ${section}: target ${depth.target} words; remain between ${depth.minimum} and ${depth.maximum} words.`),
    request.reportType === "core" || request.reportType === "core_self" || request.reportType === "chart_interpretation"
      ? "- Core earns its value through four distinct chapters, not by turning Identity into a second report."
      : ""
  ].filter(Boolean).join("\n");
}

export type DeepThesisSignalCard = {
  title: string;
  capacities: string[];
  risks: string[];
  tensions: string[];
  developmentalTasks: string[];
  hypothesis?: string;
  counterweight?: string;
  claimBoundary?: string;
};

export function buildDeepThesisPrompt(
  request: AstrologyReportRequest,
  cards: readonly DeepThesisSignalCard[],
  dependencies: {
    editorialRoleInstruction: (request: AstrologyReportRequest) => string;
    canonicalIdentityInstruction: (request: AstrologyReportRequest) => string;
  }
) {
  const hasEnrichedSynthesis = cards.some((card) => card.hypothesis);
  return [
    "You are planning one premium astrology report from structured section notes.",
    "Return one private governing thesis. Aim for 35-75 words and never exceed 90 words. Use plain prose with no heading, bullets, JSON, or metadata.",
    "This thesis is an internal writing compass, not customer-facing copy.",
    hasEnrichedSynthesis
      ? "Name a light connective thread without reducing the chapters to one repeated mechanism, reflection-check-action sequence, or practical rule."
      : "Name the central human tension that can organize all nine chapters without reducing them to one repeated lesson.",
    "Plan at least three dimensions: a central identity pattern, a relational or agency pattern, and a stabilizing resource or developmental capacity.",
    "Assign each major aspect one primary chapter and at most one brief secondary reference. A secondary reference must extend, not restate, its primary interpretation.",
    "Deep must add breadth: nourishment, belonging, joy, meaning, creativity, thriving conditions, decision-making, or contribution must receive real space alongside tension.",
    "Do not mention planets, signs, houses, aspects, astrology, chart factors, or timing claims.",
    `Subject: ${request.subjectName}`,
    dependencies.editorialRoleInstruction(request),
    dependencies.canonicalIdentityInstruction(request),
    "Section planning notes:",
    ...cards.map((card) => card.hypothesis
      ? `- ${card.title}: hypothesis ${card.hypothesis}${card.counterweight ? `; counterweight ${card.counterweight}` : ""}${card.claimBoundary ? `; boundary ${card.claimBoundary}` : ""}.`
      : `- ${card.title}: capacities ${card.capacities.join(", ")}; risks ${card.risks.join(", ")}; tension ${card.tensions.join(", ")}; task ${card.developmentalTasks.join(", ")}.`)
  ].join("\n");
}

export type SectionPromptCard = DeepThesisSignalCard & {
  chartSignals: Array<{
    id: string;
    label: string;
    facts: string[];
    priority: number;
    allowedContribution?: string;
    prohibitedInference?: string;
  }>;
  writerSignals?: SectionPromptCard["chartSignals"];
  evidenceBullets: Array<{ label: string; meaning: string }>;
  counterweight?: string;
  claimBoundary?: string;
  chapterQuestion?: string;
  intendedConclusion?: string;
};

function chapterApplication(card: SectionPromptCard) {
  return card.hypothesis?.match(/Chapter application:\s*([^.]*)/i)?.[1]?.trim() || card.title.toLowerCase();
}

function intendedChapterConclusion(card: SectionPromptCard) {
  if (card.intendedConclusion) return card.intendedConclusion;
  const synthesis = card.hypothesis?.split(/\s+Chapter application:/i)[0]?.trim();
  return synthesis || card.tensions[0] || `Develop only the selected ${card.title.toLowerCase()} meaning.`;
}

const conclusionNoiseWords = new Set([
  "a", "an", "and", "as", "at", "be", "by", "describe", "do", "for", "from",
  "how", "in", "into", "is", "it", "may", "not", "of", "on", "only", "or",
  "selected", "the", "this", "to", "without"
]);

function conclusionTokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !conclusionNoiseWords.has(token))
  );
}

function conclusionOverlap(left: string, right: string) {
  const leftTokens = conclusionTokens(left);
  const rightTokens = conclusionTokens(right);
  if (!leftTokens.size || !rightTokens.size) return 0;
  const shared = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return shared / Math.min(leftTokens.size, rightTokens.size);
}

export function assertDistinctChapterConclusions(
  cards: readonly Pick<SectionPromptCard, "title" | "intendedConclusion">[]
) {
  const reserved = cards.filter((card) => card.intendedConclusion);
  for (let leftIndex = 0; leftIndex < reserved.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < reserved.length; rightIndex += 1) {
      const left = reserved[leftIndex]!;
      const right = reserved[rightIndex]!;
      const leftConclusion = left.intendedConclusion!;
      const rightConclusion = right.intendedConclusion!;
      if (
        leftConclusion.trim().toLowerCase() === rightConclusion.trim().toLowerCase() ||
        conclusionOverlap(leftConclusion, rightConclusion) >= 0.72
      ) {
        throw new Error(
          `Semantic Synthesis V2 chapter conclusions overlap: ${left.title} and ${right.title}.`
        );
      }
    }
  }
}

/**
 * Give the prose model a compact authorization packet while retaining the
 * complete evidence graph outside the prompt for deterministic inspection.
 */
export function buildSectionWriterPacket(card: SectionPromptCard) {
  if (!card.hypothesis) {
    return [
      `## ${card.title}`,
      "",
      "Chart signals:",
      ...card.chartSignals.map((signal) => `- ${signal.label}: ${signal.facts.join("; ")}`),
      "",
      `Capacities: ${card.capacities.join("; ") || "none listed"}`,
      `Risks: ${card.risks.join("; ") || "none listed"}`,
      `Tensions: ${card.tensions.join("; ") || "none listed"}`,
      `Developmental tasks: ${card.developmentalTasks.join("; ") || "none listed"}`,
      "",
      "Claim policy: selected section signals only."
    ].join("\n");
  }
  const application = chapterApplication(card);
  const signals = selectedWriterSignals(card);
  const claimBoundary = card.claimBoundary || "Do not infer biography, categorical behavior, events, current timing, skill, or another person's inner state.";
  const counterweight = card.counterweight ||
    "The selected facts do not prove the intended conclusion; uncertainty remains.";
  const claimPlan = card.writerSignals ? buildWriterChapterClaimPlan(card) : null;
  return [
    `## ${card.title}`,
    "",
    `Chapter question: ${card.chapterQuestion ?? `What can the selected facts responsibly show about ${application}?`}`,
    `Intended conclusion: ${intendedChapterConclusion(card)}`,
    "",
    "Atomic selected evidence (use only these 2 or 3 facts):",
    ...signals.flatMap((signal, index) => [
      `- ${claimPlan ? `${claimPlan.atoms[index]!.id} ` : ""}Fact: ${atomicWriterFact(signal)}`,
      `  Allowed contribution: ${claimPlan?.atoms[index]?.boundedMeaning ?? signal.allowedContribution ?? "This selected fact may contribute only to the bounded chapter conclusion; it does not establish a human fact."}`,
      `  Prohibited inference: ${claimPlan?.atoms[index]?.prohibitedInference ?? signal.prohibitedInference ?? claimBoundary}`
    ]),
    "",
    `Counterweight: ${counterweight}`,
    `Prohibited conclusion: ${claimBoundary} Do not introduce another chart fact, infer a relationship among the selected facts, narrate evidence-graph traversal or a rulership chain, or turn the counterweight into proof of an existing skill, habit, accuracy, self-correction, or outcome.`,
    ...(claimPlan
      ? [
          "",
          "Approved paragraph claim plan:",
          ...claimPlan.claims.map((claim) =>
            `- P${claim.paragraph} (${claim.atomIds.join(" + ")}, ${claim.relation}): ${claim.instruction} End this paragraph with exactly ${claim.marker}`
          ),
          "Write exactly these three prose paragraphs in this order. The support markers are internal audit metadata; do not explain them or use any other brackets."
        ]
      : [])
  ].filter(Boolean).join("\n");
}

export type SectionPromptChart = {
  calculationMode: string;
  zodiacMode: string;
  houseSystem: string;
  points: Array<{ body: string; sign: string }>;
};

export type SectionPromptInput = {
  request: AstrologyReportRequest;
  chartSignature: SectionPromptChart;
  card: SectionPromptCard;
  previousErrors: string[];
};

export function buildDeepSectionPrompt(
  input: SectionPromptInput & { thesis: string },
  dependencies: {
    depthForTitle: (title: string) => SectionDepthRule | undefined;
    prosePlanningCards: (cards: readonly SectionPromptCard[]) => readonly SectionPromptCard[];
    cardsForRequest: (request: AstrologyReportRequest) => readonly SectionPromptCard[];
    deepChapterFocusInstruction: (request: AstrologyReportRequest, title: string) => string;
    plainspokenContract: readonly string[];
    plainspokenParagraphRule: (request: AstrologyReportRequest, unit: "chapter") => string;
    interpretiveContractFor: (cards: readonly SectionPromptCard[]) => readonly string[];
    psychologicalSafetyContract: readonly string[];
    voicePlanForSection: (title: string) => string;
    enrichedSynthesisVoicePlan: (cards: readonly SectionPromptCard[]) => string;
    enrichedChapterOwnershipInstruction: (title: string, cards: readonly SectionPromptCard[]) => string;
    enrichedProseBoundaryInstruction: (request: AstrologyReportRequest, title: string, cards: readonly SectionPromptCard[]) => string;
    reportEvidenceOwnershipPlan: (cards: readonly SectionPromptCard[]) => string;
    evidenceContract: readonly string[];
    sectionSignalCardBlock: (card: SectionPromptCard) => string;
  }
) {
  const { request, chartSignature, card, thesis, previousErrors } = input;
  const depth = dependencies.depthForTitle(card.title);
  const sunPlacement = chartSignature.points.find((point) => point.body === "Sun");
  const reportCards = dependencies.prosePlanningCards(dependencies.cardsForRequest(request));
  return [
    "You are writing one chapter of a premium Astra Deep Report from structured notes.",
    "Write only this chapter's body as plain Markdown. Astra supplies the chapter heading. Do not write any heading, other chapter, report title, evidence block, metadata, JSON, or planning commentary.",
    `Chapter: ${card.title}.`,
    `Target length: ${depth?.target ?? "275-400"} words. Hard minimum: ${depth?.minimum ?? 275}. Hard maximum: ${depth?.maximum ?? 435}.`,
    `Subject: ${request.subjectName}`,
    chartSignature.calculationMode === "signs-aspects-only" ? `Zodiac: ${chartSignature.zodiacMode}. Chart detail: signs and aspects only; do not mention houses, Rising, Ascendant, Midheaven, or angles.` : `Zodiac: ${chartSignature.zodiacMode}. Houses: ${chartSignature.houseSystem}.`,
    card.hypothesis
      ? `Chapter-specific conclusion: ${card.intendedConclusion ?? intendedChapterConclusion(card)}`
      : `Private governing thesis: ${thesis}`,
    card.hypothesis
      ? "Use only the current chapter authorization packet. Do not recover the broader technical hypothesis or import another chapter's conclusion."
      : "Use the thesis as a quiet through-line, not as a sentence to repeat.",
    card.hypothesis ? "Give this chapter its own consequence or condition; do not force it into a move, fix, risk, or task conclusion." : `This chapter must answer, rather than quote or announce, this distinct governing question: ${card.tensions.join("; ")}.`,
    dependencies.deepChapterFocusInstruction(request, card.title), ...dependencies.plainspokenContract, dependencies.plainspokenParagraphRule(request, "chapter"), ...dependencies.interpretiveContractFor([card]), ...dependencies.psychologicalSafetyContract,
    `Chapter voice plan: ${dependencies.voicePlanForSection(card.title)}`,
    dependencies.enrichedSynthesisVoicePlan(reportCards), dependencies.enrichedChapterOwnershipInstruction(card.title, reportCards), dependencies.enrichedProseBoundaryInstruction(request, card.title, reportCards), dependencies.reportEvidenceOwnershipPlan([card]), ...dependencies.evidenceContract,
    "Use at least two selected signals when available, including a section-specific secondary signal.", "Do not generalize this chapter into the whole report and do not repeat a generic warning or practice from another life domain.", "Do not invent transits, progressions, current activation, or seasonal timing.",
    card.title === "Identity" && sunPlacement ? `The first three sentences must include "${sunPlacement.sign} Sun" or "Sun in ${sunPlacement.sign}"${chartSignature.calculationMode === "signs-aspects-only" ? "." : " and integrate its house context."}` : "",
    card.title === "Integration" ? "Synthesize enduring natal patterns into two or three cross-domain operating principles. This is not a second Growth chapter and not a forecast, and must not claim that anything is newly or currently activated." : "",
    "Section signal card:", dependencies.sectionSignalCardBlock(card), previousErrors.length ? "The previous version of this chapter failed. Rewrite only this chapter and correct every issue:" : "", ...previousErrors.map((error) => `- ${error}`)
  ].filter(Boolean).join("\n");
}

export function buildEnrichedCoreSectionPrompt(
  input: SectionPromptInput,
  dependencies: Omit<Parameters<typeof buildDeepSectionPrompt>[1], "depthForTitle" | "prosePlanningCards" | "cardsForRequest"> & {
    depthForTitle: (title: string) => SectionDepthRule;
    canonicalIdentityBridgeInstruction: (request: AstrologyReportRequest) => string;
  }
) {
  const { request, chartSignature, card, previousErrors } = input;
  const depth = dependencies.depthForTitle(card.title);
  return [
    "You are writing one chapter of an Astra Core Report from a single structured section card.", "Write only this chapter's body as plain Markdown. Astra supplies the heading. Do not write any heading, other chapter, report title, evidence block, metadata, JSON, or planning commentary.", `Chapter: ${card.title}.`, `Target length: ${depth.target} words. Hard minimum: ${depth.minimum}. Hard maximum: ${depth.maximum}.`, `Subject: ${request.subjectName}`,
    chartSignature.calculationMode === "signs-aspects-only" ? `Zodiac: ${chartSignature.zodiacMode}. Chart detail: signs and aspects only; do not mention houses, Rising, Ascendant, Midheaven, or angles.` : `Zodiac: ${chartSignature.zodiacMode}. Houses: ${chartSignature.houseSystem}.`,
    `Chapter-specific conclusion: ${card.intendedConclusion ?? intendedChapterConclusion(card)}`, "Use only the current chapter authorization packet. Do not recover the broader technical hypothesis or import another chapter's mechanism, rule, or conclusion.", dependencies.canonicalIdentityBridgeInstruction(request), dependencies.deepChapterFocusInstruction(request, card.title), ...dependencies.plainspokenContract, dependencies.plainspokenParagraphRule(request, "chapter"), ...dependencies.interpretiveContractFor([card]), ...dependencies.psychologicalSafetyContract,
    `Chapter voice plan: ${dependencies.voicePlanForSection(card.title)}`, dependencies.enrichedSynthesisVoicePlan([card]), dependencies.enrichedChapterOwnershipInstruction(card.title, [card]), dependencies.enrichedProseBoundaryInstruction(request, card.title, [card]), dependencies.reportEvidenceOwnershipPlan([card]), ...dependencies.evidenceContract, "Use at least two selected signals when available, including a section-specific secondary signal.", "Do not invent transits, progressions, current activation, seasonal timing, biography, or another person's inner state.", card.title === "Integration" ? "Integration editorial job: state values and decision criteria across domains. Do not re-teach Identity or repeat Work's allocation rule." : "", "Section signal card:", dependencies.sectionSignalCardBlock(card), previousErrors.length ? "The previous version of this chapter failed. Rewrite only this chapter and correct every issue:" : "", ...previousErrors.map((error) => `- ${error}`)
  ].filter(Boolean).join("\n");
}

type DebugPromptBasis = { type: string; asOfDate?: string; partner?: { subjectName: string }; primary: { subjectName: string } };

export function buildDebugModelPrompt(
  request: AstrologyReportRequest,
  chartSignature: SectionPromptChart,
  previousErrors: string[],
  dependencies: {
    basisFor: (request: AstrologyReportRequest) => DebugPromptBasis;
    headingsFor: (request: AstrologyReportRequest) => string[];
    writerHeadingsFor: (request: AstrologyReportRequest) => string[];
    cardsForRequest: (request: AstrologyReportRequest, headings: readonly string[]) => SectionPromptCard[];
    familyDepthRules: (request: AstrologyReportRequest) => string;
    canonicalIdentityFromRequest: (request: AstrologyReportRequest) => string;
    plainspokenContract: readonly string[];
    plainspokenParagraphRule: (request: AstrologyReportRequest, unit: "section") => string;
    interpretiveContractFor: (cards: readonly SectionPromptCard[]) => readonly string[];
    psychologicalSafetyContract: readonly string[];
    reportVoicePlan: (headings: readonly string[]) => string;
    enrichedSynthesisVoicePlan: (cards: readonly SectionPromptCard[]) => string;
    reportEvidenceOwnershipPlan: (cards: readonly SectionPromptCard[]) => string;
    evidenceContract: readonly string[];
    editorialRoleInstruction: (request: AstrologyReportRequest) => string;
    canonicalIdentityInstruction: (request: AstrologyReportRequest) => string;
    relationshipContextInstruction: (request: AstrologyReportRequest) => string;
    sectionSignalCardBlock: (card: SectionPromptCard) => string;
  }
) {
  const basis = dependencies.basisFor(request);
  const headings = dependencies.headingsFor(request);
  const writerHeadings = dependencies.writerHeadingsFor(request);
  const sectionCards = dependencies.cardsForRequest(request, headings);
  const hasEnrichedSynthesis = sectionCards.some((card) => card.hypothesis);
  const requiredHeadings = writerHeadings.map((heading) => `## ${heading}`).join("\n");
  const sunPlacement = chartSignature.points.find((point) => point.body === "Sun");
  return [
    "You are writing an astrology reading from structured notes.", "The notes are not prose.", "Use the notes the way a human writer uses notes: understand them, synthesize them, then write fresh second-person prose.",
    hasEnrichedSynthesis ? "Use the supplied chapter hypotheses as the report plan. Do not invent a second governing thesis or make every chapter a variation of one lesson." : "Before writing, infer one report-level governing thesis from the repeated signals, strongest placements, tensions, and developmental tasks.",
    hasEnrichedSynthesis ? "Keep the chapters coherent through their distinct roles, not through a repeated sequence or conclusion." : "Do not print that thesis as a separate heading. Let it quietly organize every section.",
    basis.type === "progressed" ? `This is a secondary progressed report as of ${basis.asOfDate}. Interpret progressed placements and progressed-to-natal contacts, not generic natal traits.` : basis.type === "synastry" ? `This is a two-chart synastry report${basis.partner ? ` comparing ${basis.primary.subjectName} with ${basis.partner.subjectName}` : ""}. Interpret cross-chart contacts, not either person as a standalone natal profile.` : "This is a natal person report.",
    "Do not repeat note labels as public labels.", "Do not say capacity, risk, developmental task, language domain, primary strain, or priority note in public prose.", chartSignature.calculationMode === "signs-aspects-only" ? "This is a signs-and-aspects-only chart. Do not mention houses, Rising, Ascendant, Midheaven, angles, or house-system effects." : "Treat Zodiac and Houses as calculation inputs: the prose must reflect the resulting signs, house placements, and evidence, not merely name the selected settings.", "Do not write JSON.", "Write plain Markdown only.", "", `Write the generated chapters of a plain Markdown Astra report for ${request.subjectName}.`, `Selected report depth: ${request.reportType}.`, dependencies.familyDepthRules(request), "", "Required structure:", `# Astra Report - ${request.subjectName}`, requiredHeadings, "", "Use the required headings exactly as written.", dependencies.canonicalIdentityFromRequest(request) ? "Do not write Identity. The application inserts the canonical Identity section after generation." : "", 'If Integration is selected, the heading must be exactly "## Integration"; do not rename it Right Now, Timing, or Current Chapter.', "", "Write only the prose body for each selected section.", "Do not write Chart Evidence.", "Do not write evidence bullets.", "Do not write metadata.", "Do not write debug text.", "The application will render Chart Evidence deterministically after you return the prose.", sunPlacement ? `For this chart, the required Sun opening phrase is either "${sunPlacement.sign} Sun" or "Sun in ${sunPlacement.sign}". Use one of those exact phrases in the first or second sentence of Identity.` : "", "", "Astra Voice Contract:", ...dependencies.plainspokenContract, dependencies.plainspokenParagraphRule(request, "section"), ...dependencies.interpretiveContractFor(sectionCards), ...dependencies.psychologicalSafetyContract, dependencies.reportVoicePlan(headings), dependencies.enrichedSynthesisVoicePlan(sectionCards), dependencies.reportEvidenceOwnershipPlan(sectionCards), '- Avoid generic phrases such as "you are a natural communicator," "this aspect gifts you," "you may struggle," or "this placement indicates" unless rewritten into more specific language.', "Speak directly to the reader using you and your. Never describe the report subject as a case or third-person label.", "Keep second-person grammar clean: write you want, you understand, you adapt, and you believe; never write you wants, you understands, you adapts, or you believes.", "", ...dependencies.evidenceContract,
    hasEnrichedSynthesis ? "Make the sections feel like chapters of one chart by giving each its own consequence. Do not re-teach Identity's private reflection in Work or Integration." : "Make the sections feel like chapters of one chart, not isolated mini-readings. Each section should deepen or complicate the governing thesis.", writerHeadings.includes("Identity") ? "Identity opening rule: begin Identity from the Sun placement unless the Identity card has no Sun signal. The first or second sentence must include the exact phrase '[Sign] Sun' or 'Sun in [Sign]' using the Sun sign from the Identity card. Include Sun house or house-system nuance when present, then integrate Mercury/Sun relationship, chart ruler or Ascendant, and dominant identity aspects or themes. Do not make the Sun generic or treat it as standalone Sun-sign astrology." : "", basis.type === "natal" ? "Integration must synthesize enduring natal patterns into a practical way of working with the chart. It is not a forecast and must not claim a transit, progression, season, or unusual current activation." : "Use timing language only from the supplied dated evidence.", basis.type === "natal" ? "Across every natal section, avoid forecast language such as this season, current activation, currently active, or unusually active. Present-day practical language is welcome; invented celestial timing is not." : "", dependencies.editorialRoleInstruction(request), dependencies.canonicalIdentityInstruction(request), headings.join("\n").includes("Relationships") || basis.type === "synastry" ? dependencies.relationshipContextInstruction(request) : "", "Do not include Generation Metadata. The application appends it after validation.", previousErrors.length ? "The previous draft failed validation. Rewrite the full report and avoid these errors:" : "", ...previousErrors.map((error) => `- ${error}`), "", "Report context:", `- Subject: ${request.subjectName}`, `- Report type: ${request.reportType}`, `- Report basis: ${basis.type}`, basis.asOfDate ? `- As of: ${basis.asOfDate}` : "", request.question ? `- User query: ${request.question}` : "", request.intent ? `- Intent: ${request.intent}` : "", chartSignature.calculationMode === "signs-aspects-only" ? "- Chart detail: signs and aspects only; houses and Rising omitted" : `- House system: ${chartSignature.houseSystem}`, `- Zodiac: ${chartSignature.zodiacMode}`, "", "Section signal cards:", sectionCards.map(dependencies.sectionSignalCardBlock).join("\n\n---\n\n"), "", "Do not copy these notes as prose. Use them the way a human writer uses notes: synthesize, choose the strongest pattern, and write fresh second-person report prose."
  ].join("\n");
}
