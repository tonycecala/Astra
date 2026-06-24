import { buildAstrologyReportResultAsync } from "@astra/astrology";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import { db, getUserAstrologyReportRequest, getUserChartMakerRequest, recordAstrologyReportResult, recordChartMakerResult } from "@astra/db";
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

  if (reportRequest.chartRequestId) {
    const chartRequest = await getUserChartMakerRequest(db, {
      requestId: reportRequest.chartRequestId,
      userId: profile.userId
    });
    if (chartRequest) {
      await recordChartMakerResult(db, buildChartMakerRecordResult(chartRequest));
    }
  }

  const resultPayload = await buildAstrologyReportResultAsync(reportRequest);
  const result = await recordAstrologyReportResult(db, resultPayload);
  const updatedRequest = await getUserAstrologyReportRequest(db, {
    requestId,
    userId: profile.userId
  });

  return NextResponse.json({ request: updatedRequest, result }, { status: 201 });
}
