import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROFILE_ENV,
  ASTRA_REPORT_MODEL_PROVIDER_ENV,
  ASTRA_REPORT_PROMPT_VERSION,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  GEMINI_INTRO_IDENTITY_REPORT_MODEL,
  LOCAL_CHART_ROUTINE_ENGINE,
  OPENROUTER_REPORT_MODEL_PROVIDER,
  buildAstrologyReportResultAsync,
  measureReportReadability,
  reportModelProfileModels
} from "@astra/astrology";
import { astrologyReportRequestSchema, type RecordAstrologyReportResult } from "@astra/contracts";

const familyOrder = ["welcome", "identity", "core", "deep", "progressed", "synastry"] as const;
type ReportFamily = (typeof familyOrder)[number];

const generationApproved = process.argv.includes("--generate");
const resume = process.argv.includes("--resume");
const label = option("--label");
const outputRoot = resolve(option("--output") || `.astra-exports/comparisons/${new Date().toISOString().slice(0, 10)}-tony-prompt-bakeoff`);
const outputDir = join(outputRoot, label || "unlabeled");
const model = option("--model") || reportModelProfileModels.production[0];
const asOfDate = option("--as-of") || "2026-07-17";
const requestedFamilies = csvOption("--families", familyOrder.join(","));
const apiKey = clean(process.env.ASTRA_OPENROUTER_API_KEY) || clean(process.env.OPENROUTER_API_KEY);

if (process.argv.includes("--help")) {
  console.log("Generate a private six-family Tony prompt-change bakeoff.");
  console.log("Required: --generate --label before|after. Optional: --resume, --output, --model, --as-of, --families.");
  process.exit(0);
}

if (!generationApproved) throw new Error("Use --generate to approve live model calls.");
if (!label) throw new Error("Provide --label before or --label after.");
if (!apiKey) throw new Error("ASTRA_OPENROUTER_API_KEY or OPENROUTER_API_KEY is required.");
if (!reportModelProfileModels.production.includes(model as (typeof reportModelProfileModels.production)[number])) {
  throw new Error(`Use an approved production model. Received: ${model}`);
}
const families = requestedFamilies.map((family) => {
  if (!familyOrder.includes(family as ReportFamily)) throw new Error(`Unsupported report family: ${family}`);
  return family as ReportFamily;
});

const chartSettings = { zodiacMode: "tropical" as const, houseSystem: "whole-sign" as const };
const tonyBirthData = {
  date: "1961-05-23",
  time: "09:30",
  birthTimeKnown: true,
  timezone: "America/New_York",
  location: "New York, NY, USA",
  latitude: 40.7127281,
  longitude: -74.0060152
};
const partnerBirthData = {
  date: "1978-11-12",
  time: "11:00",
  birthTimeKnown: true,
  timezone: "America/Chicago",
  location: "Galveston, TX, USA",
  latitude: 29.3056996,
  longitude: -94.7933252
};
const ids = {
  user: "11111111-1111-4111-8111-111111111111",
  primaryChart: "22222222-2222-4222-8222-222222222222",
  partnerChart: "33333333-3333-4333-8333-333333333333",
  partner: "44444444-4444-4444-8444-444444444444",
  welcome: "50000000-0000-4000-8000-000000000001",
  identity: "50000000-0000-4000-8000-000000000002",
  core: "50000000-0000-4000-8000-000000000003",
  deep: "50000000-0000-4000-8000-000000000004",
  progressed: "50000000-0000-4000-8000-000000000005",
  synastry: "50000000-0000-4000-8000-000000000006"
} as const;

type BakeoffRecord = {
  family: ReportFamily;
  status: RecordAstrologyReportResult["status"];
  error?: string;
  metrics: ReturnType<typeof reportMetrics>;
  result: RecordAstrologyReportResult;
};

let records: BakeoffRecord[] = resume ? await readExistingRecords() : [];

await mkdir(outputDir, { recursive: true, mode: 0o700 });
await chmod(outputDir, 0o700);

for (const family of families) {
  if (records.some((record) => record.family === family && record.status === "completed")) {
    console.error(`${family}: reused completed result`);
    continue;
  }
  records = records.filter((record) => record.family !== family);
  const startedAt = Date.now();
  const result = await buildAstrologyReportResultAsync(requestFor(family), {
    env: {
      [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
      [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
      [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
      [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
      [ASTRA_REPORT_MODEL_ENV]: model,
      ASTRA_OPENROUTER_API_KEY: apiKey
    }
  });
  records.push({
    family,
    status: result.status,
    error: result.error,
    metrics: reportMetrics(result, Date.now() - startedAt),
    result
  });
  await writeArtifacts();
  console.error(`${family}: ${result.status} in ${Date.now() - startedAt}ms`);
}

await writeArtifacts();
console.log(JSON.stringify({
  ok: records.every((record) => record.status === "completed"),
  outputDir,
  promptVersion: retainedPromptVersion(),
  reports: records.map(({ family, status, metrics }) => ({ family, status, metrics }))
}, null, 2));

if (records.some((record) => record.status !== "completed")) process.exitCode = 1;

function requestFor(family: ReportFamily) {
  const reportType = family === "welcome" ? "identity" : family;
  const primary = {
    chartRequestId: ids.primaryChart,
    subjectType: "self" as const,
    subjectId: ids.user,
    subjectName: "Tony Cecala",
    birthData: tonyBirthData,
    calculationMode: "full" as const
  };
  const reportBasis = family === "progressed"
    ? { schemaVersion: 2 as const, type: "progressed" as const, chartSettings, primary, asOfDate }
    : family === "synastry"
      ? {
          schemaVersion: 2 as const,
          type: "synastry" as const,
          chartSettings,
          primary,
          partner: {
            chartRequestId: ids.partnerChart,
            subjectType: "ally" as const,
            subjectId: ids.partner,
            subjectName: "Brandi McCulley",
            birthData: partnerBirthData,
            calculationMode: "full" as const
          }
        }
      : { schemaVersion: 2 as const, type: "natal" as const, chartSettings, primary };
  const costCredits = family === "welcome" ? 0 : family === "identity" ? 1 : family === "core" || family === "progressed" ? 5 : 10;
  return astrologyReportRequestSchema.parse({
    id: ids[family],
    userId: ids.user,
    chartRequestId: ids.primaryChart,
    reportType,
    subjectName: "Tony Cecala",
    birthData: tonyBirthData,
    source: "self",
    boundary: "private",
    status: "queued",
    costCredits,
    reportBasis,
    context: family === "welcome"
      ? { modelPilot: "gemini-intro-identity", subject: { subjectType: "self", subjectId: ids.user, displayName: "Tony Cecala" }, chartSettings }
      : { subject: { subjectType: "self", subjectId: ids.user, displayName: "Tony Cecala" }, chartSettings },
    question: family === "progressed" ? `What is developing as of ${asOfDate}?` : family === "synastry" ? "What defines this connection?" : undefined,
    intent: `tony-prompt-change-bakeoff:${label}:${family}`,
    createdAt: "2026-07-17T12:00:00.000Z",
    updatedAt: "2026-07-17T12:00:00.000Z"
  });
}

function reportMetrics(result: RecordAstrologyReportResult, wallClockMs: number) {
  const markdown = reportMarkdown(result);
  const readability = measureReportReadability(markdown);
  const totalWords = readability.wordCount;
  const generation = result.generationMetadata;
  const retryCount = generation?.orchestration === "sectioned-v1"
    ? Math.max(0, (generation.thesis?.attemptCount ?? 1) - 1) + (generation.sections ?? []).reduce((total, section) => total + Math.max(0, section.attemptCount - 1), 0)
    : Math.max(0, (generation?.attemptCount ?? 1) - 1);
  return {
    model: generation?.model,
    provider: generation?.provider,
    promptVersion: generation?.promptVersion,
    orchestration: generation?.orchestration,
    attemptCount: generation?.attemptCount,
    retryCount,
    inputTokens: generation?.inputTokens,
    outputTokens: generation?.outputTokens,
    totalTokens: generation?.totalTokens,
    estimatedSpend: generation?.estimatedSpend,
    latencyMs: generation?.latencyMs,
    wallClockMs,
    totalWords,
    sectionCount: result.sections.length,
    sectionWords: Object.fromEntries(result.sections.map((section) => [section.title, measureReportReadability(section.body).wordCount])),
    fleschKincaidGrade: readability.fleschKincaidGrade,
    readingEase: readability.fleschReadingEase,
    averageSentenceWords: readability.averageSentenceWords,
    sectionDistinctness: sectionDistinctness(result.sections),
    repeatedSentenceRate: repeatedSentenceRate(result.sections),
    specificityPerThousandWords: totalWords ? rounded((specificityCount(result.sections) / totalWords) * 1000) : 0,
    practicalSentences: practicalSentenceCount(result.sections),
    paragraphCounts: Object.fromEntries(result.sections.map((section) => [section.title, paragraphCount(section.body)])),
    directSecondPersonOpenings: result.sections.filter((section) => /^(?:You|Your)\b/.test(section.body.trim())).length
  };
}

async function writeArtifacts() {
  const bundlePromptVersion = retainedPromptVersion();
  const manifest = {
    generatedAt: new Date().toISOString(),
    label,
    promptVersion: bundlePromptVersion,
    requestedModel: model,
    welcomeModel: GEMINI_INTRO_IDENTITY_REPORT_MODEL,
    asOfDate,
    chartSettings,
    primary: { subjectName: "Tony Cecala", birthData: tonyBirthData },
    synastryPartner: { subjectName: "Brandi McCulley", birthData: partnerBirthData },
    families
  };
  await writePrivate("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
  await writePrivate("telemetry.json", `${JSON.stringify(records.map(({ family, status, error, metrics }) => ({ family, status, error, metrics })), null, 2)}\n`);
  await writePrivate("private-results.json", `${JSON.stringify(records, null, 2)}\n`);
  await writePrivate("reports.md", reportDocument(records, bundlePromptVersion));
}

function retainedPromptVersion() {
  return records.find((record) => record.result.generationMetadata?.promptVersion)?.result.generationMetadata?.promptVersion ?? ASTRA_REPORT_PROMPT_VERSION;
}

async function readExistingRecords() {
  try {
    const existing = JSON.parse(await readFile(join(outputDir, "private-results.json"), "utf8")) as BakeoffRecord[];
    return existing.map((record) => ({
      ...record,
      metrics: reportMetrics(record.result, record.metrics.wallClockMs)
    }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writePrivate(filename: string, content: string) {
  const path = join(outputDir, filename);
  await writeFile(path, content, { mode: 0o600 });
  await chmod(path, 0o600);
}

function reportDocument(items: BakeoffRecord[], promptVersion: string) {
  const parts = [`# Tony Prompt Bakeoff: ${label}`, "", `Prompt version: \`${promptVersion}\``, `Requested production model: \`${model}\``, `Welcome model: \`${GEMINI_INTRO_IDENTITY_REPORT_MODEL}\``];
  for (const item of items) {
    parts.push("", `# ${label.toUpperCase()} ${item.family.toUpperCase()}`, "");
    parts.push(item.status === "completed" ? reportMarkdown(item.result) : `Generation failed: ${item.error}`);
  }
  return `${parts.join("\n")}\n`;
}

function reportMarkdown(result: RecordAstrologyReportResult) {
  return result.sections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
}

function words(value: string) {
  return value.toLowerCase().match(/[a-z][a-z'-]*/g) ?? [];
}

function contentSet(value: string) {
  const stop = new Set(["about", "after", "again", "also", "because", "been", "before", "being", "between", "could", "does", "from", "have", "into", "more", "most", "that", "their", "there", "these", "they", "this", "through", "very", "what", "when", "where", "which", "while", "with", "would", "your", "you"]);
  return new Set(words(value).filter((word) => word.length > 4 && !stop.has(word)));
}

function sectionDistinctness(sections: RecordAstrologyReportResult["sections"]) {
  const sets = sections.map((section) => contentSet(section.body));
  const similarities: number[] = [];
  for (let left = 0; left < sets.length; left += 1) {
    for (let right = left + 1; right < sets.length; right += 1) {
      const union = new Set([...sets[left]!, ...sets[right]!]);
      let intersection = 0;
      for (const value of sets[left]!) if (sets[right]!.has(value)) intersection += 1;
      similarities.push(union.size ? intersection / union.size : 0);
    }
  }
  const average = similarities.length ? similarities.reduce((total, value) => total + value, 0) / similarities.length : 0;
  return rounded((1 - average) * 100);
}

function repeatedSentenceRate(sections: RecordAstrologyReportResult["sections"]) {
  const sentences = sections.flatMap((section) => section.body.split(/(?<=[.!?])\s+/)).map((sentence) => words(sentence).join(" ")).filter((sentence) => sentence.split(" ").length >= 8);
  return sentences.length ? rounded(((sentences.length - new Set(sentences).size) / sentences.length) * 100) : 0;
}

function specificityCount(sections: RecordAstrologyReportResult["sections"]) {
  const text = sections.map((section) => section.body).join(" ");
  return (text.match(/\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Ascendant|Rising|Midheaven|Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|\d+(?:st|nd|rd|th) house|conjunct|square|trine|sextile|opposition)\b/gi) ?? []).length;
}

function practicalSentenceCount(sections: RecordAstrologyReportResult["sections"]) {
  return sections.flatMap((section) => section.body.split(/(?<=[.!?])\s+/)).filter((sentence) => /\b(?:practice|try|choose|notice|name|let|ask|write|pause|make|protect|test|build)\b/i.test(sentence)).length;
}

function paragraphCount(value: string) {
  return value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean).length;
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() || "" : "";
}

function csvOption(name: string, fallback: string) {
  return (option(name) || fallback).split(",").map((value) => value.trim()).filter(Boolean);
}

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function rounded(value: number) {
  return Number(value.toFixed(1));
}
