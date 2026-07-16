import {
  createAstrologyReportRequestSchema,
  reportChartBasisSnapshotSchema
} from "@astra/contracts";

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
