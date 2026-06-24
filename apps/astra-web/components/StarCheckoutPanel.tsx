"use client";

import { CreditCard, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { STAR_PACKS, type StarPackKey } from "../lib/stars";
import { ui } from "../lib/i18n";

type StarCheckoutPanelProps = {
  signedIn: boolean;
};

const packKeys: StarPackKey[] = ["core_pack", "deep_pack", "explorer_pack"];

export function StarCheckoutPanel({ signedIn }: StarCheckoutPanelProps) {
  const [open, setOpen] = useState(false);
  const [pendingPack, setPendingPack] = useState<StarPackKey | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.body.classList.add("stars-panel-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("stars-panel-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function startCheckout(packKey: StarPackKey) {
    if (!signedIn) {
      window.location.assign(`/login?next=${encodeURIComponent("/stars")}`);
      return;
    }

    setPendingPack(packKey);
    setStatus(ui.stars.checkoutOpening);
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          productKey: packKey,
          successUrl: `${window.location.origin}/stars?checkout=success`,
          cancelUrl: `${window.location.origin}/stars?checkout=cancelled`
        })
      });
      const payload = (await response.json()) as { error?: string; ok?: boolean; url?: string };
      if (payload.ok && payload.url) {
        window.location.assign(payload.url);
        return;
      }
      setStatus(payload.error ?? ui.stars.checkoutUnavailable);
    } catch {
      setStatus(ui.stars.checkoutFailed);
    } finally {
      setPendingPack(null);
    }
  }

  return (
    <>
      <button className="starsAddButton" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <Sparkles aria-hidden="true" size={18} />
        {ui.stars.addStars}
      </button>

      {open ? (
        <div className="starsPanelLayer" role="presentation">
          <button className="starsPanelScrim" type="button" aria-label={ui.stars.closePanel} onClick={() => setOpen(false)} />
          <section className="starsPanel" role="dialog" aria-modal="true" aria-labelledby="stars-panel-title">
            <header className="starsPanelHeader">
              <div>
                <p className="eyebrow">{ui.stars.checkoutEyebrow}</p>
                <h2 id="stars-panel-title">{ui.stars.checkoutTitle}</h2>
              </div>
              <button className="starsPanelClose" type="button" aria-label={ui.stars.closePanel} onClick={() => setOpen(false)}>
                <X aria-hidden="true" size={18} />
              </button>
            </header>
            <div className="starsPackList">
              {packKeys.map((packKey) => {
                const pack = STAR_PACKS[packKey];
                return (
                  <article className="starsPackRow" key={packKey}>
                    <div>
                      <strong>{ui.stars.packStars(pack.stars)}</strong>
                      <span>{pack.label}</span>
                      <small>{pack.note}</small>
                    </div>
                    <button type="button" disabled={pendingPack === packKey} onClick={() => startCheckout(packKey)}>
                      <CreditCard aria-hidden="true" size={16} />
                      {ui.stars.packPrice(pack.priceUsd)}
                    </button>
                  </article>
                );
              })}
            </div>
            {status ? <p className="starsPanelStatus" role="status">{status}</p> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
