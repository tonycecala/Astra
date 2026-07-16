import {
  allySchema,
  astrologyReportRequestSchema,
  astrologyReportResultSchema,
  chartMakerRequestSchema,
  chartMakerResultSchema,
  portableUserDataBundleSchema,
  type PortableUserDataBundle
} from "@astra/contracts";
import { and, eq, inArray } from "drizzle-orm";
import type { AstraDb } from "./client";
import {
  allies,
  appUserProfiles,
  astrologyReportRequests,
  astrologyReportResults,
  chartRequests,
  chartResults,
  user
} from "./schema";

export type PortableUserDataCounts = {
  allies: number;
  chartRequests: number;
  chartResults: number;
  reportRequests: number;
  reportResults: number;
};

export type PortableUserDataImportPreview = {
  targetUserId: string;
  targetEmail: string;
  counts: PortableUserDataCounts;
  creates: PortableUserDataCounts;
  updates: PortableUserDataCounts;
};

export async function exportPortableUserData(
  database: AstraDb,
  input: { email: string; sourceLabel: string }
): Promise<PortableUserDataBundle> {
  const email = input.email.trim().toLowerCase();
  const [profile] = await database.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
  if (!profile) throw new Error(`No Astra profile found for ${email}.`);

  const [allyRows, chartRequestRows, chartResultRows, reportRequestRows, reportResultRows] = await Promise.all([
    database.select().from(allies).where(eq(allies.userId, profile.userId)),
    database.select().from(chartRequests).where(eq(chartRequests.userId, profile.userId)),
    database.select().from(chartResults).where(eq(chartResults.userId, profile.userId)),
    database.select().from(astrologyReportRequests).where(eq(astrologyReportRequests.userId, profile.userId)),
    database.select().from(astrologyReportResults).where(eq(astrologyReportResults.userId, profile.userId))
  ]);

  return portableUserDataBundleSchema.parse({
    format: "astra-portable-user-data",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    source: { label: input.sourceLabel.trim() },
    account: {
      sourceUserId: profile.userId,
      email: profile.email,
      displayName: profile.displayName
    },
    data: {
      allies: allyRows.map((row) => allySchema.parse({ ...row, note: row.note ?? undefined, createdAt: iso(row.createdAt) })),
      chartRequests: chartRequestRows.map((row) =>
        chartMakerRequestSchema.parse({
          ...row,
          question: row.question ?? undefined,
          intent: row.intent ?? undefined,
          createdAt: iso(row.createdAt),
          updatedAt: iso(row.updatedAt)
        })
      ),
      chartResults: chartResultRows.map((row) =>
        chartMakerResultSchema.parse({
          ...row,
          summary: row.summary ?? undefined,
          error: row.error ?? undefined,
          createdAt: iso(row.createdAt)
        })
      ),
      reportRequests: reportRequestRows.map((row) =>
        astrologyReportRequestSchema.parse({
          ...row,
          chartRequestId: row.chartRequestId ?? undefined,
          question: row.question ?? undefined,
          intent: row.intent ?? undefined,
          engine: row.engine ?? undefined,
          engineVersion: row.engineVersion ?? undefined,
          reportBasis: row.reportBasis ?? undefined,
          createdAt: iso(row.createdAt),
          updatedAt: iso(row.updatedAt)
        })
      ),
      reportResults: reportResultRows.map((row) =>
        astrologyReportResultSchema.parse({
          ...row,
          summary: row.summary ?? undefined,
          publicSignal: row.publicSignal ?? undefined,
          reportBasis: row.reportBasis ?? undefined,
          generationMetadata: row.generationMetadata ?? undefined,
          error: row.error ?? undefined,
          createdAt: iso(row.createdAt)
        })
      )
    }
  });
}

export async function previewPortableUserDataImport(
  database: AstraDb,
  input: { bundle: PortableUserDataBundle; targetEmail: string }
): Promise<PortableUserDataImportPreview> {
  const bundle = portableUserDataBundleSchema.parse(input.bundle);
  const targetEmail = input.targetEmail.trim().toLowerCase();
  const [targetUser] = await database.select().from(user).where(eq(user.email, targetEmail)).limit(1);
  if (!targetUser) throw new Error(`The target Better Auth account ${targetEmail} does not exist. Sign in normally before importing.`);
  const [targetProfile] = await database.select().from(appUserProfiles).where(eq(appUserProfiles.userId, targetUser.id)).limit(1);
  if (!targetProfile) throw new Error(`The target Astra profile ${targetEmail} does not exist. Open a signed-in Astra page before importing.`);

  const counts = bundleCounts(bundle);
  const existing = await existingOwnedIds(database, bundle, targetUser.id);
  await assertNoForeignOwnership(database, bundle, targetUser.id);
  await assertResultRequestMappings(database, bundle, targetUser.id);

  const updates: PortableUserDataCounts = {
    allies: existing.allies.size,
    chartRequests: existing.chartRequests.size,
    chartResults: existing.chartResults.size,
    reportRequests: existing.reportRequests.size,
    reportResults: existing.reportResults.size
  };
  const creates: PortableUserDataCounts = {
    allies: counts.allies - updates.allies,
    chartRequests: counts.chartRequests - updates.chartRequests,
    chartResults: counts.chartResults - updates.chartResults,
    reportRequests: counts.reportRequests - updates.reportRequests,
    reportResults: counts.reportResults - updates.reportResults
  };

  return { targetUserId: targetUser.id, targetEmail, counts, creates, updates };
}

export async function importPortableUserData(
  database: AstraDb,
  input: { bundle: PortableUserDataBundle; targetEmail: string }
): Promise<PortableUserDataImportPreview> {
  const preview = await previewPortableUserDataImport(database, input);
  const bundle = portableUserDataBundleSchema.parse(input.bundle);
  const targetUserId = preview.targetUserId;

  await database.transaction(async (tx) => {
    for (const row of bundle.data.allies) {
      await tx
        .insert(allies)
        .values({ ...row, userId: targetUserId, note: row.note ?? null, createdAt: date(row.createdAt) })
        .onConflictDoUpdate({
          target: allies.id,
          set: { name: row.name, kind: row.kind, relationship: row.relationship, note: row.note ?? null }
        });
    }

    for (const row of bundle.data.chartRequests) {
      await tx
        .insert(chartRequests)
        .values({
          ...row,
          userId: targetUserId,
          question: row.question ?? null,
          intent: row.intent ?? null,
          context: row.context ?? {},
          createdAt: date(row.createdAt),
          updatedAt: date(row.updatedAt)
        })
        .onConflictDoUpdate({
          target: chartRequests.id,
          set: {
            subjectName: row.subjectName,
            birthData: row.birthData,
            question: row.question ?? null,
            intent: row.intent ?? null,
            context: row.context ?? {},
            source: row.source,
            status: row.status,
            updatedAt: date(row.updatedAt)
          }
        });
    }

    for (const row of bundle.data.chartResults) {
      await tx
        .insert(chartResults)
        .values({
          ...row,
          userId: targetUserId,
          summary: row.summary ?? null,
          error: row.error ?? null,
          createdAt: date(row.createdAt)
        })
        .onConflictDoUpdate({
          target: chartResults.id,
          set: {
            engine: row.engine,
            status: row.status,
            summary: row.summary ?? null,
            chartData: row.chartData,
            error: row.error ?? null
          }
        });
    }

    for (const row of bundle.data.reportRequests) {
      await tx
        .insert(astrologyReportRequests)
        .values({
          ...row,
          userId: targetUserId,
          chartRequestId: row.chartRequestId ?? null,
          question: row.question ?? null,
          intent: row.intent ?? null,
          context: row.context ?? {},
          engine: row.engine ?? null,
          engineVersion: row.engineVersion ?? null,
          reportBasis: row.reportBasis ?? null,
          createdAt: date(row.createdAt),
          updatedAt: date(row.updatedAt)
        })
        .onConflictDoUpdate({
          target: astrologyReportRequests.id,
          set: {
            chartRequestId: row.chartRequestId ?? null,
            reportType: row.reportType,
            subjectName: row.subjectName,
            birthData: row.birthData,
            question: row.question ?? null,
            intent: row.intent ?? null,
            context: row.context ?? {},
            source: row.source,
            boundary: row.boundary,
            status: row.status,
            engine: row.engine ?? null,
            engineVersion: row.engineVersion ?? null,
            costCredits: row.costCredits,
            reportBasis: row.reportBasis ?? null,
            updatedAt: date(row.updatedAt)
          }
        });
    }

    for (const row of bundle.data.reportResults) {
      await tx
        .insert(astrologyReportResults)
        .values({
          ...row,
          userId: targetUserId,
          summary: row.summary ?? null,
          publicSignal: row.publicSignal ?? null,
          reportBasis: row.reportBasis ?? null,
          generationMetadata: row.generationMetadata ?? null,
          error: row.error ?? null,
          createdAt: date(row.createdAt)
        })
        .onConflictDoUpdate({
          target: astrologyReportResults.id,
          set: {
            engine: row.engine,
            engineVersion: row.engineVersion,
            status: row.status,
            summary: row.summary ?? null,
            sections: row.sections,
            provenance: row.provenance,
            publicSignal: row.publicSignal ?? null,
            reportBasis: row.reportBasis ?? null,
            generationMetadata: row.generationMetadata ?? null,
            error: row.error ?? null
          }
        });
    }
  });

  return preview;
}

function bundleCounts(bundle: PortableUserDataBundle): PortableUserDataCounts {
  return {
    allies: bundle.data.allies.length,
    chartRequests: bundle.data.chartRequests.length,
    chartResults: bundle.data.chartResults.length,
    reportRequests: bundle.data.reportRequests.length,
    reportResults: bundle.data.reportResults.length
  };
}

async function existingOwnedIds(database: AstraDb, bundle: PortableUserDataBundle, targetUserId: string) {
  return {
    allies: await ownedIds(database, allies, bundle.data.allies.map((row) => row.id), targetUserId),
    chartRequests: await ownedIds(database, chartRequests, bundle.data.chartRequests.map((row) => row.id), targetUserId),
    chartResults: await ownedIds(database, chartResults, bundle.data.chartResults.map((row) => row.id), targetUserId),
    reportRequests: await ownedIds(database, astrologyReportRequests, bundle.data.reportRequests.map((row) => row.id), targetUserId),
    reportResults: await ownedIds(database, astrologyReportResults, bundle.data.reportResults.map((row) => row.id), targetUserId)
  };
}

async function assertNoForeignOwnership(database: AstraDb, bundle: PortableUserDataBundle, targetUserId: string) {
  const collections = [
    ["Ally", allies, bundle.data.allies.map((row) => row.id)],
    ["Chart request", chartRequests, bundle.data.chartRequests.map((row) => row.id)],
    ["Chart result", chartResults, bundle.data.chartResults.map((row) => row.id)],
    ["Report request", astrologyReportRequests, bundle.data.reportRequests.map((row) => row.id)],
    ["Report result", astrologyReportResults, bundle.data.reportResults.map((row) => row.id)]
  ] as const;
  for (const [label, table, ids] of collections) {
    if (!ids.length) continue;
    const rows = await database.select({ id: table.id, userId: table.userId }).from(table).where(inArray(table.id, ids));
    const collision = rows.find((row) => row.userId !== targetUserId);
    if (collision) throw new Error(`${label} ${collision.id} belongs to another user; import refused.`);
  }
}

async function assertResultRequestMappings(database: AstraDb, bundle: PortableUserDataBundle, targetUserId: string) {
  const chartMap = new Map(bundle.data.chartResults.map((row) => [row.requestId, row.id]));
  if (chartMap.size) {
    const rows = await database
      .select({ id: chartResults.id, requestId: chartResults.requestId, userId: chartResults.userId })
      .from(chartResults)
      .where(inArray(chartResults.requestId, [...chartMap.keys()]));
    const collision = rows.find((row) => row.userId !== targetUserId || chartMap.get(row.requestId) !== row.id);
    if (collision) throw new Error(`Chart result request mapping ${collision.requestId} conflicts with existing data; import refused.`);
  }

  const reportMap = new Map(bundle.data.reportResults.map((row) => [row.requestId, row.id]));
  if (reportMap.size) {
    const rows = await database
      .select({ id: astrologyReportResults.id, requestId: astrologyReportResults.requestId, userId: astrologyReportResults.userId })
      .from(astrologyReportResults)
      .where(inArray(astrologyReportResults.requestId, [...reportMap.keys()]));
    const collision = rows.find((row) => row.userId !== targetUserId || reportMap.get(row.requestId) !== row.id);
    if (collision) throw new Error(`Report result request mapping ${collision.requestId} conflicts with existing data; import refused.`);
  }
}

async function ownedIds(
  database: AstraDb,
  table: typeof allies | typeof chartRequests | typeof chartResults | typeof astrologyReportRequests | typeof astrologyReportResults,
  ids: string[],
  targetUserId: string
) {
  if (!ids.length) return new Set<string>();
  const rows = await database.select({ id: table.id }).from(table).where(and(inArray(table.id, ids), eq(table.userId, targetUserId)));
  return new Set(rows.map((row) => row.id));
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function date(value: string) {
  return new Date(value);
}
