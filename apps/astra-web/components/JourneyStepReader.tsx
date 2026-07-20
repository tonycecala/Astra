"use client";

import type { JourneyFeedItemAction } from "@astra/contracts";
import { PublishedCard } from "@astra/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ui } from "../lib/i18n";
import type { JourneyStep } from "../lib/journey";

export function JourneyStepReader({ currentStep, queue, saved }: { currentStep?: JourneyStep; queue: JourneyStep[]; saved: JourneyStep[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string>();
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
      if (action === "dismiss") setNotice({ feedItemId, message: ui.journey.dismissedNotice });
      else if (action === "complete") setNotice({ feedItemId, message: ui.journey.completedNotice });
      else if (action === "restore") setNotice(undefined);
      router.refresh();
    } catch {
      setError(ui.journey.actionError);
    } finally {
      setPendingId(undefined);
    }
  }

  if (!currentStep) {
    return <section className="journey-empty" aria-label={ui.journey.currentStepLabel}><h2>{ui.journey.emptyTitle}</h2><p>{ui.journey.emptyBody}</p>{error ? <p className="form-error" role="alert">{error}</p> : null}{notice ? <p className="journey-notice" role="status"><span>{notice.message}</span><button className="text-button" disabled={pendingId === notice.feedItemId} onClick={() => act(notice.feedItemId, "restore")} type="button">{ui.journey.undo}</button></p> : null}<Link className="button" href="/self">{ui.journey.emptyAction}</Link></section>;
  }

  return (
    <div className="journey-step-layout">
      <main className="journey-current-step" aria-label={ui.journey.currentStepLabel}>
        <article className="journey-current-card stream-card astraPublishedCard">
          <PublishedCard
            bodyText={currentStep.card.body}
            className="stream-card-open"
            contentClassName="stream-card-content"
            eyebrow={ui.journey.currentStep}
            imageAlt={currentStep.card.imageUrl ? currentStep.card.title : ""}
            imageFallback={ui.journey.lanes[currentStep.card.lane]}
            imageUrl={currentStep.card.imageUrl}
            mediaClassName="stream-card-media astraStreamArtFrame"
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
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {notice ? <p className="journey-notice" role="status"><span>{notice.message}</span><button className="text-button" disabled={pendingId === notice.feedItemId} onClick={() => act(notice.feedItemId, "restore")} type="button">{ui.journey.undo}</button></p> : null}
        <div className="journey-step-actions" aria-label={ui.journey.stepActionsLabel}>
          {currentStep.primaryAction ? <Link className="button" href={currentStep.primaryAction.href} prefetch={false}>{currentStep.primaryAction.label}</Link> : null}
          <button className={currentStep.primaryAction ? "button secondary" : "button"} disabled={pendingId === currentStep.item.id} onClick={() => act(currentStep.item.id, "complete")} type="button">{ui.journey.completeStep}</button>
          <button className="button secondary" disabled={pendingId === currentStep.item.id} onClick={() => act(currentStep.item.id, "save")} type="button">{ui.journey.saveForLater}</button>
          <button className="button ghost" disabled={pendingId === currentStep.item.id} onClick={() => act(currentStep.item.id, "dismiss")} type="button">{ui.journey.dismissStep}</button>
        </div>
      </main>
      <aside className="journey-queue" aria-label={ui.journey.upNextLabel}>
        <div className="journey-queue-heading"><h2>{ui.journey.upNext}</h2><span>{ui.journey.stepCount(queue.length)}</span></div>
        {queue.length ? <ol>{queue.map((step) => <li key={step.item.id}><strong>{step.card.title}</strong>{step.card.subtitle ? <span>{step.card.subtitle}</span> : null}</li>)}</ol> : <p>{ui.journey.queueEmpty}</p>}
        {saved.length ? <section className="journey-saved"><h3>{ui.journey.savedForLater}</h3><ul>{saved.map((step) => <li key={step.item.id}><span>{step.card.title}</span><button className="text-button" disabled={pendingId === step.item.id} onClick={() => act(step.item.id, "restore")} type="button">{ui.journey.restoreStep}</button></li>)}</ul></section> : null}
      </aside>
    </div>
  );
}
