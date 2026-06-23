import { buildAstrologyReportResultAsync } from "@astra/astrology";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import { db, getAstrologyReportRequest, getUserChartMakerRequest, recordAstrologyReportResult, recordChartMakerResult } from "@astra/db";
import { NextResponse } from "next/server";
import { hasValidInternalApiToken } from "../../../../lib/internal-token";

function isAdminEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ASTRA_ADMIN_ENABLED === "1";
}

function forbidden() {
  return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
}

export async function POST(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ ok: false, error: "ADMIN_DISABLED" }, { status: 404 });
  }
  if (!hasValidInternalApiToken(request)) return forbidden();

  const payload = (await request.json().catch(() => null)) as {
    reportId?: unknown;
    requestId?: unknown;
    reportWriter?: unknown;
    modelProfile?: unknown;
    modelProvider?: unknown;
    model?: unknown;
  } | null;
  const requestId = String(payload?.requestId ?? payload?.reportId ?? "").trim();
  if (!requestId) {
    return NextResponse.json({ ok: false, error: "MISSING_REPORT_ID" }, { status: 400 });
  }

  const reportRequest = await getAstrologyReportRequest(db, requestId);
  if (!reportRequest) {
    return NextResponse.json({ ok: false, error: "ASTROLOGY_REPORT_REQUEST_NOT_FOUND" }, { status: 404 });
  }

  if (reportRequest.chartRequestId) {
    const chartRequest = await getUserChartMakerRequest(db, {
      requestId: reportRequest.chartRequestId,
      userId: reportRequest.userId
    });
    if (chartRequest) {
      await recordChartMakerResult(db, buildChartMakerRecordResult(chartRequest));
    }
  }

  const env = {
    ...process.env,
    ASTRA_REPORT_WRITER: typeof payload?.reportWriter === "string" ? payload.reportWriter : process.env.ASTRA_REPORT_WRITER,
    ASTRA_REPORT_MODEL_PROFILE: typeof payload?.modelProfile === "string" ? payload.modelProfile : process.env.ASTRA_REPORT_MODEL_PROFILE,
    ASTRA_REPORT_MODEL_PROVIDER:
      typeof payload?.modelProvider === "string" ? payload.modelProvider : typeof payload?.modelProfile === "string" ? undefined : process.env.ASTRA_REPORT_MODEL_PROVIDER,
    ASTRA_REPORT_MODEL: typeof payload?.model === "string" ? payload.model : typeof payload?.modelProfile === "string" ? undefined : process.env.ASTRA_REPORT_MODEL
  };
  const resultPayload = await buildAstrologyReportResultAsync(reportRequest, { env });
  const result = await recordAstrologyReportResult(db, resultPayload);
  const updatedRequest = await getAstrologyReportRequest(db, requestId);

  return NextResponse.json(
    {
      ok: result.status === "completed",
      request: updatedRequest,
      result
    },
    { status: result.status === "completed" ? 200 : 400 }
  );
}
