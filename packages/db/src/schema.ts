import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    emailIdx: uniqueIndex("user_email_idx").on(table.email)
  })
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
  },
  (table) => ({
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
    userIdx: index("session_user_id_idx").on(table.userId)
  })
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("account_user_id_idx").on(table.userId),
    providerAccountIdx: uniqueIndex("account_provider_account_idx").on(table.providerId, table.accountId)
  })
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier)
  })
);

export const appUserProfiles = pgTable(
  "app_user_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull().default("customer"),
    onboardingStatus: text("onboarding_status").notNull().default("pending"),
    starBalance: integer("star_balance").notNull().default(0),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: uniqueIndex("app_user_profiles_user_id_idx").on(table.userId),
    emailIdx: uniqueIndex("app_user_profiles_email_idx").on(table.email)
  })
);

export const cards = pgTable("cards", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  body: text("body").notNull(),
  lane: text("lane").notNull(),
  tone: text("tone").notNull().default("grounded"),
  ctaLabel: text("cta_label"),
  ctaAction: text("cta_action"),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const streamItems = pgTable(
  "stream_items",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    position: integer("position").notNull(),
    status: text("status").notNull().default("published"),
    audience: text("audience").notNull().default("all"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    feedIdx: index("stream_items_feed_idx").on(table.status, table.position)
  })
);

export const achievements = pgTable(
  "achievements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }),
    starReward: integer("star_reward").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("achievements_user_idx").on(table.userId, table.earnedAt)
  })
);

export const allies = pgTable(
  "allies",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    relationship: text("relationship").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("allies_user_idx").on(table.userId, table.createdAt)
  })
);

export const artifacts = pgTable(
  "artifacts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: text("kind").notNull(),
    summary: text("summary").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("artifacts_user_idx").on(table.userId, table.createdAt)
  })
);

export const chartRequests = pgTable(
  "chart_requests",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subjectName: text("subject_name").notNull(),
    birthData: jsonb("birth_data").notNull(),
    question: text("question"),
    intent: text("intent"),
    context: jsonb("context").notNull().default(sql`'{}'::jsonb`),
    source: text("source").notNull().default("self"),
    status: text("status").notNull().default("queued"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("chart_requests_user_idx").on(table.userId, table.createdAt),
    statusIdx: index("chart_requests_status_idx").on(table.status, table.createdAt)
  })
);

export const chartResults = pgTable(
  "chart_results",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    requestId: text("request_id")
      .notNull()
      .references(() => chartRequests.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    engine: text("engine").notNull(),
    status: text("status").notNull(),
    summary: text("summary"),
    chartData: jsonb("chart_data").notNull().default(sql`'{}'::jsonb`),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    requestIdx: uniqueIndex("chart_results_request_idx").on(table.requestId),
    userIdx: index("chart_results_user_idx").on(table.userId, table.createdAt)
  })
);

export const astrologyReportRequests = pgTable(
  "astrology_report_requests",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chartRequestId: text("chart_request_id").references(() => chartRequests.id, { onDelete: "set null" }),
    reportType: text("report_type").notNull(),
    subjectName: text("subject_name").notNull(),
    birthData: jsonb("birth_data").notNull(),
    question: text("question"),
    intent: text("intent"),
    context: jsonb("context").notNull().default(sql`'{}'::jsonb`),
    source: text("source").notNull().default("self"),
    boundary: text("boundary").notNull().default("private"),
    status: text("status").notNull().default("queued"),
    engine: text("engine"),
    engineVersion: text("engine_version"),
    costCredits: integer("cost_credits").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("astrology_report_requests_user_idx").on(table.userId, table.createdAt),
    chartRequestIdx: index("astrology_report_requests_chart_request_idx").on(table.chartRequestId),
    statusIdx: index("astrology_report_requests_status_idx").on(table.status, table.createdAt)
  })
);

export const astrologyReportResults = pgTable(
  "astrology_report_results",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    requestId: text("request_id")
      .notNull()
      .references(() => astrologyReportRequests.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    engine: text("engine").notNull(),
    engineVersion: text("engine_version").notNull(),
    status: text("status").notNull(),
    summary: text("summary"),
    sections: jsonb("sections").notNull().default(sql`'[]'::jsonb`),
    provenance: jsonb("provenance").notNull().default(sql`'[]'::jsonb`),
    publicSignal: jsonb("public_signal"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    requestIdx: uniqueIndex("astrology_report_results_request_idx").on(table.requestId),
    userIdx: index("astrology_report_results_user_idx").on(table.userId, table.createdAt)
  })
);

export const gifts = pgTable(
  "gifts",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    starCost: integer("star_cost").notNull().default(0),
    active: boolean("active").notNull().default(true),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    codeIdx: uniqueIndex("gifts_code_idx").on(table.code)
  })
);

export const starTransactions = pgTable(
  "star_transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    direction: text("direction").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("star_transactions_user_idx").on(table.userId, table.createdAt)
  })
);

export const sourceCards = pgTable(
  "source_cards",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    bodyTemplate: text("body_template").notNull(),
    cardType: text("card_type").notNull().default("reflection"),
    topicTags: jsonb("topic_tags").notNull().default(sql`'[]'::jsonb`),
    symbolicTags: jsonb("symbolic_tags").notNull().default(sql`'[]'::jsonb`),
    eligibilityRules: jsonb("eligibility_rules").notNull().default(sql`'{}'::jsonb`),
    safetyFlags: jsonb("safety_flags").notNull().default(sql`'[]'::jsonb`),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    slugIdx: uniqueIndex("source_cards_slug_idx").on(table.slug),
    statusIdx: index("source_cards_status_idx").on(table.status, table.updatedAt)
  })
);

export const publicStreamItems = pgTable(
  "public_stream_items",
  {
    id: text("id").primaryKey(),
    sourceCardId: text("source_card_id").references(() => sourceCards.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    audienceScope: text("audience_scope").notNull().default("all"),
    status: text("status").notNull().default("draft"),
    publishAt: timestamp("publish_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    publicFeedIdx: index("public_stream_items_feed_idx").on(table.status, table.publishAt),
    sourceCardIdx: index("public_stream_items_source_card_idx").on(table.sourceCardId)
  })
);

export const userFeedItems = pgTable(
  "user_feed_items",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceCardId: text("source_card_id").references(() => sourceCards.id, { onDelete: "set null" }),
    artifactId: text("artifact_id").references(() => artifacts.id, { onDelete: "set null" }),
    achievementId: text("achievement_id").references(() => achievements.id, { onDelete: "set null" }),
    allyId: text("ally_id").references(() => allies.id, { onDelete: "set null" }),
    giftId: text("gift_id").references(() => gifts.id, { onDelete: "set null" }),
    feedKind: text("feed_kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    displayPayload: jsonb("display_payload").notNull().default(sql`'{}'::jsonb`),
    rankScore: integer("rank_score").notNull().default(0),
    reasonCode: text("reason_code").notNull(),
    state: text("state").notNull().default("available"),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    seenAt: timestamp("seen_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    savedAt: timestamp("saved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userFeedIdx: index("user_feed_items_user_feed_idx").on(table.userId, table.state, table.availableAt),
    sourceCardIdx: index("user_feed_items_source_card_idx").on(table.sourceCardId),
    artifactIdx: index("user_feed_items_artifact_idx").on(table.artifactId)
  })
);

export const composerDecisions = pgTable(
  "composer_decisions",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userFeedItemId: text("user_feed_item_id")
      .notNull()
      .references(() => userFeedItems.id, { onDelete: "cascade" }),
    decisionVersion: text("decision_version").notNull(),
    inputContextHash: text("input_context_hash").notNull(),
    candidateIds: jsonb("candidate_ids").notNull().default(sql`'[]'::jsonb`),
    selectedCandidateId: text("selected_candidate_id").notNull(),
    rankFeatures: jsonb("rank_features").notNull().default(sql`'{}'::jsonb`),
    suppressionReasons: jsonb("suppression_reasons").notNull().default(sql`'[]'::jsonb`),
    safetyNotes: jsonb("safety_notes").notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userDecisionIdx: index("composer_decisions_user_idx").on(table.userId, table.createdAt),
    userFeedItemIdx: uniqueIndex("composer_decisions_user_feed_item_idx").on(table.userFeedItemId)
  })
);
