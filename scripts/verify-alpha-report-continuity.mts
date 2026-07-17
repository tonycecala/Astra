import { createHash } from "node:crypto";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { astrologyReportRequestSchema, astrologyReportResultSchema, type AstrologyReportRequest, type AstrologyReportResult } from "@astra/contracts";
import { astrologyReportRequests, astrologyReportResults, closeDatabaseConnection, db, resolveDatabaseUrl } from "@astra/db";
import { eq } from "drizzle-orm";

type ContinuitySnapshot = {
  request: Pick<
    AstrologyReportRequest,
    "id" | "userId" | "chartRequestId" | "reportType" | "subjectName" | "birthData" | "source" | "boundary" | "costCredits" | "reportBasis"
  > & { createdAt: string };
  result: Pick<
    AstrologyReportResult,
    "id" | "requestId" | "engine" | "engineVersion" | "summary" | "sections" | "provenance" | "reportBasis" | "generationMetadata"
  > & { createdAt: string };
};

const requestId = option("--request-id");
const exportPath = option("--export-markdown");
const expectedHost = "alpha.astraportrait.com";

if (!requestId) throw new Error("Provide --request-id for the completed alpha report to verify.");
if (process.env.ASTRA_ALPHA_CONTINUITY_CONFIRM !== expectedHost) {
  throw new Error(`Set ASTRA_ALPHA_CONTINUITY_CONFIRM=${expectedHost} before querying alpha production.`);
}

const databaseUrl = new URL(resolveDatabaseUrl());
if (["127.0.0.1", "localhost"].includes(databaseUrl.hostname)) {
  throw new Error("Alpha continuity verification refuses a local database target.");
}

try {
  const [request] = await db
    .select()
    .from(astrologyReportRequests)
    .where(eq(astrologyReportRequests.id, requestId))
    .limit(1);
  const [result] = await db
    .select()
    .from(astrologyReportResults)
    .where(eq(astrologyReportResults.requestId, requestId))
    .limit(1);

  if (!request || !result) throw new Error(`Report ${requestId} is missing from the configured alpha database.`);
  const savedRequest = astrologyReportRequestSchema.parse({
    ...request,
    chartRequestId: request.chartRequestId ?? undefined,
    question: request.question ?? undefined,
    intent: request.intent ?? undefined,
    reportBasis: request.reportBasis ?? undefined,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString()
  });
  const savedResult = astrologyReportResultSchema.parse({
    ...result,
    summary: result.summary ?? undefined,
    publicSignal: result.publicSignal ?? undefined,
    reportBasis: result.reportBasis ?? undefined,
    generationMetadata: result.generationMetadata ?? undefined,
    error: result.error ?? undefined,
    createdAt: result.createdAt.toISOString()
  });

  if (savedRequest.status !== "completed" || savedResult.status !== "completed") {
    throw new Error(`Report ${requestId} is not completed (request=${savedRequest.status}, result=${savedResult.status}).`);
  }
  if (!savedRequest.reportBasis || !savedResult.reportBasis) throw new Error(`Report ${requestId} is missing its immutable report-basis snapshot.`);
  if (!savedResult.sections.length) throw new Error(`Report ${requestId} has no saved report sections.`);
  if (!savedResult.provenance.length) throw new Error(`Report ${requestId} has no saved provenance.`);

  const snapshot: ContinuitySnapshot = {
    request: {
      id: savedRequest.id,
      userId: savedRequest.userId,
      chartRequestId: savedRequest.chartRequestId,
      reportType: savedRequest.reportType,
      subjectName: savedRequest.subjectName,
      birthData: savedRequest.birthData,
      source: savedRequest.source,
      boundary: savedRequest.boundary,
      costCredits: savedRequest.costCredits,
      reportBasis: savedRequest.reportBasis,
      createdAt: savedRequest.createdAt
    },
    result: {
      id: savedResult.id,
      requestId: savedResult.requestId,
      engine: savedResult.engine,
      engineVersion: savedResult.engineVersion,
      summary: savedResult.summary,
      sections: savedResult.sections,
      provenance: savedResult.provenance,
      reportBasis: savedResult.reportBasis,
      generationMetadata: savedResult.generationMetadata,
      createdAt: savedResult.createdAt
    }
  };
  const fingerprint = createHash("sha256").update(JSON.stringify(stable(snapshot))).digest("hex");

  if (exportPath) {
    const outputPath = resolve(exportPath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, renderMarkdown(snapshot, fingerprint), { encoding: "utf8", mode: 0o600 });
    await chmod(outputPath, 0o600);
  }

  console.log(
    JSON.stringify(
      {
        requestId: savedRequest.id,
        subject: savedRequest.subjectName,
        reportType: savedRequest.reportType,
        reportBasis: reportBasisLabel(savedRequest.reportBasis),
        sectionCount: savedResult.sections.length,
        provenanceCount: savedResult.provenance.length,
        fingerprint,
        exported: exportPath ? resolve(exportPath) : null
      },
      null,
      2
    )
  );
} finally {
  await closeDatabaseConnection();
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stable(item)])
    );
  }
  return value;
}

function reportBasisLabel(basis: unknown) {
  if (!basis || typeof basis !== "object") return "unknown";
  const record = basis as Record<string, unknown>;
  const settings = record.chartSettings && typeof record.chartSettings === "object" ? (record.chartSettings as Record<string, unknown>) : {};
  return [record.type, settings.zodiacMode, settings.houseSystem].filter((value) => typeof value === "string").join(" / ");
}

function renderMarkdown(snapshot: ContinuitySnapshot, fingerprint: string) {
  const basis = snapshot.request.reportBasis;
  const settings = basis?.chartSettings;
  const sections = snapshot.result.sections;
  const provenance = snapshot.result.provenance;
  const birth = snapshot.request.birthData;
  const metadata = snapshot.result.generationMetadata;
  const lines = [
    "---",
    "visibility: private-local-only",
    `requestId: ${snapshot.request.id}`,
    `fingerprint: ${fingerprint}`,
    "---",
    "",
    `# ${snapshot.request.subjectName} - ${snapshot.request.reportType} report`,
    "",
    "## Report Basis",
    "",
    `- Natal source: ${basis?.primary.subjectName ?? snapshot.request.subjectName}`,
    `- Zodiac: ${settings?.zodiacMode ?? "unknown"}`,
    `- Houses: ${settings?.houseSystem ?? "unknown"}`,
    `- Birth data: ${birth.date ?? "unknown"}${birth.time ? ` at ${birth.time}` : ""}${birth.timezone ? ` (${birth.timezone})` : ""}${birth.location ? `, ${birth.location}` : ""}`,
    `- Writer: ${metadata?.provider ?? snapshot.result.engine} / ${metadata?.model ?? snapshot.result.engineVersion}`,
    "",
    "## Summary",
    "",
    snapshot.result.summary ?? "No summary saved.",
    "",
    "## Report",
    ""
  ];

  for (const section of sections) lines.push(`### ${section.title}`, "", section.body, "");
  lines.push("## Provenance", "");
  for (const item of provenance) lines.push(`- **${item.label}:** ${item.summary}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}
