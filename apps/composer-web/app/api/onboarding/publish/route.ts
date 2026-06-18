import { NextResponse } from "next/server";
import { prepareComposerOnboardingCardsBatch } from "../../../../src";
import { postToAstra } from "../../../../lib/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { targetUserId?: string; batchId?: string };
  const batch = prepareComposerOnboardingCardsBatch({
    targetUserId: body.targetUserId ?? "",
    batchId: body.batchId
  });

  if (!batch.ok) {
    return NextResponse.json(batch, { status: 400 });
  }

  const astra = await postToAstra("/api/composer/onboarding-cards", batch.batch);
  return NextResponse.json({ ok: astra.ok, batch: batch.batch, astra: astra.body }, { status: astra.ok ? 201 : astra.status });
}
