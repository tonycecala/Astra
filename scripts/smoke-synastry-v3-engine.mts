import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_OPENAI_API_KEY_ENV,
  ASTRA_OPENROUTER_API_KEY_ENV,
  ASTRA_OPENROUTER_BASE_URL_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROVIDER_ENV,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  OPENROUTER_REPORT_MODEL_PROVIDER,
  ASTRA_SYNASTRY_V3_PROMPT_VERSION,
  buildSynastryV3Prompt,
  buildSynastryV3SemanticPrompt,
  buildAstrologyReportResultAsync,
  synastryToneSnapshot,
  synastryV3Headings
} from "@astra/astrology";
import { astrologyReportRequestSchema, recordAstrologyReportResultSchema } from "@astra/contracts";
import { reportModelTimeoutMsFor } from "../packages/astrology/src/report/providerUsage";

if (reportModelTimeoutMsFor("synastry", 90_000, 240_000) !== 240_000) {
  throw new Error("Long-form Synastry V3.1 generation must use the bounded deep-report timeout.");
}

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
const smokeEvidence = [{ id: "S01", label: "bond", meaning: "A direct relational signal supports emotional recognition.", evidenceJobs: ["smoke"] }];
const loverPrompt = buildSynastryV3Prompt({ readerName: "Tony", allyName: "Partner", tone, evidenceIndex: smokeEvidence });
if (!loverPrompt.includes("A Lover request invites exploration of romantic interest.") || !loverPrompt.includes("the pull can be mutual")) throw new Error("V3.6 writer prompt lost Lover or shared possibility guidance.");
const semanticPrompt = buildSynastryV3SemanticPrompt({ portrait: "The pull can be mutual, and Partner may feel seen.", evidenceIndex: smokeEvidence });
if (!semanticPrompt.includes("the pull can be mutual") || !semanticPrompt.includes("Distinguish 'the pull can be mutual' from 'the pull is mutual.'")) throw new Error("V3.6 semantic prompt lost shared possibility guidance.");
for (const relationship of ["Family", "Business", "Public Figure"] as const) {
  const prompt = buildSynastryV3Prompt({ readerName: "Tony", allyName: "Partner", tone: synastryToneSnapshot({ allyId: `ally_${relationship}`, relationship }), evidenceIndex: smokeEvidence });
  if (prompt.includes("A Lover request invites exploration of romantic interest.")) throw new Error(`${relationship} prompt incorrectly received Lover-only context.`);
}
function portraitBlock(editorialPhrase = "Partner remains independently present") {
  const sections = headings.map((heading, index) => {
    const words = `${index === 0 ? "The pull can feel immediate, and Partner may feel seen. " : ""}${editorialPhrase}, while the relationship between you develops its own feeling and hidden consequence.`.trim().split(/\s+/);
    while (words.length < 240) words.push("feeling");
    return `## ${heading}\n\n${words.join(" ")}`;
  });
  const trace = headings.map((chapter) => ({
    chapter,
    paragraphIndex: 1,
    evidenceIds: ["S01"],
    mechanism: "Emotional recognition creates quick interpersonal legibility.",
    livedExpression: "If active, each person may feel unusually understood.",
    relationalConsequence: "The potential can open closeness or complicate pacing.",
    supportedFeeling: "mutual recognition"
  }));
  return `<portrait_markdown>\n# Tony + Partner\n\n${sections.join("\n\n")}\n</portrait_markdown>\n<evidence_trace_json>\n${JSON.stringify(trace)}\n</evidence_trace_json>`;
}

let calls = 0;
const successfulFetch: typeof fetch = async (_url, init) => {
  calls += 1;
  const body = JSON.parse(String(init?.body)) as { input?: string; max_output_tokens?: number };
  if (calls === 1) {
    if (!body.input?.includes("Private Evidence packet:") || !body.input.includes("S01")) throw new Error("Writer did not receive the stable selected packet.");
    if (/saved report|complete inventory/i.test(body.input)) throw new Error("Writer prompt referenced forbidden input.");
    if (body.max_output_tokens !== 8_000) throw new Error("V3.1 writer must reserve capacity for both portrait prose and its private paragraph trace.");
    if (!body.input.includes("give each paragraph only the astrology it needs") || !body.input.includes("begin a paragraph with astrology")) {
      throw new Error("V3.1.1 prompt did not preserve the psychology-first occasional-aspect allowance.");
    }
    if (!body.input.includes('Every prose paragraph must address Tony as "you" or "your,"')) {
      throw new Error("V3.1.1 prompt did not keep the selected reader in second person paragraph by paragraph.");
    }
    if (!body.input.includes("A Lover request invites exploration of romantic interest.") || !body.input.includes("the pull can be mutual")) {
      throw new Error("V3.6 writer request did not propagate possibility guidance.");
    }
    return new Response(JSON.stringify({ output_text: portraitBlock(), usage: { input_tokens: 100, output_tokens: 800, total_tokens: 900 } }), { headers: { "content-type": "application/json" } });
  }
  if (body.max_output_tokens !== 1_400) throw new Error("Semantic support call must use the 1,400-token ceiling.");
  if (!body.input?.includes("Partner remains independently present")) throw new Error("Semantic support must review the writer portrait directly.");
  if (!body.input?.includes("Distinguish 'the pull can be mutual' from 'the pull is mutual.'")) {
    throw new Error("V3.6 semantic-review request did not propagate possibility guidance.");
  }
  return new Response(JSON.stringify({ output_text: JSON.stringify({ supportedClaims: ["mutual recognition"], unsupportedClaims: [], severity: "none" }), usage: { input_tokens: 90, output_tokens: 100, total_tokens: 190 } }), { headers: { "content-type": "application/json" } });
};

const result = await buildAstrologyReportResultAsync(request, { env, fetchImpl: successfulFetch });
if (result.status !== "completed" || result.sections.length !== 6 || calls !== 2) throw new Error(`V3 engine did not complete its writer and independent semantic check: ${result.error ?? "unknown"}`);
const v3 = result.generationMetadata?.synastryV3;
if (!v3 || v3.schemaVersion !== 2 || v3.sourceReportIds.length || !v3.validation.greenLight || v3.chapterTrace.length !== 6) throw new Error("V3.1 immutable result metadata was incomplete.");
if (result.generationMetadata?.promptVersion !== ASTRA_SYNASTRY_V3_PROMPT_VERSION) throw new Error("V3.1 prompt version was not persisted.");
if (v3.editor !== undefined) throw new Error("New Synastry results must not contain editor metadata.");
if (result.generationMetadata?.inputTokens !== 190 || result.generationMetadata?.outputTokens !== 900) throw new Error("Usage must include only writer and semantic reviewer.");
if (!result.sections.some((section) => section.body.includes("Partner remains independently present"))) throw new Error("Accepted Synastry result did not preserve writer output.");
if (result.sections.some((section) => /\b(?:Venus|aspect|S\d{2})\b/i.test(section.body))) throw new Error("Technical astrology leaked into V3 portrait prose.");
if (/\b(?:zodiac|chart|aspect)\b/i.test(result.publicSignal?.summary ?? "")) throw new Error("Technical astrology leaked into the V3 public signal.");

const reciprocalRequest = astrologyReportRequestSchema.parse({
  ...request,
  id: "synastry_v3_reciprocal_engine_smoke",
  chartRequestId: request.reportBasis?.partner?.chartRequestId,
  subjectName: "Partner",
  birthData: request.reportBasis?.partner?.birthData,
  source: "ally",
  reportBasis: request.reportBasis?.partner
    ? {
        ...request.reportBasis,
        primary: request.reportBasis.partner,
        partner: request.reportBasis.primary
      }
    : undefined
});
const reciprocalHeadings = synastryV3Headings(tone, "Tony");
let reciprocalCalls = 0;
let reciprocalPortraitOutput = "";
const reciprocalFetch: typeof fetch = async (_url, init) => {
  reciprocalCalls += 1;
  const body = JSON.parse(String(init?.body)) as { input?: string; max_output_tokens?: number };
  if (reciprocalCalls === 1) {
    if (!body.input?.includes('The selected reader is Partner; address Partner only as "you". The Ally is Tony.')) {
      throw new Error("The reciprocal writer prompt did not preserve the selected comparison reader.");
    }
    const sections = reciprocalHeadings.map((heading, index) => {
      const words = `${index === 0 ? "Romantic sexual desire feels immediate. " : ""}Tony remains independently present, while the relationship between you develops its own feeling and hidden consequence.`.trim().split(/\s+/);
      while (words.length < 240) words.push("feeling");
      return `## ${heading}\n\n${words.join(" ")}`;
    });
    const trace = reciprocalHeadings.map((chapter) => ({
      chapter,
      paragraphIndex: 1,
      evidenceIds: ["S01"],
      mechanism: "Recognition creates quick interpersonal legibility.",
      livedExpression: "If active, each person may feel understood.",
      relationalConsequence: "The potential can open closeness or complicate pacing.",
      supportedFeeling: "mutual recognition"
    }));
    reciprocalPortraitOutput = `<portrait_markdown>\n# Partner + Tony\n\n${sections.join("\n\n")}\n</portrait_markdown>\n<evidence_trace_json>\n${JSON.stringify(trace)}\n</evidence_trace_json>`;
    return new Response(JSON.stringify({ output_text: reciprocalPortraitOutput }), { headers: { "content-type": "application/json" } });
  }
  if (body.max_output_tokens !== 1_400) throw new Error("Reciprocal semantic call must use the 1,400-token ceiling.");
  return new Response(JSON.stringify({ output_text: JSON.stringify({ supportedClaims: ["mutual recognition"], unsupportedClaims: [], severity: "none" }) }), { headers: { "content-type": "application/json" } });
};
const reciprocalResult = await buildAstrologyReportResultAsync(reciprocalRequest, { env, fetchImpl: reciprocalFetch });
if (reciprocalResult.status !== "completed" || reciprocalCalls !== 2 || reciprocalResult.sections.some((section) => /\bPartner\b/.test(section.body))) {
  throw new Error("V3 did not preserve the comparison reader as you through generation and validation.");
}

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

let unavailableCalls = 0;
const unavailableSemanticFetch: typeof fetch = async (_url, init) => {
  unavailableCalls += 1;
  if (unavailableCalls === 1) return new Response(JSON.stringify({ output_text: portraitBlock() }), { headers: { "content-type": "application/json" } });
  const body = JSON.parse(String(init?.body)) as { max_output_tokens?: number };
  if (body.max_output_tokens !== 1_400) throw new Error("Reviewer-only retry changed its token ceiling.");
  return new Response(JSON.stringify({ output_text: "reviewer prose without JSON" }), { headers: { "content-type": "application/json" } });
};
const reviewerUnavailable = await buildAstrologyReportResultAsync(request, { env, fetchImpl: unavailableSemanticFetch });
if (reviewerUnavailable.status !== "completed" || unavailableCalls !== 3) {
  throw new Error("A semantic-reviewer formatting failure must not discard a deterministically accepted report.");
}
if (reviewerUnavailable.generationMetadata?.synastryV3?.semanticSupport?.reviewStatus !== "unavailable") {
  throw new Error("Semantic-reviewer unavailability must remain visible in private metadata.");
}
if (!reviewerUnavailable.generationMetadata?.reviewNotes?.some((note) => note.code === "provider_no_text")) {
  throw new Error("Semantic-reviewer unavailability must create a private review note.");
}

const openRouterEnv = {
  [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
  [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
  [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
  [ASTRA_REPORT_MODEL_ENV]: "anthropic/claude-sonnet-4.6",
  [ASTRA_OPENROUTER_API_KEY_ENV]: "test-key",
  [ASTRA_OPENROUTER_BASE_URL_ENV]: "https://openrouter.test/v1"
};
let openRouterCalls = 0;
const openRouterFetch: typeof fetch = async (_url, init) => {
  openRouterCalls += 1;
  const body = JSON.parse(String(init?.body)) as {
    model?: string;
    max_tokens?: number;
    reasoning?: { enabled?: boolean; effort?: string };
    provider?: { only?: string[]; allow_fallbacks?: boolean; data_collection?: string; zdr?: boolean };
    messages?: Array<{ content?: string }>;
  };
  const prompt = body.messages?.[0]?.content ?? "";
  const expectedProvider = "amazon-bedrock/global";
  if (!body.provider || body.provider.only?.[0] !== expectedProvider || body.provider.allow_fallbacks !== false || body.provider.data_collection !== "deny" || body.provider.zdr !== true) {
    throw new Error("OpenRouter Synastry calls must be pinned to private Amazon Bedrock with fallback and collection disabled.");
  }
  if (openRouterCalls === 1) {
    if (body.model !== "anthropic/claude-sonnet-4.6") throw new Error("OpenRouter Synastry writer must use Sonnet 4.6.");
    if (body.max_tokens !== 8_000) throw new Error(`OpenRouter Synastry writer settings changed: ${body.max_tokens}`);
    return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ message: { content: portraitBlock() }, finish_reason: "stop" }], usage: { prompt_tokens: 100, completion_tokens: 800, total_tokens: 900, cost: 0.01 } }), { headers: { "content-type": "application/json" } });
  }
  if (body.model !== "anthropic/claude-sonnet-4.6" || body.max_tokens !== 1_400 || !prompt.includes("Partner remains independently present")) throw new Error("OpenRouter semantic reviewer did not inspect the original Sonnet portrait.");
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ message: { content: JSON.stringify({ supportedClaims: ["mutual recognition"], unsupportedClaims: [], severity: "none" }) }, finish_reason: "stop" }], usage: { prompt_tokens: 90, completion_tokens: 100, total_tokens: 190, cost: 0.003 } }), { headers: { "content-type": "application/json" } });
};
const openRouterResult = await buildAstrologyReportResultAsync(request, { env: openRouterEnv, fetchImpl: openRouterFetch });
if (openRouterResult.status !== "completed" || openRouterCalls !== 2) throw new Error(`OpenRouter Synastry writer-review flow did not complete in two calls: ${openRouterResult.status}/${openRouterCalls}/${openRouterResult.error ?? "no error"}`);
if (openRouterResult.generationMetadata?.synastryV3?.editor !== undefined) throw new Error("Removed editor metadata appeared in a new result.");
if (Math.abs((openRouterResult.generationMetadata?.estimatedSpend ?? 0) - 0.013) > 1e-12) throw new Error("Total Synastry cost must include only writer and semantic review.");

// Persisted historical editor metadata remains readable; new results omit it.
const historical = recordAstrologyReportResultSchema.parse({ ...result, generationMetadata: {
  ...result.generationMetadata, synastryV3: { ...v3, editor: {
    model: "historical-editor", promptVersion: "historical-version", latencyMs: 1, estimatedSpend: 0.02
  } }
} });
if (historical.generationMetadata?.synastryV3?.editor?.model !== "historical-editor") throw new Error("Historical editor metadata must remain readable.");

let severeCalls = 0;
const severeResult = await buildAstrologyReportResultAsync(request, { env, fetchImpl: async (_url, init) => {
  severeCalls++;
  const body = JSON.parse(String(init?.body));
  if (body.max_output_tokens === 8_000) return new Response(JSON.stringify({ output_text: portraitBlock() }));
  if (body.max_output_tokens !== 1_400) throw new Error("Unexpected stage in writer-review retry.");
  return new Response(JSON.stringify({ output_text: JSON.stringify({ supportedClaims: [], unsupportedClaims: ["Invented relationship history"], severity: "severe" }) }));
} });
if (severeResult.status !== "failed" || severeCalls !== 4) throw new Error("Severe semantic failure must trigger only one writer-review retry, then fail.");
if (severeResult.generationMetadata?.failures?.length !== 2 || severeResult.generationMetadata.failures.some(f => f.rejectedText !== portraitBlock())) throw new Error("Semantic failures must preserve the rejected writer output.");

console.log("Synastry engine smoke passed for two-call writer-review orchestration, reciprocal perspective, reviewer-only retry, malformed writer fail-closed behavior, and usage without an editor.");
