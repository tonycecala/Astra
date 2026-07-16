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
    choices: [{ message: { content: modelText } }],
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
  latencyMs: result.generationMetadata?.latencyMs
});
assert.ok((result.generationMetadata?.latencyMs ?? -1) >= 0);
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
assert.ok(reportModelProfileModels.premium_bakeoff.includes("openai/gpt-5.6-sol"));
assert.ok(reportModelProfileModels.premium_bakeoff.includes("anthropic/claude-opus-4.8"));

console.log("July 2026 report model strategy smoke checks passed.");
