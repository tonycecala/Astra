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
import { astrologyReportRequestSchema } from "@astra/contracts";

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
const modelText = baseline.sections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
const result = await buildAstrologyReportResultAsync(request, {
  env: {
    [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
    [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
    [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
    [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
    [ASTRA_REPORT_MODEL_ENV]: reportModelProfileModels.production[0],
    ASTRA_OPENROUTER_API_KEY: "test-key"
  },
  fetchImpl: async () => new Response(JSON.stringify({
    choices: [{ message: { content: `${modelText}\nturn_off_thought` } }],
    usage: { prompt_tokens: 1200, completion_tokens: 600, total_tokens: 1800, cost: 0.042 }
  }), { status: 200, headers: { "content-type": "application/json" } })
});

assert.equal(result.status, "completed");
assert.deepEqual(result.generationMetadata, {
  writer: DEBUG_MODEL_REPORT_WRITER,
  provider: OPENROUTER_REPORT_MODEL_PROVIDER,
  model: "anthropic/claude-sonnet-5",
  modelProfile: "production",
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
      const body = JSON.parse(String(init?.body)) as { model?: string; messages?: Array<{ content?: string }> };
      welcomePrompt = body.messages?.[0]?.content ?? "";
      assert.equal(body.model, "google/gemini-3.5-flash");
      return new Response(JSON.stringify({
        choices: [{ message: { content: modelText }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1200, completion_tokens: 600, total_tokens: 1800, cost: 0.042 }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  }
);
assert.equal(welcomeResult.status, "completed");
assert.match(welcomePrompt, /Welcome Report rules:/);
assert.match(welcomePrompt, /Write exactly three short paragraphs/);

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
