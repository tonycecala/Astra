import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { closeDatabaseConnection, db, exportPortableUserData } from "@astra/db";

type JsonObject = Record<string, unknown>;
type ReportSection = { title: string; body: string };

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
const email = (option("--email") || "astramaster@tony.io").trim().toLowerCase();
const outputPath = resolve(
  option("--output") || `.astra-exports/comparisons/${new Date().toISOString().slice(0, 10)}-deep-report-sonnet-comparison.md`
);
const generationApproved = process.argv.includes("--generate");
let cookieHeader = "";

try {
  if (!generationApproved) {
    throw new Error("This command creates a billable production-model report. Re-run with --generate to approve generation.");
  }
  if (!internalToken) throw new Error("ASTRA_INTERNAL_API_TOKEN is required for production-model report generation.");
  const before = await exportPortableUserData(db, { email, sourceLabel: "deep-report-comparison-before" });
  const prior = latestCompletedDeepReport(before.data.reportRequests, before.data.reportResults);
  if (!prior) throw new Error(`No completed Deep Report exists for ${email}.`);

  await signIn();
  const chartsResponse = await requestJson(`${appBaseUrl}/api/chart-requests`);
  const charts = arrayFrom(chartsResponse.requests);
  const selfChart = charts.find((chart) => chart.id === prior.request.chartRequestId) ?? charts.find((chart) => {
    const subject = recordFrom(recordFrom(chart.context).subject);
    return chart.source === "self" && subject.subjectType === "self";
  });
  if (!selfChart) throw new Error("The saved Self chart for the previous Deep Report was not found.");

  const priorBasis = recordFrom(prior.request.reportBasis);
  const priorSettings = recordFrom(priorBasis.chartSettings);
  const contextSettings = recordFrom(recordFrom(selfChart.context).chartSettings);
  const chartSettings = {
    zodiacMode: textFrom(priorSettings.zodiacMode) || textFrom(contextSettings.zodiacMode) || "tropical",
    houseSystem: textFrom(priorSettings.houseSystem) || textFrom(contextSettings.houseSystem) || "whole-sign"
  };

  const created = await requestJson(`${appBaseUrl}/api/reports`, {
    method: "POST",
    body: JSON.stringify({
      chartRequestId: selfChart.id,
      reportType: "deep",
      reportBasis: { type: "natal", chartSettings },
      question: "Create a new Deep Report using the saved Self chart and current production writer.",
      intent: "deep-report-sonnet-comparison"
    })
  });
  const requestId = textFrom(recordFrom(created.request).id);
  if (!requestId) throw new Error("Astra did not return a new Deep Report request id.");

  const generated = await requestJson(`${appBaseUrl}/api/admin/replay-report`, {
    method: "POST",
    headers: { "x-astra-internal-token": internalToken },
    body: JSON.stringify({
      requestId,
      reportWriter: "debug-model-writer",
      modelProfile: "production"
    })
  });
  const result = recordFrom(generated.result);
  if (result.status !== "completed") throw new Error("The new Deep Report did not complete.");
  const generationMetadata = recordFrom(result.generationMetadata);
  if (generationMetadata.model !== "anthropic/claude-sonnet-5") {
    throw new Error(`Expected Sonnet 5 provenance but received ${textFrom(generationMetadata.model) || "no model"}.`);
  }

  const after = await exportPortableUserData(db, { email, sourceLabel: "deep-report-comparison-after" });
  const nextRequest = after.data.reportRequests.find((request) => request.id === requestId);
  const nextResult = after.data.reportResults.find((candidate) => candidate.requestId === requestId);
  if (!nextRequest || !nextResult) throw new Error("The generated report could not be read back from Astra.");

  const markdown = buildComparison({
    prior,
    next: { request: nextRequest, result: nextResult },
    chartSettings,
    reportUrl: `${appBaseUrl}/library?reportId=${requestId}`
  });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdown, { encoding: "utf8", mode: 0o600 });
  await chmod(outputPath, 0o600);

  console.log(JSON.stringify({ ok: true, requestId, reportUrl: `${appBaseUrl}/library?reportId=${requestId}`, outputPath }, null, 2));
} finally {
  await closeDatabaseConnection();
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
  const messages = arrayFrom(search.messages ?? search.Messages);
  for (const message of messages) {
    const id = textFrom(message.ID ?? message.Id ?? message.id);
    if (!id) continue;
    const detail = await fetch(new URL(`/api/v1/message/${id}`, mailpitUrl));
    if (!detail.ok) continue;
    const otp = findOtp(await detail.json());
    if (otp) return otp;
  }
  throw new Error(`No sign-in code was found for ${email}.`);
}

function latestCompletedDeepReport(requests: JsonObject[], results: JsonObject[]) {
  const requestById = new Map(requests.map((request) => [textFrom(request.id), request]));
  return results
    .map((result) => ({ request: requestById.get(textFrom(result.requestId)), result }))
    .filter((pair): pair is { request: JsonObject; result: JsonObject } =>
      Boolean(pair.request?.reportType === "deep" && pair.result.status === "completed" && pair.request.subjectName === "Tony Cecala")
    )
    .sort((a, b) => textFrom(b.result.createdAt).localeCompare(textFrom(a.result.createdAt)))[0];
}

function buildComparison(input: {
  prior: { request: JsonObject; result: JsonObject };
  next: { request: JsonObject; result: JsonObject };
  chartSettings: { zodiacMode: string; houseSystem: string };
  reportUrl: string;
}) {
  const oldSections = sectionsFrom(input.prior.result.sections);
  const newSections = sectionsFrom(input.next.result.sections);
  const oldWords = oldSections.reduce((sum, section) => sum + wordCount(section.body), 0);
  const newWords = newSections.reduce((sum, section) => sum + wordCount(section.body), 0);
  const oldModel = modelFrom(input.prior.result);
  const newModel = modelFrom(input.next.result);
  const overlap = documentOverlap(oldSections, newSections);
  const newGeneration = recordFrom(input.next.result.generationMetadata);
  const estimatedSpend = typeof newGeneration.estimatedSpend === "number" ? newGeneration.estimatedSpend : null;
  const latencyMs = typeof newGeneration.latencyMs === "number" ? newGeneration.latencyMs : null;
  const sectionRows = newSections.map((section) => {
    const previous = oldSections.find((candidate) => candidate.title === section.title);
    const previousWords = previous ? wordCount(previous.body) : 0;
    const currentWords = wordCount(section.body);
    const change = previousWords ? Math.round(((currentWords - previousWords) / previousWords) * 100) : 100;
    const sectionOverlap = previous ? sentenceOverlap(previous.body, section.body) : 0;
    return `| ${section.title} | ${previousWords.toLocaleString()} | ${currentWords.toLocaleString()} | ${signed(change)}% | ${sectionOverlap}% |`;
  }).join("\n");
  const largestChanges = newSections
    .map((section) => {
      const previous = oldSections.find((candidate) => candidate.title === section.title);
      return { title: section.title, delta: wordCount(section.body) - wordCount(previous?.body || ""), body: section.body };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  const verdict = overlap < 20
    ? "This is a substantially fresh interpretation of the same chart, not a lightly reworded copy."
    : overlap < 45
      ? "The new report keeps the same astrological foundation but develops it with meaningfully different language and emphasis."
      : "The new report follows the previous report closely; its main difference is refinement rather than a new interpretive pass.";

  return `# Tony's Deep Report: Previous vs. Sonnet 5\n\n` +
    `Generated ${formatDate(textFrom(input.next.result.createdAt))}\n\n` +
    `## The short answer\n\n${verdict} The previous report used **${oldModel}**; the new report used **${newModel}**. Both read the same saved birth chart with **${label(input.chartSettings.zodiacMode)} zodiac** and **${label(input.chartSettings.houseSystem)} houses**. This is a real product comparison, but not a laboratory model-only test: the older report also came through Astra's earlier writing pipeline.\n\n` +
    `## At a glance\n\n` +
    `- Previous report: ${oldWords.toLocaleString()} words, created ${formatDate(textFrom(input.prior.result.createdAt))}\n` +
    `- New report: ${newWords.toLocaleString()} words, created ${formatDate(textFrom(input.next.result.createdAt))}\n` +
    `- Length change: ${signed(Math.round(((newWords - oldWords) / oldWords) * 100))}%\n` +
    `- Sentence-level overlap: ${overlap}%\n` +
    (estimatedSpend === null ? "" : `- Estimated Sonnet writer cost: $${estimatedSpend.toFixed(4)}\n`) +
    (latencyMs === null ? "" : `- Generation time: ${Math.round(latencyMs / 1000)} seconds\n`) +
    `- [Open the new report in Astra](${input.reportUrl})\n\n` +
    `## What changed most\n\n` + largestChanges.map((change) =>
      `### ${change.title}\n\nThis section is ${Math.abs(change.delta).toLocaleString()} words ${change.delta >= 0 ? "longer" : "shorter"}. The new version opens:\n\n> ${opening(change.body)}\n`
    ).join("\n") +
    `\n## Section-by-section view\n\n| Section | Previous words | Sonnet 5 words | Length change | Shared sentences |\n|---|---:|---:|---:|---:|\n${sectionRows}\n\n` +
    `## How to read this\n\nA low shared-sentence percentage does not mean the astrology changed. It means Sonnet 5 synthesized the same chart evidence in its own language. The most useful test is whether the new report feels more specific, psychologically usable, and cumulative as it moves from Identity through Integration, rather than merely being longer.\n\n` +
    `## Provenance\n\n- Previous report ID: \`${textFrom(input.prior.request.id)}\`\n- New report ID: \`${textFrom(input.next.request.id)}\`\n- Subject: Tony Cecala\n- Birth data: unchanged saved Self chart\n- Zodiac: ${label(input.chartSettings.zodiacMode)}\n- Houses: ${label(input.chartSettings.houseSystem)}\n- Previous model: ${oldModel}\n- New model: ${newModel}\n`;
}

function sectionsFrom(value: unknown): ReportSection[] {
  return arrayFrom(value).map((section) => ({ title: textFrom(section.title), body: textFrom(section.body) })).filter((section) => section.title && section.body);
}

function sentenceOverlap(oldBody: string, newBody: string) {
  const oldSentences = new Set(sentences(oldBody));
  const current = sentences(newBody);
  if (!current.length) return 0;
  return Math.round((current.filter((sentence) => oldSentences.has(sentence)).length / current.length) * 100);
}

function documentOverlap(oldSections: ReportSection[], newSections: ReportSection[]) {
  const oldSentences = new Set(oldSections.flatMap((section) => sentences(section.body)));
  const current = newSections.flatMap((section) => sentences(section.body));
  return current.length ? Math.round((current.filter((sentence) => oldSentences.has(sentence)).length / current.length) * 100) : 0;
}

function sentences(value: string) {
  return value.split(/(?<=[.!?])\s+/).map((sentence) => sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim()).filter((sentence) => sentence.split(" ").length >= 8);
}

function modelFrom(result: JsonObject) {
  const generation = recordFrom(result.generationMetadata);
  return textFrom(generation.model) || textFrom(result.engineVersion) || "unknown model";
}

function opening(body: string) {
  const first = body.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  return first.length > 420 ? `${first.slice(0, 417)}...` : first;
}

function wordCount(value: string) { return value.split(/\s+/).filter(Boolean).length; }
function signed(value: number) { return value > 0 ? `+${value}` : String(value); }
function label(value: string) { return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/Chicago" }).format(new Date(value)); }
function clean(value: string | undefined) { return value?.trim().replace(/^['\"]|['\"]$/g, "") || ""; }
function textFrom(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function recordFrom(value: unknown): JsonObject { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {}; }
function arrayFrom(value: unknown): JsonObject[] { return Array.isArray(value) ? value.filter((item): item is JsonObject => Boolean(item && typeof item === "object" && !Array.isArray(item))) : []; }
function option(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
function findOtp(value: unknown): string | null {
  if (typeof value === "string") return value.match(/\b\d{6}\b/)?.[0] ?? null;
  if (Array.isArray(value)) for (const item of value) { const otp = findOtp(item); if (otp) return otp; }
  if (value && typeof value === "object") for (const item of Object.values(value as JsonObject)) { const otp = findOtp(item); if (otp) return otp; }
  return null;
}
