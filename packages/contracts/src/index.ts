import { z } from "zod";

const idSchema = z.string().min(1);
const isoDateSchema = z.string().datetime();
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeOnlySchema = z.string().regex(/^\d{2}:\d{2}$/);
const jsonObjectSchema = z.record(z.string(), z.unknown());

export const userSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  displayName: z.string().min(1),
  role: z.enum(["customer", "operator", "admin"]).default("customer"),
  onboardingStatus: z.enum(["pending", "complete"]).default("pending"),
  starBalance: z.number().int().nonnegative().default(0),
  createdAt: isoDateSchema
});

export const cardSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  subtitle: z.string().optional(),
  body: z.string().min(1),
  lane: z.enum(["today", "know_yourself", "myth_and_symbol", "practice", "gift"]),
  tone: z.enum(["calm", "bright", "grounded", "ceremonial"]).default("grounded"),
  ctaLabel: z.string().min(1).optional(),
  ctaAction: z.enum(["open", "save", "reflect", "claim"]).optional(),
  imageUrl: z.string().min(1).optional(),
  publishedAt: isoDateSchema
});

export const streamItemSchema = z.object({
  id: idSchema,
  cardId: idSchema,
  kind: z.enum(["card", "achievement", "artifact", "gift", "ally"]),
  position: z.number().int().nonnegative(),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  audience: z.enum(["all", "new_user", "returning_user"]).default("all")
});

export const achievementSchema = z.object({
  id: idSchema,
  userId: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  earnedAt: isoDateSchema.optional(),
  starReward: z.number().int().nonnegative().default(0)
});

export const allySchema = z.object({
  id: idSchema,
  userId: idSchema,
  name: z.string().min(1),
  kind: z.enum(["guide", "mentor", "ancestor", "archetype", "person"]),
  relationship: z.string().min(1),
  note: z.string().min(1).optional(),
  createdAt: isoDateSchema
});

export const artifactSchema = z.object({
  id: idSchema,
  userId: idSchema,
  title: z.string().min(1),
  kind: z.enum(["report", "reflection", "chart", "note", "saved_card"]),
  summary: z.string().min(1),
  createdAt: isoDateSchema
});

export const giftSchema = z.object({
  id: idSchema,
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  starCost: z.number().int().nonnegative(),
  active: z.boolean().default(true)
});

export const starTransactionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  amount: z.number().int(),
  direction: z.enum(["earned", "purchased", "spent", "gifted", "adjusted", "refunded"]),
  reason: z.string().min(1),
  createdAt: isoDateSchema
});

export const chartBirthDataSchema = z
  .object({
    date: dateOnlySchema,
    time: timeOnlySchema.optional(),
    timezone: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional()
  })
  .superRefine((birthData, context) => {
    const hasPrecisionBundle = Boolean(
      birthData.time || birthData.timezone || birthData.location || birthData.latitude !== undefined || birthData.longitude !== undefined
    );

    if (!hasPrecisionBundle) return;

    for (const field of ["time", "timezone", "location"] as const) {
      if (!birthData[field]) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Birth time, timezone, and location travel together; provide all three or leave all three blank."
        });
      }
    }
  });

export const birthPlaceSearchQuerySchema = z.object({
  query: z.string().trim().min(2).max(120),
  limit: z.number().int().min(1).max(10).default(5)
});

export const birthPlaceSearchResultSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  timezone: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  provider: z.string().min(1)
});

export const birthPlaceSearchResponseSchema = z.object({
  provider: z.string().min(1),
  results: z.array(birthPlaceSearchResultSchema)
});

export const chartMakerRequestSchema = z.object({
  id: idSchema,
  userId: idSchema,
  subjectName: z.string().min(1),
  birthData: chartBirthDataSchema,
  question: z.string().min(1).optional(),
  intent: z.string().min(1).optional(),
  context: jsonObjectSchema.optional(),
  source: z.enum(["self", "ally", "composer", "import"]).default("self"),
  status: z.enum(["queued", "processing", "completed", "failed", "cancelled"]).default("queued"),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const createChartMakerRequestSchema = z.object({
  subjectName: z.string().min(1),
  birthData: chartBirthDataSchema,
  question: z.string().min(1).optional(),
  intent: z.string().min(1).optional(),
  context: jsonObjectSchema.optional(),
  source: z.enum(["self", "ally", "composer", "import"]).default("self")
});

export const chartMakerResultSchema = z.object({
  id: idSchema,
  requestId: idSchema,
  userId: idSchema,
  engine: z.string().min(1),
  status: z.enum(["completed", "failed"]),
  summary: z.string().min(1).optional(),
  chartData: jsonObjectSchema,
  error: z.string().min(1).optional(),
  createdAt: isoDateSchema
});

export const chartMakerPrecisionSchema = z.enum(["date_only", "timed_location"]);

export const chartMakerChartDataSchema = z.object({
  schemaVersion: z.literal(1),
  engine: z.string().min(1),
  requestId: idSchema,
  subjectName: z.string().min(1),
  precision: chartMakerPrecisionSchema,
  birthData: chartBirthDataSchema,
  derived: z.object({
    sunSign: z.string().min(1),
    season: z.string().min(1),
    dayOfYear: z.number().int().min(1).max(366)
  }),
  interpretation: z.object({
    headline: z.string().min(1),
    summary: z.string().min(1),
    limits: z.array(z.string().min(1)).min(1)
  }),
  requestContext: z.object({
    question: z.string().min(1).optional(),
    intent: z.string().min(1).optional(),
    source: z.enum(["self", "ally", "composer", "import"])
  })
});

export const recordChartMakerResultSchema = z.object({
  requestId: idSchema,
  userId: idSchema,
  engine: z.string().min(1),
  status: z.enum(["completed", "failed"]),
  summary: z.string().min(1).optional(),
  chartData: jsonObjectSchema.optional(),
  error: z.string().min(1).optional()
});

export const astrologyReportStatusSchema = z.enum(["queued", "processing", "completed", "failed", "cancelled"]);
export const astrologyReportTypeSchema = z.enum(["core_self", "chart_interpretation", "daily_stream", "question_intention"]);
export const reportBoundarySchema = z.enum(["private", "public_signal"]);

export const astrologyReportSectionSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  emphasis: z.enum(["primary", "supporting", "practice"]).default("supporting")
});

export const astrologyReportProvenanceSchema = z.object({
  id: idSchema,
  kind: z.enum(["birth_data", "chart_result", "user_intent", "engine", "composer_signal", "manual"]),
  label: z.string().min(1),
  summary: z.string().min(1),
  boundary: reportBoundarySchema.default("private"),
  sourceId: idSchema.optional()
});

export const astrologyReportPublicSignalSchema = z.object({
  reportId: idSchema,
  requestId: idSchema,
  reportType: astrologyReportTypeSchema,
  headline: z.string().min(1),
  summary: z.string().min(1),
  tone: cardSchema.shape.tone,
  boundary: z.literal("public_signal"),
  provenanceSummary: z.string().min(1)
});

export const astrologyReportRequestSchema = z.object({
  id: idSchema,
  userId: idSchema,
  chartRequestId: idSchema.optional(),
  reportType: astrologyReportTypeSchema,
  subjectName: z.string().min(1),
  birthData: chartBirthDataSchema,
  question: z.string().min(1).optional(),
  intent: z.string().min(1).optional(),
  context: jsonObjectSchema.optional(),
  source: z.enum(["self", "ally", "composer", "import"]).default("self"),
  boundary: z.literal("private").default("private"),
  status: astrologyReportStatusSchema.default("queued"),
  engine: z.string().min(1).optional(),
  engineVersion: z.string().min(1).optional(),
  costCredits: z.number().int().nonnegative().default(0),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const createAstrologyReportRequestSchema = z.object({
  chartRequestId: idSchema.optional(),
  reportType: astrologyReportTypeSchema.default("core_self"),
  subjectName: z.string().min(1),
  birthData: chartBirthDataSchema,
  question: z.string().min(1).optional(),
  intent: z.string().min(1).optional(),
  context: jsonObjectSchema.optional(),
  source: z.enum(["self", "ally", "composer", "import"]).default("self")
});

export const astrologyReportResultSchema = z.object({
  id: idSchema,
  requestId: idSchema,
  userId: idSchema,
  engine: z.string().min(1),
  engineVersion: z.string().min(1),
  status: z.enum(["completed", "failed"]),
  summary: z.string().min(1).optional(),
  sections: z.array(astrologyReportSectionSchema).default([]),
  provenance: z.array(astrologyReportProvenanceSchema).default([]),
  publicSignal: astrologyReportPublicSignalSchema.optional(),
  error: z.string().min(1).optional(),
  createdAt: isoDateSchema
});

export const recordAstrologyReportResultSchema = z.object({
  requestId: idSchema,
  userId: idSchema,
  engine: z.string().min(1),
  engineVersion: z.string().min(1),
  status: z.enum(["completed", "failed"]),
  summary: z.string().min(1).optional(),
  sections: z.array(astrologyReportSectionSchema).default([]),
  provenance: z.array(astrologyReportProvenanceSchema).default([]),
  publicSignal: astrologyReportPublicSignalSchema.optional(),
  error: z.string().min(1).optional()
});

export const composerVoiceIdSchema = z.enum(["guide", "companion", "prompt"]);

export const composerVoiceCardSchema = z.object({
  voice: z.object({
    id: composerVoiceIdSchema
  }),
  header: z.string().min(1),
  body: z.string().min(1)
});

export const composerVoiceValidationErrorSchema = z.object({
  ok: z.literal(false),
  error: z.literal("VOICE_VALIDATION_FAILED"),
  voice_id: composerVoiceIdSchema,
  violations: z.array(
    z.object({
      field: z.enum(["header", "body"]),
      type: z.enum(["WORD_LIMIT", "BANNED_TERM", "MORALIZING"]),
      limit: z.number().int().positive().optional(),
      actual: z.number().int().nonnegative().optional(),
      term: z.string().min(1).optional()
    })
  )
});

export const composerArtifactRationaleSchema = z.object({
  reason: z.string().min(1),
  source: z.enum(["composer_voice", "chart_result", "onboarding", "manual"]).default("composer_voice")
});

export const composerStreamArtifactSchema = z
  .object({
    id: idSchema,
    target: z.literal("stream"),
    publisher: z.literal("composer"),
    rationale: composerArtifactRationaleSchema,
    voiceCard: composerVoiceCardSchema,
    card: cardSchema,
    streamItem: streamItemSchema,
    createdAt: isoDateSchema
  })
  .refine((artifact) => artifact.card.id === artifact.streamItem.cardId, {
    message: "Composer stream artifact card.id must match streamItem.cardId.",
    path: ["streamItem", "cardId"]
  });

export type AstraUser = z.infer<typeof userSchema>;
export type AstraCard = z.infer<typeof cardSchema>;
export type StreamItem = z.infer<typeof streamItemSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type Ally = z.infer<typeof allySchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type Gift = z.infer<typeof giftSchema>;
export type StarTransaction = z.infer<typeof starTransactionSchema>;
export type ChartBirthData = z.infer<typeof chartBirthDataSchema>;
export type BirthPlaceSearchQuery = z.infer<typeof birthPlaceSearchQuerySchema>;
export type BirthPlaceSearchResult = z.infer<typeof birthPlaceSearchResultSchema>;
export type BirthPlaceSearchResponse = z.infer<typeof birthPlaceSearchResponseSchema>;
export type ChartMakerRequest = z.infer<typeof chartMakerRequestSchema>;
export type CreateChartMakerRequest = z.infer<typeof createChartMakerRequestSchema>;
export type ChartMakerResult = z.infer<typeof chartMakerResultSchema>;
export type ChartMakerPrecision = z.infer<typeof chartMakerPrecisionSchema>;
export type ChartMakerChartData = z.infer<typeof chartMakerChartDataSchema>;
export type RecordChartMakerResult = z.infer<typeof recordChartMakerResultSchema>;
export type AstrologyReportStatus = z.infer<typeof astrologyReportStatusSchema>;
export type AstrologyReportType = z.infer<typeof astrologyReportTypeSchema>;
export type ReportBoundary = z.infer<typeof reportBoundarySchema>;
export type AstrologyReportSection = z.infer<typeof astrologyReportSectionSchema>;
export type AstrologyReportProvenance = z.infer<typeof astrologyReportProvenanceSchema>;
export type AstrologyReportPublicSignal = z.infer<typeof astrologyReportPublicSignalSchema>;
export type AstrologyReportRequest = z.infer<typeof astrologyReportRequestSchema>;
export type CreateAstrologyReportRequest = z.infer<typeof createAstrologyReportRequestSchema>;
export type AstrologyReportResult = z.infer<typeof astrologyReportResultSchema>;
export type RecordAstrologyReportResult = z.infer<typeof recordAstrologyReportResultSchema>;
export type ComposerVoiceId = z.infer<typeof composerVoiceIdSchema>;
export type ComposerVoiceCard = z.infer<typeof composerVoiceCardSchema>;
export type ComposerVoiceValidationError = z.infer<typeof composerVoiceValidationErrorSchema>;
export type ComposerArtifactRationale = z.infer<typeof composerArtifactRationaleSchema>;
export type ComposerStreamArtifact = z.infer<typeof composerStreamArtifactSchema>;

export const foundationSeedSchema = z.object({
  user: userSchema,
  cards: z.array(cardSchema).min(1),
  streamItems: z.array(streamItemSchema).min(1),
  achievements: z.array(achievementSchema),
  allies: z.array(allySchema),
  artifacts: z.array(artifactSchema),
  gifts: z.array(giftSchema),
  starTransactions: z.array(starTransactionSchema)
});

export type FoundationSeed = z.infer<typeof foundationSeedSchema>;
