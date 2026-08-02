import "server-only";

import type { AstraCard, AstrologyReportRequest, StreamItem, UserFeedItem } from "@astra/contracts";
import { db, listUserAstrologyReportRequests, listUserFeedItems, readFoundationSnapshot, seedSnapshot } from "@astra/db";
import { fetchComposerAvailability } from "./composer-selection";
import { ui } from "./i18n";
import { buildPublicComposerPreview, PUBLIC_COMPOSER_SAMPLE_COUNT } from "./public-composer-preview";
import {
  reconcileCompletedReportJourneyItems,
  retireLegacyComposerOnboardingJourneyItems,
  retireLegacyWelcomeJourneyItems
} from "./journey-producers";
import { CHART_ARRIVAL_REASON } from "./chart-arrival";
import { JOURNEY_UP_NEXT_PREVIEW_LIMIT, reportJourneySubtitle } from "./journey-policy";

export type JourneyStep = {
  item: UserFeedItem;
  card: AstraCard;
  primaryAction?: { href: string; label: string };
  provenance: string;
};
export type PublicJourneyCard = { item: StreamItem | { id: string }; card: AstraCard };
export type JourneyViewModel = { currentStep?: JourneyStep; queue: JourneyStep[]; queuedStepCount: number };

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function acknowledgedAt(item: UserFeedItem) {
  return payloadString(item.displayPayload, "acknowledgedAt");
}

/**
 * Keep an acknowledged item where it was until later guidance arrives. When a
 * new available item is created, that newer item moves ahead without turning
 * acknowledgement into completion or hiding the original step.
 */
function orderAvailableJourneyItems(items: UserFeedItem[]) {
  const acknowledgementTimes = items
    .map(acknowledgedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));
  if (!acknowledgementTimes.length) return items;

  // A new item is the only thing that moves ahead of an acknowledged current
  // step. Pre-existing queue items retain their place behind it.
  const newestAcknowledgement = Math.max(...acknowledgementTimes);
  const newerGuidance = items.filter((item) => !acknowledgedAt(item) && new Date(item.createdAt).getTime() > newestAcknowledgement);
  if (!newerGuidance.length) return items;
  const newerIds = new Set(newerGuidance.map((item) => item.id));
  return [...newerGuidance, ...items.filter((item) => !newerIds.has(item.id))];
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
  return payloadString(signal as Record<string, unknown>, "requestId");
}

function primaryActionFor(item: UserFeedItem): JourneyStep["primaryAction"] {
  const label = payloadString(item.displayPayload, "ctaLabel") ?? ui.journey.openStep;
  if (item.reasonCode === "focus_first_exploration") {
    const href = payloadString(item.displayPayload, "ctaHref");
    return { href: href?.startsWith("/charts?chart=") ? href : "/charts", label };
  }
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
  if (item.reasonCode === "focus_first_exploration") {
    const focus = item.displayPayload.explorerFocus;
    if (focus && typeof focus === "object" && !Array.isArray(focus) && (focus as Record<string, unknown>).status === "selected") {
      return ui.journey.provenance.focusSelected;
    }
    return ui.journey.provenance.focusSkipped;
  }
  if (item.reasonCode === "explicit_report_signal_publish") return ui.journey.provenance.report;
  if (item.feedKind === "ally") return ui.journey.provenance.ally;
  if (item.feedKind === "gift") return ui.journey.provenance.gift;
  return ui.journey.provenance.privateJourney;
}

function stepFromFeedItem(item: UserFeedItem, requestsById: Map<string, AstrologyReportRequest>): JourneyStep {
  const requestId = reportRequestId(item);
  const request = requestId ? requestsById.get(requestId) : undefined;
  const subtitle = item.feedKind === "report_signal"
    ? request ? reportJourneySubtitle(request) : ui.journey.privateReportContext
    : payloadString(item.displayPayload, "subtitle");
  return {
    item,
    primaryAction: primaryActionFor(item),
    provenance: provenanceFor(item),
    card: {
      id: item.id,
      title: item.title,
      subtitle,
      body: item.body,
      lane: laneForFeedKind(item.feedKind),
      tone: "grounded",
      imageUrl: payloadString(item.displayPayload, "imageUrl"),
      publishedAt: item.availableAt
    }
  };
}

export async function getJourneyViewModel(userId: string, options: { userRole?: string } = {}): Promise<JourneyViewModel> {
  await Promise.all([
    reconcileCompletedReportJourneyItems(userId, options),
    retireLegacyWelcomeJourneyItems(userId),
    retireLegacyComposerOnboardingJourneyItems(userId)
  ]);
  const [available, requests] = await Promise.all([
    listUserFeedItems(db, { userId, state: "available", limit: 50 }),
    listUserAstrologyReportRequests(db, userId)
  ]);
  const requestsById = new Map(requests.map((request) => [request.id, request]));
  const steps = orderAvailableJourneyItems(available.items.filter((item) => item.reasonCode !== CHART_ARRIVAL_REASON)).map((item) => stepFromFeedItem(item, requestsById));
  const queue = steps.slice(1);
  return {
    currentStep: steps[0],
    queue: queue.slice(0, JOURNEY_UP_NEXT_PREVIEW_LIMIT),
    queuedStepCount: queue.length
  };
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
