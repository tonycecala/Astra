import { eq } from "drizzle-orm";
import {
  closeDatabaseConnection,
  composerQueueDrafts,
  composerQueuePublishPlans,
  db,
  deleteComposerLibraryCollection,
  getComposerLibraryCollection,
  getComposerQueuePublishPlan
} from "@astra/db";

type JsonObject = Record<string, unknown>;

const composerBaseUrl = clean(process.env.COMPOSER_APP_SMOKE_BASE_URL) || "http://localhost:3012";
const publishPlanIds: string[] = [];
const collectionIds = ["operator_approved_pool"];

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

try {
  const status = await requestJson(`${composerBaseUrl}/api/status`);
  if (!status.ok) {
    throw new Error(`Composer status route failed with ${status.status}: ${JSON.stringify(status.payload)}`);
  }

  const query = await requestJson(`${composerBaseUrl}/api/cards/query?pageSize=2`);
  const cardIds = ((query.payload as { result?: { cards?: Array<{ id?: string }> } }).result?.cards ?? [])
    .map((card) => card.id)
    .filter((id): id is string => Boolean(id))
    .slice(0, 2);
  if (cardIds.length < 2) {
    throw new Error("Composer card queue smoke expected at least two queryable cards.");
  }
  const cacheKey = (query.payload as { result?: { pageState?: { cacheKey?: string } } }).result?.pageState?.cacheKey ?? "";
  const cacheMode = (query.payload as { cache?: { mode?: string } }).cache?.mode ?? "";
  if (!cacheKey || cacheMode !== "edge-ready") {
    throw new Error(`Expected Composer query route to return an edge-ready cache key, received ${JSON.stringify(query.payload)}`);
  }

  const [cardId, secondCardId] = cardIds;

  const notApproved = await publishQueueCard({ cardId, queueState: "reviewing" });
  if (notApproved.status !== 400 || notApproved.payload.error !== "BATCH_PARTIAL_VALIDATION_FAILED") {
    throw new Error(`Expected BATCH_PARTIAL_VALIDATION_FAILED for unapproved card, received ${notApproved.status}: ${JSON.stringify(notApproved.payload)}`);
  }

  const partialPrepare = await prepareQueueBatch({
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
    cards: cardIds.map((id) => ({ cardId: id, queueState: "approved" }))
  });
  const readyPlan = readyPrepare.payload.plan as JsonObject | undefined;
  const readySummary = readyPlan?.summary as JsonObject | undefined;
  const collectionId = String(readySummary?.collectionId ?? "");
  if (!readyPrepare.ok || typeof readyPlan?.planId !== "string" || collectionId !== "operator_approved_pool" || readySummary?.publishable !== cardIds.length) {
    throw new Error(`Expected ready prepare plan for both cards, received ${readyPrepare.status}: ${JSON.stringify(readyPrepare.payload)}`);
  }
  publishPlanIds.push(readyPlan.planId);

  const persistedReadyPlan = await getComposerQueuePublishPlan(db, readyPlan.planId);
  if (!persistedReadyPlan || persistedReadyPlan.targetUserId !== collectionId || persistedReadyPlan.selectedCardIds.length !== cardIds.length || persistedReadyPlan.items.length !== cardIds.length) {
    throw new Error(`Expected ready prepare plan to persist selected pool items, received ${JSON.stringify(persistedReadyPlan)}`);
  }

  const loadedReadyPlan = await loadPublishPlan(readyPlan.planId);
  const loadedReadyPlanBody = loadedReadyPlan.payload.plan as JsonObject | undefined;
  const loadedReadySummary = loadedReadyPlanBody?.summary as JsonObject | undefined;
  if (!loadedReadyPlan.ok || loadedReadyPlanBody?.id !== readyPlan.planId || loadedReadySummary?.publishable !== cardIds.length) {
    throw new Error(`Expected publish-plan API to load ready plan, received ${loadedReadyPlan.status}: ${JSON.stringify(loadedReadyPlan.payload)}`);
  }

  const draft = await saveQueueDraft({
    scope: "all",
    selectedCards: Object.fromEntries(cardIds.map((id) => [id, { id, status: "draft" }])),
    queueStates: Object.fromEntries(cardIds.map((id) => [id, "approved"])),
    decisionNotes: { [cardId]: "Saved by Composer queue API smoke." },
    lastPlanId: readyPlan.planId,
    lastPlanSummary: readySummary
  });
  const savedDraft = draft.payload.draft as JsonObject | undefined;
  const savedSelectedCards = savedDraft?.selectedCards as JsonObject | undefined;
  if (!draft.ok || savedDraft?.id !== "composer_queue_draft:local-operator:all" || Object.keys(savedSelectedCards ?? {}).length !== cardIds.length || savedDraft.targetUserId) {
    throw new Error(`Expected Composer queue draft save to persist selected cards without a target user, received ${draft.status}: ${JSON.stringify(draft.payload)}`);
  }

  const loadedDraft = await loadQueueDraft();
  const loaded = loadedDraft.payload.draft as JsonObject | undefined;
  if (!loadedDraft.ok || loaded?.lastPlanId !== readyPlan.planId || loaded?.targetUserId) {
    throw new Error(`Expected Composer queue draft load to return saved pool draft, received ${loadedDraft.status}: ${JSON.stringify(loadedDraft.payload)}`);
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

  const published = await publishQueueCard({
    cardId,
    queueState: "approved",
    decisionNotes: "Queue API smoke single-card pool publish."
  });
  if (!published.ok) {
    throw new Error(`Queue single-card pool publish failed with ${published.status}: ${JSON.stringify(published.payload)}`);
  }
  const singleCollection = published.payload.collection as JsonObject | undefined;
  if (singleCollection?.id !== "operator_approved_pool" || singleCollection.totalCards !== 1) {
    throw new Error(`Expected single-card publish to create operator_approved_pool, received ${JSON.stringify(published.payload)}`);
  }

  const invalidBatch = await publishQueueBatch({
    cards: [
      { cardId, queueState: "reviewing" },
      { cardId: secondCardId, queueState: "reviewing" }
    ]
  });
  if (invalidBatch.status !== 400 || invalidBatch.payload.error !== "BATCH_PARTIAL_VALIDATION_FAILED") {
    throw new Error(`Expected invalid pool batch to fail validation, received ${invalidBatch.status}: ${JSON.stringify(invalidBatch.payload)}`);
  }

  const batch = await publishQueueBatch({
    cards: cardIds.map((id, index) => ({
      cardId: id,
      queueState: "approved",
      decisionNotes: `Queue batch smoke card ${index + 1}.`
    }))
  });
  if (!batch.ok) {
    throw new Error(`Queue batch pool publish failed with ${batch.status}: ${JSON.stringify(batch.payload)}`);
  }
  const batchCollection = batch.payload.collection as JsonObject | undefined;
  if (batchCollection?.id !== "operator_approved_pool" || batchCollection.totalCards !== cardIds.length) {
    throw new Error(`Expected ${cardIds.length} pool cards, received ${JSON.stringify(batch.payload)}`);
  }

  const savedCollection = await getComposerLibraryCollection(db, "operator_approved_pool");
  if (!savedCollection || savedCollection.cards.length !== cardIds.length || savedCollection.kind !== "pool") {
    throw new Error(`Expected persisted operator_approved_pool with ${cardIds.length} cards, received ${JSON.stringify(savedCollection)}`);
  }
} finally {
  await db.delete(composerQueueDrafts).where(eq(composerQueueDrafts.id, "composer_queue_draft:local-operator:all"));
  for (const planId of publishPlanIds) {
    await db.delete(composerQueuePublishPlans).where(eq(composerQueuePublishPlans.id, planId));
  }
  for (const collectionId of collectionIds) {
    await deleteComposerLibraryCollection(db, collectionId);
  }
  await closeDatabaseConnection();
}

console.log("Composer card queue API smoke passed: pool availability publish.");
