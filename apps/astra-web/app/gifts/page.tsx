import Link from "next/link";
import { PageHeader } from "../../components/PageHeader";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function GiftsPage() {
  const { profile } = await getAstraAuthContext();

  if (!profile) {
    return (
      <>
        <PageHeader eyebrow={ui.gifts.eyebrow} title={ui.gifts.signedOutTitle}>
          {ui.gifts.signedOutIntro}
        </PageHeader>
        <section className="gift-list" aria-label={ui.gifts.listLabel}>
          <article className="card gift-panel">
            <div className="gift-panel-heading">
              <span>{ui.login.codeFlowEyebrow}</span>
              <h2>{ui.login.title}</h2>
            </div>
            <p>{ui.login.intro}</p>
            <Link className="button" href="/login?next=/gifts">
              {ui.self.signInCta}
            </Link>
          </article>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow={ui.gifts.eyebrow} title={ui.gifts.title}>
        {ui.gifts.intro}
      </PageHeader>
      <section className="gift-list" aria-label={ui.gifts.listLabel}>
        <article className="card gift-panel">
          <div className="gift-panel-heading">
            <span>{ui.gifts.comingSoonEyebrow}</span>
            <h2>{ui.gifts.comingSoonTitle}</h2>
          </div>
          <p>{ui.gifts.comingSoonBody}</p>
        </article>
        <article className="card gift-panel">
          <div className="gift-panel-heading">
            <span>{ui.gifts.starsEyebrow}</span>
            <h2>{ui.gifts.starsTitle}</h2>
          </div>
          <p>{ui.gifts.starsBody}</p>
          <Link className="button secondary" href="/stars">
            {ui.gifts.openStars}
          </Link>
        </article>
      </section>
    </>
  );
}
