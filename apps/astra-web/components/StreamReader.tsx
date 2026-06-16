"use client";

import { Bookmark, Check, MessageCircle, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ui } from "../lib/i18n";
import type { JourneyStreamCard } from "../lib/journey";

type Lane = JourneyStreamCard["card"]["lane"];
type LaneFilter = Lane | "all";

const laneOrder: LaneFilter[] = ["all", "today", "know_yourself", "myth_and_symbol", "practice", "gift"];

function laneLabel(lane: LaneFilter) {
  if (lane === "all") return ui.journey.allLanes;
  return ui.journey.lanes[lane];
}

function itemKindLabel(kind: JourneyStreamCard["item"]["kind"]) {
  return ui.journey.itemKinds[kind];
}

function audienceLabel(audience: JourneyStreamCard["item"]["audience"]) {
  return ui.journey.audiences[audience];
}

function publishedDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function StreamReader({ streamCards }: { streamCards: JourneyStreamCard[] }) {
  const [activeLane, setActiveLane] = useState<LaneFilter>("all");
  const [activeCardId, setActiveCardId] = useState(streamCards[0]?.card.id ?? "");
  const [savedCardIds, setSavedCardIds] = useState<Set<string>>(() => new Set());
  const [reflectedCardIds, setReflectedCardIds] = useState<Set<string>>(() => new Set());

  const visibleCards = useMemo(() => {
    if (activeLane === "all") return streamCards;
    return streamCards.filter(({ card }) => card.lane === activeLane);
  }, [activeLane, streamCards]);

  const activeView = streamCards.find(({ card }) => card.id === activeCardId) ?? visibleCards[0] ?? streamCards[0];
  const activeCard = activeView?.card;

  function toggleSet(cardId: string, setter: (next: Set<string>) => void, current: Set<string>) {
    const next = new Set(current);
    if (next.has(cardId)) {
      next.delete(cardId);
    } else {
      next.add(cardId);
    }
    setter(next);
  }

  return (
    <div className="reader-shell">
      <div className="reader-toolbar">
        <div aria-label={ui.journey.laneFilterLabel} className="lane-tabs" role="tablist">
          {laneOrder.map((lane) => (
            <button aria-selected={activeLane === lane} className="lane-tab" key={lane} onClick={() => setActiveLane(lane)} role="tab" type="button">
              {laneLabel(lane)}
            </button>
          ))}
        </div>
        <div className="reader-stats" aria-live="polite">
          <span className="pill">{ui.journey.savedCount(savedCardIds.size)}</span>
          <span className="pill">{ui.journey.reflectedCount(reflectedCardIds.size)}</span>
        </div>
      </div>

      <div className="reader-layout">
        <section className="grid" aria-label={ui.journey.streamCardsLabel}>
          {visibleCards.length ? (
            visibleCards.map(({ item, card }) => {
              const isSaved = savedCardIds.has(card.id);
              const isReflected = reflectedCardIds.has(card.id);
              return (
                <article className="card stream-card" key={item.id}>
                  <button className="stream-card-open" onClick={() => setActiveCardId(card.id)} type="button">
                    <span className="art" aria-hidden="true" />
                    <span>
                      <span className="eyebrow">{laneLabel(card.lane)}</span>
                      <span className="stream-card-title">{card.title}</span>
                      <span className="stream-card-body">{card.body}</span>
                      <span className="stream-card-meta">
                        <span>{itemKindLabel(item.kind)}</span>
                        <span>{audienceLabel(item.audience)}</span>
                        <span>{publishedDate(item.publishedAt)}</span>
                      </span>
                    </span>
                  </button>
                  <div className="card-actions">
                    <button aria-pressed={isSaved} className="icon-action" onClick={() => toggleSet(card.id, setSavedCardIds, savedCardIds)} type="button">
                      {isSaved ? <Check size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
                      <span>{isSaved ? ui.journey.savedCard : ui.journey.saveCard}</span>
                    </button>
                    <button aria-pressed={isReflected} className="icon-action" onClick={() => toggleSet(card.id, setReflectedCardIds, reflectedCardIds)} type="button">
                      {isReflected ? <Check size={16} aria-hidden="true" /> : <MessageCircle size={16} aria-hidden="true" />}
                      <span>{isReflected ? ui.journey.reflectedCard : ui.journey.reflectCard}</span>
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <article className="card">
              <h2>{ui.journey.emptyTitle}</h2>
              <p>{ui.journey.emptyBody}</p>
            </article>
          )}
        </section>

        {activeCard ? (
          <aside aria-label={ui.journey.detailLabel} className="card reader-detail">
            <button aria-label={ui.journey.closeDetail} className="detail-close" onClick={() => setActiveCardId("")} type="button">
              <X size={17} aria-hidden="true" />
            </button>
            <div className="eyebrow">{laneLabel(activeCard.lane)}</div>
            <h2>{activeCard.title}</h2>
            {activeCard.subtitle ? <p className="detail-subtitle">{activeCard.subtitle}</p> : null}
            <p>{activeCard.body}</p>
            {activeView ? (
              <dl className="detail-meta" aria-label={ui.journey.detailMetaLabel}>
                <div>
                  <dt>{ui.journey.detailKind}</dt>
                  <dd>{itemKindLabel(activeView.item.kind)}</dd>
                </div>
                <div>
                  <dt>{ui.journey.detailStatus}</dt>
                  <dd>{ui.journey.statuses[activeView.item.status]}</dd>
                </div>
                <div>
                  <dt>{ui.journey.detailAudience}</dt>
                  <dd>{audienceLabel(activeView.item.audience)}</dd>
                </div>
              </dl>
            ) : null}
            <div className="card-actions detail-actions">
              <button aria-pressed={savedCardIds.has(activeCard.id)} className="icon-action" onClick={() => toggleSet(activeCard.id, setSavedCardIds, savedCardIds)} type="button">
                <Bookmark size={16} aria-hidden="true" />
                <span>{savedCardIds.has(activeCard.id) ? ui.journey.savedCard : ui.journey.saveCard}</span>
              </button>
              <button aria-pressed={reflectedCardIds.has(activeCard.id)} className="icon-action" onClick={() => toggleSet(activeCard.id, setReflectedCardIds, reflectedCardIds)} type="button">
                <MessageCircle size={16} aria-hidden="true" />
                <span>{reflectedCardIds.has(activeCard.id) ? ui.journey.reflectedCard : ui.journey.reflectCard}</span>
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
