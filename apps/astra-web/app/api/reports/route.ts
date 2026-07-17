import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  chartCalculationModeForBirthData,
  createAstrologyReportRequestSchema,
  type ChartMakerRequest,
  type ReportChartBasisSnapshot,
  type ReportChartSourceSnapshot
} from "@astra/contracts";
import { db, getUserChartMakerRequest, listUserAstrologyReportRequests, purchaseAstrologyReportRequest } from "@astra/db";
import { getAstraAuthContext } from "../../../lib/auth/profile";
import { reportProductFor } from "../../../lib/reportCatalog";

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

function insufficientStars(requiredStars: number) {
  return NextResponse.json({ error: "INSUFFICIENT_STARS", requiredStars }, { status: 402 });
}

function invalidBasis(message: string) {
  return NextResponse.json({ error: "INVALID_REPORT_BASIS", message }, { status: 400 });
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

function sourceSnapshot(chartRequest: ChartMakerRequest, userId: string): ReportChartSourceSnapshot {
  const subject = chartRequest.context?.subject;
  const subjectType = subject?.subjectType ?? (chartRequest.source === "ally" ? "ally" : "self");
  const subjectId = subject?.allyId ?? subject?.subjectId ?? (subjectType === "self" ? userId : undefined);
  return {
    chartRequestId: chartRequest.id,
    subjectType,
    ...(subjectId ? { subjectId } : {}),
    subjectName: chartRequest.subjectName,
    birthData: chartRequest.birthData,
    calculationMode: chartCalculationModeForBirthData(chartRequest.birthData)
  };
}

function chartPairAllowedForCustomer(primary: ReportChartSourceSnapshot, partner: ReportChartSourceSnapshot) {
  return new Set([primary.subjectType, partner.subjectType]).size === 2;
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

  const product = reportProductFor(parsed.data.reportType);
  if (parsed.data.reportBasis.type !== product.basis) {
    return invalidBasis(`${parsed.data.reportType} reports require a ${product.basis} basis.`);
  }

  const primaryChart = await getUserChartMakerRequest(db, {
    requestId: parsed.data.chartRequestId,
    userId: profile.userId
  });
  if (!primaryChart) return invalidBasis("The source chart was not found for this account.");

  const primary = sourceSnapshot(primaryChart, profile.userId);
  let partner: ReportChartSourceSnapshot | undefined;
  const kimiIntro = parsed.data.kimiIntro === true;
  if (kimiIntro && (parsed.data.reportType !== "identity" || primaryChart.source !== "self")) {
    return invalidBasis("The free introduction is available for a natal Self Identity Report.");
  }

  if (parsed.data.reportBasis.type === "progressed") {
    if (primary.birthData.birthTimeKnown === false || !primary.birthData.time) {
      return invalidBasis("Progressed reports require a known birth time.");
    }
    if (parsed.data.reportBasis.asOfDate < primary.birthData.date) {
      return invalidBasis("The progressed as-of date cannot be before the birth date.");
    }
  }

  if (parsed.data.reportBasis.type === "synastry") {
    if (parsed.data.reportBasis.partnerChartRequestId === primary.chartRequestId) {
      return invalidBasis("Synastry requires two different charts.");
    }
    const partnerChart = await getUserChartMakerRequest(db, {
      requestId: parsed.data.reportBasis.partnerChartRequestId,
      userId: profile.userId
    });
    if (!partnerChart) return invalidBasis("The comparison chart was not found for this account.");
    partner = sourceSnapshot(partnerChart, profile.userId);
    if (profile.role !== "admin" && !chartPairAllowedForCustomer(primary, partner)) {
      return invalidBasis("Synastry is available between Self and an Ally.");
    }
  }

  const reportBasis: ReportChartBasisSnapshot = {
    schemaVersion: 2,
    type: parsed.data.reportBasis.type,
    chartSettings: parsed.data.reportBasis.chartSettings,
    primary,
    ...(partner ? { partner } : {}),
    ...(parsed.data.reportBasis.type === "progressed" ? { asOfDate: parsed.data.reportBasis.asOfDate } : {})
  };
  const context = {
    ...(primaryChart.context ?? {}),
    chartSettings: reportBasis.chartSettings,
    ...(kimiIntro ? { modelPilot: "kimi-intro-identity" } : {}),
    ...(partner
      ? {
          synastryPartner: {
            chartRequestId: partner.chartRequestId,
            subjectName: partner.subjectName,
            birthData: partner.birthData
          }
        }
      : {})
  };
  const requestId = randomUUID();

  try {
    const purchased = await purchaseAstrologyReportRequest(db, {
      id: requestId,
      userId: profile.userId,
      chartRequestId: primary.chartRequestId,
      reportType: parsed.data.reportType,
      subjectName: primary.subjectName,
      birthData: primary.birthData,
      question: parsed.data.question,
      intent: parsed.data.intent,
      context,
      source: primaryChart.source,
      costCredits: kimiIntro ? 0 : product.costStars,
      reportBasis,
      bypassCreditDebit: profile.role === "admin"
    });
    return NextResponse.json({ request: purchased.request, balanceAfter: purchased.balanceAfter }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "insufficient_credits") {
      return insufficientStars(kimiIntro ? 0 : product.costStars);
    }
    throw error;
  }
}
