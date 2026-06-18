import { db, deleteComposerQueuePublishPlan, getComposerQueuePublishPlan } from "@astra/db";
import { NextResponse } from "next/server";

function safeError(error: unknown) {
  console.error("Composer queue publish plan persistence failed", error);
  return NextResponse.json({ ok: false, error: "COMPOSER_QUEUE_PUBLISH_PLAN_PERSISTENCE_FAILED" }, { status: 503 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const planId = url.searchParams.get("planId")?.trim() ?? "";
  if (!planId) {
    return NextResponse.json({ ok: false, error: "PLAN_ID_REQUIRED" }, { status: 400 });
  }

  try {
    const plan = await getComposerQueuePublishPlan(db, planId);
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return safeError(error);
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const planId = url.searchParams.get("planId")?.trim() ?? "";
  if (!planId) {
    return NextResponse.json({ ok: false, error: "PLAN_ID_REQUIRED" }, { status: 400 });
  }

  try {
    await deleteComposerQueuePublishPlan(db, planId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
}
