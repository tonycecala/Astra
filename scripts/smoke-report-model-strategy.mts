import assert from "node:assert/strict";
import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROFILE_ENV,
  ASTRA_REPORT_MODEL_PROVIDER_ENV,
  ASTRA_REPORT_PROMPT_VERSION,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  OPENROUTER_REPORT_MODEL_PROVIDER,
  buildAstrologyReportResult,
  buildAstrologyReportResultAsync,
  resolveAstrologyReportGenerationConfig,
  resolveAstrologyReportGenerationConfigForRequest,
  reportModelProfileModels
} from "@astra/astrology";
import { astrologyReportRequestSchema, type AstrologyReportRequest } from "@astra/contracts";

const request = astrologyReportRequestSchema.parse({
  id: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  chartRequestId: "33333333-3333-4333-8333-333333333333",
  reportType: "identity",
  subjectName: "Model Strategy Fixture",
  birthData: { date: "1961-05-23", time: "09:30", birthTimeKnown: true, timezone: "America/Chicago", location: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 },
  source: "self",
  status: "queued",
  costCredits: 1,
  reportBasis: {
    schemaVersion: 1,
    type: "natal",
    chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
    primary: {
      chartRequestId: "33333333-3333-4333-8333-333333333333",
      subjectType: "self",
      subjectId: "22222222-2222-4222-8222-222222222222",
      subjectName: "Model Strategy Fixture",
      birthData: { date: "1961-05-23", time: "09:30", birthTimeKnown: true, timezone: "America/Chicago", location: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 }
    }
  },
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z"
});

process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = LOCAL_CHART_ROUTINE_ENGINE;
const baseline = buildAstrologyReportResult(request);
const boundedIdentityFixture = "Gemini Sun is the central selected identity fact. It can frame curiosity, adaptability, and the wish to understand experience from more than one angle. This is a measured natal possibility, not a fixed behavior, biography, event, or promise.";
const modelText = baseline.sections.map((section) => `## ${section.title}\n\n${sizedBody(boundedIdentityFixture, 375)}`).join("\n\n");
const welcomeModelText = baseline.sections.map((section) => `## ${section.title}\n\n${sizedBody(boundedIdentityFixture, 300)}`).join("\n\n");
let identityPrompt = "";
let identityReasoning: unknown;
const result = await buildAstrologyReportResultAsync(request, {
  env: {
    [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
    [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
    [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
    [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
    [ASTRA_REPORT_MODEL_ENV]: reportModelProfileModels.production[0],
    ASTRA_OPENROUTER_API_KEY: "test-key"
  },
  fetchImpl: async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as { messages?: Array<{ content?: string }>; reasoning?: unknown };
    identityPrompt = body.messages?.[0]?.content ?? "";
    identityReasoning = body.reasoning;
    return new Response(JSON.stringify({
      choices: [{ message: { content: `${modelText}\nturn_off_thought` } }],
      usage: { prompt_tokens: 1200, completion_tokens: 600, total_tokens: 1800, cost: 0.042 }
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
});

assert.equal(result.status, "completed");
assert.deepEqual(result.generationMetadata, {
  writer: DEBUG_MODEL_REPORT_WRITER,
  provider: OPENROUTER_REPORT_MODEL_PROVIDER,
  model: "anthropic/claude-sonnet-5",
  modelProfile: "production",
  reasoningEffort: "none",
  promptVersion: ASTRA_REPORT_PROMPT_VERSION,
  attemptCount: 1,
  inputTokens: 1200,
  outputTokens: 600,
  totalTokens: 1800,
  estimatedSpend: 0.042,
  latencyMs: result.generationMetadata?.latencyMs,
  orchestration: "monolithic"
});
assert.ok((result.generationMetadata?.latencyMs ?? -1) >= 0);
assert.ok(!result.sections.some((section) => section.body.includes("turn_off_thought")));
assert.deepEqual(identityReasoning, { effort: "none" });
assert.match(identityPrompt, /VOICE MODE: PLAINSPOKEN/);
assert.match(identityPrompt, /6th to 7th grade reading level, aiming near grade 6\.5/);
assert.match(identityPrompt, /Write like a wise farmer/);
assert.match(identityPrompt, /12 to 14 words per sentence on average/);
assert.match(identityPrompt, /Do not use vague figurative phrases/);
assert.match(identityPrompt, /closeness without giving up your own plans, friends, or time/);
assert.match(identityPrompt, /Write each section in 2 or 3 paragraphs/);
assert.match(identityPrompt, /Vary the sentence shape across sections/);
assert.match(identityPrompt, /Identity: target 350-450 words; remain between 325 and 500 words/);

let welcomePrompt = "";
const welcomeResult = await buildAstrologyReportResultAsync(
  { ...request, context: { modelPilot: "gemini-intro-identity" } },
  {
    env: {
      [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
      [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
      [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
      [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
      [ASTRA_REPORT_MODEL_ENV]: reportModelProfileModels.production[0],
      ASTRA_OPENROUTER_API_KEY: "test-key"
    },
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { model?: string; messages?: Array<{ content?: string }>; reasoning?: unknown };
      welcomePrompt = body.messages?.[0]?.content ?? "";
      assert.equal(body.model, "google/gemini-3.5-flash");
      assert.deepEqual(body.reasoning, { effort: "minimal" });
      return new Response(JSON.stringify({
        choices: [{ message: { content: welcomeModelText }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1200, completion_tokens: 600, total_tokens: 1800, cost: 0.042 }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  }
);
assert.equal(welcomeResult.status, "completed");
assert.match(welcomePrompt, /Welcome Report depth rules:/);
assert.match(welcomePrompt, /VOICE MODE: PLAINSPOKEN/);
assert.match(welcomePrompt, /6th to 7th grade reading level, aiming near grade 6\.5/);
assert.match(welcomePrompt, /Write like a wise farmer/);
assert.match(welcomePrompt, /12 to 14 words per sentence on average/);
assert.match(welcomePrompt, /Do not use vague figurative phrases/);
assert.match(welcomePrompt, /warm and lived-in/);
assert.match(welcomePrompt, /Identity section in exactly 3 short paragraphs/);
assert.match(welcomePrompt, /Vary the sentence shape across sections/);

const coreRequest = astrologyReportRequestSchema.parse({
  ...request,
  id: "66666666-6666-4666-8666-666666666666",
  reportType: "core",
  costCredits: 5
});
const progressedRequest = astrologyReportRequestSchema.parse({
  ...request,
  id: "77777777-7777-4777-8777-777777777777",
  reportType: "progressed",
  costCredits: 5,
  reportBasis: { ...request.reportBasis, type: "progressed", asOfDate: "2026-07-17" }
});
const synastryRequest = astrologyReportRequestSchema.parse({
  ...request,
  id: "88888888-8888-4888-8888-888888888888",
  reportType: "synastry",
  costCredits: 10,
  reportBasis: {
    ...request.reportBasis,
    type: "synastry",
    partner: {
      chartRequestId: "99999999-9999-4999-8999-999999999999",
      subjectType: "ally",
      subjectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      subjectName: "Prompt Contract Partner",
      birthData: { date: "1978-11-12", time: "11:00", birthTimeKnown: true, timezone: "America/Chicago", location: "Galveston, TX, USA", latitude: 29.3057, longitude: -94.7933 }
    }
  }
});

const corePrompt = await completedPromptFor(coreRequest, { Identity: 375, Relationships: 250, Work: 250, Integration: 200 });
assert.match(corePrompt, /Identity: target 350-425 words; remain between 325 and 475 words/);
assert.match(corePrompt, /Relationships: target 225-300 words; remain between 200 and 340 words/);
assert.match(corePrompt, /Core earns its value through four distinct chapters/);

const progressedPrompt = await completedPromptFor(progressedRequest, { "Current Chapter": 250, "Progressed Sun": 225, "Progressed Moon": 225, Integration: 180 });
assert.match(progressedPrompt, /Current Chapter: target 225-300 words; remain between 200 and 340 words/);
assert.match(progressedPrompt, /Integration: target 150-225 words; remain between 140 and 260 words/);

const synastryPrompt = await completedPromptFor(synastryRequest, { Attraction: 225, Friction: 225, Communication: 225, Stability: 225 });
assert.match(synastryPrompt, /Attraction: target 200-275 words; remain between 175 and 315 words/);
assert.match(synastryPrompt, /Stability: target 200-275 words; remain between 175 and 315 words/);

const undersizedCore = await modelResultFor(coreRequest, Object.fromEntries(buildAstrologyReportResult(coreRequest).sections.map((section) => [section.title, 100])));
assert.equal(undersizedCore.result.status, "failed");
assert.match(undersizedCore.result.error ?? "", /Identity must be at least 325 words/);
assert.match(undersizedCore.result.error ?? "", /Integration must be at least 150 words/);

const truncatedResult = await buildAstrologyReportResultAsync(request, {
    env: {
      [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
      [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
      [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
      [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
      [ASTRA_REPORT_MODEL_ENV]: reportModelProfileModels.production[0],
      ASTRA_OPENROUTER_API_KEY: "test-key"
    },
    fetchImpl: async () => new Response(JSON.stringify({
      choices: [{ message: { content: modelText }, finish_reason: "length" }],
      usage: { prompt_tokens: 1200, completion_tokens: 600, total_tokens: 1800, cost: 0.042 }
    }), { status: 200, headers: { "content-type": "application/json" } })
  });
assert.equal(truncatedResult.status, "failed");
assert.match(truncatedResult.error ?? "", /Writer response reached its output limit/);
assert.equal(truncatedResult.generationMetadata?.attemptCount, 3);
assert.equal(truncatedResult.generationMetadata?.failures?.length, 3);
assert.match(truncatedResult.generationMetadata?.failures?.[0]?.rejectedText ?? "", /## Identity/);
assert.equal(truncatedResult.generationMetadata?.failures?.[0]?.issues[0]?.code, "above_maximum");
assert.deepEqual(reportModelProfileModels.production, ["anthropic/claude-sonnet-5", "google/gemini-3.5-flash"]);
assert.deepEqual(
  resolveAstrologyReportGenerationConfig({
    [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production"
  }),
  {
    ephemerisEngine: undefined,
    reportWriter: "local-deterministic-writer",
    reportModelProfile: "production",
    reportModelProvider: OPENROUTER_REPORT_MODEL_PROVIDER,
    reportModel: "anthropic/claude-sonnet-5",
    openaiApiKey: undefined,
    openRouterApiKey: undefined,
    openRouterBaseUrl: "https://openrouter.ai/api/v1"
  }
);
assert.equal(
  resolveAstrologyReportGenerationConfig({
    [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
    [ASTRA_REPORT_MODEL_ENV]: "google/gemini-3.5-flash"
  }).reportModel,
  "google/gemini-3.5-flash"
);
assert.equal(
  resolveAstrologyReportGenerationConfigForRequest(
    { ...request, context: { modelPilot: "gemini-intro-identity" } },
    {
      [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
      [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
      [ASTRA_REPORT_MODEL_ENV]: "anthropic/claude-sonnet-5"
    }
  ).reportModel,
  "google/gemini-3.5-flash"
);
assert.equal(
  resolveAstrologyReportGenerationConfigForRequest(
    request,
    {
      [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
      [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
      [ASTRA_REPORT_MODEL_ENV]: "anthropic/claude-sonnet-5"
    }
  ).reportModel,
  "anthropic/claude-sonnet-5"
);
assert.ok(reportModelProfileModels.premium_bakeoff.includes("openai/gpt-5.6-sol"));
assert.ok(reportModelProfileModels.premium_bakeoff.includes("anthropic/claude-opus-4.8"));
assert.ok(reportModelProfileModels.premium_bakeoff.includes("google/gemini-2.5-flash-lite"));
assert.ok(reportModelProfileModels.premium_bakeoff.includes("moonshotai/kimi-k2.5"));
assert.ok(!reportModelProfileModels.production.includes("moonshotai/kimi-k2.5"));
assert.ok(!reportModelProfileModels.production.includes("google/gemini-2.5-flash-lite"));
assert.ok(!reportModelProfileModels.premium_bakeoff.includes("z-ai/glm-4.7-flash"));

console.log("July 2026 report model strategy smoke checks passed.");

function sizedBody(value: string, targetWords: number) {
  const source = value.trim().split(/\s+/).filter(Boolean);
  const words: string[] = [];
  while (words.length < targetWords) words.push(...source);
  const selected = words.slice(0, targetWords);
  const firstBreak = Math.floor(targetWords / 3);
  const secondBreak = Math.floor((targetWords * 2) / 3);
  return selected
    .map((word, index) => index === firstBreak || index === secondBreak ? `\n\n${word}` : word)
    .join(" ")
    .replace(/[.!?]*$/, ".");
}

async function completedPromptFor(input: AstrologyReportRequest, sectionWords: Record<string, number>) {
  const generated = await modelResultFor(input, sectionWords);
  assert.equal(generated.result.status, "completed", generated.result.error);
  return generated.prompt;
}

async function modelResultFor(input: AstrologyReportRequest, sectionWords: Record<string, number>) {
  const deterministic = buildAstrologyReportResult(input);
  const content = deterministic.sections.map((section) => {
    const fixture = section.title === "Identity"
      ? boundedIdentityFixture
      : "This chapter offers a measured interpretation from the selected evidence. You can treat the description as a possibility to consider, not as fixed behavior, biography, current timing, another person's inner state, or a promised outcome.";
    return `## ${section.title}\n\n${sizedBody(fixture, sectionWords[section.title] ?? 200)}`;
  }).join("\n\n");
  let prompt = "";
  const result = await buildAstrologyReportResultAsync(input, {
    env: {
      [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
      [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
      [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
      [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
      [ASTRA_REPORT_MODEL_ENV]: reportModelProfileModels.production[0],
      ASTRA_OPENROUTER_API_KEY: "test-key"
    },
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { messages?: Array<{ content?: string }> };
      prompt ||= body.messages?.[0]?.content ?? "";
      return new Response(JSON.stringify({
        choices: [{ message: { content }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1200, completion_tokens: 600, total_tokens: 1800, cost: 0.042 }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });
  return { prompt, result };
}
