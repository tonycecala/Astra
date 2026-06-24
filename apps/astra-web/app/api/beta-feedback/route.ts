import { NextResponse } from "next/server";
import { z } from "zod";
import { createBetaFeedback, db } from "@astra/db";
import { getAstraSession } from "../../../lib/auth/server";

const feedbackSchema = z.object({
  category: z.enum(["report_quality", "checkout", "bug", "other"]).default("report_quality"),
  message: z.string().trim().min(1).max(2000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  reportId: z.string().trim().min(1)
});

export async function POST(request: Request) {
  const session = await getAstraSession(request.headers);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_feedback" }, { status: 400 });
  }

  try {
    const feedback = await createBetaFeedback(db, {
      category: parsed.data.category,
      message: parsed.data.message,
      rating: parsed.data.rating ?? null,
      reportRequestId: parsed.data.reportId,
      userId: session.user.id
    });
    return NextResponse.json({ ok: true, feedbackId: feedback.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "feedback_failed";
    if (message === "report_not_found") {
      return NextResponse.json({ ok: false, error: "report_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "feedback_failed" }, { status: 500 });
  }
}
