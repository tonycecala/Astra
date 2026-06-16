import { and, asc, desc, eq } from "drizzle-orm";
import {
  type ComposerStreamArtifact,
  type ChartBirthData,
  type ChartMakerRequest,
  type ChartMakerResult,
  type RecordChartMakerResult,
  chartBirthDataSchema,
  chartMakerRequestSchema,
  chartMakerResultSchema,
  composerStreamArtifactSchema,
  type FoundationSeed,
  foundationSeedSchema
} from "@astra/contracts";
import type { AstraDb } from "./client";
import { getSeedForDatabase } from "./seed";
import {
  achievements,
  allies,
  appUserProfiles,
  artifacts,
  cards,
  chartRequests,
  chartResults,
  gifts,
  starTransactions,
  streamItems,
  user
} from "./schema";

export type FoundationSnapshot = FoundationSeed;

export type FoundationSeedResult = {
  user: number;
  cards: number;
  streamItems: number;
  achievements: number;
  allies: number;
  artifacts: number;
  gifts: number;
  starTransactions: number;
};

export type FoundationResetResult = {
  cleared: true;
};

export type AuthUserProfileInput = {
  userId: string;
  email: string;
  displayName: string;
};

export type CreateChartMakerRequestInput = {
  userId: string;
  subjectName: string;
  birthData: ChartBirthData;
  question?: string;
  intent?: string;
  context?: Record<string, unknown>;
  source?: ChartMakerRequest["source"];
};

export type RecordChartMakerResultInput = RecordChartMakerResult;
export type UpsertComposerStreamArtifactInput = ComposerStreamArtifact;

function toDate(value: string) {
  return new Date(value);
}

function toIsoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function chartRequestFromRow(row: typeof chartRequests.$inferSelect): ChartMakerRequest {
  return chartMakerRequestSchema.parse({
    id: row.id,
    userId: row.userId,
    subjectName: row.subjectName,
    birthData: row.birthData,
    question: row.question ?? undefined,
    intent: row.intent ?? undefined,
    context: row.context,
    source: row.source,
    status: row.status,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt)
  });
}

function chartResultFromRow(row: typeof chartResults.$inferSelect): ChartMakerResult {
  return chartMakerResultSchema.parse({
    id: row.id,
    requestId: row.requestId,
    userId: row.userId,
    engine: row.engine,
    status: row.status,
    summary: row.summary ?? undefined,
    chartData: row.chartData,
    error: row.error ?? undefined,
    createdAt: toIsoDate(row.createdAt)
  });
}

function cardFromRow(row: typeof cards.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    body: row.body,
    lane: row.lane,
    tone: row.tone,
    ctaLabel: row.ctaLabel ?? undefined,
    ctaAction: row.ctaAction ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    publishedAt: toIsoDate(row.publishedAt)
  };
}

function streamItemFromRow(row: typeof streamItems.$inferSelect) {
  return {
    id: row.id,
    cardId: row.cardId,
    kind: row.kind,
    position: row.position,
    status: row.status,
    audience: row.audience
  };
}

export function seedSnapshot(): FoundationSnapshot {
  return foundationSeedSchema.parse(getSeedForDatabase());
}

export async function readFoundationSnapshot(database: AstraDb): Promise<FoundationSnapshot> {
  const [profile] = await database.select().from(appUserProfiles).orderBy(asc(appUserProfiles.createdAt)).limit(1);
  const cardRows = await database.select().from(cards).orderBy(asc(cards.publishedAt));
  const streamRows = await database.select().from(streamItems).where(eq(streamItems.status, "published")).orderBy(asc(streamItems.position));
  const achievementRows = await database.select().from(achievements).orderBy(asc(achievements.createdAt));
  const allyRows = await database.select().from(allies).orderBy(asc(allies.createdAt));
  const artifactRows = await database.select().from(artifacts).orderBy(asc(artifacts.createdAt));
  const giftRows = await database.select().from(gifts).orderBy(asc(gifts.createdAt));
  const starRows = await database.select().from(starTransactions).orderBy(asc(starTransactions.createdAt));

  if (!profile) {
    throw new Error("No Astra profile found. Run npm run db:seed -- --execute against a migrated local database.");
  }

  return foundationSeedSchema.parse({
    user: {
      id: profile.userId,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      onboardingStatus: profile.onboardingStatus,
      starBalance: profile.starBalance,
      createdAt: toIsoDate(profile.createdAt)
    },
    cards: cardRows.map(cardFromRow),
    streamItems: streamRows.map(streamItemFromRow),
    achievements: achievementRows.map(
      (achievement) =>
        ({
          id: achievement.id,
          userId: achievement.userId,
          title: achievement.title,
          description: achievement.description,
          earnedAt: achievement.earnedAt ? toIsoDate(achievement.earnedAt) : undefined,
          starReward: achievement.starReward
        })
    ),
    allies: allyRows.map(
      (ally) =>
        ({
          id: ally.id,
          userId: ally.userId,
          name: ally.name,
          kind: ally.kind,
          relationship: ally.relationship,
          note: ally.note ?? undefined,
          createdAt: toIsoDate(ally.createdAt)
        })
    ),
    artifacts: artifactRows.map(
      (artifact) =>
        ({
          id: artifact.id,
          userId: artifact.userId,
          title: artifact.title,
          kind: artifact.kind,
          summary: artifact.summary,
          createdAt: toIsoDate(artifact.createdAt)
        })
    ),
    gifts: giftRows.map(
      (gift) =>
        ({
          id: gift.id,
          code: gift.code,
          name: gift.name,
          description: gift.description,
          starCost: gift.starCost,
          active: gift.active
        })
    ),
    starTransactions: starRows.map(
      (transaction) =>
        ({
          id: transaction.id,
          userId: transaction.userId,
          amount: transaction.amount,
          direction: transaction.direction,
          reason: transaction.reason,
          createdAt: toIsoDate(transaction.createdAt)
        })
    )
  });
}

export async function seedFoundationData(
  database: AstraDb,
  seed: FoundationSnapshot = seedSnapshot()
): Promise<FoundationSeedResult> {
  const parsed = foundationSeedSchema.parse(seed);

  await database
    .insert(user)
    .values({
      id: parsed.user.id,
      name: parsed.user.displayName,
      email: parsed.user.email,
      emailVerified: true,
      createdAt: toDate(parsed.user.createdAt),
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: user.id,
      set: {
        name: parsed.user.displayName,
        email: parsed.user.email,
        emailVerified: true,
        updatedAt: new Date()
      }
    });

  await database
    .insert(appUserProfiles)
    .values({
      id: `${parsed.user.id}:profile`,
      userId: parsed.user.id,
      email: parsed.user.email,
      displayName: parsed.user.displayName,
      role: parsed.user.role,
      onboardingStatus: parsed.user.onboardingStatus,
      starBalance: parsed.user.starBalance,
      createdAt: toDate(parsed.user.createdAt),
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: appUserProfiles.userId,
      set: {
        email: parsed.user.email,
        displayName: parsed.user.displayName,
        role: parsed.user.role,
        onboardingStatus: parsed.user.onboardingStatus,
        starBalance: parsed.user.starBalance,
        updatedAt: new Date()
      }
    });

  for (const card of parsed.cards) {
    await database
      .insert(cards)
      .values({
        ...card,
        subtitle: card.subtitle ?? null,
        ctaLabel: card.ctaLabel ?? null,
        ctaAction: card.ctaAction ?? null,
        imageUrl: card.imageUrl ?? null,
        publishedAt: toDate(card.publishedAt),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: cards.id,
        set: {
          title: card.title,
          subtitle: card.subtitle ?? null,
          body: card.body,
          lane: card.lane,
          tone: card.tone,
          ctaLabel: card.ctaLabel ?? null,
          ctaAction: card.ctaAction ?? null,
          imageUrl: card.imageUrl ?? null,
          publishedAt: toDate(card.publishedAt),
          updatedAt: new Date()
        }
      });
  }

  for (const item of parsed.streamItems) {
    await database
      .insert(streamItems)
      .values(item)
      .onConflictDoUpdate({
        target: streamItems.id,
        set: {
          cardId: item.cardId,
          kind: item.kind,
          position: item.position,
          status: item.status,
          audience: item.audience
        }
      });
  }

  for (const achievement of parsed.achievements) {
    await database
      .insert(achievements)
      .values({
        ...achievement,
        earnedAt: achievement.earnedAt ? toDate(achievement.earnedAt) : null
      })
      .onConflictDoUpdate({
        target: achievements.id,
        set: {
          title: achievement.title,
          description: achievement.description,
          earnedAt: achievement.earnedAt ? toDate(achievement.earnedAt) : null,
          starReward: achievement.starReward
        }
      });
  }

  for (const ally of parsed.allies) {
    await database
      .insert(allies)
      .values({ ...ally, note: ally.note ?? null, createdAt: toDate(ally.createdAt) })
      .onConflictDoUpdate({
        target: allies.id,
        set: {
          name: ally.name,
          kind: ally.kind,
          relationship: ally.relationship,
          note: ally.note ?? null
        }
      });
  }

  for (const artifact of parsed.artifacts) {
    await database
      .insert(artifacts)
      .values({ ...artifact, payload: {}, createdAt: toDate(artifact.createdAt) })
      .onConflictDoUpdate({
        target: artifacts.id,
        set: {
          title: artifact.title,
          kind: artifact.kind,
          summary: artifact.summary,
          payload: {}
        }
      });
  }

  for (const gift of parsed.gifts) {
    await database
      .insert(gifts)
      .values({ ...gift, metadata: {}, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: gifts.id,
        set: {
          code: gift.code,
          name: gift.name,
          description: gift.description,
          starCost: gift.starCost,
          active: gift.active,
          metadata: {},
          updatedAt: new Date()
        }
      });
  }

  for (const transaction of parsed.starTransactions) {
    await database
      .insert(starTransactions)
      .values({ ...transaction, createdAt: toDate(transaction.createdAt) })
      .onConflictDoUpdate({
        target: starTransactions.id,
        set: {
          amount: transaction.amount,
          direction: transaction.direction,
          reason: transaction.reason,
          createdAt: toDate(transaction.createdAt)
        }
      });
  }

  return {
    user: 1,
    cards: parsed.cards.length,
    streamItems: parsed.streamItems.length,
    achievements: parsed.achievements.length,
    allies: parsed.allies.length,
    artifacts: parsed.artifacts.length,
    gifts: parsed.gifts.length,
    starTransactions: parsed.starTransactions.length
  };
}

export async function resetFoundationData(database: AstraDb): Promise<FoundationResetResult> {
  await database.delete(chartResults);
  await database.delete(chartRequests);
  await database.delete(starTransactions);
  await database.delete(gifts);
  await database.delete(artifacts);
  await database.delete(allies);
  await database.delete(achievements);
  await database.delete(streamItems);
  await database.delete(cards);
  await database.delete(appUserProfiles);
  await database.delete(user);

  return { cleared: true };
}

export async function upsertAuthUserProfile(database: AstraDb, input: AuthUserProfileInput) {
  const now = new Date();

  const [profile] = await database
    .insert(appUserProfiles)
    .values({
      id: `${input.userId}:profile`,
      userId: input.userId,
      email: input.email,
      displayName: input.displayName,
      role: "customer",
      onboardingStatus: "pending",
      starBalance: 0,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: appUserProfiles.userId,
      set: {
        email: input.email,
        displayName: input.displayName,
        updatedAt: now
      }
    })
    .returning();

  return profile;
}

export async function createChartMakerRequest(
  database: AstraDb,
  input: CreateChartMakerRequestInput
): Promise<ChartMakerRequest> {
  const birthData = chartBirthDataSchema.parse(input.birthData);
  const now = new Date();

  const [request] = await database
    .insert(chartRequests)
    .values({
      userId: input.userId,
      subjectName: input.subjectName,
      birthData,
      question: input.question ?? null,
      intent: input.intent ?? null,
      context: input.context ?? {},
      source: input.source ?? "self",
      status: "queued",
      createdAt: now,
      updatedAt: now
    })
    .returning();

  return chartRequestFromRow(request);
}

export async function listUserChartMakerRequests(database: AstraDb, userId: string): Promise<ChartMakerRequest[]> {
  const rows = await database
    .select()
    .from(chartRequests)
    .where(eq(chartRequests.userId, userId))
    .orderBy(desc(chartRequests.createdAt));

  return rows.map(chartRequestFromRow);
}

export async function recordChartMakerResult(
  database: AstraDb,
  input: RecordChartMakerResultInput
): Promise<ChartMakerResult> {
  const now = new Date();

  return database.transaction(async (tx) => {
    const [request] = await tx
      .select({ id: chartRequests.id })
      .from(chartRequests)
      .where(and(eq(chartRequests.id, input.requestId), eq(chartRequests.userId, input.userId)))
      .limit(1);

    if (!request) {
      throw new Error("Chart request was not found for the supplied user.");
    }

    const [result] = await tx
      .insert(chartResults)
      .values({
        requestId: input.requestId,
        userId: input.userId,
        engine: input.engine,
        status: input.status,
        summary: input.summary ?? null,
        chartData: input.chartData ?? {},
        error: input.error ?? null,
        createdAt: now
      })
      .onConflictDoUpdate({
        target: chartResults.requestId,
        set: {
          engine: input.engine,
          status: input.status,
          summary: input.summary ?? null,
          chartData: input.chartData ?? {},
          error: input.error ?? null,
          createdAt: now
        }
      })
      .returning();

    await tx
      .update(chartRequests)
      .set({ status: input.status, updatedAt: now })
      .where(and(eq(chartRequests.id, input.requestId), eq(chartRequests.userId, input.userId)));

    return chartResultFromRow(result);
  });
}

export async function upsertComposerStreamArtifact(
  database: AstraDb,
  input: UpsertComposerStreamArtifactInput
): Promise<ComposerStreamArtifact> {
  const artifact = composerStreamArtifactSchema.parse(input);
  const now = new Date();

  return database.transaction(async (tx) => {
    await tx
      .insert(cards)
      .values({
        ...artifact.card,
        subtitle: artifact.card.subtitle ?? artifact.rationale.reason,
        ctaLabel: artifact.card.ctaLabel ?? null,
        ctaAction: artifact.card.ctaAction ?? null,
        imageUrl: artifact.card.imageUrl ?? null,
        publishedAt: toDate(artifact.card.publishedAt),
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: cards.id,
        set: {
          title: artifact.card.title,
          subtitle: artifact.card.subtitle ?? artifact.rationale.reason,
          body: artifact.card.body,
          lane: artifact.card.lane,
          tone: artifact.card.tone,
          ctaLabel: artifact.card.ctaLabel ?? null,
          ctaAction: artifact.card.ctaAction ?? null,
          imageUrl: artifact.card.imageUrl ?? null,
          publishedAt: toDate(artifact.card.publishedAt),
          updatedAt: now
        }
      });

    await tx
      .insert(streamItems)
      .values(artifact.streamItem)
      .onConflictDoUpdate({
        target: streamItems.id,
        set: {
          cardId: artifact.streamItem.cardId,
          kind: artifact.streamItem.kind,
          position: artifact.streamItem.position,
          status: artifact.streamItem.status,
          audience: artifact.streamItem.audience
        }
      });

    return artifact;
  });
}

export function assertResetAllowed(databaseUrl: string, override = process.env.ASTRA_ALLOW_DB_RESET === "1") {
  const parsed = new URL(databaseUrl);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

  if (localHosts.has(parsed.hostname) || override) return;

  throw new Error(
    `Refusing to reset non-local database host "${parsed.hostname}". Set ASTRA_ALLOW_DB_RESET=1 only for a disposable database.`
  );
}
