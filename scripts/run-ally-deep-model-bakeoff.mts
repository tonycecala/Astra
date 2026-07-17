import { randomUUID } from "node:crypto";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { ASTRA_REPORT_PROMPT_VERSION, measureReportReadability, reportModelProfileModels } from "@astra/astrology";
import { hasResolvedBirthCoordinates } from "@astra/contracts";
import { closeDatabaseConnection, db, exportPortableUserData } from "@astra/db";

type JsonObject = Record<string, unknown>;
type PortableBundle = Awaited<ReturnType<typeof exportPortableUserData>>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
const email = (option("--email") || "astramaster@tony.io").trim().toLowerCase();
const subjects = csvOption("--subjects", "Rachel Ijames,Michelle Gruben");
const models = csvOption("--models", "anthropic/claude-sonnet-5,google/gemini-3.5-flash");
const outputDir = resolve(
  option("--output") || `.astra-exports/comparisons/${new Date().toISOString().slice(0, 10)}-ally-deep-model-bakeoff`
);
const generationApproved = process.argv.includes("--generate");
const resumeCompleted = process.argv.includes("--resume");
const reasoningOffCandidates = new Set(["moonshotai/kimi-k2.5", "z-ai/glm-4.7-flash"]);
let cookieHeader = "";

if (process.argv.includes("--help")) {
  console.log("Run private Ally Deep Reports with explicit models and write a blind comparison bundle.");
  console.log("Required: --generate. Optional: --resume, --email, --subjects, --models, --output.");
  process.exit(0);
}

try {
  if (!generationApproved) throw new Error("Use --generate to approve the production-model Deep Report calls.");
  if (!internalToken) throw new Error("ASTRA_INTERNAL_API_TOKEN is required for production-model report generation.");
  if (subjects.length < 1) throw new Error("Provide at least one Ally subject.");
  if (models.length < 2) throw new Error("Provide at least two models for a bakeoff.");
  const supportedBakeoffModels = new Set([...reportModelProfileModels.production, ...reportModelProfileModels.premium_bakeoff]);
  const unsupported = models.filter((model) => !supportedBakeoffModels.has(model));
  if (unsupported.length) throw new Error(`Models are not approved for production or bakeoff replay: ${unsupported.join(", ")}`);
  const reasoningCapabilities = await verifyReasoningCanBeDisabled(models);

  const before = await exportPortableUserData(db, { email, sourceLabel: "ally-deep-model-bakeoff-before" });
  const sources = subjects.map((subject) => sourceChartFor(before, subject));
  await signIn();

  const generated: Array<{ subject: string; model: string; requestId: string }> = [];
  for (const source of sources) {
    for (const model of models) {
      const reusable = resumeCompleted ? latestBakeoffRequest(before, source.subjectName, model) : null;
      if (reusable?.status === "completed") {
        generated.push({ subject: source.subjectName, model, requestId: reusable.requestId });
        continue;
      }
      const requestId = reusable?.requestId ?? await createReportRequest(source);
      const replay = await requestJsonAllowFailure(`${appBaseUrl}/api/admin/replay-report`, {
        method: "POST",
        headers: { "x-astra-internal-token": internalToken },
        body: JSON.stringify({
          requestId,
          reportWriter: "debug-model-writer",
          modelProfile: "premium_bakeoff",
          model
        })
      });
      const result = recordFrom(replay.result);
      if (!new Set(["completed", "failed"]).has(textFrom(result.status))) throw new Error(`${source.subjectName} returned no final result for ${model}.`);
      generated.push({ subject: source.subjectName, model, requestId });
    }
  }

  const after = await exportPortableUserData(db, { email, sourceLabel: "ally-deep-model-bakeoff-after" });
  const records = generated.map((item) => bakeoffRecord(after, item));
  const aliasByModel = blindAliases(models);
  const bundle = records.map((record) => ({
    ...record,
    alias: aliasByModel.get(record.model)!,
    metrics: reportMetrics(record.result)
  }));

  await mkdir(outputDir, { recursive: true, mode: 0o700 });
  await writePrivate(join(outputDir, "blind-review.md"), blindReview(bundle));
  await writePrivate(join(outputDir, "retained-prose.md"), retainedProse(bundle));
  await writePrivate(join(outputDir, "telemetry.json"), `${JSON.stringify(bundle.map(({ subject, alias, requestId, result, metrics }) => ({ subject, alias, requestId, status: result.status, metrics })), null, 2)}\n`);
  await writePrivate(join(outputDir, "model-key.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    reasoningCapabilities,
    aliases: Object.fromEntries([...aliasByModel].map(([model, alias]) => [alias, model])),
    reports: bundle.map(({ subject, alias, model, requestId, result }) => ({ subject, alias, model, requestId, status: result.status }))
  }, null, 2)}\n`);
  await writePrivate(join(outputDir, "private-records.json"), `${JSON.stringify(bundle, null, 2)}\n`);

  console.log(JSON.stringify({
    ok: true,
    outputDir,
    coordinateStatus: "resolved",
    reasoningCapabilities,
    reports: bundle.map(({ subject, alias, requestId, result }) => ({
      subject,
      alias,
      requestId,
      status: result.status,
      reportUrl: `${appBaseUrl}/library?reportId=${requestId}`
    }))
  }, null, 2));
} finally {
  await closeDatabaseConnection();
}

function sourceChartFor(bundle: PortableBundle, subjectName: string) {
  const chart = [...bundle.data.chartRequests]
    .filter((candidate) => candidate.subjectName === subjectName && candidate.status === "completed")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  if (!chart) throw new Error(`No completed saved chart was found for ${subjectName}.`);
  if (chart.source !== "ally") throw new Error(`${subjectName} is not saved as an Ally chart.`);
  const settings = recordFrom(recordFrom(chart.context).chartSettings);
  const zodiacMode = textFrom(settings.zodiacMode) || "tropical";
  const houseSystem = textFrom(settings.houseSystem) || "whole-sign";
  if (!new Set(["tropical", "sidereal"]).has(zodiacMode)) throw new Error(`${subjectName} has invalid Zodiac settings.`);
  if (!new Set(["whole-sign", "placidus"]).has(houseSystem)) throw new Error(`${subjectName} has invalid House settings.`);
  if (!hasResolvedBirthCoordinates(chart.birthData)) {
    throw new Error(`${subjectName} does not have trustworthy birth-place coordinates.`);
  }
  return { chartRequestId: chart.id, subjectName, zodiacMode, houseSystem, coordinateStatus: "resolved" as const };
}

async function createReportRequest(source: ReturnType<typeof sourceChartFor>) {
  const created = await requestJson(`${appBaseUrl}/api/reports`, {
    method: "POST",
    body: JSON.stringify({
      chartRequestId: source.chartRequestId,
      reportType: "deep",
      reportBasis: {
        type: "natal",
        chartSettings: {
          zodiacMode: source.zodiacMode,
          houseSystem: source.houseSystem
        }
      },
      question: "Create a Deep Report from this saved Ally chart using the current Plainspoken writer.",
      intent: "ally-deep-model-bakeoff"
    })
  });
  const requestId = textFrom(recordFrom(created.request).id);
  if (!requestId) throw new Error(`Astra did not return a report request for ${source.subjectName}.`);
  return requestId;
}

function bakeoffRecord(bundle: PortableBundle, generated: { subject: string; model: string; requestId: string }) {
  const request = bundle.data.reportRequests.find((candidate) => candidate.id === generated.requestId);
  const result = bundle.data.reportResults.find((candidate) => candidate.requestId === generated.requestId);
  if (!request || !result) throw new Error(`Bakeoff report ${generated.requestId} could not be read back from Astra.`);
  const actualModel = textFrom(recordFrom(result.generationMetadata).model);
  if (actualModel !== generated.model) {
    throw new Error(`${generated.subject} expected ${generated.model}, but persisted ${actualModel || "no model"}.`);
  }
  return { ...generated, request, result };
}

function latestBakeoffRequest(bundle: PortableBundle, subject: string, model: string) {
  const resultsByRequest = new Map(bundle.data.reportResults.map((result) => [result.requestId, result]));
  return [...bundle.data.reportRequests]
    .filter((request) => request.subjectName === subject && request.reportType === "deep" && request.intent === "ally-deep-model-bakeoff")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((request) => {
      const result = resultsByRequest.get(request.id);
      const generation = recordFrom(result?.generationMetadata);
      return result &&
        new Set(["completed", "failed"]).has(result.status) &&
        textFrom(generation.model) === model &&
        textFrom(generation.promptVersion) === ASTRA_REPORT_PROMPT_VERSION
        ? { requestId: request.id, status: result.status }
        : null;
    })
    .find((candidate): candidate is { requestId: string; status: "completed" | "failed" } => Boolean(candidate)) ?? null;
}

function reportMetrics(result: JsonObject) {
  const generation = recordFrom(result.generationMetadata);
  const persistedSections = arrayFrom(result.sections);
  const retainedSections = arrayFrom(generation.sections).map((section) => {
    const failures = arrayFrom(section.failures);
    return {
      title: textFrom(section.title),
      body: textFrom(section.acceptedText) || textFrom(failures[failures.length - 1]?.rejectedText)
    };
  });
  const sections = persistedSections.length ? persistedSections : retainedSections;
  const prose = sections.map((section) => textFrom(section.body)).join("\n\n");
  const readability = measureReportReadability(prose);
  const attempts = [recordFrom(generation.thesis), ...arrayFrom(generation.sections)];
  const failures = attempts.flatMap((part) => arrayFrom(part.failures));
  const firstPassAcceptedParts = attempts.filter((part) => numberFrom(part.attemptCount) === 1).length;
  const sectionBodies = sections.map((section) => textFrom(section.body));
  const directOpenings = sectionBodies.filter((body) => /^(?:You|Your)\b/.test(body)).length;
  const paragraphCounts = sectionBodies.map((body) => body.split(/\r?\n\s*\r?\n/).filter(Boolean).length);
  const sentences = prose.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chartTermPattern = /\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Ascendant|Rising|Midheaven|North Node|South Node|Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|\d+(?:st|nd|rd|th) house|conjunct|square|trine|sextile|opposition)\b/gi;
  const chartReferences = prose.match(chartTermPattern)?.length ?? 0;
  const multiSignalSentences = sentences.filter((sentence) => (sentence.match(chartTermPattern)?.length ?? 0) >= 2).length;
  const practicalSentences = sentences.filter((sentence) => /\b(?:practice|try|choose|notice|name|let|ask|write|pause|make|protect|test|build)\b/i.test(sentence)).length;
  const normalizedSentences = sentences.map((sentence) => sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim());
  const repeatedSentenceCount = normalizedSentences.length - new Set(normalizedSentences).size;
  const openingStems = sectionBodies.map((body) => body.split(/\s+/).slice(0, 4).join(" ").toLowerCase());
  const repeatedOpeningCount = openingStems.length - new Set(openingStems).size;
  return {
    words: readability.wordCount,
    grade: readability.fleschKincaidGrade,
    averageSentenceWords: readability.averageSentenceWords,
    directOpenings,
    paragraphCounts,
    retries: failures.length,
    firstPassAcceptedParts,
    totalGeneratedParts: attempts.length,
    firstPassAcceptanceRate: Number((firstPassAcceptedParts / Math.max(1, attempts.length)).toFixed(3)),
    estimatedSpend: numberFrom(generation.estimatedSpend),
    latencyMs: numberFrom(generation.latencyMs),
    inputTokens: numberFrom(generation.inputTokens),
    outputTokens: numberFrom(generation.outputTokens),
    reasoningTokens: numberFrom(generation.reasoningTokens),
    totalTokens: numberFrom(generation.totalTokens),
    reasoningEffort: textFrom(generation.reasoningEffort),
    chartReferences,
    chartReferencesPerThousandWords: Number(((chartReferences / Math.max(1, readability.wordCount)) * 1000).toFixed(1)),
    multiSignalSentences,
    practicalSentences,
    repeatedSentenceCount,
    repeatedOpeningCount,
    openings: sections.map((section) => ({
      title: textFrom(section.title),
      opening: textFrom(section.body).split(/(?<=[.!?])\s+/)[0] || ""
    })),
    retryReasons: failures.flatMap((failure) => arrayFrom(failure.issues).map((issue) => ({
      code: textFrom(issue.code),
      message: textFrom(issue.message),
      rejectedText: textFrom(failure.rejectedText)
    })))
  };
}

function blindReview(records: Array<ReturnType<typeof bakeoffRecord> & { alias: string; metrics: ReturnType<typeof reportMetrics> }>) {
  const placeholderSubjects = [...new Set(records
    .filter((record) => record.request.birthData.latitude === 0 && record.request.birthData.longitude === 0)
    .map((record) => record.subject))];
  const coordinateNotice = placeholderSubjects.length
    ? `\n\n> Coordinate warning: ${placeholderSubjects.join(" and ")} use imported placeholder coordinates (0,0). This is a fair writer comparison, but house and Ascendant claims must not be treated as final personal astrology.`
    : "";
  const groups = subjects.map((subject) => {
    const reports = records
      .filter((record) => record.subject === subject)
      .sort((left, right) => left.alias.localeCompare(right.alias));
    return `# ${subject}\n\n` + reports.map((record) => {
      const sections = arrayFrom(record.result.sections).map((section) =>
        `### ${textFrom(section.title)}\n\n${textFrom(section.body)}`
      ).join("\n\n");
      const failed = record.result.status === "failed" ? `\n\n> This candidate failed Astra's report gates. Its generated attempts remain in private-records.json.` : "";
      return `## Model ${record.alias}${failed}\n\n[Open in Library](${appBaseUrl}/library?reportId=${record.requestId})\n\n${sections}`;
    }).join("\n\n---\n\n");
  }).join("\n\n---\n\n");
  return `# Astra Ally Deep Report Blind Review\n\nModels are hidden until the prose review is complete. Compare specificity, synthesis across signals, psychological usefulness, warmth, repetition, and whether each chapter earns its length.${coordinateNotice}\n\n${groups}\n`;
}

function retainedProse(records: Array<ReturnType<typeof bakeoffRecord> & { alias: string; metrics: ReturnType<typeof reportMetrics> }>) {
  const reports = records.map((record) => {
    const generation = recordFrom(record.result.generationMetadata);
    const completedSections = arrayFrom(record.result.sections).map((section) =>
      `### ${textFrom(section.title)}\n\n${textFrom(section.body)}`
    );
    const generatedSections = arrayFrom(generation.sections);
    const acceptedFailedSections = generatedSections.flatMap((section) => {
      const title = textFrom(section.title) || "Untitled section";
      const acceptedText = textFrom(section.acceptedText);
      return acceptedText ? [`### ${title} - accepted\n\n${acceptedText}`] : [];
    });
    const rejectedSections = generatedSections.flatMap((section) => {
      const title = textFrom(section.title) || "Untitled section";
      return arrayFrom(section.failures).map((failure, index) => {
        const reasons = Array.isArray(failure.reasons) ? failure.reasons.map(textFrom).filter(Boolean).join("; ") : "Rejected by quality gate";
        return `### ${title} - rejected attempt ${index + 1}\n\n**Reasons:** ${reasons}\n\n${textFrom(failure.rejectedText)}`;
      });
    });
    const sections = [...(completedSections.length ? completedSections : acceptedFailedSections), ...rejectedSections];
    return `## ${record.subject} - Model ${record.alias}\n\nStatus: **${record.result.status}**\n\n${sections.join("\n\n")}`;
  });
  return `# Retained Astra Bakeoff Prose\n\nThis private artifact retains completed prose and every rejected retry for qualitative review.\n\n${reports.join("\n\n---\n\n")}\n`;
}

function blindAliases(values: string[]) {
  const shuffled = [...values]
    .map((value) => ({ value, order: randomUUID() }))
    .sort((left, right) => left.order.localeCompare(right.order))
    .map(({ value }) => value);
  return new Map(shuffled.map((model, index) => [model, String.fromCharCode(65 + index)]));
}

async function writePrivate(path: string, contents: string) {
  await writeFile(path, contents, { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600);
}

async function verifyReasoningCanBeDisabled(selectedModels: string[]) {
  const candidates = selectedModels.filter((model) => reasoningOffCandidates.has(model));
  if (!candidates.length) return [];
  const baseUrl = clean(process.env.ASTRA_OPENROUTER_BASE_URL || process.env.OPENROUTER_BASE_URL) || "https://openrouter.ai/api/v1";
  const catalogBaseUrl = baseUrl.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
  const response = await fetch(`${catalogBaseUrl}/models`);
  if (!response.ok) throw new Error(`OpenRouter model capability preflight failed with ${response.status}.`);
  const payload = await response.json() as JsonObject;
  const catalog = arrayFrom(payload.data);
  return candidates.map((model) => {
    const entry = catalog.find((candidate) => textFrom(candidate.id) === model);
    if (!entry) throw new Error(`${model} is missing from the live OpenRouter model catalog.`);
    const supportedParameters = Array.isArray(entry.supported_parameters)
      ? entry.supported_parameters.map(textFrom).filter(Boolean)
      : [];
    const reasoning = recordFrom(entry.reasoning);
    if (!supportedParameters.includes("reasoning") || reasoning.mandatory !== false) {
      throw new Error(`${model} does not currently allow reasoning to be explicitly disabled.`);
    }
    return {
      model,
      verifiedAt: new Date().toISOString(),
      reasoningParameter: true,
      mandatory: false,
      defaultEnabled: reasoning.default_enabled === true
    };
  });
}

async function signIn() {
  await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
    method: "POST",
    body: JSON.stringify({ email, type: "sign-in" })
  });
  await requestJson(`${authBaseUrl}/sign-in/email-otp`, {
    method: "POST",
    body: JSON.stringify({ email, otp: await readOtpFromMailpit(), name: "Tony Cecala" })
  });
}

async function requestJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("origin", appBaseUrl);
  if (cookieHeader) headers.set("cookie", cookieHeader);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(url, { ...init, headers });
  appendCookies(response.headers);
  const body = await response.text();
  if (!response.ok) throw new Error(`${url} failed with ${response.status}: ${body}`);
  return body ? (JSON.parse(body) as JsonObject) : {};
}

async function requestJsonAllowFailure(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("origin", appBaseUrl);
  if (cookieHeader) headers.set("cookie", cookieHeader);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(url, { ...init, headers });
  appendCookies(response.headers);
  const body = await response.text();
  if (!body) throw new Error(`${url} returned ${response.status} without a result payload.`);
  return JSON.parse(body) as JsonObject;
}

function appendCookies(headers: Headers) {
  const raw = headers.get("set-cookie");
  if (!raw) return;
  const cookies = raw.split(/,(?=[^;,]+=)/).map((cookie) => cookie.split(";")[0]?.trim()).filter(Boolean);
  const values = new Map(cookieHeader.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const [key, ...rest] = part.split("=");
    return [key, rest.join("=")] as const;
  }));
  for (const cookie of cookies) {
    const [key, ...rest] = cookie!.split("=");
    if (key) values.set(key, rest.join("="));
  }
  cookieHeader = [...values].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function readOtpFromMailpit() {
  const searchUrl = new URL("/api/v1/search", mailpitUrl);
  searchUrl.searchParams.set("query", email);
  searchUrl.searchParams.set("limit", "10");
  const response = await fetch(searchUrl);
  if (!response.ok) throw new Error(`Mailpit search failed with ${response.status}.`);
  const search = (await response.json()) as JsonObject;
  for (const message of arrayFrom(search.messages ?? search.Messages)) {
    const id = textFrom(message.ID ?? message.Id ?? message.id);
    if (!id) continue;
    const detail = await fetch(new URL(`/api/v1/message/${id}`, mailpitUrl));
    if (!detail.ok) continue;
    const otp = findOtp(await detail.json());
    if (otp) return otp;
  }
  throw new Error(`No sign-in code was found for ${email}.`);
}

function csvOption(name: string, fallback: string) {
  return (option(name) || fallback).split(",").map((value) => value.trim()).filter(Boolean);
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function findOtp(value: unknown): string | null {
  if (typeof value === "string") return value.match(/\b\d{6}\b/)?.[0] ?? null;
  if (Array.isArray(value)) for (const item of value) { const otp = findOtp(item); if (otp) return otp; }
  if (value && typeof value === "object") for (const item of Object.values(value as JsonObject)) { const otp = findOtp(item); if (otp) return otp; }
  return null;
}

function numberFrom(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : 0; }
function clean(value: string | undefined) { return value?.trim().replace(/^['"]|['"]$/g, "") || ""; }
function textFrom(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function recordFrom(value: unknown): JsonObject { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {}; }
function arrayFrom(value: unknown): JsonObject[] { return Array.isArray(value) ? value.filter((item): item is JsonObject => Boolean(item && typeof item === "object" && !Array.isArray(item))) : []; }
