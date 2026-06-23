import {
  ASTRA_DEFAULT_HOUSE_SYSTEM,
  ASTRA_DEFAULT_ZODIAC_MODE,
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_OPENAI_API_KEY_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROVIDER_ENV,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  LOCAL_DETERMINISTIC_REPORT_WRITER,
  buildAstrologyReportResult,
  buildAstrologyReportResultAsync
} from "@astra/astrology";
import { astrologyReportRequestSchema } from "@astra/contracts";

const reportRequest = astrologyReportRequestSchema.parse({
  id: "astrology_engine_smoke",
  userId: "astrology_engine_smoke_user",
  reportType: "core_self",
  subjectName: "Tony C",
  birthData: {
    date: "1961-05-23",
    time: "09:30",
    timezone: "America/New_York",
    location: "New York, NY, USA",
    latitude: 40.7128,
    longitude: -74.006
  },
  question: "What should this report preserve?",
  intent: "astrology-engine-smoke",
  source: "self",
  boundary: "private",
  status: "queued",
  costCredits: 0,
  createdAt: "2026-06-16T00:00:00.000Z",
  updatedAt: "2026-06-16T00:00:00.000Z"
});

const einsteinPublicRequest = astrologyReportRequestSchema.parse({
  id: "astrology_engine_public_einstein_smoke",
  userId: "astrology_engine_smoke_public_user",
  reportType: "core_self",
  subjectName: "Albert Einstein",
  birthData: {
    date: "1879-03-14",
    time: "11:30",
    timezone: "Europe/Berlin",
    location: "Ulm, Germany",
    latitude: 48.4011,
    longitude: 9.9876
  },
  question: "What should this public sample preserve?",
  intent: "public-sample-engine-smoke",
  context: {
    source: "Astria public data",
    sourceUrl: "https://www.astro.com/astro-databank/Einstein,_Albert",
    roddenRating: "AA"
  },
  source: "import",
  boundary: "private",
  status: "queued",
  costCredits: 0,
  createdAt: "2026-06-16T00:00:00.000Z",
  updatedAt: "2026-06-16T00:00:00.000Z"
});

const previousEngine = process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
const previousWriter = process.env[ASTRA_REPORT_WRITER_ENV];
const previousModelProvider = process.env[ASTRA_REPORT_MODEL_PROVIDER_ENV];
const previousModel = process.env[ASTRA_REPORT_MODEL_ENV];
const previousOpenAIKey = process.env[ASTRA_OPENAI_API_KEY_ENV];

delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
const unavailable = buildAstrologyReportResult(reportRequest);
if (unavailable.status !== "failed") {
  throw new Error("Unconfigured astrology engine must fail explicitly.");
}
if (!unavailable.error?.includes(ASTRA_EPHEMERIS_ENGINE_ENV)) {
  throw new Error(`Unconfigured astrology engine error must name ${ASTRA_EPHEMERIS_ENGINE_ENV}.`);
}

process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = LOCAL_CHART_ROUTINE_ENGINE;
process.env[ASTRA_REPORT_WRITER_ENV] = LOCAL_DETERMINISTIC_REPORT_WRITER;
const completed = buildAstrologyReportResult(reportRequest);
if (completed.status !== "completed") {
  throw new Error("Configured local astronomy engine should complete the report result.");
}
if (completed.engine !== LOCAL_CHART_ROUTINE_ENGINE) {
  throw new Error(`Expected engine ${LOCAL_CHART_ROUTINE_ENGINE}, got ${completed.engine}.`);
}
const expectedSignature = ["Gemini Sun", "Virgo Moon", "Cancer rising"];
const summary = completed.summary ?? "";
for (const phrase of expectedSignature) {
  if (!summary.includes(phrase)) {
    throw new Error(`Expected ${phrase} in report summary, got: ${summary || "missing"}`);
  }
}
if (completed.sections.length < 3) {
  throw new Error("Configured astrology report should include core, planetary, and practice sections.");
}
if (!completed.sections.some((section) => section.body.includes("no LLM call, no paid provider, no credit spend"))) {
  throw new Error("Configured astrology report should prove the non-LLM, non-paid writer route.");
}
if (!completed.provenance.some((entry) => entry.kind === "engine")) {
  throw new Error("Configured astrology report should include engine provenance.");
}
if (!completed.provenance.some((entry) => entry.summary.includes(LOCAL_DETERMINISTIC_REPORT_WRITER))) {
  throw new Error("Configured astrology report should include deterministic writer provenance.");
}
if (completed.publicSignal?.headline !== "Gemini Sun, Virgo Moon, Cancer rising") {
  throw new Error(`Configured astrology report should expose Tony's GEM/VIR/CAN signature, got: ${completed.publicSignal?.headline ?? "missing"}`);
}
if (
  !completed.publicSignal.provenanceSummary.includes(ASTRA_DEFAULT_ZODIAC_MODE) ||
  !completed.publicSignal.provenanceSummary.includes(ASTRA_DEFAULT_HOUSE_SYSTEM)
) {
  throw new Error("Configured astrology report should expose tropical and whole-sign provenance.");
}
if (!completed.publicSignal.provenanceSummary.includes(LOCAL_DETERMINISTIC_REPORT_WRITER)) {
  throw new Error("Configured astrology report should expose deterministic writer provenance in the public signal summary.");
}

const publicCompleted = buildAstrologyReportResult(einsteinPublicRequest);
if (publicCompleted.publicSignal?.headline !== "Pisces Sun, Sagittarius Moon, Cancer rising") {
  throw new Error(
    `Configured astrology report should preserve Einstein's public AA chart signature, got: ${publicCompleted.publicSignal?.headline ?? "missing"}`
  );
}

process.env[ASTRA_REPORT_WRITER_ENV] = "paid-debug-writer";
const unsupportedWriter = buildAstrologyReportResult(reportRequest);
if (unsupportedWriter.status !== "failed" || !unsupportedWriter.error?.includes("paid-debug-writer")) {
  throw new Error("Unsupported report writers must fail before any paid or model-backed route can run.");
}

process.env[ASTRA_REPORT_WRITER_ENV] = DEBUG_MODEL_REPORT_WRITER;
delete process.env[ASTRA_REPORT_MODEL_PROVIDER_ENV];
delete process.env[ASTRA_REPORT_MODEL_ENV];
delete process.env[ASTRA_OPENAI_API_KEY_ENV];
const unconfiguredDebugWriter = await buildAstrologyReportResultAsync(reportRequest);
if (unconfiguredDebugWriter.status !== "failed" || !unconfiguredDebugWriter.error?.includes(ASTRA_REPORT_MODEL_PROVIDER_ENV)) {
  throw new Error("Debug model writer must fail closed when provider/model/key config is missing.");
}
if (unconfiguredDebugWriter.publicSignal) {
  throw new Error("Debug model writer must not expose a public signal when it never called a configured provider.");
}

process.env[ASTRA_REPORT_MODEL_PROVIDER_ENV] = "free-shared-provider";
process.env[ASTRA_REPORT_MODEL_ENV] = "debug-model";
process.env[ASTRA_OPENAI_API_KEY_ENV] = "not-used-for-unsupported-provider";
const unsupportedModelProvider = await buildAstrologyReportResultAsync(reportRequest);
if (unsupportedModelProvider.status !== "failed" || !unsupportedModelProvider.error?.includes("free-shared-provider")) {
  throw new Error("Debug model writer must reject unsupported providers before any model call.");
}

const debugModelEnv = {
  [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
  [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
  [ASTRA_REPORT_MODEL_PROVIDER_ENV]: "openai",
  [ASTRA_REPORT_MODEL_ENV]: "gpt-5.2",
  [ASTRA_OPENAI_API_KEY_ENV]: "test-openai-key"
};

const successfulModelFetch: typeof fetch = async (url, init) => {
  if (String(url) !== "https://api.openai.com/v1/responses") {
    throw new Error(`Debug model writer called unexpected URL: ${String(url)}`);
  }

  const headers = new Headers(init?.headers);
  if (headers.get("authorization") !== "Bearer test-openai-key") {
    throw new Error("Debug model writer did not pass the configured OpenAI key.");
  }

  const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
  if (body.model !== "gpt-5.2" || typeof body.input !== "string" || !body.input.includes("Section signal cards:")) {
    throw new Error("Debug model writer did not send the expected Responses API payload.");
  }

  return new Response(
    JSON.stringify({
      output_text: [
        "# Astra Report - Tony C",
        "",
        "## Identity",
        "",
        [
          "Model draft kept the Gemini/Virgo/Cancer signature for private review. Your Gemini Sun stays tied to the private thinking pattern in the supplied chart notes, while the Virgo Moon and Cancer rising keep the emotional and visible tone grounded in the computed signature. The point is not that you are merely quick or verbal; it is that your mind keeps moving behind the curtain before you decide what is safe enough to say aloud.",
          "That private motion matters because the Virgo Moon gives the report a second organizing intelligence. It turns feeling into observation, conversation, and careful sorting, which can make your emotional life look more contained than it actually is. Cancer rising then changes how the pattern arrives in the room: people may meet sensitivity, caution, and protectiveness first, while the more restless Gemini layer is still deciding how much of itself to reveal.",
          "The tension is useful when it becomes conscious. You can read a situation quickly, name the practical detail that others missed, and still hold enough emotional context to know why that detail matters. The cost is that you may edit yourself until the cleanest sentence replaces the truer one, especially when the chart notes point toward privacy as both a refuge and a habit.",
          "This is where the report has to stay personal rather than generic. The Gemini part needs movement, exchange, and room to test language; the Virgo Moon needs accuracy, order, and evidence that the feeling has been handled responsibly; Cancer rising needs enough safety to let the inner life cross the threshold. When those needs cooperate, the chart reads as someone who can make a precise emotional truth usable without draining it of warmth. That is the tested private-report depth this smoke path is meant to protect.",
          "A useful practice is to notice the moment when a real thought becomes a polished version of itself. That small pause tells you whether discretion is protecting something sacred or simply keeping you from being available. The work is not to become louder; it is to let the right thought arrive with enough warmth and clarity that other people can actually meet you there."
        ].join("\n\n"),
        "",
        "## Relationships",
        "",
        "The model draft names relationship material only from the selected chart signals. It keeps the private section grounded in Venus, Mars, and the report notes instead of trying to rewrite the deterministic public signal.",
        "",
        "## Work",
        "",
        "The model draft stays inside the chart evidence supplied by the section cards. It treats work as an expression of the same Gemini/Virgo/Cancer pattern and does not invent a new public headline.",
        "",
        "## Right Now",
        "",
        "Right now, the model draft adds a private reflection prompt while public signal publishing stays deterministic. It gives the reader one practical sentence without changing the stored public signal summary."
      ].join("\n")
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
};

const debugModelCompleted = await buildAstrologyReportResultAsync(reportRequest, {
  env: debugModelEnv,
  fetchImpl: successfulModelFetch
});
if (debugModelCompleted.status !== "completed") {
  throw new Error(`Debug model writer should complete with a mocked OpenAI response, got ${debugModelCompleted.status}: ${debugModelCompleted.error ?? "no error"}.`);
}
if (!debugModelCompleted.summary?.includes("Model draft kept")) {
  throw new Error("Debug model writer did not preserve the mocked private summary.");
}
if (debugModelCompleted.sections.length !== 4 || !debugModelCompleted.sections.some((section) => section.title === "Right Now")) {
  throw new Error("Debug model writer did not preserve the mocked private sections.");
}
if (debugModelCompleted.publicSignal?.headline !== "Gemini Sun, Virgo Moon, Cancer rising") {
  throw new Error("Debug model writer must preserve the deterministic public signal headline.");
}
if (debugModelCompleted.publicSignal.summary !== completed.publicSignal.summary) {
  throw new Error("Debug model writer must not let model output rewrite the public signal summary.");
}
if (!debugModelCompleted.publicSignal.provenanceSummary.includes(DEBUG_MODEL_REPORT_WRITER)) {
  throw new Error("Debug model writer public provenance should identify the debug writer route.");
}
if (!debugModelCompleted.provenance.some((entry) => entry.summary.includes("openai/gpt-5.2"))) {
  throw new Error("Debug model writer private provenance should record provider and model.");
}

const malformedModelFetch: typeof fetch = async () =>
  new Response(JSON.stringify({ output_text: JSON.stringify({ summary: "Missing required sections." }) }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
const malformedDebugModel = await buildAstrologyReportResultAsync(reportRequest, {
  env: debugModelEnv,
  fetchImpl: malformedModelFetch
});
if (malformedDebugModel.status !== "failed" || malformedDebugModel.publicSignal) {
  throw new Error("Debug model writer must fail privately when model output does not validate.");
}

if (previousEngine === undefined) {
  delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
} else {
  process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = previousEngine;
}
if (previousWriter === undefined) {
  delete process.env[ASTRA_REPORT_WRITER_ENV];
} else {
  process.env[ASTRA_REPORT_WRITER_ENV] = previousWriter;
}
if (previousModelProvider === undefined) {
  delete process.env[ASTRA_REPORT_MODEL_PROVIDER_ENV];
} else {
  process.env[ASTRA_REPORT_MODEL_PROVIDER_ENV] = previousModelProvider;
}
if (previousModel === undefined) {
  delete process.env[ASTRA_REPORT_MODEL_ENV];
} else {
  process.env[ASTRA_REPORT_MODEL_ENV] = previousModel;
}
if (previousOpenAIKey === undefined) {
  delete process.env[ASTRA_OPENAI_API_KEY_ENV];
} else {
  process.env[ASTRA_OPENAI_API_KEY_ENV] = previousOpenAIKey;
}

console.log(`Astrology engine smoke passed with ${LOCAL_CHART_ROUTINE_ENGINE}.`);
