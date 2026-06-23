import Link from "next/link";
import { PageHeader } from "../../components/PageHeader";
import { BirthOnboardingPanel } from "../../components/BirthOnboardingPanel";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";
import { db, listUserAllies, listUserAstrologyReportRequests, listUserAstrologyReportResults, listUserChartMakerRequests } from "@astra/db";

export const dynamic = "force-dynamic";

export default async function AlliesPage() {
  const { profile } = await getAstraAuthContext();

  if (!profile) {
    return (
      <>
        <PageHeader eyebrow={ui.allies.eyebrow} title={ui.allies.signedOutTitle}>
          {ui.allies.signedOutIntro}
        </PageHeader>
        <section className="grid" aria-label={ui.allies.listLabel}>
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

  const [allies, chartRequests, reportRequests, reportResults] = await Promise.all([
    listUserAllies(db, profile.userId),
    listUserChartMakerRequests(db, profile.userId),
    listUserAstrologyReportRequests(db, profile.userId),
    listUserAstrologyReportResults(db, profile.userId)
  ]);
  const allyChartRequests = chartRequests.filter((request) => request.source === "ally");
  const allyReportRequests = reportRequests.filter((request) => request.source === "ally");
  const allyReportRequestIds = new Set(allyReportRequests.map((request) => request.id));
  const allyReportResults = reportResults.filter((result) => allyReportRequestIds.has(result.requestId));

  return (
    <>
      <PageHeader eyebrow={ui.allies.eyebrow} title={ui.allies.title}>
        {ui.allies.intro}
      </PageHeader>
      <section className="list" aria-label={ui.allies.listLabel}>
        {allies.length ? allies.map((ally) => (
          <article className="card" key={ally.id}>
            <div className="eyebrow">{ally.kind}</div>
            <h2>{ally.name}</h2>
            <p>{ally.relationship}</p>
            {ally.note ? <p>{ally.note}</p> : null}
          </article>
        )) : (
          <article className="card">
            <div className="eyebrow">{ui.allies.emptyTitle}</div>
            <h2>{ui.allies.emptyTitle}</h2>
            <p>{ui.allies.emptyBody}</p>
          </article>
        )}
      </section>
      <BirthOnboardingPanel
        displayName=""
        initialAllies={allies}
        initialRequests={allyChartRequests}
        initialReportRequests={allyReportRequests}
        initialReportResults={allyReportResults}
        subjectType="ally"
      />
    </>
  );
}
