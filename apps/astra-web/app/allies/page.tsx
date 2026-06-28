import Link from "next/link";
import { BookOpenText, ChartPie, Pencil, Search } from "lucide-react";
import type { Ally, AstrologyReportRequest, AstrologyReportResult, ChartMakerRequest } from "@astra/contracts";
import { PageHeader } from "../../components/PageHeader";
import { BirthOnboardingPanel } from "../../components/BirthOnboardingPanel";
import { AllyRemoveButton } from "../../components/AllyRemoveButton";
import { SelfTabAvatar } from "../../components/SelfTabAvatar";
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

function compactBirthLine(chartRequest?: ChartMakerRequest) {
  if (!chartRequest?.birthData.date) return ui.self.noBirthData;
  return [
    chartRequest.birthData.date,
    chartRequest.birthData.birthTimeKnown === false ? ui.self.birthMomentUnknownTimeShort : chartRequest.birthData.time,
    chartRequest.birthData.location
  ].filter(Boolean).join(" · ");
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}` : name.slice(0, 2)).toUpperCase();
}

function AlliesConstellation({
  allies,
  selfEmail,
  selfInitial
}: {
  allies: Ally[];
  selfEmail: string;
  selfInitial: string;
}) {
  const orbitAllies = allies.slice(0, 8);

  return (
    <section className="allies-constellation" aria-label={ui.allies.relationshipTitle}>
      <div className="allies-constellation-copy">
        <p>{ui.allies.relationshipLayer}</p>
        <h2>{ui.allies.relationshipTitle}</h2>
      </div>
      <div className="allies-orbit" aria-hidden="true">
        <span className="allies-orbit-ring allies-orbit-ring-one" />
        <span className="allies-orbit-ring allies-orbit-ring-two" />
        <span className="allies-orbit-ring allies-orbit-ring-three" />
        <div className="allies-orbit-self">
          <SelfTabAvatar className="allies-orbit-avatar" email={selfEmail || null} initial={selfInitial} size={112} />
          <strong>{ui.allies.youLabel}</strong>
        </div>
        {orbitAllies.map((ally, index) => (
          <span className={`allies-orbit-node allies-orbit-node-${index + 1}`} key={ally.id} title={ally.name}>
            {initialsFor(ally.name)}
          </span>
        ))}
      </div>
      <div className="allies-constellation-count">{ui.allies.allyCount(allies.length)}</div>
    </section>
  );
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
  const createPortraitHref = chartRequest
    ? `/allies?chart=${encodeURIComponent(chartRequest.id)}&start=report#ally-birth-onboarding`
    : "#ally-birth-onboarding";
  const editDetailsHref = chartRequest
    ? `/allies?chart=${encodeURIComponent(chartRequest.id)}&start=report#ally-birth-onboarding`
    : "#ally-birth-onboarding";

  return (
    <article className="card ally-card" id={`ally-${ally.id}`}>
      <div className="ally-card-header">
        <div className="ally-card-identity">
          <div className="ally-card-title-row">
            <h2>{ally.name}</h2>
            <span className="ally-card-badge">{ally.relationship}</span>
          </div>
          <span className="ally-card-birth">{compactBirthLine(chartRequest)}</span>
        </div>
        <div className="ally-card-controls">
          <div className="ally-card-actions" role="group" aria-label={`${ui.allies.cardActionsLabel}: ${ally.name}`}>
            {chartRequest ? (
              <Link aria-label={ui.charts.viewChart} className="button secondary" href={`/charts?chart=${encodeURIComponent(chartRequest.id)}`} title={ui.charts.viewChart}>
                <ChartPie aria-hidden="true" size={16} />
              </Link>
            ) : null}
            {report ? (
              <span className="compact-list-report-actions">
                <Link aria-label={ui.charts.viewPortrait} href={`/library?reportId=${encodeURIComponent(report.requestId)}`} title={ui.charts.viewPortrait}>
                  <BookOpenText aria-hidden="true" size={16} />
                </Link>
              </span>
            ) : (
              <Link aria-label={ui.charts.createPortrait} className="button secondary" href={createPortraitHref} title={ui.charts.createPortrait}>
                <BookOpenText aria-hidden="true" size={16} />
              </Link>
            )}
            <Link aria-label={ui.charts.editDetails} className="button secondary" href={editDetailsHref} title={ui.charts.editDetails}>
              <Pencil aria-hidden="true" size={16} />
            </Link>
            <AllyRemoveButton allyId={ally.id} allyName={ally.name} />
          </div>
        </div>
      </div>
    </article>
  );
}

type AlliesPageParams = {
  searchParams?: Promise<{
    chart?: string;
    q?: string;
    relationship?: string;
    start?: string;
  }>;
};

function onboardingStepFromParam(value?: string) {
  return value === "birth_details" || value === "report" ? value : undefined;
}

function cleanFilter(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

export default async function AlliesPage({ searchParams }: AlliesPageParams = {}) {
  const params = searchParams ? await searchParams : {};
  const { profile } = await getAstraAuthContext();

  if (!profile) {
    return (
      <>
        <PageHeader eyebrow={ui.allies.eyebrow} title={ui.allies.signedOutTitle}>
          {ui.allies.signedOutIntro}
        </PageHeader>
        <section className="auth-gate-grid" aria-label={ui.allies.listLabel}>
          <article className="card auth-gate-card">
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
  const allyChartRequests = chartRequests.filter((request) => request.source !== "self");
  const allyReportRequests = reportRequests.filter((request) => request.source === "ally");
  const allyReportRequestIds = new Set(allyReportRequests.map((request) => request.id));
  const allyReportResults = reportResults.filter((result) => allyReportRequestIds.has(result.requestId));
  const latestChartRequestByAllyId = new Map<string, ChartMakerRequest>();
  for (const request of allyChartRequests) {
    const allyId = allyIdFromChartRequest(request);
    if (allyId && !latestChartRequestByAllyId.has(allyId)) {
      latestChartRequestByAllyId.set(allyId, request);
    }
    const importedAllyId = allyId ? `v1-ally:${allyId}` : null;
    if (importedAllyId && !latestChartRequestByAllyId.has(importedAllyId)) {
      latestChartRequestByAllyId.set(importedAllyId, request);
    }
  }
  const selectedOnboardingChart = params.chart
    ? allyChartRequests.find((request) => request.id === params.chart)
    : undefined;
  const initialOnboardingStep = selectedOnboardingChart ? "report" : onboardingStepFromParam(params.start);
  const clearFilterParams = new URLSearchParams();
  if (params.chart) clearFilterParams.set("chart", params.chart);
  if (params.start) clearFilterParams.set("start", params.start);
  const clearFilterHref = `/allies${clearFilterParams.toString() ? `?${clearFilterParams.toString()}` : ""}`;
  const filterQuery = params.q?.trim() ?? "";
  const filterRelationship = params.relationship?.trim() ?? "";
  const relationshipOptions = Array.from(new Set(allies.map((ally) => ally.relationship).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const filteredAllies = allies.filter((ally) => {
    const chartRequest = latestChartRequestByAllyId.get(ally.id);
    const haystack = [ally.name, ally.relationship, compactBirthLine(chartRequest)].join(" ").toLowerCase();
    const matchesQuery = filterQuery ? haystack.includes(cleanFilter(filterQuery)) : true;
    const matchesRelationship = filterRelationship ? ally.relationship === filterRelationship : true;
    return matchesQuery && matchesRelationship;
  });

  return (
    <>
      <section className="allies-v1-intro" aria-labelledby="allies-title">
        <p>{ui.allies.eyebrow}</p>
        <h1 id="allies-title">{ui.allies.title}</h1>
        <div>{ui.allies.intro}</div>
      </section>
      <AlliesConstellation
        allies={allies}
        selfEmail={profile.email}
        selfInitial={profile.displayName.trim().slice(0, 1).toUpperCase() || "A"}
      />
      <form action="/allies" className="list-filter-bar allies-list-filter-bar">
        {params.chart ? <input name="chart" type="hidden" value={params.chart} /> : null}
        {params.start ? <input name="start" type="hidden" value={params.start} /> : null}
        <div className="list-filter-control list-filter-search-control">
          <span className="list-filter-search">
            <Search aria-hidden="true" size={15} />
            <input aria-label={ui.allies.filterSearchLabel} defaultValue={filterQuery} name="q" placeholder={ui.allies.filterSearchPlaceholder} type="search" />
          </span>
        </div>
        <div className="list-filter-control">
          <span className="list-filter-select">
            <select aria-label={ui.allies.filterRelationshipLabel} defaultValue={filterRelationship} name="relationship">
              <option value="">{ui.allies.filterAllRelationships}</option>
              {relationshipOptions.map((relationship) => (
                <option key={relationship} value={relationship}>
                  {relationship}
                </option>
              ))}
            </select>
          </span>
        </div>
        <button className="button secondary" type="submit">
          {ui.allies.filterApply}
        </button>
        {filterQuery || filterRelationship ? (
          <Link className="button secondary" href={clearFilterHref}>
            {ui.allies.filterClear}
          </Link>
        ) : null}
      </form>
      <section className="list allies-list" aria-label={ui.allies.listLabel}>
        {filteredAllies.length ? filteredAllies.map((ally) => (
          <AllyCard
            ally={ally}
            chartRequest={latestChartRequestByAllyId.get(ally.id)}
            key={ally.id}
            report={latestReportForChartRequest(latestChartRequestByAllyId.get(ally.id), allyReportRequests, allyReportResults)}
          />
        )) : (
          <article className="card">
            <div className="eyebrow">{ui.allies.emptyTitle}</div>
            <h2>{allies.length ? ui.allies.filterEmptyTitle : ui.allies.emptyTitle}</h2>
            <p>{allies.length ? ui.allies.filterEmptyBody : ui.allies.emptyBody}</p>
          </article>
        )}
      </section>
      <section id="ally-birth-onboarding">
        <BirthOnboardingPanel
          displayName=""
          initialAllies={allies}
          key={selectedOnboardingChart?.id ?? "new-ally-chart"}
          role={profile.role}
          starBalance={profile.starBalance}
          initialRequests={allyChartRequests}
          initialReportRequests={allyReportRequests}
          initialReportResults={allyReportResults}
          initialBirthData={selectedOnboardingChart?.birthData}
          initialChartRequestId={selectedOnboardingChart?.id}
          initialStep={initialOnboardingStep}
          subjectType="ally"
          hideSummaryRail
        />
      </section>
    </>
  );
}
