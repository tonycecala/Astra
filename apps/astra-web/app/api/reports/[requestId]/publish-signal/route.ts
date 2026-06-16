import { NextResponse } from "next/server";
import { type ComposerStreamArtifact, composerStreamArtifactSchema } from "@astra/contracts";
import { db, getUserAstrologyReportResult, upsertComposerStreamArtifact } from "@astra/db";
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
  const cardId = `report_signal_card:${requestId}`;
  const artifact = composerStreamArtifactSchema.parse({
    id: `report_signal:${requestId}`,
    target: "stream",
    publisher: "composer",
    rationale: {
      reason: reportResult.publicSignal.provenanceSummary,
      source: "chart_result"
    },
    voiceCard: {
      voice: { id: "guide" },
      header: reportResult.publicSignal.headline,
      body: reportResult.publicSignal.summary
    },
    card: {
      id: cardId,
      title: reportResult.publicSignal.headline,
      subtitle: reportResult.publicSignal.provenanceSummary,
      body: reportResult.publicSignal.summary,
      lane: "know_yourself",
      tone: reportResult.publicSignal.tone,
      ctaLabel: "Open",
      ctaAction: "open",
      publishedAt
    },
    streamItem: {
      id: `report_signal_stream:${requestId}`,
      cardId,
      kind: "artifact",
      position: Math.floor(Date.now() / 1000),
      status: "published",
      audience: "all"
    },
    createdAt: publishedAt
  } satisfies ComposerStreamArtifact);

  try {
    const streamArtifact = await upsertComposerStreamArtifact(db, artifact);
    return NextResponse.json({ artifact: streamArtifact }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ASTROLOGY_REPORT_PUBLIC_SIGNAL_NOT_PUBLISHED" }, { status: 502 });
  }
}
