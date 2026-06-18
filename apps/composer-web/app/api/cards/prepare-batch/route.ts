import { db, getComposerQueueDraft, upsertComposerQueueDraft, upsertComposerQueuePublishPlan } from "@astra/db";
import { NextResponse } from "next/server";
import type { ComposerCardScope } from "../../../../lib/cardLibrary";
import { composerOperatorKeyFrom } from "../../../../lib/operatorIdentity";
import { prepareComposerQueueBatchPlan, type ComposerQueuePublishItemInput } from "../../../../lib/queuePublish";

type QueueBatchPrepareRequest = {
  targetUserId?: string;
  cards?: ComposerQueuePublishItemInput[];
  queryCacheKeys?: string[];
  scope?: ComposerCardScope;
};

const scopes = new Set<ComposerCardScope>(["all", "drafts", "course"]);

function scopeFrom(value: string | null | undefined): ComposerCardScope {
  return scopes.has(value as ComposerCardScope) ? (value as ComposerCardScope) : "all";
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()))] : [];
}

function issueItems(plan: ReturnType<typeof prepareComposerQueueBatchPlan>) {
  return plan.items.map((item) => ({
    cardId: item.cardId,
    index: item.index,
    ok: item.ok,
    feedItemId: item.write?.feedItem.id,
    writeId: item.write?.id
  }));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as QueueBatchPrepareRequest;
  const scope = scopeFrom(body.scope);
  const operatorKey = composerOperatorKeyFrom(request);
  const queryCacheKeys = stringArray(body.queryCacheKeys);
  const plan = prepareComposerQueueBatchPlan({
    cards: body.cards,
    targetUserId: body.targetUserId
  });

  if (plan.error === "TARGET_USER_REQUIRED" || plan.error === "CARDS_REQUIRED") {
    return NextResponse.json({ ok: false, error: plan.error, issues: plan.issues, plan }, { status: 400 });
  }

  let persistedPlan = null;
  try {
    const draft = await getComposerQueueDraft(db, { operatorKey, scope });
    persistedPlan = await upsertComposerQueuePublishPlan(db, {
      id: plan.planId,
      operatorKey,
      scope,
      draftId: draft?.id,
      targetUserId: body.targetUserId?.trim() ?? "",
      status: plan.ok ? "prepared" : "needs_review",
      summary: plan.summary,
      issues: plan.issues,
      items: issueItems(plan),
      selectedCardIds: (body.cards ?? []).map((card) => card.cardId?.trim() ?? "").filter(Boolean),
      queryCacheKeys
    });
    if (draft) {
      await upsertComposerQueueDraft(db, {
        operatorKey,
        scope,
        targetUserId: draft.targetUserId,
        selectedCards: draft.selectedCards,
        queueStates: draft.queueStates,
        decisionNotes: draft.decisionNotes,
        queryCacheKeys: [...new Set([...draft.queryCacheKeys, ...queryCacheKeys])],
        lastPlanId: plan.planId,
        lastPlanSummary: plan.summary
      });
    }
  } catch (error) {
    console.error("Composer queue publish plan persistence failed", error);
  }

  return NextResponse.json(
    {
      ok: plan.ok,
      error: plan.error,
      issues: plan.issues,
      plan,
      persistedPlan
    },
    { status: 200 }
  );
}
