import Link from "next/link";
import { PageHeader } from "../../components/PageHeader";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";

export default async function SelfPage() {
  const { profile } = await getAstraAuthContext();

  if (!profile) {
    return (
      <>
        <PageHeader eyebrow={ui.self.eyebrow} title={ui.self.signedOutTitle}>
          {ui.self.signedOutIntro}
        </PageHeader>
        <section className="grid" aria-label={ui.self.summaryLabel}>
          <article className="card">
            <div className="eyebrow">{ui.login.codeFlowEyebrow}</div>
            <h2>{ui.login.title}</h2>
            <p>{ui.login.intro}</p>
            <Link className="button" href="/login">
              {ui.self.signInCta}
            </Link>
          </article>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow={ui.self.eyebrow} title={profile.displayName}>
        {ui.self.intro}
      </PageHeader>
      <section className="grid" aria-label={ui.self.summaryLabel}>
        <article className="card">
          <div className="eyebrow">{ui.self.stars}</div>
          <div className="metric">{profile.starBalance}</div>
          <p>{ui.self.starsDescription}</p>
        </article>
        <article className="card">
          <div className="eyebrow">{ui.self.onboarding}</div>
          <h2>{profile.onboardingStatus}</h2>
          <p>{ui.self.onboardingDescription}</p>
        </article>
        <article className="card">
          <div className="eyebrow">{ui.self.achievement}</div>
          <h2>{ui.self.noAchievementTitle}</h2>
          <p>{ui.self.noAchievementDescription}</p>
        </article>
      </section>
    </>
  );
}
