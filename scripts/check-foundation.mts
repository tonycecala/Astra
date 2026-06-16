import { readFile } from "node:fs/promises";
import { chartMakerRequestSchema, chartMakerResultSchema, composerStreamArtifactSchema, foundationSeedSchema } from "@astra/contracts";
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
  throw new Error("Chart request contract must reject partial birth time precision without timezone and location.");
}

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

composerStreamArtifactSchema.parse({
  id: "composer_stream_smoke",
  target: "stream",
  publisher: "composer",
  voiceCard: {
    voice: { id: "guide" },
    header: "A clear stream card",
    body: "This validates the first Composer-to-Astra publishing target."
  },
  card: seed.cards[0],
  streamItem: seed.streamItems[0],
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
  "star_transactions"
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
for (const expected of [
  "seedFoundationData",
  "resetFoundationData",
  "readFoundationSnapshot",
  "createChartMakerRequest",
  "recordChartMakerResult",
  "listUserChartMakerRequests",
  "assertResetAllowed"
]) {
  if (!repository.includes(expected)) throw new Error(`Missing database repository helper: ${expected}`);
}

const seedScript = await readFile("scripts/seed-db.mts", "utf8");
const resetScript = await readFile("scripts/reset-local-db.mts", "utf8");
if (!seedScript.includes("--execute")) throw new Error("Seed script must be dry-run by default and require --execute.");
if (!resetScript.includes("assertResetAllowed")) throw new Error("Local reset script must guard destructive resets.");

const chartRequestRoute = await readFile("apps/astra-web/app/api/chart-requests/route.ts", "utf8");
const chartResultRoute = await readFile("apps/astra-web/app/api/chart-results/route.ts", "utf8");
const composerPublisher = await readFile("apps/composer-web/src/publishStreamArtifact.ts", "utf8");
if (!chartRequestRoute.includes("getAstraAuthContext")) throw new Error("Chart request API must use Astra auth context.");
if (!chartResultRoute.includes("x-astra-internal-token")) throw new Error("Chart result API must require the internal token.");
if (!composerPublisher.includes("composerStreamArtifactSchema")) {
  throw new Error("Composer stream publisher must validate the shared stream artifact contract.");
}

console.log("Foundation contracts, seed data, schema, and runtime DDL checks passed.");
