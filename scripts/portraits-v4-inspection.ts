import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { astrologyReportRequestSchema, recordAstrologyReportResultSchema, type AstrologyReportRequest, type RecordAstrologyReportResult } from "@astra/contracts";
import { portraitV4OriginAdvisories } from "../packages/astrology/src/report/portraitsV4";

export type InspectionSeverity = "error" | "advisory";
export type InspectionFinding = { code: string; severity: InspectionSeverity; caseId?: string; message: string };

export type InspectionReport = {
  status: "PASS" | "FAIL" | "INCOMPLETE";
  cohort: string;
  counts: {
    manifestCases: number;
    inputs: number;
    results: number;
    completed: number;
    failed: number;
    missingResults: number;
    malformed: number;
    sections: number;
    words: number;
  };
  cases: Array<{
    id: string;
    requestId?: string;
    reportType?: string;
    status: "completed" | "failed" | "missing" | "malformed";
    sections: number;
    words: number;
    findingCodes: string[];
  }>;
  sourceDrift: { status: "unchanged" | "drifted" | "unavailable" | "not-declared"; files: Array<{ path: string; status: "match" | "drift" | "missing"; expectedSha256?: string; currentSha256?: string }> };
  findings: InspectionFinding[];
  advisories: InspectionFinding[];
};

type Json = Record<string, unknown>;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const wordCount = (value: string) => value.trim() ? value.trim().split(/\s+/u).length : 0;
const caseIdFrom = (file: string) => basename(file).replace(/\.(?:input|result)\.json$/u, "");
const readJson = (path: string): Json => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("JSON artifact must contain an object.");
  return parsed as Json;
};

function finding(code: string, message: string, caseId?: string, severity: InspectionSeverity = "error"): InspectionFinding {
  return { code, severity, ...(caseId ? { caseId } : {}), message };
}

function visibleLeakFields(input: AstrologyReportRequest, prose: string, evidenceIds: string[]): string[] {
  const candidates: Array<[string, unknown]> = [
    ["requestId", input.id], ["userId", input.userId], ["chartRequestId", input.chartRequestId],
    ["subjectId", input.reportBasis?.primary?.subjectId], ["partnerId", input.reportBasis?.partner?.subjectId],
    // Birth data is allowed in this private report path. Only internal identifiers
    // and trace tokens are treated as visible-prose leaks.
  ];
  const leaks = candidates.filter(([, value]) => value !== undefined && String(value).length > 2 && prose.includes(String(value))).map(([name]) => name);
  if (evidenceIds.some((id) => new RegExp(`\\b${id.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "u").test(prose))) leaks.push("evidenceId");
  if (/\b(?:private-v4|user-[a-z0-9-]{6,}|chart-[a-z0-9-]{6,})\b/iu.test(prose)) leaks.push("internalId");
  if (/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/iu.test(prose)) leaks.push("uuid");
  return [...new Set(leaks)];
}

function expectedReading(result: Pick<RecordAstrologyReportResult, "status" | "sections" | "error">): string {
  if (result.status === "failed") return `Generation did not complete: ${result.error ?? "unknown failure"}`;
  return (result.sections ?? []).map((section: Json) => `## ${section.title}\n\n${section.body}`).join("\n\n");
}

function sourceDrift(manifest: Json, repoRoot: string): InspectionReport["sourceDrift"] {
  if (!manifest.sourceHashes || typeof manifest.sourceHashes !== "object") return { status: "not-declared", files: [] };
  const files = Object.entries(manifest.sourceHashes).map(([path, expected]) => {
    const absolute = resolve(repoRoot, path);
    if (!existsSync(absolute)) return { path, status: "missing" as const, expectedSha256: String(expected) };
    const currentSha256 = sha256(readFileSync(absolute, "utf8"));
    return currentSha256 === String(expected)
      ? { path, status: "match" as const, expectedSha256: String(expected), currentSha256 }
      : { path, status: "drift" as const, expectedSha256: String(expected), currentSha256 };
  });
  return { status: files.some((file) => file.status === "drift") ? "drifted" : files.some((file) => file.status === "missing") ? "unavailable" : "unchanged", files };
}

export function inspectPortraitsV4Cohort(cohortDir: string, repoRoot = process.cwd()): InspectionReport {
  const dir = resolve(cohortDir);
  const cohort = basename(dir);
  const findings: InspectionFinding[] = [];
  const advisories: InspectionFinding[] = [];
  const cases: InspectionReport["cases"] = [];
  let manifest: Json = {};
  try { manifest = readJson(join(dir, "manifest.json")); }
  catch { findings.push(finding("MANIFEST_MISSING_OR_MALFORMED", "manifest.json is missing or is not valid JSON.")); }
  const files = existsSync(dir) ? readdirSync(dir) : [];
  const inputFiles = files.filter((file) => file.endsWith(".input.json")).sort();
  const resultFiles = files.filter((file) => file.endsWith(".result.json")).sort();
  const expectedCases = Array.isArray(manifest.cases) ? manifest.cases.length : Array.isArray(manifest.units) ? manifest.units.length : 0;
  if (expectedCases && expectedCases !== inputFiles.length) findings.push(finding("MANIFEST_CASE_COUNT", `Manifest declares ${expectedCases} cases but ${inputFiles.length} input files are present.`));
  if (!expectedCases && inputFiles.length === 0) findings.push(finding("NO_REPORT_CASES", "No report input cases are declared or present."));
  const resultById = new Map(resultFiles.map((file) => [caseIdFrom(file), file]));
  const inputIds = new Set(inputFiles.map(caseIdFrom));
  for (const resultFile of resultFiles) if (!inputIds.has(caseIdFrom(resultFile))) findings.push(finding("ORPHAN_RESULT", "Result has no matching input file.", caseIdFrom(resultFile)));
  for (const inputFile of inputFiles) {
    const id = caseIdFrom(inputFile);
    let input: AstrologyReportRequest;
    try { input = astrologyReportRequestSchema.parse(readJson(join(dir, inputFile))); }
    catch { cases.push({ id, status: "malformed", sections: 0, words: 0, findingCodes: ["INPUT_SCHEMA"] }); findings.push(finding("INPUT_SCHEMA", "Input does not satisfy the report request schema.", id)); continue; }
    const localFindings: InspectionFinding[] = [];
    const resultFile = resultById.get(id);
    if (!resultFile) { localFindings.push(finding("MISSING_RESULT", "Input exists but result is not present; cohort may still be running.", id)); cases.push({ id, requestId: input.id, reportType: input.reportType, status: "missing", sections: 0, words: 0, findingCodes: localFindings.map((x) => x.code) }); findings.push(...localFindings); continue; }
    let result: RecordAstrologyReportResult;
    try { result = recordAstrologyReportResultSchema.parse(readJson(join(dir, resultFile))); }
    catch { localFindings.push(finding("RESULT_SCHEMA", "Result does not satisfy the report result schema.", id)); cases.push({ id, requestId: input.id, reportType: input.reportType, status: "malformed", sections: 0, words: 0, findingCodes: localFindings.map((x) => x.code) }); findings.push(...localFindings); continue; }
    if (result.requestId !== input.id) localFindings.push(finding("REQUEST_ID_MISMATCH", "Input and result request IDs do not match.", id));
    const sections = Array.isArray(result.sections) ? result.sections : [];
    const visibleText = sections.map((section) => `${section.title}\n${section.body}`).join("\n\n");
    const prose = sections.map((section) => section.body).join("\n\n");
    const words = wordCount(prose);
    const readingPath = join(dir, `${id}.reading.md`);
    if (!existsSync(readingPath)) localFindings.push(finding("READING_MISSING", "Reading markdown artifact is missing.", id));
    else if (readFileSync(readingPath, "utf8") !== expectedReading(result)) localFindings.push(finding("READING_MISMATCH", "Reading markdown does not exactly match result sections.", id));
    const evidencePath = join(dir, `${id}.evidence.json`);
    let evidenceArtifact: Json | undefined;
    if (!existsSync(evidencePath)) localFindings.push(finding("EVIDENCE_MISSING", "Evidence artifact is missing.", id));
    else {
      try {
        const evidence = readJson(evidencePath);
        evidenceArtifact = evidence;
        const expectedReader = input.subjectName;
        const expectedPartner = input.reportBasis?.partner?.subjectName;
        const expectedDate = input.reportBasis?.asOfDate;
        const expectedRelationship = input.context?.synastryTone?.authoredRelationship;
        if (evidence.topic !== input.reportType) localFindings.push(finding("EVIDENCE_TOPIC", "Evidence topic does not match report type.", id));
        if (evidence.reader !== expectedReader) localFindings.push(finding("EVIDENCE_READER", "Evidence reader does not match the input subject.", id));
        if (expectedPartner !== undefined && evidence.partner !== expectedPartner) localFindings.push(finding("EVIDENCE_PARTNER", "Evidence partner does not match the input partner.", id));
        if (expectedPartner === undefined && evidence.partner !== undefined) localFindings.push(finding("EVIDENCE_UNEXPECTED_PARTNER", "Evidence includes a partner not present in the input.", id));
        if (expectedDate !== undefined && evidence.date !== expectedDate) localFindings.push(finding("EVIDENCE_DATE", "Evidence date does not match the input as-of date.", id));
        if (expectedDate === undefined && evidence.date !== undefined) localFindings.push(finding("EVIDENCE_UNEXPECTED_DATE", "Evidence includes a date not present in the input.", id));
        if (expectedRelationship !== undefined && evidence.relationship !== expectedRelationship) localFindings.push(finding("EVIDENCE_RELATIONSHIP", "Evidence relationship does not match the input relationship context.", id));
        if (expectedRelationship === undefined && evidence.relationship !== undefined) localFindings.push(finding("EVIDENCE_UNEXPECTED_RELATIONSHIP", "Evidence includes relationship context not present in the input.", id));
      } catch { localFindings.push(finding("EVIDENCE_MALFORMED", "Evidence artifact is not valid JSON.", id)); }
    }
    if (result.status === "completed") {
      const metadata = result.generationMetadata;
      if (!metadata?.promptVersion) localFindings.push(finding("METADATA_VERSION", "Completed result is missing generation prompt version.", id));
      if (!metadata?.model) localFindings.push(finding("METADATA_MODEL", "Completed result is missing generation model.", id));
      const v4 = metadata?.portraitsV4;
      const synastry = metadata?.synastryV3;
      const genericLeaks = visibleLeakFields(input, visibleText, [...(v4?.evidence.map((item) => item.id) ?? []), ...(synastry?.evidenceIndex.map((item) => item.id) ?? [])]);
      if (genericLeaks.length) localFindings.push(finding("VISIBLE_PRIVACY_LEAK", `Visible prose contains private/internal field type(s): ${genericLeaks.join(", ")}.`, id));
      if (input.reportType === "synastry" && !synastry) localFindings.push(finding("SYNASTRY_METADATA_MISSING", "Completed Synastry result is missing Synastry V3 metadata.", id));
      else if (input.reportType !== "synastry" && !v4 && !synastry) localFindings.push(finding("V4_METADATA_MISSING", "Completed result is missing Portraits V4 metadata.", id));
      if (synastry) {
        if (evidenceArtifact && !isDeepStrictEqual(evidenceArtifact.evidence, synastry.evidenceIndex)) localFindings.push(finding("EVIDENCE_CONTENT", "Evidence artifact does not exactly match Synastry V3 evidenceIndex.", id));
        const evidenceIds = new Set(synastry.evidenceIndex.map((item) => item.id));
        if (synastry.chapterTrace.some((trace) => trace.evidenceIds.some((evidenceId) => !evidenceIds.has(evidenceId)))) localFindings.push(finding("TRACE_EVIDENCE_ID", "Synastry trace references an unknown evidence ID.", id));
      } else if (v4) {
        if (evidenceArtifact && !isDeepStrictEqual(evidenceArtifact.evidence, v4.evidence)) localFindings.push(finding("EVIDENCE_CONTENT", "Evidence artifact does not exactly match Portraits V4 evidence.", id));
        if (v4.trace.length !== sections.length) localFindings.push(finding("TRACE_CARDINALITY", "V4 trace cardinality does not match result section count.", id));
        const evidenceIds = new Set(v4.evidence.map((item) => item.id));
        sections.forEach((section, index) => {
          const trace = v4.trace[index];
          if (!trace) return;
          if (trace.title !== section.title) localFindings.push(finding("TRACE_HEADING", `V4 trace heading at section ${index + 1} does not match the result heading.`, id));
          if (trace.evidenceIds.some((evidenceId: string) => !evidenceIds.has(evidenceId))) localFindings.push(finding("TRACE_EVIDENCE_ID", `V4 trace section ${index + 1} references an unknown evidence ID.`, id));
        });
      }
      try {
        const originWarnings = portraitV4OriginAdvisories({ thread: metadata?.portraitsV4?.thread ?? "", sections: sections.map((section, index) => ({ title: section.title, body: section.body, evidenceIds: metadata?.portraitsV4?.trace?.[index]?.evidenceIds ?? [] })) });
        if (originWarnings.length) advisories.push(finding("ORIGIN_ADVISORY", `Origin-language advisory in ${originWarnings.length} section(s).`, id, "advisory"));
      } catch { /* advisory checker must never invalidate a historical result */ }
    }
    const status = result.status;
    cases.push({ id, requestId: input.id, reportType: input.reportType, status, sections: sections.length, words, findingCodes: localFindings.map((x) => x.code) });
    findings.push(...localFindings);
  }
  const source = sourceDrift(manifest, repoRoot);
  if (source.status === "drifted") advisories.push(finding("SOURCE_DRIFT", "Declared source hashes differ from the current checkout; historical candidates remain inspectable.", undefined, "advisory"));
  if (source.status === "unavailable") advisories.push(finding("SOURCE_UNAVAILABLE", "One or more declared source files are unavailable in the current checkout; historical candidates remain inspectable.", undefined, "advisory"));
  const completed = cases.filter((item) => item.status === "completed").length;
  const failed = cases.filter((item) => item.status === "failed").length;
  const missingResults = cases.filter((item) => item.status === "missing").length;
  const malformed = cases.filter((item) => item.status === "malformed").length;
  const counts = { manifestCases: expectedCases, inputs: inputFiles.length, results: resultFiles.length, completed, failed, missingResults, malformed, sections: cases.reduce((sum, item) => sum + item.sections, 0), words: cases.reduce((sum, item) => sum + item.words, 0) };
  const status = expectedCases > inputFiles.length || missingResults || (!resultFiles.length && inputFiles.length) ? "INCOMPLETE" : findings.length || failed > 0 ? "FAIL" : "PASS";
  return { status, cohort, counts, cases, sourceDrift: source, findings, advisories };
}
