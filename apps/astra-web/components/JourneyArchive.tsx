"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ui } from "../lib/i18n";

export type JourneyArchiveItem = { id: string; title: string; subtitle?: string };

export function JourneyArchive({ items }: { items: JourneyArchiveItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string>();
  const [error, setError] = useState("");

  async function restore(feedItemId: string) {
    setPendingId(feedItemId);
    setError("");
    try {
      const response = await fetch(`/api/journey/items/${encodeURIComponent(feedItemId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "restore" })
      });
      if (!response.ok) throw new Error("journey_restore_failed");
      router.refresh();
    } catch {
      setError(ui.journey.actionError);
    } finally {
      setPendingId(undefined);
    }
  }

  if (!items.length) return null;
  return (
    <section className="journey-archive card" aria-label={ui.library.journeyArchiveLabel}>
      <div className="journey-archive-heading">
        <div><div className="eyebrow">{ui.library.journeyArchiveEyebrow}</div><h2>{ui.library.journeyArchiveTitle}</h2></div>
        <span>{ui.library.journeyArchiveCount(items.length)}</span>
      </div>
      <p>{ui.library.journeyArchiveIntro}</p>
      <ul>
        {items.map((item) => <li key={item.id}>
          <div><strong>{item.title}</strong>{item.subtitle ? <span>{item.subtitle}</span> : null}</div>
          <button className="button secondary journey-archive-restore" disabled={pendingId === item.id} onClick={() => restore(item.id)} type="button">{ui.library.journeyArchiveRestore}</button>
        </li>)}
      </ul>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>
  );
}
