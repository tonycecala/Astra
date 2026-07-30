import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import {
  type Artifact,
  type AstrologyReportRequest,
  type AstrologyReportResult,
  type Ally,
  type ComposerDecision,
  type ComposerAvailabilityCollection,
  type ComposerAvailabilityResponse,
  type CreateAlly,
  type CreateComposerDecision,
  type CreateUserFeedItem,
  type ComposerStreamArtifact,
  type ChartBirthData,
  type CreateChartBirthData,
  type ChartMakerRequest,
  type ChartMakerResult,
  type PrivateFeedRequest,
  type PrivateFeedResponse,
  type PublicStreamItem,
  type RecordChartMakerResult,
  type RecordAstrologyReportResult,
  type ReportChartBasisSnapshot,
  type SourceCard,
  type UserFeedItem,
  type JourneyFeedItemAction,
  allySchema,
  artifactSchema,
  astrologyReportRequestSchema,
  astrologyReportResultSchema,
  chartBirthDataSchema,
  createChartBirthDataSchema,
  chartMakerRequestSchema,
  chartMakerResultSchema,
  composerDecisionSchema,
  createComposerDecisionSchema,
  createAllySchema,
  reportChartBasisSnapshotSchema,
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
  astrologyReportShares,
  artifacts,
  betaFeedback,
  cards,
  chartRequests,
  chartResults,
  composerCardQueryCaches,
  composerDecisions,
  composerLibraryCollectionCards,
  composerLibraryCollections,
  composerQueueDrafts,
  composerQueuePublishPlans,
  creditLedgerEntries,
  gifts,
  products,
  purchases,
  publicStreamItems,
  sourceCards,
  starTransactions,
  stripeEvents,
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

export type CreateAllyInput = CreateAlly & {
  userId: string;
  id?: string;
};

export type CreateChartMakerRequestInput = {
  userId: string;
  subjectName: string;
  birthData: CreateChartBirthData;
  question?: string;
  intent?: string;
  context?: Record<string, unknown>;
  source?: ChartMakerRequest["source"];
};

export type CreateAstrologyReportRequestInput = {
  id?: string;
  userId: string;
  chartRequestId?: string;
  reportType?: AstrologyReportRequest["reportType"];
  subjectName: string;
  birthData: ChartBirthData;
  question?: string;
  intent?: string;
  context?: Record<string, unknown>;
  source?: AstrologyReportRequest["source"];
  costCredits?: number;
  reportBasis?: ReportChartBasisSnapshot;
};

export type PurchaseAstrologyReportRequestInput = CreateAstrologyReportRequestInput & {
  id: string;
  costCredits: number;
  reportBasis: ReportChartBasisSnapshot;
  bypassCreditDebit?: boolean;
};

export type RecordChartMakerResultInput = RecordChartMakerResult;
export type RecordAstrologyReportResultInput = RecordAstrologyReportResult;
export type AstrologyReportShare = {
  shareUrl: string;
  subject: string;
  body: string;
};
export type SharedAstrologyReport = {
  request: AstrologyReportRequest;
  result: AstrologyReportResult;
};

export type BetaFeedbackCategory = "report_quality" | "checkout" | "bug" | "other";

export type CreateBetaFeedbackInput = {
  category: BetaFeedbackCategory;
  message: string;
  metadata?: Record<string, unknown>;
  rating?: number | null;
  reportRequestId: string;
  userId: string;
};

export type BetaFeedbackRecord = {
  category: BetaFeedbackCategory;
  createdAt: Date;
  id: string;
  message: string;
  metadata: Record<string, unknown>;
  rating: number | null;
  reportRequestId: string | null;
  reportType: string;
  userDisplayName: string | null;
  userEmail: string | null;
  userId: string;
};
export type UpsertComposerStreamArtifactInput = ComposerStreamArtifact;
export type CreateUserFeedItemInput = CreateUserFeedItem;
export type CreateComposerDecisionInput = CreateComposerDecision;

export type ComposerQueueDraftInput = {
  id?: string;
  operatorKey: string;
  scope: string;
  status?: string;
  targetUserId?: string;
  selectedCards: Record<string, unknown>;
  queueStates: Record<string, unknown>;
  decisionNotes: Record<string, unknown>;
  lastPlanId?: string;
  lastPlanSummary?: Record<string, unknown>;
};

export type ComposerQueueDraftRecord = Required<Omit<ComposerQueueDraftInput, "id" | "status" | "targetUserId" | "lastPlanId" | "lastPlanSummary">> & {
  id: string;
  status: string;
  targetUserId?: string;
  lastPlanId?: string;
  lastPlanSummary: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ComposerQueuePublishPlanInput = {
  id: string;
  operatorKey: string;
  scope: string;
  draftId?: string;
  targetUserId: string;
  status?: string;
  summary: Record<string, unknown>;
  issues: unknown[];
  items: unknown[];
  selectedCardIds: string[];
};

export type ComposerQueuePublishPlanRecord = Required<Omit<ComposerQueuePublishPlanInput, "draftId" | "status">> & {
  draftId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ComposerLibraryCollectionRecord = ComposerAvailabilityCollection & {
  source: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

function toDate(value: string) {
  return new Date(value);
}

function toIsoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function asJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
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
    reportBasis: row.reportBasis ?? undefined,
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
    reportBasis: row.reportBasis ?? undefined,
    generationMetadata: row.generationMetadata ?? undefined,
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

function allyFromRow(row: typeof allies.$inferSelect): Ally {
  return allySchema.parse({
    id: row.id,
    userId: row.userId,
    name: row.name,
    kind: row.kind,
    relationship: row.relationship,
    note: row.note ?? undefined,
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

function composerQueueDraftFromRow(row: typeof composerQueueDrafts.$inferSelect): ComposerQueueDraftRecord {
  return {
    id: row.id,
    operatorKey: row.operatorKey,
    scope: row.scope,
    status: row.status,
    targetUserId: row.targetUserId ?? undefined,
    selectedCards: typeof row.selectedCards === "object" && row.selectedCards !== null && !Array.isArray(row.selectedCards) ? (row.selectedCards as Record<string, unknown>) : {},
    queueStates: typeof row.queueStates === "object" && row.queueStates !== null && !Array.isArray(row.queueStates) ? (row.queueStates as Record<string, unknown>) : {},
    decisionNotes: typeof row.decisionNotes === "object" && row.decisionNotes !== null && !Array.isArray(row.decisionNotes) ? (row.decisionNotes as Record<string, unknown>) : {},
    lastPlanId: row.lastPlanId ?? undefined,
    lastPlanSummary: typeof row.lastPlanSummary === "object" && row.lastPlanSummary !== null && !Array.isArray(row.lastPlanSummary) ? (row.lastPlanSummary as Record<string, unknown>) : {},
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt)
  };
}

function composerQueuePublishPlanFromRow(row: typeof composerQueuePublishPlans.$inferSelect): ComposerQueuePublishPlanRecord {
  return {
    id: row.id,
    operatorKey: row.operatorKey,
    scope: row.scope,
    draftId: row.draftId ?? undefined,
    targetUserId: row.targetUserId,
    status: row.status,
    summary: typeof row.summary === "object" && row.summary !== null && !Array.isArray(row.summary) ? (row.summary as Record<string, unknown>) : {},
    issues: Array.isArray(row.issues) ? row.issues : [],
    items: Array.isArray(row.items) ? row.items : [],
    selectedCardIds: Array.isArray(row.selectedCardIds) ? row.selectedCardIds.filter((id): id is string => typeof id === "string") : [],
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt)
  };
}

function composerLibraryCardFromRow(row: typeof composerLibraryCollectionCards.$inferSelect): ComposerAvailabilityCollection["cards"][number] {
  const payload = typeof row.cardPayload === "object" && row.cardPayload !== null && !Array.isArray(row.cardPayload) ? (row.cardPayload as Record<string, unknown>) : {};
  return {
    id: row.cardId,
    title: row.title,
    subtitle: typeof payload.subtitle === "string" ? payload.subtitle : undefined,
    body: row.body,
    excerpt: typeof payload.excerpt === "string" ? payload.excerpt : undefined,
    kind: row.kind,
    ontologyType: row.ontologyType as ComposerAvailabilityCollection["cards"][number]["ontologyType"],
    status: row.status,
    order: row.orderIndex,
    collectionId: row.collectionId,
    collectionTitle: typeof payload.collectionTitle === "string" ? payload.collectionTitle : "",
    sectionId: row.sectionId ?? undefined,
    sectionTitle: row.sectionTitle ?? undefined,
    lane: typeof payload.lane === "string" ? payload.lane : undefined,
    tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
    imageUrl: row.imageUrl ?? undefined,
    quiz: typeof payload.quiz === "object" && payload.quiz !== null && !Array.isArray(payload.quiz) ? (payload.quiz as Record<string, unknown>) : undefined,
    source: typeof payload.source === "string" ? payload.source : undefined
  };
}

async function composerLibraryCollectionFromRow(database: AstraDb, row: typeof composerLibraryCollections.$inferSelect): Promise<ComposerLibraryCollectionRecord> {
  const cardRows = await database
    .select()
    .from(composerLibraryCollectionCards)
    .where(eq(composerLibraryCollectionCards.collectionId, row.id))
    .orderBy(asc(composerLibraryCollectionCards.orderIndex));
  const metadata = typeof row.metadata === "object" && row.metadata !== null && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {};
  return {
    id: row.id,
    title: row.title,
    kind: row.kind as ComposerAvailabilityCollection["kind"],
    description: row.description,
    totalCards: row.totalCards,
    generatedAt: toIsoDate(row.generatedAt),
    cards: cardRows.map((cardRow) => ({
      ...composerLibraryCardFromRow(cardRow),
      collectionTitle: row.title
    })),
    source: row.source,
    status: row.status,
    metadata,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt)
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
  await database.delete(composerLibraryCollectionCards);
  await database.delete(composerLibraryCollections);
  await database.delete(composerQueuePublishPlans);
  await database.delete(composerQueueDrafts);
  await database.delete(composerCardQueryCaches);
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

export async function upsertComposerQueueDraft(
  database: AstraDb,
  input: ComposerQueueDraftInput
): Promise<ComposerQueueDraftRecord> {
  const now = new Date();
  const id = input.id ?? `composer_queue_draft:${input.operatorKey}:${input.scope}`;
  const [row] = await database
    .insert(composerQueueDrafts)
    .values({
      id,
      operatorKey: input.operatorKey,
      scope: input.scope,
      status: input.status ?? "draft",
      targetUserId: input.targetUserId ?? null,
      selectedCards: input.selectedCards,
      queueStates: input.queueStates,
      decisionNotes: input.decisionNotes,
      lastPlanId: input.lastPlanId ?? null,
      lastPlanSummary: input.lastPlanSummary ?? {},
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [composerQueueDrafts.operatorKey, composerQueueDrafts.scope],
      set: {
        id,
        operatorKey: input.operatorKey,
        scope: input.scope,
        status: input.status ?? "draft",
        targetUserId: input.targetUserId ?? null,
        selectedCards: input.selectedCards,
        queueStates: input.queueStates,
        decisionNotes: input.decisionNotes,
        lastPlanId: input.lastPlanId ?? null,
        lastPlanSummary: input.lastPlanSummary ?? {},
        updatedAt: now
      }
    })
    .returning();

  return composerQueueDraftFromRow(row);
}

export async function getComposerQueueDraft(
  database: AstraDb,
  input: { operatorKey: string; scope: string }
): Promise<ComposerQueueDraftRecord | null> {
  const [row] = await database
    .select()
    .from(composerQueueDrafts)
    .where(and(eq(composerQueueDrafts.operatorKey, input.operatorKey), eq(composerQueueDrafts.scope, input.scope)))
    .limit(1);

  return row ? composerQueueDraftFromRow(row) : null;
}

export async function deleteComposerQueueDraft(
  database: AstraDb,
  input: { operatorKey: string; scope: string }
): Promise<void> {
  await database.delete(composerQueueDrafts).where(and(eq(composerQueueDrafts.operatorKey, input.operatorKey), eq(composerQueueDrafts.scope, input.scope)));
}

export async function upsertComposerQueuePublishPlan(
  database: AstraDb,
  input: ComposerQueuePublishPlanInput
): Promise<ComposerQueuePublishPlanRecord> {
  const now = new Date();
  const [row] = await database
    .insert(composerQueuePublishPlans)
    .values({
      id: input.id,
      operatorKey: input.operatorKey,
      scope: input.scope,
      draftId: input.draftId ?? null,
      targetUserId: input.targetUserId,
      status: input.status ?? "prepared",
      summary: input.summary,
      issues: input.issues,
      items: input.items,
      selectedCardIds: input.selectedCardIds,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: composerQueuePublishPlans.id,
      set: {
        operatorKey: input.operatorKey,
        scope: input.scope,
        draftId: input.draftId ?? null,
        targetUserId: input.targetUserId,
        status: input.status ?? "prepared",
        summary: input.summary,
        issues: input.issues,
        items: input.items,
        selectedCardIds: input.selectedCardIds,
        updatedAt: now
      }
    })
    .returning();

  return composerQueuePublishPlanFromRow(row);
}

export async function getComposerQueuePublishPlan(
  database: AstraDb,
  id: string
): Promise<ComposerQueuePublishPlanRecord | null> {
  const [row] = await database
    .select()
    .from(composerQueuePublishPlans)
    .where(eq(composerQueuePublishPlans.id, id))
    .limit(1);

  return row ? composerQueuePublishPlanFromRow(row) : null;
}

export async function deleteComposerQueuePublishPlan(database: AstraDb, id: string): Promise<void> {
  await database.delete(composerQueuePublishPlans).where(eq(composerQueuePublishPlans.id, id));
}

export async function upsertComposerLibraryAvailability(
  database: AstraDb,
  availability: ComposerAvailabilityResponse,
  options: { source?: string; status?: string; metadata?: Record<string, unknown> } = {}
): Promise<ComposerLibraryCollectionRecord> {
  const now = new Date();
  const collection = availability.collection;
  await database.transaction(async (tx) => {
    await tx
      .insert(composerLibraryCollections)
      .values({
        id: collection.id,
        kind: collection.kind,
        title: collection.title,
        description: collection.description,
        status: options.status ?? "available",
        source: options.source ?? "composer",
        totalCards: collection.totalCards,
        generatedAt: toDate(collection.generatedAt),
        metadata: {
          ...(options.metadata ?? {}),
          request: availability.request
        },
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: composerLibraryCollections.id,
        set: {
          kind: collection.kind,
          title: collection.title,
          description: collection.description,
          status: options.status ?? "available",
          source: options.source ?? "composer",
          totalCards: collection.totalCards,
          generatedAt: toDate(collection.generatedAt),
          metadata: {
            ...(options.metadata ?? {}),
            request: availability.request
          },
          updatedAt: now
        }
      });

    await tx.delete(composerLibraryCollectionCards).where(eq(composerLibraryCollectionCards.collectionId, collection.id));
    if (collection.cards.length) {
      await tx.insert(composerLibraryCollectionCards).values(
        collection.cards.map((card, index) => ({
          id: `composer_library_card:${collection.id}:${card.id}`,
          collectionId: collection.id,
          cardId: card.id,
          orderIndex: card.order ?? index,
          ontologyType: card.ontologyType,
          kind: card.kind,
          status: card.status,
          title: card.title,
          body: card.body,
          sectionId: card.sectionId ?? null,
          sectionTitle: card.sectionTitle ?? null,
          imageUrl: card.imageUrl ?? null,
          tags: card.tags,
          cardPayload: card,
          updatedAt: now
        }))
      );
    }
  });

  const saved = await getComposerLibraryCollection(database, collection.id);
  if (!saved) throw new Error(`Composer library collection ${collection.id} was not saved.`);
  return saved;
}

export async function getComposerLibraryCollection(database: AstraDb, id: string): Promise<ComposerLibraryCollectionRecord | null> {
  const [row] = await database
    .select()
    .from(composerLibraryCollections)
    .where(eq(composerLibraryCollections.id, id))
    .limit(1);

  return row ? composerLibraryCollectionFromRow(database, row) : null;
}

export async function deleteComposerLibraryCollection(database: AstraDb, id: string): Promise<void> {
  await database.delete(composerLibraryCollections).where(eq(composerLibraryCollections.id, id));
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

export async function listAvailableUserReportSignalsForRepair(
  database: AstraDb,
  userId: string
): Promise<UserFeedItem[]> {
  const rows = await database
    .select()
    .from(userFeedItems)
    .where(and(
      eq(userFeedItems.userId, userId),
      eq(userFeedItems.feedKind, "report_signal"),
      eq(userFeedItems.state, "available")
    ))
    .orderBy(desc(userFeedItems.rankScore), asc(userFeedItems.availableAt));

  return rows.map(userFeedItemFromRow);
}

export async function retireAvailableUserFeedItems(
  database: AstraDb,
  input: { userId: string; feedItemIds: string[] }
): Promise<number> {
  if (!input.feedItemIds.length) return 0;
  const now = new Date();
  const rows = await database
    .update(userFeedItems)
    .set({ state: "seen", seenAt: now, updatedAt: now })
    .where(and(
      eq(userFeedItems.userId, input.userId),
      eq(userFeedItems.state, "available"),
      inArray(userFeedItems.id, input.feedItemIds)
    ))
    .returning({ id: userFeedItems.id });

  return rows.length;
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

export async function updateUserFeedItemState(
  database: AstraDb,
  input: { userId: string; feedItemId: string; action: JourneyFeedItemAction }
): Promise<UserFeedItem | null> {
  const now = new Date();
  const state = input.action === "complete" ? "seen" : input.action === "dismiss" ? "dismissed" : input.action === "save" ? "saved" : "available";
  const [row] = await database
    .update(userFeedItems)
    .set({
      state,
      seenAt: input.action === "complete" ? now : null,
      dismissedAt: input.action === "dismiss" ? now : null,
      savedAt: input.action === "save" ? now : null,
      updatedAt: now
    })
    .where(and(eq(userFeedItems.id, input.feedItemId), eq(userFeedItems.userId, input.userId)))
    .returning();

  return row ? userFeedItemFromRow(row) : null;
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

  const [insertedProfile] = await database
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
    // Both the deterministic primary key and userId are unique. Let Postgres
    // absorb a concurrent first page load on either boundary before updating
    // the durable one-profile-per-user record below.
    .onConflictDoNothing()
    .returning();

  if (insertedProfile) return insertedProfile;

  const [profile] = await database
    .update(appUserProfiles)
    .set({
      email: input.email,
      displayName: input.displayName,
      updatedAt: now
    })
    .where(eq(appUserProfiles.userId, input.userId))
    .returning();

  if (!profile) {
    throw new Error("Profile initialization did not resolve a saved user profile.");
  }

  return profile;
}

export async function markAuthUserOnboardingComplete(database: AstraDb, userId: string) {
  const [profile] = await database
    .update(appUserProfiles)
    .set({ onboardingStatus: "complete", updatedAt: new Date() })
    .where(eq(appUserProfiles.userId, userId))
    .returning();

  if (!profile) throw new Error("Onboarding completion did not resolve a saved user profile.");
  return profile;
}

export async function updateAuthUserProfileDisplayName(
  database: AstraDb,
  input: { userId: string; displayName: string }
) {
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("A profile display name is required.");

  const now = new Date();
  return database.transaction(async (tx) => {
    await tx
      .update(user)
      .set({ name: displayName, updatedAt: now })
      .where(eq(user.id, input.userId));

    const [profile] = await tx
      .update(appUserProfiles)
      .set({ displayName, updatedAt: now })
      .where(eq(appUserProfiles.userId, input.userId))
      .returning();

    if (!profile) throw new Error("Profile was not found for the supplied user.");
    return profile;
  });
}

export async function createAlly(database: AstraDb, input: CreateAllyInput): Promise<Ally> {
  const parsed = createAllySchema.parse(input);
  const now = new Date();

  const [row] = await database
    .insert(allies)
    .values({
      id: input.id ?? `ally:${input.userId}:${crypto.randomUUID()}`,
      userId: input.userId,
      name: parsed.name,
      kind: parsed.kind,
      relationship: parsed.relationship,
      note: parsed.note ?? null,
      createdAt: now
    })
    .returning();

  return allyFromRow(row);
}

export async function listUserAllies(database: AstraDb, userId: string): Promise<Ally[]> {
  const rows = await database
    .select()
    .from(allies)
    .where(eq(allies.userId, userId))
    .orderBy(desc(allies.createdAt));

  return rows.map(allyFromRow);
}

export async function deleteUserAlly(database: AstraDb, input: { allyId: string; userId: string }) {
  const deleted = await database
    .delete(allies)
    .where(and(eq(allies.id, input.allyId), eq(allies.userId, input.userId)))
    .returning({ id: allies.id });

  return deleted.length > 0;
}

export async function createChartMakerRequest(
  database: AstraDb,
  input: CreateChartMakerRequestInput
): Promise<ChartMakerRequest> {
  const birthData = createChartBirthDataSchema.parse(input.birthData);
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

export async function getUserChartMakerRequest(
  database: AstraDb,
  input: {
    requestId: string;
    userId: string;
  }
): Promise<ChartMakerRequest | null> {
  const [row] = await database
    .select()
    .from(chartRequests)
    .where(and(eq(chartRequests.id, input.requestId), eq(chartRequests.userId, input.userId)))
    .limit(1);

  return row ? chartRequestFromRow(row) : null;
}

export async function updateUserChartMakerBirthData(
  database: AstraDb,
  input: {
    requestId: string;
    userId: string;
    birthData: CreateChartBirthData;
  }
): Promise<ChartMakerRequest> {
  const birthData = createChartBirthDataSchema.parse(input.birthData);
  const [request] = await database
    .update(chartRequests)
    .set({ birthData, status: "queued", updatedAt: new Date() })
    .where(and(eq(chartRequests.id, input.requestId), eq(chartRequests.userId, input.userId)))
    .returning();

  if (!request) {
    throw new Error("Chart request was not found for the supplied user.");
  }

  return chartRequestFromRow(request);
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
  const birthData = chartBirthDataSchema.parse(input.birthData);
  const reportBasis = input.reportBasis ? reportChartBasisSnapshotSchema.parse(input.reportBasis) : undefined;
  const now = new Date();

  const [request] = await database
    .insert(astrologyReportRequests)
    .values({
      id: input.id,
      userId: input.userId,
      chartRequestId: input.chartRequestId ?? null,
      reportType: input.reportType ?? "core_self",
      subjectName: input.subjectName,
      birthData,
      question: input.question ?? null,
      intent: input.intent ?? null,
      context: input.context ?? {},
      source: input.source ?? "self",
      boundary: "private",
      status: "queued",
      costCredits: input.costCredits ?? 0,
      reportBasis: reportBasis ?? null,
      createdAt: now,
      updatedAt: now
    })
    .returning();

  return astrologyReportRequestFromRow(request);
}

export async function purchaseAstrologyReportRequest(
  database: AstraDb,
  input: PurchaseAstrologyReportRequestInput
): Promise<{ balanceAfter?: number; request: AstrologyReportRequest }> {
  const birthData = chartBirthDataSchema.parse(input.birthData);
  const reportBasis = reportChartBasisSnapshotSchema.parse(input.reportBasis);
  const now = new Date();

  return database.transaction(async (tx) => {
    let balanceAfter: number | undefined;

    if (!input.bypassCreditDebit && input.costCredits > 0) {
      await tx.execute(sql`select ${appUserProfiles.userId} from ${appUserProfiles} where ${appUserProfiles.userId} = ${input.userId} for update`);
      const [balanceRow] = await tx
        .select({ balance: sql<number>`coalesce(sum(${creditLedgerEntries.amount}), 0)::integer` })
        .from(creditLedgerEntries)
        .where(eq(creditLedgerEntries.userId, input.userId));
      const balance = Number(balanceRow?.balance ?? 0);
      if (balance < input.costCredits) throw new Error("insufficient_credits");
      balanceAfter = balance - input.costCredits;
    }

    const [row] = await tx
      .insert(astrologyReportRequests)
      .values({
        id: input.id,
        userId: input.userId,
        chartRequestId: input.chartRequestId ?? null,
        reportType: input.reportType ?? "identity",
        subjectName: input.subjectName,
        birthData,
        question: input.question ?? null,
        intent: input.intent ?? null,
        context: input.context ?? {},
        source: input.source ?? "self",
        boundary: "private",
        status: "queued",
        costCredits: input.costCredits,
        reportBasis,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    if (!input.bypassCreditDebit && input.costCredits > 0) {
      await tx.insert(creditLedgerEntries).values({
        userId: input.userId,
        amount: -input.costCredits,
        eventType: "report_spend",
        source: "report_generation",
        description: `${input.reportType ?? "identity"} report`,
        relatedReportRequestId: input.id,
        idempotencyKey: `report_spend:${input.userId}:${input.id}`,
        metadata: {
          reportType: input.reportType ?? "identity",
          reportBasis: reportBasis.type,
          chartSettings: reportBasis.chartSettings
        }
      });
      await tx
        .update(appUserProfiles)
        .set({ starBalance: balanceAfter ?? 0, updatedAt: now })
        .where(eq(appUserProfiles.userId, input.userId));
    }

    return { request: astrologyReportRequestFromRow(row), balanceAfter };
  });
}

export async function getCreditBalance(database: AstraDb, userId?: string | null) {
  if (!userId) return 0;
  const [row] = await database
    .select({ balance: sql<number>`coalesce(sum(${creditLedgerEntries.amount}), 0)::integer` })
    .from(creditLedgerEntries)
    .where(eq(creditLedgerEntries.userId, userId));
  return Number(row?.balance ?? 0);
}

export async function mirrorCreditBalanceToProfile(database: AstraDb, userId: string) {
  const balance = await getCreditBalance(database, userId);
  await database.update(appUserProfiles).set({ starBalance: balance, updatedAt: new Date() }).where(eq(appUserProfiles.userId, userId));
  return balance;
}

export async function ensureBetaSignupCredits(database: AstraDb, userId: string) {
  const amount = Number.parseInt(process.env.ASTRA_BETA_SIGNUP_CREDITS ?? "30", 10);
  if (!Number.isInteger(amount) || amount <= 0) return null;
  const [entry] = await database
    .insert(creditLedgerEntries)
    .values({
      userId,
      amount,
      eventType: "beta_grant",
      source: "founding_beta_explorer_pack",
      description: `Founding Beta Explorer Pack - ${amount} Explorer Stars`,
      idempotencyKey: `beta_grant:${userId}:explorer_pack_v1`,
      metadata: { grantName: "Founding Beta Explorer Pack", label: "Explorer Stars - 30 gift Stars", actor: "system" }
    })
    .onConflictDoNothing()
    .returning();
  await mirrorCreditBalanceToProfile(database, userId);
  return entry ?? null;
}

export async function adminAdjustCredits(
  database: AstraDb,
  input: { actorEmail?: string | null; amount: number; direction: "grant" | "revoke"; notes?: string | null; reason: string; targetEmail: string }
) {
  const targetEmail = input.targetEmail.trim().toLowerCase();
  const amount = Math.abs(input.amount);
  if (!targetEmail || !Number.isInteger(amount) || amount <= 0) throw new Error("invalid_credit_adjustment");

  const [profile] = await database.select().from(appUserProfiles).where(eq(appUserProfiles.email, targetEmail)).limit(1);
  if (!profile) throw new Error("credit_user_not_found");

  const signedAmount = input.direction === "revoke" ? -amount : amount;
  const [entry] = await database
    .insert(creditLedgerEntries)
    .values({
      userId: profile.userId,
      amount: signedAmount,
      eventType: "admin_adjustment",
      source: "admin_console",
      description: input.reason,
      idempotencyKey: `admin_adjustment:${profile.userId}:${Date.now()}:${randomBytes(4).toString("hex")}`,
      metadata: {
        actor: input.actorEmail ?? "admin",
        adminEmail: input.actorEmail ?? "admin",
        direction: input.direction,
        notes: input.notes ?? "",
        reason: input.reason
      }
    })
    .returning();
  const balance = await mirrorCreditBalanceToProfile(database, profile.userId);
  return { balance, entry };
}

export async function adminUpdateUserRole(database: AstraDb, input: { role: string; targetEmail: string }) {
  const targetEmail = input.targetEmail.trim().toLowerCase();
  const role = input.role === "admin" ? "admin" : "customer";
  const [profile] = await database
    .update(appUserProfiles)
    .set({ role, updatedAt: new Date() })
    .where(eq(appUserProfiles.email, targetEmail))
    .returning();
  if (!profile) throw new Error("credit_user_not_found");
  return profile;
}

export async function listCreditUsers(database: AstraDb, input: { limit?: number; search?: string | null } = {}) {
  const limit = input.limit ?? 100;
  const search = input.search?.trim().toLowerCase();
  const rows = await database
    .select({
      createdAt: appUserProfiles.createdAt,
      displayName: appUserProfiles.displayName,
      email: appUserProfiles.email,
      role: appUserProfiles.role,
      userId: appUserProfiles.userId
    })
    .from(appUserProfiles)
    .where(
      search
        ? sql`lower(${appUserProfiles.email}) like ${`%${search}%`} or lower(${appUserProfiles.displayName}) like ${`%${search}%`} or lower(${appUserProfiles.userId}) like ${`%${search}%`}`
        : undefined
    )
    .orderBy(desc(appUserProfiles.updatedAt))
    .limit(limit);

  const userIds = rows.map((row) => row.userId);
  if (!userIds.length) return [];

  const [creditRows, chartRows, reportRows] = await Promise.all([
    database
      .select({
        balance: sql<number>`coalesce(sum(${creditLedgerEntries.amount}), 0)::integer`,
        userId: creditLedgerEntries.userId
      })
      .from(creditLedgerEntries)
      .where(inArray(creditLedgerEntries.userId, userIds))
      .groupBy(creditLedgerEntries.userId),
    database
      .select({
        count: count(),
        userId: chartRequests.userId
      })
      .from(chartRequests)
      .where(inArray(chartRequests.userId, userIds))
      .groupBy(chartRequests.userId),
    database
      .select({
        count: count(),
        userId: astrologyReportRequests.userId
      })
      .from(astrologyReportRequests)
      .where(inArray(astrologyReportRequests.userId, userIds))
      .groupBy(astrologyReportRequests.userId)
  ]);

  const creditsByUserId = new Map(creditRows.map((row) => [row.userId, Number(row.balance ?? 0)]));
  const chartsByUserId = new Map(chartRows.map((row) => [row.userId, Number(row.count ?? 0)]));
  const reportsByUserId = new Map(reportRows.map((row) => [row.userId, Number(row.count ?? 0)]));

  return rows.map((row) => ({
    ...row,
    chartCount: chartsByUserId.get(row.userId) ?? 0,
    creditBalance: creditsByUserId.get(row.userId) ?? 0,
    reportCount: reportsByUserId.get(row.userId) ?? 0
  }));
}

export async function getCreditLedgerSummary(database: AstraDb, userId?: string | null) {
  const base = {
    currentBalance: 0,
    lastCreditEventAt: null as Date | null,
    lifetimeCreditsGranted: 0,
    lifetimeCreditsPurchased: 0,
    lifetimeCreditsRefunded: 0,
    lifetimeCreditsSpent: 0
  };
  if (!userId) return base;

  const [row] = await database
    .select({
      currentBalance: sql<number>`coalesce(sum(${creditLedgerEntries.amount}), 0)::integer`,
      lastCreditEventAt: sql<Date | null>`max(${creditLedgerEntries.createdAt})`,
      lifetimeCreditsGranted: sql<number>`coalesce(sum(case when ${creditLedgerEntries.eventType} in ('beta_grant', 'admin_adjustment') and ${creditLedgerEntries.amount} > 0 then ${creditLedgerEntries.amount} else 0 end), 0)::integer`,
      lifetimeCreditsPurchased: sql<number>`coalesce(sum(case when ${creditLedgerEntries.eventType} = 'purchase' then ${creditLedgerEntries.amount} else 0 end), 0)::integer`,
      lifetimeCreditsRefunded: sql<number>`coalesce(sum(case when ${creditLedgerEntries.eventType} = 'refund' then ${creditLedgerEntries.amount} else 0 end), 0)::integer`,
      lifetimeCreditsSpent: sql<number>`coalesce(sum(case when ${creditLedgerEntries.amount} < 0 then abs(${creditLedgerEntries.amount}) else 0 end), 0)::integer`
    })
    .from(creditLedgerEntries)
    .where(eq(creditLedgerEntries.userId, userId));

  return {
    currentBalance: Number(row?.currentBalance ?? 0),
    lastCreditEventAt: row?.lastCreditEventAt ?? null,
    lifetimeCreditsGranted: Number(row?.lifetimeCreditsGranted ?? 0),
    lifetimeCreditsPurchased: Number(row?.lifetimeCreditsPurchased ?? 0),
    lifetimeCreditsRefunded: Number(row?.lifetimeCreditsRefunded ?? 0),
    lifetimeCreditsSpent: Number(row?.lifetimeCreditsSpent ?? 0)
  };
}

export async function listRecentCreditLedger(database: AstraDb, input: { limit?: number; userId?: string | null } = {}) {
  const rows = await database
    .select({
      amount: creditLedgerEntries.amount,
      createdAt: creditLedgerEntries.createdAt,
      description: creditLedgerEntries.description,
      eventType: creditLedgerEntries.eventType,
      id: creditLedgerEntries.id,
      idempotencyKey: creditLedgerEntries.idempotencyKey,
      metadata: creditLedgerEntries.metadata,
      relatedReportDocumentId: creditLedgerEntries.relatedReportDocumentId,
      relatedReportRequestId: creditLedgerEntries.relatedReportRequestId,
      source: creditLedgerEntries.source,
      stripeCheckoutSessionId: creditLedgerEntries.stripeCheckoutSessionId,
      stripeEventId: creditLedgerEntries.stripeEventId,
      userDisplayName: appUserProfiles.displayName,
      userEmail: appUserProfiles.email,
      userId: creditLedgerEntries.userId
    })
    .from(creditLedgerEntries)
    .leftJoin(appUserProfiles, eq(appUserProfiles.userId, creditLedgerEntries.userId))
    .where(input.userId ? eq(creditLedgerEntries.userId, input.userId) : undefined)
    .orderBy(desc(creditLedgerEntries.createdAt))
    .limit(input.limit ?? 100);

  return rows.map((row) => ({
    ...row,
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {}
  }));
}

export async function recordPendingStripeCheckout(
  database: AstraDb,
  input: { amountMinor?: number | null; checkoutSessionId: string; currency?: string | null; productKey: string; userId: string }
) {
  const [product] = await database.select().from(products).where(eq(products.key, input.productKey)).limit(1);
  const [purchase] = await database
    .insert(purchases)
    .values({
      userId: input.userId,
      productId: product?.id ?? null,
      provider: "stripe",
      stripeCheckoutSessionId: input.checkoutSessionId,
      amountMinor: input.amountMinor ?? null,
      currency: input.currency ?? null,
      status: "pending",
      rawEvent: { productKey: input.productKey }
    })
    .onConflictDoUpdate({
      target: purchases.stripeCheckoutSessionId,
      set: {
        amountMinor: input.amountMinor ?? null,
        currency: input.currency ?? null,
        rawEvent: { productKey: input.productKey },
        updatedAt: new Date()
      }
    })
    .returning();
  return purchase;
}

export async function recordStripeEvent(
  database: AstraDb,
  input: { eventId: string; eventType: string; objectId?: string | null; rawEvent: Record<string, unknown> }
) {
  const [event] = await database
    .insert(stripeEvents)
    .values({
      id: input.eventId,
      eventType: input.eventType,
      objectId: input.objectId ?? null,
      rawEvent: input.rawEvent
    })
    .onConflictDoNothing()
    .returning();
  return { inserted: Boolean(event), event: event ?? null };
}

export async function completeStripeCheckoutPurchase(
  database: AstraDb,
  input: {
    amount: number;
    amountMinor?: number | null;
    checkoutSessionId: string;
    currency?: string | null;
    customerId?: string | null;
    eventId: string;
    paymentIntentId?: string | null;
    productKey: string;
    rawEvent: Record<string, unknown>;
    userId: string;
  }
) {
  const [product] = await database.select().from(products).where(eq(products.key, input.productKey)).limit(1);
  const [purchase] = await database
    .insert(purchases)
    .values({
      userId: input.userId,
      productId: product?.id ?? null,
      provider: "stripe",
      stripeCustomerId: input.customerId ?? null,
      stripeCheckoutSessionId: input.checkoutSessionId,
      stripePaymentIntentId: input.paymentIntentId ?? null,
      stripeEventId: input.eventId,
      amountMinor: input.amountMinor ?? null,
      currency: input.currency ?? null,
      status: "paid",
      purchasedAt: new Date(),
      rawEvent: input.rawEvent
    })
    .onConflictDoUpdate({
      target: purchases.stripeCheckoutSessionId,
      set: {
        stripeCustomerId: input.customerId ?? null,
        stripePaymentIntentId: input.paymentIntentId ?? null,
        stripeEventId: input.eventId,
        amountMinor: input.amountMinor ?? null,
        currency: input.currency ?? null,
        status: "paid",
        purchasedAt: new Date(),
        rawEvent: input.rawEvent,
        updatedAt: new Date()
      }
    })
    .returning();

  const [entry] = await database
    .insert(creditLedgerEntries)
    .values({
      userId: input.userId,
      amount: input.amount,
      eventType: "purchase",
      source: "stripe_checkout",
      description: `${input.productKey} purchase`,
      stripeCustomerId: input.customerId ?? null,
      stripeCheckoutSessionId: input.checkoutSessionId,
      stripeEventId: input.eventId,
      idempotencyKey: `stripe_credit_pack:${input.checkoutSessionId}:${input.productKey}`,
      metadata: { productKey: input.productKey, purchaseId: purchase.id }
    })
    .onConflictDoNothing()
    .returning();
  const balance = await mirrorCreditBalanceToProfile(database, input.userId);
  return { purchase, ledgerEntry: entry ?? null, balance };
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

export async function getAstrologyReportRequest(database: AstraDb, requestId: string): Promise<AstrologyReportRequest | null> {
  const [row] = await database
    .select()
    .from(astrologyReportRequests)
    .where(eq(astrologyReportRequests.id, requestId))
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

export async function deleteUserAstrologyReport(
  database: AstraDb,
  input: { requestId: string; userId: string }
): Promise<boolean> {
  return database.transaction(async (tx) => {
    const [request] = await tx
      .select({ id: astrologyReportRequests.id })
      .from(astrologyReportRequests)
      .where(and(eq(astrologyReportRequests.id, input.requestId), eq(astrologyReportRequests.userId, input.userId)))
      .limit(1);

    if (!request) return false;

    await tx.delete(artifacts).where(and(eq(artifacts.id, `report:${input.requestId}`), eq(artifacts.userId, input.userId)));
    await tx.delete(astrologyReportRequests).where(and(eq(astrologyReportRequests.id, input.requestId), eq(astrologyReportRequests.userId, input.userId)));

    return true;
  });
}

function astrologyReportShareTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function astrologyReportShareEmail(input: { title: string; shareUrl: string }) {
  return {
    subject: "Astra report shared with you",
    body: ["Hi,", "", "I shared an Astra report with you:", "", input.title, input.shareUrl, "", "You can open the link to read the report online."].join("\n")
  };
}

export async function createAstrologyReportShare(
  database: AstraDb,
  input: { requestId: string; userId: string; baseUrl: string }
): Promise<AstrologyReportShare | null> {
  const token = randomBytes(24).toString("base64url");
  const tokenHash = astrologyReportShareTokenHash(token);
  const now = new Date();

  return database.transaction(async (tx) => {
    const [result] = await tx
      .select()
      .from(astrologyReportResults)
      .where(and(eq(astrologyReportResults.requestId, input.requestId), eq(astrologyReportResults.userId, input.userId)))
      .limit(1);

    if (!result || result.status !== "completed") return null;

    await tx
      .insert(astrologyReportShares)
      .values({
        requestId: input.requestId,
        userId: input.userId,
        tokenHash,
        status: "active",
        createdAt: now,
        revokedAt: null
      })
      .onConflictDoUpdate({
        target: astrologyReportShares.requestId,
        set: {
          tokenHash,
          status: "active",
          createdAt: now,
          revokedAt: null
        }
      });

    const title = astrologyReportResultFromRow(result).publicSignal?.headline ?? "Astrology report";
    const shareUrl = `${input.baseUrl.replace(/\/$/g, "")}/reports/share/${token}`;
    const email = astrologyReportShareEmail({ title, shareUrl });
    return { shareUrl, ...email };
  });
}

export async function revokeAstrologyReportShare(
  database: AstraDb,
  input: { requestId: string; userId: string }
): Promise<boolean> {
  const [share] = await database
    .update(astrologyReportShares)
    .set({
      status: "revoked",
      revokedAt: new Date()
    })
    .where(and(eq(astrologyReportShares.requestId, input.requestId), eq(astrologyReportShares.userId, input.userId), eq(astrologyReportShares.status, "active")))
    .returning({ id: astrologyReportShares.id });

  return Boolean(share);
}

export async function getSharedAstrologyReport(database: AstraDb, token: string): Promise<SharedAstrologyReport | null> {
  const tokenHash = astrologyReportShareTokenHash(token);
  const [share] = await database
    .select()
    .from(astrologyReportShares)
    .where(and(eq(astrologyReportShares.tokenHash, tokenHash), eq(astrologyReportShares.status, "active")))
    .limit(1);

  if (!share) return null;

  const [request, result] = await Promise.all([
    getUserAstrologyReportRequest(database, {
      requestId: share.requestId,
      userId: share.userId
    }),
    getUserAstrologyReportResult(database, {
      requestId: share.requestId,
      userId: share.userId
    })
  ]);

  if (!request || !result || result.status !== "completed") return null;
  return { request, result };
}

function normalizeBetaFeedbackCategory(value: string): BetaFeedbackCategory {
  if (value === "checkout" || value === "bug" || value === "other") return value;
  return "report_quality";
}

function betaFeedbackRecordFromRow(row: {
  category: string;
  createdAt: Date;
  id: string;
  message: string;
  metadata: unknown;
  rating: number | null;
  reportRequestId: string | null;
  reportType: string;
  userDisplayName: string | null;
  userEmail: string | null;
  userId: string;
}): BetaFeedbackRecord {
  return {
    category: normalizeBetaFeedbackCategory(row.category),
    createdAt: row.createdAt,
    id: row.id,
    message: row.message,
    metadata: asJsonObject(row.metadata),
    rating: row.rating,
    reportRequestId: row.reportRequestId,
    reportType: row.reportType,
    userDisplayName: row.userDisplayName,
    userEmail: row.userEmail,
    userId: row.userId
  };
}

export async function createBetaFeedback(database: AstraDb, input: CreateBetaFeedbackInput): Promise<BetaFeedbackRecord> {
  const message = input.message.trim();
  if (!message) throw new Error("invalid_feedback_message");
  if (message.length > 2000) throw new Error("invalid_feedback_message");
  if (input.rating !== null && input.rating !== undefined && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
    throw new Error("invalid_feedback_rating");
  }

  return database.transaction(async (tx) => {
    const [request] = await tx
      .select({
        id: astrologyReportRequests.id,
        reportType: astrologyReportRequests.reportType
      })
      .from(astrologyReportRequests)
      .where(and(eq(astrologyReportRequests.id, input.reportRequestId), eq(astrologyReportRequests.userId, input.userId)))
      .limit(1);

    if (!request) throw new Error("report_not_found");

    const [row] = await tx
      .insert(betaFeedback)
      .values({
        userId: input.userId,
        reportRequestId: request.id,
        reportType: request.reportType,
        rating: input.rating ?? null,
        category: normalizeBetaFeedbackCategory(input.category),
        message,
        metadata: input.metadata ?? {}
      })
      .returning();

    return betaFeedbackRecordFromRow({
      category: row.category,
      createdAt: row.createdAt,
      id: row.id,
      message: row.message,
      metadata: row.metadata,
      rating: row.rating,
      reportRequestId: row.reportRequestId,
      reportType: row.reportType,
      userDisplayName: null,
      userEmail: null,
      userId: row.userId
    });
  });
}

export async function listRecentBetaFeedback(database: AstraDb, input: { limit?: number } = {}): Promise<BetaFeedbackRecord[]> {
  const rows = await database
    .select({
      category: betaFeedback.category,
      createdAt: betaFeedback.createdAt,
      id: betaFeedback.id,
      message: betaFeedback.message,
      metadata: betaFeedback.metadata,
      rating: betaFeedback.rating,
      reportRequestId: betaFeedback.reportRequestId,
      reportType: betaFeedback.reportType,
      userDisplayName: appUserProfiles.displayName,
      userEmail: appUserProfiles.email,
      userId: betaFeedback.userId
    })
    .from(betaFeedback)
    .leftJoin(appUserProfiles, eq(appUserProfiles.userId, betaFeedback.userId))
    .orderBy(desc(betaFeedback.createdAt))
    .limit(input.limit ?? 20);

  return rows.map(betaFeedbackRecordFromRow);
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
        reportBasis: input.reportBasis ?? null,
        generationMetadata: input.generationMetadata ?? null,
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
          reportBasis: input.reportBasis ?? null,
          generationMetadata: input.generationMetadata ?? null,
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
