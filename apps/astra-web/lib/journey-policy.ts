import type { AstrologyReportRequest, AstrologyReportResult } from "@astra/contracts";

export const JOURNEY_REPORT_MAX_AGE_DAYS = 30;
export const JOURNEY_REPORT_SIGNAL_LIMIT = 3;
export const JOURNEY_UP_NEXT_PREVIEW_LIMIT = 3;

const JOURNEY_REPORT_TYPES = new Set(["identity", "core", "deep", "progressed", "synastry"]);
const TEST_SUBJECT_PATTERN = /^(?:test(?:\b|\d)|qa(?:\b|\d)|example(?:\b|\d)|dummy(?:\b|\d)|sample(?:\b|\d))/i;

export type CuratedReportSignal = {
  request: AstrologyReportRequest;
  result: AstrologyReportResult;
};

export type ReportJourneyIneligibility =
  | "admin"
  | "duplicate"
  | "imported"
  | "legacy"
  | "missing_request"
  | "over_limit"
  | "stale"
  | "test"
  | "unsupported";

function isLegacyWelcomeReport(request: AstrologyReportRequest) {
  const modelPilot = request.context && typeof request.context.modelPilot === "string"
    ? request.context.modelPilot
    : "";
  return request.reportType === "identity" && modelPilot === "gemini-intro-identity";
}

function reportTargetKey(request: AstrologyReportRequest) {
  const basis = request.reportBasis;
  if (basis?.type === "synastry" && basis.partner) {
    return [basis.primary.chartRequestId, basis.partner.chartRequestId].sort().join("+");
  }
  return basis?.primary.chartRequestId ?? request.chartRequestId ?? request.subjectName.trim().toLocaleLowerCase();
}

function reportIneligibility(
  request: AstrologyReportRequest,
  result: AstrologyReportResult,
  now: Date
): ReportJourneyIneligibility | undefined {
  if (isLegacyWelcomeReport(request)) return "legacy";
  if (request.source === "import") return "imported";
  if (!JOURNEY_REPORT_TYPES.has(request.reportType)) return "unsupported";
  if (TEST_SUBJECT_PATTERN.test(request.subjectName.trim())) return "test";
  if (result.status !== "completed" || !result.publicSignal) return "unsupported";
  const ageMs = now.getTime() - new Date(result.createdAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs > JOURNEY_REPORT_MAX_AGE_DAYS * 86_400_000) return "stale";
  return undefined;
}

export function reportJourneySubtitle(request: AstrologyReportRequest) {
  const basis = request.reportBasis;
  const subjectName = basis?.primary.subjectName ?? request.subjectName;
  if (request.reportType === "synastry" && basis?.type === "synastry" && basis.partner) {
    return `A relationship reading for ${subjectName} and ${basis.partner.subjectName}.`;
  }
  if (request.reportType === "deep") return `A deeper reading of ${subjectName}'s birth chart.`;
  if (request.reportType === "core") return `A focused overview of ${subjectName}'s birth chart.`;
  if (request.reportType === "progressed") return `A time-based reading for ${subjectName}.`;
  return `A personal reading for ${subjectName}.`;
}

export function curateReportSignals(
  requests: AstrologyReportRequest[],
  results: AstrologyReportResult[],
  now = new Date(),
  options: { allowReportSignals?: boolean } = {}
) {
  const requestsById = new Map(requests.map((request) => [request.id, request]));
  const selected: CuratedReportSignal[] = [];
  const suppressed = new Map<string, ReportJourneyIneligibility>();
  const seenKeys = new Set<string>();

  const newestFirst = [...results].sort((left, right) => (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  ));

  for (const result of newestFirst) {
    const request = requestsById.get(result.requestId);
    if (!request) {
      suppressed.set(result.requestId, "missing_request");
      continue;
    }
    if (options.allowReportSignals === false) {
      suppressed.set(result.requestId, "admin");
      continue;
    }
    const ineligibility = reportIneligibility(request, result, now);
    if (ineligibility) {
      suppressed.set(result.requestId, ineligibility);
      continue;
    }
    const key = `${request.reportType}:${reportTargetKey(request)}`;
    if (seenKeys.has(key)) {
      suppressed.set(result.requestId, "duplicate");
      continue;
    }
    seenKeys.add(key);
    if (selected.length >= JOURNEY_REPORT_SIGNAL_LIMIT) {
      suppressed.set(result.requestId, "over_limit");
      continue;
    }
    selected.push({ request, result });
  }

  return { selected, suppressed };
}
