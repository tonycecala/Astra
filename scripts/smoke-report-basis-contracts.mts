import {
  createAstrologyReportRequestSchema,
  reportChartBasisSnapshotSchema,
  type ReportChartSourceSnapshot
} from "@astra/contracts";
import { synastryBasisForPerspective } from "../apps/astra-web/lib/synastryPerspective";

const chartSettings = { zodiacMode: "tropical", houseSystem: "whole-sign" } as const;

const validCreate = createAstrologyReportRequestSchema.parse({
  chartRequestId: "chart_primary",
  reportBasis: { type: "natal", chartSettings }
});

if (validCreate.reportType !== "identity") {
  throw new Error(`New report requests must default to Identity, got ${validCreate.reportType}.`);
}

const missingSettings = createAstrologyReportRequestSchema.safeParse({
  chartRequestId: "chart_primary",
  reportBasis: { type: "natal", chartSettings: {} }
});
if (missingSettings.success) {
  throw new Error("New report requests must provide Zodiac and Houses explicitly.");
}

const reciprocalCreate = createAstrologyReportRequestSchema.parse({
  chartRequestId: "chart_primary",
  reportType: "synastry",
  reportBasis: {
    type: "synastry",
    chartSettings,
    partnerChartRequestId: "chart_comparison",
    perspective: "comparison"
  }
});
if (reciprocalCreate.reportBasis.type !== "synastry" || reciprocalCreate.reportBasis.perspective !== "comparison") {
  throw new Error("Synastry must accept an explicit comparison-reader perspective.");
}

const defaultPerspectiveCreate = createAstrologyReportRequestSchema.parse({
  chartRequestId: "chart_primary",
  reportType: "synastry",
  reportBasis: {
    type: "synastry",
    chartSettings,
    partnerChartRequestId: "chart_comparison"
  }
});
if (defaultPerspectiveCreate.reportBasis.type !== "synastry" || defaultPerspectiveCreate.reportBasis.perspective !== "primary") {
  throw new Error("Existing Synastry requests must keep the original primary-reader default.");
}

const source = {
  chartRequestId: "chart_primary",
  subjectType: "self",
  subjectId: "user_1",
  subjectName: "Primary",
  birthData: {
    date: "1990-04-11",
    time: "08:20",
    timezone: "America/Chicago",
    birthTimeKnown: true
  }
} as const;

const comparison: ReportChartSourceSnapshot = {
  ...source,
  chartRequestId: "chart_comparison",
  subjectType: "ally",
  subjectName: "Comparison"
};
const reciprocalBasis = synastryBasisForPerspective({ primary: source, comparison, perspective: "comparison" });
if (reciprocalBasis.primary.chartRequestId !== comparison.chartRequestId || reciprocalBasis.comparison.chartRequestId !== source.chartRequestId) {
  throw new Error("Comparison-reader Synastry must swap the persisted report basis without changing either chart.");
}

const progressedWithoutDate = reportChartBasisSnapshotSchema.safeParse({
  schemaVersion: 1,
  type: "progressed",
  chartSettings,
  primary: source
});
if (progressedWithoutDate.success) {
  throw new Error("Progressed basis snapshots must include an as-of date.");
}

const duplicateSynastrySource = reportChartBasisSnapshotSchema.safeParse({
  schemaVersion: 1,
  type: "synastry",
  chartSettings,
  primary: source,
  partner: { ...source, subjectType: "ally", subjectName: "Partner" }
});
if (duplicateSynastrySource.success) {
  throw new Error("Synastry basis snapshots must use two different source charts.");
}

const versionTwoWithoutMode = reportChartBasisSnapshotSchema.safeParse({
  schemaVersion: 2,
  type: "natal",
  chartSettings,
  primary: source
});
if (versionTwoWithoutMode.success) {
  throw new Error("Version 2 report provenance must record its calculation mode.");
}

reportChartBasisSnapshotSchema.parse({
  schemaVersion: 2,
  type: "natal",
  chartSettings,
  primary: { ...source, calculationMode: "signs-aspects-only" }
});

console.log("Report basis contract smoke passed.");
