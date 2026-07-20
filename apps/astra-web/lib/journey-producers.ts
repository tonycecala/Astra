import "server-only";

import type { AstrologyReportResult, ComposerPrivateFeedWrite } from "@astra/contracts";
import { db, getUserAstrologyReportResult, listUserAstrologyReportResults, markAuthUserOnboardingComplete } from "@astra/db";
import { persistComposerPrivateFeedWrite } from "./composer-private-feed";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function composerBaseUrl() {
  const configured = clean(process.env.COMPOSER_APP_BASE_URL) || clean(process.env.COMPOSER_APP_SMOKE_BASE_URL);
  if (configured) return configured;
  if (process.env.VERCEL_ENV) throw new Error("COMPOSER_APP_BASE_URL is required for hosted Astra deployments.");
  return "http://localhost:3012";
}

export async function ensureComposerOnboardingJourney(input: { onboardingStatus: string; userId: string }) {
  if (input.onboardingStatus === "complete") return { created: false } as const;
  const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
  if (!internalToken) throw new Error("ASTRA_INTERNAL_API_TOKEN is required to publish Journey onboarding cards.");

  const response = await fetch(new URL("/api/onboarding/publish", composerBaseUrl()), {
    method: "POST",
    headers: { "content-type": "application/json", "x-astra-internal-token": internalToken },
    body: JSON.stringify({ targetUserId: input.userId, batchId: `automatic_onboarding:${input.userId}` }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000)
  });
  const body = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
  if (!response.ok || !body.ok) throw new Error(body.error ?? `COMPOSER_ONBOARDING_FAILED_${response.status}`);

  await markAuthUserOnboardingComplete(db, input.userId);
  return { created: true } as const;
}

function reportSignalWrite(result: AstrologyReportResult): ComposerPrivateFeedWrite {
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
        subtitle: signal.provenanceSummary,
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

export async function ensureReportJourneyItem(input: { requestId: string; userId: string; result?: AstrologyReportResult }) {
  const result = input.result ?? await getUserAstrologyReportResult(db, input);
  if (!result || result.userId !== input.userId) throw new Error("ASTROLOGY_REPORT_RESULT_NOT_FOUND");
  const artifact = reportSignalWrite(result);
  const write = await persistComposerPrivateFeedWrite(artifact);
  return { artifact, feedItem: write.feedItem, write };
}

export async function reconcileCompletedReportJourneyItems(userId: string) {
  const results = await listUserAstrologyReportResults(db, userId);
  const completed = results.filter((result) => result.status === "completed" && result.publicSignal);
  return Promise.all(completed.map((result) => ensureReportJourneyItem({ requestId: result.requestId, userId, result })));
}
