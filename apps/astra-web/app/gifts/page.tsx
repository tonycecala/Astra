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
        <section className="grid" aria-label={ui.gifts.listLabel}>
          <article className="card">
            <div className="eyebrow">{ui.login.codeFlowEyebrow}</div>
            <h2>{ui.login.title}</h2>
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
      <section className="grid" aria-label={ui.gifts.listLabel}>
        <article className="card">
          <div className="eyebrow">{ui.gifts.comingSoonEyebrow}</div>
          <h2>{ui.gifts.comingSoonTitle}</h2>
          <p>{ui.gifts.comingSoonBody}</p>
        </article>
        <article className="card">
          <div className="eyebrow">{ui.gifts.starsEyebrow}</div>
          <h2>{ui.gifts.starsTitle}</h2>
          <p>{ui.gifts.starsBody}</p>
          <Link className="button secondary" href="/stars">
            {ui.gifts.openStars}
          </Link>
        </article>
      </section>
    </>
  );
}
