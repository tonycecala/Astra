import { NextResponse } from "next/server";

import { db, deleteUserAstrologyReport } from "@astra/db";
import { getAstraAuthContext } from "../../../../lib/auth/profile";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const { requestId } = await context.params;
  const deleted = await deleteUserAstrologyReport(db, {
    requestId,
    userId: profile.userId
  });

  if (!deleted) {
    return NextResponse.json({ error: "ASTROLOGY_REPORT_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
