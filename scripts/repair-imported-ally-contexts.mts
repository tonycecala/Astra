import { normalizeAllyRelationshipTag } from "@astra/contracts";
import { allies, chartRequests, closeDatabaseConnection, db } from "@astra/db";
import { and, eq, like } from "drizzle-orm";

const apply = process.argv.includes("--apply");

type ImportedAlly = typeof allies.$inferSelect;
type ImportedChart = typeof chartRequests.$inferSelect;

try {
  const [importedAllies, importedCharts] = await Promise.all([
    db.select().from(allies).where(like(allies.id, "v1-ally:%")),
    db.select().from(chartRequests).where(and(like(chartRequests.id, "v1-chart:%"), eq(chartRequests.source, "ally")))
  ]);
  const alliesById = new Map(importedAllies.map((ally) => [ally.id, ally]));
  const allyRepairs = importedAllies.flatMap((ally) => {
    const relationship = normalizeAllyRelationshipTag(ally.relationship) ?? ally.relationship.trim();
    return relationship === ally.relationship ? [] : [{ ally, relationship }];
  });
  const chartRepairs = importedCharts.flatMap((chart) => {
    const ally = liveAllyForChart(chart, alliesById);
    if (!ally) return [];
    const relationship = normalizeAllyRelationshipTag(ally.relationship) ?? ally.relationship.trim();
    const context: Record<string, unknown> = isRecord(chart.context) ? chart.context : {};
    const subject = isRecord(context.subject) ? context.subject : {};
    const { note: _staleNote, ...subjectWithoutNote } = subject;
    const nextSubject = {
      ...subjectWithoutNote,
      allyId: ally.id,
      displayName: ally.name,
      relationship,
      ...(ally.note ? { note: ally.note } : {})
    };
    const changed = chart.subjectName !== ally.name ||
      subject.allyId !== ally.id ||
      subject.displayName !== ally.name ||
      subject.relationship !== relationship ||
      (subject.note ?? undefined) !== (ally.note ?? undefined);
    return changed ? [{ chart, ally, context: { ...context, subject: nextSubject } }] : [];
  });
  const orphanCharts = importedCharts.filter((chart) => !liveAllyForChart(chart, alliesById));

  console.log(`${apply ? "Applying" : "Dry run:"} ${allyRepairs.length} canonical Ally tag repairs and ${chartRepairs.length} linked chart-context repairs.`);
  console.log(`Preserving ${orphanCharts.length} orphan imported Ally charts; no reports will be changed.`);

  if (!apply) {
    console.log("No data changed. Re-run with --apply after reviewing these counts.");
  } else {
    await db.transaction(async (tx) => {
      for (const { ally, relationship } of allyRepairs) {
        await tx.update(allies).set({ relationship }).where(and(eq(allies.id, ally.id), eq(allies.userId, ally.userId)));
      }
      for (const { chart, ally, context } of chartRepairs) {
        await tx
          .update(chartRequests)
          .set({ subjectName: ally.name, context, updatedAt: new Date() })
          .where(and(eq(chartRequests.id, chart.id), eq(chartRequests.userId, chart.userId)));
      }
    });

    const remaining = await remainingRepairCount();
    if (remaining !== 0) throw new Error(`Imported Ally repair left ${remaining} linked chart contexts stale.`);
    console.log(`Verified ${allyRepairs.length} canonical tags and ${chartRepairs.length} linked chart contexts; existing reports were untouched.`);
  }
} finally {
  await closeDatabaseConnection();
}

function liveAllyForChart(chart: ImportedChart, alliesById: ReadonlyMap<string, ImportedAlly>) {
  const context: Record<string, unknown> = isRecord(chart.context) ? chart.context : {};
  const subject = isRecord(context.subject) ? context.subject : {};
  const rawId = typeof subject.allyId === "string"
    ? subject.allyId
    : typeof subject.subjectId === "string"
      ? subject.subjectId
      : "";
  if (!rawId) return undefined;
  return alliesById.get(rawId) ?? alliesById.get(rawId.startsWith("v1-ally:") ? rawId : `v1-ally:${rawId}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function remainingRepairCount() {
  const [importedAllies, importedCharts] = await Promise.all([
    db.select().from(allies).where(like(allies.id, "v1-ally:%")),
    db.select().from(chartRequests).where(and(like(chartRequests.id, "v1-chart:%"), eq(chartRequests.source, "ally")))
  ]);
  const alliesById = new Map(importedAllies.map((ally) => [ally.id, ally]));
  const staleAllies = importedAllies.filter((ally) => (normalizeAllyRelationshipTag(ally.relationship) ?? ally.relationship.trim()) !== ally.relationship).length;
  const staleCharts = importedCharts.filter((chart) => {
    const ally = liveAllyForChart(chart, alliesById);
    if (!ally) return false;
    const context: Record<string, unknown> = isRecord(chart.context) ? chart.context : {};
    const subject = isRecord(context.subject) ? context.subject : {};
    const relationship = normalizeAllyRelationshipTag(ally.relationship) ?? ally.relationship.trim();
    return chart.subjectName !== ally.name || subject.allyId !== ally.id || subject.displayName !== ally.name || subject.relationship !== relationship || (subject.note ?? undefined) !== (ally.note ?? undefined);
  }).length;
  return staleAllies + staleCharts;
}
