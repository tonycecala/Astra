import { NextResponse } from "next/server";
import { getAstraAuthContext } from "../../../../../lib/auth/profile";
import { ensureReportJourneyItem } from "../../../../../lib/journey-producers";

type RouteContext = { params: Promise<{ requestId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { requestId } = await context.params;
  try {
    const published = await ensureReportJourneyItem({ requestId, userId: profile.userId, userRole: profile.role });
    return NextResponse.json(published, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ASTROLOGY_REPORT_PUBLIC_SIGNAL_NOT_PUBLISHED";
    if (code === "ASTROLOGY_REPORT_RESULT_NOT_FOUND") return NextResponse.json({ error: code }, { status: 404 });
    if (code === "ASTROLOGY_REPORT_PUBLIC_SIGNAL_NOT_READY") return NextResponse.json({ error: code }, { status: 409 });
    return NextResponse.json({ error: "ASTROLOGY_REPORT_PUBLIC_SIGNAL_NOT_PUBLISHED" }, { status: 502 });
  }
}
