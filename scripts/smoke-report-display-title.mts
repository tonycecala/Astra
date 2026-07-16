import type { AstrologyReportRequest } from "@astra/contracts";
import { reportCardMetadata, reportDisplayName, reportDisplayTitle, reportFamilyLabel } from "../apps/astra-web/lib/report-display";

const synastryRequest = {
  reportType: "synastry",
  reportBasis: {
    schemaVersion: 1,
    type: "synastry",
    chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
    primary: {
      chartRequestId: "chart-tony",
      subjectType: "self",
      subjectName: "Tony Cecala",
      birthData: { date: "1961-05-23" }
    },
    partner: {
      chartRequestId: "chart-brandi",
      subjectType: "ally",
      subjectName: "Brandi McCulley",
      birthData: { date: "1978-11-12" }
    }
  }
} as unknown as AstrologyReportRequest;

const synastryTitle = reportDisplayTitle(synastryRequest, "Tony Cecala — Synastry Report");
if (synastryTitle !== "Tony Cecala + Brandi McCulley — Synastry Report") {
  throw new Error(`Synastry display title must include both people; received: ${synastryTitle}`);
}

const natalTitle = reportDisplayTitle({ reportType: "identity" } as AstrologyReportRequest, "Tony Cecala — Identity Report");
if (natalTitle !== "Unknown subject — Identity Report") {
  throw new Error(`A report without subject data must use the translated fallback; received: ${natalTitle}`);
}

const familyCases = [
  ["identity", "Identity Report"],
  ["core", "Core Report"],
  ["deep", "Deep Report"],
  ["progressed", "Progressed Report"],
  ["synastry", "Synastry Report"]
] as const;
for (const [reportType, expected] of familyCases) {
  if (reportFamilyLabel(reportType) !== expected) throw new Error(`${reportType} must display as ${expected}.`);
}

if (reportDisplayName(synastryRequest) !== "Tony Cecala + Brandi McCulley") {
  throw new Error("Synastry display names must include both people.");
}

const legacySynastryRequest = {
  reportType: "synastry",
  subjectName: "Tony Cecala + Cheyenne Autumn",
  context: {
    subject: {
      displayName: "Tony Cecala",
      partnerDisplayName: "Cheyenne Autumn"
    }
  }
} as unknown as AstrologyReportRequest;
if (reportDisplayTitle(legacySynastryRequest, "Tony Cecala — Synastry Report") !== "Tony Cecala + Cheyenne Autumn — Synastry Report") {
  throw new Error("Imported Synastry reports must recover both names from legacy subject context.");
}

const synastryMetadata = reportCardMetadata(synastryRequest, "2026-07-16T18:00:00.000Z");
if (synastryMetadata !== "Generated Jul 16, 2026 · Born May 23, 1961 + Nov 12, 1978") {
  throw new Error(`Synastry metadata must identify generation and both birth dates; received: ${synastryMetadata}`);
}

const progressedRequest = {
  ...synastryRequest,
  reportType: "progressed",
  reportBasis: {
    ...synastryRequest.reportBasis,
    type: "progressed",
    partner: undefined,
    asOfDate: "2026-07-16"
  }
} as AstrologyReportRequest;
const progressedMetadata = reportCardMetadata(progressedRequest, "2026-07-16T18:00:00.000Z");
if (progressedMetadata !== "Generated Jul 16, 2026 · As of Jul 16, 2026") {
  throw new Error(`Progressed metadata must identify its as-of date; received: ${progressedMetadata}`);
}

console.log("Report display title smoke passed.");
