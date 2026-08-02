"use client";

import type { JourneyFeedItemAction } from "@astra/contracts";
import { PublishedCard } from "@astra/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ui } from "../lib/i18n";
import type { JourneyStep } from "../lib/journey";

export function JourneyStepReader({
  currentStep,
  queue,
  queuedStepCount
}: {
  currentStep?: JourneyStep;
  queue: JourneyStep[];
  queuedStepCount: number;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string>();
  const [acknowledgedId, setAcknowledgedId] = useState<string>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ feedItemId: string; message: string }>();

  async function act(feedItemId: string, action: JourneyFeedItemAction) {
    setPendingId(feedItemId);
    setError("");
    try {
      const response = await fetch(`/api/journey/items/${encodeURIComponent(feedItemId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error("journey_action_failed");
      if (action === "acknowledge") {
        setAcknowledgedId(feedItemId);
        setNotice({ feedItemId, message: ui.journey.acknowledgedNotice });
      }
      else if (action === "archive") setNotice({ feedItemId, message: ui.journey.archivedNotice });
      else if (action === "restore") {
        setAcknowledgedId(undefined);
        setNotice(undefined);
      }
      // OK intentionally leaves the current card in place. A later Journey
      // item will take priority when the view next refreshes.
      if (action !== "acknowledge") router.refresh();
    } catch {
      setError(ui.journey.actionError);
    } finally {
      setPendingId(undefined);
    }
  }

  if (!currentStep) {
    return <section className="journey-empty" aria-label={ui.journey.currentStepLabel}><h2>{ui.journey.emptyTitle}</h2><p>{ui.journey.emptyBody}</p>{error ? <p className="form-error" role="alert">{error}</p> : null}{notice ? <p className="journey-notice" role="status"><span>{notice.message}</span><button className="text-button" disabled={pendingId === notice.feedItemId} onClick={() => act(notice.feedItemId, "restore")} type="button">{ui.journey.undo}</button></p> : null}<Link className="button" href="/self">{ui.journey.emptyAction}</Link></section>;
  }

  const acknowledged = acknowledgedId === currentStep.item.id || typeof currentStep.item.displayPayload.acknowledgedAt === "string";

  return (
    <div className="journey-step-layout">
      <main className="journey-current-step" aria-label={ui.journey.currentStepLabel}>
        <article className={`journey-current-card stream-card astraPublishedCard${acknowledged ? " journey-current-card--acknowledged" : ""}`}>
          <PublishedCard
            bodyText={currentStep.card.body}
            className="stream-card-open"
            contentClassName="stream-card-content"
            eyebrow={ui.journey.currentStep}
            imageAlt={currentStep.card.imageUrl ? currentStep.card.title : ""}
            imageUrl={currentStep.card.imageUrl}
            mediaClassName="stream-card-media astraStreamArtFrame"
            showMedia={Boolean(currentStep.card.imageUrl)}
            showLessLabel={ui.journey.showLess}
            showMoreLabel={ui.journey.showMore}
            subtitle={currentStep.card.subtitle}
            title={currentStep.card.title}
          />
        </article>
        <details className="journey-provenance">
          <summary>{ui.journey.whyThisNow}</summary>
          <p>{currentStep.provenance}</p>
        </details>
        {acknowledged ? <p className="journey-acknowledged" role="status"><span aria-hidden="true">✓</span><strong>{ui.journey.notedStep}</strong><span>{ui.journey.notedHint}</span></p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {notice ? <p className="journey-notice" role="status"><span>{notice.message}</span><button className="text-button" disabled={pendingId === notice.feedItemId} onClick={() => act(notice.feedItemId, "restore")} type="button">{ui.journey.undo}</button></p> : null}
        <div className="journey-step-actions" aria-label={ui.journey.stepActionsLabel}>
          {currentStep.primaryAction ? <Link className="button journey-action-primary" href={currentStep.primaryAction.href} prefetch={false}>{currentStep.primaryAction.label}</Link> : null}
          <button className={`button ${currentStep.primaryAction ? "journey-action-secondary" : "journey-action-primary"}`} disabled={acknowledged || pendingId === currentStep.item.id} onClick={() => act(currentStep.item.id, "acknowledge")} type="button">{acknowledged ? ui.journey.notedStep : ui.journey.okStep}</button>
          <button className="button journey-action-tertiary" disabled={pendingId === currentStep.item.id} onClick={() => act(currentStep.item.id, "archive")} type="button">{ui.journey.archiveStep}</button>
        </div>
      </main>
      <aside className="journey-queue" aria-label={ui.journey.upNextLabel}>
        <div className="journey-queue-heading"><h2>{ui.journey.upNext}</h2><span>{ui.journey.stepCount(queuedStepCount)}</span></div>
        {queue.length ? <ol>{queue.map((step) => <li key={step.item.id}><strong>{step.card.title}</strong>{step.card.subtitle ? <span>{step.card.subtitle}</span> : null}</li>)}</ol> : <p>{ui.journey.queueEmpty}</p>}
        {queuedStepCount > queue.length ? <p className="journey-queue-remainder">{ui.journey.queueRemainder(queuedStepCount - queue.length)}</p> : null}
      </aside>
    </div>
  );
}
