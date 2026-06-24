import Link from "next/link";
import { StarCheckoutPanel } from "../../components/StarCheckoutPanel";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { STAR_PACKS } from "../../lib/stars";
import { ui } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function StarsPage({ searchParams }: { searchParams?: Promise<{ checkout?: string }> }) {
  const { profile } = await getAstraAuthContext();
  const params = await searchParams;
  const checkoutState = params?.checkout;
  const balance = profile?.starBalance ?? 0;
  const signedIn = Boolean(profile);

  return (
    <section className="starsPage" aria-labelledby="stars-title">
      <header className="starsHero">
        <p className="eyebrow">{ui.stars.eyebrow}</p>
        <h1 id="stars-title">{ui.stars.title}</h1>
        <p>{signedIn ? ui.stars.introSignedIn : ui.stars.introSignedOut}</p>
        <div className="starsBalancePlate">
          <span>{ui.stars.balanceLabel}</span>
          <strong>{ui.stars.balance(balance)}</strong>
        </div>
        <div className="starsHeroActions">
          <StarCheckoutPanel signedIn={signedIn} />
          {!signedIn ? (
            <Link className="button secondary" href="/login?next=/stars">
              {ui.account.signIn}
            </Link>
          ) : null}
        </div>
        {checkoutState === "success" ? <p className="starsCheckoutNotice">{ui.stars.checkoutSuccess}</p> : null}
        {checkoutState === "cancelled" ? <p className="starsCheckoutNotice">{ui.stars.checkoutCancelled}</p> : null}
      </header>

      <div className="starsValueGrid" aria-label={ui.stars.usesLabel}>
        <article>
          <span>{ui.library.reportTypeIdentity}</span>
          <strong>{ui.stars.reportCost(1)}</strong>
          <p>{ui.stars.identityUse}</p>
        </article>
        <article>
          <span>{ui.library.reportTypeCore}</span>
          <strong>{ui.stars.reportCost(5)}</strong>
          <p>{ui.stars.coreUse}</p>
        </article>
        <article>
          <span>{STAR_PACKS.explorer_pack.label}</span>
          <strong>{ui.stars.packStars(STAR_PACKS.explorer_pack.stars)}</strong>
          <p>{STAR_PACKS.explorer_pack.note}</p>
        </article>
      </div>
    </section>
  );
}
