import { NextResponse } from "next/server";

import { createAstrologyReportShare, db, revokeAstrologyReportShare } from "@astra/db";
import { getAstraAuthContext } from "../../../../../lib/auth/profile";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

function requestBaseUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request, context: RouteContext) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const { requestId } = await context.params;
  const share = await createAstrologyReportShare(db, {
    requestId,
    userId: profile.userId,
    baseUrl: requestBaseUrl(request)
  });

  if (!share) {
    return NextResponse.json({ error: "ASTROLOGY_REPORT_NOT_SHAREABLE" }, { status: 404 });
  }

  return NextResponse.json({ share });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const { requestId } = await context.params;
  const revoked = await revokeAstrologyReportShare(db, {
    requestId,
    userId: profile.userId
  });

  if (!revoked) {
    return NextResponse.json({ error: "ASTROLOGY_REPORT_SHARE_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
