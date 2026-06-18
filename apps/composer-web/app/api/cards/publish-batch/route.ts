import { NextResponse } from "next/server";
import { postToAstra } from "../../../../lib/config";
import { prepareComposerQueueBatchPlan, type ComposerQueuePublishItemInput } from "../../../../lib/queuePublish";

type QueueBatchPublishRequest = {
  targetUserId?: string;
  cards?: ComposerQueuePublishItemInput[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as QueueBatchPublishRequest;
  const createdAt = new Date().toISOString();
  const plan = prepareComposerQueueBatchPlan({
    cards: body.cards,
    createdAt,
    targetUserId: body.targetUserId
  });

  if (plan.error === "TARGET_USER_REQUIRED" || plan.error === "CARDS_REQUIRED") {
    return NextResponse.json({ ok: false, error: plan.error, issues: plan.issues, plan }, { status: 400 });
  }

  const astraResults = [];
  for (const item of plan.items) {
    if (!item.ok || !item.write) continue;
    const astra = await postToAstra("/api/composer/private-feed-items", item.write);
    astraResults.push({ cardId: item.cardId, ok: astra.ok, status: astra.status, write: item.write, astra: astra.body });
  }

  const astraFailed = astraResults.filter((result) => !result.ok);
  const ok = plan.issues.length === 0 && astraFailed.length === 0;
  return NextResponse.json(
    {
      ok,
      writes: astraResults.map((result) => result.write),
      results: astraResults,
      issues: plan.issues,
      plan,
      error: ok ? undefined : astraFailed.length ? "BATCH_ASTRA_WRITE_FAILED" : "BATCH_PARTIAL_VALIDATION_FAILED"
    },
    { status: astraFailed.length ? 502 : astraResults.length ? 207 : 400 }
  );
}
