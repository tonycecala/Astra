import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_OPENAI_API_KEY_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROVIDER_ENV,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  buildAstrologyReportResultAsync,
  synastryToneSnapshot,
  synastryV3Headings
} from "@astra/astrology";
import { astrologyReportRequestSchema } from "@astra/contracts";

const tone = synastryToneSnapshot({ allyId: "ally_partner", relationship: "Lover" });
const request = astrologyReportRequestSchema.parse({
  id: "synastry_v3_engine_smoke",
  userId: "synastry_v3_user",
  chartRequestId: "chart_primary",
  reportType: "synastry",
  subjectName: "Tony",
  birthData: { date: "1961-05-23", time: "09:30", timezone: "America/New_York", location: "New York, NY, USA", latitude: 40.7128, longitude: -74.006 },
  context: { synastryTone: tone },
  source: "self",
  boundary: "private",
  status: "queued",
  costCredits: 0,
  reportBasis: {
    schemaVersion: 2,
    type: "synastry",
    chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
    primary: {
      chartRequestId: "chart_primary", subjectType: "self", subjectId: "synastry_v3_user", subjectName: "Tony", calculationMode: "full",
      birthData: { date: "1961-05-23", time: "09:30", timezone: "America/New_York", location: "New York, NY, USA", latitude: 40.7128, longitude: -74.006 }
    },
    partner: {
      chartRequestId: "chart_partner", subjectType: "ally", subjectId: "ally_partner", subjectName: "Partner", calculationMode: "full",
      birthData: { date: "1964-09-08", time: "14:15", timezone: "America/Chicago", location: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 }
    }
  },
  createdAt: "2026-07-31T00:00:00.000Z",
  updatedAt: "2026-07-31T00:00:00.000Z"
});

const env = {
  [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
  [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
  [ASTRA_REPORT_MODEL_PROVIDER_ENV]: "openai",
  [ASTRA_REPORT_MODEL_ENV]: "gpt-5.2",
  [ASTRA_OPENAI_API_KEY_ENV]: "test-key"
};

const headings = synastryV3Headings(tone, "Partner");
function portraitBlock() {
  const sections = headings.map((heading, index) => {
    const words = `${index === 0 ? "Romantic sexual desire feels immediate. " : ""}Partner remains independently present, while the relationship between you develops its own feeling and hidden consequence.`.trim().split(/\s+/);
    while (words.length < 240) words.push("feeling");
    return `## ${heading}\n\n${words.join(" ")}`;
  });
  const trace = headings.map((chapter) => ({ chapter, evidenceIds: ["S01"], supportedFeeling: "mutual recognition" }));
  return `<portrait_markdown>\n# Tony + Partner\n\n${sections.join("\n\n")}\n</portrait_markdown>\n<evidence_trace_json>\n${JSON.stringify(trace)}\n</evidence_trace_json>`;
}

let calls = 0;
const successfulFetch: typeof fetch = async (_url, init) => {
  calls += 1;
  const body = JSON.parse(String(init?.body)) as { input?: string; max_output_tokens?: number };
  if (calls === 1) {
    if (!body.input?.includes("Private Evidence packet:") || !body.input.includes("S01")) throw new Error("Writer did not receive the stable selected packet.");
    if (/saved report|complete inventory/i.test(body.input)) throw new Error("Writer prompt referenced forbidden input.");
    return new Response(JSON.stringify({ output_text: portraitBlock() }), { headers: { "content-type": "application/json" } });
  }
  if (body.max_output_tokens !== 700) throw new Error("Semantic support call must use the 700-token ceiling.");
  return new Response(JSON.stringify({ output_text: JSON.stringify({ supportedClaims: ["mutual recognition"], unsupportedClaims: [], severity: "none" }) }), { headers: { "content-type": "application/json" } });
};

const result = await buildAstrologyReportResultAsync(request, { env, fetchImpl: successfulFetch });
if (result.status !== "completed" || result.sections.length !== 6 || calls !== 2) throw new Error(`V3 engine did not complete its writer and independent semantic check: ${result.error ?? "unknown"}`);
const v3 = result.generationMetadata?.synastryV3;
if (!v3 || v3.sourceReportIds.length || !v3.validation.greenLight || v3.chapterTrace.length !== 6) throw new Error("V3 immutable result metadata was incomplete.");
if (result.sections.some((section) => /\b(?:Venus|aspect|S\d{2})\b/i.test(section.body))) throw new Error("Technical astrology leaked into V3 portrait prose.");
if (/\b(?:zodiac|chart|aspect)\b/i.test(result.publicSignal?.summary ?? "")) throw new Error("Technical astrology leaked into the V3 public signal.");

let failedCalls = 0;
const malformedFetch: typeof fetch = async () => {
  failedCalls += 1;
  return new Response(JSON.stringify({ output_text: "malformed" }), { headers: { "content-type": "application/json" } });
};
const failed = await buildAstrologyReportResultAsync(request, { env, fetchImpl: malformedFetch });
if (failed.status !== "failed" || failedCalls !== 2) throw new Error("V3 must make exactly one corrective retry, then fail closed.");
if (failed.generationMetadata?.failures?.length !== 2 || failed.generationMetadata.failures.some((failure) => failure.rejectedText !== "malformed")) {
  throw new Error("Rejected V3 attempts must remain in private generation metadata.");
}

console.log("Synastry V3 engine smoke passed for direct packet input, private metadata, semantic support, and one retry.");
