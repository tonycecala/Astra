import "server-only";

import type { AstraCard, StreamItem, UserFeedItem } from "@astra/contracts";
import { db, listUserFeedItems, readFoundationSnapshot } from "@astra/db";

type JourneyKind = StreamItem["kind"] | "source_card" | "report_signal" | "manual";
type JourneyStatus = StreamItem["status"] | UserFeedItem["state"];
type JourneyAudience = StreamItem["audience"] | "private" | "public_fallback";

export type JourneyStreamCard = {
  item: {
    id: string;
    kind: JourneyKind;
    status: JourneyStatus;
    audience: JourneyAudience;
    publishedAt: string;
    source: "private_feed" | "public_fallback";
  };
  card: AstraCard;
};

export type JourneyViewModel = {
  mode: "private" | "public_fallback";
  streamCards: JourneyStreamCard[];
  feedState: "private_ready" | "private_empty" | "public_preview";
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

async function getPublicFallbackJourney(): Promise<JourneyStreamCard[]> {
  const snapshot = await readFoundationSnapshot(db);
  const cardsById = new Map(snapshot.cards.map((card) => [card.id, card]));

  return [...snapshot.streamItems]
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const card = cardsById.get(item.cardId);
      if (!card) throw new Error(`Missing card for stream item ${item.id}`);
      return publicFallbackStreamCard(item, card);
    });
}

export async function getJourneyViewModel(userId?: string): Promise<JourneyViewModel> {
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
