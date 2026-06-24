"use client";

import Link from "next/link";
import { CheckCircle2, CircleDot, ClipboardCheck, PauseCircle, RefreshCw, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComposerCardMembership, ComposerCardScope } from "../lib/cardLibrary";

type QueueState = "reviewing" | "approved" | "held";

type DetailControlLabels = {
  addToQueueDraft: string;
  addToQueueDraftHelp: string;
  approveSelectedHelp: string;
  cleanStartApi: string;
  collectionMembership: string;
  courseBuilder: string;
  draftApiPending: string;
  editVersionApi: string;
  futureVersioning: string;
  held: string;
  holdSelectedHelp: string;
  libraryInventory: string;
  loading: string;
  membershipDetail: string;
  noQueueDraft: string;
  open: string;
  openHelp: string;
  queueApproved: string;
  queueDraftState: string;
  queueHeld: string;
  queueReviewing: string;
  queueSaved: string;
  refreshQueueDraft: string;
  refreshQueueDraftHelp: string;
  serverDraft: string;
  versionApiPending: string;
};

type ServerQueueDraft = {
  decisionNotes: Record<string, unknown>;
  id: string;
  lastPlanId?: string;
  lastPlanSummary: Record<string, unknown>;
  operatorKey: string;
  queueStates: Record<string, unknown>;
  scope: ComposerCardScope;
  selectedCards: Record<string, unknown>;
  status: string;
};

type QueueDraftResponse = {
  ok: boolean;
  draft?: ServerQueueDraft | null;
  error?: string;
};

type CardDetailWorkbenchControlProps = {
  cardId: string;
  cardStatus: string;
  labels: DetailControlLabels;
  memberships: ComposerCardMembership[];
  scope: ComposerCardScope;
};

function queueStateFrom(value: unknown, fallback: string): QueueState {
  if (value === "approved" || fallback === "approved" || fallback === "published") return "approved";
  if (value === "held" || fallback === "archived") return "held";
  return "reviewing";
}

function stateLabel(labels: DetailControlLabels, state: QueueState) {
  if (state === "approved") return labels.queueApproved;
  if (state === "held") return labels.queueHeld;
  return labels.queueReviewing;
}

function mergeSelectedCard(draft: ServerQueueDraft | null, cardId: string, cardStatus: string, state: QueueState) {
  return {
    decisionNotes: draft?.decisionNotes ?? {},
    lastPlanId: draft?.lastPlanId,
    lastPlanSummary: draft?.lastPlanSummary ?? {},
    queueStates: {
      ...(draft?.queueStates ?? {}),
      [cardId]: state
    },
    scope: draft?.scope,
    selectedCards: {
      ...(draft?.selectedCards ?? {}),
      [cardId]: { id: cardId, status: cardStatus }
    }
  };
}

export function CardDetailWorkbenchControl({ cardId, cardStatus, labels, memberships, scope }: CardDetailWorkbenchControlProps) {
  const [draft, setDraft] = useState<ServerQueueDraft | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const selectedCount = Object.keys(draft?.selectedCards ?? {}).length;
  const queueState = useMemo(() => queueStateFrom(draft?.queueStates?.[cardId], cardStatus), [cardId, cardStatus, draft]);
  const isInDraft = Boolean(draft?.selectedCards?.[cardId]);

  const loadDraft = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/cards/queue-draft?scope=${encodeURIComponent(scope)}`);
    const payload = (await response.json().catch(() => ({ ok: false, error: labels.noQueueDraft }))) as QueueDraftResponse;
    if (payload.ok) {
      setDraft(payload.draft ?? null);
      setStatus(payload.draft ? `${labels.serverDraft} · ${payload.draft.id}` : labels.noQueueDraft);
    } else {
      setStatus(payload.error ?? labels.noQueueDraft);
    }
    setIsLoading(false);
  }, [labels.noQueueDraft, labels.serverDraft, scope]);

  async function saveState(state: QueueState) {
    setIsSaving(true);
    const next = mergeSelectedCard(draft, cardId, cardStatus, state);
    const response = await fetch("/api/cards/queue-draft", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...next,
        scope
      })
    });
    const payload = (await response.json().catch(() => ({ ok: false, error: labels.noQueueDraft }))) as QueueDraftResponse;
    if (payload.ok) {
      setDraft(payload.draft ?? null);
      setStatus(`${labels.queueSaved} · ${stateLabel(labels, state)}`);
    } else {
      setStatus(payload.error ?? labels.noQueueDraft);
    }
    setIsSaving(false);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadDraft();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [loadDraft]);

  return (
    <section className="card-control-grid">
      <article className="panel card-control-panel" aria-label={labels.collectionMembership}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">{labels.libraryInventory}</p>
            <h2>{labels.collectionMembership}</h2>
          </div>
          <strong>{memberships.length}</strong>
        </div>
        <div className="membership-list">
          {memberships.map((membership) => (
            <Link className="membership-row" href={membership.href} key={`${membership.kind}:${membership.id}`} title={labels.openHelp}>
              <span>
                <strong>{membership.title}</strong>
                <small>
                  {membership.kind} · {membership.detail || labels.membershipDetail}
                </small>
              </span>
              <em>{labels.open}</em>
            </Link>
          ))}
        </div>
      </article>

      <article className="panel card-control-panel" aria-label={labels.queueDraftState}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">{labels.serverDraft}</p>
            <h2>{labels.queueDraftState}</h2>
          </div>
          <span className={`composerQueuePill composerQueuePill-${queueState}`}>{stateLabel(labels, queueState)}</span>
        </div>
        <div className="queue-control-summary">
          <span>
            <strong>{selectedCount}</strong>
            {labels.addToQueueDraft}
          </span>
          <span>
            <strong>{isInDraft ? labels.queueSaved : labels.noQueueDraft}</strong>
            {status || labels.refreshQueueDraft}
          </span>
        </div>
        <div className="queue-actions queue-actions-compact">
          <button className="secondary-button" disabled={isLoading || isSaving} onClick={loadDraft} title={labels.refreshQueueDraftHelp} type="button">
            <RefreshCw aria-hidden="true" size={16} />
            {isLoading ? labels.loading : labels.refreshQueueDraft}
          </button>
          <button className="secondary-button" disabled={isSaving} onClick={() => saveState("reviewing")} title={labels.addToQueueDraftHelp} type="button">
            <CircleDot aria-hidden="true" size={16} />
            {labels.queueReviewing}
          </button>
          <button className="secondary-button" disabled={isSaving} onClick={() => saveState("approved")} title={labels.approveSelectedHelp} type="button">
            <CheckCircle2 aria-hidden="true" size={16} />
            {labels.queueApproved}
          </button>
          <button className="secondary-button" disabled={isSaving} onClick={() => saveState("held")} title={labels.holdSelectedHelp} type="button">
            <PauseCircle aria-hidden="true" size={16} />
            {labels.held}
          </button>
        </div>
      </article>

      <article className="panel card-control-panel card-control-api-panel" aria-label={labels.editVersionApi}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">{labels.cleanStartApi}</p>
            <h2>{labels.editVersionApi}</h2>
          </div>
          <Wrench aria-hidden="true" size={18} />
        </div>
        <div className="future-api-list">
          <span>
            <ClipboardCheck aria-hidden="true" size={15} />
            {labels.draftApiPending}
          </span>
          <span>
            <ClipboardCheck aria-hidden="true" size={15} />
            {labels.versionApiPending}
          </span>
          <span>
            <ClipboardCheck aria-hidden="true" size={15} />
            {labels.futureVersioning}
          </span>
          <span>
            <ClipboardCheck aria-hidden="true" size={15} />
            {labels.courseBuilder}
          </span>
        </div>
      </article>
    </section>
  );
}
