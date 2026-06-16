import { buildAstrologyReportResult } from "@astra/astrology";
import { db, getUserAstrologyReportRequest, recordAstrologyReportResult } from "@astra/db";
import { NextResponse } from "next/server";
import { getAstraAuthContext } from "../../../../../lib/auth/profile";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

export async function POST(_request: Request, context: RouteContext) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const { requestId } = await context.params;
  const reportRequest = await getUserAstrologyReportRequest(db, {
    requestId,
    userId: profile.userId
  });

  if (!reportRequest) {
    return NextResponse.json({ error: "ASTROLOGY_REPORT_REQUEST_NOT_FOUND" }, { status: 404 });
  }

  const resultPayload = buildAstrologyReportResult(reportRequest);
  const result = await recordAstrologyReportResult(db, resultPayload);
  const updatedRequest = await getUserAstrologyReportRequest(db, {
    requestId,
    userId: profile.userId
  });

  return NextResponse.json({ request: updatedRequest, result }, { status: 201 });
}
