import { NextResponse } from "next/server";
import { db, upsertComposerLibraryAvailability } from "@astra/db";
import type { ComposerCardScope } from "../../../../lib/cardLibrary";
import { buildComposerQueueAvailability, prepareComposerQueueBatchPlan } from "../../../../lib/queuePublish";

type QueuePublishRequest = {
  cardId?: string;
  scope?: ComposerCardScope;
  queueState?: "reviewing" | "approved" | "held";
  decisionNotes?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as QueuePublishRequest;
  const createdAt = new Date().toISOString();
  const plan = prepareComposerQueueBatchPlan({
    cards: [{ cardId: body.cardId, queueState: body.queueState, decisionNotes: body.decisionNotes }],
    createdAt,
    scope: body.scope
  });

  if (!plan.ok) {
    return NextResponse.json({ ok: false, error: plan.error ?? "CARD_NOT_APPROVED", issues: plan.issues, plan }, { status: 400 });
  }

  try {
    const availability = buildComposerQueueAvailability(plan, createdAt);
    const collection = await upsertComposerLibraryAvailability(db, availability, {
      source: "composer-queue",
      metadata: {
        route: "/api/cards/publish",
        planId: plan.planId,
        scope: body.scope ?? "all"
      }
    });
    return NextResponse.json({ ok: true, collection, availability: { request: availability.request, collection }, plan }, { status: 201 });
  } catch (error) {
    console.error("Composer queue card availability publish failed", error);
    return NextResponse.json({ ok: false, error: "QUEUE_AVAILABILITY_PUBLISH_FAILED", issues: plan.issues, plan }, { status: 503 });
  }
}
