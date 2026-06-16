import { eq } from "drizzle-orm";
import {
  privateFeedResponseSchema,
  publicStreamItemSchema,
  sourceCardSchema,
  userFeedItemSchema
} from "@astra/contracts";
import {
  assertUserOwnsFeedItem,
  closeDatabaseConnection,
  createComposerDecision,
  createUserFeedItem,
  db,
  getUserFeedItemById,
  listPublicStreamItems,
  listUserFeedItems,
  publicStreamItems,
  sourceCards,
  upsertSourceCard,
  user
} from "@astra/db";

const runId = `private_feed_smoke_${Date.now()}`;
const now = new Date().toISOString();
const userA = `${runId}_user_a`;
const userB = `${runId}_user_b`;
const sourceCardId = `${runId}_source_card`;
const publicItemId = `${runId}_public_item`;

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

  const sourceCard = await upsertSourceCard(
    db,
    sourceCardSchema.parse({
      id: sourceCardId,
      slug: sourceCardId,
      title: "A source card is not the feed",
      bodyTemplate: "A reusable card becomes meaningful only after user-scoped projection.",
      cardType: "reflection",
      topicTags: ["private-feed"],
      symbolicTags: ["threshold"],
      eligibilityRules: { requiresAuthenticatedUser: true },
      safetyFlags: [],
      status: "active",
      createdAt: now,
      updatedAt: now
    })
  );

  await db.insert(publicStreamItems).values({
    id: publicItemId,
    sourceCardId: sourceCard.id,
    title: "Public fallback card",
    body: "This public fallback has no user owner and no private payload.",
    audienceScope: "anonymous",
    status: "published",
    publishAt: new Date(now),
    createdAt: new Date(now),
    updatedAt: new Date(now)
  });

  const itemA = await createUserFeedItem(db, {
    userId: userA,
    sourceCardId: sourceCard.id,
    feedKind: "source_card",
    title: "User A next meaningful card",
    body: "This feed projection belongs only to User A.",
    displayPayload: { personalization: "user-a-only" },
    rankScore: 90,
    reasonCode: "private_feed_smoke_user_a",
    state: "available",
    availableAt: now
  });
  userFeedItemSchema.parse(itemA);

  const itemB = await createUserFeedItem(db, {
    userId: userB,
    sourceCardId: sourceCard.id,
    feedKind: "source_card",
    title: "User B next meaningful card",
    body: "This feed projection belongs only to User B.",
    displayPayload: { personalization: "user-b-only" },
    rankScore: 80,
    reasonCode: "private_feed_smoke_user_b",
    state: "available",
    availableAt: now
  });

  const feedA = await listUserFeedItems(db, { userId: userA, state: "available", limit: 10 });
  privateFeedResponseSchema.parse(feedA);
  if (!feedA.items.some((item) => item.id === itemA.id)) {
    throw new Error("User A private feed did not include User A's feed item.");
  }
  if (feedA.items.some((item) => item.id === itemB.id || item.userId !== userA)) {
    throw new Error("User A private feed leaked another user's feed item.");
  }

  const forgedRead = await getUserFeedItemById(db, { userId: userA, feedItemId: itemB.id });
  if (forgedRead) throw new Error("Forged private feed item lookup returned another user's item.");

  let ownershipRejected = false;
  try {
    await assertUserOwnsFeedItem(db, { userId: userA, feedItemId: itemB.id });
  } catch {
    ownershipRejected = true;
  }
  if (!ownershipRejected) throw new Error("assertUserOwnsFeedItem must reject another user's feed item.");

  const decision = await createComposerDecision(db, {
    userId: userA,
    userFeedItemId: itemA.id,
    decisionVersion: "private-feed-smoke-v1",
    inputContextHash: "hash:user-a-context",
    candidateIds: [sourceCard.id],
    selectedCandidateId: sourceCard.id,
    rankFeatures: { savedArtifacts: 1 },
    suppressionReasons: [],
    safetyNotes: ["No cross-user context used."]
  });
  if (decision.userId !== userA || decision.userFeedItemId !== itemA.id) {
    throw new Error("Composer decision did not preserve user/feed ownership.");
  }

  let mismatchedDecisionRejected = false;
  try {
    await createComposerDecision(db, {
      userId: userA,
      userFeedItemId: itemB.id,
      decisionVersion: "private-feed-smoke-v1",
      inputContextHash: "hash:mismatch",
      candidateIds: [sourceCard.id],
      selectedCandidateId: sourceCard.id,
      rankFeatures: {},
      suppressionReasons: ["mismatched-user"],
      safetyNotes: []
    });
  } catch {
    mismatchedDecisionRejected = true;
  }
  if (!mismatchedDecisionRejected) {
    throw new Error("Composer decisions must not attach to another user's feed item.");
  }

  const publicItems = await listPublicStreamItems(db);
  const publicItem = publicItems.find((item) => item.id === publicItemId);
  if (!publicItem) throw new Error("Public fallback item was not listed.");
  publicStreamItemSchema.parse(publicItem);
  const serializedPublic = JSON.stringify(publicItem);
  if (serializedPublic.includes(userA) || serializedPublic.includes(userB) || serializedPublic.includes("personalization")) {
    throw new Error("Public fallback item leaked private user data.");
  }

  const serializedFeed = JSON.stringify(privateFeedResponseSchema.parse(feedA));
  if (serializedFeed.includes("decisionVersion") || serializedFeed.includes("rankFeatures")) {
    throw new Error("Private feed response leaked raw Composer decision internals.");
  }
} finally {
  await db.delete(publicStreamItems).where(eq(publicStreamItems.id, publicItemId));
  await db.delete(sourceCards).where(eq(sourceCards.id, sourceCardId));
  await db.delete(user).where(eq(user.id, userA));
  await db.delete(user).where(eq(user.id, userB));
  await closeDatabaseConnection();
}

console.log(`Private feed privacy smoke passed: ${runId}.`);
