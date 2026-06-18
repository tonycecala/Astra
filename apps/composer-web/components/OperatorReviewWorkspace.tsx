"use client";

import { useState } from "react";
import { Send, Wand2 } from "lucide-react";
import type { ComposerOperatorPreview } from "../src";
import { composerUi } from "../lib/i18n";

type PreviewResponse =
  | { ok: true; preview: ComposerOperatorPreview }
  | { ok: false; error: string; issues?: { field: string; message: string }[] };

type PublishResponse = {
  ok: boolean;
  write?: { feedItem?: { id?: string; userId?: string; title?: string } };
  astra?: unknown;
  error?: string;
  issues?: { field: string; message: string }[];
};

async function requestJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = (await response.json()) as T;
  if (!response.ok) return payload;
  return payload;
}

export function OperatorReviewWorkspace() {
  const [targetUserId, setTargetUserId] = useState("");
  const [runId, setRunId] = useState(() => `operator_ui_${Date.now()}`);
  const [preview, setPreview] = useState<ComposerOperatorPreview | null>(null);
  const [status, setStatus] = useState(composerUi.review.previewRequired);
  const [isBusy, setIsBusy] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(null);

  async function createPreview() {
    setIsBusy(true);
    setPublishResult(null);
    const result = await requestJson<PreviewResponse>("/api/operator/preview", { runId });
    if (result.ok) {
      setPreview(result.preview);
      setStatus(composerUi.review.previewReady);
    } else {
      setStatus(result.issues?.map((issue) => `${issue.field}: ${issue.message}`).join("; ") || result.error);
    }
    setIsBusy(false);
  }

  async function publish() {
    if (!preview) {
      setStatus(composerUi.review.previewFirst);
      return;
    }
    setIsBusy(true);
    const result = await requestJson<PublishResponse>("/api/operator/publish", { preview, targetUserId });
    setPublishResult(result);
    setStatus(result.ok ? composerUi.review.published : result.issues?.map((issue) => issue.message).join("; ") || result.error || composerUi.review.publishFailed);
    setIsBusy(false);
  }

  return (
    <section className="operator-layout">
      <div className="panel operator-form">
        <div className="field-grid">
          <label>
            <span>{composerUi.review.draftRun}</span>
            <input value={runId} onChange={(event) => setRunId(event.target.value)} />
          </label>
          <label>
            <span>{composerUi.review.targetUserId}</span>
            <input value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} placeholder={composerUi.review.targetUserPlaceholder} />
          </label>
        </div>
        <div className="button-row">
          <button className="secondary-button" disabled={isBusy} onClick={createPreview} type="button">
            <Wand2 aria-hidden="true" size={17} />
            {composerUi.review.preview}
          </button>
          <button className="primary-button" disabled={isBusy || !preview} onClick={publish} type="button">
            <Send aria-hidden="true" size={17} />
            {composerUi.review.publish}
          </button>
        </div>
        <p className="status-line">{status}</p>
      </div>

      <div className="panel preview-panel">
        <div className="panel-header">
          <div>
            <h2>{composerUi.review.previewPanelTitle}</h2>
            <p>{preview ? composerUi.review.targetRequired : composerUi.review.noPreview}</p>
          </div>
        </div>
        {preview ? (
          <article className="feed-preview">
            <span>{preview.previewFeedItem.reasonCode}</span>
            <h2>{preview.previewFeedItem.title}</h2>
            <p>{preview.previewFeedItem.body}</p>
            <dl>
              <div>
                <dt>{composerUi.review.source}</dt>
                <dd>{preview.sourceCard.id}</dd>
              </div>
              <div>
                <dt>{composerUi.review.rank}</dt>
                <dd>{preview.previewFeedItem.rankScore}</dd>
              </div>
              <div>
                <dt>{composerUi.review.decision}</dt>
                <dd>{preview.decisionPreview.decisionVersion}</dd>
              </div>
            </dl>
          </article>
        ) : null}
        {publishResult?.ok ? (
          <p className="success-line">
            {composerUi.review.feedItemCreated} {publishResult.write?.feedItem?.id ?? composerUi.review.created} {composerUi.review.forUser}{" "}
            {publishResult.write?.feedItem?.userId ?? targetUserId}.
          </p>
        ) : null}
      </div>
    </section>
  );
}
