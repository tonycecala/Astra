import { NextResponse } from "next/server";
import { updateAllyRelationshipSchema } from "@astra/contracts";
import { db, deleteUserAlly, updateUserAllyRelationship } from "@astra/db";
import { getAstraAuthContext } from "../../../../lib/auth/profile";

type AllyRouteParams = {
  params: Promise<{ allyId: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

export async function DELETE(_request: Request, { params }: AllyRouteParams) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const { allyId } = await params;
  const deleted = await deleteUserAlly(db, {
    allyId: decodeURIComponent(allyId),
    userId: profile.userId
  });

  if (!deleted) {
    return NextResponse.json({ error: "ALLY_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: AllyRouteParams) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const parsed = updateAllyRelationshipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_ALLY_RELATIONSHIP" }, { status: 400 });
  }

  const { allyId } = await params;
  const ally = await updateUserAllyRelationship(db, {
    allyId: decodeURIComponent(allyId),
    userId: profile.userId,
    relationship: parsed.data.relationship
  });
  if (!ally) return NextResponse.json({ error: "ALLY_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ally });
}
