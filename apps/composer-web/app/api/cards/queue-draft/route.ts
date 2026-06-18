import { db, deleteComposerQueueDraft, getComposerQueueDraft, upsertComposerQueueDraft } from "@astra/db";
import { NextResponse } from "next/server";
import type { ComposerCardScope } from "../../../../lib/cardLibrary";
import { composerOperatorKeyFrom } from "../../../../lib/operatorIdentity";

const scopes = new Set<ComposerCardScope>(["all", "drafts", "course"]);

type QueueDraftBody = {
  decisionNotes?: Record<string, unknown>;
  lastPlanId?: string;
  lastPlanSummary?: Record<string, unknown>;
  operatorKey?: string;
  queryCacheKeys?: string[];
  queueStates?: Record<string, unknown>;
  scope?: ComposerCardScope;
  selectedCards?: Record<string, unknown>;
  targetUserId?: string;
};

function scopeFrom(value: string | null | undefined): ComposerCardScope {
  return scopes.has(value as ComposerCardScope) ? (value as ComposerCardScope) : "all";
}

function record(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()))] : [];
}

function safeError(error: unknown) {
  console.error("Composer queue draft persistence failed", error);
  return NextResponse.json({ ok: false, error: "COMPOSER_QUEUE_DRAFT_PERSISTENCE_FAILED" }, { status: 503 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = scopeFrom(url.searchParams.get("scope"));
  const operatorKey = composerOperatorKeyFrom(request, url.searchParams.get("operatorKey"));

  try {
    const draft = await getComposerQueueDraft(db, { operatorKey, scope });
    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    return safeError(error);
  }
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as QueueDraftBody;
  const scope = scopeFrom(body.scope);
  const operatorKey = composerOperatorKeyFrom(request, body.operatorKey);

  try {
    const draft = await upsertComposerQueueDraft(db, {
      operatorKey,
      scope,
      targetUserId: body.targetUserId?.trim() || undefined,
      selectedCards: record(body.selectedCards),
      queueStates: record(body.queueStates),
      decisionNotes: record(body.decisionNotes),
      queryCacheKeys: stringArray(body.queryCacheKeys),
      lastPlanId: body.lastPlanId?.trim() || undefined,
      lastPlanSummary: record(body.lastPlanSummary)
    });
    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    return safeError(error);
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const scope = scopeFrom(url.searchParams.get("scope"));
  const operatorKey = composerOperatorKeyFrom(request, url.searchParams.get("operatorKey"));

  try {
    await deleteComposerQueueDraft(db, { operatorKey, scope });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
}
