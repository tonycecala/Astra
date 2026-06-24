import { readFileSync } from "node:fs";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import {
  allies,
  appUserProfiles,
  astrologyReportRequests,
  astrologyReportResults,
  artifacts,
  chartRequests,
  closeDatabaseConnection,
  db,
  recordChartMakerResult
} from "@astra/db";
import type { AstrologyReportSection, AstrologyReportType, ChartBirthData, ChartMakerRequest } from "@astra/contracts";
import { and, eq, like } from "drizzle-orm";

const V1_ENV_PATH = "/Users/tony/Documents/Projects/Astria/.env";
const TARGET_EMAIL = "astramaster@tony.io";
const SELF_SUBJECT_ID = "6e73828d-db99-49a3-b801-9b4a18039a72";

type V1Profile = {
  id: string;
  auth_user_id?: string | null;
  email?: string | null;
  display_name?: string | null;
};

type V1Subject = {
  id: string;
  access_scope?: string | null;
  archived_at?: string | null;
  birth_accuracy?: string | null;
  birth_date?: string | null;
  birth_latitude?: number | null;
  birth_longitude?: number | null;
  birth_place?: string | null;
  birth_time?: string | null;
  birth_time_known?: boolean | null;
  birth_timezone?: string | null;
  description?: string | null;
  kind?: string | null;
  name: string;
  owner_user_id?: string | null;
  relationship_tag?: string | null;
  source_label?: string | null;
  source_notes?: string | null;
  source_rodden_rating?: string | null;
  source_url?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
};

type V1ReportDocument = {
  id: string;
  chart_snapshot?: Record<string, unknown> | null;
  created_at?: string | null;
  estimated_spend?: number | string | null;
  format?: string | null;
  input_tokens?: number | null;
  latency_ms?: number | null;
  markdown_content: string;
  model?: string | null;
  model_profile?: string | null;
  output_tokens?: number | null;
  partner_subject_id?: string | null;
  prompt_version?: string | null;
  provider?: string | null;
  report_mode: string;
  report_tier: string;
  section_keys?: string[] | null;
  status: string;
  subject_id?: string | null;
  title: string;
  total_tokens?: number | null;
  updated_at?: string | null;
  voice?: string | null;
};

function readV1Env() {
  const text = readFileSync(V1_ENV_PATH, "utf8");
  const values = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match) continue;
    values.set(match[1], match[2].trim().replace(/^['"]|['"]$/g, ""));
  }
  const url = values.get("SUPABASE_URL");
  const serviceRoleKey = values.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("Missing v1 SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Astria .env.");
  }
  return { url, serviceRoleKey };
}

async function fetchV1<T>(path: string): Promise<T> {
  const { url, serviceRoleKey } = readV1Env();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`V1 Supabase request failed ${response.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text) as T;
}

function compactMetadata(subject: V1Subject) {
  return {
    v1SubjectId: subject.id,
    accessScope: subject.access_scope ?? null,
    birthAccuracy: subject.birth_accuracy ?? null,
    birthTimeKnown: subject.birth_time_known ?? null,
    sourceLabel: subject.source_label ?? null,
    sourceRoddenRating: subject.source_rodden_rating ?? null,
    sourceUrl: subject.source_url ?? null
  };
}

function v1SubjectBirthData(subject: V1Subject): ChartBirthData | null {
  if (!subject.birth_date) return null;
  const hasTimedLocation = Boolean(subject.birth_time && subject.birth_timezone && subject.birth_place);

  return {
    date: subject.birth_date,
    time: hasTimedLocation ? subject.birth_time ?? undefined : undefined,
    timezone: hasTimedLocation ? subject.birth_timezone ?? undefined : undefined,
    location: hasTimedLocation ? subject.birth_place ?? undefined : undefined,
    latitude: hasTimedLocation && typeof subject.birth_latitude === "number" ? subject.birth_latitude : undefined,
    longitude: hasTimedLocation && typeof subject.birth_longitude === "number" ? subject.birth_longitude : undefined
  };
}

function allyNote(subject: V1Subject) {
  const parts = [
    "Imported from Astra v1 private records.",
    subject.birth_accuracy ? `Birth data quality: ${subject.birth_accuracy}.` : null,
    subject.source_rodden_rating ? `Rodden/source rating: ${subject.source_rodden_rating}.` : null,
    subject.source_label ? `Source: ${subject.source_label}.` : null,
    subject.description
  ];
  return parts.filter(Boolean).join(" ");
}

async function loadV1PrivateSubjects() {
  const profiles = await fetchV1<V1Profile[]>(
    `profiles?select=id,email,display_name&email=eq.${encodeURIComponent(TARGET_EMAIL)}&limit=1`
  );
  const appProfiles = await fetchV1<V1Profile[]>(
    `app_user_profiles?select=id,auth_user_id,email,display_name&email=eq.${encodeURIComponent(TARGET_EMAIL)}&limit=10`
  );
  const ownerIds = new Set<string>();
  for (const profile of profiles) ownerIds.add(profile.id);
  for (const profile of appProfiles) {
    ownerIds.add(profile.id);
    if (profile.auth_user_id) ownerIds.add(profile.auth_user_id);
  }
  if (!ownerIds.size) throw new Error(`No v1 profile ids found for ${TARGET_EMAIL}.`);

  const orParts = [
    ...[...ownerIds].map((id) => `user_id.eq.${id}`),
    ...[...ownerIds].map((id) => `owner_user_id.eq.${id}`)
  ];
  const subjects = await fetchV1<V1Subject[]>(
    `subjects?select=*&or=(${orParts.join(",")})&access_scope=eq.private&archived_at=is.null&order=updated_at.desc&limit=500`
  );

  const deduped = new Map<string, V1Subject>();
  for (const subject of subjects) {
    if (subject.kind !== "person") continue;
    deduped.set(subject.id, subject);
  }
  return [...deduped.values()];
}

async function loadV1PrivateReportDocuments(subjects: V1Subject[]) {
  const profiles = await fetchV1<V1Profile[]>(
    `profiles?select=id,email,display_name&email=eq.${encodeURIComponent(TARGET_EMAIL)}&limit=1`
  );
  const appProfiles = await fetchV1<V1Profile[]>(
    `app_user_profiles?select=id,auth_user_id,email,display_name&email=eq.${encodeURIComponent(TARGET_EMAIL)}&limit=10`
  );
  const ownerIds = new Set<string>();
  for (const profile of profiles) ownerIds.add(profile.id);
  for (const profile of appProfiles) {
    ownerIds.add(profile.id);
    if (profile.auth_user_id) ownerIds.add(profile.auth_user_id);
  }
  if (!ownerIds.size) return [];

  const ownedReportFilters = [...ownerIds].flatMap((id) => [`owner_user_id.eq.${id}`, `user_id.eq.${id}`]);
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const reports = await fetchV1<V1ReportDocument[]>(
    `report_documents?select=id,subject_id,partner_subject_id,report_mode,report_tier,title,status,markdown_content,chart_snapshot,section_keys,prompt_version,provider,model,model_profile,voice,format,input_tokens,output_tokens,total_tokens,estimated_spend,latency_ms,created_at,updated_at&or=(${ownedReportFilters.join(",")})&status=neq.archived&is_sample=eq.false&order=created_at.desc&limit=200`
  );

  return reports.filter((report) => {
    if (!report.markdown_content?.trim()) return false;
    if (report.report_mode === "relationship") {
      return Boolean(report.subject_id && subjectIds.has(report.subject_id) && report.partner_subject_id && subjectIds.has(report.partner_subject_id));
    }
    return Boolean(report.subject_id && subjectIds.has(report.subject_id));
  });
}

async function clearPreviousV1Import(userId: string) {
  await db
    .delete(artifacts)
    .where(and(eq(artifacts.userId, userId), like(artifacts.id, "report:v1-report:%")));
  await db
    .delete(astrologyReportRequests)
    .where(and(eq(astrologyReportRequests.userId, userId), like(astrologyReportRequests.id, "v1-report:%")));
  await db
    .delete(chartRequests)
    .where(and(eq(chartRequests.userId, userId), like(chartRequests.id, "v1-chart:%")));
  await db
    .delete(allies)
    .where(and(eq(allies.userId, userId), like(allies.id, "v1-ally:%")));
}

async function upsertAlly(userId: string, subject: V1Subject) {
  const values = {
    id: `v1-ally:${subject.id}`,
    userId,
    name: subject.name,
    kind: subject.kind ?? "person",
    relationship: subject.relationship_tag ?? "ally",
    note: allyNote(subject),
    createdAt: subject.updated_at ? new Date(subject.updated_at) : new Date()
  };

  await db
    .insert(allies)
    .values(values)
    .onConflictDoUpdate({
      target: allies.id,
      set: {
        name: values.name,
        kind: values.kind,
        relationship: values.relationship,
        note: values.note
      }
    });
}

async function upsertChartRequest(userId: string, subject: V1Subject, source: "self" | "ally") {
  const birthData = v1SubjectBirthData(subject);
  if (!birthData) return null;

  const context = {
    chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
    subject: {
      subjectType: source,
      subjectId: subject.id,
      allyId: source === "ally" ? `v1-ally:${subject.id}` : undefined,
      displayName: subject.name,
      relationship: subject.relationship_tag ?? source,
      note: "Imported from Astra v1 private records."
    },
    v1: compactMetadata(subject)
  } as const;
  const now = new Date();
  const requestId = `v1-chart:${subject.id}`;
  const values = {
    id: requestId,
    userId,
    subjectName: subject.name,
    birthData,
    question: null,
    intent: "Imported from Astra v1 private records.",
    context,
    source,
    status: "queued",
    createdAt: subject.updated_at ? new Date(subject.updated_at) : now,
    updatedAt: now
  };

  await db
    .insert(chartRequests)
    .values(values)
    .onConflictDoUpdate({
      target: chartRequests.id,
      set: {
        subjectName: values.subjectName,
        birthData: values.birthData,
        intent: values.intent,
        context: values.context,
        source: values.source,
        status: values.status,
        updatedAt: values.updatedAt
      }
    });

  const request: ChartMakerRequest = {
    id: requestId,
    userId,
    subjectName: subject.name,
    birthData,
    intent: values.intent,
    context,
    source,
    status: "queued",
    createdAt: values.createdAt.toISOString(),
    updatedAt: now.toISOString()
  };
  await recordChartMakerResult(db, buildChartMakerRecordResult(request));
  return requestId;
}

function reportTypeFromV1(report: V1ReportDocument): AstrologyReportType {
  if (report.report_mode === "relationship") return "synastry";
  if (report.report_mode === "progressed") return "progressed";
  if (report.report_tier === "free") return "identity";
  if (report.report_tier === "deep") return "deep";
  return "core";
}

function reportTitleFromV1(report: V1ReportDocument) {
  if (report.report_mode === "relationship") {
    return report.title.replace(/\s+[—-]\s+Deep Report$/i, " — Synastry Report");
  }
  return report.title;
}

function markdownSummary(markdown: string) {
  const cleaned = markdown
    .replace(/^#{1,6}\s+.+$/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\*\*Chart Evidence\*\*[\s\S]*$/i, "")
    .replace(/[*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 260).replace(/\s+\S*$/, "").trim() || "Imported Astra v1 report.";
}

function sectionsFromMarkdown(report: V1ReportDocument): AstrologyReportSection[] {
  const markdown = report.markdown_content.replace(/^# .+?\n+---+\n+/s, "").trim();
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  if (!matches.length) {
    return [
      {
        id: `v1-section:${report.id}:imported`,
        title: "Imported v1 Report",
        body: markdown,
        emphasis: "primary"
      }
    ];
  }

  return matches
    .map((match, index) => {
      const title = match[1].trim();
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index ?? markdown.length : markdown.length;
      const body = markdown.slice(start, end).trim();
      return {
        id: `v1-section:${report.id}:${index + 1}`,
        title,
        body,
        emphasis: index === 0 ? "primary" : "supporting"
      } satisfies AstrologyReportSection;
    })
    .filter((section) => section.body);
}

async function upsertImportedReport(userId: string, report: V1ReportDocument, subjectsById: Map<string, V1Subject>) {
  const subject = report.subject_id ? subjectsById.get(report.subject_id) : undefined;
  const partner = report.partner_subject_id ? subjectsById.get(report.partner_subject_id) : undefined;
  const birthData = subject ? v1SubjectBirthData(subject) : null;
  if (!subject || !birthData) return false;

  const reportType = reportTypeFromV1(report);
  const requestId = `v1-report:${report.id}`;
  const source = subject.id === SELF_SUBJECT_ID || subject.relationship_tag === "self" ? "self" : "ally";
  const chartRequestId = `v1-chart:${subject.id}`;
  const createdAt = report.created_at ? new Date(report.created_at) : new Date();
  const updatedAt = report.updated_at ? new Date(report.updated_at) : createdAt;
  const title = reportTitleFromV1(report);
  const summary = markdownSummary(report.markdown_content);
  const subjectName = report.report_mode === "relationship" && partner ? `${subject.name} + ${partner.name}` : subject.name;
  const context = {
    chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
    subject: {
      subjectType: source,
      subjectId: subject.id,
      allyId: source === "ally" ? `v1-ally:${subject.id}` : undefined,
      displayName: subject.name,
      relationship: subject.relationship_tag ?? source,
      partnerSubjectId: partner?.id,
      partnerDisplayName: partner?.name,
      partnerAllyId: partner ? `v1-ally:${partner.id}` : undefined
    },
    v1: {
      reportDocumentId: report.id,
      reportMode: report.report_mode,
      reportTier: report.report_tier,
      promptVersion: report.prompt_version ?? null,
      provider: report.provider ?? null,
      model: report.model ?? null,
      modelProfile: report.model_profile ?? null,
      voice: report.voice ?? null,
      format: report.format ?? null,
      inputTokens: report.input_tokens ?? null,
      outputTokens: report.output_tokens ?? null,
      totalTokens: report.total_tokens ?? null,
      estimatedSpend: report.estimated_spend === null || report.estimated_spend === undefined ? null : Number(report.estimated_spend),
      latencyMs: report.latency_ms ?? null,
      sectionKeys: report.section_keys ?? [],
      chartSnapshot: report.chart_snapshot ?? null
    }
  } as const;

  await db
    .insert(astrologyReportRequests)
    .values({
      id: requestId,
      userId,
      chartRequestId,
      reportType,
      subjectName,
      birthData,
      question: null,
      intent: "Imported from Astra v1 private report library.",
      context,
      source: report.report_mode === "relationship" ? "ally" : source,
      boundary: "private",
      status: "completed",
      engine: report.provider ?? "astra-v1",
      engineVersion: report.model ?? report.prompt_version ?? "report-document",
      costCredits: 0,
      createdAt,
      updatedAt
    })
    .onConflictDoUpdate({
      target: astrologyReportRequests.id,
      set: {
        chartRequestId,
        reportType,
        subjectName,
        birthData,
        intent: "Imported from Astra v1 private report library.",
        context,
        source: report.report_mode === "relationship" ? "ally" : source,
        status: "completed",
        engine: report.provider ?? "astra-v1",
        engineVersion: report.model ?? report.prompt_version ?? "report-document",
        updatedAt
      }
    });

  const sections = sectionsFromMarkdown(report);
  const publicSignal = {
    reportId: requestId,
    requestId,
    reportType,
    headline: title,
    summary,
    tone: "grounded" as const,
    boundary: "public_signal" as const,
    provenanceSummary: "Imported from Astra v1 private report library."
  };

  await db
    .insert(astrologyReportResults)
    .values({
      requestId,
      userId,
      engine: report.provider ?? "astra-v1",
      engineVersion: report.model ?? report.prompt_version ?? "report-document",
      status: "completed",
      summary,
      sections,
      provenance: [
        {
          id: `v1-provenance:${report.id}`,
          kind: "manual",
          label: "Astra v1 report document",
          summary: `Imported ${report.report_tier} ${report.report_mode} report from Astra v1.`,
          boundary: "private",
          sourceId: requestId
        }
      ],
      publicSignal,
      error: null,
      createdAt
    })
    .onConflictDoUpdate({
      target: astrologyReportResults.requestId,
      set: {
        engine: report.provider ?? "astra-v1",
        engineVersion: report.model ?? report.prompt_version ?? "report-document",
        status: "completed",
        summary,
        sections,
        provenance: [
          {
            id: `v1-provenance:${report.id}`,
            kind: "manual",
            label: "Astra v1 report document",
            summary: `Imported ${report.report_tier} ${report.report_mode} report from Astra v1.`,
            boundary: "private",
            sourceId: requestId
          }
        ],
        publicSignal,
        error: null,
        createdAt
      }
    });

  await db
    .insert(artifacts)
    .values({
      id: `report:${requestId}`,
      userId,
      title,
      kind: "report",
      summary,
      payload: {
        requestId,
        v1ReportDocumentId: report.id,
        publicSignal,
        importedFrom: "astra-v1"
      },
      createdAt
    })
    .onConflictDoUpdate({
      target: artifacts.id,
      set: {
        title,
        summary,
        payload: {
          requestId,
          v1ReportDocumentId: report.id,
          publicSignal,
          importedFrom: "astra-v1"
        }
      }
    });

  return true;
}

async function main() {
  const [profile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, TARGET_EMAIL)).limit(1);
  if (!profile) throw new Error(`No v2 profile found for ${TARGET_EMAIL}. Sign in once before importing.`);

  const subjects = await loadV1PrivateSubjects();
  const reports = await loadV1PrivateReportDocuments(subjects);
  await clearPreviousV1Import(profile.userId);
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));

  const summary = {
    email: TARGET_EMAIL,
    userId: profile.userId,
    privateSubjectsFound: subjects.length,
    alliesImported: 0,
    selfChartsImported: 0,
    allyChartsImported: 0,
    privateReportsFound: reports.length,
    privateReportsImported: 0,
    skippedWithoutBirthData: [] as string[]
  };

  for (const subject of subjects) {
    const source = subject.id === SELF_SUBJECT_ID || subject.relationship_tag === "self" ? "self" : "ally";
    const birthData = v1SubjectBirthData(subject);
    if (!birthData) {
      summary.skippedWithoutBirthData.push(`${subject.id} ${subject.name}`);
      continue;
    }
    if (source === "ally") {
      await upsertAlly(profile.userId, subject);
      summary.alliesImported += 1;
    }
    const chartId = await upsertChartRequest(profile.userId, subject, source);
    if (chartId && source === "self") summary.selfChartsImported += 1;
    if (chartId && source === "ally") summary.allyChartsImported += 1;
  }

  for (const report of reports) {
    if (await upsertImportedReport(profile.userId, report, subjectsById)) {
      summary.privateReportsImported += 1;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

try {
  await main();
} finally {
  await closeDatabaseConnection();
}
