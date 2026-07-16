import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROFILE_ENV,
  ASTRA_REPORT_MODEL_PROVIDER_ENV,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  OPENROUTER_REPORT_MODEL_PROVIDER,
  buildAstrologyReportResultAsync,
  reportModelProfileModels
} from "@astra/astrology";
import { astrologyReportRequestSchema, type AstrologyReportResult } from "@astra/contracts";

const outputDir = join(process.cwd(), "output", "report-model-bakeoff", new Date().toISOString().replace(/[:.]/g, "-"));
const apiKey = process.env.ASTRA_OPENROUTER_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim();
const models = (process.env.ASTRA_REPORT_BAKEOFF_MODELS || reportModelProfileModels.premium_bakeoff.join(","))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const reportTypes = (process.env.ASTRA_REPORT_BAKEOFF_TYPES || "identity,core,deep")
  .split(",")
  .map((value) => value.trim())
  .filter((value): value is "identity" | "core" | "deep" => ["identity", "core", "deep"].includes(value));

if (!apiKey) throw new Error("ASTRA_OPENROUTER_API_KEY or OPENROUTER_API_KEY is required.");
if (!models.length || !reportTypes.length) throw new Error("At least one model and report type are required.");

const birthData = {
  date: "1961-05-23",
  time: "09:30",
  birthTimeKnown: true,
  timezone: "America/Chicago",
  location: "Chicago, IL, USA",
  latitude: 41.8781,
  longitude: -87.6298
};

const requestIds = {
  identity: "11111111-1111-4111-8111-111111111111",
  core: "22222222-2222-4222-8222-222222222222",
  deep: "33333333-3333-4333-8333-333333333333"
} as const;

function requestFor(reportType: "identity" | "core" | "deep") {
  const requestId = requestIds[reportType];
  return astrologyReportRequestSchema.parse({
    id: requestId,
    userId: "44444444-4444-4444-8444-444444444444",
    chartRequestId: "55555555-5555-4555-8555-555555555555",
    reportType,
    subjectName: "Tony C",
    birthData,
    source: "self",
    boundary: "private",
    status: "queued",
    costCredits: reportType === "identity" ? 1 : reportType === "core" ? 5 : 10,
    reportBasis: {
      schemaVersion: 1,
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      primary: {
        chartRequestId: "55555555-5555-4555-8555-555555555555",
        subjectType: "self",
        subjectId: "44444444-4444-4444-8444-444444444444",
        subjectName: "Tony C",
        birthData
      }
    },
    createdAt: "2026-07-16T12:00:00.000Z",
    updatedAt: "2026-07-16T12:00:00.000Z"
  });
}

function words(value: string) {
  return value.toLowerCase().match(/[a-z][a-z'-]*/g) ?? [];
}

function wordCount(value: string) {
  return words(value).length;
}

function contentSet(value: string) {
  const stop = new Set(["about", "after", "again", "also", "because", "been", "before", "being", "between", "could", "does", "from", "have", "into", "more", "most", "that", "their", "there", "these", "they", "this", "through", "very", "what", "when", "where", "which", "while", "with", "would", "your", "you"]);
  return new Set(words(value).filter((word) => word.length > 4 && !stop.has(word)));
}

function jaccard(left: Set<string>, right: Set<string>) {
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / union.size;
}

function sectionDistinctness(sections: AstrologyReportResult["sections"]) {
  const sets = sections.map((section) => contentSet(section.body));
  const similarities: number[] = [];
  for (let left = 0; left < sets.length; left += 1) {
    for (let right = left + 1; right < sets.length; right += 1) similarities.push(jaccard(sets[left]!, sets[right]!));
  }
  const average = similarities.length ? similarities.reduce((total, value) => total + value, 0) / similarities.length : 0;
  return Number(((1 - average) * 100).toFixed(1));
}

function repeatedSentenceRate(sections: AstrologyReportResult["sections"]) {
  const sentences = sections
    .flatMap((section) => section.body.split(/(?<=[.!?])\s+/))
    .map((sentence) => words(sentence).join(" "))
    .filter((sentence) => sentence.split(" ").length >= 8);
  const unique = new Set(sentences);
  return sentences.length ? Number((((sentences.length - unique.size) / sentences.length) * 100).toFixed(1)) : 0;
}

function specificityCount(sections: AstrologyReportResult["sections"]) {
  const text = sections.map((section) => section.body).join(" ");
  return (text.match(/\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Ascendant|Rising|Midheaven|Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|\d+(?:st|nd|rd|th) house|conjunct|square|trine|sextile|opposition)\b/gi) ?? []).length;
}

function practicalSentenceCount(sections: AstrologyReportResult["sections"]) {
  return sections
    .flatMap((section) => section.body.split(/(?<=[.!?])\s+/))
    .filter((sentence) => /\b(?:practice|try|choose|notice|name|let|ask|write|pause|make|protect|test|build)\b/i.test(sentence)).length;
}

function reportMarkdown(result: { sections: AstrologyReportResult["sections"] }) {
  return result.sections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
}

await mkdir(outputDir, { recursive: true });
const aliases = new Map(models.map((model, index) => [model, String.fromCharCode(65 + index)]));
const records: Array<Record<string, unknown>> = [];
const blindDocuments: string[] = ["# Astra Report Writer Blind Review", "", "Score psychological usefulness, specificity, freshness, and whether each tier earns its price. Model names are intentionally withheld."];

async function writeArtifacts() {
  await writeFile(join(outputDir, "results.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }, records }, null, 2)}\n`);
  await writeFile(join(outputDir, "blind-review.md"), `${blindDocuments.join("\n")}\n`);
  await writeFile(join(outputDir, "model-key.json"), `${JSON.stringify(Object.fromEntries([...aliases].map(([model, alias]) => [alias, model])), null, 2)}\n`);
}

for (const reportType of reportTypes) {
  for (const model of models) {
    const alias = aliases.get(model)!;
    const startedAt = Date.now();
    const result = await buildAstrologyReportResultAsync(requestFor(reportType), {
      env: {
        [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
        [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
        [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
        [ASTRA_REPORT_MODEL_ENV]: model,
        [ASTRA_REPORT_MODEL_PROFILE_ENV]: "premium_bakeoff",
        ASTRA_OPENROUTER_API_KEY: apiKey
      }
    });
    const totalWords = result.sections.reduce((total, section) => total + wordCount(section.body), 0);
    records.push({
      alias,
      model,
      reportType,
      status: result.status,
      error: result.error,
      totalWords,
      sectionCount: result.sections.length,
      sectionDistinctness: sectionDistinctness(result.sections),
      repeatedSentenceRate: repeatedSentenceRate(result.sections),
      specificityPerThousandWords: totalWords ? Number(((specificityCount(result.sections) / totalWords) * 1000).toFixed(1)) : 0,
      practicalSentences: practicalSentenceCount(result.sections),
      wallClockMs: Date.now() - startedAt,
      generationMetadata: result.generationMetadata
    });
    blindDocuments.push("", `# ${reportType.toUpperCase()} - Writer ${alias}`, "", result.status === "completed" ? reportMarkdown(result) : `Generation failed: ${result.error}`);
    await writeArtifacts();
    console.error(`${reportType}/${alias}: ${result.status} in ${Date.now() - startedAt}ms`);
  }
}

await writeArtifacts();

console.log(JSON.stringify({ ok: records.every((record) => record.status === "completed"), outputDir, records }, null, 2));
