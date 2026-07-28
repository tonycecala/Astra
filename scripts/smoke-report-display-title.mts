import type { AstrologyReportRequest } from "@astra/contracts";
import {
  reportCardMetadata,
  reportDisplayName,
  reportDisplayTitle,
  reportFamilyLabel,
  resolveLegacySynastryPartnerBirthDate
} from "../apps/astra-web/lib/report-display";

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

const welcomeRequest = {
  reportType: "identity",
  subjectName: "Tony Cecala",
  context: { subject: { displayName: "Tony Cecala" }, modelPilot: "gemini-intro-identity" }
} as unknown as AstrologyReportRequest;
if (reportDisplayTitle(welcomeRequest) !== "Tony Cecala — Welcome Report" || reportFamilyLabel("identity", welcomeRequest) !== "Welcome Report") {
  throw new Error("The free first-Self report must display as Welcome Report without changing paid Identity Report labels.");
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

const synastryBasis = synastryRequest.reportBasis;
if (!synastryBasis?.partner) {
  throw new Error("Synastry display fixtures require both persisted chart sources.");
}
const reciprocalSynastryRequest = {
  ...synastryRequest,
  reportBasis: {
    ...synastryBasis,
    primary: synastryBasis.partner,
    partner: synastryBasis.primary
  }
} as AstrologyReportRequest;
if (reportDisplayTitle(reciprocalSynastryRequest, "Brandi McCulley — Synastry Report") !== "Brandi McCulley + Tony Cecala — Synastry Report") {
  throw new Error("A reciprocal Synastry reading must retain the selected reader first in its separate saved title.");
}

const legacySynastryRequest = {
  reportType: "synastry",
  subjectName: "Tony Cecala + Cheyenne Autumn",
  birthData: { date: "1961-05-23" },
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

const legacyPartnerBirthDate = resolveLegacySynastryPartnerBirthDate(legacySynastryRequest, [
  {
    id: "v1-chart:legacy-partner",
    userId: "portable-user",
    subjectName: "Cheyenne Autumn",
    birthData: { date: "1989-11-03" },
    context: { subject: { subjectId: "legacy-partner", subjectType: "ally", displayName: "Cheyenne Autumn" } },
    source: "import",
    status: "completed",
    createdAt: "2026-07-16T18:00:00.000Z",
    updatedAt: "2026-07-16T18:00:00.000Z"
  }
]);
if (legacyPartnerBirthDate !== "1989-11-03") {
  throw new Error("Imported Synastry reports must resolve the partner birth date from the owned chart.");
}
const legacySynastryMetadata = reportCardMetadata(legacySynastryRequest, "2026-07-16T18:00:00.000Z", legacyPartnerBirthDate);
if (legacySynastryMetadata !== "Generated Jul 16, 2026 · Born May 23, 1961 + Nov 3, 1989") {
  throw new Error(`Imported Synastry metadata must include both birth dates; received: ${legacySynastryMetadata}`);
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
