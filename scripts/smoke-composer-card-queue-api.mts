import { eq } from "drizzle-orm";
import {
  closeDatabaseConnection,
  composerCardQueryCaches,
  composerDecisions,
  composerQueueDrafts,
  composerQueuePublishPlans,
  db,
  getComposerCardQueryCache,
  getComposerQueuePublishPlan,
  getUserFeedItemById,
  listUserFeedItems,
  sourceCards,
  user,
  userFeedItems
} from "@astra/db";

type JsonObject = Record<string, unknown>;

const composerBaseUrl = clean(process.env.COMPOSER_APP_SMOKE_BASE_URL) || "http://localhost:3012";
const runId = `composer_card_queue_${Date.now()}`;
const userA = `${runId}_user_a`;
const userB = `${runId}_user_b`;
const cardIds: string[] = [];
const publishPlanIds: string[] = [];
let queryCacheKey = "";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

async function requestJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as JsonObject) : {};
  return { ok: response.ok, status: response.status, payload };
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

async function publishQueueCard(body: JsonObject) {
  return requestJson(`${composerBaseUrl}/api/cards/publish`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function publishQueueBatch(body: JsonObject) {
  return requestJson(`${composerBaseUrl}/api/cards/publish-batch`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function prepareQueueBatch(body: JsonObject) {
  return requestJson(`${composerBaseUrl}/api/cards/prepare-batch`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function saveQueueDraft(body: JsonObject) {
  return requestJson(`${composerBaseUrl}/api/cards/queue-draft`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

async function loadQueueDraft(scope = "all") {
  return requestJson(`${composerBaseUrl}/api/cards/queue-draft?scope=${scope}`);
}

async function deleteQueueDraft(scope = "all") {
  return requestJson(`${composerBaseUrl}/api/cards/queue-draft?scope=${scope}`, {
    method: "DELETE"
  });
}

async function loadPublishPlan(planId: string) {
  return requestJson(`${composerBaseUrl}/api/cards/publish-plan?planId=${encodeURIComponent(planId)}`);
}

async function deletePublishPlan(planId: string) {
  return requestJson(`${composerBaseUrl}/api/cards/publish-plan?planId=${encodeURIComponent(planId)}`, {
    method: "DELETE"
  });
}

function feedItemId(cardId: string) {
  return `composer_queue_feed:${cardId}:${userA}`;
}

function sourceCardId(cardId: string) {
  return `source_card:${cardId}`;
}

try {
  const status = await requestJson(`${composerBaseUrl}/api/status`);
  if (!status.ok) {
    throw new Error(`Composer status route failed with ${status.status}: ${JSON.stringify(status.payload)}`);
  }
  if ((status.payload as { hasInternalToken?: boolean }).hasInternalToken !== true) {
    throw new Error("Composer card queue smoke requires Composer to run with ASTRA_INTERNAL_API_TOKEN.");
  }

  await insertUser(userA, `${userA}@example.com`);
  await insertUser(userB, `${userB}@example.com`);

  const query = await requestJson(`${composerBaseUrl}/api/cards/query?pageSize=2`);
  const cards = ((query.payload as { result?: { cards?: Array<{ id?: string }> } }).result?.cards ?? []).map((card) => card.id).filter((id): id is string => Boolean(id));
  if (cards.length < 2) {
    throw new Error("Composer card queue smoke expected at least two queryable cards.");
  }
  queryCacheKey = (query.payload as { result?: { pageState?: { cacheKey?: string } } }).result?.pageState?.cacheKey ?? "";
  const cachedQuery = queryCacheKey ? await getComposerCardQueryCache(db, queryCacheKey) : null;
  if (!cachedQuery || cachedQuery.cardIds.length < 2 || cachedQuery.pageSize !== 12) {
    throw new Error(`Expected Composer query route to persist a query cache row, received ${JSON.stringify(cachedQuery)}`);
  }
  cardIds.push(...cards.slice(0, 2));

  const [cardId, secondCardId] = cardIds;

  const notApproved = await publishQueueCard({ cardId, queueState: "reviewing", targetUserId: userA });
  if (notApproved.status !== 400 || notApproved.payload.error !== "CARD_NOT_APPROVED") {
    throw new Error(`Expected CARD_NOT_APPROVED, received ${notApproved.status}: ${JSON.stringify(notApproved.payload)}`);
  }

  const missingTarget = await publishQueueCard({ cardId, queueState: "approved" });
  if (missingTarget.status !== 400 || missingTarget.payload.error !== "TARGET_USER_REQUIRED") {
    throw new Error(`Expected TARGET_USER_REQUIRED, received ${missingTarget.status}: ${JSON.stringify(missingTarget.payload)}`);
  }

  const missingPrepareTarget = await prepareQueueBatch({
    cards: [{ cardId, queueState: "approved" }]
  });
  if (missingPrepareTarget.status !== 400 || missingPrepareTarget.payload.error !== "TARGET_USER_REQUIRED") {
    throw new Error(`Expected prepare TARGET_USER_REQUIRED, received ${missingPrepareTarget.status}: ${JSON.stringify(missingPrepareTarget.payload)}`);
  }

  const partialPrepare = await prepareQueueBatch({
    targetUserId: userA,
    cards: [
      { cardId, queueState: "approved" },
      { cardId: secondCardId, queueState: "reviewing" }
    ]
  });
  const partialPlan = partialPrepare.payload.plan as JsonObject | undefined;
  const partialSummary = partialPlan?.summary as JsonObject | undefined;
  if (typeof partialPlan?.planId === "string") publishPlanIds.push(partialPlan.planId);
  if (!partialPrepare.ok || partialPrepare.payload.error !== "BATCH_PARTIAL_VALIDATION_FAILED" || partialSummary?.publishable !== 1 || partialSummary.needsReview !== 1) {
    throw new Error(`Expected partial prepare plan with 1 publishable and 1 needing review, received ${partialPrepare.status}: ${JSON.stringify(partialPrepare.payload)}`);
  }

  const readyPrepare = await prepareQueueBatch({
    targetUserId: userA,
    cards: cardIds.map((id) => ({ cardId: id, queueState: "approved" }))
  });
  const readyPlan = readyPrepare.payload.plan as JsonObject | undefined;
  const readySummary = readyPlan?.summary as JsonObject | undefined;
  if (!readyPrepare.ok || typeof readyPlan?.planId !== "string" || !String(readyPlan.planId).startsWith("composer_queue_plan:") || readySummary?.publishable !== cardIds.length) {
    throw new Error(`Expected ready prepare plan for both cards, received ${readyPrepare.status}: ${JSON.stringify(readyPrepare.payload)}`);
  }
  publishPlanIds.push(readyPlan.planId);

  const persistedReadyPlan = await getComposerQueuePublishPlan(db, readyPlan.planId);
  if (!persistedReadyPlan || persistedReadyPlan.targetUserId !== userA || persistedReadyPlan.selectedCardIds.length !== cardIds.length || persistedReadyPlan.items.length !== cardIds.length) {
    throw new Error(`Expected ready prepare plan to persist durable selected items, received ${JSON.stringify(persistedReadyPlan)}`);
  }

  const loadedReadyPlan = await loadPublishPlan(readyPlan.planId);
  const loadedReadyPlanBody = loadedReadyPlan.payload.plan as JsonObject | undefined;
  const loadedReadySummary = loadedReadyPlanBody?.summary as JsonObject | undefined;
  if (!loadedReadyPlan.ok || loadedReadyPlanBody?.id !== readyPlan.planId || loadedReadySummary?.publishable !== cardIds.length) {
    throw new Error(`Expected publish-plan API to load ready plan, received ${loadedReadyPlan.status}: ${JSON.stringify(loadedReadyPlan.payload)}`);
  }

  const draft = await saveQueueDraft({
    scope: "all",
    targetUserId: userA,
    selectedCards: Object.fromEntries(cardIds.map((id) => [id, { id, status: "draft" }])),
    queueStates: Object.fromEntries(cardIds.map((id) => [id, "approved"])),
    decisionNotes: { [cardId]: "Saved by Composer queue API smoke." },
    queryCacheKeys: [queryCacheKey],
    lastPlanId: readyPlan.planId,
    lastPlanSummary: readySummary
  });
  const savedDraft = draft.payload.draft as JsonObject | undefined;
  const savedSelectedCards = savedDraft?.selectedCards as JsonObject | undefined;
  if (!draft.ok || savedDraft?.id !== "composer_queue_draft:local-operator:all" || Object.keys(savedSelectedCards ?? {}).length !== cardIds.length) {
    throw new Error(`Expected Composer queue draft save to persist selected cards, received ${draft.status}: ${JSON.stringify(draft.payload)}`);
  }

  const loadedDraft = await loadQueueDraft();
  const loaded = loadedDraft.payload.draft as JsonObject | undefined;
  if (!loadedDraft.ok || loaded?.lastPlanId !== readyPlan.planId || loaded?.targetUserId !== userA) {
    throw new Error(`Expected Composer queue draft load to return saved draft, received ${loadedDraft.status}: ${JSON.stringify(loadedDraft.payload)}`);
  }

  const deletedDraft = await deleteQueueDraft();
  if (!deletedDraft.ok) {
    throw new Error(`Expected Composer queue draft delete to succeed, received ${deletedDraft.status}: ${JSON.stringify(deletedDraft.payload)}`);
  }

  const deletedPlan = await deletePublishPlan(readyPlan.planId);
  if (!deletedPlan.ok) {
    throw new Error(`Expected Composer publish plan delete to succeed, received ${deletedPlan.status}: ${JSON.stringify(deletedPlan.payload)}`);
  }
  publishPlanIds.splice(publishPlanIds.indexOf(readyPlan.planId), 1);

  const emptyDraft = await loadQueueDraft();
  if (!emptyDraft.ok || emptyDraft.payload.draft !== null) {
    throw new Error(`Expected Composer queue draft to be empty after delete, received ${emptyDraft.status}: ${JSON.stringify(emptyDraft.payload)}`);
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const published = await publishQueueCard({
      cardId,
      queueState: "approved",
      targetUserId: userA,
      decisionNotes: `Queue API smoke attempt ${attempt + 1}.`
    });

    if (!published.ok) {
      throw new Error(`Queue publish failed with ${published.status}: ${JSON.stringify(published.payload)}`);
    }

    const write = published.payload.write as JsonObject | undefined;
    const feedItem = write?.feedItem as JsonObject | undefined;
    if (feedItem?.id !== feedItemId(cardId) || feedItem.userId !== userA) {
      throw new Error("Queue publish did not return the expected deterministic user-owned feed item.");
    }
  }

  const invalidBatch = await publishQueueBatch({
    targetUserId: userA,
    cards: [
      { cardId, queueState: "reviewing" },
      { cardId: secondCardId, queueState: "reviewing" }
    ]
  });
  if (invalidBatch.status !== 400 || invalidBatch.payload.error !== "BATCH_PARTIAL_VALIDATION_FAILED") {
    throw new Error(`Expected BATCH_PARTIAL_VALIDATION_FAILED, received ${invalidBatch.status}: ${JSON.stringify(invalidBatch.payload)}`);
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const batch = await publishQueueBatch({
      targetUserId: userA,
      cards: cardIds.map((id, index) => ({
        cardId: id,
        queueState: "approved",
        decisionNotes: `Queue batch smoke card ${index + 1}, attempt ${attempt + 1}.`
      }))
    });
    if (!batch.ok) {
      throw new Error(`Queue batch publish failed with ${batch.status}: ${JSON.stringify(batch.payload)}`);
    }
    const writes = (batch.payload.writes as JsonObject[] | undefined) ?? [];
    if (writes.length !== cardIds.length) {
      throw new Error(`Expected ${cardIds.length} batch writes, received ${writes.length}.`);
    }
  }

  const feedA = await listUserFeedItems(db, { userId: userA, state: "available", limit: 20 });
  for (const id of cardIds) {
    if (!feedA.items.some((item) => item.id === feedItemId(id))) {
      throw new Error(`User A private feed did not include queue-published item ${id}.`);
    }
  }

  for (const id of cardIds) {
    const forgedRead = await getUserFeedItemById(db, { userId: userB, feedItemId: feedItemId(id) });
    if (forgedRead) {
      throw new Error(`User B could read User A's queue-published feed item ${id}.`);
    }
  }

  const feedB = await listUserFeedItems(db, { userId: userB, state: "available", limit: 20 });
  if (feedB.items.some((item) => cardIds.some((id) => item.id === feedItemId(id)))) {
    throw new Error("User B feed listed User A's queue-published item.");
  }
} finally {
  for (const id of cardIds) {
    await db.delete(composerDecisions).where(eq(composerDecisions.userFeedItemId, feedItemId(id)));
    await db.delete(userFeedItems).where(eq(userFeedItems.id, feedItemId(id)));
    await db.delete(sourceCards).where(eq(sourceCards.id, sourceCardId(id)));
  }
  if (queryCacheKey) await db.delete(composerCardQueryCaches).where(eq(composerCardQueryCaches.cacheKey, queryCacheKey));
  await db.delete(composerQueueDrafts).where(eq(composerQueueDrafts.id, "composer_queue_draft:local-operator:all"));
  for (const planId of publishPlanIds) {
    await db.delete(composerQueuePublishPlans).where(eq(composerQueuePublishPlans.id, planId));
  }
  await db.delete(user).where(eq(user.id, userA));
  await db.delete(user).where(eq(user.id, userB));
  await closeDatabaseConnection();
}

console.log(`Composer card queue API smoke passed: ${runId}.`);
