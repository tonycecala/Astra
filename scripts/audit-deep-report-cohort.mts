import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { measureReportReadability } from "@astra/astrology";
import { closeDatabaseConnection, db, exportPortableUserData } from "@astra/db";

type JsonObject = Record<string, unknown>;
type ReportPair = { request: JsonObject; result: JsonObject };

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
const email = (option("--email") || "astramaster@tony.io").trim().toLowerCase();
const subjects = (option("--subjects") || "Cheyenne Autumn,Brandi McCulley,Felicia Weiss")
  .split(",")
  .map((subject) => subject.trim())
  .filter(Boolean);
const outputPath = resolve(
  option("--output") || `.astra-exports/comparisons/${new Date().toISOString().slice(0, 10)}-deep-plainspoken-cohort.md`
);
const generationApproved = process.argv.includes("--generate");
let cookieHeader = "";

try {
  if (!generationApproved) throw new Error("Use --generate to approve the production-model Deep Report calls.");
  if (!internalToken) throw new Error("ASTRA_INTERNAL_API_TOKEN is required for production-model report generation.");

  const before = await exportPortableUserData(db, { email, sourceLabel: "deep-plainspoken-cohort-before" });
  const baseline = subjects.map((subject) => {
    const pair = latestCompletedDeepReport(before.data.reportRequests, before.data.reportResults, subject);
    if (!pair) throw new Error(`No completed Deep Report was found for ${subject}.`);
    return pair;
  });

  await signIn();
  const generatedIds: string[] = [];
  for (const prior of baseline) {
    const chartRequestId = textFrom(prior.request.chartRequestId);
    if (!chartRequestId) throw new Error(`${textFrom(prior.request.subjectName)} has no source chart request.`);
    const basis = recordFrom(prior.request.reportBasis);
    const chartSettings = recordFrom(basis.chartSettings);
    const created = await requestJson(`${appBaseUrl}/api/reports`, {
      method: "POST",
      body: JSON.stringify({
        chartRequestId,
        reportType: "deep",
        reportBasis: {
          type: "natal",
          chartSettings: {
            zodiacMode: textFrom(chartSettings.zodiacMode) || "tropical",
            houseSystem: textFrom(chartSettings.houseSystem) || "whole-sign"
          }
        },
        question: "Create a Deep Report using the saved Ally chart and the current production Plainspoken writer.",
        intent: "deep-report-plainspoken-retry-audit"
      })
    });
    const requestId = textFrom(recordFrom(created.request).id);
    if (!requestId) throw new Error(`Astra did not return a report request for ${textFrom(prior.request.subjectName)}.`);

    const replay = await requestJson(`${appBaseUrl}/api/admin/replay-report`, {
      method: "POST",
      headers: { "x-astra-internal-token": internalToken },
      body: JSON.stringify({ requestId, reportWriter: "debug-model-writer", modelProfile: "production" })
    });
    const result = recordFrom(replay.result);
    if (result.status !== "completed") throw new Error(`${textFrom(prior.request.subjectName)} Deep Report failed: ${textFrom(result.error) || "unknown error"}`);
    generatedIds.push(requestId);
  }

  const after = await exportPortableUserData(db, { email, sourceLabel: "deep-plainspoken-cohort-after" });
  const generated = generatedIds.map((requestId) => completedReportById(after.data.reportRequests, after.data.reportResults, requestId));
  if (generated.some((pair) => !pair)) throw new Error("One or more generated reports could not be read back from Astra.");

  const markdown = buildAudit(baseline, generated as ReportPair[]);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdown, { encoding: "utf8", mode: 0o600 });
  await chmod(outputPath, 0o600);

  console.log(JSON.stringify({
    ok: true,
    outputPath,
    reports: generatedIds.map((requestId, index) => ({
      subject: textFrom(generated[index]?.request.subjectName),
      requestId,
      reportUrl: `${appBaseUrl}/library?reportId=${requestId}`
    }))
  }, null, 2));
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

function latestCompletedDeepReport(requests: JsonObject[], results: JsonObject[], subjectName: string) {
  const requestById = new Map(requests.map((request) => [textFrom(request.id), request]));
  return results
    .map((result) => ({ request: requestById.get(textFrom(result.requestId)), result }))
    .filter((pair): pair is ReportPair => Boolean(
      pair.request?.reportType === "deep" &&
      pair.request.subjectName === subjectName &&
      pair.result.status === "completed"
    ))
    .sort((left, right) => textFrom(right.result.createdAt).localeCompare(textFrom(left.result.createdAt)))[0];
}

function completedReportById(requests: JsonObject[], results: JsonObject[], requestId: string) {
  const request = requests.find((candidate) => textFrom(candidate.id) === requestId);
  const result = results.find((candidate) => textFrom(candidate.requestId) === requestId && candidate.status === "completed");
  return request && result ? { request, result } : null;
}

function buildAudit(baseline: ReportPair[], generated: ReportPair[]) {
  const comparisons = baseline.map((before, index) => comparison(before, generated[index]!));
  const beforeTotals = totals(comparisons.map((item) => item.before));
  const afterTotals = totals(comparisons.map((item) => item.after));
  const rows = comparisons.map((item) =>
    `| ${item.subject} | ${item.before.grade.toFixed(1)} | ${item.after.grade.toFixed(1)} | ${item.before.averageSentenceWords.toFixed(1)} | ${item.after.averageSentenceWords.toFixed(1)} | ${item.before.retries} | ${item.after.retries} | ${money(item.before.spend)} | ${money(item.after.spend)} |`
  ).join("\n");
  const qualityRows = comparisons.map((item) =>
    `| ${item.subject} | ${item.before.words.toLocaleString()} | ${item.after.words.toLocaleString()} | ${item.before.specificity} | ${item.after.specificity} | ${item.before.practicalSentences} | ${item.after.practicalSentences} |`
  ).join("\n");
  const retryDetails = comparisons.map((item) => {
    const details = item.after.retryDetails.length
      ? item.after.retryDetails.map((detail) => `- ${detail}`).join("\n")
      : "- No retries.";
    return `### ${item.subject}\n\n${details}`;
  }).join("\n\n");
  const links = comparisons.map((item) => `- [${item.subject} Deep Report](${appBaseUrl}/library?reportId=${item.requestId})`).join("\n");

  return `# Deep Report Plainspoken Cohort Audit\n\n` +
    `Generated ${new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date())}. The same saved Ally charts, Tropical zodiac, Whole Sign houses, and Claude Sonnet 5 production profile were used before and after.\n\n` +
    `## Short answer\n\nThe Plainspoken target is grades 7-8. Flesch-Kincaid is an estimate and an evaluation signal, not a retry gate. This avoids buying another chapter merely because a formula dislikes an astrology term.\n\n` +
    `## Voice and economics\n\n| Ally | Grade before | Grade after | Words/sentence before | Words/sentence after | Retries before | Retries after | Spend before | Spend after |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n${rows}\n\n` +
    `- Average grade: ${average(comparisons.map((item) => item.before.grade)).toFixed(1)} -> ${average(comparisons.map((item) => item.after.grade)).toFixed(1)}\n` +
    `- Total retries: ${beforeTotals.retries} -> ${afterTotals.retries}\n` +
    `- Total writer spend: ${money(beforeTotals.spend)} -> ${money(afterTotals.spend)}\n` +
    `- Total model time: ${seconds(beforeTotals.latencyMs)} -> ${seconds(afterTotals.latencyMs)}\n\n` +
    `## Quality checks\n\n| Ally | Words before | Words after | Chart refs/1,000 before | Chart refs/1,000 after | Practical sentences before | Practical sentences after |\n|---|---:|---:|---:|---:|---:|---:|\n${qualityRows}\n\n` +
    `## Retained retry evidence\n\nRejected prose is stored only in the private generation record. These excerpts show why each post-change retry occurred.\n\n${retryDetails}\n\n` +
    `## Reports\n\n${links}\n\n` +
    `## Provenance\n\n` + comparisons.map((item) =>
      `- ${item.subject}: baseline \`${item.baselineId}\`; Plainspoken \`${item.requestId}\`; prompt \`${item.promptVersion}\`.`
    ).join("\n") + "\n";
}

function comparison(before: ReportPair, after: ReportPair) {
  return {
    subject: textFrom(after.request.subjectName),
    baselineId: textFrom(before.request.id),
    requestId: textFrom(after.request.id),
    promptVersion: textFrom(recordFrom(after.result.generationMetadata).promptVersion),
    before: reportMetrics(before.result),
    after: reportMetrics(after.result)
  };
}

function reportMetrics(result: JsonObject) {
  const sections = arrayFrom(result.sections);
  const prose = sections.map((section) => `${textFrom(section.title)}. ${textFrom(section.body)}`).join("\n");
  const readability = measureReportReadability(prose);
  const generation = recordFrom(result.generationMetadata);
  const failures = [recordFrom(generation.thesis), ...arrayFrom(generation.sections)].flatMap((part) =>
    arrayFrom(part.failures).flatMap((failure) => arrayFrom(failure.issues).map((issue) => ({ failure, issue })))
  );
  const chartReferences = prose.match(/\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Ascendant|Rising|Midheaven|Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|\d+(?:st|nd|rd|th) house|conjunct|square|trine|sextile|opposition)\b/gi)?.length ?? 0;
  const practicalSentences = prose.split(/(?<=[.!?])\s+/).filter((sentence) => /\b(?:practice|try|choose|notice|name|let|ask|write|pause|make|protect|test|build)\b/i.test(sentence)).length;
  return {
    words: readability.wordCount,
    grade: readability.fleschKincaidGrade,
    averageSentenceWords: readability.averageSentenceWords,
    retries: failures.length,
    spend: numberFrom(generation.estimatedSpend),
    latencyMs: numberFrom(generation.latencyMs),
    specificity: Number(((chartReferences / Math.max(1, readability.wordCount)) * 1000).toFixed(1)),
    practicalSentences,
    retryDetails: failures.map(({ failure, issue }) => {
      const excerpt = textFrom(failure.rejectedText).replace(/\s+/g, " ").slice(0, 240);
      return `${label(textFrom(issue.code))}: ${textFrom(issue.message)}${excerpt ? ` Rejected opening: "${excerpt}${textFrom(failure.rejectedText).length > 240 ? "..." : ""}"` : ""}`;
    })
  };
}

function totals(metrics: Array<{ retries: number; spend: number; latencyMs: number }>) {
  return metrics.reduce((sum, item) => ({
    retries: sum.retries + item.retries,
    spend: sum.spend + item.spend,
    latencyMs: sum.latencyMs + item.latencyMs
  }), { retries: 0, spend: 0, latencyMs: 0 });
}

function average(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length); }
function money(value: number) { return `$${value.toFixed(4)}`; }
function seconds(value: number) { return `${Math.round(value / 1000)} seconds`; }
function label(value: string) { return value.split(/[-_]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function numberFrom(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : 0; }
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
