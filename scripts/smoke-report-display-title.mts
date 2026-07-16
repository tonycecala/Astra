import type { AstrologyReportRequest } from "@astra/contracts";
import { reportDisplayTitle } from "../apps/astra-web/lib/report-display";

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
} as AstrologyReportRequest;

const synastryTitle = reportDisplayTitle(synastryRequest, "Tony Cecala — Synastry Report");
if (synastryTitle !== "Tony Cecala + Brandi McCulley — Synastry Report") {
  throw new Error(`Synastry display title must include both people; received: ${synastryTitle}`);
}

const natalTitle = reportDisplayTitle({ reportType: "identity" } as AstrologyReportRequest, "Tony Cecala — Identity Report");
if (natalTitle !== "Tony Cecala — Identity Report") {
  throw new Error(`Non-synastry display title must preserve its generated headline; received: ${natalTitle}`);
}

console.log("Report display title smoke passed.");
