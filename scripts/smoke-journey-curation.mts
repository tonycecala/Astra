import type { AstrologyReportRequest, AstrologyReportResult } from "@astra/contracts";
import {
  JOURNEY_REPORT_SIGNAL_LIMIT,
  curateReportSignals,
  reportJourneySubtitle
} from "../apps/astra-web/lib/journey-policy";

const NOW = new Date("2026-07-30T12:00:00.000Z");
const birthData = { date: "1961-05-23" };

function request(input: {
  id: string;
  chartRequestId?: string;
  reportType?: AstrologyReportRequest["reportType"];
  source?: AstrologyReportRequest["source"];
  subjectName?: string;
}): AstrologyReportRequest {
  return {
    id: input.id,
    userId: "journey-policy-user",
    chartRequestId: input.chartRequestId ?? `chart-${input.id}`,
    reportType: input.reportType ?? "deep",
    subjectName: input.subjectName ?? `Person ${input.id}`,
    birthData,
    source: input.source ?? "self",
    boundary: "private",
    status: "completed",
    costCredits: 5,
    createdAt: "2026-07-29T12:00:00.000Z",
    updatedAt: "2026-07-29T12:00:00.000Z"
  };
}

function result(requestId: string, createdAt = "2026-07-29T12:00:00.000Z"): AstrologyReportResult {
  return {
    id: `result-${requestId}`,
    requestId,
    userId: "journey-policy-user",
    engine: "test-engine",
    engineVersion: "1",
    status: "completed",
    sections: [],
    provenance: [],
    publicSignal: {
      reportId: `report-${requestId}`,
      requestId,
      reportType: "deep",
      headline: `${requestId} report`,
      summary: `${requestId} summary`,
      tone: "grounded",
      boundary: "public_signal",
      provenanceSummary: "debug-model-writer"
    },
    createdAt
  };
}

const requests = [
  request({ id: "newest", chartRequestId: "same-chart", subjectName: "Tony" }),
  request({ id: "duplicate", chartRequestId: "same-chart", subjectName: "Tony" }),
  request({ id: "imported", source: "import" }),
  request({ id: "test", subjectName: "test2" }),
  request({ id: "stale" }),
  request({ id: "second" }),
  request({ id: "third" }),
  request({ id: "over-limit" })
];
const results = [
  result("newest", "2026-07-30T10:00:00.000Z"),
  result("duplicate", "2026-07-29T10:00:00.000Z"),
  result("imported"),
  result("test"),
  result("stale", "2026-06-01T10:00:00.000Z"),
  result("second", "2026-07-28T10:00:00.000Z"),
  result("third", "2026-07-27T10:00:00.000Z"),
  result("over-limit", "2026-07-26T10:00:00.000Z"),
  result("missing-request")
];

const curated = curateReportSignals(requests, results, NOW);
const selectedIds = curated.selected.map(({ request: selected }) => selected.id);
if (selectedIds.join(",") !== "newest,second,third") {
  throw new Error(`Journey must keep only the newest three unique eligible reports; received ${selectedIds.join(",")}.`);
}
if (curated.selected.length !== JOURNEY_REPORT_SIGNAL_LIMIT) throw new Error("Journey report signal cap drifted.");
for (const [requestId, reason] of [
  ["duplicate", "duplicate"],
  ["imported", "imported"],
  ["test", "test"],
  ["stale", "stale"],
  ["over-limit", "over_limit"],
  ["missing-request", "missing_request"]
] as const) {
  if (curated.suppressed.get(requestId) !== reason) {
    throw new Error(`${requestId} must be suppressed as ${reason}.`);
  }
}
if (reportJourneySubtitle(requests[0]).includes("writer")) {
  throw new Error("Customer-facing Journey context must not expose writer or engine metadata.");
}
const adminCuration = curateReportSignals(requests, results, NOW, { allowReportSignals: false });
if (adminCuration.selected.length !== 0 || adminCuration.suppressed.get("newest") !== "admin") {
  throw new Error("Admin report runs must remain in Library without automatically creating Journey steps.");
}

console.log("Journey curation policy smoke passed.");
