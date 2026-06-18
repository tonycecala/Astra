import { NextResponse } from "next/server";
import { postToAstra } from "../../../../lib/config";
import { prepareComposerQueuePrivateFeedWrite } from "../../../../lib/queuePublish";

type QueuePublishRequest = {
  cardId?: string;
  targetUserId?: string;
  queueState?: "reviewing" | "approved" | "held";
  decisionNotes?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as QueuePublishRequest;
  const published = prepareComposerQueuePrivateFeedWrite(body);

  if (!published.ok) {
    return NextResponse.json(published, { status: published.error === "CARD_NOT_FOUND" ? 404 : 400 });
  }

  const astra = await postToAstra("/api/composer/private-feed-items", published.write);
  return NextResponse.json({ ok: astra.ok, write: published.write, astra: astra.body }, { status: astra.ok ? 201 : astra.status });
}
