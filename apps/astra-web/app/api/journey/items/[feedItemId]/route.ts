import { journeyFeedItemActionSchema } from "@astra/contracts";
import { db, updateUserFeedItemState } from "@astra/db";
import { NextResponse } from "next/server";
import { getAstraAuthContext } from "../../../../../lib/auth/profile";

type JourneyItemRouteProps = { params: Promise<{ feedItemId: string }> };

export async function PATCH(request: Request, { params }: JourneyItemRouteProps) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const action = journeyFeedItemActionSchema.safeParse(body?.action);
  if (!action.success) return NextResponse.json({ error: "INVALID_JOURNEY_ACTION" }, { status: 400 });

  const { feedItemId } = await params;
  const item = await updateUserFeedItemState(db, {
    userId: profile.userId,
    feedItemId: decodeURIComponent(feedItemId),
    action: action.data
  });
  if (!item) return NextResponse.json({ error: "JOURNEY_ITEM_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ item });
}
