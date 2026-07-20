"use client";

import type { JourneyFeedItemAction } from "@astra/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ui } from "../lib/i18n";
import type { JourneyStep } from "../lib/journey";

export function JourneyStepReader({ currentStep, queue, saved }: { currentStep?: JourneyStep; queue: JourneyStep[]; saved: JourneyStep[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string>();
  const [error, setError] = useState("");

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
      router.refresh();
    } catch {
      setError(ui.journey.actionError);
    } finally {
      setPendingId(undefined);
    }
  }

  if (!currentStep) {
    return <section className="journey-empty" aria-label={ui.journey.currentStepLabel}><h2>{ui.journey.emptyTitle}</h2><p>{ui.journey.emptyBody}</p></section>;
  }

  return (
    <div className="journey-step-layout">
      <main className="journey-current-step" aria-label={ui.journey.currentStepLabel}>
        <p className="eyebrow">{ui.journey.currentStep}</p>
        <h2>{currentStep.card.title}</h2>
        {currentStep.card.subtitle ? <p className="journey-step-subtitle">{currentStep.card.subtitle}</p> : null}
        <p className="journey-step-body">{currentStep.card.body}</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="journey-step-actions" aria-label={ui.journey.stepActionsLabel}>
          <button className="button" disabled={pendingId === currentStep.item.id} onClick={() => act(currentStep.item.id, "complete")} type="button">{ui.journey.completeStep}</button>
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
