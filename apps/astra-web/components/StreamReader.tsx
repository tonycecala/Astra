"use client";

import { PublishedCard } from "@astra/ui";
import { Bookmark, Heart, MessageCircle, X } from "lucide-react";
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
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0];
  if (dateOnly) {
    const [year, month, day] = dateOnly.split("-").map(Number);
    return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(year, month - 1, day));
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function cardDebugTitle(item: JourneyStreamCard["item"]) {
  const labels = [itemKindLabel(item.kind), audienceLabel(item.audience), ui.journey.statuses[item.status], publishedDate(item.publishedAt)];
  return [...new Set(labels)].join(" | ");
}

export function StreamReader({ streamCards }: { streamCards: JourneyStreamCard[] }) {
  const [activeLane, setActiveLane] = useState<LaneFilter>("all");
  const [activeCardId, setActiveCardId] = useState(streamCards[0]?.card.id ?? "");
  const [savedCardIds, setSavedCardIds] = useState<Set<string>>(() => new Set());
  const [reflectedCardIds, setReflectedCardIds] = useState<Set<string>>(() => new Set());
  const isComposerSelection = streamCards.length > 0 && streamCards.every(({ item }) => item.source === "composer_selection" || item.source === "composer_public");

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
    <div className={isComposerSelection ? "reader-shell reader-shell-composer" : "reader-shell"}>
      <div className="reader-toolbar">
        <div aria-label={ui.journey.laneFilterLabel} className="lane-tabs" role="tablist">
          {laneOrder.map((lane) => (
            <button aria-selected={activeLane === lane} className="lane-tab" key={lane} onClick={() => setActiveLane(lane)} role="tab" type="button">
              {laneLabel(lane)}
            </button>
          ))}
        </div>
        {isComposerSelection ? null : (
          <div className="reader-stats" aria-live="polite">
            <span className="pill">{ui.journey.savedCount(savedCardIds.size)}</span>
            <span className="pill">{ui.journey.reflectedCount(reflectedCardIds.size)}</span>
          </div>
        )}
      </div>

      <div className="reader-layout">
        <section className={isComposerSelection ? "grid composer-card-grid" : "grid"} aria-label={ui.journey.streamCardsLabel}>
          {visibleCards.length ? (
            visibleCards.map(({ item, card }) => {
              const isSaved = savedCardIds.has(card.id);
              const isReflected = reflectedCardIds.has(card.id);
              return (
                <article className="card stream-card astraPublishedCard" key={item.id}>
                  <PublishedCard
                    bodyText={card.body}
                    className="stream-card-open"
                    contentClassName="stream-card-content"
                    eyebrow={laneLabel(card.lane)}
                    imageUrl={card.imageUrl}
                    mediaClassName="stream-card-media astraStreamArtFrame"
                    onOpen={() => setActiveCardId(card.id)}
                    showLessLabel={ui.journey.showLess}
                    showMoreLabel={ui.journey.showMore}
                    title={card.title}
                    titleAttribute={cardDebugTitle(item)}
                  />
                  <div className="astraStreamSocialBlock astraFeedCardActions" aria-label={ui.journey.socialActionsFor(card.title)}>
                    <div className="astraStreamSocialActions astraStreamSocialActionsBar">
                      <div className="astraStreamSocialActionsLeft">
                        <button
                          aria-label={ui.journey.likeCard(card.title)}
                          aria-pressed={isReflected}
                          className={`astraStreamIconAction${isReflected ? " astraStreamIconActionActive" : ""}`}
                          onClick={() => toggleSet(card.id, setReflectedCardIds, reflectedCardIds)}
                          type="button"
                        >
                          <Heart size={20} aria-hidden="true" />
                        </button>
                        <button
                          aria-label={ui.journey.commentOnCard(card.title)}
                          aria-pressed={isReflected}
                          className={`astraStreamIconAction${isReflected ? " astraStreamIconActionActive" : ""}`}
                          onClick={() => toggleSet(card.id, setReflectedCardIds, reflectedCardIds)}
                          type="button"
                        >
                          <MessageCircle size={20} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="astraStreamSocialActionsRight">
                        <button
                          aria-label={ui.journey.saveCardAria(card.title)}
                          aria-pressed={isSaved}
                          className={`astraStreamIconAction${isSaved ? " astraStreamIconActionActive" : ""}`}
                          onClick={() => toggleSet(card.id, setSavedCardIds, savedCardIds)}
                          type="button"
                        >
                          <Bookmark size={20} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
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

        {activeCard && !isComposerSelection ? (
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
