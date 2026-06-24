import { readFileSync } from "node:fs";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import {
  allies,
  appUserProfiles,
  astrologyReportRequests,
  astrologyReportResults,
  chartRequests,
  closeDatabaseConnection,
  createAlly,
  db,
  recordChartMakerResult
} from "@astra/db";
import type { AstrologyReportType, ChartBirthData, ChartMakerRequest } from "@astra/contracts";
import { and, eq } from "drizzle-orm";

const V1_BACKUP =
  "/Users/tony/Documents/Projects/Astria/.astraea/manual-backups/2026-05-24T23-14-44-049Z-migrate-legacy-astramaster-account.json";
const V1_FAMILY_BACKUP =
  "/Users/tony/Documents/Projects/Astria/.astraea/protected-backups/2026-04-21T18-23-02-829Z-family-charts/records.json";
const V1_RECORD_BACKUP =
  "/Users/tony/Documents/Projects/Astria/.astraea/record-backups/2026-04-21T19-04-53-013Z-save_chart_snapshot.json";
const TARGET_EMAIL = "astramaster@tony.io";
const SELF_SUBJECT_ID = "6e73828d-db99-49a3-b801-9b4a18039a72";

type V1Subject = {
  id: string;
  kind?: string | null;
  name: string;
  description?: string | null;
  birth?: {
    date?: string;
    time?: string | null;
    place?: string | null;
    timezone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    timeKnown?: boolean | null;
    accuracy?: string | null;
  };
  birth_date?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
  birth_timezone?: string | null;
  birth_latitude?: number | null;
  birth_longitude?: number | null;
  relationship_tag?: string | null;
  relationshipTag?: string | null;
};

type V1Report = {
  id: string;
  subject_id?: string | null;
  partner_subject_id?: string | null;
  report_mode?: string | null;
  report_tier?: string | null;
  title?: string | null;
  status?: string | null;
  markdown_content?: string | null;
  chart_snapshot?: Record<string, unknown> | null;
  prompt_version?: string | null;
  provider?: string | null;
  model?: string | null;
  model_profile?: string | null;
  voice?: string | null;
  format?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  estimated_spend?: number | null;
  latency_ms?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function normalizedSubject(input: V1Subject): V1Subject {
  return {
    ...input,
    birth: input.birth ?? {
      date: input.birth_date ?? undefined,
      time: input.birth_time ?? undefined,
      place: input.birth_place ?? undefined,
      timezone: input.birth_timezone ?? undefined,
      latitude: input.birth_latitude ?? undefined,
      longitude: input.birth_longitude ?? undefined,
      timeKnown: Boolean(input.birth_time),
      accuracy: undefined
    }
  };
}

function birthDataFor(subject: V1Subject): ChartBirthData | null {
  const birth = subject.birth;
  if (!birth?.date) return null;
  const hasTimedLocation = Boolean(birth.time && birth.timezone && birth.place);

  return {
    date: birth.date,
    time: hasTimedLocation ? birth.time || undefined : undefined,
    timezone: hasTimedLocation ? birth.timezone || undefined : undefined,
    location: hasTimedLocation ? birth.place || undefined : undefined,
    latitude: hasTimedLocation && typeof birth.latitude === "number" ? birth.latitude : undefined,
    longitude: hasTimedLocation && typeof birth.longitude === "number" ? birth.longitude : undefined
  };
}

function reportTypeFor(report: V1Report): AstrologyReportType {
  if (report.report_mode === "relationship") return "synastry";
  if (report.report_mode === "progressed") return "progressed";
  if (report.report_tier === "deep") return "deep";
  if (report.report_tier === "core") return "core";
  return "identity";
}

function subjectNameFromTitle(title: string | null | undefined) {
  if (!title) return "Imported v1 subject";
  return title
    .replace(/^Astra Reading\s*-\s*/i, "")
    .replace(/\s+—\s+(Free Preview|Identity Reading|Core Report|Deep Report|Event Core Report).*$/i, "")
    .trim() || "Imported v1 subject";
}

function sectionsFromMarkdown(reportId: string, markdown: string, fallbackTitle: string) {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  if (matches.length === 0) {
    return [
      {
        id: `v1-section:${reportId}:body`,
        title: fallbackTitle,
        body: markdown.trim(),
        emphasis: "primary" as const
      }
    ];
  }

  return matches.map((match, index) => {
    const next = matches[index + 1];
    const start = (match.index ?? 0) + match[0].length;
    const end = next?.index ?? markdown.length;
    return {
      id: `v1-section:${reportId}:${index + 1}`,
      title: match[1].trim(),
      body: markdown.slice(start, end).replace(/^---\s*/gm, "").trim(),
      emphasis: index === 0 ? ("primary" as const) : ("supporting" as const)
    };
  }).filter((section) => section.body.length > 0);
}

async function existingChartRequestId(userId: string, subjectId: string) {
  const [row] = await db
    .select({ id: chartRequests.id })
    .from(chartRequests)
    .where(and(eq(chartRequests.userId, userId), eq(chartRequests.id, `v1-chart:${subjectId}`)))
    .limit(1);
  return row?.id ?? null;
}

async function ensureChartRequest(userId: string, subject: V1Subject, source: "self" | "ally" | "import") {
  const birthData = birthDataFor(subject);
  if (!birthData) return null;

  const requestId = `v1-chart:${subject.id}`;
  const existing = await existingChartRequestId(userId, subject.id);
  const context = {
    chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
    subject: {
      subjectType: source === "self" ? "self" : "ally",
      subjectId: subject.id,
      displayName: subject.name,
      relationship: subject.relationship_tag ?? subject.relationshipTag ?? (source === "self" ? "self" : "ally"),
      note: "Imported from Astra v1 local data."
    },
    v1: { subjectId: subject.id }
  } as const;

  const requestValues = {
    userId,
    subjectName: subject.name,
    birthData,
    question: null,
    intent: "Imported from Astra v1.",
    context,
    source,
    status: "queued",
    updatedAt: new Date()
  };

  if (!existing) {
    await db.insert(chartRequests).values({
      id: requestId,
      ...requestValues,
      createdAt: new Date(),
    });
  } else {
    await db.update(chartRequests).set(requestValues).where(eq(chartRequests.id, requestId));
  }

  const request: ChartMakerRequest = {
    id: requestId,
    userId,
    subjectName: subject.name,
    birthData,
    intent: "Imported from Astra v1.",
    context,
    source,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await recordChartMakerResult(db, buildChartMakerRecordResult(request));
  return requestId;
}

async function main() {
  const backup = readJson(V1_BACKUP) as { tables: Record<string, unknown[]> };
  const family = readJson(V1_FAMILY_BACKUP) as { subjects?: V1Subject[] };
  const recordBackup = readJson(V1_RECORD_BACKUP) as { subjects?: V1Subject[] };

  const [profile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, TARGET_EMAIL)).limit(1);
  if (!profile) throw new Error(`No v2 profile found for ${TARGET_EMAIL}. Sign in once before importing.`);

  const subjectsById = new Map<string, V1Subject>();
  for (const subject of [
    ...((recordBackup.subjects ?? []) as V1Subject[]),
    ...((family.subjects ?? []) as V1Subject[]),
    ...((backup.tables.subjects ?? []) as V1Subject[])
  ]) {
    subjectsById.set(subject.id, normalizedSubject(subject));
  }

  const allySubjectIds = new Set([
    ...((family.subjects ?? []) as V1Subject[]).map((subject) => subject.id),
    ...((backup.tables.subjects ?? []) as V1Subject[]).map((subject) => subject.id)
  ]);
  allySubjectIds.delete(SELF_SUBJECT_ID);

  const summary = {
    alliesCreated: 0,
    alliesSkipped: 0,
    chartsCreatedOrUpdated: 0,
    reportsCreated: 0,
    reportsSkipped: 0
  };

  for (const subjectId of allySubjectIds) {
    const subject = subjectsById.get(subjectId);
    if (!subject?.name) continue;
    const [existing] = await db
      .select({ id: allies.id })
      .from(allies)
      .where(and(eq(allies.userId, profile.userId), eq(allies.id, `v1-ally:${subject.id}`)))
      .limit(1);
    if (existing) {
      summary.alliesSkipped += 1;
    } else {
      await createAlly(db, {
        id: `v1-ally:${subject.id}`,
        userId: profile.userId,
        name: subject.name,
        kind: "person",
        relationship: subject.relationship_tag ?? subject.relationshipTag ?? "ally",
        note: subject.description ?? "Imported from Astra v1."
      });
      summary.alliesCreated += 1;
    }
    if (await ensureChartRequest(profile.userId, subject, "ally")) summary.chartsCreatedOrUpdated += 1;
  }

  const selfSubject = subjectsById.get(SELF_SUBJECT_ID);
  if (selfSubject && (await ensureChartRequest(profile.userId, selfSubject, "self"))) {
    summary.chartsCreatedOrUpdated += 1;
  }

  const chartRequestBySubjectId = new Map<string, string>();
  for (const [subjectId, subject] of subjectsById.entries()) {
    const source = subjectId === SELF_SUBJECT_ID ? "self" : allySubjectIds.has(subjectId) ? "ally" : "import";
    const requestId = await ensureChartRequest(profile.userId, subject, source);
    if (requestId) chartRequestBySubjectId.set(subjectId, requestId);
  }

  const reports = ((backup.tables.report_documents ?? []) as V1Report[])
    .filter((report) => report.status === "generated" && report.markdown_content?.trim())
    .sort((a, b) => Date.parse(a.created_at ?? "") - Date.parse(b.created_at ?? ""));

  for (const report of reports) {
    const requestId = `v1-report:${report.id}`;
    const primarySubject = report.subject_id ? subjectsById.get(report.subject_id) : undefined;
    const partnerSubject = report.partner_subject_id ? subjectsById.get(report.partner_subject_id) : undefined;
    const subjectName = primarySubject?.name ?? subjectNameFromTitle(report.title);
    const birthData = birthDataFor(primarySubject ?? selfSubject ?? { id: "import", name: subjectName }) ?? { date: "1961-05-23" };
    const reportType = reportTypeFor(report);
    const title = report.title ?? `${subjectName} — Imported v1 Report`;
    const createdAt = report.created_at ? new Date(report.created_at) : new Date();
    const sections = sectionsFromMarkdown(report.id, report.markdown_content ?? "", title);
    const summaryText = sections[0]?.body.slice(0, 420).replace(/\s+/g, " ").trim() || "Imported Astra v1 report.";
    const reportContext = {
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      subject: {
        subjectType: report.subject_id === SELF_SUBJECT_ID ? "self" : "ally",
        subjectId: report.subject_id ?? undefined,
        displayName: subjectName,
        relationship: primarySubject?.relationship_tag ?? primarySubject?.relationshipTag ?? undefined
      },
      synastryPartner:
        partnerSubject && report.partner_subject_id
          ? {
              chartRequestId: chartRequestBySubjectId.get(report.partner_subject_id) ?? `v1-chart:${report.partner_subject_id}`,
              subjectName: partnerSubject.name,
              birthData: birthDataFor(partnerSubject) ?? undefined
            }
          : undefined,
      v1: {
        reportDocumentId: report.id,
        reportMode: report.report_mode,
        reportTier: report.report_tier,
        provider: report.provider,
        model: report.model,
        modelProfile: report.model_profile,
        voice: report.voice,
        format: report.format,
        promptVersion: report.prompt_version,
        inputTokens: report.input_tokens,
        outputTokens: report.output_tokens,
        totalTokens: report.total_tokens,
        estimatedSpend: report.estimated_spend,
        latencyMs: report.latency_ms,
        chartSnapshot: report.chart_snapshot ?? null
      }
    } as const;
    const [existing] = await db
      .select({ id: astrologyReportResults.id })
      .from(astrologyReportResults)
      .where(and(eq(astrologyReportResults.userId, profile.userId), eq(astrologyReportResults.requestId, requestId)))
      .limit(1);
    if (existing) {
      await db
        .update(astrologyReportRequests)
        .set({
          chartRequestId: report.subject_id ? chartRequestBySubjectId.get(report.subject_id) ?? null : null,
          reportType,
          subjectName,
          birthData,
          context: reportContext,
          source: "import",
          boundary: "private",
          status: "completed",
          engine: "astra-v1-import",
          engineVersion: report.prompt_version ?? "v1",
          costCredits: 0,
          updatedAt: new Date()
        })
        .where(and(eq(astrologyReportRequests.id, requestId), eq(astrologyReportRequests.userId, profile.userId)));
      summary.reportsSkipped += 1;
      continue;
    }

    await db.insert(astrologyReportRequests).values({
      id: requestId,
      userId: profile.userId,
      chartRequestId: report.subject_id ? chartRequestBySubjectId.get(report.subject_id) ?? null : null,
      reportType,
      subjectName,
      birthData,
      question: null,
      intent: "Imported historical Astra v1 report.",
      context: reportContext,
      source: "import",
      boundary: "private",
      status: "completed",
      engine: "astra-v1-import",
      engineVersion: report.prompt_version ?? "v1",
      costCredits: 0,
      createdAt,
      updatedAt: report.updated_at ? new Date(report.updated_at) : createdAt
    });

    await db.insert(astrologyReportResults).values({
      requestId,
      userId: profile.userId,
      engine: "astra-v1-import",
      engineVersion: report.prompt_version ?? "v1",
      status: "completed",
      summary: summaryText,
      sections,
      provenance: [
        {
          id: `v1-provenance:${report.id}`,
          kind: "manual",
          label: "Astra v1 import",
          summary: `Imported from v1 report document ${report.id}.`,
          boundary: "private"
        }
      ],
      publicSignal: {
        reportId: `v1-result:${report.id}`,
        requestId,
        reportType,
        headline: title,
        summary: summaryText,
        tone: "grounded",
        boundary: "public_signal",
        provenanceSummary: "Imported historical v1 report."
      },
      error: null,
      createdAt
    });
    summary.reportsCreated += 1;
  }

  console.log(JSON.stringify({ userId: profile.userId, email: TARGET_EMAIL, ...summary }, null, 2));
}

try {
  await main();
} finally {
  await closeDatabaseConnection();
}
