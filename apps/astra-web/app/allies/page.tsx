import Link from "next/link";
import { BookOpenText, ChartPie, Plus, Search } from "lucide-react";
import { normalizeAllyRelationshipTag, type Ally, type AstrologyReportRequest, type AstrologyReportResult, type ChartMakerRequest } from "@astra/contracts";
import { PageHeader } from "../../components/PageHeader";
import { BirthOnboardingPanel } from "../../components/BirthOnboardingPanel";
import { AllyRemoveButton } from "../../components/AllyRemoveButton";
import { AllyRelationshipEditor } from "../../components/AllyRelationshipEditor";
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

function liveAllyForChart(request: ChartMakerRequest, alliesById: ReadonlyMap<string, Ally>) {
  const allyId = allyIdFromChartRequest(request);
  if (!allyId) return undefined;
  return alliesById.get(allyId) ?? alliesById.get(allyId.startsWith("v1-ally:") ? allyId : `v1-ally:${allyId}`);
}

function hydrateChartFromLiveAlly(request: ChartMakerRequest, ally: Ally | undefined): ChartMakerRequest {
  if (!ally) return request;
  const subject = request.context?.subject && typeof request.context.subject === "object" && !Array.isArray(request.context.subject)
    ? request.context.subject
    : {};
  return {
    ...request,
    subjectName: ally.name,
    context: {
      ...request.context,
      subject: {
        ...subject,
        subjectType: "ally",
        allyId: ally.id,
        displayName: ally.name,
        relationship: ally.relationship,
        ...(ally.note ? { note: ally.note } : {})
      }
    }
  };
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
    : "/allies?action=add#ally-birth-onboarding";
  const editBirthHref = chartRequest
    ? `/allies?chart=${encodeURIComponent(chartRequest.id)}&start=birth_details#ally-birth-onboarding`
    : undefined;
  const relationshipLabel = normalizeAllyRelationshipTag(ally.relationship);

  return (
    <article className="card ally-card" id={`ally-${ally.id}`}>
      <div className="ally-card-header">
        <div className="ally-card-identity">
          <div className="ally-card-title-row">
            <h2>{ally.name}</h2>
            <span className="ally-card-badge">{relationshipLabel ? ui.allies.relationshipLabels[relationshipLabel] : ally.relationship}</span>
          </div>
          <span className="ally-card-birth">{compactBirthLine(chartRequest)}</span>
        </div>
        <div className="ally-card-controls">
          <div className="ally-card-actions" role="group" aria-label={`${ui.allies.cardActionsLabel}: ${ally.name}`}>
            {chartRequest ? (
              <Link aria-label={ui.charts.viewChart} className="button secondary" href={`/charts?chart=${encodeURIComponent(chartRequest.id)}&from=allies`} title={ui.charts.viewChart}>
                <ChartPie aria-hidden="true" size={16} />
              </Link>
            ) : null}
            {report ? (
              <span className="compact-list-report-actions">
                <Link aria-label={ui.allies.viewReport} href={`/library?reportId=${encodeURIComponent(report.requestId)}`} title={ui.allies.viewReport}>
                  <BookOpenText aria-hidden="true" size={16} />
                </Link>
              </span>
            ) : (
              <Link aria-label={ui.allies.createReport} className="button secondary" href={createPortraitHref} title={ui.allies.createReport}>
                <BookOpenText aria-hidden="true" size={16} />
              </Link>
            )}
            <AllyRelationshipEditor allyId={ally.id} allyName={ally.name} editBirthHref={editBirthHref} relationship={ally.relationship} />
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
    action?: string;
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
  const alliesById = new Map(allies.map((ally) => [ally.id, ally]));
  const hydratedChartRequests = chartRequests.map((request) => hydrateChartFromLiveAlly(request, liveAllyForChart(request, alliesById)));
  const allyChartRequests = hydratedChartRequests.filter((request) => request.source !== "self");
  const allyReportRequests = reportRequests.filter((request) => request.source === "ally");
  const allyReportRequestIds = new Set(allyReportRequests.map((request) => request.id));
  const allyReportResults = reportResults.filter((result) => allyReportRequestIds.has(result.requestId));
  const latestChartRequestByAllyId = new Map<string, ChartMakerRequest>();
  for (const request of allyChartRequests) {
    const ally = liveAllyForChart(request, alliesById);
    if (ally && !latestChartRequestByAllyId.has(ally.id)) {
      latestChartRequestByAllyId.set(ally.id, request);
    }
  }
  const selectedOnboardingChart = params.chart
    ? allyChartRequests.find((request) => request.id === params.chart)
    : undefined;
  const initialOnboardingStep = selectedOnboardingChart
    ? onboardingStepFromParam(params.start) ?? "report"
    : onboardingStepFromParam(params.start);
  const isAddingAlly = params.action === "add";
  const clearFilterParams = new URLSearchParams();
  if (params.chart) clearFilterParams.set("chart", params.chart);
  if (params.start) clearFilterParams.set("start", params.start);
  const clearFilterHref = `/allies${clearFilterParams.toString() ? `?${clearFilterParams.toString()}` : ""}`;
  const filterQuery = params.q?.trim() ?? "";
  const filterRelationship = params.relationship?.trim() ?? "";
  const relationshipOptions = Array.from(new Set(allies.map((ally) => normalizeAllyRelationshipTag(ally.relationship) ?? ally.relationship).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const filteredAllies = allies.filter((ally) => {
    const chartRequest = latestChartRequestByAllyId.get(ally.id);
    const haystack = [ally.name, ally.relationship, compactBirthLine(chartRequest)].join(" ").toLowerCase();
    const matchesQuery = filterQuery ? haystack.includes(cleanFilter(filterQuery)) : true;
    const matchesRelationship = filterRelationship ? (normalizeAllyRelationshipTag(ally.relationship) ?? ally.relationship) === filterRelationship : true;
    return matchesQuery && matchesRelationship;
  });

  return (
    <>
      <section className="allies-v1-intro" aria-labelledby="allies-title">
        <p>{ui.allies.eyebrow}</p>
        <h1 id="allies-title">{ui.allies.title}</h1>
        <div>{ui.allies.intro}</div>
        <Link className="button allies-add-action" href="/allies?action=add#ally-birth-onboarding">
          <Plus aria-hidden="true" size={18} />
          {ui.allies.addAction}
        </Link>
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
                  {normalizeAllyRelationshipTag(relationship) ? ui.allies.relationshipLabels[normalizeAllyRelationshipTag(relationship)!] : relationship}
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
            {!allies.length ? (
              <Link className="button" href="/allies?action=add#ally-birth-onboarding">
                <Plus aria-hidden="true" size={18} />
                {ui.allies.addAction}
              </Link>
            ) : null}
          </article>
        )}
      </section>
      {isAddingAlly || selectedOnboardingChart ? <section id="ally-birth-onboarding">
        <BirthOnboardingPanel
          allyFlow={isAddingAlly ? "add" : "report"}
          displayName=""
          initialAllies={allies}
          key={selectedOnboardingChart ? `${selectedOnboardingChart.id}:${initialOnboardingStep}:${liveAllyForChart(selectedOnboardingChart, alliesById)?.relationship ?? "unknown"}` : "new-ally-chart"}
          role={profile.role}
          starBalance={profile.starBalance}
          initialRequests={allyChartRequests}
          synastryComparisonRequests={hydratedChartRequests}
          initialReportRequests={allyReportRequests}
          initialReportResults={allyReportResults}
          initialBirthData={selectedOnboardingChart?.birthData}
          initialChartRequestId={selectedOnboardingChart?.id}
          initialStep={initialOnboardingStep}
          subjectType="ally"
          hideSummaryRail
        />
      </section> : null}
    </>
  );
}
