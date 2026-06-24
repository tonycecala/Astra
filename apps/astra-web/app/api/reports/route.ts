import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAstrologyReportRequestSchema } from "@astra/contracts";
import { createAstrologyReportRequest, db, getCreditBalance, listUserAstrologyReportRequests, spendCreditsForReport } from "@astra/db";
import { getAstraAuthContext } from "../../../lib/auth/profile";
import { starCostForReportType } from "../../../lib/stars";

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

const customerReportTypes = new Set(["identity", "core", "core_self"]);

function forbiddenReportType() {
  return NextResponse.json({ error: "REPORT_TYPE_REQUIRES_ADMIN_OR_STARS" }, { status: 403 });
}

function insufficientStars(requiredStars: number) {
  return NextResponse.json({ error: "INSUFFICIENT_STARS", requiredStars }, { status: 402 });
}

function reportTierFromUrl(url: URL) {
  const tier = url.searchParams.get("tier");
  return tier === "free" || tier === "core" || tier === "deep" || tier === "shared" || tier === "public" ? tier : "all";
}

function reportMatchesTier(reportType: string, tier: string) {
  if (tier === "all") return true;
  if (tier === "free") return reportType === "identity";
  if (tier === "core") return reportType === "core" || reportType === "core_self" || reportType === "chart_interpretation";
  if (tier === "deep") return reportType === "deep";
  return true;
}

function reportMatchesSubject(request: { chartRequestId?: string; subjectName: string; context?: unknown }, subjectId: string | null) {
  if (!subjectId) return true;
  if (request.chartRequestId === subjectId) return true;
  const context = request.context && typeof request.context === "object" && !Array.isArray(request.context) ? (request.context as Record<string, unknown>) : {};
  const subject = context.subject && typeof context.subject === "object" && !Array.isArray(context.subject) ? (context.subject as Record<string, unknown>) : {};
  return subject.id === subjectId || subject.subjectId === subjectId || request.subjectName === subjectId;
}

export async function GET(request: Request) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const url = new URL(request.url);
  const tier = reportTierFromUrl(url);
  const subjectId = url.searchParams.get("subjectId");
  const requests = (await listUserAstrologyReportRequests(db, profile.userId)).filter(
    (reportRequest) => reportMatchesTier(reportRequest.reportType, tier) && reportMatchesSubject(reportRequest, subjectId)
  );
  return NextResponse.json({ requests, filters: { tier, subjectId } });
}

export async function POST(request: Request) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const parsed = createAstrologyReportRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_ASTROLOGY_REPORT_REQUEST",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const reportType = parsed.data.reportType ?? "core";
  const requiredStars = starCostForReportType(reportType);

  if (profile.role !== "admin") {
    if (!customerReportTypes.has(reportType)) return forbiddenReportType();
    const balance = await getCreditBalance(db, profile.userId);
    if (balance < requiredStars) return insufficientStars(requiredStars);
  }

  const requestId = randomUUID();
  const reportRequest = await createAstrologyReportRequest(db, {
    id: requestId,
    ...parsed.data,
    costCredits: requiredStars,
    userId: profile.userId
  });

  if (profile.role !== "admin" && requiredStars > 0) {
    await spendCreditsForReport(db, {
      amount: requiredStars,
      description: `${reportType} report`,
      requestId,
      reportType,
      userId: profile.userId
    });
  }

  return NextResponse.json({ request: reportRequest }, { status: 201 });
}
