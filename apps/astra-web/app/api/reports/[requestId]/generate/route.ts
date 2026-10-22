import { buildAstrologyReportResultAsync } from "@astra/astrology";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import { db, getUserAstrologyReportRequest, getUserAstrologyReportResult, getUserChartMakerRequest, recordAstrologyReportResult, recordChartMakerResult } from "@astra/db";
import { NextResponse } from "next/server";
import { getAstraAuthContext } from "../../../../../lib/auth/profile";
import { ensureReportJourneyItem } from "../../../../../lib/journey-producers";

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

  const existing = await getUserAstrologyReportResult(db, { requestId, userId: profile.userId });
  if (existing?.status === "completed") {
    // Reopening or retrying a completed request must never replace its saved prose.
    return NextResponse.json({ request: reportRequest, result: existing, journey: null });
  }
  if (reportRequest.status === "cancelled") return NextResponse.json({ error: "REPORT_CANCELLED" }, { status: 409 });

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
  let journey = null;
  if (result.status === "completed" && result.publicSignal) {
    try {
      journey = await ensureReportJourneyItem({ requestId, userId: profile.userId, userRole: profile.role, result });
    } catch (error) {
      console.error("The report is complete but its Journey item is pending reconciliation.", error);
    }
  }
  const updatedRequest = await getUserAstrologyReportRequest(db, {
    requestId,
    userId: profile.userId
  });

  return NextResponse.json({ request: updatedRequest, result, journey }, { status: 201 });
}
