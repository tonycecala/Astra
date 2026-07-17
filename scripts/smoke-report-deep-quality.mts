import assert from "node:assert/strict";

import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROFILE_ENV,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  buildAstrologyReportResultAsync,
  measureReportReadability
} from "@astra/astrology";
import { astrologyReportRequestSchema } from "@astra/contracts";

const headings = ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Integration"];
const request = astrologyReportRequestSchema.parse({
  id: "51111111-1111-4111-8111-111111111111",
  userId: "52222222-2222-4222-8222-222222222222",
  chartRequestId: "53333333-3333-4333-8333-333333333333",
  reportType: "deep",
  subjectName: "Deep Quality Fixture",
  birthData: { date: "1961-05-23", time: "09:30", birthTimeKnown: true, timezone: "America/Chicago", location: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 },
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

function sectionedProvider(options: { retryEmotions?: boolean; retryWorkTransport?: boolean; timingFailure?: boolean; thirdPersonFailure?: boolean; usefulLongThesis?: boolean; identityThirdSentence?: boolean } = {}) {
  const calls = new Map<string, number>();
  const prompts = new Map<string, string[]>();
  const requestBodies: Array<Record<string, unknown>> = [];
  let active = 0;
  let maxActive = 0;
  const fetchImpl = async (_url: string | URL | Request, init?: RequestInit) => {
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
    const openingOverride = title === "Identity" && options.identityThirdSentence
      ? "You already know yourself pretty well. That is not the hard part. Your Gemini Sun gives the identity chapter a clear center."
      : title === "Relationships"
      ? options.thirdPersonFailure && count === 1
        ? "This person tends to hide what matters until distance does the speaking."
        : "The person you choose matters, but so does what you are willing to say plainly."
      : undefined;
    const content = title === "Thesis"
      ? options.usefulLongThesis
        ? "Her chapters orbit a single unresolved question: what she trusts more, the self that forms in contact with others' recognition or the self that persists when no one is watching. Each domain tests whether her responsiveness to signal, emotional, relational, or professional, is discernment or dilution, and whether her strengths, instincts, and ambitions remain hers once proven, or dissolve into whatever the moment rewards. The work is not choosing autonomy over connection but learning to stay legible to herself while taking in what the world demands."
        : "A private intelligence seeks public usefulness without sacrificing discernment, while courage and imagination repeatedly test whether desire can become disciplined action. The report should show how sensitivity, range, and visible initiative become trustworthy when they are given structure, proportion, honest relationship, and practical form."
      : prose(title, words, options.timingFailure && title === "Integration", openingOverride);
    const choices = title === "Work" && options.retryWorkTransport && count === 1 ? [] : [{ finish_reason: "stop", message: { content } }];
    return new Response(JSON.stringify({ choices, usage: { prompt_tokens: 1, completion_tokens: 1, completion_tokens_details: { reasoning_tokens: 0 }, total_tokens: 2, cost: 0 } }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  return { fetchImpl, calls, prompts, requestBodies, maxActive: () => maxActive };
}

const provider = sectionedProvider({ retryEmotions: true, retryWorkTransport: true });
const completed = await buildAstrologyReportResultAsync(request, {
  env,
  fetchImpl: provider.fetchImpl
});
assert.equal(completed.status, "completed");
assert.equal(completed.generationMetadata?.orchestration, "sectioned-v1");
assert.equal(completed.generationMetadata?.attemptCount, 12);
assert.equal(completed.generationMetadata?.reasoningEffort, "none");
assert.equal(completed.generationMetadata?.reasoningTokens, 0);
assert.equal(completed.generationMetadata?.thesis?.attemptCount, 1);
assert.equal(completed.generationMetadata?.sections?.length, 9);
assert.equal(completed.generationMetadata?.readability?.algorithm, "flesch-kincaid-en-us-v1");
assert.equal(completed.generationMetadata?.readability?.targetGradeMin, 6);
assert.equal(completed.generationMetadata?.readability?.targetGradeMax, 8);
assert.equal(completed.generationMetadata?.readability?.sections.length, 9);
assert.ok((completed.generationMetadata?.readability?.overall.wordCount ?? 0) >= 2625);
assert.equal(completed.generationMetadata?.sections?.find((section) => section.title === "Emotions")?.attemptCount, 2);
const emotionsMetadata = completed.generationMetadata?.sections?.find((section) => section.title === "Emotions");
assert.equal(emotionsMetadata?.failures?.length, 1);
assert.equal(emotionsMetadata?.failures?.[0]?.attempt, 1);
assert.equal(emotionsMetadata?.failures?.[0]?.issues[0]?.code, "below_minimum");
assert.match(emotionsMetadata?.failures?.[0]?.issues[0]?.message ?? "", /must be at least 300 words/);
assert.equal(emotionsMetadata?.failures?.[0]?.inputTokens, 1);
assert.equal(emotionsMetadata?.failures?.[0]?.reasoningTokens, 0);
assert.equal(emotionsMetadata?.failures?.[0]?.finishReason, "stop");
assert.ok((emotionsMetadata?.failures?.[0]?.latencyMs ?? -1) >= 0);
assert.match(emotionsMetadata?.failures?.[0]?.rejectedText ?? "", /^Emotions asks/);
assert.equal("text" in (emotionsMetadata?.failures?.[0] ?? {}), false);
const workMetadata = completed.generationMetadata?.sections?.find((section) => section.title === "Work");
assert.equal(workMetadata?.failures?.length, 1);
assert.equal(workMetadata?.failures?.[0]?.issues[0]?.code, "provider_no_text");
assert.equal(workMetadata?.failures?.[0]?.inputTokens, undefined);
assert.deepEqual(completed.generationMetadata?.thesis?.failures, []);
assert.equal(provider.calls.get("Thesis"), 1);
assert.equal(provider.calls.get("Emotions"), 2);
assert.equal(provider.calls.get("Work"), 2);
for (const title of headings.filter((heading) => heading !== "Emotions" && heading !== "Work")) assert.equal(provider.calls.get(title), 1);
assert.equal(provider.maxActive(), 3);
assert.match(provider.prompts.get("Emotions")?.[1] ?? "", /must be at least 300 words/);
assert.doesNotMatch(provider.prompts.get("Work")?.[1] ?? "", /## Emotions/);
assert.match(provider.prompts.get("Integration")?.[0] ?? "", /not a forecast/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /VOICE MODE: PLAINSPOKEN/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Astra supplies the chapter heading/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /6th to 8th grade reading level/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /warm and lived-in/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /rather than quote or announce/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /plain does not mean choppy or childish/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Write 2 or 3 paragraphs/);
assert.match(provider.prompts.get("Identity")?.[0] ?? "", /Begin with a direct second-person statement using You or Your/);
assert.match(completed.sections.find((section) => section.title === "Relationships")?.body ?? "", /The person you choose/);
assert.ok(provider.requestBodies.length > 0);
for (const body of provider.requestBodies) assert.deepEqual(body.reasoning, { effort: "none" });

const geminiProvider = sectionedProvider();
const geminiCompleted = await buildAstrologyReportResultAsync(request, {
  env: { ...env, [ASTRA_REPORT_MODEL_ENV]: "google/gemini-3.5-flash" },
  fetchImpl: geminiProvider.fetchImpl
});
assert.equal(geminiCompleted.status, "completed");
assert.equal(geminiCompleted.generationMetadata?.reasoningEffort, "minimal");
for (const body of geminiProvider.requestBodies) assert.deepEqual(body.reasoning, { effort: "minimal" });

for (const model of ["moonshotai/kimi-k2.5", "z-ai/glm-4.7-flash"]) {
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
const falseTiming = await buildAstrologyReportResultAsync(request, { env, fetchImpl: timingProvider.fetchImpl });
assert.equal(falseTiming.status, "failed");
assert.ok(falseTiming.generationMetadata?.sections?.some((section) => section.acceptedText?.length));
assert.match(falseTiming.error ?? "", /must not imply current timing|must not imply current timing without dated evidence|must not imply current timing/);
assert.equal(falseTiming.generationMetadata?.orchestration, "sectioned-v1");
assert.equal(falseTiming.generationMetadata?.attemptCount, 12);
assert.equal(falseTiming.generationMetadata?.sections?.length, 9);
const failedIntegration = falseTiming.generationMetadata?.sections?.find((section) => section.title === "Integration");
assert.equal(failedIntegration?.attemptCount, 3);
assert.equal(failedIntegration?.failures?.length, 3);
assert.deepEqual(failedIntegration?.failures?.map((failure) => failure.issues[0]?.code), ["natal_timing", "natal_timing", "natal_timing"]);
assert.ok(failedIntegration?.failures?.every((failure) => /This natal pattern is currently active/.test(failure.rejectedText ?? "")));
assert.doesNotMatch(JSON.stringify(falseTiming.sections), /This natal pattern is currently active/);
assert.ok((falseTiming.generationMetadata?.estimatedSpend ?? -1) >= 0);
assert.equal(timingProvider.calls.get("Integration"), 3);
for (const title of headings.filter((heading) => heading !== "Integration")) assert.equal(timingProvider.calls.get(title), 1);

const subjectLabelProvider = sectionedProvider({ thirdPersonFailure: true });
const correctedSubjectLabel = await buildAstrologyReportResultAsync(request, { env, fetchImpl: subjectLabelProvider.fetchImpl });
assert.equal(correctedSubjectLabel.status, "completed");
assert.equal(correctedSubjectLabel.generationMetadata?.attemptCount, 11);
const relationshipMetadata = correctedSubjectLabel.generationMetadata?.sections?.find((section) => section.title === "Relationships");
assert.equal(relationshipMetadata?.attemptCount, 2);
assert.equal(relationshipMetadata?.failures?.[0]?.issues[0]?.code, "third_person_subject");
assert.match(relationshipMetadata?.failures?.[0]?.rejectedText ?? "", /This person tends to hide/);
assert.match(subjectLabelProvider.prompts.get("Relationships")?.[1] ?? "", /address the report subject as you or your/);
assert.match(correctedSubjectLabel.sections.find((section) => section.title === "Relationships")?.body ?? "", /The person you choose/);

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

const simpleReading = measureReportReadability("You see the problem. You name it. Then you choose what to do next.");
const denseReading = measureReportReadability("Interpersonal differentiation requires sustained psychological interpretation and multidimensional contextualization before meaningful reconciliation becomes conceivable.");
assert.ok(simpleReading.fleschKincaidGrade < denseReading.fleschKincaidGrade);
assert.ok(simpleReading.fleschReadingEase > denseReading.fleschReadingEase);

console.log("Sectioned Deep Report concurrency, retry, retained prose, Plainspoken readability, depth, metadata, and natal timing checks passed.");
