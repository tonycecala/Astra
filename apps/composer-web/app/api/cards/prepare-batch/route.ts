import { db, getComposerQueueDraft, upsertComposerQueueDraft, upsertComposerQueuePublishPlan } from "@astra/db";
import { NextResponse } from "next/server";
import type { ComposerCardScope } from "../../../../lib/cardLibrary";
import { composerOperatorKeyFrom } from "../../../../lib/operatorIdentity";
import { prepareComposerQueueBatchPlan, type ComposerQueuePublishItemInput } from "../../../../lib/queuePublish";

type QueueBatchPrepareRequest = {
  cards?: ComposerQueuePublishItemInput[];
  scope?: ComposerCardScope;
};

const scopes = new Set<ComposerCardScope>(["all", "drafts", "course"]);

function scopeFrom(value: string | null | undefined): ComposerCardScope {
  return scopes.has(value as ComposerCardScope) ? (value as ComposerCardScope) : "all";
}

function issueItems(plan: ReturnType<typeof prepareComposerQueueBatchPlan>) {
  return plan.items.map((item) => ({
    cardId: item.cardId,
    index: item.index,
    ok: item.ok
  }));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as QueueBatchPrepareRequest;
  const scope = scopeFrom(body.scope);
  const operatorKey = composerOperatorKeyFrom(request);
  const plan = prepareComposerQueueBatchPlan({
    cards: body.cards,
    scope
  });

  if (plan.error === "CARDS_REQUIRED") {
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
      targetUserId: plan.summary.collectionId,
      status: plan.ok ? "prepared" : "needs_review",
      summary: plan.summary,
      issues: plan.issues,
      items: issueItems(plan),
      selectedCardIds: (body.cards ?? []).map((card) => card.cardId?.trim() ?? "").filter(Boolean)
    });
    if (draft) {
      await upsertComposerQueueDraft(db, {
        operatorKey,
        scope,
        selectedCards: draft.selectedCards,
        queueStates: draft.queueStates,
        decisionNotes: draft.decisionNotes,
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
