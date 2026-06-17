import Link from "next/link";
import { db, listUserAstrologyReportRequests, listUserAstrologyReportResults, listUserChartMakerRequests } from "@astra/db";
import { BirthOnboardingPanel } from "../../components/BirthOnboardingPanel";
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
            <Link className="button" href="/">
              {ui.self.signInCta}
            </Link>
          </article>
        </section>
      </>
    );
  }

  const [chartRequests, reportRequests, reportResults] = await Promise.all([
    listUserChartMakerRequests(db, profile.userId),
    listUserAstrologyReportRequests(db, profile.userId),
    listUserAstrologyReportResults(db, profile.userId)
  ]);

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
      <section className="grid" aria-label={ui.self.reportRequestsLabel}>
        <article className="card">
          <div className="eyebrow">{ui.self.reportRequestsEyebrow}</div>
          <h2>{ui.self.reportRequestsTitle}</h2>
          <p>{ui.self.reportRequestsIntro}</p>
        </article>
        <article className="card">
          <div className="eyebrow">{ui.self.reportRequestsStatusEyebrow}</div>
          <h2>{ui.self.reportRequestsStatusTitle}</h2>
          {reportRequests.length ? (
            <ul className="compact-list">
              {reportRequests.slice(0, 4).map((request) => (
                <li key={request.id}>
                  <span>{request.subjectName}</span>
                  <strong>{request.status}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>{ui.self.reportRequestsEmpty}</p>
          )}
        </article>
        <article className="card">
          <div className="eyebrow">{ui.self.reportBoundaryEyebrow}</div>
          <h2>{ui.self.reportBoundaryTitle}</h2>
          <p>{ui.self.reportBoundaryBody}</p>
        </article>
      </section>
      <BirthOnboardingPanel
        displayName={profile.displayName}
        initialRequests={chartRequests}
        initialReportRequests={reportRequests}
        initialReportResults={reportResults}
      />
    </>
  );
}
