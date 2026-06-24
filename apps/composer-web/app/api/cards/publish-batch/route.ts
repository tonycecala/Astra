import { NextResponse } from "next/server";
import { db, upsertComposerLibraryAvailability } from "@astra/db";
import type { ComposerCardScope } from "../../../../lib/cardLibrary";
import { buildComposerQueueAvailability, prepareComposerQueueBatchPlan, type ComposerQueuePublishItemInput } from "../../../../lib/queuePublish";

type QueueBatchPublishRequest = {
  cards?: ComposerQueuePublishItemInput[];
  scope?: ComposerCardScope;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as QueueBatchPublishRequest;
  const createdAt = new Date().toISOString();
  const plan = prepareComposerQueueBatchPlan({
    cards: body.cards,
    createdAt,
    scope: body.scope
  });

  if (plan.error === "CARDS_REQUIRED") {
    return NextResponse.json({ ok: false, error: plan.error, issues: plan.issues, plan }, { status: 400 });
  }

  if (!plan.summary.publishable) {
    return NextResponse.json({ ok: false, error: plan.error ?? "BATCH_PARTIAL_VALIDATION_FAILED", issues: plan.issues, plan }, { status: 400 });
  }

  try {
    const availability = buildComposerQueueAvailability(plan, createdAt);
    const collection = await upsertComposerLibraryAvailability(db, availability, {
      source: "composer-queue",
      metadata: {
        route: "/api/cards/publish-batch",
        planId: plan.planId,
        scope: body.scope ?? "all"
      }
    });
    const ok = plan.issues.length === 0;
    return NextResponse.json(
      {
        ok,
        collection,
        availability: { request: availability.request, collection },
        issues: plan.issues,
        plan,
        results: plan.items.map((item) => ({ cardId: item.cardId, ok: item.ok })),
        error: ok ? undefined : "BATCH_PARTIAL_VALIDATION_FAILED"
      },
      { status: ok ? 201 : 207 }
    );
  } catch (error) {
    console.error("Composer queue availability publish failed", error);
    return NextResponse.json({ ok: false, error: "QUEUE_AVAILABILITY_PUBLISH_FAILED", issues: plan.issues, plan }, { status: 503 });
  }
}
