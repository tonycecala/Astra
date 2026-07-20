import "server-only";

import type { AstraCard, StreamItem, UserFeedItem } from "@astra/contracts";
import { db, listUserFeedItems, readFoundationSnapshot, seedSnapshot } from "@astra/db";
import { fetchComposerAvailability } from "./composer-selection";
import { ui } from "./i18n";
import { buildPublicComposerPreview, PUBLIC_COMPOSER_SAMPLE_COUNT } from "./public-composer-preview";

export type JourneyStep = {
  item: UserFeedItem;
  card: AstraCard;
  primaryAction?: { href: string; label: string };
  provenance: string;
};
export type PublicJourneyCard = { item: StreamItem | { id: string }; card: AstraCard };
export type JourneyViewModel = { currentStep?: JourneyStep; queue: JourneyStep[]; saved: JourneyStep[] };

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function laneForFeedKind(kind: UserFeedItem["feedKind"]): AstraCard["lane"] {
  if (kind === "report_signal" || kind === "artifact") return "know_yourself";
  if (kind === "ally") return "myth_and_symbol";
  if (kind === "gift") return "gift";
  return kind === "manual" ? "practice" : "today";
}

function reportRequestId(item: UserFeedItem) {
  const signal = item.displayPayload.publicSignal;
  if (!signal || typeof signal !== "object" || Array.isArray(signal)) return undefined;
  return payloadString(signal as Record<string, unknown>, "reportId");
}

function primaryActionFor(item: UserFeedItem): JourneyStep["primaryAction"] {
  const label = payloadString(item.displayPayload, "ctaLabel") ?? ui.journey.openStep;
  if (item.feedKind === "report_signal" || item.feedKind === "artifact") {
    const reportId = reportRequestId(item) ?? item.artifactId;
    return { href: reportId ? `/library?reportId=${encodeURIComponent(reportId)}` : "/library", label };
  }
  if (item.feedKind === "ally") return { href: "/allies", label };
  if (item.feedKind === "gift") return { href: "/gifts", label };
  if (item.feedKind === "achievement") return { href: "/self", label };
  return undefined;
}

function provenanceFor(item: UserFeedItem) {
  if (item.reasonCode === "explicit_report_signal_publish") return ui.journey.provenance.report;
  if (item.reasonCode.includes("onboarding")) return ui.journey.provenance.onboarding;
  if (item.feedKind === "ally") return ui.journey.provenance.ally;
  if (item.feedKind === "gift") return ui.journey.provenance.gift;
  return ui.journey.provenance.privateJourney;
}

function stepFromFeedItem(item: UserFeedItem): JourneyStep {
  return {
    item,
    primaryAction: primaryActionFor(item),
    provenance: provenanceFor(item),
    card: {
      id: item.id,
      title: item.title,
      subtitle: payloadString(item.displayPayload, "subtitle"),
      body: item.body,
      lane: laneForFeedKind(item.feedKind),
      tone: "grounded",
      imageUrl: payloadString(item.displayPayload, "imageUrl"),
      publishedAt: item.availableAt
    }
  };
}

export async function getJourneyViewModel(userId: string): Promise<JourneyViewModel> {
  const [available, saved] = await Promise.all([
    listUserFeedItems(db, { userId, state: "available", limit: 50 }),
    listUserFeedItems(db, { userId, state: "saved", limit: 50 })
  ]);
  const steps = available.items.map(stepFromFeedItem);
  return { currentStep: steps[0], queue: steps.slice(1), saved: saved.items.map(stepFromFeedItem) };
}

export async function getPublicJourneyPreview(): Promise<PublicJourneyCard[]> {
  try {
    const availability = await fetchComposerAvailability({ requestType: "pool", id: "public", cardIds: [], limit: PUBLIC_COMPOSER_SAMPLE_COUNT });
    const preview = buildPublicComposerPreview(availability, ui.journey.openCard);
    if (preview.length) return preview;
  } catch (error) {
    console.error("Public Composer sample unavailable; using the seeded Astra preview.", error);
  }
  const snapshot = await readFoundationSnapshot(db);
  const cardsById = new Map(snapshot.cards.map((card) => [card.id, card]));
  const previewIds = new Set(seedSnapshot().streamItems.map((item) => item.id));
  return snapshot.streamItems.filter((item) => previewIds.has(item.id)).sort((a, b) => a.position - b.position).slice(0, PUBLIC_COMPOSER_SAMPLE_COUNT).flatMap((item) => {
    const card = cardsById.get(item.cardId);
    return card ? [{ item, card }] : [];
  });
}
