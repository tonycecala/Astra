import Link from "next/link";

import { buildAstrologyChartSnapshot, buildAstrologyReportSectionEvidence } from "@astra/astrology";
import type { AstrologyReportRequest, AstrologyReportResult } from "@astra/contracts";
import { ui } from "../lib/i18n";
import { ReportChartPlate } from "./ReportChartPlate";
import { ReportFeedbackForm } from "./ReportFeedbackForm";
import { ReportMarkdown } from "./ReportMarkdown";
import { ReportReaderActions } from "./ReportReaderActions";

export function ReportReader({
  report,
  request,
  backHref,
  actions = false,
  debug = false,
  shared = false
}: {
  report: AstrologyReportResult;
  request: AstrologyReportRequest | null;
  backHref?: string;
  actions?: boolean;
  debug?: boolean;
  shared?: boolean;
}) {
  const subject = reportSubjectContext(request);
  const title = report.publicSignal?.headline ?? ui.library.selectedReportFallbackTitle;
  const evidenceByTitle = buildReportEvidenceByTitle(request, report);
  const reportMarkdown = reportMarkdownFrom(report, request, title, subject.name, evidenceByTitle);
  const sectionMarkdown = reportSectionsMarkdownFrom(report, evidenceByTitle);
  const chartSnapshot = buildReportChartSnapshot(request);

  return (
    <section className="reportReaderShell" aria-label={shared ? ui.library.sharedReportLabel : ui.library.selectedReportLabel}>
      <header className="reportReaderHeader">
        <div>
          <div className="eyebrow">{shared ? ui.library.sharedReportEyebrow : subject.type === "ally" ? ui.library.subjectAlly : ui.library.subjectSelf}</div>
          <h1>{title}</h1>
          <p>{report.summary || ui.library.selectedReportNoSummary}</p>
        </div>
        {backHref ? (
          <Link className="button secondary" href={backHref}>
            {ui.library.selectedReportBack}
          </Link>
        ) : null}
      </header>
      {actions ? (
        <ReportReaderActions
          markdown={reportMarkdown}
          downloadName={`${subject.name} ${reportTypeLabel(request?.reportType)}`}
          requestId={report.requestId}
          labels={{
            actionsLabel: ui.library.reportActionsLabel,
            savedLabel: ui.library.reportSavedLabel,
            shareReport: ui.library.reportShare,
            sharingReport: ui.library.reportSharing,
            shareLinkCopied: ui.library.reportShareLinkCopied,
            shareError: ui.library.reportShareError,
            revokeShare: ui.library.reportRevokeShare,
            revokingShare: ui.library.reportRevokingShare,
            revokeShareError: ui.library.reportRevokeShareError,
            sharePanelTitle: ui.library.reportSharePanelTitle,
            sharePanelDescription: ui.library.reportSharePanelDescription,
            copyShareLink: ui.library.reportCopyShareLink,
            copyEmail: ui.library.reportCopyEmail,
            emailCopied: ui.library.reportEmailCopied,
            openEmail: ui.library.reportOpenEmail,
            messageShare: ui.library.reportMessageShare,
            shareSheetOpened: ui.library.reportShareSheetOpened,
            shareCancelled: ui.library.reportShareCancelled,
            copyLink: ui.library.reportCopyLink,
            linkCopied: ui.library.reportLinkCopied,
            downloadMarkdown: ui.library.reportDownloadMarkdown,
            downloadStarted: ui.library.reportDownloadStarted,
            copyMarkdown: ui.library.reportCopyMarkdown,
            copiedMarkdown: ui.library.reportCopiedMarkdown,
            printReport: ui.library.reportPrint,
            deleteReport: ui.library.reportDelete,
            deletingReport: ui.library.reportDeleting,
            deleteConfirm: ui.library.reportDeleteConfirm,
            deleteError: ui.library.reportDeleteError,
            copyBlocked: ui.library.reportCopyBlocked
          }}
        />
      ) : null}

      <article className="reportReaderDocument">
        <ReportChartPlate request={request} chart={chartSnapshot} />
        {debug ? <ReportDebugDetails report={report} request={request} /> : null}
        {report.sections.length ? (
          <ReportMarkdown markdown={sectionMarkdown} evidenceByTitle={evidenceByTitle} />
        ) : (
          <div className="reportMarkdown"><p>{ui.library.selectedReportNoSections}</p></div>
        )}
        {actions && !shared ? <ReportFeedbackForm labels={ui.library.feedback} reportId={report.requestId} /> : null}
      </article>
    </section>
  );
}

function ReportDebugDetails({ report, request }: { report: AstrologyReportResult; request: AstrologyReportRequest | null }) {
  const provenance = Array.isArray(report.provenance) ? report.provenance : [];
  const rows = [
    [ui.library.debugRequestId, report.requestId],
    [ui.library.debugStatus, report.status],
    [ui.library.debugReportType, reportTypeLabel(request?.reportType)],
    [ui.library.debugCost, String(request?.costCredits ?? 0)],
    [ui.library.debugEngine, report.engine],
    [ui.library.debugEngineVersion, report.engineVersion],
    [ui.library.debugChartRequest, request?.chartRequestId ?? ui.library.reportUnknownChartValue],
    [ui.library.debugSource, request?.source ?? ui.library.reportUnknownChartValue],
    ...reportModelDebugRows(report, request),
    ...(report.error ? ([[ui.library.debugError, report.error]] as const) : [])
  ];

  return (
    <details className="reportDebugDetails">
      <summary>{ui.library.debugTitle}</summary>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {provenance.length ? (
        <ul>
          {provenance.map((item, index) => (
            <li key={`${index}-${item.id}`}>
              <strong>{item.label}</strong>: {item.summary}
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
}

function reportModelDebugRows(report: AstrologyReportResult, request: AstrologyReportRequest | null) {
  const context = recordFrom(request?.context);
  const v1 = recordFrom(context.v1);
  const current = recordFrom(report.generationMetadata);
  const provider = debugText(current.provider) || debugText(v1.provider);
  const model = debugText(current.model) || debugText(v1.model);
  const writer = [provider, model].filter(Boolean).join(" · ") || [debugText(report.engine), debugText(report.engineVersion)].filter(Boolean).join(" · ");
  const rows: Array<readonly [string, string]> = [];
  pushDebugRow(rows, ui.library.debugWriter, writer);
  pushDebugRow(rows, ui.library.debugProvider, provider);
  pushDebugRow(rows, ui.library.debugModel, model);
  pushDebugRow(rows, ui.library.debugModelProfile, current.modelProfile || v1.modelProfile);
  pushDebugRow(rows, ui.library.debugPrompt, current.promptVersion || v1.promptVersion);
  pushDebugRow(rows, ui.library.debugVoice, v1.voice);
  pushDebugRow(rows, ui.library.debugFormat, v1.format);
  pushDebugRow(rows, ui.library.debugInputTokens, formatCount(current.inputTokens ?? v1.inputTokens));
  pushDebugRow(rows, ui.library.debugOutputTokens, formatCount(current.outputTokens ?? v1.outputTokens));
  pushDebugRow(rows, ui.library.debugTotalTokens, formatCount(current.totalTokens ?? v1.totalTokens));
  pushDebugRow(rows, ui.library.debugSpend, formatSpend(current.estimatedSpend ?? v1.estimatedSpend));
  pushDebugRow(rows, ui.library.debugLatency, formatLatency(current.latencyMs ?? v1.latencyMs));
  pushDebugRow(rows, ui.library.debugV1Document, v1.reportDocumentId);
  return rows;
}

function recordFrom(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function debugText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function pushDebugRow(rows: Array<readonly [string, string]>, label: string, value: unknown) {
  const text = debugText(value);
  if (text) rows.push([label, text]);
}

function formatCount(value: unknown) {
  const number = numericValue(value);
  if (number === null) return debugText(value);
  return new Intl.NumberFormat("en-US").format(number);
}

function formatSpend(value: unknown) {
  const number = numericValue(value);
  if (number === null) return debugText(value);
  return `$${number.toFixed(4)}`;
}

function formatLatency(value: unknown) {
  const number = numericValue(value);
  if (number === null) return debugText(value);
  return `${new Intl.NumberFormat("en-US").format(number)}ms`;
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function reportSubjectContext(request?: AstrologyReportRequest | null) {
  const rawSubject = request?.context?.subject;
  const subject = rawSubject && typeof rawSubject === "object" && !Array.isArray(rawSubject) ? (rawSubject as Record<string, unknown>) : {};
  const type: "self" | "ally" = subject.subjectType === "ally" || request?.source === "ally" ? "ally" : "self";
  return {
    type,
    name: typeof subject.displayName === "string" && subject.displayName.trim() ? subject.displayName : request?.subjectName ?? ui.library.unknownSubject,
    relationship: typeof subject.relationship === "string" ? subject.relationship : undefined
  };
}

export function reportTypeLabel(reportType?: string) {
  if (reportType === "identity") return ui.library.reportTypeIdentity;
  if (reportType === "core") return ui.library.reportTypeCore;
  if (reportType === "deep") return ui.library.reportTypeDeep;
  if (reportType === "progressed") return ui.library.reportTypeProgressed;
  if (reportType === "synastry") return ui.library.reportTypeSynastry;
  if (reportType === "core_self") return ui.library.reportTypeCoreSelf;
  if (reportType === "chart_interpretation") return ui.library.reportTypeChartInterpretation;
  return ui.library.reportTypeFallback;
}

export function formatReportDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

type ReportEvidenceByTitle = Record<string, Array<{ label: string; meaning: string }>>;

const legacyCustomerCopyPatterns = [
  /\s*The reading lens is the computed birth-data pattern because no optional question was supplied\.\.?/gi,
  /\s*No optional intent marker was supplied\./gi,
  /\s*Intent marker:\s*[^.]*\./gi,
  /\s*This draft was produced by local-deterministic-writer without an external model call\./gi,
  /\s*The deterministic writer keeps this as private structure and exposes only the concise public signal to Composer\./gi
];

function customerFacingReportBody(body: string) {
  return legacyCustomerCopyPatterns
    .reduce((cleaned, pattern) => cleaned.replace(pattern, ""), body)
    .replace(/\s{2,}/g, " ")
    .trim();
}

function reportMarkdownFrom(
  report: AstrologyReportResult,
  request: AstrologyReportRequest | null,
  title: string,
  subjectName: string,
  evidenceByTitle: ReportEvidenceByTitle
) {
  const metadata = [
    `Subject: ${subjectName}`,
    `Type: ${reportTypeLabel(request?.reportType)}`,
    `Status: ${report.status}`,
    `Generated: ${formatReportDate(report.createdAt)}`
  ];
  const sections = report.sections
    .map((section) => {
      const evidence = evidenceMarkdownFor(section.title, evidenceByTitle);
      return [`## ${section.title}`, customerFacingReportBody(section.body), evidence].filter(Boolean).join("\n\n");
    })
    .join("\n\n");

  return [`# ${title}`, metadata.join("\n"), report.summary ? `> ${report.summary}` : "", sections].filter(Boolean).join("\n\n");
}

function reportSectionsMarkdownFrom(report: AstrologyReportResult, evidenceByTitle: ReportEvidenceByTitle) {
  return report.sections
    .map((section) => [`## ${section.title}`, customerFacingReportBody(section.body), evidenceMarkdownFor(section.title, evidenceByTitle)].filter(Boolean).join("\n\n"))
    .join("\n\n");
}

function buildReportChartSnapshot(request: AstrologyReportRequest | null) {
  if (!request) return null;
  try {
    return buildAstrologyChartSnapshot(request);
  } catch {
    return null;
  }
}

function buildReportEvidenceByTitle(request: AstrologyReportRequest | null, report: AstrologyReportResult): ReportEvidenceByTitle {
  if (!request || !report.sections.length) return {};
  try {
    return Object.fromEntries(
      buildAstrologyReportSectionEvidence(
        request,
        report.sections.map((section) => section.title)
      ).map((section) => [section.title, section.evidenceBullets])
    );
  } catch {
    return {};
  }
}

function evidenceMarkdownFor(title: string, evidenceByTitle: ReportEvidenceByTitle) {
  const evidence = evidenceByTitle[title] ?? [];
  if (!evidence.length) return "";
  return ["**Chart Evidence**", ...evidence.map((item) => `- **${item.label}**: ${item.meaning}`)].join("\n");
}
