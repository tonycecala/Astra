import Link from "next/link";

import type { AstrologyReportRequest, AstrologyReportResult } from "@astra/contracts";
import { ui } from "../lib/i18n";
import { ReportMarkdown } from "./ReportMarkdown";
import { ReportReaderActions } from "./ReportReaderActions";

export function ReportReader({
  report,
  request,
  backHref,
  actions = false,
  shared = false
}: {
  report: AstrologyReportResult;
  request: AstrologyReportRequest | null;
  backHref?: string;
  actions?: boolean;
  shared?: boolean;
}) {
  const subject = reportSubjectContext(request);
  const title = report.publicSignal?.headline ?? ui.library.selectedReportFallbackTitle;
  const createdAt = formatReportDate(report.createdAt);
  const reportMarkdown = reportMarkdownFrom(report, request, title, subject.name);
  const sectionMarkdown = reportSectionsMarkdownFrom(report);

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
        <aside className="reportDocumentPlate" aria-label={ui.library.reportPlateLabel}>
          <div className="reportDocumentSeal" aria-hidden="true">
            {subject.type === "ally" ? "A" : "S"}
          </div>
          <div className="reportDocumentPlateText">
            <p className="reportDocumentPlateKicker">{ui.library.reportPlateSubject}</p>
            <p className="reportDocumentPlatePrimary">{subject.name}</p>
            {subject.relationship ? <p className="reportDocumentPlateSecondary">{subject.relationship}</p> : null}
          </div>
          <dl className="reportDocumentPlateFacts">
            <div>
              <dt>{ui.library.reportPlateType}</dt>
              <dd>{reportTypeLabel(request?.reportType)}</dd>
            </div>
            <div>
              <dt>{ui.library.reportPlateStatus}</dt>
              <dd>{report.status}</dd>
            </div>
            <div>
              <dt>{ui.library.reportPlateDate}</dt>
              <dd>{createdAt}</dd>
            </div>
          </dl>
        </aside>
        {report.sections.length ? <ReportMarkdown markdown={sectionMarkdown} /> : <div className="reportMarkdown"><p>{ui.library.selectedReportNoSections}</p></div>}
      </article>
    </section>
  );
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

function reportMarkdownFrom(report: AstrologyReportResult, request: AstrologyReportRequest | null, title: string, subjectName: string) {
  const metadata = [
    `Subject: ${subjectName}`,
    `Type: ${reportTypeLabel(request?.reportType)}`,
    `Status: ${report.status}`,
    `Generated: ${formatReportDate(report.createdAt)}`
  ];
  const sections = report.sections
    .map((section) => [`## ${section.title}`, section.body.trim()].filter(Boolean).join("\n\n"))
    .join("\n\n");

  return [`# ${title}`, metadata.join("\n"), report.summary ? `> ${report.summary}` : "", sections].filter(Boolean).join("\n\n");
}

function reportSectionsMarkdownFrom(report: AstrologyReportResult) {
  return report.sections.map((section) => [`## ${section.title}`, section.body.trim()].filter(Boolean).join("\n\n")).join("\n\n");
}
