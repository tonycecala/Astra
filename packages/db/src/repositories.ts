import { and, asc, desc, eq } from "drizzle-orm";
import {
  type Artifact,
  type AstrologyReportRequest,
  type AstrologyReportResult,
  type ComposerDecision,
  type CreateComposerDecision,
  type CreateUserFeedItem,
  type ComposerStreamArtifact,
  type ChartBirthData,
  type ChartMakerRequest,
  type ChartMakerResult,
  type PrivateFeedRequest,
  type PrivateFeedResponse,
  type PublicStreamItem,
  type RecordChartMakerResult,
  type RecordAstrologyReportResult,
  type SourceCard,
  type UserFeedItem,
  artifactSchema,
  astrologyReportRequestSchema,
  astrologyReportResultSchema,
  chartBirthDataSchema,
  chartMakerRequestSchema,
  chartMakerResultSchema,
  composerDecisionSchema,
  createComposerDecisionSchema,
  createAstrologyReportRequestSchema,
  createUserFeedItemSchema,
  composerStreamArtifactSchema,
  type FoundationSeed,
  foundationSeedSchema,
  privateFeedRequestSchema,
  privateFeedResponseSchema,
  publicStreamItemSchema,
  sourceCardSchema,
  userFeedItemSchema
} from "@astra/contracts";
import type { AstraDb } from "./client";
import { getSeedForDatabase } from "./seed";
import {
  achievements,
  allies,
  appUserProfiles,
  astrologyReportRequests,
  astrologyReportResults,
  artifacts,
  cards,
  chartRequests,
  chartResults,
  composerDecisions,
  gifts,
  publicStreamItems,
  sourceCards,
  starTransactions,
  streamItems,
  user,
  userFeedItems
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

export type CreateAstrologyReportRequestInput = {
  userId: string;
  chartRequestId?: string;
  reportType?: AstrologyReportRequest["reportType"];
  subjectName: string;
  birthData: ChartBirthData;
  question?: string;
  intent?: string;
  context?: Record<string, unknown>;
  source?: AstrologyReportRequest["source"];
};

export type RecordChartMakerResultInput = RecordChartMakerResult;
export type RecordAstrologyReportResultInput = RecordAstrologyReportResult;
export type UpsertComposerStreamArtifactInput = ComposerStreamArtifact;
export type CreateUserFeedItemInput = CreateUserFeedItem;
export type CreateComposerDecisionInput = CreateComposerDecision;

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

function astrologyReportRequestFromRow(row: typeof astrologyReportRequests.$inferSelect): AstrologyReportRequest {
  return astrologyReportRequestSchema.parse({
    id: row.id,
    userId: row.userId,
    chartRequestId: row.chartRequestId ?? undefined,
    reportType: row.reportType,
    subjectName: row.subjectName,
    birthData: row.birthData,
    question: row.question ?? undefined,
    intent: row.intent ?? undefined,
    context: row.context,
    source: row.source,
    boundary: row.boundary,
    status: row.status,
    engine: row.engine ?? undefined,
    engineVersion: row.engineVersion ?? undefined,
    costCredits: row.costCredits,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt)
  });
}

function astrologyReportResultFromRow(row: typeof astrologyReportResults.$inferSelect): AstrologyReportResult {
  return astrologyReportResultSchema.parse({
    id: row.id,
    requestId: row.requestId,
    userId: row.userId,
    engine: row.engine,
    engineVersion: row.engineVersion,
    status: row.status,
    summary: row.summary ?? undefined,
    sections: row.sections,
    provenance: row.provenance,
    publicSignal: row.publicSignal ?? undefined,
    error: row.error ?? undefined,
    createdAt: toIsoDate(row.createdAt)
  });
}

function artifactFromRow(row: typeof artifacts.$inferSelect): Artifact {
  return artifactSchema.parse({
    id: row.id,
    userId: row.userId,
    title: row.title,
    kind: row.kind,
    summary: row.summary,
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

function sourceCardFromRow(row: typeof sourceCards.$inferSelect): SourceCard {
  return sourceCardSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    bodyTemplate: row.bodyTemplate,
    cardType: row.cardType,
    topicTags: row.topicTags,
    symbolicTags: row.symbolicTags,
    eligibilityRules: row.eligibilityRules,
    safetyFlags: row.safetyFlags,
    status: row.status,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt)
  });
}

function publicStreamItemFromRow(row: typeof publicStreamItems.$inferSelect): PublicStreamItem {
  return publicStreamItemSchema.parse({
    id: row.id,
    sourceCardId: row.sourceCardId ?? undefined,
    title: row.title,
    body: row.body,
    audienceScope: row.audienceScope,
    status: row.status,
    publishAt: toIsoDate(row.publishAt),
    expiresAt: row.expiresAt ? toIsoDate(row.expiresAt) : undefined,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt)
  });
}

function userFeedItemFromRow(row: typeof userFeedItems.$inferSelect): UserFeedItem {
  return userFeedItemSchema.parse({
    id: row.id,
    userId: row.userId,
    sourceCardId: row.sourceCardId ?? undefined,
    artifactId: row.artifactId ?? undefined,
    achievementId: row.achievementId ?? undefined,
    allyId: row.allyId ?? undefined,
    giftId: row.giftId ?? undefined,
    feedKind: row.feedKind,
    title: row.title,
    body: row.body,
    displayPayload: row.displayPayload,
    rankScore: row.rankScore,
    reasonCode: row.reasonCode,
    state: row.state,
    availableAt: toIsoDate(row.availableAt),
    expiresAt: row.expiresAt ? toIsoDate(row.expiresAt) : undefined,
    seenAt: row.seenAt ? toIsoDate(row.seenAt) : undefined,
    dismissedAt: row.dismissedAt ? toIsoDate(row.dismissedAt) : undefined,
    savedAt: row.savedAt ? toIsoDate(row.savedAt) : undefined,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt)
  });
}

function composerDecisionFromRow(row: typeof composerDecisions.$inferSelect): ComposerDecision {
  return composerDecisionSchema.parse({
    id: row.id,
    userId: row.userId,
    userFeedItemId: row.userFeedItemId,
    decisionVersion: row.decisionVersion,
    inputContextHash: row.inputContextHash,
    candidateIds: row.candidateIds,
    selectedCandidateId: row.selectedCandidateId,
    rankFeatures: row.rankFeatures,
    suppressionReasons: row.suppressionReasons,
    safetyNotes: row.safetyNotes,
    createdAt: toIsoDate(row.createdAt)
  });
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
  const giftRows = await database.select().from(gifts).orderBy(asc(gifts.createdAt));
  const starRows = await database.select().from(starTransactions).orderBy(asc(starTransactions.createdAt));

  if (!profile) {
    throw new Error("No Astra profile found. Run npm run db:seed -- --execute against a migrated local database.");
  }

  const artifactRows = await database
    .select()
    .from(artifacts)
    .where(eq(artifacts.userId, profile.userId))
    .orderBy(asc(artifacts.createdAt));

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
    artifacts: artifactRows.map(artifactFromRow),
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
  await database.delete(composerDecisions);
  await database.delete(userFeedItems);
  await database.delete(publicStreamItems);
  await database.delete(sourceCards);
  await database.delete(astrologyReportResults);
  await database.delete(astrologyReportRequests);
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

export async function upsertSourceCard(database: AstraDb, input: SourceCard): Promise<SourceCard> {
  const card = sourceCardSchema.parse(input);
  const [row] = await database
    .insert(sourceCards)
    .values({
      ...card,
      topicTags: card.topicTags,
      symbolicTags: card.symbolicTags,
      eligibilityRules: card.eligibilityRules,
      safetyFlags: card.safetyFlags,
      createdAt: toDate(card.createdAt),
      updatedAt: toDate(card.updatedAt)
    })
    .onConflictDoUpdate({
      target: sourceCards.id,
      set: {
        slug: card.slug,
        title: card.title,
        bodyTemplate: card.bodyTemplate,
        cardType: card.cardType,
        topicTags: card.topicTags,
        symbolicTags: card.symbolicTags,
        eligibilityRules: card.eligibilityRules,
        safetyFlags: card.safetyFlags,
        status: card.status,
        updatedAt: toDate(card.updatedAt)
      }
    })
    .returning();

  return sourceCardFromRow(row);
}

export async function listPublicStreamItems(database: AstraDb): Promise<PublicStreamItem[]> {
  const rows = await database
    .select()
    .from(publicStreamItems)
    .where(eq(publicStreamItems.status, "published"))
    .orderBy(asc(publicStreamItems.publishAt));

  return rows.map(publicStreamItemFromRow);
}

export async function createUserFeedItem(database: AstraDb, input: CreateUserFeedItemInput): Promise<UserFeedItem> {
  const parsed = createUserFeedItemSchema.parse(input);
  const now = new Date();
  const availableAt = parsed.availableAt ? toDate(parsed.availableAt) : now;

  const [row] = await database
    .insert(userFeedItems)
    .values({
      id: parsed.id,
      userId: parsed.userId,
      sourceCardId: parsed.sourceCardId ?? null,
      artifactId: parsed.artifactId ?? null,
      achievementId: parsed.achievementId ?? null,
      allyId: parsed.allyId ?? null,
      giftId: parsed.giftId ?? null,
      feedKind: parsed.feedKind,
      title: parsed.title,
      body: parsed.body,
      displayPayload: parsed.displayPayload,
      rankScore: Math.round(parsed.rankScore),
      reasonCode: parsed.reasonCode,
      state: parsed.state,
      availableAt,
      expiresAt: parsed.expiresAt ? toDate(parsed.expiresAt) : null,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: userFeedItems.id,
      set: {
        sourceCardId: parsed.sourceCardId ?? null,
        artifactId: parsed.artifactId ?? null,
        achievementId: parsed.achievementId ?? null,
        allyId: parsed.allyId ?? null,
        giftId: parsed.giftId ?? null,
        feedKind: parsed.feedKind,
        title: parsed.title,
        body: parsed.body,
        displayPayload: parsed.displayPayload,
        rankScore: Math.round(parsed.rankScore),
        reasonCode: parsed.reasonCode,
        state: parsed.state,
        availableAt,
        expiresAt: parsed.expiresAt ? toDate(parsed.expiresAt) : null,
        updatedAt: now
      }
    })
    .returning();

  return userFeedItemFromRow(row);
}

export async function listUserFeedItems(
  database: AstraDb,
  request: PrivateFeedRequest
): Promise<PrivateFeedResponse> {
  const parsed = privateFeedRequestSchema.parse(request);
  const filters = [eq(userFeedItems.userId, parsed.userId)];
  if (parsed.state) filters.push(eq(userFeedItems.state, parsed.state));

  const rows = await database
    .select()
    .from(userFeedItems)
    .where(and(...filters))
    .orderBy(desc(userFeedItems.rankScore), asc(userFeedItems.availableAt))
    .limit(parsed.limit);

  return privateFeedResponseSchema.parse({
    userId: parsed.userId,
    items: rows.map(userFeedItemFromRow),
    generatedAt: new Date().toISOString()
  });
}

export async function getUserFeedItemById(
  database: AstraDb,
  input: { userId: string; feedItemId: string }
): Promise<UserFeedItem | null> {
  const [row] = await database
    .select()
    .from(userFeedItems)
    .where(and(eq(userFeedItems.id, input.feedItemId), eq(userFeedItems.userId, input.userId)))
    .limit(1);

  return row ? userFeedItemFromRow(row) : null;
}

export async function assertUserOwnsFeedItem(database: AstraDb, input: { userId: string; feedItemId: string }) {
  const item = await getUserFeedItemById(database, input);
  if (!item) throw new Error("Feed item was not found for the supplied user.");
  return item;
}

export async function createComposerDecision(
  database: AstraDb,
  input: CreateComposerDecisionInput
): Promise<ComposerDecision> {
  const parsed = createComposerDecisionSchema.parse(input);
  const now = new Date();

  return database.transaction(async (tx) => {
    const [feedItem] = await tx
      .select({ id: userFeedItems.id })
      .from(userFeedItems)
      .where(and(eq(userFeedItems.id, parsed.userFeedItemId), eq(userFeedItems.userId, parsed.userId)))
      .limit(1);

    if (!feedItem) {
      throw new Error("Composer decision target feed item was not found for the supplied user.");
    }

    const [row] = await tx
      .insert(composerDecisions)
      .values({
        userId: parsed.userId,
        userFeedItemId: parsed.userFeedItemId,
        decisionVersion: parsed.decisionVersion,
        inputContextHash: parsed.inputContextHash,
        candidateIds: parsed.candidateIds,
        selectedCandidateId: parsed.selectedCandidateId,
        rankFeatures: parsed.rankFeatures,
        suppressionReasons: parsed.suppressionReasons,
        safetyNotes: parsed.safetyNotes,
        createdAt: now
      })
      .onConflictDoUpdate({
        target: composerDecisions.userFeedItemId,
        set: {
          decisionVersion: parsed.decisionVersion,
          inputContextHash: parsed.inputContextHash,
          candidateIds: parsed.candidateIds,
          selectedCandidateId: parsed.selectedCandidateId,
          rankFeatures: parsed.rankFeatures,
          suppressionReasons: parsed.suppressionReasons,
          safetyNotes: parsed.safetyNotes,
          createdAt: now
        }
      })
      .returning();

    return composerDecisionFromRow(row);
  });
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

export async function createAstrologyReportRequest(
  database: AstraDb,
  input: CreateAstrologyReportRequestInput
): Promise<AstrologyReportRequest> {
  const parsed = createAstrologyReportRequestSchema.parse({
    chartRequestId: input.chartRequestId,
    reportType: input.reportType ?? "core_self",
    subjectName: input.subjectName,
    birthData: input.birthData,
    question: input.question,
    intent: input.intent,
    context: input.context,
    source: input.source ?? "self"
  });
  const now = new Date();

  const [request] = await database
    .insert(astrologyReportRequests)
    .values({
      userId: input.userId,
      chartRequestId: parsed.chartRequestId ?? null,
      reportType: parsed.reportType,
      subjectName: parsed.subjectName,
      birthData: parsed.birthData,
      question: parsed.question ?? null,
      intent: parsed.intent ?? null,
      context: parsed.context ?? {},
      source: parsed.source,
      boundary: "private",
      status: "queued",
      costCredits: 0,
      createdAt: now,
      updatedAt: now
    })
    .returning();

  return astrologyReportRequestFromRow(request);
}

export async function listUserAstrologyReportRequests(
  database: AstraDb,
  userId: string
): Promise<AstrologyReportRequest[]> {
  const rows = await database
    .select()
    .from(astrologyReportRequests)
    .where(eq(astrologyReportRequests.userId, userId))
    .orderBy(desc(astrologyReportRequests.createdAt));

  return rows.map(astrologyReportRequestFromRow);
}

export async function getUserAstrologyReportRequest(
  database: AstraDb,
  input: { requestId: string; userId: string }
): Promise<AstrologyReportRequest | null> {
  const [row] = await database
    .select()
    .from(astrologyReportRequests)
    .where(and(eq(astrologyReportRequests.id, input.requestId), eq(astrologyReportRequests.userId, input.userId)))
    .limit(1);

  return row ? astrologyReportRequestFromRow(row) : null;
}

export async function listUserAstrologyReportResults(
  database: AstraDb,
  userId: string
): Promise<AstrologyReportResult[]> {
  const rows = await database
    .select()
    .from(astrologyReportResults)
    .where(eq(astrologyReportResults.userId, userId))
    .orderBy(desc(astrologyReportResults.createdAt));

  return rows.map(astrologyReportResultFromRow);
}

export async function getUserAstrologyReportResult(
  database: AstraDb,
  input: { requestId: string; userId: string }
): Promise<AstrologyReportResult | null> {
  const [row] = await database
    .select()
    .from(astrologyReportResults)
    .where(and(eq(astrologyReportResults.requestId, input.requestId), eq(astrologyReportResults.userId, input.userId)))
    .limit(1);

  return row ? astrologyReportResultFromRow(row) : null;
}

export async function listUserArtifacts(database: AstraDb, userId: string): Promise<Artifact[]> {
  const rows = await database
    .select()
    .from(artifacts)
    .where(eq(artifacts.userId, userId))
    .orderBy(desc(artifacts.createdAt));

  return rows.map(artifactFromRow);
}

export async function recordAstrologyReportResult(
  database: AstraDb,
  input: RecordAstrologyReportResultInput
): Promise<AstrologyReportResult> {
  const now = new Date();

  return database.transaction(async (tx) => {
    const [request] = await tx
      .select({ id: astrologyReportRequests.id })
      .from(astrologyReportRequests)
      .where(and(eq(astrologyReportRequests.id, input.requestId), eq(astrologyReportRequests.userId, input.userId)))
      .limit(1);

    if (!request) {
      throw new Error("Astrology report request was not found for the supplied user.");
    }

    const [result] = await tx
      .insert(astrologyReportResults)
      .values({
        requestId: input.requestId,
        userId: input.userId,
        engine: input.engine,
        engineVersion: input.engineVersion,
        status: input.status,
        summary: input.summary ?? null,
        sections: input.sections,
        provenance: input.provenance,
        publicSignal: input.publicSignal ?? null,
        error: input.error ?? null,
        createdAt: now
      })
      .onConflictDoUpdate({
        target: astrologyReportResults.requestId,
        set: {
          engine: input.engine,
          engineVersion: input.engineVersion,
          status: input.status,
          summary: input.summary ?? null,
          sections: input.sections,
          provenance: input.provenance,
          publicSignal: input.publicSignal ?? null,
          error: input.error ?? null,
          createdAt: now
        }
      })
      .returning();

    await tx
      .update(astrologyReportRequests)
      .set({
        status: input.status,
        engine: input.engine,
        engineVersion: input.engineVersion,
        updatedAt: now
      })
      .where(and(eq(astrologyReportRequests.id, input.requestId), eq(astrologyReportRequests.userId, input.userId)));

    if (input.status === "completed") {
      await tx
        .insert(artifacts)
        .values({
          id: `report:${input.requestId}`,
          userId: input.userId,
          title: input.publicSignal?.headline ?? "Astrology report",
          kind: "report",
          summary: input.summary ?? "Completed astrology report.",
          payload: {
            reportResultId: result.id,
            requestId: input.requestId,
            publicSignal: input.publicSignal ?? null
          },
          createdAt: now
        })
        .onConflictDoUpdate({
          target: artifacts.id,
          set: {
            title: input.publicSignal?.headline ?? "Astrology report",
            summary: input.summary ?? "Completed astrology report.",
            payload: {
              reportResultId: result.id,
              requestId: input.requestId,
              publicSignal: input.publicSignal ?? null
            }
          }
        });
    }

    return astrologyReportResultFromRow(result);
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
