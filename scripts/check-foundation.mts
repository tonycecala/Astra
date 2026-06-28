import { readFile } from "node:fs/promises";
import {
  chartMakerChartDataSchema,
  chartMakerRequestSchema,
  chartMakerResultSchema,
  composerDecisionSchema,
  composerPrivateFeedWriteSchema,
  composerStreamArtifactSchema,
  foundationSeedSchema,
  privateFeedRequestSchema,
  publicStreamItemSchema,
  sourceCardSchema,
  userFeedItemSchema
} from "@astra/contracts";
import { getFoundationSeed } from "@astra/testkit";

const seed = foundationSeedSchema.parse(getFoundationSeed());
if (seed.cards.length !== seed.streamItems.length) {
  throw new Error("Every seed stream item should have a matching visible card in this foundation.");
}

const now = new Date().toISOString();
chartMakerRequestSchema.parse({
  id: "chart_request_smoke",
  userId: seed.user.id,
  subjectName: "Tony C",
  birthData: {
    date: "1961-05-23",
    time: "09:30",
    timezone: "America/New_York",
    location: "New York, NY, USA",
    latitude: 40.7128,
    longitude: -74.006
  },
  question: "What should the chart maker answer?",
  intent: "foundation contract smoke",
  context: { source: "check-foundation" },
  source: "self",
  status: "queued",
  createdAt: now,
  updatedAt: now
});

chartMakerRequestSchema.parse({
  id: "chart_request_date_only_smoke",
  userId: seed.user.id,
  subjectName: "Tony C",
  birthData: {
    date: "1961-05-23"
  },
  source: "self",
  status: "queued",
  createdAt: now,
  updatedAt: now
});

chartMakerRequestSchema.parse({
  id: "chart_request_unknown_time_smoke",
  userId: seed.user.id,
  subjectName: "Tony C",
  birthData: {
    date: "1961-05-23",
    timezone: "America/New_York",
    birthTimeKnown: false
  },
  source: "self",
  status: "queued",
  createdAt: now,
  updatedAt: now
});

const partialBirthPrecision = chartMakerRequestSchema.safeParse({
  id: "chart_request_partial_precision_smoke",
  userId: seed.user.id,
  subjectName: "Tony C",
  birthData: {
    date: "1961-05-23",
    time: "09:30"
  },
  source: "self",
  status: "queued",
  createdAt: now,
  updatedAt: now
});
if (partialBirthPrecision.success) {
  throw new Error("Chart request contract must reject birth time without timezone.");
}

chartMakerRequestSchema.parse({
  id: "chart_request_timed_timezone_smoke",
  userId: seed.user.id,
  subjectName: "Tony C",
  birthData: {
    date: "1961-05-23",
    time: "09:30",
    timezone: "America/New_York"
  },
  source: "self",
  status: "queued",
  createdAt: now,
  updatedAt: now
});

chartMakerResultSchema.parse({
  id: "chart_result_smoke",
  requestId: "chart_request_smoke",
  userId: seed.user.id,
  engine: "contract-smoke",
  status: "completed",
  summary: "Chart result contract is available.",
  chartData: { sun: "capricorn" },
  createdAt: now
});

chartMakerChartDataSchema.parse({
  schemaVersion: 1,
  engine: "astra-chart-maker-local-v1",
  requestId: "chart_request_smoke",
  subjectName: "Tony C",
  precision: "timed_location",
  birthData: {
    date: "1961-05-23",
    time: "09:30",
    timezone: "America/New_York",
    location: "New York, NY, USA",
    latitude: 40.7128,
    longitude: -74.006
  },
  derived: {
    sunSign: "Gemini",
    season: "spring",
    dayOfYear: 143
  },
  interpretation: {
    headline: "Tony C carries a Gemini solar signal",
    summary: "Contract smoke chart-maker payload.",
    limits: ["This deterministic module is a contract adapter, not a full ephemeris engine."]
  },
  requestContext: {
    question: "What should the chart maker answer?",
    intent: "foundation contract smoke",
    source: "self"
  }
});

composerStreamArtifactSchema.parse({
  id: "composer_stream_smoke",
  target: "stream",
  publisher: "composer",
  rationale: {
    reason: "Astra is validating the Composer stream publishing contract.",
    source: "manual"
  },
  voiceCard: {
    voice: { id: "guide" },
    header: "A clear stream card",
    body: "This validates the first Composer-to-Astra publishing target."
  },
  card: seed.cards[0],
  streamItem: seed.streamItems[0],
  createdAt: now
});

sourceCardSchema.parse({
  id: "source_card_smoke",
  slug: "source-card-smoke",
  title: "Reusable source material",
  bodyTemplate: "Public-safe source material becomes personal only after Composer creates a user feed item.",
  cardType: "reflection",
  topicTags: ["feed"],
  symbolicTags: ["threshold"],
  eligibilityRules: { requiresAuthenticatedUser: true },
  safetyFlags: [],
  status: "active",
  createdAt: now,
  updatedAt: now
});

publicStreamItemSchema.parse({
  id: "public_stream_smoke",
  sourceCardId: "source_card_smoke",
  title: "Public fallback",
  body: "Public fallback content contains no private user context.",
  audienceScope: "anonymous",
  status: "published",
  publishAt: now,
  createdAt: now,
  updatedAt: now
});

userFeedItemSchema.parse({
  id: "user_feed_smoke",
  userId: seed.user.id,
  sourceCardId: "source_card_smoke",
  feedKind: "source_card",
  title: "Private next meaningful card",
  body: "This projection belongs to one authenticated user.",
  displayPayload: { note: "private" },
  rankScore: 10,
  reasonCode: "foundation_private_feed_smoke",
  state: "available",
  availableAt: now,
  createdAt: now,
  updatedAt: now
});

composerDecisionSchema.parse({
  id: "composer_decision_smoke",
  userId: seed.user.id,
  userFeedItemId: "user_feed_smoke",
  decisionVersion: "foundation-v1",
  inputContextHash: "hash:private-context",
  candidateIds: ["source_card_smoke"],
  selectedCandidateId: "source_card_smoke",
  rankFeatures: { timing: "now" },
  suppressionReasons: [],
  safetyNotes: ["Decision audit stays private."],
  createdAt: now
});

privateFeedRequestSchema.parse({
  userId: seed.user.id,
  state: "available",
  limit: 10
});

composerPrivateFeedWriteSchema.parse({
  id: "composer_private_feed_write_smoke",
  publisher: "composer",
  sourceCard: {
    id: "source_card_smoke",
    slug: "source-card-smoke",
    title: "Reusable source material",
    bodyTemplate: "Public-safe source material becomes personal only after Composer creates a user feed item.",
    cardType: "reflection",
    topicTags: ["feed"],
    symbolicTags: ["threshold"],
    eligibilityRules: { requiresAuthenticatedUser: true },
    safetyFlags: [],
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  feedItem: {
    id: "user_feed_smoke",
    userId: seed.user.id,
    sourceCardId: "source_card_smoke",
    feedKind: "source_card",
    title: "Private next meaningful card",
    body: "This projection belongs to one authenticated user.",
    displayPayload: { note: "private" },
    rankScore: 10,
    reasonCode: "foundation_private_feed_smoke",
    state: "available",
    availableAt: now
  },
  decision: {
    decisionVersion: "foundation-v1",
    inputContextHash: "hash:private-context",
    candidateIds: ["source_card_smoke"],
    selectedCandidateId: "source_card_smoke",
    rankFeatures: { timing: "now" },
    suppressionReasons: [],
    safetyNotes: ["Decision audit stays private."]
  },
  createdAt: now
});

const schema = await readFile("packages/db/src/schema.ts", "utf8");
for (const table of [
  "user",
  "session",
  "account",
  "verification",
  "app_user_profiles",
  "stream_items",
  "cards",
  "achievements",
  "allies",
  "artifacts",
  "chart_requests",
  "chart_results",
  "gifts",
  "star_transactions",
  "source_cards",
  "public_stream_items",
  "user_feed_items",
  "composer_decisions"
]) {
  if (!schema.includes(`"${table}"`)) throw new Error(`Missing schema table: ${table}`);
}

const runtimeFiles = ["packages/db/src/client.ts", "apps/astra-web/app/api/auth/[...all]/route.ts", "apps/astra-web/lib/auth/server.ts"];
for (const file of runtimeFiles) {
  const text = await readFile(file, "utf8");
  if (/create table|alter table|create policy|create role|grant |revoke /i.test(text)) {
    throw new Error(`${file} contains runtime DDL or grants.`);
  }
}

const repository = await readFile("packages/db/src/repositories.ts", "utf8");
const chartMaker = await readFile("packages/chart-maker/src/index.ts", "utf8");
for (const expected of [
  "seedFoundationData",
  "resetFoundationData",
  "readFoundationSnapshot",
  "createChartMakerRequest",
  "recordChartMakerResult",
  "listUserChartMakerRequests",
  "upsertSourceCard",
  "listPublicStreamItems",
  "createUserFeedItem",
  "listUserFeedItems",
  "getUserFeedItemById",
  "assertUserOwnsFeedItem",
  "createComposerDecision",
  "assertResetAllowed"
]) {
  if (!repository.includes(expected)) throw new Error(`Missing database repository helper: ${expected}`);
}
for (const expected of ["buildChartMakerChartData", "buildChartMakerRecordResult", "chartMakerChartDataSchema"]) {
  if (!chartMaker.includes(expected)) throw new Error(`Missing chart-maker module helper: ${expected}`);
}

const seedScript = await readFile("scripts/seed-db.mts", "utf8");
const resetScript = await readFile("scripts/reset-local-db.mts", "utf8");
if (!seedScript.includes("--execute")) throw new Error("Seed script must be dry-run by default and require --execute.");
if (!resetScript.includes("assertResetAllowed")) throw new Error("Local reset script must guard destructive resets.");

const chartRequestRoute = await readFile("apps/astra-web/app/api/chart-requests/route.ts", "utf8");
const chartResultRoute = await readFile("apps/astra-web/app/api/chart-results/route.ts", "utf8");
const composerIngestRoute = await readFile("apps/astra-web/app/api/composer/stream-artifacts/route.ts", "utf8");
const composerPrivateFeedRoute = await readFile("apps/astra-web/app/api/composer/private-feed-items/route.ts", "utf8");
const composerPrivateFeedService = await readFile("apps/astra-web/lib/composer-private-feed.ts", "utf8");
const journeyRoute = await readFile("apps/astra-web/app/journey/page.tsx", "utf8");
const journeyModel = await readFile("apps/astra-web/lib/journey.ts", "utf8");
const reportSignalPublishRoute = await readFile("apps/astra-web/app/api/reports/[requestId]/publish-signal/route.ts", "utf8");
const internalTokenHelper = await readFile("apps/astra-web/lib/internal-token.ts", "utf8");
const composerPublisher = await readFile("apps/composer-web/src/publishStreamArtifact.ts", "utf8");
const composerPrivateFeedPublisher = await readFile("apps/composer-web/src/publishPrivateFeedItem.ts", "utf8");
const composerOperatorWorkflow = await readFile("apps/composer-web/src/operatorWorkflow.ts", "utf8");
if (!chartRequestRoute.includes("getAstraAuthContext")) throw new Error("Chart request API must use Astra auth context.");
if (!chartResultRoute.includes("hasValidInternalApiToken")) throw new Error("Chart result API must require the internal token helper.");
if (!journeyRoute.includes("getAstraAuthContext") || !journeyRoute.includes("getJourneyViewModel")) {
  throw new Error("/journey must read through the authenticated private journey view model.");
}
if (!journeyModel.includes("listUserFeedItems") || !journeyModel.includes("public_fallback")) {
  throw new Error("Journey view model must split authenticated private feed reads from public fallback content.");
}
if (journeyModel.includes("private_projection_from_public_source") || journeyModel.includes("seedPrivateFeedFromPublicFallback")) {
  throw new Error("Signed-in first-run Journey must wait for Composer onboarding cards instead of copying public fallback cards.");
}
if (
  !reportSignalPublishRoute.includes("composerPrivateFeedWriteSchema") ||
  !reportSignalPublishRoute.includes("persistComposerPrivateFeedWrite") ||
  reportSignalPublishRoute.includes("upsertComposerStreamArtifact")
) {
  throw new Error("Report signal publishing must use the Composer private-feed contract, not the global stream reader.");
}
if (!composerPrivateFeedRoute.includes("composerPrivateFeedWriteSchema") || !composerPrivateFeedRoute.includes("hasValidInternalApiToken")) {
  throw new Error("Composer private-feed API must validate the shared write contract behind the internal token.");
}
if (!composerPrivateFeedService.includes("upsertSourceCard") || !composerPrivateFeedService.includes("createComposerDecision")) {
  throw new Error("Composer private-feed service must persist source cards, private feed items, and decision traces.");
}
if (!internalTokenHelper.includes("x-astra-internal-token")) throw new Error("Internal token helper must check the shared internal token header.");
if (!composerIngestRoute.includes("composerStreamArtifactSchema")) {
  throw new Error("Composer stream ingest API must validate the shared stream artifact contract.");
}
if (!composerIngestRoute.includes("upsertComposerStreamArtifact")) {
  throw new Error("Composer stream ingest API must persist through the Astra database repository.");
}
if (!composerPublisher.includes("composerStreamArtifactSchema")) {
  throw new Error("Composer stream publisher must validate the shared stream artifact contract.");
}
if (!composerPrivateFeedPublisher.includes("composerPrivateFeedWriteSchema")) {
  throw new Error("Composer private-feed publisher must validate the shared private feed write contract.");
}
if (
  !composerOperatorWorkflow.includes("previewComposerOperatorDraft") ||
  !composerOperatorWorkflow.includes("prepareComposerOperatorPrivateFeedWrite") ||
  !composerOperatorWorkflow.includes("targetUserRequired")
) {
  throw new Error("Composer operator workflow must preview source-card drafts before emitting target-user private feed writes.");
}

console.log("Foundation contracts, seed data, schema, and runtime DDL checks passed.");
