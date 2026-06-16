import { eq } from "drizzle-orm";
import { publishComposerPrivateFeedItem } from "../apps/composer-web/src/index";
import {
  closeDatabaseConnection,
  db,
  getUserFeedItemById,
  listUserFeedItems,
  sourceCards,
  user,
  userFeedItems
} from "@astra/db";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
const runId = `composer_private_feed_${Date.now()}`;
const userA = `${runId}_user_a`;
const userB = `${runId}_user_b`;
const sourceCardId = `${runId}_source`;
const feedItemId = `${runId}_feed_item`;
const privateTitle = `Composer private card ${runId}`;
const now = new Date().toISOString();

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

if (!internalToken) {
  throw new Error("ASTRA_INTERNAL_API_TOKEN is required for the Composer private-feed API smoke.");
}

async function requestJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}: ${text}`);
  }

  return text ? (JSON.parse(text) as JsonObject) : {};
}

async function insertUser(id: string, email: string) {
  await db.insert(user).values({
    id,
    name: id,
    email,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

try {
  await insertUser(userA, `${userA}@example.com`);
  await insertUser(userB, `${userB}@example.com`);

  const published = publishComposerPrivateFeedItem({
    id: `${runId}_write`,
    userId: userA,
    feedItemId,
    sourceCard: {
      id: sourceCardId,
      slug: sourceCardId,
      title: "Composer private source",
      bodyTemplate: "Private source-card projection for one user.",
      cardType: "reflection",
      topicTags: ["composer-private-feed"],
      symbolicTags: ["proof"],
      eligibilityRules: { requiresAuthenticatedUser: true },
      safetyFlags: [],
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    voiceCard: {
      voice: { id: "guide" },
      header: privateTitle,
      body: "This Composer-authored card belongs only to User A."
    },
    rankScore: 5_000,
    reasonCode: "composer_private_feed_api_smoke",
    decision: {
      decisionVersion: "composer-private-feed-smoke-v1",
      inputContextHash: `hash:${userA}`,
      candidateIds: [sourceCardId],
      selectedCandidateId: sourceCardId,
      rankFeatures: { explicitPermission: true },
      suppressionReasons: [],
      safetyNotes: ["No User B context was used."]
    },
    createdAt: now
  });

  if (!published.ok) throw new Error("Composer private-feed publisher rejected a valid voice card.");

  const response = await requestJson(`${appBaseUrl}/api/composer/private-feed-items`, {
    method: "POST",
    headers: {
      "x-astra-internal-token": internalToken
    },
    body: JSON.stringify(published.write)
  });

  const write = response.write as JsonObject | undefined;
  const feedItem = write?.feedItem as JsonObject | undefined;
  if (feedItem?.id !== feedItemId || feedItem.userId !== userA) {
    throw new Error("Composer private-feed API did not return the expected user-owned feed item.");
  }
  if (!write?.sourceCard || !(write.decision as JsonObject | undefined)?.id) {
    throw new Error("Composer private-feed API did not persist source card and decision trace.");
  }

  const feedA = await listUserFeedItems(db, { userId: userA, state: "available", limit: 10 });
  if (!feedA.items.some((item) => item.id === feedItemId && item.title === privateTitle)) {
    throw new Error("User A private feed did not include the Composer-authored item.");
  }

  const forgedRead = await getUserFeedItemById(db, { userId: userB, feedItemId });
  if (forgedRead) throw new Error("User B could read User A's Composer-authored item.");

  const feedB = await listUserFeedItems(db, { userId: userB, state: "available", limit: 10 });
  if (feedB.items.some((item) => item.id === feedItemId || item.title === privateTitle)) {
    throw new Error("User B private feed listed User A's Composer-authored item.");
  }

  const serializedFeed = JSON.stringify(feedA);
  if (serializedFeed.includes("decisionVersion") || serializedFeed.includes("rankFeatures")) {
    throw new Error("Private feed response leaked Composer decision internals.");
  }

  const publicJourney = await fetch(`${appBaseUrl}/journey`);
  const publicHtml = await publicJourney.text();
  if (!publicJourney.ok || publicHtml.includes(privateTitle)) {
    throw new Error("Public fallback /journey leaked the Composer-authored private item.");
  }
} finally {
  await db.delete(userFeedItems).where(eq(userFeedItems.id, feedItemId));
  await db.delete(sourceCards).where(eq(sourceCards.id, sourceCardId));
  await db.delete(user).where(eq(user.id, userA));
  await db.delete(user).where(eq(user.id, userB));
  await closeDatabaseConnection();
}

console.log(`Composer private-feed API smoke passed: ${runId}.`);
