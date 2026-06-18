import { NextResponse } from "next/server";
import { createComposerOperatorDraftFixture, previewComposerOperatorDraft } from "../../../../src";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { runId?: string; header?: string; body?: string };
  const createdAt = new Date().toISOString();
  const draft = createComposerOperatorDraftFixture(createdAt);
  const runId = body.runId?.trim() || `ui_${Date.now()}`;
  const preview = previewComposerOperatorDraft({
    ...draft,
    draftId: `${draft.draftId}_${runId}`,
    sourceCard: {
      ...draft.sourceCard,
      id: `${draft.sourceCard.id}:${runId}`,
      slug: `${draft.sourceCard.slug}-${runId}`,
      createdAt,
      updatedAt: createdAt
    },
    voiceCard: {
      ...draft.voiceCard,
      header: body.header?.trim() || draft.voiceCard.header,
      body: body.body?.trim() || draft.voiceCard.body
    },
    createdAt
  });

  return NextResponse.json(preview, { status: preview.ok ? 200 : 400 });
}
