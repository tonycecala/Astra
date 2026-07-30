import "server-only";

import type { AstrologyReportRequest, AstrologyReportResult, ComposerPrivateFeedWrite } from "@astra/contracts";
import {
  db,
  getUserAstrologyReportResult,
  getUserFeedItemById,
  listAvailableUserReportSignalsForRepair,
  listUserFeedItems,
  listUserAstrologyReportRequests,
  listUserAstrologyReportResults,
  retireAvailableUserFeedItems,
  updateUserFeedItemState
} from "@astra/db";
import { persistComposerPrivateFeedWrite } from "./composer-private-feed";
import { curateReportSignals, reportJourneySubtitle } from "./journey-policy";
import { isWelcomeReport } from "./report-display";

function reportSignalWrite(result: AstrologyReportResult, request: AstrologyReportRequest): ComposerPrivateFeedWrite {
  if (result.status !== "completed" || !result.publicSignal) throw new Error("ASTROLOGY_REPORT_PUBLIC_SIGNAL_NOT_READY");
  const signal = result.publicSignal;
  const createdAt = result.createdAt;
  const sourceCardId = `source_card:${signal.reportId}`;
  return {
    id: `report_signal:${result.requestId}`,
    publisher: "composer",
    sourceCard: {
      id: sourceCardId,
      slug: `report-signal-${result.requestId}`,
      title: signal.headline,
      bodyTemplate: signal.summary,
      cardType: "report_signal",
      topicTags: ["report", signal.reportType],
      symbolicTags: [],
      eligibilityRules: { requiresAuthenticatedUser: true, reportId: signal.reportId },
      safetyFlags: [],
      status: "active",
      createdAt,
      updatedAt: createdAt
    },
    feedItem: {
      id: `report_signal_feed:${result.userId}:${result.requestId}`,
      userId: result.userId,
      sourceCardId,
      feedKind: "report_signal",
      title: signal.headline,
      body: signal.summary,
      displayPayload: {
        subtitle: reportJourneySubtitle(request),
        lane: "know_yourself",
        tone: signal.tone,
        ctaLabel: "Open",
        ctaAction: "open",
        publicSignal: signal,
        composerArtifactId: `report_signal:${result.requestId}`
      },
      rankScore: Math.floor(new Date(createdAt).getTime() / 1_000),
      reasonCode: "explicit_report_signal_publish",
      state: "available",
      availableAt: createdAt
    },
    decision: {
      decisionVersion: "report-signal-private-feed-v1",
      inputContextHash: `report:${signal.reportId}`,
      candidateIds: [sourceCardId],
      selectedCandidateId: sourceCardId,
      rankFeatures: { reportType: signal.reportType, boundary: signal.boundary, provenanceSummary: signal.provenanceSummary },
      suppressionReasons: [],
      safetyNotes: ["Raw private report sections are not included in this feed write."]
    },
    createdAt
  };
}

export async function ensureReportJourneyItem(input: { requestId: string; userId: string; userRole?: string; result?: AstrologyReportResult }) {
  const result = input.result ?? await getUserAstrologyReportResult(db, input);
  if (!result || result.userId !== input.userId) throw new Error("ASTROLOGY_REPORT_RESULT_NOT_FOUND");
  if (result.status !== "completed" || !result.publicSignal) throw new Error("ASTROLOGY_REPORT_PUBLIC_SIGNAL_NOT_READY");
  const reconciliation = await reconcileCompletedReportJourneyItems(input.userId, { userRole: input.userRole });
  const published = reconciliation.published.find((entry) => entry.artifact.feedItem.id === `report_signal_feed:${input.userId}:${input.requestId}`);
  return published ?? { created: false, reason: reconciliation.suppressed.get(input.requestId) ?? "not_selected" };
}

export async function reconcileCompletedReportJourneyItems(userId: string, options: { userRole?: string } = {}) {
  const [results, requests, availableSignals] = await Promise.all([
    listUserAstrologyReportResults(db, userId),
    listUserAstrologyReportRequests(db, userId),
    listAvailableUserReportSignalsForRepair(db, userId)
  ]);
  const visibleRequests = requests.filter((request) => !isWelcomeReport(request));
  const curated = curateReportSignals(visibleRequests, results, new Date(), {
    allowReportSignals: options.userRole !== "admin"
  });
  const selectedFeedIds = new Set(curated.selected.map(({ result }) => `report_signal_feed:${userId}:${result.requestId}`));
  const retired = await retireAvailableUserFeedItems(db, {
    userId,
    feedItemIds: availableSignals.filter((item) => !selectedFeedIds.has(item.id)).map((item) => item.id)
  });
  const published = await Promise.all(curated.selected.map(async ({ request, result }) => {
    const artifact = reportSignalWrite(result, request);
    const write = await persistComposerPrivateFeedWrite(artifact);
    return { artifact, feedItem: write.feedItem, write };
  }));
  return { published, retired, suppressed: curated.suppressed };
}

export async function retireLegacyWelcomeJourneyItems(userId: string) {
  const requests = await listUserAstrologyReportRequests(db, userId);
  const welcomeIds = requests.filter(isWelcomeReport).map((request) => `report_signal_feed:${userId}:${request.id}`);
  await Promise.all(welcomeIds.map(async (feedItemId) => {
    const item = await getUserFeedItemById(db, { userId, feedItemId });
    if (item?.state !== "seen") {
      await updateUserFeedItemState(db, { userId, feedItemId, action: "complete" });
    }
  }));
}

export async function retireLegacyComposerOnboardingJourneyItems(userId: string) {
  const [available, saved] = await Promise.all([
    listUserFeedItems(db, { userId, state: "available", limit: 100 }),
    listUserFeedItems(db, { userId, state: "saved", limit: 100 })
  ]);
  const legacyItems = [...available.items, ...saved.items].filter((item) => item.reasonCode === "composer_onboarding_card");
  await Promise.all(legacyItems.map((item) => (
    updateUserFeedItemState(db, { userId, feedItemId: item.id, action: "complete" })
  )));
  return { retired: legacyItems.length };
}
