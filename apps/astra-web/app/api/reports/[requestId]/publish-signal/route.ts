import { NextResponse } from "next/server";
import { composerPrivateFeedWriteSchema } from "@astra/contracts";
import { db, getUserAstrologyReportResult } from "@astra/db";
import { persistComposerPrivateFeedWrite } from "../../../../../lib/composer-private-feed";
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
  const reportResult = await getUserAstrologyReportResult(db, {
    requestId,
    userId: profile.userId
  });

  if (!reportResult) {
    return NextResponse.json({ error: "ASTROLOGY_REPORT_RESULT_NOT_FOUND" }, { status: 404 });
  }
  if (reportResult.status !== "completed" || !reportResult.publicSignal) {
    return NextResponse.json({ error: "ASTROLOGY_REPORT_PUBLIC_SIGNAL_NOT_READY" }, { status: 409 });
  }

  const publishedAt = new Date().toISOString();
  const sourceCardId = `source_card:${reportResult.publicSignal.reportId}`;
  const composerWrite = composerPrivateFeedWriteSchema.parse({
    id: `report_signal:${requestId}`,
    publisher: "composer",
    sourceCard: {
      id: sourceCardId,
      slug: `report-signal-${requestId}`,
      title: reportResult.publicSignal.headline,
      bodyTemplate: reportResult.publicSignal.summary,
      cardType: "report_signal",
      topicTags: ["report", reportResult.publicSignal.reportType],
      symbolicTags: [],
      eligibilityRules: { requiresAuthenticatedUser: true, reportId: reportResult.publicSignal.reportId },
      safetyFlags: [],
      status: "active",
      createdAt: publishedAt,
      updatedAt: publishedAt
    },
    feedItem: {
      id: `report_signal_feed:${profile.userId}:${requestId}`,
      userId: profile.userId,
      sourceCardId,
      feedKind: "report_signal",
      title: reportResult.publicSignal.headline,
      body: reportResult.publicSignal.summary,
      displayPayload: {
        subtitle: reportResult.publicSignal.provenanceSummary,
        lane: "know_yourself",
        tone: reportResult.publicSignal.tone,
        ctaLabel: "Open",
        ctaAction: "open",
        publicSignal: reportResult.publicSignal,
        composerArtifactId: `report_signal:${requestId}`
      },
      rankScore: Math.floor(Date.now() / 1000),
      reasonCode: "explicit_report_signal_publish",
      state: "available",
      availableAt: publishedAt
    },
    decision: {
      decisionVersion: "report-signal-private-feed-v1",
      inputContextHash: `report:${reportResult.publicSignal.reportId}`,
      candidateIds: [sourceCardId],
      selectedCandidateId: sourceCardId,
      rankFeatures: {
        reportType: reportResult.publicSignal.reportType,
        boundary: reportResult.publicSignal.boundary,
        provenanceSummary: reportResult.publicSignal.provenanceSummary
      },
      suppressionReasons: [],
      safetyNotes: ["Raw private report sections are not included in this feed write."]
    },
    createdAt: publishedAt
  });

  try {
    const write = await persistComposerPrivateFeedWrite(composerWrite);
    return NextResponse.json({ artifact: composerWrite, feedItem: write.feedItem, write }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ASTROLOGY_REPORT_PUBLIC_SIGNAL_NOT_PUBLISHED" }, { status: 502 });
  }
}
