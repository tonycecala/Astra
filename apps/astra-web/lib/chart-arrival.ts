import "server-only";

import { buildAstrologyChartSnapshot } from "@astra/astrology";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import {
  chartArrivalRewriteResponseSchema,
  chartArrivalEvidenceSchema,
  chartArrivalViewSchema,
  explorerFocusSnapshotSchema,
  chartCalculationModeForBirthData,
  type AstrologyReportRequest,
  type ChartArrivalEvidence,
  type ChartArrivalView,
  type ChartMakerRequest,
  type ExplorerFocusSnapshot,
  type UserFeedItem
} from "@astra/contracts";
import {
  createUserFeedItem,
  completeChartArrivalTransaction,
  db,
  getUserChartMakerRequest,
  getUserFeedItemById,
  listUserFeedItems,
  listUserAstrologyReportRequests,
  recordChartMakerResult,
} from "@astra/db";
import { deterministicArrivalGlimpse, deterministicFirstJourneyStep } from "./explorer-focus";

const ARRIVAL_PROMPT_VERSION = "chart-arrival-deterministic-v1";
export const CHART_ARRIVAL_REASON = "chart_arrival_first_glimpse";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function composerBaseUrl() {
  return clean(process.env.COMPOSER_APP_BASE_URL) || clean(process.env.COMPOSER_APP_SMOKE_BASE_URL) || "http://localhost:3012";
}

export function chartArrivalId(userId: string, chartRequestId: string) {
  return `chart_arrival:${userId}:${chartRequestId}`;
}

export function isLegacyWelcomeRequest(request: AstrologyReportRequest) {
  return request.reportType === "identity" && request.context?.modelPilot === "gemini-intro-identity";
}

export async function hasLegacyWelcomeReport(userId: string) {
  const requests = await listUserAstrologyReportRequests(db, userId);
  return requests.some(isLegacyWelcomeRequest);
}

function chartSettingsFor(request: ChartMakerRequest) {
  return request.context?.chartSettings ?? { zodiacMode: "tropical" as const, houseSystem: "whole-sign" as const };
}

function reportShapedChartInput(request: ChartMakerRequest): AstrologyReportRequest {
  const now = new Date().toISOString();
  const chartSettings = chartSettingsFor(request);
  return {
    id: `chart-arrival-input:${request.id}`,
    userId: request.userId,
    chartRequestId: request.id,
    reportType: "identity",
    subjectName: request.subjectName,
    birthData: request.birthData,
    question: request.question,
    intent: request.intent,
    context: request.context,
    source: request.source,
    boundary: "private",
    status: "processing",
    costCredits: 0,
    reportBasis: {
      schemaVersion: 2,
      type: "natal",
      chartSettings,
      primary: {
        chartRequestId: request.id,
        subjectType: "self",
        subjectId: request.userId,
        subjectName: request.subjectName,
        birthData: request.birthData,
        calculationMode: chartCalculationModeForBirthData(request.birthData)
      }
    },
    createdAt: now,
    updatedAt: now
  };
}

function evidenceFor(request: ChartMakerRequest): ChartArrivalEvidence[] {
  const snapshot = buildAstrologyChartSnapshot(reportShapedChartInput(request));
  const byBody = new Map(snapshot.placements.map((placement) => [placement.bodyId, placement]));
  const evidence: ChartArrivalEvidence[] = [];
  const sun = byBody.get("sun");
  const moon = byBody.get("moon");
  const rising = byBody.get("ascendant");
  if (sun?.sign) evidence.push({ key: "sun", label: "Sun", value: sun.sign });
  if (moon?.sign) evidence.push({ key: "moon", label: "Moon", value: moon.sign });
  if (snapshot.calculationMode === "full" && rising?.sign) {
    evidence.push({ key: "rising", label: "Rising", value: rising.sign });
  }
  evidence.push({
    key: "precision",
    label: "Chart detail",
    value: snapshot.calculationMode === "full" ? "Birth time and place included" : "Signs and aspects only"
  });
  return evidence.slice(0, 4);
}

async function composerRewrite(
  evidence: ChartArrivalEvidence[],
  fallback: string,
  deterministicJourneyBody: string,
  explorerFocus: ExplorerFocusSnapshot,
  question?: string
) {
  const token = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
  if (!token) return null;
  try {
    const response = await fetch(new URL("/api/chart-arrival/rewrite", composerBaseUrl()), {
      method: "POST",
      headers: { "content-type": "application/json", "x-astra-internal-token": token },
      body: JSON.stringify({ evidence, deterministicGlimpse: fallback, deterministicJourneyBody, explorerFocus, question }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000)
    });
    if (!response.ok) return null;
    return chartArrivalRewriteResponseSchema.parse(await response.json());
  } catch {
    return null;
  }
}

function arrivalFromItem(item: UserFeedItem | null): ChartArrivalView | null {
  if (!item || item.reasonCode !== CHART_ARRIVAL_REASON) return null;
  const evidence = chartArrivalEvidenceSchema.array().safeParse(item.displayPayload.evidence);
  if (!evidence.success || !evidence.data.length) return null;
  const focus = explorerFocusSnapshotSchema.safeParse(item.displayPayload.explorerFocus);
  const explorerFocus = focus.success ? focus.data : { schemaVersion: 1 as const, status: "skipped" as const };
  const fallbackStep = deterministicFirstJourneyStep(evidence.data, explorerFocus);
  const parsed = chartArrivalViewSchema.safeParse({
    ...item.displayPayload,
    explorerFocus,
    firstJourneyStep: item.displayPayload.firstJourneyStep ?? {
      ...fallbackStep,
      promptVersion: ARRIVAL_PROMPT_VERSION
    },
    id: item.id,
    title: item.title,
    glimpse: item.body,
    state: item.state,
    createdAt: item.createdAt
  });
  return parsed.success ? parsed.data : null;
}

export async function getChartArrival(userId: string, chartRequestId: string) {
  return arrivalFromItem(await getUserFeedItemById(db, {
    userId,
    feedItemId: chartArrivalId(userId, chartRequestId)
  }));
}

export async function getUserChartArrival(userId: string) {
  const [available, seen] = await Promise.all([
    listUserFeedItems(db, { userId, state: "available", limit: 100 }),
    listUserFeedItems(db, { userId, state: "seen", limit: 100 })
  ]);
  const item = [...available.items, ...seen.items].find((candidate) => candidate.reasonCode === CHART_ARRIVAL_REASON);
  return arrivalFromItem(item ?? null);
}

export async function ensureChartArrival(userId: string, chartRequestId: string) {
  const existing = await getChartArrival(userId, chartRequestId);
  if (existing) return existing;
  const priorArrival = await getUserChartArrival(userId);
  if (priorArrival?.state === "available") return priorArrival;
  if (priorArrival?.state === "seen") throw new Error("CHART_ARRIVAL_ALREADY_COMPLETED");
  if (await hasLegacyWelcomeReport(userId)) throw new Error("CHART_ARRIVAL_ALREADY_COMPLETED");

  const chartRequest = await getUserChartMakerRequest(db, { userId, requestId: chartRequestId });
  const subjectType = chartRequest?.context?.subject?.subjectType;
  if (!chartRequest || !["self", "import"].includes(chartRequest.source) || subjectType === "ally") {
    throw new Error("CHART_ARRIVAL_CHART_NOT_FOUND");
  }
  await recordChartMakerResult(db, buildChartMakerRecordResult(chartRequest));

  const evidence = evidenceFor(chartRequest);
  const explorerFocus = chartRequest.context?.explorerFocus ?? { schemaVersion: 1 as const, status: "skipped" as const };
  const deterministic = deterministicArrivalGlimpse(evidence, explorerFocus);
  const deterministicJourney = deterministicFirstJourneyStep(evidence, explorerFocus);
  const rewritten = await composerRewrite(evidence, deterministic, deterministicJourney.body, explorerFocus, chartRequest.question);
  const createdAt = new Date().toISOString();
  const glimpse = rewritten?.glimpse ?? deterministic;
  const generationSource = rewritten ? "composer" as const : "deterministic" as const;
  const promptVersion = rewritten?.promptVersion ?? ARRIVAL_PROMPT_VERSION;
  const id = chartArrivalId(userId, chartRequestId);

  const item = await createUserFeedItem(db, {
    id,
    userId,
    feedKind: "achievement",
    title: "Your Astra has arrived",
    body: glimpse,
    displayPayload: {
      chartRequestId,
      recognition: "Astra has read the verified shape of your birth chart.",
      evidence,
      deterministicGlimpse: deterministic,
      generationSource,
      promptVersion,
      explorerFocus,
      firstJourneyStep: {
        ...deterministicJourney,
        body: rewritten?.journeyBody ?? deterministicJourney.body,
        promptVersion
      }
    },
    reasonCode: CHART_ARRIVAL_REASON,
    state: "available",
    rankScore: 0,
    availableAt: createdAt
  });
  const arrival = arrivalFromItem(item);
  if (!arrival) throw new Error("CHART_ARRIVAL_NOT_PERSISTED");
  return arrival;
}

export async function completeChartArrival(userId: string, chartRequestId: string, options: { userRole?: string } = {}) {
  const id = chartArrivalId(userId, chartRequestId);
  const existing = await getUserFeedItemById(db, { userId, feedItemId: id });
  if (!existing || existing.reasonCode !== CHART_ARRIVAL_REASON) throw new Error("CHART_ARRIVAL_NOT_FOUND");
  const arrival = arrivalFromItem(existing);
  if (!arrival) throw new Error("CHART_ARRIVAL_NOT_FOUND");
  const focusKey = arrival.explorerFocus.status === "selected" ? arrival.explorerFocus.key : undefined;
  const journeyItem = options.userRole === "customer" ? {
    id: `focus_first:${userId}:${chartRequestId}`,
    userId,
    feedKind: "manual" as const,
    title: arrival.firstJourneyStep.title,
    body: arrival.firstJourneyStep.body,
    displayPayload: {
      chartRequestId,
      explorerFocus: arrival.explorerFocus,
      subtitle: focusKey ? "A first exploration shaped by your focus" : "A first exploration from your chart",
      ctaLabel: arrival.firstJourneyStep.ctaLabel,
      ctaHref: `/charts?chart=${encodeURIComponent(chartRequestId)}&from=self`
    },
    reasonCode: "focus_first_exploration",
    state: "available" as const,
    rankScore: 100,
    availableAt: new Date().toISOString()
  } : undefined;
  const updated = await completeChartArrivalTransaction(db, { userId, arrivalFeedItemId: id, journeyItem });
  const completed = arrivalFromItem(updated);
  if (!completed) throw new Error("CHART_ARRIVAL_NOT_COMPLETED");
  return completed;
}
