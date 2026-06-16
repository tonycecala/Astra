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

export const recordChartMakerResultSchema = z.object({
  requestId: idSchema,
  userId: idSchema,
  engine: z.string().min(1),
  status: z.enum(["completed", "failed"]),
  summary: z.string().min(1).optional(),
  chartData: jsonObjectSchema.optional(),
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

export const composerStreamArtifactSchema = z
  .object({
    id: idSchema,
    target: z.literal("stream"),
    publisher: z.literal("composer"),
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
export type ChartMakerRequest = z.infer<typeof chartMakerRequestSchema>;
export type CreateChartMakerRequest = z.infer<typeof createChartMakerRequestSchema>;
export type ChartMakerResult = z.infer<typeof chartMakerResultSchema>;
export type RecordChartMakerResult = z.infer<typeof recordChartMakerResultSchema>;
export type ComposerVoiceId = z.infer<typeof composerVoiceIdSchema>;
export type ComposerVoiceCard = z.infer<typeof composerVoiceCardSchema>;
export type ComposerVoiceValidationError = z.infer<typeof composerVoiceValidationErrorSchema>;
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
