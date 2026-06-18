import "server-only";

import type { AstraCard, ComposerAvailabilityCard, ComposerSelectionResponse, StreamItem, UserFeedItem } from "@astra/contracts";
import { db, listUserFeedItems, readFoundationSnapshot, seedSnapshot } from "@astra/db";
import { selectComposerCardsForUser } from "./composer-selection";

type JourneyKind = StreamItem["kind"] | "source_card" | "report_signal" | "manual" | "composer_selected";
type JourneyStatus = StreamItem["status"] | UserFeedItem["state"];
type JourneyAudience = StreamItem["audience"] | "private" | "public_fallback" | "composer_selected";

export type JourneyComposerSelectionInput = {
  enabled?: boolean;
  requestType?: "course" | "series" | "pool" | "ordered_list" | "onboarding";
  id?: string;
  selectionDate?: string;
  count?: number;
  eligibility?: Record<string, unknown>;
};

export type JourneyStreamCard = {
  item: {
    id: string;
    kind: JourneyKind;
    status: JourneyStatus;
    audience: JourneyAudience;
    publishedAt: string;
      source: "private_feed" | "public_fallback" | "composer_selection";
    };
    card: AstraCard;
  };

export type JourneyViewModel = {
  mode: "private" | "public_fallback" | "composer_selected";
  streamCards: JourneyStreamCard[];
  feedState: "private_ready" | "private_empty" | "public_preview" | "composer_selected";
  composerSelection?: {
    id: string;
    collectionTitle: string;
    reasonCode: string;
    selectionMode: ComposerSelectionResponse["selectionMode"];
  };
};

type LegacyStreamItem = StreamItem;
type LegacyCard = AstraCard;

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function payloadLane(payload: Record<string, unknown>, fallback: AstraCard["lane"]): AstraCard["lane"] {
  const value = payloadString(payload, "lane");
  if (value === "today" || value === "know_yourself" || value === "myth_and_symbol" || value === "practice" || value === "gift") {
    return value;
  }
  return fallback;
}

function payloadTone(payload: Record<string, unknown>, fallback: AstraCard["tone"]): AstraCard["tone"] {
  const value = payloadString(payload, "tone");
  if (value === "calm" || value === "bright" || value === "grounded" || value === "ceremonial") return value;
  return fallback;
}

function laneForFeedKind(kind: UserFeedItem["feedKind"]): AstraCard["lane"] {
  if (kind === "report_signal" || kind === "artifact") return "know_yourself";
  if (kind === "achievement" || kind === "source_card" || kind === "manual") return "today";
  if (kind === "ally") return "myth_and_symbol";
  if (kind === "gift") return "gift";
  return "practice";
}

function cardFromFeedItem(item: UserFeedItem): AstraCard {
  const payload = item.displayPayload;
  const fallbackLane = laneForFeedKind(item.feedKind);
  return {
    id: item.id,
    title: item.title,
    subtitle: payloadString(payload, "subtitle"),
    body: item.body,
    lane: payloadLane(payload, fallbackLane),
    tone: payloadTone(payload, "grounded"),
    ctaLabel: payloadString(payload, "ctaLabel"),
    ctaAction: payloadString(payload, "ctaAction") as AstraCard["ctaAction"] | undefined,
    imageUrl: payloadString(payload, "imageUrl"),
    publishedAt: item.availableAt
  };
}

function privateStreamCard(item: UserFeedItem): JourneyStreamCard {
  return {
    item: {
      id: item.id,
      kind: item.feedKind,
      status: item.state,
      audience: "private",
      publishedAt: item.availableAt,
      source: "private_feed"
    },
    card: cardFromFeedItem(item)
  };
}

function publicFallbackStreamCard(item: LegacyStreamItem, card: LegacyCard): JourneyStreamCard {
  return {
    item: {
      id: item.id,
      kind: item.kind,
      status: item.status,
      audience: "public_fallback",
      publishedAt: card.publishedAt,
      source: "public_fallback"
    },
    card
  };
}

function laneForSelectedCard(card: ComposerAvailabilityCard): AstraCard["lane"] {
  if (card.ontologyType === "quiz" || card.ontologyType === "test" || card.ontologyType === "certification") return "practice";
  if (card.ontologyType === "reflection") return "know_yourself";
  if (card.ontologyType === "art") return "myth_and_symbol";
  return "today";
}

function selectedComposerStreamCard(card: ComposerAvailabilityCard, index: number, selection: ComposerSelectionResponse): JourneyStreamCard {
  const publishedAt = `${selection.request.selectionDate ?? selection.generatedAt.slice(0, 10)}T00:00:00.000Z`;
  return {
    item: {
      id: `${selection.id}:${card.id}`,
      kind: "composer_selected",
      status: "available",
      audience: "composer_selected",
      publishedAt,
      source: "composer_selection"
    },
    card: {
      id: `composer_selected:${selection.id}:${card.id}`,
      title: card.title,
      subtitle: card.sectionTitle ?? card.collectionTitle,
      body: card.excerpt ?? card.body,
      lane: laneForSelectedCard(card),
      tone: index === 0 ? "bright" : "grounded",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: card.imageUrl,
      publishedAt
    }
  };
}

async function getPublicFallbackJourney(): Promise<JourneyStreamCard[]> {
  const snapshot = await readFoundationSnapshot(db);
  const cardsById = new Map(snapshot.cards.map((card) => [card.id, card]));
  const publicPreviewIds = new Set(seedSnapshot().streamItems.map((item) => item.id));

  const currentPublicPreview = snapshot.streamItems.filter((item) => publicPreviewIds.has(item.id));
  const streamItems = currentPublicPreview.length ? currentPublicPreview : snapshot.streamItems;

  return [...streamItems]
    .sort((a, b) => a.position - b.position)
    .slice(0, 12)
    .map((item) => {
      const card = cardsById.get(item.cardId);
      if (!card) throw new Error(`Missing card for stream item ${item.id}`);
      return publicFallbackStreamCard(item, card);
    });
}

export async function getJourneyViewModel(userId?: string, composerSelectionInput: JourneyComposerSelectionInput = {}): Promise<JourneyViewModel> {
  if (composerSelectionInput.enabled) {
    const selection = await selectComposerCardsForUser({
      userKey: userId ?? "anonymous",
      requestType: composerSelectionInput.requestType ?? "course",
      id: composerSelectionInput.id ?? "astrology_101",
      selectionDate: composerSelectionInput.selectionDate,
      count: composerSelectionInput.count ?? 5,
      eligibility: composerSelectionInput.eligibility ?? {},
      limit: 100
    });
    return {
      mode: "composer_selected",
      feedState: "composer_selected",
      streamCards: selection.selectedCards.map((card, index) => selectedComposerStreamCard(card, index, selection)),
      composerSelection: {
        id: selection.id,
        collectionTitle: selection.availability.collection.title,
        reasonCode: selection.reasonCode,
        selectionMode: selection.selectionMode
      }
    };
  }

  if (!userId) {
    return {
      mode: "public_fallback",
      feedState: "public_preview",
      streamCards: await getPublicFallbackJourney()
    };
  }

  const feed = await listUserFeedItems(db, { userId, state: "available", limit: 50 });
  return {
    mode: "private",
    feedState: feed.items.length ? "private_ready" : "private_empty",
    streamCards: feed.items.map(privateStreamCard)
  };
}
