"use client";

import { PublishedCardBody } from "@astra/ui";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleDot, ClipboardCheck, Eye, PauseCircle, Pencil, Save, Search, Send, Square, SquareCheck, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { ComposerCardQueryResult, ComposerCardScope, ComposerStreamCard } from "../lib/cardLibrary";
import { displayComposerValue, getComposerCardFeeds, getComposerCardImage } from "../lib/cardLibrary";

type WorkspaceLabels = {
  approveSelected: string;
  approveSelectedHelp: string;
  cardDetail: string;
  cardDetailHelp: string;
  cardPreviewLabel: string;
  cards: string;
  clearSelection: string;
  clearSelectionHelp: string;
  feed: string;
  holdSelected: string;
  holdSelectedHelp: string;
  lane: string;
  loading: string;
  markReviewing: string;
  markReviewingHelp: string;
  nextPage: string;
  noCards: string;
  noCardsDetail: string;
  page: string;
  pagedResults: string;
  previousPage: string;
  queueApproved: string;
  queueHeld: string;
  queueLabel: string;
  queueReviewing: string;
  queueSelected: string;
  queueSessionOnly: string;
  queueStateLabel: string;
  queueVisible: string;
  queueVisibleSelected: string;
  loadQueueDraft: string;
  loadQueueDraftHelp: string;
  reviewCard: string;
  reviewCardHelp: string;
  reviewDetailLabel: string;
  reviewNotes: string;
  reviewNotesPlaceholder: string;
  publishEligibility: string;
  publishFailed: string;
  publishFeedItem: string;
  publishBatchPrivateFeed: string;
  publishBatchPrivateFeedHelp: string;
  publishBatchReady: string;
  publishPrivateFeed: string;
  publishPrivateFeedHelp: string;
  publishReady: string;
  prepareBatch: string;
  prepareBatchHelp: string;
  prepareLimit: string;
  preparePlan: string;
  preparePublishable: string;
  publishNeedsApproved: string;
  publishNeedsReview: string;
  publishWrite: string;
  publishPlanIssues: string;
  publishPlanLoaded: string;
  publishPlanSaved: string;
  queryBoundary: string;
  queryCache: string;
  queryWindow: string;
  reset: string;
  search: string;
  searchPlaceholder: string;
  selectCard: string;
  selectCardHelp: string;
  selectVisible: string;
  selectVisibleHelp: string;
  saveQueueDraft: string;
  saveQueueDraftHelp: string;
  serverDraft: string;
  serverDraftEmpty: string;
  serverDraftLoaded: string;
  serverDraftSaved: string;
  showLess: string;
  showMore: string;
  status: string;
  tags: string;
  type: string;
  visible: string;
};

type QueueState = "reviewing" | "approved" | "held";

type QueueDraftCard = {
  id: string;
  status: string;
};

type QueueDraftState = {
  decisionNotes: Record<string, string>;
  queueStates: Record<string, QueueState>;
  selectedCards: Record<string, QueueDraftCard>;
  version: 1;
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

type ServerQueueDraftResponse = {
  ok: boolean;
  draft?: ServerQueueDraft | null;
  error?: string;
};

type ServerQueuePublishPlan = {
  id: string;
  status: string;
  summary: QueueBatchPlan["summary"];
  issues: NonNullable<QueueBatchPlan["issues"]>;
};

type ServerQueuePublishPlanResponse = {
  ok: boolean;
  plan?: ServerQueuePublishPlan | null;
  error?: string;
};

type QueuePublishResponse = {
  ok: boolean;
  collection?: {
    id?: string;
    totalCards?: number;
    title?: string;
  };
  error?: string;
  issues?: { field?: string; message?: string; type?: string }[];
};

type QueueBatchPublishResponse = {
  ok: boolean;
  collection?: QueuePublishResponse["collection"];
  error?: string;
  issues?: { field?: string; message?: string; type?: string; cardId?: string; index?: number }[];
  plan?: QueueBatchPlan;
};

type QueueBatchPlan = {
  ok: boolean;
  error?: string;
  issues?: { field?: string; message?: string; type?: string; cardId?: string; index?: number }[];
  planId: string;
  summary: {
    cappedAt: number;
    collectionId: string;
    duplicateCount: number;
    needsReview: number;
    publishable: number;
    requested: number;
  };
};

type QueueBatchPrepareResponse = {
  ok: boolean;
  error?: string;
  issues?: { field?: string; message?: string; type?: string; cardId?: string; index?: number }[];
  plan?: QueueBatchPlan;
  persistedPlan?: ServerQueuePublishPlan | null;
};

type CardWorkspaceProps = {
  initialFeed?: string;
  initialResult: ComposerCardQueryResult;
  labels: WorkspaceLabels;
  scope: ComposerCardScope;
};

function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function appendValues(params: URLSearchParams, key: string, values: string[]) {
  for (const value of values) params.append(key, value);
}

function FilterButton({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return (
    <button aria-pressed={active} className={active ? "filter-pill filter-pill-active" : "filter-pill"} onClick={onClick} type="button">
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

function cardLane(card: ComposerStreamCard) {
  return card.seriesId ?? card.lane ?? "";
}

function queueDraftStorageKey(scope: ComposerCardScope) {
  return `composer.queueDraft.${scope}.v1`;
}

function readQueueDraft(scope: ComposerCardScope): QueueDraftState | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(queueDraftStorageKey(scope)) ?? "null") as QueueDraftState | null;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeQueueDraft(scope: ComposerCardScope, draft: QueueDraftState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(queueDraftStorageKey(scope), JSON.stringify(draft));
}

function queueStateRecord(value: Record<string, unknown>): Record<string, QueueState> {
  const next: Record<string, QueueState> = {};
  for (const [cardId, state] of Object.entries(value)) {
    if (state === "reviewing" || state === "approved" || state === "held") next[cardId] = state;
  }
  return next;
}

function selectedCardRecord(value: Record<string, unknown>): Record<string, QueueDraftCard> {
  const next: Record<string, QueueDraftCard> = {};
  for (const [cardId, card] of Object.entries(value)) {
    if (typeof card === "object" && card !== null && !Array.isArray(card)) {
      const status = typeof (card as { status?: unknown }).status === "string" ? (card as { status: string }).status : "draft";
      next[cardId] = { id: cardId, status };
    }
  }
  return next;
}

function stringRecord(value: Record<string, unknown>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [cardId, note] of Object.entries(value)) {
    if (typeof note === "string") next[cardId] = note;
  }
  return next;
}

function queuePlanFromServer(plan: ServerQueuePublishPlan): QueueBatchPlan {
  return {
    ok: plan.status === "prepared",
    error: plan.status === "prepared" ? undefined : "BATCH_PARTIAL_VALIDATION_FAILED",
    issues: plan.issues,
    planId: plan.id,
    summary: plan.summary
  };
}

function queueIssueLabel(issue: { field?: string; message?: string; type?: string; cardId?: string; index?: number }) {
  return [issue.cardId, issue.message ?? issue.type ?? issue.field, typeof issue.index === "number" ? `#${issue.index + 1}` : ""].filter(Boolean).join(" · ");
}

export function CardWorkspace({ initialFeed = "", initialResult, labels, scope }: CardWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [feeds, setFeeds] = useState<string[]>(initialFeed ? [initialFeed] : []);
  const [kinds, setKinds] = useState<string[]>([]);
  const [lanes, setLanes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(initialResult);
  const [queueStates, setQueueStates] = useState<Record<string, QueueState>>({});
  const [selectedCardRegistry, setSelectedCardRegistry] = useState<Record<string, QueueDraftCard>>({});
  const [activeCardId, setActiveCardId] = useState(initialResult.cards[0]?.id ?? "");
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [publishStatus, setPublishStatus] = useState("");
  const [publishResult, setPublishResult] = useState<QueuePublishResponse | null>(null);
  const [batchPublishResult, setBatchPublishResult] = useState<QueueBatchPublishResponse | null>(null);
  const [batchPrepareResult, setBatchPrepareResult] = useState<QueueBatchPrepareResponse | null>(null);
  const [prepareStatus, setPrepareStatus] = useState("");
  const [serverDraftStatus, setServerDraftStatus] = useState("");
  const [publishCardId, setPublishCardId] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(() => new Set());
  const [isPending, startTransition] = useTransition();
  const visibleCardIds = useMemo(() => result.cards.map((card) => card.id), [result.cards]);
  const activeCard = result.cards.find((card) => card.id === activeCardId) ?? result.cards[0];
  const publishMatchesActiveCard = Boolean(activeCard && publishCardId === activeCard.id);
  const selectedVisibleCount = visibleCardIds.filter((cardId) => selectedCardIds.has(cardId)).length;
  const approvedSelectedCardIds = [...selectedCardIds].filter((cardId) => queueStateForCardId(cardId) === "approved");
  const allVisibleSelected = visibleCardIds.length > 0 && selectedVisibleCount === visibleCardIds.length;
  const lastPlan = batchPrepareResult?.plan ?? batchPublishResult?.plan;
  const planIssues = batchPrepareResult?.issues ?? batchPrepareResult?.plan?.issues ?? [];

  const queryKey = useMemo(
    () => JSON.stringify({ feeds, kinds, lanes, page, query, scope, statuses, tags }),
    [feeds, kinds, lanes, page, query, scope, statuses, tags]
  );

  useEffect(() => {
    const abort = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(initialResult.pageSize),
      query,
      scope
    });
    appendValues(params, "feed", feeds);
    appendValues(params, "kind", kinds);
    appendValues(params, "lane", lanes);
    appendValues(params, "status", statuses);
    appendValues(params, "tag", tags);

    startTransition(() => {
      void fetch(`/api/cards/query?${params.toString()}`, { signal: abort.signal })
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as { ok: true; result: ComposerCardQueryResult };
        })
        .then((payload) => {
          if (payload?.ok) setResult(payload.result);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    });

    return () => abort.abort();
  }, [feeds, initialResult.pageSize, kinds, lanes, page, query, queryKey, scope, statuses, tags]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const draft = readQueueDraft(scope);
      if (draft) {
        setDecisionNotes(draft.decisionNotes);
        setQueueStates(draft.queueStates);
        setSelectedCardRegistry(draft.selectedCards);
        setSelectedCardIds(new Set(Object.keys(draft.selectedCards)));
      }
      setIsDraftHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [scope]);

  useEffect(() => {
    if (!isDraftHydrated) return;
    writeQueueDraft(scope, {
      decisionNotes,
      queueStates,
      selectedCards: selectedCardRegistry,
      version: 1
    });
  }, [decisionNotes, isDraftHydrated, queueStates, scope, selectedCardRegistry]);

  function setReviewCard(cardId: string) {
    setActiveCardId(cardId);
    setPublishResult(null);
    setBatchPublishResult(null);
    setBatchPrepareResult(null);
    setPrepareStatus("");
    setPublishStatus("");
    setPublishCardId("");
  }

  function reset() {
    setQuery("");
    setFeeds(initialFeed ? [initialFeed] : []);
    setKinds([]);
    setLanes([]);
    setStatuses([]);
    setTags([]);
    setPage(1);
  }

  function updateFilter(update: () => void) {
    update();
    setPage(1);
  }

  function queueStateFor(card: { id: string; status: string }): QueueState {
    if (queueStates[card.id]) return queueStates[card.id];
    if (card.status === "approved" || card.status === "published") return "approved";
    if (card.status === "archived") return "held";
    return "reviewing";
  }

  function queueStateForCardId(cardId: string): QueueState {
    const visibleCard = result.cards.find((card) => card.id === cardId);
    if (visibleCard) return queueStateFor(visibleCard);
    const registeredCard = selectedCardRegistry[cardId];
    return registeredCard ? queueStateFor(registeredCard) : queueStates[cardId] ?? "reviewing";
  }

  function registerSelectedCard(card: { id: string; status: string }) {
    setSelectedCardRegistry((current) => ({
      ...current,
      [card.id]: { id: card.id, status: card.status }
    }));
  }

  function removeSelectedCards(cardIds: string[]) {
    setSelectedCardRegistry((current) => {
      const next = { ...current };
      for (const cardId of cardIds) delete next[cardId];
      return next;
    });
  }

  function toggleCardSelection(card: ComposerStreamCard) {
    setSelectedCardIds((current) => {
      const next = new Set(current);
      if (next.has(card.id)) {
        next.delete(card.id);
        removeSelectedCards([card.id]);
      } else {
        next.add(card.id);
        registerSelectedCard(card);
      }
      return next;
    });
  }

  function toggleVisibleSelection() {
    setSelectedCardIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        for (const cardId of visibleCardIds) next.delete(cardId);
        removeSelectedCards(visibleCardIds);
      } else {
        const registryUpdates: Record<string, QueueDraftCard> = {};
        for (const card of result.cards) {
          next.add(card.id);
          registryUpdates[card.id] = { id: card.id, status: card.status };
        }
        setSelectedCardRegistry((registry) => ({ ...registry, ...registryUpdates }));
      }
      return next;
    });
  }

  function applyQueueState(nextState: QueueState) {
    if (!selectedCardIds.size) return;
    setQueueStates((current) => {
      const next = { ...current };
      for (const cardId of selectedCardIds) next[cardId] = nextState;
      return next;
    });
  }

  function queueStateLabel(state: QueueState) {
    if (state === "approved") return labels.queueApproved;
    if (state === "held") return labels.queueHeld;
    return labels.queueReviewing;
  }

  function publishReadiness(card: ComposerStreamCard | undefined) {
    if (!card) return labels.publishNeedsApproved;
    if (queueStateFor(card) !== "approved") return labels.publishNeedsApproved;
    return labels.publishReady;
  }

  function canPublish(card: ComposerStreamCard | undefined) {
    return Boolean(card && queueStateFor(card) === "approved" && !isPublishing);
  }

  function canBatchPublish() {
    return Boolean(approvedSelectedCardIds.length && !isPublishing);
  }

  function canPrepareBatch() {
    return Boolean(approvedSelectedCardIds.length && !isPreparing);
  }

  function hasSuccessfulPublishResult() {
    return Boolean(publishResult?.ok || batchPublishResult?.collection);
  }

  function publishResultHeading() {
    if (isPublishing) return labels.loading;
    return hasSuccessfulPublishResult() ? labels.publishWrite : labels.publishFailed;
  }

  async function publishActiveCard() {
    if (!activeCard) return;
    setIsPublishing(true);
    setPublishResult(null);
    setBatchPublishResult(null);
    setBatchPrepareResult(null);
    setPrepareStatus("");
    setPublishCardId(activeCard.id);
    setPublishStatus(labels.loading);
    const response = await fetch("/api/cards/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cardId: activeCard.id,
        scope,
        queueState: queueStateFor(activeCard),
        decisionNotes: decisionNotes[activeCard.id] ?? ""
      })
    });
    const payload = (await response.json().catch(() => ({ ok: false, error: labels.publishFailed }))) as QueuePublishResponse;
    setPublishResult(payload);
    setPublishStatus(
      payload.ok
        ? `${labels.publishFeedItem} ${payload.collection?.id ?? labels.publishWrite}`
        : payload.issues?.map((issue) => issue.message ?? issue.type ?? issue.field).filter(Boolean).join("; ") || payload.error || labels.publishFailed
    );
    setIsPublishing(false);
  }

  async function publishSelectedCards() {
    if (!approvedSelectedCardIds.length) return;
    setIsPublishing(true);
    setPublishResult(null);
    setBatchPublishResult(null);
    setBatchPrepareResult(null);
    setPrepareStatus("");
    setPublishCardId(activeCard?.id ?? "");
    setPublishStatus(labels.loading);
    const response = await fetch("/api/cards/publish-batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scope,
        cards: approvedSelectedCardIds.map((cardId) => ({
          cardId,
          queueState: queueStateForCardId(cardId),
          decisionNotes: decisionNotes[cardId] ?? ""
        }))
      })
    });
    const payload = (await response.json().catch(() => ({ ok: false, error: labels.publishFailed }))) as QueueBatchPublishResponse;
    setBatchPublishResult(payload);
    const publishedCount = payload.collection?.totalCards ?? 0;
    const issueCount = payload.issues?.length ?? 0;
    setPublishStatus(
      publishedCount
        ? `${publishedCount} ${labels.cards} · ${payload.collection?.id ?? labels.publishWrite}${issueCount ? ` · ${issueCount} ${labels.publishNeedsReview}` : ""}`
        : payload.issues?.map((issue) => issue.message ?? issue.type ?? issue.field).filter(Boolean).join("; ") || payload.error || labels.publishFailed
    );
    setIsPublishing(false);
  }

  async function prepareSelectedCards() {
    if (!approvedSelectedCardIds.length) return;
    setIsPreparing(true);
    setPublishResult(null);
    setBatchPublishResult(null);
    setPublishStatus("");
    const response = await fetch("/api/cards/prepare-batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scope,
        cards: approvedSelectedCardIds.map((cardId) => ({
          cardId,
          queueState: queueStateForCardId(cardId),
          decisionNotes: decisionNotes[cardId] ?? ""
        }))
      })
    });
    const payload = (await response.json().catch(() => ({ ok: false, error: labels.publishFailed }))) as QueueBatchPrepareResponse;
    const plan = payload.plan;
    setBatchPrepareResult(payload);
    setPrepareStatus(
      plan
        ? `${plan.summary.publishable}/${plan.summary.requested} ${labels.preparePublishable} · ${plan.summary.needsReview} ${labels.publishNeedsReview} · ${labels.prepareLimit} ${plan.summary.cappedAt} · ${payload.persistedPlan ? labels.publishPlanSaved : plan.planId}`
        : payload.issues?.map((issue) => issue.message ?? issue.type ?? issue.field).filter(Boolean).join("; ") || payload.error || labels.publishFailed
    );
    setIsPreparing(false);
  }

  async function saveServerDraft() {
    setIsSavingDraft(true);
    const response = await fetch("/api/cards/queue-draft", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        decisionNotes,
        lastPlanId: lastPlan?.planId,
        lastPlanSummary: lastPlan?.summary ?? {},
        queueStates,
        scope,
        selectedCards: selectedCardRegistry
      })
    });
    const payload = (await response.json().catch(() => ({ ok: false, error: labels.publishFailed }))) as ServerQueueDraftResponse;
    setServerDraftStatus(payload.ok ? `${labels.serverDraftSaved} · ${payload.draft?.id ?? labels.serverDraft}` : payload.error ?? labels.publishFailed);
    setIsSavingDraft(false);
  }

  async function loadServerDraft() {
    setIsLoadingDraft(true);
    const response = await fetch(`/api/cards/queue-draft?scope=${encodeURIComponent(scope)}`);
    const payload = (await response.json().catch(() => ({ ok: false, error: labels.publishFailed }))) as ServerQueueDraftResponse;
    if (payload.ok && payload.draft) {
      const loadedSelectedCards = selectedCardRecord(payload.draft.selectedCards);
      setDecisionNotes(stringRecord(payload.draft.decisionNotes));
      setQueueStates(queueStateRecord(payload.draft.queueStates));
      setSelectedCardRegistry(loadedSelectedCards);
      setSelectedCardIds(new Set(Object.keys(loadedSelectedCards)));
      setServerDraftStatus(`${labels.serverDraftLoaded} · ${payload.draft.id}`);
      if (payload.draft.lastPlanId) {
        const planResponse = await fetch(`/api/cards/publish-plan?planId=${encodeURIComponent(payload.draft.lastPlanId)}`);
        const planPayload = (await planResponse.json().catch(() => ({ ok: false, error: labels.publishFailed }))) as ServerQueuePublishPlanResponse;
        if (planPayload.ok && planPayload.plan) {
          const loadedPlan = queuePlanFromServer(planPayload.plan);
          setBatchPrepareResult({
            ok: loadedPlan.ok,
            error: loadedPlan.error,
            issues: loadedPlan.issues,
            plan: loadedPlan,
            persistedPlan: planPayload.plan
          });
          setPrepareStatus(
            `${loadedPlan.summary.publishable}/${loadedPlan.summary.requested} ${labels.preparePublishable} · ${loadedPlan.summary.needsReview} ${labels.publishNeedsReview} · ${labels.publishPlanLoaded}`
          );
        }
      }
    } else {
      setServerDraftStatus(payload.ok ? labels.serverDraftEmpty : payload.error ?? labels.publishFailed);
    }
    setIsLoadingDraft(false);
  }

  return (
    <>
      <section className="panel filter-board" aria-label={labels.search}>
        <div className="filter-summary">
          <div>
            <h2>
              {result.totalCards} {labels.visible}
            </h2>
            <p>
              {labels.pagedResults}: {result.cards.length} {labels.cards} · {labels.queryBoundary}
              {isPending ? ` · ${labels.loading}` : ""}
            </p>
            <p className="query-state-line">
              {labels.queryWindow}: {result.pageState.windowStart}-{result.pageState.windowEnd} · {labels.queryCache}: {result.pageState.cacheKey}
            </p>
          </div>
          <button className="secondary-button" type="button" onClick={reset}>
            <X aria-hidden="true" size={15} />
            {labels.reset}
          </button>
        </div>
        <label className="search-field">
          <span>{labels.search}</span>
          <div>
            <Search aria-hidden="true" size={16} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={labels.searchPlaceholder}
            />
          </div>
        </label>

        <div className="filter-columns">
          <FilterGroup label={labels.feed} options={result.facets.feeds} selected={feeds} onToggle={(value) => updateFilter(() => setFeeds((current) => toggle(current, value)))} />
          <FilterGroup label={labels.type} options={result.facets.kinds} selected={kinds} onToggle={(value) => updateFilter(() => setKinds((current) => toggle(current, value)))} />
          <FilterGroup label={labels.lane} options={result.facets.lanes} selected={lanes} onToggle={(value) => updateFilter(() => setLanes((current) => toggle(current, value)))} />
          <FilterGroup label={labels.status} options={result.facets.statuses} selected={statuses} onToggle={(value) => updateFilter(() => setStatuses((current) => toggle(current, value)))} />
          <FilterGroup label={labels.tags} options={result.facets.tags} selected={tags} onToggle={(value) => updateFilter(() => setTags((current) => toggle(current, value)))} />
        </div>
      </section>

      <section className="panel queue-board" aria-label={labels.queueLabel}>
        <div className="queue-summary">
          <div>
            <h2>{labels.queueLabel}</h2>
            <p>
              {result.cards.length} {labels.queueVisible} · {selectedVisibleCount} {labels.queueVisibleSelected} · {selectedCardIds.size} {labels.queueSelected} · {labels.queueSessionOnly}
            </p>
            {selectedCardIds.size ? (
              <p className="queue-batch-summary">
                {approvedSelectedCardIds.length} / {selectedCardIds.size} {labels.publishBatchReady}
              </p>
            ) : null}
          </div>
          <div className="queue-actions">
            <button className="secondary-button" type="button" onClick={toggleVisibleSelection} disabled={!result.cards.length} title={labels.selectVisibleHelp}>
              {allVisibleSelected ? <SquareCheck aria-hidden="true" size={16} /> : <Square aria-hidden="true" size={16} />}
              {labels.selectVisible}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSelectedCardIds(new Set());
                setSelectedCardRegistry({});
              }}
              disabled={!selectedCardIds.size}
              title={labels.clearSelectionHelp}
            >
              <X aria-hidden="true" size={15} />
              {labels.clearSelection}
            </button>
          </div>
        </div>
        <div className="queue-actions queue-actions-compact" aria-label={labels.queueStateLabel}>
          <button className="secondary-button" type="button" onClick={() => applyQueueState("reviewing")} disabled={!selectedCardIds.size} title={labels.markReviewingHelp}>
            <CircleDot aria-hidden="true" size={16} />
            {labels.markReviewing}
          </button>
          <button className="secondary-button" type="button" onClick={() => applyQueueState("approved")} disabled={!selectedCardIds.size} title={labels.approveSelectedHelp}>
            <CheckCircle2 aria-hidden="true" size={16} />
            {labels.approveSelected}
          </button>
          <button className="secondary-button" type="button" onClick={() => applyQueueState("held")} disabled={!selectedCardIds.size} title={labels.holdSelectedHelp}>
            <PauseCircle aria-hidden="true" size={16} />
            {labels.holdSelected}
          </button>
        </div>
      </section>

      {activeCard ? (
        <section className="panel queue-detail-panel" aria-label={labels.reviewDetailLabel}>
          <div className="queue-detail-main">
            <div>
              <p className="eyebrow">{labels.reviewDetailLabel}</p>
              <h2>{activeCard.title}</h2>
              <p>{activeCard.subtitle ?? activeCard.excerpt ?? activeCard.body}</p>
            </div>
            <span className={`composerQueuePill composerQueuePill-${queueStateFor(activeCard)}`}>{queueStateLabel(queueStateFor(activeCard))}</span>
          </div>
          <div className="queue-detail-grid">
            <div className="queue-detail-card">
              <dl className="detail-meta compact-detail-meta">
                <div>
                  <dt>{labels.type}</dt>
                  <dd>{displayComposerValue(activeCard.kind)}</dd>
                </div>
                <div>
                  <dt>{labels.feed}</dt>
                  <dd>{getComposerCardFeeds(activeCard).map(displayComposerValue).join(", ")}</dd>
                </div>
                <div>
                  <dt>{labels.lane}</dt>
                  <dd>{displayComposerValue(cardLane(activeCard) || activeCard.kind)}</dd>
                </div>
                <div>
                  <dt>{labels.status}</dt>
                  <dd>{displayComposerValue(activeCard.status)}</dd>
                </div>
              </dl>
              <div className="queue-readiness">
                <strong>{labels.publishEligibility}</strong>
                <span>{publishReadiness(activeCard)}</span>
              </div>
              {(publishMatchesActiveCard || batchPublishResult) && publishStatus ? (
                <div className={isPublishing || hasSuccessfulPublishResult() ? "queue-publish-result queue-publish-result-good" : "queue-publish-result"}>
                  <strong>{publishResultHeading()}</strong>
                  <span>{publishStatus}</span>
                </div>
              ) : null}
              {batchPrepareResult && prepareStatus ? (
                <div className={batchPrepareResult.plan?.summary.publishable ? "queue-publish-result queue-publish-result-good" : "queue-publish-result"}>
                  <strong>{labels.preparePlan}</strong>
                  <span>{prepareStatus}</span>
                </div>
              ) : null}
              {planIssues.length ? (
                <div className="queue-publish-result">
                  <strong>{labels.publishPlanIssues}</strong>
                  <span>{planIssues.slice(0, 3).map(queueIssueLabel).join("; ")}</span>
                </div>
              ) : null}
              {serverDraftStatus ? (
                <div className="queue-publish-result queue-publish-result-good">
                  <strong>{labels.serverDraft}</strong>
                  <span>{serverDraftStatus}</span>
                </div>
              ) : null}
            </div>
            <div className="queue-detail-form">
              <label>
                <span>{labels.reviewNotes}</span>
                <textarea value={decisionNotes[activeCard.id] ?? ""} onChange={(event) => setDecisionNotes((current) => ({ ...current, [activeCard.id]: event.target.value }))} placeholder={labels.reviewNotesPlaceholder} />
              </label>
              <button className="primary-button" disabled={!canPublish(activeCard)} onClick={publishActiveCard} title={labels.publishPrivateFeedHelp} type="button">
                <Send aria-hidden="true" size={16} />
                {labels.publishPrivateFeed}
              </button>
              <button className="secondary-button" disabled={!canPrepareBatch()} onClick={prepareSelectedCards} title={labels.prepareBatchHelp} type="button">
                <ClipboardCheck aria-hidden="true" size={16} />
                {isPreparing ? labels.loading : labels.prepareBatch}
              </button>
              <button className="secondary-button" disabled={isSavingDraft || isLoadingDraft} onClick={saveServerDraft} title={labels.saveQueueDraftHelp} type="button">
                <Save aria-hidden="true" size={16} />
                {isSavingDraft ? labels.loading : labels.saveQueueDraft}
              </button>
              <button className="secondary-button" disabled={isSavingDraft || isLoadingDraft} onClick={loadServerDraft} title={labels.loadQueueDraftHelp} type="button">
                <ClipboardCheck aria-hidden="true" size={16} />
                {isLoadingDraft ? labels.loading : labels.loadQueueDraft}
              </button>
              <button className="secondary-button" disabled={!canBatchPublish()} onClick={publishSelectedCards} title={labels.publishBatchPrivateFeedHelp} type="button">
                <Send aria-hidden="true" size={16} />
                {labels.publishBatchPrivateFeed}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {result.cards.length ? (
        <section className="composerCardGrid composerPublishedCardGrid" aria-label={labels.cardPreviewLabel}>
          {result.cards.map((card) => {
            const image = getComposerCardImage(card);
            const feedsForCard = getComposerCardFeeds(card);
            const queueState = queueStateFor(card);
            const isSelected = selectedCardIds.has(card.id);
            return (
              <article
                className={
                  [
                    "composerCardSurface composerCardPreview composerPublishedCard astraPublishedCard",
                    isSelected ? "composerCardSelected" : "",
                    activeCard?.id === card.id ? "composerCardActive" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                key={card.id}
              >
                <div className="composerQueueCardBar">
                  <label className="composerQueueSelect">
                    <input checked={isSelected} onChange={() => toggleCardSelection(card)} title={`${labels.selectCardHelp} ${card.title}`} type="checkbox" />
                    <span>
                      {labels.selectCard}: {card.title}
                    </span>
                  </label>
                  <div className="composerQueueCardActions">
                    <span className={`composerQueuePill composerQueuePill-${queueState}`}>{queueStateLabel(queueState)}</span>
                    <button className="composerReviewButton" type="button" onClick={() => setReviewCard(card.id)} aria-label={`${labels.reviewCard}: ${card.title}`} title={labels.reviewCardHelp}>
                      <Eye aria-hidden="true" size={15} />
                    </button>
                    <Link className="composerReviewButton" href={`/cards/${encodeURIComponent(card.id)}`} aria-label={`${labels.cardDetail}: ${card.title}`} title={labels.cardDetailHelp}>
                      <Pencil aria-hidden="true" size={15} />
                    </Link>
                  </div>
                </div>
                <div className="astraPublishedCardOpen">
                  <div className="astraPublishedCardContent">
                    <div className="astraPublishedCardHeader">
                      <p className="eyebrow astraPublishedCardEyebrow">{displayComposerValue(card.seriesId ?? card.lane ?? card.kind)}</p>
                      <h2 className="astraPublishedCardTitle">{card.title}</h2>
                    </div>
                    <PublishedCardBody text={card.excerpt ?? card.subtitle ?? card.body} showLessLabel={labels.showLess} showMoreLabel={labels.showMore} />
                    <div className="astraPublishedCardMeta">
                      <span>{displayComposerValue(card.kind)}</span>
                      {feedsForCard.slice(0, 2).map((feed) => (
                        <span key={feed}>{displayComposerValue(feed)}</span>
                      ))}
                    </div>
                  </div>
                  <div className="composerPublishedCardMedia astraPublishedCardMedia" style={image ? { backgroundImage: `url("${image}")` } : undefined} />
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="panel no-results">
          <h2>{labels.noCards}</h2>
          <p>{labels.noCardsDetail}</p>
        </section>
      )}

      <nav className="pager-row" aria-label={labels.pagedResults}>
        <button className="secondary-button" disabled={result.page <= 1 || isPending} type="button" onClick={() => setPage((current) => Math.max(1, current - 1))}>
          <ChevronLeft aria-hidden="true" size={16} />
          {labels.previousPage}
        </button>
        <span>
          {labels.page} {result.page} / {result.pageCount}
        </span>
        <button className="secondary-button" disabled={result.page >= result.pageCount || isPending} type="button" onClick={() => setPage((current) => Math.min(result.pageCount, current + 1))}>
          {labels.nextPage}
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </nav>
    </>
  );
}

function FilterGroup({
  label,
  onToggle,
  options,
  selected
}: {
  label: string;
  onToggle: (value: string) => void;
  options: Array<[string, number]>;
  selected: string[];
}) {
  return (
    <div className="filter-group">
      <span>{label}</span>
      <div>
        {options.map(([value, count]) => (
          <FilterButton active={selected.includes(value)} count={count} key={value} label={displayComposerValue(value)} onClick={() => onToggle(value)} />
        ))}
      </div>
    </div>
  );
}
