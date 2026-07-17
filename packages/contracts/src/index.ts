import { z } from "zod";

const idSchema = z.string().min(1);
const isoDateSchema = z.string().datetime();
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeOnlySchema = z.string().regex(/^\d{2}:\d{2}$/);
const jsonObjectSchema = z.record(z.string(), z.unknown());

function parseDateOnly(value: string) {
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number.parseInt(yearText ?? "", 10);
  const month = Number.parseInt(monthText ?? "", 10);
  const day = Number.parseInt(dayText ?? "", 10);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return parsed;
}

function isFutureDateOnly(value: string) {
  const parsed = parseDateOnly(value);
  if (!parsed) return false;
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return parsed.getTime() > todayOnly.getTime();
}

function isValidTimeOnly(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number.parseInt(hourText ?? "", 10);
  const minute = Number.parseInt(minuteText ?? "", 10);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

const reportAsOfDateSchema = dateOnlySchema.refine((value) => Boolean(parseDateOnly(value)), {
  message: "As-of date must be a real calendar date."
});

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

export const createAllySchema = z.object({
  name: z.string().trim().min(1),
  kind: allySchema.shape.kind.default("person"),
  relationship: z.string().trim().min(1),
  note: z.string().trim().min(1).optional()
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

export const sourceCardSchema = z.object({
  id: idSchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  bodyTemplate: z.string().min(1),
  cardType: z.enum(["reflection", "practice", "lesson", "report_signal", "gift", "announcement"]).default("reflection"),
  topicTags: z.array(z.string().min(1)).default([]),
  symbolicTags: z.array(z.string().min(1)).default([]),
  eligibilityRules: jsonObjectSchema.default({}),
  safetyFlags: z.array(z.string().min(1)).default([]),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const publicStreamItemSchema = z.object({
  id: idSchema,
  sourceCardId: idSchema.optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  audienceScope: z.enum(["anonymous", "all", "new_user", "returning_user"]).default("all"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  publishAt: isoDateSchema,
  expiresAt: isoDateSchema.optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const userFeedItemSchema = z.object({
  id: idSchema,
  userId: idSchema,
  sourceCardId: idSchema.optional(),
  artifactId: idSchema.optional(),
  achievementId: idSchema.optional(),
  allyId: idSchema.optional(),
  giftId: idSchema.optional(),
  feedKind: z.enum(["source_card", "report_signal", "artifact", "achievement", "ally", "gift", "manual"]),
  title: z.string().min(1),
  body: z.string().min(1),
  displayPayload: jsonObjectSchema.default({}),
  rankScore: z.number().default(0),
  reasonCode: z.string().min(1),
  state: z.enum(["queued", "available", "seen", "dismissed", "saved", "expired"]).default("available"),
  availableAt: isoDateSchema,
  expiresAt: isoDateSchema.optional(),
  seenAt: isoDateSchema.optional(),
  dismissedAt: isoDateSchema.optional(),
  savedAt: isoDateSchema.optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const composerDecisionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  userFeedItemId: idSchema,
  decisionVersion: z.string().min(1),
  inputContextHash: z.string().min(1),
  candidateIds: z.array(idSchema).default([]),
  selectedCandidateId: idSchema,
  rankFeatures: jsonObjectSchema.default({}),
  suppressionReasons: z.array(z.string().min(1)).default([]),
  safetyNotes: z.array(z.string().min(1)).default([]),
  createdAt: isoDateSchema
});

export const privateFeedRequestSchema = z.object({
  userId: idSchema,
  limit: z.number().int().min(1).max(100).default(25),
  state: z.enum(["queued", "available", "seen", "dismissed", "saved", "expired"]).optional()
});

export const privateFeedResponseSchema = z.object({
  userId: idSchema,
  items: z.array(userFeedItemSchema),
  generatedAt: isoDateSchema
});

export const createUserFeedItemSchema = z.object({
  id: idSchema.optional(),
  userId: idSchema,
  sourceCardId: idSchema.optional(),
  artifactId: idSchema.optional(),
  achievementId: idSchema.optional(),
  allyId: idSchema.optional(),
  giftId: idSchema.optional(),
  feedKind: userFeedItemSchema.shape.feedKind,
  title: z.string().min(1),
  body: z.string().min(1),
  displayPayload: jsonObjectSchema.default({}),
  rankScore: z.number().default(0),
  reasonCode: z.string().min(1),
  state: userFeedItemSchema.shape.state.default("available"),
  availableAt: isoDateSchema.optional(),
  expiresAt: isoDateSchema.optional()
});

export const createComposerDecisionSchema = z.object({
  userId: idSchema,
  userFeedItemId: idSchema,
  decisionVersion: z.string().min(1),
  inputContextHash: z.string().min(1),
  candidateIds: z.array(idSchema).default([]),
  selectedCandidateId: idSchema,
  rankFeatures: jsonObjectSchema.default({}),
  suppressionReasons: z.array(z.string().min(1)).default([]),
  safetyNotes: z.array(z.string().min(1)).default([])
});

export const composerPrivateFeedDecisionInputSchema = z.object({
  decisionVersion: z.string().min(1),
  inputContextHash: z.string().min(1),
  candidateIds: z.array(idSchema).default([]),
  selectedCandidateId: idSchema,
  rankFeatures: jsonObjectSchema.default({}),
  suppressionReasons: z.array(z.string().min(1)).default([]),
  safetyNotes: z.array(z.string().min(1)).default([])
});

export const composerPrivateFeedWriteSchema = z.object({
  id: idSchema,
  publisher: z.literal("composer"),
  sourceCard: sourceCardSchema.optional(),
  feedItem: createUserFeedItemSchema,
  decision: composerPrivateFeedDecisionInputSchema.optional(),
  createdAt: isoDateSchema
});

export const composerPrivateFeedWriteResponseSchema = z.object({
  id: idSchema,
  sourceCard: sourceCardSchema.optional(),
  feedItem: userFeedItemSchema,
  decision: composerDecisionSchema.optional(),
  createdAt: isoDateSchema
});

export const composerOnboardingCardsWriteSchema = z
  .object({
    id: idSchema,
    publisher: z.literal("composer"),
    targetUserId: idSchema,
    cards: z.array(composerPrivateFeedWriteSchema).min(1).max(12),
    createdAt: isoDateSchema
  })
  .superRefine((batch, context) => {
    batch.cards.forEach((card, index) => {
      if (card.feedItem.userId !== batch.targetUserId) {
        context.addIssue({
          code: "custom",
          path: ["cards", index, "feedItem", "userId"],
          message: "Onboarding card writes must target the batch user."
        });
      }
      if (card.publisher !== batch.publisher) {
        context.addIssue({
          code: "custom",
          path: ["cards", index, "publisher"],
          message: "Onboarding card writes must be published by Composer."
        });
      }
    });
  });

export const composerOnboardingCardsWriteResponseSchema = z.object({
  id: idSchema,
  targetUserId: idSchema,
  writes: z.array(composerPrivateFeedWriteResponseSchema),
  createdAt: isoDateSchema
});

export const chartBirthDataSchema = z
  .object({
    date: dateOnlySchema,
    time: timeOnlySchema.optional(),
    timezone: z.string().min(1).optional(),
    birthTimeKnown: z.boolean().optional(),
    location: z.string().min(1).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional()
  })
  .superRefine((birthData, context) => {
    if (!parseDateOnly(birthData.date)) {
      context.addIssue({
        code: "custom",
        path: ["date"],
        message: "Birth date must be a real calendar date."
      });
    }

    if (isFutureDateOnly(birthData.date)) {
      context.addIssue({
        code: "custom",
        path: ["date"],
        message: "Birth date cannot be in the future."
      });
    }

    if (birthData.birthTimeKnown === false) {
      if (birthData.time) {
        context.addIssue({
          code: "custom",
          path: ["time"],
          message: "Unknown birth time must not store an exact time."
        });
      }
      if (!birthData.timezone) {
        context.addIssue({
          code: "custom",
          path: ["timezone"],
          message: "Timezone is required when birth time is unknown."
        });
      }
      return;
    }

    if (birthData.time && !isValidTimeOnly(birthData.time)) {
      context.addIssue({
        code: "custom",
        path: ["time"],
        message: "Birth time must be a real HH:mm time."
      });
    }

    const hasTimedBirthMoment = Boolean(birthData.time || birthData.timezone);

    if (hasTimedBirthMoment) {
      for (const field of ["time", "timezone"] as const) {
        if (!birthData[field]) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: "Birth time and timezone travel together; provide both or turn on unknown birth time."
          });
        }
      }
    }

    if ((birthData.latitude !== undefined || birthData.longitude !== undefined) && !birthData.location) {
      context.addIssue({
        code: "custom",
        path: ["location"],
        message: "Coordinates require a birth location label."
      });
    }
  });

export const createChartBirthDataSchema = chartBirthDataSchema.superRefine((birthData, context) => {
  const hasLatitude = birthData.latitude !== undefined;
  const hasLongitude = birthData.longitude !== undefined;

  if (hasLatitude !== hasLongitude) {
    context.addIssue({
      code: "custom",
      path: hasLatitude ? ["longitude"] : ["latitude"],
      message: "Birth coordinates must include both latitude and longitude."
    });
  }

  if (birthData.latitude === 0 && birthData.longitude === 0) {
    context.addIssue({
      code: "custom",
      path: ["latitude"],
      message: "Placeholder coordinates cannot be used for a new chart."
    });
  }
});

export const chartCalculationModeSchema = z.enum(["full", "signs-aspects-only"]);

type BirthCoordinateInput = {
  birthTimeKnown?: boolean;
  time?: string;
  timezone?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
};

export function hasResolvedBirthCoordinates(birthData: BirthCoordinateInput) {
  return Boolean(
    birthData.location?.trim() &&
    Number.isFinite(birthData.latitude) &&
    Number.isFinite(birthData.longitude) &&
    !(birthData.latitude === 0 && birthData.longitude === 0)
  );
}

export function chartCalculationModeForBirthData(birthData: BirthCoordinateInput) {
  return birthData.birthTimeKnown !== false &&
    Boolean(birthData.time && birthData.timezone) &&
    hasResolvedBirthCoordinates(birthData)
    ? "full" as const
    : "signs-aspects-only" as const;
}

export const chartSubjectTypeSchema = z.enum(["self", "ally"]);

export const chartSubjectContextSchema = z.object({
  subjectType: chartSubjectTypeSchema,
  subjectId: idSchema.optional(),
  allyId: idSchema.optional(),
  displayName: z.string().min(1),
  relationship: z.string().min(1).optional(),
  note: z.string().min(1).optional()
});

export const chartSettingsSchema = z.object({
  zodiacMode: z.enum(["tropical", "sidereal"]).default("tropical"),
  houseSystem: z.enum(["whole-sign", "placidus"]).default("whole-sign")
});

export const explicitChartSettingsSchema = z.object({
  zodiacMode: z.enum(["tropical", "sidereal"]),
  houseSystem: z.enum(["whole-sign", "placidus"])
});

export const synastryPartnerSchema = z.object({
  chartRequestId: idSchema,
  subjectName: z.string().min(1),
  birthData: chartBirthDataSchema.optional()
});

export const chartRequestContextSchema = jsonObjectSchema.and(
  z.object({
    subject: chartSubjectContextSchema.optional(),
    chartSettings: chartSettingsSchema.optional(),
    synastryPartner: synastryPartnerSchema.optional()
  })
);

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
  context: chartRequestContextSchema.optional(),
  source: z.enum(["self", "ally", "composer", "import"]).default("self"),
  status: z.enum(["queued", "processing", "completed", "failed", "cancelled"]).default("queued"),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const createChartMakerRequestSchema = z.object({
  subjectName: z.string().min(1),
  birthData: createChartBirthDataSchema,
  question: z.string().min(1).optional(),
  intent: z.string().min(1).optional(),
  context: chartRequestContextSchema.optional(),
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

export const chartMakerPrecisionSchema = z.enum(["date_only", "timed_timezone", "timed_location"]);

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
export const astrologyReportTypeSchema = z.enum([
  "identity",
  "core",
  "deep",
  "progressed",
  "synastry",
  "core_self",
  "chart_interpretation",
  "daily_stream",
  "question_intention"
]);
export const orderableAstrologyReportTypeSchema = z.enum(["identity", "core", "deep", "progressed", "synastry"]);
export const reportBasisTypeSchema = z.enum(["natal", "progressed", "synastry"]);
export const reportChartSourceSnapshotSchema = z.object({
  chartRequestId: idSchema,
  subjectType: chartSubjectTypeSchema,
  subjectId: idSchema.optional(),
  subjectName: z.string().min(1),
  birthData: chartBirthDataSchema,
  calculationMode: chartCalculationModeSchema.optional()
});
export const reportChartBasisInputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("natal"),
    chartSettings: explicitChartSettingsSchema
  }),
  z.object({
    type: z.literal("progressed"),
    chartSettings: explicitChartSettingsSchema,
    asOfDate: reportAsOfDateSchema
  }),
  z.object({
    type: z.literal("synastry"),
    chartSettings: explicitChartSettingsSchema,
    partnerChartRequestId: idSchema
  })
]);
export const reportChartBasisSnapshotSchema = z
  .object({
    schemaVersion: z.union([z.literal(1), z.literal(2)]),
    type: reportBasisTypeSchema,
    chartSettings: explicitChartSettingsSchema,
    primary: reportChartSourceSnapshotSchema,
    partner: reportChartSourceSnapshotSchema.optional(),
    asOfDate: reportAsOfDateSchema.optional()
  })
  .superRefine((basis, context) => {
    if (basis.type === "progressed" && !basis.asOfDate) {
      context.addIssue({ code: "custom", path: ["asOfDate"], message: "Progressed reports require an as-of date." });
    }
    if (basis.type === "synastry" && !basis.partner) {
      context.addIssue({ code: "custom", path: ["partner"], message: "Synastry reports require a comparison chart." });
    }
    if (basis.type !== "progressed" && basis.asOfDate) {
      context.addIssue({ code: "custom", path: ["asOfDate"], message: "Only progressed reports may include an as-of date." });
    }
    if (basis.type !== "synastry" && basis.partner) {
      context.addIssue({ code: "custom", path: ["partner"], message: "Only synastry reports may include a comparison chart." });
    }
    if (basis.partner?.chartRequestId === basis.primary.chartRequestId) {
      context.addIssue({ code: "custom", path: ["partner", "chartRequestId"], message: "Synastry requires two different charts." });
    }
    if (basis.schemaVersion === 2 && !basis.primary.calculationMode) {
      context.addIssue({ code: "custom", path: ["primary", "calculationMode"], message: "Version 2 report snapshots require the primary calculation mode." });
    }
    if (basis.schemaVersion === 2 && basis.partner && !basis.partner.calculationMode) {
      context.addIssue({ code: "custom", path: ["partner", "calculationMode"], message: "Version 2 report snapshots require the comparison calculation mode." });
    }
  });
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

export const reportGenerationRetryReasonCodeSchema = z.enum([
  "provider_error",
  "provider_timeout",
  "provider_no_text",
  "thesis_length",
  "thesis_format",
  "thesis_astrology",
  "invalid_markdown",
  "chapter_count",
  "heading_mismatch",
  "below_minimum",
  "above_maximum",
  "forbidden_fragment",
  "third_person_subject",
  "unsupported_claim",
  "evidence_mismatch",
  "identity_opening",
  "natal_timing"
]);

export const reportGenerationRetryIssueSchema = z.object({
  code: reportGenerationRetryReasonCodeSchema,
  message: z.string().min(1)
});

export const reportGenerationRetryFailureSchema = z.object({
  attempt: z.number().int().positive(),
  issues: z.array(reportGenerationRetryIssueSchema).min(1),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  reasoningTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  estimatedSpend: z.number().nonnegative().optional(),
  finishReason: z.string().min(1).optional(),
  rejectedText: z.string().min(1).optional(),
  latencyMs: z.number().int().nonnegative()
});

const reportReadabilityMetricSchema = z.object({
  wordCount: z.number().int().nonnegative(),
  sentenceCount: z.number().int().positive(),
  syllableCount: z.number().int().nonnegative(),
  averageSentenceWords: z.number().nonnegative(),
  polysyllabicWordRate: z.number().nonnegative(),
  fleschReadingEase: z.number(),
  fleschKincaidGrade: z.number()
});

const reportReadabilityMetadataSchema = z.object({
  algorithm: z.literal("flesch-kincaid-en-us-v1"),
  targetGradeMin: z.number().int().min(1).max(12),
  targetGradeMax: z.number().int().min(1).max(12),
  overall: reportReadabilityMetricSchema,
  sections: z.array(reportReadabilityMetricSchema.extend({ title: z.string().min(1) }))
});

const reportGenerationPartMetadataSchema = z.object({
  attemptCount: z.number().int().positive(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  reasoningTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  estimatedSpend: z.number().nonnegative().optional(),
  finishReason: z.string().min(1).optional(),
  latencyMs: z.number().int().nonnegative(),
  acceptedText: z.string().min(1).optional(),
  failures: z.array(reportGenerationRetryFailureSchema).optional()
});

export const reportGenerationMetadataSchema = z.object({
  writer: z.string().min(1),
  provider: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  modelProfile: z.string().min(1).optional(),
  promptVersion: z.string().min(1),
  attemptCount: z.number().int().positive(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  reasoningTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  estimatedSpend: z.number().nonnegative().optional(),
  reasoningEffort: z.enum(["none", "minimal", "low", "medium", "high", "xhigh", "max"]).optional(),
  latencyMs: z.number().int().nonnegative().optional(),
  orchestration: z.enum(["monolithic", "sectioned-v1"]).optional(),
  thesis: reportGenerationPartMetadataSchema.optional(),
  sections: z.array(reportGenerationPartMetadataSchema.extend({ title: z.string().min(1) })).optional(),
  readability: reportReadabilityMetadataSchema.optional()
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
  context: chartRequestContextSchema.optional(),
  source: z.enum(["self", "ally", "composer", "import"]).default("self"),
  boundary: z.literal("private").default("private"),
  status: astrologyReportStatusSchema.default("queued"),
  engine: z.string().min(1).optional(),
  engineVersion: z.string().min(1).optional(),
  costCredits: z.number().int().nonnegative().default(0),
  reportBasis: reportChartBasisSnapshotSchema.optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const createAstrologyReportRequestSchema = z.object({
  chartRequestId: idSchema,
  reportType: orderableAstrologyReportTypeSchema.default("identity"),
  reportBasis: reportChartBasisInputSchema,
  question: z.string().min(1).optional(),
  intent: z.string().min(1).optional(),
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
  reportBasis: reportChartBasisSnapshotSchema.optional(),
  generationMetadata: reportGenerationMetadataSchema.optional(),
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
  reportBasis: reportChartBasisSnapshotSchema.optional(),
  generationMetadata: reportGenerationMetadataSchema.optional(),
  error: z.string().min(1).optional()
});

export const portableUserDataBundleSchema = z
  .object({
    format: z.literal("astra-portable-user-data"),
    schemaVersion: z.literal(1),
    exportedAt: isoDateSchema,
    source: z
      .object({
        label: z.string().min(1)
      })
      .strict(),
    account: z
      .object({
        sourceUserId: idSchema,
        email: z.string().email(),
        displayName: z.string().min(1)
      })
      .strict(),
    data: z
      .object({
        allies: z.array(allySchema),
        chartRequests: z.array(chartMakerRequestSchema),
        chartResults: z.array(chartMakerResultSchema),
        reportRequests: z.array(astrologyReportRequestSchema),
        reportResults: z.array(astrologyReportResultSchema)
      })
      .strict()
  })
  .strict()
  .superRefine((bundle, context) => {
    const expectedUserId = bundle.account.sourceUserId;
    const ownedRows = [
      ...bundle.data.allies.map((row) => ["allies", row.id, row.userId] as const),
      ...bundle.data.chartRequests.map((row) => ["chartRequests", row.id, row.userId] as const),
      ...bundle.data.chartResults.map((row) => ["chartResults", row.id, row.userId] as const),
      ...bundle.data.reportRequests.map((row) => ["reportRequests", row.id, row.userId] as const),
      ...bundle.data.reportResults.map((row) => ["reportResults", row.id, row.userId] as const)
    ];
    for (const [collection, id, userId] of ownedRows) {
      if (userId !== expectedUserId) {
        context.addIssue({ code: "custom", path: ["data", collection], message: `${id} is not owned by the exported account.` });
      }
    }

    const chartRequestIds = new Set(bundle.data.chartRequests.map((row) => row.id));
    for (const result of bundle.data.chartResults) {
      if (!chartRequestIds.has(result.requestId)) {
        context.addIssue({ code: "custom", path: ["data", "chartResults"], message: `${result.id} references a chart request outside the bundle.` });
      }
    }

    const reportRequestIds = new Set(bundle.data.reportRequests.map((row) => row.id));
    for (const result of bundle.data.reportResults) {
      if (!reportRequestIds.has(result.requestId)) {
        context.addIssue({ code: "custom", path: ["data", "reportResults"], message: `${result.id} references a report request outside the bundle.` });
      }
    }
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

export const composerCardOntologyTypeSchema = z.enum(["lesson", "reflection", "quiz", "test", "certification", "art", "onboarding", "series"]);

export const composerAvailabilityRequestSchema = z.object({
  requestType: z.enum(["course", "series", "pool", "ordered_list", "onboarding"]).default("course"),
  id: idSchema.optional(),
  cardIds: z.array(idSchema).default([]),
  limit: z.number().int().min(1).max(100).default(48)
});

export const composerAvailabilityCardSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  body: z.string().min(1),
  excerpt: z.string().min(1).optional(),
  kind: z.string().min(1),
  ontologyType: composerCardOntologyTypeSchema,
  status: z.string().min(1),
  order: z.number().int().nonnegative().optional(),
  collectionId: idSchema,
  collectionTitle: z.string().min(1),
  sectionId: idSchema.optional(),
  sectionTitle: z.string().min(1).optional(),
  lane: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).default([]),
  imageUrl: z.string().min(1).optional(),
  quiz: jsonObjectSchema.optional(),
  source: z.string().min(1).optional()
});

export const composerAvailabilityCollectionSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  kind: z.enum(["course", "series", "pool", "ordered_list", "onboarding"]),
  description: z.string().min(1),
  totalCards: z.number().int().nonnegative(),
  cards: z.array(composerAvailabilityCardSchema),
  generatedAt: isoDateSchema
});

export const composerAvailabilityResponseSchema = z.object({
  request: composerAvailabilityRequestSchema,
  collection: composerAvailabilityCollectionSchema
});

export const composerSelectionRequestSchema = composerAvailabilityRequestSchema.extend({
  userKey: idSchema,
  selectionDate: dateOnlySchema.optional(),
  count: z.number().int().min(1).max(12).default(5),
  eligibility: jsonObjectSchema.default({})
});

export const composerSelectionResponseSchema = z.object({
  id: idSchema,
  request: composerSelectionRequestSchema,
  availability: composerAvailabilityResponseSchema,
  selectedCards: z.array(composerAvailabilityCardSchema),
  generatedAt: isoDateSchema,
  reasonCode: z.string().min(1),
  selectionMode: z.enum(["deterministic", "script", "llm"]).default("deterministic")
});

export type AstraUser = z.infer<typeof userSchema>;
export type AstraCard = z.infer<typeof cardSchema>;
export type StreamItem = z.infer<typeof streamItemSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type Ally = z.infer<typeof allySchema>;
export type CreateAlly = z.infer<typeof createAllySchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type Gift = z.infer<typeof giftSchema>;
export type StarTransaction = z.infer<typeof starTransactionSchema>;
export type SourceCard = z.infer<typeof sourceCardSchema>;
export type PublicStreamItem = z.infer<typeof publicStreamItemSchema>;
export type UserFeedItem = z.infer<typeof userFeedItemSchema>;
export type ComposerDecision = z.infer<typeof composerDecisionSchema>;
export type PrivateFeedRequest = z.infer<typeof privateFeedRequestSchema>;
export type PrivateFeedResponse = z.infer<typeof privateFeedResponseSchema>;
export type CreateUserFeedItem = z.infer<typeof createUserFeedItemSchema>;
export type CreateComposerDecision = z.infer<typeof createComposerDecisionSchema>;
export type ComposerPrivateFeedDecisionInput = z.infer<typeof composerPrivateFeedDecisionInputSchema>;
export type ComposerPrivateFeedWrite = z.infer<typeof composerPrivateFeedWriteSchema>;
export type ComposerPrivateFeedWriteResponse = z.infer<typeof composerPrivateFeedWriteResponseSchema>;
export type ComposerOnboardingCardsWrite = z.infer<typeof composerOnboardingCardsWriteSchema>;
export type ComposerOnboardingCardsWriteResponse = z.infer<typeof composerOnboardingCardsWriteResponseSchema>;
export type ChartBirthData = z.infer<typeof chartBirthDataSchema>;
export type CreateChartBirthData = z.infer<typeof createChartBirthDataSchema>;
export type ChartCalculationMode = z.infer<typeof chartCalculationModeSchema>;
export type ChartSubjectType = z.infer<typeof chartSubjectTypeSchema>;
export type ChartSubjectContext = z.infer<typeof chartSubjectContextSchema>;
export type ChartSettings = z.infer<typeof chartSettingsSchema>;
export type ExplicitChartSettings = z.infer<typeof explicitChartSettingsSchema>;
export type ChartRequestContext = z.infer<typeof chartRequestContextSchema>;
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
export type OrderableAstrologyReportType = z.infer<typeof orderableAstrologyReportTypeSchema>;
export type ReportBasisType = z.infer<typeof reportBasisTypeSchema>;
export type ReportChartSourceSnapshot = z.infer<typeof reportChartSourceSnapshotSchema>;
export type ReportChartBasisInput = z.infer<typeof reportChartBasisInputSchema>;
export type ReportChartBasisSnapshot = z.infer<typeof reportChartBasisSnapshotSchema>;
export type ReportBoundary = z.infer<typeof reportBoundarySchema>;
export type AstrologyReportSection = z.infer<typeof astrologyReportSectionSchema>;
export type AstrologyReportProvenance = z.infer<typeof astrologyReportProvenanceSchema>;
export type AstrologyReportPublicSignal = z.infer<typeof astrologyReportPublicSignalSchema>;
export type ReportGenerationRetryReasonCode = z.infer<typeof reportGenerationRetryReasonCodeSchema>;
export type ReportGenerationRetryIssue = z.infer<typeof reportGenerationRetryIssueSchema>;
export type ReportGenerationRetryFailure = z.infer<typeof reportGenerationRetryFailureSchema>;
export type AstrologyReportRequest = z.infer<typeof astrologyReportRequestSchema>;
export type CreateAstrologyReportRequest = z.infer<typeof createAstrologyReportRequestSchema>;
export type AstrologyReportResult = z.infer<typeof astrologyReportResultSchema>;
export type RecordAstrologyReportResult = z.infer<typeof recordAstrologyReportResultSchema>;
export type PortableUserDataBundle = z.infer<typeof portableUserDataBundleSchema>;
export type ComposerVoiceId = z.infer<typeof composerVoiceIdSchema>;
export type ComposerVoiceCard = z.infer<typeof composerVoiceCardSchema>;
export type ComposerVoiceValidationError = z.infer<typeof composerVoiceValidationErrorSchema>;
export type ComposerArtifactRationale = z.infer<typeof composerArtifactRationaleSchema>;
export type ComposerStreamArtifact = z.infer<typeof composerStreamArtifactSchema>;
export type ComposerCardOntologyType = z.infer<typeof composerCardOntologyTypeSchema>;
export type ComposerAvailabilityRequest = z.infer<typeof composerAvailabilityRequestSchema>;
export type ComposerAvailabilityCard = z.infer<typeof composerAvailabilityCardSchema>;
export type ComposerAvailabilityCollection = z.infer<typeof composerAvailabilityCollectionSchema>;
export type ComposerAvailabilityResponse = z.infer<typeof composerAvailabilityResponseSchema>;
export type ComposerSelectionRequest = z.infer<typeof composerSelectionRequestSchema>;
export type ComposerSelectionResponse = z.infer<typeof composerSelectionResponseSchema>;

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
