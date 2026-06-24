import { NextResponse } from "next/server";
import { db, deleteUserAlly } from "@astra/db";
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
