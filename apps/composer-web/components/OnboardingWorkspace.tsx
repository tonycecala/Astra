"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { ComposerOnboardingSeedCard } from "../src";
import { composerUi } from "../lib/i18n";

type CardsResponse = { ok: true; cards: ComposerOnboardingSeedCard[] };
type PublishResponse = {
  ok: boolean;
  batch?: { id: string; targetUserId: string; cards: unknown[] };
  astra?: { batch?: { writes?: unknown[] }; error?: string };
  error?: string;
  issues?: { field: string; message: string }[];
};

async function requestJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return (await response.json()) as T;
}

export function OnboardingWorkspace() {
  const [cards, setCards] = useState<ComposerOnboardingSeedCard[]>([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [status, setStatus] = useState(composerUi.onboarding.ready);
  const [isBusy, setIsBusy] = useState(false);
  const [result, setResult] = useState<PublishResponse | null>(null);

  useEffect(() => {
    void requestJson<CardsResponse>("/api/onboarding/preview").then((payload) => setCards(payload.cards));
  }, []);

  async function publish() {
    setIsBusy(true);
    setResult(null);
    const payload = await requestJson<PublishResponse>("/api/onboarding/publish", { targetUserId });
    setResult(payload);
    setStatus(payload.ok ? composerUi.onboarding.published : payload.issues?.map((issue) => issue.message).join("; ") || payload.error || composerUi.onboarding.publishFailed);
    setIsBusy(false);
  }

  return (
    <section className="operator-layout">
      <div className="panel operator-form">
        <label>
          <span>{composerUi.onboarding.targetUserId}</span>
          <input value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} placeholder={composerUi.onboarding.targetUserPlaceholder} />
        </label>
        <button className="primary-button" disabled={isBusy} onClick={publish} type="button">
          <Send aria-hidden="true" size={17} />
          {composerUi.onboarding.publishBatch}
        </button>
        <p className="status-line">{status}</p>
        {result?.ok ? (
          <p className="success-line">
            {result.batch?.cards.length ?? 0} {composerUi.onboarding.cardsSent} {result.batch?.targetUserId}.
          </p>
        ) : null}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>{composerUi.onboarding.cards}</h2>
            <p>
              {cards.length} {composerUi.onboarding.privateFirstRunProjections}
            </p>
          </div>
        </div>
        <div className="card-list">
          {cards.map((card) => (
            <article className="list-card" key={card.id}>
              <span>{card.order}</span>
              <div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
              <strong>{card.lane.replaceAll("_", " ")}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
