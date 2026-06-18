import { NextResponse } from "next/server";
import { prepareComposerOperatorPrivateFeedWrite } from "../../../../src";
import { postToAstra } from "../../../../lib/config";
import type { ComposerOperatorPreview } from "../../../../src";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    preview?: ComposerOperatorPreview;
    targetUserId?: string;
    feedItemId?: string;
  };

  if (!body.preview) {
    return NextResponse.json({ ok: false, error: "PREVIEW_REQUIRED" }, { status: 400 });
  }

  const publish = prepareComposerOperatorPrivateFeedWrite({
    preview: body.preview,
    targetUserId: body.targetUserId ?? "",
    feedItemId: body.feedItemId
  });

  if (!publish.ok) {
    return NextResponse.json(publish, { status: 400 });
  }

  const astra = await postToAstra("/api/composer/private-feed-items", publish.write);
  return NextResponse.json({ ok: astra.ok, write: publish.write, astra: astra.body }, { status: astra.ok ? 201 : astra.status });
}
