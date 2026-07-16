"use client";

import { Copy, Download, Link as LinkIcon, Mail, MessageCircle, Printer, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ReportReaderActionLabels = {
  actionsLabel: string;
  savedLabel: string;
  shareReport: string;
  sharingReport: string;
  shareLinkCopied: string;
  shareError: string;
  revokeShare: string;
  revokingShare: string;
  revokeShareError: string;
  sharePanelTitle: string;
  sharePanelDescription: string;
  copyShareLink: string;
  copyEmail: string;
  emailCopied: string;
  openEmail: string;
  messageShare: string;
  shareSheetOpened: string;
  shareCancelled: string;
  copyLink: string;
  linkCopied: string;
  downloadMarkdown: string;
  downloadStarted: string;
  copyMarkdown: string;
  copiedMarkdown: string;
  printReport: string;
  deleteReport: string;
  deletingReport: string;
  deleteConfirm: string;
  deleteError: string;
  copyBlocked: string;
};

export function ReportReaderActions({
  markdown,
  downloadName,
  requestId,
  labels
}: {
  markdown: string;
  downloadName: string;
  requestId: string;
  labels: ReportReaderActionLabels;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [revokingShare, setRevokingShare] = useState(false);
  const [share, setShare] = useState<{ shareUrl: string; subject: string; body: string } | null>(null);

  async function copyText(text: string, successMessage: string) {
    setStatus(null);
    setError(null);

    try {
      await navigator.clipboard.writeText(text);
      setStatus(successMessage);
      return;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      try {
        const copied = document.execCommand("copy");
        setStatus(copied ? successMessage : labels.copyBlocked);
      } catch {
        setStatus(labels.copyBlocked);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  function safeFileName(title: string) {
    return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "astra-report"}.md`;
  }

  function downloadMarkdown() {
    setStatus(null);
    setError(null);

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFileName(downloadName);
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(labels.downloadStarted);
  }

  async function deleteReport() {
    if (deleting) return;
    if (!window.confirm(labels.deleteConfirm)) return;

    setDeleting(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(requestId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(labels.deleteError);
      router.push("/library");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : labels.deleteError);
      setDeleting(false);
    }
  }

  async function createShareLink() {
    if (sharing) return;

    setSharing(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(requestId)}/share`, { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { share?: { shareUrl: string; subject: string; body: string }; error?: string } | null;
      if (!response.ok || !payload?.share) throw new Error(payload?.error || labels.shareError);
      setShare(payload.share);
      await copyText(payload.share.shareUrl, labels.shareLinkCopied);
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : labels.shareError);
    } finally {
      setSharing(false);
    }
  }

  async function revokeShareLink() {
    if (revokingShare) return;

    setRevokingShare(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(requestId)}/share`, { method: "DELETE" });
      if (!response.ok) throw new Error(labels.revokeShareError);
      setShare(null);
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : labels.revokeShareError);
    } finally {
      setRevokingShare(false);
    }
  }

  async function openNativeShare() {
    if (!share) return;
    setStatus(null);
    setError(null);

    if (navigator.share) {
      try {
        await navigator.share({ title: share.subject, text: share.body, url: share.shareUrl });
        setStatus(labels.shareSheetOpened);
        return;
      } catch {
        setStatus(labels.shareCancelled);
        return;
      }
    }

    await copyText(share.shareUrl, labels.shareLinkCopied);
  }

  const mailtoHref = share ? `mailto:?subject=${encodeURIComponent(share.subject)}&body=${encodeURIComponent(share.body)}` : "";

  return (
    <div className="reportActionsStack noPrint" aria-label={labels.actionsLabel}>
      <div className="reportActionsPanel">
        <span className="reportSavedPill">{labels.savedLabel}</span>
        <div className="reportActionsToolbar">
          <button aria-label={sharing ? labels.sharingReport : labels.shareReport} className="primaryButton" type="button" title={sharing ? labels.sharingReport : labels.shareReport} onClick={createShareLink} disabled={sharing} aria-busy={sharing}>
            <Share2 className="buttonIcon" aria-hidden="true" size={18} strokeWidth={2.2} />
            <span>{sharing ? labels.sharingReport : labels.shareReport}</span>
          </button>
          <button aria-label={labels.copyLink} className="secondaryButton" type="button" title={labels.copyLink} onClick={() => copyText(window.location.href, labels.linkCopied)}>
            <LinkIcon className="buttonIcon" aria-hidden="true" size={18} strokeWidth={2.2} />
            <span>{labels.copyLink}</span>
          </button>
          <button aria-label={labels.downloadMarkdown} className="secondaryButton" type="button" title={labels.downloadMarkdown} onClick={downloadMarkdown}>
            <Download className="buttonIcon" aria-hidden="true" size={18} strokeWidth={2.2} />
            <span>{labels.downloadMarkdown}</span>
          </button>
          <button aria-label={labels.copyMarkdown} className="secondaryButton" type="button" title={labels.copyMarkdown} onClick={() => copyText(markdown, labels.copiedMarkdown)}>
            <Copy className="buttonIcon" aria-hidden="true" size={18} strokeWidth={2.2} />
            <span>{labels.copyMarkdown}</span>
          </button>
          <button aria-label={labels.printReport} className="secondaryButton" type="button" title={labels.printReport} onClick={() => window.print()}>
            <Printer className="buttonIcon" aria-hidden="true" size={18} strokeWidth={2.2} />
            <span>{labels.printReport}</span>
          </button>
          <button aria-label={deleting ? labels.deletingReport : labels.deleteReport} className="dangerButton" type="button" title={deleting ? labels.deletingReport : labels.deleteReport} onClick={deleteReport} disabled={deleting} aria-busy={deleting}>
            <Trash2 className="buttonIcon" aria-hidden="true" size={18} strokeWidth={2.2} />
            <span>{deleting ? labels.deletingReport : labels.deleteReport}</span>
          </button>
        </div>
      </div>
      {share ? (
        <div className="reportShareBox">
          <div className="reportShareHeader">
            <span>{labels.sharePanelTitle}</span>
            <small>{labels.sharePanelDescription}</small>
          </div>
          <div className="reportShareActions">
            <button className="secondaryButton" type="button" onClick={() => copyText(share.shareUrl, labels.shareLinkCopied)}>
              <LinkIcon className="buttonIcon" aria-hidden="true" size={17} strokeWidth={2.2} />
              <span>{labels.copyShareLink}</span>
            </button>
            <button className="secondaryButton" type="button" onClick={openNativeShare}>
              <MessageCircle className="buttonIcon" aria-hidden="true" size={17} strokeWidth={2.2} />
              <span>{labels.messageShare}</span>
            </button>
            <button className="secondaryButton" type="button" onClick={() => copyText(`${share.subject}\n\n${share.body}`, labels.emailCopied)}>
              <Copy className="buttonIcon" aria-hidden="true" size={17} strokeWidth={2.2} />
              <span>{labels.copyEmail}</span>
            </button>
            <a className="secondaryButton" href={mailtoHref}>
              <Mail className="buttonIcon" aria-hidden="true" size={17} strokeWidth={2.2} />
              <span>{labels.openEmail}</span>
            </a>
            <button className="dangerButton" type="button" onClick={revokeShareLink} disabled={revokingShare} aria-busy={revokingShare}>
              <Trash2 className="buttonIcon" aria-hidden="true" size={17} strokeWidth={2.2} />
              <span>{revokingShare ? labels.revokingShare : labels.revokeShare}</span>
            </button>
          </div>
          <label>
            <span>{labels.copyShareLink}</span>
            <input readOnly value={share.shareUrl} onFocus={(event) => event.currentTarget.select()} />
          </label>
        </div>
      ) : null}
      {status ? (
        <p className="reportActionStatus" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="reportActionError" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
