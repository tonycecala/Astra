import type { AstrologyReportRequest, ChartMakerRequest } from "@astra/contracts";
import { ui } from "./i18n";

export function reportFamilyLabel(reportType?: string) {
  if (reportType === "identity") return ui.library.reportTypeIdentity;
  if (reportType === "core" || reportType === "core_self") return ui.library.reportTypeCore;
  if (reportType === "deep") return ui.library.reportTypeDeep;
  if (reportType === "progressed") return ui.library.reportTypeProgressed;
  if (reportType === "synastry") return ui.library.reportTypeSynastry;
  if (reportType === "chart_interpretation") return ui.library.reportTypeChartInterpretation;
  return ui.library.reportTypeFallback;
}

export function reportDisplayName(request: AstrologyReportRequest | null | undefined) {
  const basis = request?.reportBasis;
  if (request?.reportType === "synastry" && basis?.type === "synastry" && basis.partner) {
    return `${basis.primary.subjectName} + ${basis.partner.subjectName}`;
  }

  const subject = recordFrom(request?.context?.subject);
  const subjectName = textFrom(subject.displayName) || basis?.primary.subjectName || request?.subjectName;
  const partner = recordFrom(request?.context?.synastryPartner);
  const partnerName = textFrom(partner.subjectName) || textFrom(subject.partnerDisplayName);
  if (request?.reportType === "synastry" && subjectName && partnerName) {
    return `${subjectName} + ${partnerName}`;
  }
  if (request?.reportType === "synastry" && request.subjectName.includes(" + ")) {
    return request.subjectName;
  }

  return subjectName || ui.library.unknownSubject;
}

export function reportDisplayTitle(request: AstrologyReportRequest | null | undefined, generatedTitle?: string | null) {
  if (request) return `${reportDisplayName(request)} — ${reportFamilyLabel(request.reportType)}`;

  return generatedTitle?.trim() || ui.library.selectedReportFallbackTitle;
}

export function reportCardMetadata(
  request: AstrologyReportRequest | null | undefined,
  createdAt: string,
  legacyPartnerBirthDate?: string
) {
  const details = [`${ui.library.reportCardDateLabel} ${formatDate(createdAt)}`];
  const basis = request?.reportBasis;

  if (basis?.type === "progressed" && basis.asOfDate) {
    details.push(`${ui.library.reportChartAsOf} ${formatDate(basis.asOfDate)}`);
  } else if (basis?.type === "synastry" && basis.partner) {
    details.push(`${ui.library.reportCardBornLabel} ${formatDate(basis.primary.birthData.date)} + ${formatDate(basis.partner.birthData.date)}`);
  } else if (request?.reportType === "synastry" && request.birthData.date && legacyPartnerBirthDate) {
    details.push(`${ui.library.reportCardBornLabel} ${formatDate(request.birthData.date)} + ${formatDate(legacyPartnerBirthDate)}`);
  } else if (request?.birthData.date) {
    details.push(`${ui.library.reportCardBornLabel} ${formatDate(request.birthData.date)}`);
  }

  return details.join(" · ");
}

export function resolveLegacySynastryPartnerBirthDate(
  request: AstrologyReportRequest | null | undefined,
  chartRequests: ChartMakerRequest[]
) {
  if (request?.reportType !== "synastry" || request.reportBasis?.type === "synastry") return undefined;

  const subject = recordFrom(request.context?.subject);
  const v1 = recordFrom(request.context?.v1);
  const relationship = recordFrom(v1.chartSnapshot);
  const relationshipDetails = recordFrom(relationship.relationship);
  const partnerSubjectId =
    textFrom(subject.partnerSubjectId) ||
    textFrom(relationshipDetails.partnerSubjectId) ||
    textFrom(subject.partnerAllyId).replace(/^v1-ally:/, "");
  const partnerName = textFrom(subject.partnerDisplayName) || textFrom(relationshipDetails.partnerName);

  const partnerChart = chartRequests.find((chart) => {
    const chartSubject = recordFrom(chart.context?.subject);
    const chartV1 = recordFrom(chart.context?.v1);
    const chartSubjectIds = [
      textFrom(chartSubject.subjectId),
      textFrom(chartSubject.allyId).replace(/^v1-ally:/, ""),
      textFrom(chartV1.v1SubjectId),
      chart.id.replace(/^v1-chart:/, "")
    ].filter(Boolean);
    if (partnerSubjectId && chartSubjectIds.includes(partnerSubjectId)) return true;
    return Boolean(partnerName && chart.subjectName.trim() === partnerName);
  });

  return partnerChart?.birthData.date;
}

function formatDate(value: string) {
  const calendarDate = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0] ?? value;
  const date = new Date(calendarDate.length === 10 ? `${calendarDate}T00:00:00` : calendarDate);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function recordFrom(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function textFrom(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
