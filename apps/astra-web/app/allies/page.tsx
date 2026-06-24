import Link from "next/link";
import type { Ally, AstrologyReportRequest, AstrologyReportResult, ChartMakerRequest } from "@astra/contracts";
import { PageHeader } from "../../components/PageHeader";
import { BirthOnboardingPanel } from "../../components/BirthOnboardingPanel";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";
import { db, listUserAllies, listUserAstrologyReportRequests, listUserAstrologyReportResults, listUserChartMakerRequests } from "@astra/db";

export const dynamic = "force-dynamic";

function allyIdFromChartRequest(request: ChartMakerRequest) {
  const subject = request.context?.subject;
  if (!subject || typeof subject !== "object" || Array.isArray(subject)) return null;
  const allyId = "allyId" in subject ? subject.allyId : "subjectId" in subject ? subject.subjectId : null;
  return typeof allyId === "string" && allyId ? allyId : null;
}

function latestReportForChartRequest(
  chartRequest: ChartMakerRequest | undefined,
  requests: AstrologyReportRequest[],
  results: AstrologyReportResult[]
) {
  if (!chartRequest) return null;
  const reportRequestIds = new Set(requests.filter((request) => request.chartRequestId === chartRequest.id).map((request) => request.id));
  return results.find((result) => reportRequestIds.has(result.requestId) && result.status === "completed") ?? null;
}

function AllyCard({
  ally,
  chartRequest,
  report
}: {
  ally: Ally;
  chartRequest?: ChartMakerRequest;
  report: AstrologyReportResult | null;
}) {
  return (
    <article className="card ally-card" id={`ally-${ally.id}`}>
      <div className="ally-card-header">
        <div>
          <div className="eyebrow">{ally.kind}</div>
          <h2>{ally.name}</h2>
        </div>
        <span className="ally-card-badge">{ally.relationship}</span>
      </div>
      {ally.note ? <p>{ally.note}</p> : null}
      <div className="ally-card-meta">
        <span>{chartRequest ? ui.allies.chartReady : ui.allies.chartMissing}</span>
        <span>{report ? ui.allies.reportWritten : ui.allies.reportMissing}</span>
      </div>
      <div className="ally-card-actions" role="group" aria-label={`${ui.allies.cardActionsLabel}: ${ally.name}`}>
        {chartRequest ? (
          <Link className="button secondary" href={`/charts?chart=${encodeURIComponent(chartRequest.id)}`}>
            {ui.charts.viewChart}
          </Link>
        ) : null}
        {report ? (
          <Link className="button secondary" href={`/library?reportId=${encodeURIComponent(report.requestId)}`}>
            {ui.charts.viewPortrait}
          </Link>
        ) : (
          <a className="button secondary" href="#ally-birth-onboarding">
            {ui.charts.createPortrait}
          </a>
        )}
        <a className="button secondary" href="#ally-birth-onboarding">
          {ui.charts.editDetails}
        </a>
      </div>
    </article>
  );
}

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
  const latestChartRequestByAllyId = new Map<string, ChartMakerRequest>();
  for (const request of allyChartRequests) {
    const allyId = allyIdFromChartRequest(request);
    if (allyId && !latestChartRequestByAllyId.has(allyId)) {
      latestChartRequestByAllyId.set(allyId, request);
    }
  }

  return (
    <>
      <PageHeader eyebrow={ui.allies.eyebrow} title={ui.allies.title}>
        {ui.allies.intro}
      </PageHeader>
      <section className="list" aria-label={ui.allies.listLabel}>
        {allies.length ? allies.map((ally) => (
          <AllyCard
            ally={ally}
            chartRequest={latestChartRequestByAllyId.get(ally.id)}
            key={ally.id}
            report={latestReportForChartRequest(latestChartRequestByAllyId.get(ally.id), allyReportRequests, allyReportResults)}
          />
        )) : (
          <article className="card">
            <div className="eyebrow">{ui.allies.emptyTitle}</div>
            <h2>{ui.allies.emptyTitle}</h2>
            <p>{ui.allies.emptyBody}</p>
          </article>
        )}
      </section>
      <section id="ally-birth-onboarding">
        <BirthOnboardingPanel
          displayName=""
          initialAllies={allies}
          initialRequests={allyChartRequests}
          initialReportRequests={allyReportRequests}
          initialReportResults={allyReportResults}
          subjectType="ally"
        />
      </section>
    </>
  );
}
