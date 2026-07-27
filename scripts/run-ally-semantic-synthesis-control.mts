import { randomUUID } from "node:crypto";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_OPENROUTER_API_KEY_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROFILE_ENV,
  ASTRA_REPORT_MODEL_PROVIDER_ENV,
  ASTRA_REPORT_PROMPT_VERSION,
  ASTRA_REPORT_WRITER_ENV,
  ASTRA_SEMANTIC_SYNTHESIS_VERSION,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  OPENROUTER_REPORT_MODEL_PROVIDER,
  buildAstrologyReportResultAsync,
  measureReportReadability,
  reportModelProfileModels
} from "@astra/astrology";
import { astrologyReportRequestSchema, hasResolvedBirthCoordinates } from "@astra/contracts";
import { closeDatabaseConnection, db, exportPortableUserData } from "@astra/db";

type JsonObject = Record<string, unknown>;
type Family = "identity" | "core" | "deep";
type SourceChart = ReturnType<typeof sourceChartFor>;

const generationApproved = process.argv.includes("--generate");
const email = option("--email") || "astramaster@tony.io";
const subjects = csvOption("--subjects", "Felicia Weiss,Cheyenne Autumn,Marissa Yahil");
const model = option("--model") || reportModelProfileModels.production[0];
const apiKey = clean(process.env[ASTRA_OPENROUTER_API_KEY_ENV]) || clean(process.env.OPENROUTER_API_KEY);
const outputDir = resolve(option("--output") || `.astra-exports/semantic-synthesis/${new Date().toISOString().replace(/[:.]/g, "-")}-ally-control`);

if (process.argv.includes("--help")) {
  console.log("Generate private enriched Core and Deep CLI controls from saved Ally charts.");
  console.log("Required: --generate. Optional: --email, --subjects, --model, --output.");
  process.exit(0);
}

if (!generationApproved) throw new Error("Use --generate to approve live production-model calls.");
if (!apiKey) throw new Error(`${ASTRA_OPENROUTER_API_KEY_ENV} or OPENROUTER_API_KEY is required.`);
if (!reportModelProfileModels.production.includes(model as (typeof reportModelProfileModels.production)[number])) {
  throw new Error(`Use an approved production report model. Received: ${model}`);
}

try {
  const bundle = await exportPortableUserData(db, { email, sourceLabel: "ally-semantic-synthesis-control" });
  const sources = subjects.map((subject) => sourceChartFor(bundle, subject));
  await mkdir(join(outputDir, "reports"), { recursive: true, mode: 0o700 });

  const records: Array<{
    subject: string;
    family: "core" | "deep";
    result: Awaited<ReturnType<typeof buildAstrologyReportResultAsync>>;
    metrics: ReturnType<typeof metricsFor>;
  }> = [];

  for (const source of sources) {
    console.error(`${source.subjectName}/identity: generating canonical Identity`);
    const identity = await generate(source, "identity", "");
    assertCompleted(identity, `${source.subjectName}/identity`);
    const canonicalIdentity = identity.sections.find((section) => section.title === "Identity")?.body;
    if (!canonicalIdentity) throw new Error(`${source.subjectName} canonical Identity was empty.`);

    for (const family of ["core", "deep"] as const) {
      console.error(`${source.subjectName}/${family}: generating`);
      const result = await generate(source, family, canonicalIdentity);
      assertCompleted(result, `${source.subjectName}/${family}`);
      const metrics = metricsFor(result);
      records.push({ subject: source.subjectName, family, result, metrics });
      await writePrivate(join(outputDir, "reports", `${slug(source.subjectName)}-${family}.md`), reportMarkdown(source.subjectName, family, result));
      console.error(`${source.subjectName}/${family}: completed; ${metrics.words} words; ${metrics.retries} retries`);
    }
  }

  await writePrivate(join(outputDir, "review.md"), reviewWorksheet(records));
  await writePrivate(join(outputDir, "telemetry.json"), `${JSON.stringify(records.map(({ subject, family, result, metrics }) => ({
    subject,
    family,
    status: result.status,
    promptVersion: result.generationMetadata?.promptVersion,
    model: result.generationMetadata?.model,
    orchestration: result.generationMetadata?.orchestration,
    metrics
  })), null, 2)}\n`);
  await writePrivate(join(outputDir, "manifest.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    privateEvaluation: true,
    databaseAccess: "read-only portable export",
    subjects,
    families: ["core", "deep"],
    reportCount: records.length,
    model,
    semanticSynthesisVersion: ASTRA_SEMANTIC_SYNTHESIS_VERSION,
    promptVersion: ASTRA_REPORT_PROMPT_VERSION,
    canonicalIdentity: "generated once per subject and reused by Core and Deep",
    synthesisNotes: "generic role-scoped controls; no Tony interpretations",
    humanReview: "pending"
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    ok: records.length === subjects.length * 2,
    outputDir,
    model,
    reports: records.map(({ subject, family, metrics }) => ({ subject, family, ...metrics }))
  }, null, 2));
} finally {
  await closeDatabaseConnection();
}

function sourceChartFor(bundle: Awaited<ReturnType<typeof exportPortableUserData>>, subjectName: string) {
  const chart = [...bundle.data.chartRequests]
    .filter((candidate) => candidate.subjectName === subjectName && candidate.source === "ally" && candidate.status === "completed")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  if (!chart) throw new Error(`No completed saved Ally chart was found for ${subjectName}.`);
  if (!hasResolvedBirthCoordinates(chart.birthData)) throw new Error(`${subjectName} does not have resolved birth coordinates.`);
  const settings = recordFrom(recordFrom(chart.context).chartSettings);
  const zodiacMode = textFrom(settings.zodiacMode) || "tropical";
  const houseSystem = textFrom(settings.houseSystem) || "whole-sign";
  if (!new Set(["tropical", "sidereal"]).has(zodiacMode)) throw new Error(`${subjectName} has invalid Zodiac settings.`);
  if (!new Set(["whole-sign", "placidus"]).has(houseSystem)) throw new Error(`${subjectName} has invalid house settings.`);
  return {
    chartRequestId: chart.id,
    userId: chart.userId,
    subjectName,
    birthData: chart.birthData,
    chartSettings: { zodiacMode, houseSystem }
  };
}

async function generate(source: SourceChart, family: Family, canonicalIdentity: string) {
  const now = new Date().toISOString();
  const context: JsonObject = {
    relationshipContext: {
      status: "unspecified",
      condition: "unspecified",
      structure: "unspecified",
      intention: "unspecified",
      recency: "unspecified",
      partnerPronouns: null,
      notes: null
    }
  };
  if (family !== "identity") {
    context.canonicalIdentity = canonicalIdentity;
    context.v1InterpretiveNotes = semanticRoleNotes();
  }
  const request = astrologyReportRequestSchema.parse({
    id: randomUUID(),
    userId: source.userId,
    chartRequestId: source.chartRequestId,
    reportType: family,
    subjectName: source.subjectName,
    birthData: source.birthData,
    question: "What does this natal chart show when each life area is synthesized from its own strongest evidence?",
    intent: "CLI semantic-synthesis generalization control.",
    context,
    source: "ally",
    boundary: "private",
    status: "queued",
    costCredits: family === "identity" ? 1 : family === "core" ? 5 : 10,
    reportBasis: {
      schemaVersion: 2,
      type: "natal",
      chartSettings: source.chartSettings,
      primary: {
        chartRequestId: source.chartRequestId,
        subjectType: "ally",
        subjectId: source.chartRequestId,
        subjectName: source.subjectName,
        birthData: source.birthData,
        calculationMode: "full"
      }
    },
    createdAt: now,
    updatedAt: now
  });
  return buildAstrologyReportResultAsync(request, {
    env: {
      [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
      [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
      [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
      [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
      [ASTRA_REPORT_MODEL_ENV]: model,
      [ASTRA_OPENROUTER_API_KEY_ENV]: apiKey
    },
    fetchImpl: fetch
  });
}

function semanticRoleNotes() {
  return [
  {
    label: "Emotions",
    thesis: "The selected lunar evidence may describe how feeling becomes usable information.",
    counterweight: "Emotional perception can be a resource without becoming a diagnosis or invented history.",
    claimBoundary: "Describe possibilities only. Do not invent suppression, withdrawal, trauma, or biography."
  },
  {
    label: "Relationships",
    thesis: "The selected relational evidence may describe conditions that support connection while preserving agency.",
    counterweight: "Relational needs can coexist without implying a current partner, conflict, or outcome.",
    claimBoundary: "Do not infer status, structure, another person, or another person's inner state."
  },
  {
    label: "Work",
    thesis: "The selected work evidence may show where skill, effort, resources, and visibility combine into contribution.",
    counterweight: "Recognition and usefulness can support each other without inventing a career story.",
    claimBoundary: "Do not invent employment, finances, workload, reputation, or established behavior."
  },
  {
    label: "Drive",
    thesis: "The selected Mars evidence may show how force, pace, and proportion work together.",
    counterweight: "Initiative remains a capacity, not proof of impulsivity or overreach.",
    claimBoundary: "Do not claim categorical behavior, burnout, or a history of poor decisions."
  },
  {
    label: "Gifts",
    thesis: "The selected evidence may support a usable capacity for contribution, connection, or expression.",
    counterweight: "A chart-supported capacity is a possibility to explore, not an established biography or reputation.",
    claimBoundary: "Use may, can, could, or if this fits. Do not claim routine behavior, group impact, or how others experience the reader."
  },
  {
    label: "Blind Spots",
    thesis: "The selected evidence may show where observation and interpretation need to remain distinct.",
    counterweight: "Pattern recognition can remain useful without becoming certainty.",
    claimBoundary: "Do not claim access to another person's motives or make a first impression into a fact."
  },
  {
    label: "Growth",
    thesis: "The selected evidence may show how a stable self-concept can update without self-erasure.",
    counterweight: "Consistency and change can both be resources.",
    claimBoundary: "Do not invent wounds, defenses, stagnation, or required outcomes."
  },
  {
    label: "Integration",
    thesis: "The selected evidence may clarify values and decision criteria across life domains.",
    counterweight: "Values can clarify tradeoffs without prescribing one correct choice.",
    claimBoundary: "Do not repeat another chapter's mechanism or turn the conclusion into a weekly task."
  }
  ] as const;
}

function metricsFor(result: Awaited<ReturnType<typeof buildAstrologyReportResultAsync>>) {
  const prose = result.sections.map((section) => `${section.title}. ${section.body}`).join("\n\n");
  const readability = measureReportReadability(prose);
  const generationParts = [result.generationMetadata?.thesis, ...(result.generationMetadata?.sections ?? [])].filter(Boolean);
  const retries = generationParts.reduce((total, part) => total + (part?.failures?.length ?? 0), 0);
  return {
    words: readability.wordCount,
    grade: Number(readability.fleschKincaidGrade.toFixed(1)),
    retries,
    sections: result.sections.length,
    estimatedSpend: Number((result.generationMetadata?.estimatedSpend ?? 0).toFixed(4))
  };
}

function reportMarkdown(subject: string, family: "core" | "deep", result: Awaited<ReturnType<typeof buildAstrologyReportResultAsync>>) {
  return [
    `# ${subject} — ${family === "core" ? "Core" : "Deep"} semantic synthesis control`,
    "",
    ...result.sections.flatMap((section) => [`## ${section.title}`, "", section.body, ""])
  ].join("\n");
}

function reviewWorksheet(records: Array<{ subject: string; family: "core" | "deep" }>) {
  return [
    "# Multi-person Semantic Synthesis Human Review",
    "",
    "Status: pending.",
    "",
    "Review evidence ownership, invented biography, categorical behavior, other-person claims, Gifts calibration, and cross-chapter repetition.",
    "",
    ...records.flatMap((record) => [
      `## ${record.subject} — ${record.family}`,
      "",
      `Report: reports/${slug(record.subject)}-${record.family}.md`,
      "",
      "- Evidence ownership: pending",
      "- Biography and behavior calibration: pending",
      "- Other-person boundary: pending",
      "- Gifts boundary: pending",
      "- Cross-chapter repetition: pending",
      "- Verdict: pending",
      ""
    ])
  ].join("\n");
}

function assertCompleted(result: Awaited<ReturnType<typeof buildAstrologyReportResultAsync>>, label: string) {
  if (result.status !== "completed") throw new Error(`${label} failed: ${result.error || "unknown error"}`);
}

async function writePrivate(path: string, content: string) {
  await writeFile(path, content, { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600);
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? clean(process.argv[index + 1]) : "";
}

function csvOption(name: string, fallback: string) {
  return (option(name) || fallback).split(",").map((value) => value.trim()).filter(Boolean);
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function recordFrom(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function textFrom(value: unknown) {
  return typeof value === "string" ? value : "";
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
