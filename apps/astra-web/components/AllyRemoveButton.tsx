"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import { ui } from "../lib/i18n";

export function AllyRemoveButton({ allyId, allyName }: { allyId: string; allyName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeAlly() {
    setRemoving(true);
    setError(null);
    try {
      const response = await fetch(`/api/allies/${encodeURIComponent(allyId)}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error(ui.allies.removeError);
      setConfirming(false);
      router.refresh();
    } catch {
      setError(ui.allies.removeError);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <button
        aria-label={`${ui.allies.removeAction}: ${allyName}`}
        className="button secondary ally-remove-button"
        onClick={() => setConfirming(true)}
        title={ui.allies.removeAction}
        type="button"
      >
        <Trash2 aria-hidden="true" size={16} />
      </button>
      {confirming ? (
        <div className="ally-remove-layer" role="presentation">
          <div aria-labelledby="ally-remove-title" aria-modal="true" className="ally-remove-dialog" role="dialog">
            <h3 id="ally-remove-title">{ui.allies.removeTitle}</h3>
            <p>{ui.allies.removeBody}</p>
            {error ? <p className="ally-remove-error">{error}</p> : null}
            <div className="ally-remove-actions">
              <button className="button dangerButton" disabled={removing} onClick={removeAlly} type="button">
                {removing ? ui.allies.removingAction : ui.allies.removeConfirm}
              </button>
              <button className="button secondary" disabled={removing} onClick={() => setConfirming(false)} type="button">
                {ui.allies.removeCancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
