import assert from "node:assert/strict";

import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROFILE_ENV,
  ASTRA_REPORT_WRITER_ENV,
  ASTRA_SEMANTIC_SYNTHESIS_VERSION,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  ASTRA_OPENROUTER_APP_NAME,
  ASTRA_OPENROUTER_SITE_URL,
  buildAstrologyReportResultAsync,
  buildAstrologyReportSectionEvidence,
  measureReportReadability
} from "@astra/astrology";
import { astrologyReportRequestSchema } from "@astra/contracts";
import { planWriterFact } from "../packages/astrology/src/report/evidencePlanning";
import { assertDistinctChapterConclusions } from "../packages/astrology/src/report/promptBuilderContracts";
import {
  auditWriterClaimMarkers,
  buildWriterChapterClaimPlan
} from "../packages/astrology/src/report/writerClaimPlanning";

assert.equal(ASTRA_SEMANTIC_SYNTHESIS_VERSION, "2.0.0-phase-4");

const headings = ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Integration"];
const request = astrologyReportRequestSchema.parse({
  id: "51111111-1111-4111-8111-111111111111",
  userId: "52222222-2222-4222-8222-222222222222",
  chartRequestId: "53333333-3333-4333-8333-333333333333",
  reportType: "deep",
  subjectName: "Deep Quality Fixture",
  birthData: { date: "1961-05-23", time: "09:30", birthTimeKnown: true, timezone: "America/Chicago", location: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 },
  question: "What relationship pattern would be useful to understand?",
  intent: "relationship-context quality fixture",
  context: {
    relationshipContext: {
      status: "separated",
      condition: "unspecified",
      structure: "unspecified",
      intention: "unspecified",
      recency: "unspecified",
      partnerPronouns: null,
      notes: null
    }
  },
  source: "self",
  status: "queued",
  costCredits: 10,
  reportBasis: {
    schemaVersion: 1,
    type: "natal",
    chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
    primary: {
      chartRequestId: "53333333-3333-4333-8333-333333333333",
      subjectType: "self",
      subjectId: "52222222-2222-4222-8222-222222222222",
      subjectName: "Deep Quality Fixture",
      birthData: { date: "1961-05-23", time: "09:30", birthTimeKnown: true, timezone: "America/Chicago", location: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 }
    }
  },
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z"
});

const env = {
  [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
  [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
  [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
  ASTRA_OPENROUTER_API_KEY: "test-key"
};

function prose(title: string, words: number, timingFailure = false, openingOverride?: string) {
  const opening = openingOverride ?? (title === "Identity"
    ? "Your Gemini Sun gives the identity chapter a clear center."
    : title === "Integration" && timingFailure
      ? "This natal pattern is currently active and defines this season."
      : `${title} asks a distinct human question and offers a grounded present choice.`);
  const sentence = "This chapter develops its own psychological tension, practical consequence, useful recognition, and concrete next move without repeating another chapter's lesson.";
  const parts = [opening];
  while (parts.join(" ").split(/\s+/).length < words) parts.push(sentence);
  return parts.join(" ");
}

function sectionTitleFromPrompt(prompt: string) {
  return prompt.match(/Chapter: (.+?)\./)?.[1]?.trim();
}

function sectionWordTarget(title: string) {
  if (title === "Identity") return 400;
  if (title === "Integration") return 240;
  return 310;
}

function applyWriterClaimMarkers(content: string, prompt: string) {
  const markers = [...prompt.matchAll(/End this paragraph with exactly (\[\[[^\n]+\]\])/g)]
    .map((match) => match[1]!);
  if (!markers.length) return content;
  assert.equal(markers.length, 3, "Writer claim-plan prompts must define exactly three paragraph markers.");
  const sentences = content.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [content];
  const paragraphs = markers.map((marker, index) => {
    const start = Math.floor((sentences.length * index) / markers.length);
    const end = Math.floor((sentences.length * (index + 1)) / markers.length);
    return `${sentences.slice(start, Math.max(start + 1, end)).join(" ")} ${marker}`;
  });
  return paragraphs.join("\n\n");
}

function sectionedProvider(options: { retryEmotions?: boolean; retryWorkTransport?: boolean; timingFailure?: boolean; thirdPersonFailure?: boolean; unsafeRelationshipFirst?: boolean; invalidFirst?: Partial<Record<string, string>>; usefulLongThesis?: boolean; identityThirdSentence?: boolean } = {}) {
  const calls = new Map<string, number>();
  const prompts = new Map<string, string[]>();
  const requestBodies: Array<Record<string, unknown>> = [];
  const requestHeaders: Headers[] = [];
  let active = 0;
  let maxActive = 0;
  const fetchImpl = async (_url: string | URL | Request, init?: RequestInit) => {
    requestHeaders.push(new Headers(init?.headers));
    const body = JSON.parse(String(init?.body)) as { messages?: Array<{ content?: string }> } & Record<string, unknown>;
    requestBodies.push(body);
    const prompt = body.messages?.map((message) => message.content ?? "").join("\n") ?? "";
    const title = sectionTitleFromPrompt(prompt) ?? "Thesis";
    const count = (calls.get(title) ?? 0) + 1;
    calls.set(title, count);
    prompts.set(title, [...(prompts.get(title) ?? []), prompt]);
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    const words = title === "Emotions" && options.retryEmotions && count === 1 ? 120 : sectionWordTarget(title);
    const openingOverride = options.invalidFirst?.[title] && count === 1
      ? options.invalidFirst[title]
      : title === "Identity" && options.identityThirdSentence
      ? "You already know yourself pretty well. That is not the hard part. Your Gemini Sun gives the identity chapter a clear center."
      : title === "Relationships"
      ? options.unsafeRelationshipFirst && count === 1
        ? "You should confront them and say what you need before the relationship gets worse."
        : options.thirdPersonFailure && count === 1
        ? "This person tends to hide what matters until distance does the speaking."
        : "The person you choose matters, but so does what you are willing to say plainly."
      : undefined;
    const uncitedContent = title === "Thesis"
      ? options.usefulLongThesis
        ? "Her chapters orbit a single unresolved question: what she trusts more, the self that forms in contact with others' recognition or the self that persists when no one is watching. Each domain tests whether her responsiveness to signal, emotional, relational, or professional, is discernment or dilution, and whether her strengths, instincts, and ambitions remain hers once proven, or dissolve into whatever the moment rewards. The work is not choosing autonomy over connection but learning to stay legible to herself while taking in what the world demands."
        : "A private intelligence seeks public usefulness without sacrificing discernment, while courage and imagination repeatedly test whether desire can become disciplined action. The report should show how sensitivity, range, and visible initiative become trustworthy when they are given structure, proportion, honest relationship, and practical form."
      : prose(title, words, options.timingFailure && title === "Integration", openingOverride);
    const content = title === "Thesis"
      ? uncitedContent
      : applyWriterClaimMarkers(uncitedContent, prompt);
    const choices = title === "Work" && options.retryWorkTransport && count === 1 ? [] : [{ finish_reason: "stop", message: { content } }];
    return new Response(JSON.stringify({ choices, usage: { prompt_tokens: 1, completion_tokens: 1, completion_tokens_details: { reasoning_tokens: 0 }, total_tokens: 2, cost: 0 } }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  return { fetchImpl, calls, prompts, requestBodies, requestHeaders, maxActive: () => maxActive };
}

const provider = sectionedProvider({ retryEmotions: true, retryWorkTransport: true });
const completed = await buildAstrologyReportResultAsync(request, {
  env,
  fetchImpl: provider.fetchImpl
});
assert.equal(completed.status, "completed");
assert.equal(completed.generationMetadata?.orchestration, "sectioned-v1");
assert.equal(completed.generationMetadata?.attemptCount, 10);
assert.equal(completed.generationMetadata?.reasoningEffort, "none");
assert.equal(completed.generationMetadata?.reasoningTokens, 0);
assert.equal(completed.generationMetadata?.thesis?.attemptCount, 1);
assert.equal(completed.generationMetadata?.sections?.length, 9);
assert.equal(completed.generationMetadata?.readability?.algorithm, "flesch-kincaid-en-us-v1");
assert.equal(completed.generationMetadata?.readability?.targetGradeMin, 6);
assert.equal(completed.generationMetadata?.readability?.targetGradeMax, 7);
assert.equal(completed.generationMetadata?.readability?.sections.length, 9);
assert.ok((completed.generationMetadata?.readability?.overall.wordCount ?? 0) >= 2300);
assert.equal(completed.generationMetadata?.sections?.find((section) => section.title === "Emotions")?.attemptCount, 1);
const emotionsMetadata = completed.generationMetadata?.sections?.find((section) => section.title === "Emotions");
assert.deepEqual(emotionsMetadata?.failures, []);
assert.equal(emotionsMetadata?.reviewNotes?.[0]?.code, "below_minimum");
assert.match(emotionsMetadata?.reviewNotes?.[0]?.message ?? "", /must be at least 300 words/);
const workMetadata = completed.generationMetadata?.sections?.find((section) => section.title === "Work");
assert.equal(workMetadata?.attemptCount, 1);
assert.equal(workMetadata?.failures?.[0]?.issues[0]?.code, "provider_no_text");
assert.equal(workMetadata?.reviewNotes?.[0]?.code, "provider_no_text");
assert.deepEqual(completed.generationMetadata?.thesis?.failures, []);
assert.equal(provider.calls.get("Thesis"), 1);
assert.equal(provider.calls.get("Emotions"), 1);
assert.equal(provider.calls.get("Work"), 1);
for (const title of headings.filter((heading) => heading !== "Emotions" && heading !== "Work")) assert.equal(provider.calls.get(title), 1);
assert.equal(provider.maxActive(), 3);
assert.ok(completed.generationMetadata?.reviewNotes?.some((note) => note.code === "below_minimum"));
assert.ok(completed.generationMetadata?.reviewNotes?.some((note) => note.code === "provider_no_text"));
assert.match(provider.prompts.get("Integration")?.[0] ?? "", /not a forecast/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /VOICE MODE: PLAINSPOKEN/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Astra supplies the chapter heading/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /6th to 7th grade reading level, aiming near grade 6\.5/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Write like a wise farmer/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /12 to 14 words per sentence on average/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Do not use vague figurative phrases/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /closeness without giving up your own plans, friends, or time/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /warm and lived-in/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /rather than quote or announce/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Plain does not mean choppy or childish/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Write each chapter in 2 or 3 paragraphs/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Open each section with a direct second-person statement using You or Your/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Vary the sentence shape across sections/);
assert.match(completed.sections.find((section) => section.title === "Relationships")?.body ?? "", /The person you choose/);
assert.doesNotMatch(provider.prompts.get("Thesis")?.[0] ?? "", /Reader question:/);
assert.doesNotMatch(provider.prompts.get("Thesis")?.[0] ?? "", /Supplied context only:/);
assert.match(provider.prompts.get("Relationships")?.[0] ?? "", /status=separated/);
assert.match(provider.prompts.get("Relationships")?.[0] ?? "", /without presuming recency, grief, contact, closure-seeking, cause/);
assert.doesNotMatch(provider.prompts.get("Growth")?.[0] ?? "", /Reader question:/);
assert.match(provider.prompts.get("Integration")?.[0] ?? "", /Integration editorial job:/);
assert.match(provider.prompts.get("Integration")?.[0] ?? "", /status=separated/);
assert.match(provider.prompts.get("Integration")?.[0] ?? "", /two or three cross-domain operating principles/);
assert.doesNotMatch(provider.prompts.get("Emotions")?.[0] ?? "", /Reader question:/);
assert.ok(provider.requestBodies.length > 0);
for (const body of provider.requestBodies) assert.deepEqual(body.reasoning, { effort: "none" });
for (const headers of provider.requestHeaders) {
  assert.equal(headers.get("http-referer"), ASTRA_OPENROUTER_SITE_URL);
  assert.equal(headers.get("x-title"), ASTRA_OPENROUTER_APP_NAME);
}

const geminiProvider = sectionedProvider();
const geminiCompleted = await buildAstrologyReportResultAsync(request, {
  env: { ...env, [ASTRA_REPORT_MODEL_ENV]: "google/gemini-3.5-flash" },
  fetchImpl: geminiProvider.fetchImpl
});
assert.equal(geminiCompleted.status, "completed");
assert.equal(geminiCompleted.generationMetadata?.reasoningEffort, "minimal");
for (const body of geminiProvider.requestBodies) assert.deepEqual(body.reasoning, { effort: "minimal" });

for (const model of ["google/gemini-2.5-flash-lite", "moonshotai/kimi-k2.5"]) {
  const bakeoffProvider = sectionedProvider();
  const bakeoffCompleted = await buildAstrologyReportResultAsync(request, {
    env: { ...env, [ASTRA_REPORT_MODEL_ENV]: model },
    fetchImpl: bakeoffProvider.fetchImpl
  });
  assert.equal(bakeoffCompleted.status, "completed");
  assert.equal(bakeoffCompleted.generationMetadata?.reasoningEffort, "none");
  for (const body of bakeoffProvider.requestBodies) assert.deepEqual(body.reasoning, { effort: "none" });
}

const timingProvider = sectionedProvider({ timingFailure: true });
const retainedTiming = await buildAstrologyReportResultAsync(request, { env, fetchImpl: timingProvider.fetchImpl });
assert.equal(retainedTiming.status, "completed");
assert.equal(retainedTiming.generationMetadata?.attemptCount, 10);
const retainedIntegration = retainedTiming.generationMetadata?.sections?.find((section) => section.title === "Integration");
assert.equal(retainedIntegration?.attemptCount, 1);
assert.equal(retainedIntegration?.reviewNotes?.[0]?.code, "natal_timing");
assert.match(retainedTiming.sections.find((section) => section.title === "Integration")?.body ?? "", /This natal pattern is currently active/);
assert.ok((retainedTiming.generationMetadata?.estimatedSpend ?? -1) >= 0);
assert.equal(timingProvider.calls.get("Integration"), 1);
for (const title of headings.filter((heading) => heading !== "Integration")) assert.equal(timingProvider.calls.get(title), 1);

const unsafeRelationshipProvider = sectionedProvider({ unsafeRelationshipFirst: true });
const strainedSafetyRequest = astrologyReportRequestSchema.parse({
  ...request,
  id: "61111111-1111-4111-8111-000000000076",
  context: { relationshipContext: { status: "unspecified", condition: "strained", structure: "unspecified", intention: "discern", recency: "unspecified", partnerPronouns: null, notes: null } }
});
const retainedUnsafeRelationship = await buildAstrologyReportResultAsync(strainedSafetyRequest, { env, fetchImpl: unsafeRelationshipProvider.fetchImpl });
assert.equal(retainedUnsafeRelationship.status, "completed");
const unsafeRelationshipMetadata = retainedUnsafeRelationship.generationMetadata?.sections?.find((section) => section.title === "Relationships");
assert.equal(unsafeRelationshipMetadata?.attemptCount, 1);
assert.ok(unsafeRelationshipMetadata?.reviewNotes?.some((note) => /conditional on safety/.test(note.message)));
assert.match(retainedUnsafeRelationship.sections.find((section) => section.title === "Relationships")?.body ?? "", /confront them/);

const structureOtherRequest = astrologyReportRequestSchema.parse({
  ...request,
  id: "61111111-1111-4111-8111-000000000077",
  context: { relationshipContext: { status: "unspecified", condition: "unspecified", structure: "other", intention: "unspecified", recency: "unspecified", partnerPronouns: null, notes: null } }
});
const correctedStructureOther = sectionedProvider({
  invalidFirst: { Relationships: "Since your relational structure is not a fixed script, you learned early to compensate rather than heal. You can sense someone's grief before they say it. The useful move is to trust that read." }
});
const structureOtherResult = await buildAstrologyReportResultAsync(structureOtherRequest, { env, fetchImpl: correctedStructureOther.fetchImpl });
assert.equal(structureOtherResult.status, "completed");
const structureOtherMetadata = structureOtherResult.generationMetadata?.sections?.find((section) => section.title === "Relationships");
assert.equal(structureOtherMetadata?.attemptCount, 1);
assert.match(structureOtherMetadata?.reviewNotes?.map((issue) => issue.message).join(" ") ?? "", /specific quality or type from structure other|reader biography|another person's vulnerabilities/);

const openToConnectionRequest = astrologyReportRequestSchema.parse({
  ...request,
  id: "61111111-1111-4111-8111-000000000078",
  context: { relationshipContext: { status: "single", condition: "unspecified", structure: "unspecified", intention: "open_to_connection", recency: "unspecified", partnerPronouns: null, notes: null } }
});
const correctedOpenToConnection = sectionedProvider({
  invalidFirst: { Relationships: "Because you are open to connection without a defined structure in play, trust the terms to emerge on their own." }
});
const openToConnectionResult = await buildAstrologyReportResultAsync(openToConnectionRequest, { env, fetchImpl: correctedOpenToConnection.fetchImpl });
assert.equal(openToConnectionResult.status, "completed");
const openToConnectionMetadata = openToConnectionResult.generationMetadata?.sections?.find((section) => section.title === "Relationships");
assert.equal(openToConnectionMetadata?.attemptCount, 1);
assert.match(openToConnectionMetadata?.reviewNotes?.map((issue) => issue.message).join(" ") ?? "", /turns openness into active dating or an undefined structure/);

const partneredConditionRequest = astrologyReportRequestSchema.parse({
  ...request,
  id: "61111111-1111-4111-8111-000000000079",
  context: { relationshipContext: { status: "partnered", condition: "unspecified", structure: "unspecified", intention: "unspecified", recency: "unspecified", partnerPronouns: null, notes: null } }
});
const correctedPartneredCondition = sectionedProvider({
  invalidFirst: { Relationships: "Given your status as partnered, this pattern shows up less as crisis and more as texture." }
});
const partneredConditionResult = await buildAstrologyReportResultAsync(partneredConditionRequest, { env, fetchImpl: correctedPartneredCondition.fetchImpl });
assert.equal(partneredConditionResult.status, "completed");
const partneredConditionMetadata = partneredConditionResult.generationMetadata?.sections?.find((section) => section.title === "Relationships");
assert.equal(partneredConditionMetadata?.attemptCount, 1);
assert.match(partneredConditionMetadata?.reviewNotes?.map((issue) => issue.message).join(" ") ?? "", /qualitative relationship condition from partnered status/);

const categoricalProvider = sectionedProvider({
  invalidFirst: { "Blind Spots": "You act before you think, and most of the time it works. The useful move is to trust your first read." }
});
const correctedCategorical = await buildAstrologyReportResultAsync(request, { env, fetchImpl: categoricalProvider.fetchImpl });
assert.equal(correctedCategorical.status, "completed");
const categoricalMetadata = correctedCategorical.generationMetadata?.sections?.find((section) => section.title === "Blind Spots");
assert.equal(categoricalMetadata?.attemptCount, 1);
assert.match(categoricalMetadata?.reviewNotes?.map((issue) => issue.message).join(" ") ?? "", /categorical behavior claim/);

const boundedInterpretationProvider = sectionedProvider({
  invalidFirst: {
    Growth: "A personal activation means this is currently pressing on something close to you. An opposition links this lunar dispositor chain to Chiron. This gives you a sharp read of hidden group undercurrents. That part of you already knows how to correct the first conclusion."
  }
});
const correctedBoundedInterpretation = await buildAstrologyReportResultAsync(request, { env, fetchImpl: boundedInterpretationProvider.fetchImpl });
assert.equal(correctedBoundedInterpretation.status, "completed");
const boundedInterpretationMetadata = correctedBoundedInterpretation.generationMetadata?.sections?.find((section) => section.title === "Growth");
assert.equal(boundedInterpretationMetadata?.attemptCount, 1);
const boundedInterpretationIssues = boundedInterpretationMetadata?.reviewNotes?.map((issue) => issue.message).join(" ") ?? "";
assert.match(boundedInterpretationIssues, /unsupported current timing or pressure/);
assert.match(boundedInterpretationIssues, /rewrites a rulership or dispositor chain as an aspect/);
assert.match(boundedInterpretationIssues, /privileged or accurate social perception/);
assert.match(boundedInterpretationIssues, /rapid certainty, wholesale change, or an established self-correction habit/);

const unsupportedRulershipProvider = sectionedProvider({
  invalidFirst: { Work: "Mars is ruled by Venus, so every work decision returns to Venus." }
});
const correctedUnsupportedRulership = await buildAstrologyReportResultAsync(request, { env, fetchImpl: unsupportedRulershipProvider.fetchImpl });
assert.equal(correctedUnsupportedRulership.status, "completed");
const unsupportedRulershipMetadata = correctedUnsupportedRulership.generationMetadata?.sections?.find((section) => section.title === "Work");
assert.equal(unsupportedRulershipMetadata?.attemptCount, 1);
assert.match(unsupportedRulershipMetadata?.reviewNotes?.map((issue) => issue.message).join(" ") ?? "", /Unsupported astrology relationship/);

const naturalLanguageAspectProvider = sectionedProvider({
  invalidFirst: { Work: "Moon opposition to Mercury makes this work pattern more complicated." }
});
const correctedNaturalLanguageAspect = await buildAstrologyReportResultAsync(request, { env, fetchImpl: naturalLanguageAspectProvider.fetchImpl });
assert.equal(correctedNaturalLanguageAspect.status, "completed");
const naturalLanguageAspectMetadata = correctedNaturalLanguageAspect.generationMetadata?.sections?.find((section) => section.title === "Work");
assert.equal(naturalLanguageAspectMetadata?.attemptCount, 1);
assert.match(naturalLanguageAspectMetadata?.reviewNotes?.map((issue) => issue.message).join(" ") ?? "", /Unsupported astrology claim/);

const compoundAspectProvider = sectionedProvider({
  invalidFirst: { Work: "Moon also forms a conjunction with Uranus and Neptune, which changes this work pattern." }
});
const correctedCompoundAspect = await buildAstrologyReportResultAsync(request, { env, fetchImpl: compoundAspectProvider.fetchImpl });
assert.equal(correctedCompoundAspect.status, "completed");
const compoundAspectMetadata = correctedCompoundAspect.generationMetadata?.sections?.find((section) => section.title === "Work");
assert.equal(compoundAspectMetadata?.attemptCount, 1);
assert.match(compoundAspectMetadata?.reviewNotes?.map((issue) => issue.message).join(" ") ?? "", /Unsupported astrology claim/);

const chapterScopedEvidence = buildAstrologyReportSectionEvidence(request, headings);
const workEvidenceText = chapterScopedEvidence
  .find((section) => section.title === "Work")
  ?.evidenceBullets.map((evidence) => `${evidence.label}; ${evidence.meaning}`).join(" ") ?? "";
const foreignPlacement = chapterScopedEvidence
  .filter((section) => section.title !== "Work")
  .flatMap((section) => section.evidenceBullets)
  .map((evidence) => `${evidence.label}; ${evidence.meaning}`.match(/\b(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\s+in\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/i)?.[0])
  .filter((claim): claim is string => Boolean(claim))
  .find((claim) => !workEvidenceText.toLowerCase().includes(claim.toLowerCase()));
assert.ok(foreignPlacement, "fixture must expose a placement owned outside Work");
const crossChapterClaimProvider = sectionedProvider({
  invalidFirst: { Work: `${foreignPlacement} also defines how you approach work.` }
});
const correctedCrossChapterClaim = await buildAstrologyReportResultAsync(request, { env, fetchImpl: crossChapterClaimProvider.fetchImpl });
assert.equal(correctedCrossChapterClaim.status, "completed");
const crossChapterClaimMetadata = correctedCrossChapterClaim.generationMetadata?.sections?.find((section) => section.title === "Work");
assert.equal(crossChapterClaimMetadata?.attemptCount, 1);
assert.match(crossChapterClaimMetadata?.reviewNotes?.map((issue) => issue.message).join(" ") ?? "", /Unsupported astrology claim/);

const naturalPronounExampleProvider = sectionedProvider({
  invalidFirst: { "Blind Spots": "She got quiet after you mentioned the schedule. That is an observation, but it should not become a conclusion about her motives." }
});
const acceptedNaturalPronounExample = await buildAstrologyReportResultAsync(openToConnectionRequest, { env, fetchImpl: naturalPronounExampleProvider.fetchImpl });
assert.equal(acceptedNaturalPronounExample.status, "completed");
const naturalPronounExampleMetadata = acceptedNaturalPronounExample.generationMetadata?.sections?.find((section) => section.title === "Blind Spots");
assert.equal(naturalPronounExampleMetadata?.attemptCount, 1);
assert.deepEqual(naturalPronounExampleMetadata?.failures, []);
assert.match(acceptedNaturalPronounExample.sections.find((section) => section.title === "Blind Spots")?.body ?? "", /She got quiet after you mentioned the schedule/);

const stockClosingProvider = sectionedProvider({
  invalidFirst: { Work: "The task isn't to slow down. It's to choose one priority and finish it." }
});
const correctedStockClosing = await buildAstrologyReportResultAsync(request, { env, fetchImpl: stockClosingProvider.fetchImpl });
assert.equal(correctedStockClosing.status, "completed");
const stockClosingMetadata = correctedStockClosing.generationMetadata?.sections?.find((section) => section.title === "Work");
assert.equal(stockClosingMetadata?.attemptCount, 1);
assert.doesNotMatch(correctedStockClosing.sections.find((section) => section.title === "Work")?.body ?? "", /The task isn't/);
assert.match(correctedStockClosing.sections.find((section) => section.title === "Work")?.body ?? "", /The point is not to slow down\. It is to choose one priority/);

const usefulLongThesisProvider = sectionedProvider({ usefulLongThesis: true });
const usefulLongThesis = await buildAstrologyReportResultAsync(request, { env, fetchImpl: usefulLongThesisProvider.fetchImpl });
assert.equal(usefulLongThesis.status, "completed");
assert.equal(usefulLongThesis.generationMetadata?.attemptCount, 10);
assert.equal(usefulLongThesis.generationMetadata?.thesis?.attemptCount, 1);
assert.deepEqual(usefulLongThesis.generationMetadata?.thesis?.failures, []);

const identityThirdSentenceProvider = sectionedProvider({ identityThirdSentence: true });
const identityThirdSentence = await buildAstrologyReportResultAsync(request, { env, fetchImpl: identityThirdSentenceProvider.fetchImpl });
assert.equal(identityThirdSentence.status, "completed");
assert.equal(identityThirdSentence.generationMetadata?.attemptCount, 10);
assert.equal(identityThirdSentence.generationMetadata?.sections?.find((section) => section.title === "Identity")?.attemptCount, 1);

const relationshipSituationCases = [
  {
    relationshipContext: { status: "single", condition: "unspecified", structure: "unspecified", intention: "not_seeking", recency: "unspecified", partnerPronouns: null, notes: null },
    expected: /intention=not_seeking/,
    application: /reader is not seeking a relationship/
  },
  {
    relationshipContext: { status: "single", condition: "unspecified", structure: "unspecified", intention: "dating", recency: "unspecified", partnerPronouns: null, notes: null },
    expected: /intention=dating/,
    application: /reader is dating/
  },
  {
    relationshipContext: { status: "partnered", condition: "unspecified", structure: "unspecified", intention: "deepen", recency: "unspecified", partnerPronouns: null, notes: null },
    expected: /status=partnered/,
    application: /without presuming health, stability, security, crisis, strain, repair, cohabitation, monogamy, or romance/
  },
  {
    relationshipContext: { status: "unspecified", condition: "strained", structure: "unspecified", intention: "discern", recency: "unspecified", partnerPronouns: null, notes: null },
    expected: /condition=strained/,
    application: /do not recommend direct conversation, disclosure, confrontation, repair/
  },
  {
    relationshipContext: { status: "separated", condition: "recovering", structure: "unspecified", intention: "recover", recency: "unspecified", partnerPronouns: null, notes: null },
    expected: /status=separated; condition=recovering/,
    application: /recovery refers to the reader's own steadiness/
  },
  {
    relationshipContext: { status: "unspecified", condition: "unspecified", structure: "other", intention: "unspecified", recency: "unspecified", partnerPronouns: null, notes: null },
    expected: /structure=other/,
    application: /nothing else is known/
  },
  {
    relationshipContext: { status: "unspecified", condition: "unspecified", structure: "unspecified", intention: "unspecified", recency: "unspecified", partnerPronouns: null, notes: null },
    expected: /status=unspecified/,
    application: /relationship-neutral language/
  }
] as const;

for (const [index, scenario] of relationshipSituationCases.entries()) {
  const scenarioProvider = sectionedProvider();
  const scenarioRequest = astrologyReportRequestSchema.parse({
    ...request,
    id: `61111111-1111-4111-8111-${String(index + 1).padStart(12, "0")}`,
    question: "What relationship pattern should I understand without assuming a conventional partner?",
    intent: "structured relationship-context test",
    context: { relationshipContext: scenario.relationshipContext }
  });
  const scenarioResult = await buildAstrologyReportResultAsync(scenarioRequest, { env, fetchImpl: scenarioProvider.fetchImpl });
  assert.equal(scenarioResult.status, "completed");
  assert.doesNotMatch(scenarioProvider.prompts.get("Thesis")?.[0] ?? "", scenario.expected);
  assert.match(scenarioProvider.prompts.get("Relationships")?.[0] ?? "", scenario.expected);
  assert.match(scenarioProvider.prompts.get("Relationships")?.[0] ?? "", scenario.application);
  assert.match(scenarioProvider.prompts.get("Relationships")?.[0] ?? "", /Report-level evidence ownership:/);
  assert.match(scenarioProvider.prompts.get("Relationships")?.[0] ?? "", /Chapter voice plan:/);
  assert.doesNotMatch(scenarioProvider.prompts.get("Growth")?.[0] ?? "", /Supplied context only:/);
  assert.match(scenarioProvider.prompts.get("Integration")?.[0] ?? "", /Integration editorial job:/);
}

const canonicalIdentity = `${prose("Identity", 400)} You can sit with a question longer when it matters. Sitting with uncertainty can reveal more than an instant answer.`;
const canonicalProvider = sectionedProvider();
const canonicalRequest = astrologyReportRequestSchema.parse({
  ...request,
  id: "61111111-1111-4111-8111-000000000099",
  context: {
    relationshipContext: relationshipSituationCases[0].relationshipContext,
    canonicalIdentity
  }
});
const canonicalResult = await buildAstrologyReportResultAsync(canonicalRequest, { env, fetchImpl: canonicalProvider.fetchImpl });
assert.equal(canonicalResult.status, "completed", canonicalResult.error);
assert.equal(
  canonicalResult.sections.find((section) => section.title === "Identity")?.body,
  canonicalIdentity
    .replace("sit with a question", "consider a question")
    .replace("Sitting with", "Considering")
);
assert.match(canonicalProvider.prompts.get("Thesis")?.[0] ?? "", /Canonical Identity contract:/);
assert.equal(canonicalProvider.calls.get("Identity"), undefined);
assert.equal(canonicalResult.generationMetadata?.sections?.some((section) => section.title === "Identity"), false);
assert.equal(canonicalResult.generationMetadata?.attemptCount, 9);

const synthesisNotes = [
  {
    label: "Emotions",
    thesis: "Careful observation can help Tony understand feeling, provided analysis does not replace the feeling itself.",
    counterweight: "Precision can support emotional honesty when it gives experience clear language.",
    claimBoundary: "Do not diagnose withdrawal, suppression, or emotional history."
  },
  {
    label: "Relationships",
    thesis: "Closeness works best when independence is named instead of left for another person to guess.",
    counterweight: "Freedom and care can reinforce each other when expectations stay visible.",
    claimBoundary: "Do not infer a partner, relationship condition, or another person's motives."
  },
  {
    label: "Work",
    thesis: "Contribution becomes more durable when skill and visibility are allocated with care.",
    counterweight: "Recognition can support craft when it follows a useful contribution.",
    claimBoundary: "Do not invent a career history or workplace."
  },
  {
    label: "Integration",
    thesis: "Values become clearer when they identify what deserves protection, commitment, and attention.",
    counterweight: "Values can guide a tradeoff without prescribing one correct choice.",
    claimBoundary: "Do not turn a tendency into biography or a weekly assignment."
  },
  {
    label: "Drive",
    thesis: "Force becomes more dependable when its size matches the situation.",
    counterweight: "Ambition remains an asset when it is not asked to carry every goal at once.",
    claimBoundary: "Do not claim impulsivity, burnout, or a fixed pattern of overreach."
  },
  {
    label: "Blind Spots",
    thesis: "A quick impression is most useful as an observation before it becomes an interpretation.",
    counterweight: "Pattern recognition remains useful when it stays open to new evidence.",
    claimBoundary: "Do not claim access to another person's motives or inner state."
  },
  {
    label: "Gifts",
    thesis: "Warmth, originality, and practiced presence may become useful resources when those possibilities fit lived experience.",
    counterweight: "These are capacities to explore, not evidence of an established social role or effect on other people.",
    claimBoundary: "Use bounded language. Do not claim routine behavior, biography, reputation, group impact, or how others experience the reader."
  },
  {
    label: "Growth",
    thesis: "Growth means updating a stable self-concept without abandoning it.",
    counterweight: "Consistency is a resource when it can include new information.",
    claimBoundary: "Do not invent a wound, defense, or prior history."
  }
];
const enrichedProvider = sectionedProvider();
const enrichedRequest = astrologyReportRequestSchema.parse({
  ...canonicalRequest,
  id: "61111111-1111-4111-8111-000000000100",
  context: { ...canonicalRequest.context, v1InterpretiveNotes: synthesisNotes }
});
const enrichedResult = await buildAstrologyReportResultAsync(enrichedRequest, { env, fetchImpl: enrichedProvider.fetchImpl });
assert.equal(enrichedResult.status, "completed", enrichedResult.error);
const enrichedRelationshipsPrompt = enrichedProvider.prompts.get("Relationships")?.[0] ?? "";
const enrichedRelationshipsPacket = enrichedRelationshipsPrompt.split("Section signal card:\n").at(-1) ?? "";
assert.match(enrichedRelationshipsPrompt, /Counterweight: Freedom and care/);
assert.match(enrichedRelationshipsPrompt, /Chapter question: What can the selected facts responsibly show about relationships\?/i);
assert.match(enrichedRelationshipsPrompt, /Intended conclusion: Closeness works best/i);
assert.match(enrichedRelationshipsPrompt, /Atomic selected evidence \(use only these 2 or 3 facts\):/);
assert.match(enrichedRelationshipsPrompt, /Allowed contribution:/);
assert.match(enrichedRelationshipsPrompt, /Prohibited conclusion: Do not infer a partner/);
assert.match(enrichedRelationshipsPrompt, /Do not introduce another chart fact/i);
const enrichedRelationshipFactCount = enrichedRelationshipsPrompt.match(/^- Fact:/gm)?.length ?? 0;
assert.ok(enrichedRelationshipFactCount >= 2 && enrichedRelationshipFactCount <= 3);
assert.doesNotMatch(enrichedRelationshipsPacket, /v2_evidence_|v2_anchor_|pathScore|priority|dispositor-chain|final dispositor/i);
assert.doesNotMatch(enrichedRelationshipsPacket, /Primary hypothesis:|Claim boundary:|Evidence authorization:/i);
assert.match(enrichedRelationshipsPacket, /Prohibited conclusion:/);
assert.doesNotMatch(enrichedRelationshipsPacket, /Risks: filling gaps with assumptions/);
assert.doesNotMatch(enrichedRelationshipsPacket, /Developmental tasks: make relational needs explicit/);
assert.match(enrichedRelationshipsPrompt, /Only Integration may connect multiple life domains/);
assert.match(enrichedRelationshipsPrompt, /Do not use stock bridge phrases such as 'Put together,' 'Taken together,' 'This suggests,' or 'The pattern points.'/);
assert.match(enrichedRelationshipsPrompt, /Do not use 'works differently,' 'this works differently,' or a similar explanatory pivot/);
assert.match(enrichedRelationshipsPrompt, /Avoid stilted therapeutic phrasing such as 'sitting with' or 'sit with\.'/);
assert.match(enrichedRelationshipsPrompt, /Identity alone owns private reflection/);
assert.match(enrichedRelationshipsPrompt, /Work owns allocation and contribution/);
assert.match(enrichedRelationshipsPrompt, /Integration owns values and decision criteria/);
assert.match(enrichedProvider.prompts.get("Integration")?.[0] ?? "", /Chapter-specific conclusion: Values become clearer when they identify what deserves protection/);
assert.match(enrichedProvider.prompts.get("Integration")?.[0] ?? "", /Integration ownership: stay with values and decision criteria/);
const enrichedWorkPrompt = enrichedProvider.prompts.get("Work")?.[0] ?? "";
const enrichedIntegrationPrompt = enrichedProvider.prompts.get("Integration")?.[0] ?? "";
const enrichedWorkCard = enrichedWorkPrompt.split("Section signal card:")[1] ?? "";
const enrichedIntegrationCard = enrichedIntegrationPrompt.split("Section signal card:")[1] ?? "";
assert.doesNotMatch(enrichedWorkCard, /Sun in Gemini in the 12th house|Mercury in Gemini in the 12th house/i);
assert.doesNotMatch(enrichedIntegrationCard, /Sun in Gemini in the 12th house|Moon in Virgo in the 3rd house|Mercury in Gemini/i);
const enrichedDeepWorkCard = (enrichedProvider.prompts.get("Work")?.[0] ?? "").split("Section signal card:")[1] ?? "";
const enrichedDeepEmotionsCard = (enrichedProvider.prompts.get("Emotions")?.[0] ?? "").split("Section signal card:")[1] ?? "";
const enrichedDeepDriveCard = (enrichedProvider.prompts.get("Drive")?.[0] ?? "").split("Section signal card:")[1] ?? "";
const enrichedDeepRelationshipsCard = (enrichedProvider.prompts.get("Relationships")?.[0] ?? "").split("Section signal card:")[1] ?? "";
const enrichedDeepBlindSpotsCard = (enrichedProvider.prompts.get("Blind Spots")?.[0] ?? "").split("Section signal card:")[1] ?? "";
const enrichedDeepGrowthCard = (enrichedProvider.prompts.get("Growth")?.[0] ?? "").split("Section signal card:")[1] ?? "";
const enrichedDeepGiftsCard = (enrichedProvider.prompts.get("Gifts")?.[0] ?? "").split("Section signal card:")[1] ?? "";
assert.doesNotMatch(enrichedDeepWorkCard, /Mars opposition Jupiter/i);
assert.match(enrichedDeepEmotionsCard, /Moon in Virgo|Moon sextile Neptune/i);
assert.doesNotMatch(enrichedDeepEmotionsCard, /Sun in Gemini|Mercury in Gemini/i);
assert.doesNotMatch(enrichedDeepDriveCard, /Mercury sextile Uranus|2nd house emphasis|Mars square Neptune/i);
assert.match(enrichedDeepDriveCard, /Mars opposition Jupiter|Mars in Leo/i);
assert.match(enrichedDeepRelationshipsCard, /Mars square Neptune|Venus trine Uranus/i);
assert.doesNotMatch(enrichedDeepRelationshipsCard, /Venus in Aries/i);
assert.doesNotMatch(enrichedDeepBlindSpotsCard, /Virgo emphasis|Leo emphasis/i);
assert.doesNotMatch(enrichedDeepGrowthCard, /Pluto opposition Chiron|Gemini emphasis/i);
assert.doesNotMatch(enrichedDeepGrowthCard, /Saturn in Capricorn/i);
assert.doesNotMatch(enrichedDeepGiftsCard, /Mercury sextile Uranus|Gemini emphasis|Virgo emphasis|Venus trine Uranus/i);
assert.match(enrichedDeepGiftsCard, /Venus in Aries/i);
assert.match(enrichedProvider.prompts.get("Blind Spots")?.[0] ?? "", /only chapter that may distinguish observation from interpretation/i);
assert.match(enrichedProvider.prompts.get("Gifts")?.[0] ?? "", /usable capacity and the contribution it can make/i);
assert.match(enrichedProvider.prompts.get("Gifts")?.[0] ?? "", /Present capacities as bounded possibilities/i);
assert.match(enrichedProvider.prompts.get("Gifts")?.[0] ?? "", /not as established biography, reputation, routine behavior, or proven effect on other people/i);
assert.match(enrichedProvider.prompts.get("Growth")?.[0] ?? "", /stable self-concept can take in new information/i);
assert.equal(enrichedProvider.calls.get("Identity"), undefined);

const enrichedStrainedProvider = sectionedProvider();
const enrichedStrainedRequest = astrologyReportRequestSchema.parse({
  ...enrichedRequest,
  id: "61111111-1111-4111-8111-000000000102",
  reportType: "core",
  context: {
    ...enrichedRequest.context,
    relationshipContext: {
      status: "unspecified",
      condition: "strained",
      structure: "unspecified",
      intention: "unspecified",
      recency: "unspecified",
      partnerPronouns: null,
      notes: null
    }
  }
});
const enrichedStrainedResult = await buildAstrologyReportResultAsync(enrichedStrainedRequest, { env, fetchImpl: enrichedStrainedProvider.fetchImpl });
assert.equal(enrichedStrainedResult.status, "completed", enrichedStrainedResult.error);
const enrichedStrainedRelationshipsPrompt = enrichedStrainedProvider.prompts.get("Relationships")?.[0] ?? "";
assert.match(enrichedStrainedRelationshipsPrompt, /Safety is unknown. Do not directly advise disclosure, contact, confrontation, repair, or stating a need or boundary/i);
assert.match(enrichedStrainedRelationshipsPrompt, /exact words "when safe and appropriate" in the same sentence/i);

const enrichedCoreProvider = sectionedProvider();
const enrichedCoreRequest = astrologyReportRequestSchema.parse({
  ...enrichedRequest,
  id: "61111111-1111-4111-8111-000000000101",
  reportType: "core"
});
const enrichedCoreResult = await buildAstrologyReportResultAsync(enrichedCoreRequest, { env, fetchImpl: enrichedCoreProvider.fetchImpl });
assert.equal(enrichedCoreResult.status, "completed", enrichedCoreResult.error);
assert.equal(enrichedCoreResult.generationMetadata?.orchestration, "sectioned-v1");
assert.equal(enrichedCoreResult.generationMetadata?.sections?.length, 3);
assert.equal(enrichedCoreProvider.calls.get("Identity"), undefined);
assert.equal(enrichedCoreProvider.calls.get("Thesis"), undefined);
const enrichedCoreWorkPrompt = enrichedCoreProvider.prompts.get("Work")?.[0] ?? "";
const enrichedCoreIntegrationPrompt = enrichedCoreProvider.prompts.get("Integration")?.[0] ?? "";
assert.match(enrichedCoreWorkPrompt, /Canonical Identity bridge:/);
assert.doesNotMatch(enrichedCoreWorkPrompt, /- Identity:|Sun in Gemini in the 12th house|Mercury in Gemini in the 12th house/i);
assert.doesNotMatch(enrichedCoreIntegrationPrompt, /- Identity:|Sun in Gemini in the 12th house|Moon in Virgo in the 3rd house|Mercury in Gemini/i);

assert.throws(
  () => assertDistinctChapterConclusions([
    {
      title: "Work",
      intendedConclusion: "Describe how effort may be allocated across the work that matters."
    },
    {
      title: "Drive",
      intendedConclusion: "Describe how effort can be allocated across work that matters."
    }
  ]),
  /chapter conclusions overlap: Work and Drive/,
  "Overlapping chapter conclusions must fail before a provider call."
);
assert.doesNotThrow(() => assertDistinctChapterConclusions([
  {
    title: "Work",
    intendedConclusion: "Describe where effort or contribution may be allocated usefully without claiming a work history."
  },
  {
    title: "Drive",
    intendedConclusion: "Describe possible pacing or proportion of force without deciding which work deserves effort."
  }
]));

const moonMercuryBridge = planWriterFact("Relationships", {
  label: "Moon sextile Mercury",
  facts: ["Moon sextile Mercury", "aspect sextile"]
}, "support");
assert.match(
  moonMercuryBridge.allowedContribution,
  /emotional information and felt security.*naming, comparison, and interpretation.*possible cooperation/
);
assert.match(
  moonMercuryBridge.prohibitedInference,
  /cannot establish ease, difficulty, skill, habit, action, communication, outcome, or another person's response/
);
assert.doesNotMatch(moonMercuryBridge.allowedContribution, /easy spoken requests?|speaks? requests? easily/i);

const marsLibraBridge = planWriterFact("Work", {
  label: "Mars in Libra in the 1st house",
  facts: ["Mars", "Libra", "Mars in Libra", "1st house", "Mars in 1st house"]
}, "primary");
assert.match(
  marsLibraBridge.allowedContribution,
  /force, effort, and initiation.*balance and relational comparison.*self-directed presence/
);
assert.match(
  marsLibraBridge.prohibitedInference,
  /does not establish mediation, teamwork, leadership, a group role, or any work outcome/
);
assert.doesNotMatch(marsLibraBridge.allowedContribution, /mediat|teamwork|leadership|group role/i);

const venusContributionBridge = planWriterFact("Gifts", {
  label: "Venus in Sagittarius in the 3rd house",
  facts: ["Venus", "Sagittarius", "Venus in Sagittarius", "3rd house", "Venus in 3rd house"]
}, "support");
assert.match(
  venusContributionBridge.allowedContribution,
  /value, attraction, and connection.*exploration and meaning.*communication and learning/
);
assert.match(
  venusContributionBridge.prohibitedInference,
  /does not prove contribution, skill, reputation, social effect, or how anyone receives the subject/
);
assert.doesNotMatch(venusContributionBridge.allowedContribution, /proven contribution|proves? contribution/i);

const chartRulerBridge = planWriterFact("Gifts", {
  label: "Chart ruler Venus",
  facts: ["Chart ruler Venus", "rulership chart ruler"]
}, "primary");
assert.match(
  chartRulerBridge.allowedContribution,
  /value, attraction, and connection.*chart-wide orienting emphasis.*calculated Ascendant sign/
);
assert.match(
  chartRulerBridge.prohibitedInference,
  /cannot establish a dominant personality, behavior, skill, outcome, causal mechanism/
);

const descendantBridge = planWriterFact("Relationships", {
  label: "Descendant in Aries",
  facts: ["Descendant", "Aries", "Descendant in Aries"]
}, "primary");
assert.match(
  descendantBridge.allowedContribution,
  /one-to-one relational horizon.*initiative and directness/
);
assert.match(
  descendantBridge.prohibitedInference,
  /cannot establish a personality, behavior, relationship condition, public or private circumstance, another person's state, or outcome/
);

const directDispositorBridge = planWriterFact("Growth", {
  label: "Neptune disposed by Saturn",
  facts: ["Neptune disposed by Saturn", "direct rulership"]
}, "counterweight");
assert.match(
  directDispositorBridge.allowedContribution,
  /limits, structure, and accountability.*imagination, permeability, and uncertainty.*one direct sign-rulership fact/
);
assert.match(
  directDispositorBridge.prohibitedInference,
  /cannot establish causal flow, a chain, self-containment, outside-validation resistance, personality, behavior, or skill/
);
assert.doesNotMatch(directDispositorBridge.allowedContribution, /self-contained personality|outside opinion|causal (?:flow|mechanism)/i);

const waxingCrescentBridge = planWriterFact("Integration", {
  label: "waxing_crescent lunar phase",
  facts: ["waxing_crescent lunar phase", "solar_lunar_cycle"]
}, "support");
assert.match(waxingCrescentBridge.allowedContribution, /waxing crescent Sun-Moon geometry/);
assert.match(
  waxingCrescentBridge.prohibitedInference,
  /cannot establish a preference for early or delayed action, current timing, developmental stage, behavior, or outcome/
);
assert.doesNotMatch(waxingCrescentBridge.allowedContribution, /early action|act early|early motion/i);

const claimPlanFixture = {
  title: "Relationships",
  hypothesis: "Bounded relationship hypothesis.",
  chapterQuestion: "What may support explicit relational terms?",
  intendedConclusion: "Explicit terms may make reciprocity easier to assess without describing an actual bond.",
  claimBoundary: "Do not infer an actual relationship, behavior, or another person's response.",
  counterweight: "The selected facts do not prove that explicit terms are used.",
  chartSignals: [],
  writerSignals: [
    {
      id: "moon-mercury",
      label: "Moon sextile Mercury",
      facts: ["Moon sextile Mercury"],
      allowedContribution: moonMercuryBridge.allowedContribution,
      prohibitedInference: moonMercuryBridge.prohibitedInference
    },
    {
      id: "jupiter-saturn",
      label: "Jupiter opposition Saturn",
      facts: ["Jupiter opposition Saturn"],
      allowedContribution: "Jupiter opposition Saturn may qualify the relationship question through a polarity between expansion and limits.",
      prohibitedInference: "Jupiter opposition Saturn cannot establish an actual relationship, behavior, or another person's response."
    }
  ]
};
const claimPlan = buildWriterChapterClaimPlan(claimPlanFixture);
assert.deepEqual(claimPlan.atoms.map((atom) => atom.id), ["F1", "F2"]);
assert.deepEqual(claimPlan.claims.map((claim) => claim.marker), [
  "[[F1:inference]]",
  "[[F2:compression]]",
  "[[F1:inference,F2:inference]]"
]);
const boundedClaimAudit = auditWriterClaimMarkers(
  [
    "Moon sextile Mercury is the selected aspect, and its bounded cooperation remains symbolic. [[F1:inference]]",
    "Jupiter opposite Saturn preserves a polarity between expansion and limits without proving behavior. [[F2:compression]]",
    "Explicit terms may make reciprocity easier to assess, but no actual bond or response is established. [[F1:inference,F2:inference]]"
  ].join("\n\n"),
  claimPlanFixture
);
assert.deepEqual(boundedClaimAudit.errors, []);
assert.doesNotMatch(boundedClaimAudit.prose, /\[\[F\d/);
const rejectedClaimAudit = auditWriterClaimMarkers(
  [
    "You find spoken requests easy because Moon sextiles Mercury.",
    "Jupiter opposite Saturn proves that you already negotiate limits.",
    "Your relationships therefore work best when both people state what they need."
  ].join("\n\n"),
  claimPlanFixture
);
assert.equal(rejectedClaimAudit.errors.length, 3);
assert.match(rejectedClaimAudit.errors.join(" "), /missing its internal support marker/);

const v2PlanningProvider = sectionedProvider();
const enrichedReportBasis = enrichedRequest.reportBasis!;
const v2PlanningRequest = astrologyReportRequestSchema.parse({
  ...enrichedRequest,
  id: "61111111-1111-4111-8111-000000000102",
  reportBasis: {
    ...enrichedReportBasis,
    schemaVersion: 2,
    primary: {
      ...enrichedReportBasis.primary,
      calculationMode: "full"
    }
  }
});
const v2PlanningResult = await buildAstrologyReportResultAsync(
  v2PlanningRequest,
  { env, fetchImpl: v2PlanningProvider.fetchImpl }
);
assert.equal(v2PlanningResult.status, "completed", v2PlanningResult.error);
for (const section of v2PlanningResult.sections) {
  assert.doesNotMatch(section.body, /\[\[F\d/, `${section.title} leaked internal support markers into public prose.`);
}
const v2ChapterPrompts = headings
  .filter((title) => title !== "Identity")
  .map((title) => [title, v2PlanningProvider.prompts.get(title)?.[0] ?? ""] as const);
const v2Conclusions = new Set<string>();
for (const [title, prompt] of v2ChapterPrompts) {
  const packet = prompt.split("Section signal card:\n").at(-1) ?? "";
  const factCount = packet.match(/^- (?:F\d+ )?Fact:/gm)?.length ?? 0;
  const allowedCount = packet.match(/^  Allowed contribution:/gm)?.length ?? 0;
  const prohibitedCount = packet.match(/^  Prohibited inference:/gm)?.length ?? 0;
  assert.ok(factCount >= 2 && factCount <= 3, `${title} must receive exactly 2 or 3 atomic facts.`);
  assert.equal(allowedCount, factCount, `${title} must authorize every selected atomic fact.`);
  assert.equal(prohibitedCount, factCount, `${title} must prohibit an inference for every selected atomic fact.`);
  assert.doesNotMatch(
    packet,
    /may frame a chapter-specific natal tendency or life-area condition|may (?:anchor|support or qualify|limit or qualify) the .* conclusion only|v2_evidence_|v2_anchor_|pathScore|priority|dispositor-chain|final dispositor/i
  );
  assert.doesNotMatch(prompt, /Chapter-specific conclusion: .*structurally connected mechanism/i);
  const conclusion = packet.match(/^Intended conclusion: (.+)$/m)?.[1];
  assert.ok(conclusion, `${title} must reserve an intended conclusion.`);
  assert.equal(v2Conclusions.has(conclusion), false, `${title} must have a distinct intended conclusion.`);
  v2Conclusions.add(conclusion);
}
assert.match(
  v2PlanningProvider.prompts.get("Blind Spots")?.[0] ?? "",
  /cannot be used to infer a home, family, work, or relationship circumstance/
);
assert.match(
  v2PlanningProvider.prompts.get("Gifts")?.[0] ?? "",
  /cannot be used to infer proven skill, routine performance, reputation, social impact, or how other people receive the subject/
);
assert.match(
  v2PlanningProvider.prompts.get("Work")?.[0] ?? "",
  /Describe where effort or contribution may be allocated usefully/
);
assert.match(
  v2PlanningProvider.prompts.get("Drive")?.[0] ?? "",
  /Describe possible pacing or proportion of force/
);

const ownedEvidence = buildAstrologyReportSectionEvidence(request, [
  "Identity",
  "Emotions",
  "Relationships",
  "Work",
  "Drive",
  "Gifts",
  "Blind Spots",
  "Growth",
  "Integration"
]);
const aspectUsage = new Map<string, string[]>();
for (const section of ownedEvidence) {
  for (const evidence of section.evidenceBullets) {
    if (!/\b(?:conjunction|sextile|square|trine|opposition)\b/i.test(evidence.label)) continue;
    aspectUsage.set(evidence.label, [...(aspectUsage.get(evidence.label) ?? []), section.title]);
  }
}
for (const [label, sections] of aspectUsage) {
  assert.ok(sections.length <= 2, `${label} appeared in too many chapters: ${sections.join(", ")}`);
}

const simpleReading = measureReportReadability("You see the problem. You name it. Then you choose what to do next.");
const denseReading = measureReportReadability("Interpersonal differentiation requires sustained psychological interpretation and multidimensional contextualization before meaningful reconciliation becomes conceivable.");
assert.ok(simpleReading.fleschKincaidGrade < denseReading.fleschKincaidGrade);
assert.ok(simpleReading.fleschReadingEase > denseReading.fleschReadingEase);

console.log("Sectioned Deep Report single-attempt retention, review-note, Plainspoken readability, depth, metadata, and natal timing checks passed.");
