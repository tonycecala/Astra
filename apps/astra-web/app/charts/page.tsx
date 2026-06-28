import Link from "next/link";
import { ArrowRight, BookOpenText, ChartPie, Pencil } from "lucide-react";
import { buildAstrologyChartSnapshot } from "@astra/astrology";
import type { AstrologyReportRequest, ChartMakerRequest, ChartSettings } from "@astra/contracts";
import { astrologyReportResults, chartResults, db, listUserAstrologyReportRequests, listUserChartMakerRequests } from "@astra/db";
import { and, eq } from "drizzle-orm";
import { FullChartWheel } from "../../components/FullChartWheel";
import { PageHeader } from "../../components/PageHeader";
import { reportTypeLabel } from "../../components/ReportReader";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";

export const dynamic = "force-dynamic";

type ChartsPageParams = {
  searchParams: Promise<{
    chart?: string;
    chartId?: string;
  }>;
};

type ChartResultRow = {
  requestId: string;
  status: string;
  engine: string;
};

type ReportResultRow = {
  requestId: string;
  status: string;
};

type ChartListItem = {
  chart: ChartMakerRequest;
  result?: ChartResultRow;
  report?: AstrologyReportRequest;
  reportResult?: ReportResultRow;
};

export default async function ChartsPage({ searchParams }: ChartsPageParams) {
  const { chart, chartId } = await searchParams;
  const selectedChartId = normalizeChartId(chartId ?? chart);
  const { profile } = await getAstraAuthContext();

  if (!profile) {
    return (
      <>
        <PageHeader eyebrow={ui.charts.eyebrow} title={ui.charts.signedOutTitle}>
          {ui.charts.signedOutIntro}
        </PageHeader>
        <section className="auth-gate-grid" aria-label={ui.charts.listLabel}>
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

  const chartItems = await getUserChartItems(profile.userId);
  const selected = chartItems.find((item) => item.chart.id === selectedChartId) ?? chartItems.at(0) ?? null;

  return (
    <>
      <PageHeader eyebrow={ui.charts.eyebrow} title={ui.charts.title}>
        {ui.charts.intro}
      </PageHeader>
      {chartItems.length ? (
        <section className="chartsLayout" aria-label={ui.charts.pageLabel}>
          {selected ? <SelectedChartPanel item={selected} /> : null}
          <section className="chartsList" aria-label={ui.charts.listLabel}>
            {chartItems.map((item) => (
              <ChartCard active={selected?.chart.id === item.chart.id} item={item} key={item.chart.id} />
            ))}
          </section>
        </section>
      ) : (
        <section className="grid" aria-label={ui.charts.listLabel}>
          <article className="card">
            <div className="eyebrow">{ui.charts.emptyEyebrow}</div>
            <h2>{ui.charts.emptyTitle}</h2>
            <p>{ui.charts.emptyBody}</p>
            <Link className="button" href="/self#self-birth-onboarding">
              {ui.charts.addSelfChart}
            </Link>
          </article>
        </section>
      )}
    </>
  );
}

function ChartCard({ active, item }: { active: boolean; item: ChartListItem }) {
  const { chart, report, reportResult } = item;
  const subject = subjectContext(chart);
  const status = reportResult?.status === "completed" ? ui.charts.portraitReady : ui.charts.readyForPortrait;
  const createHref =
    subject.source === "ally"
      ? `/allies?chart=${encodeURIComponent(chart.id)}&start=report#ally-birth-onboarding`
      : `/self?chart=${encodeURIComponent(chart.id)}&start=report#self-birth-onboarding`;
  const editHref =
    subject.source === "ally"
      ? `/allies?chart=${encodeURIComponent(chart.id)}&start=birth_details#ally-birth-onboarding`
      : `/self?chart=${encodeURIComponent(chart.id)}&start=birth_details#self-birth-onboarding`;

  return (
    <article className={active ? "chartHomeCard chartHomeCardActive" : "chartHomeCard"}>
      <div className="chartHomeCardMain">
        <span className="chartHomeInitial" aria-hidden="true">
          {chart.subjectName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h2>{chart.subjectName}</h2>
          <p>
            {subject.relationship ? `${subject.typeLabel} · ${subject.relationship}` : subject.typeLabel}
          </p>
          <span className="chartStatusPill">{status}</span>
        </div>
      </div>
      <div className="chartHomeActions" aria-label={ui.charts.cardActionsLabel}>
        <Link className="button secondary" href={`/charts?chart=${chart.id}`} scroll={false}>
          <ChartPie aria-hidden="true" size={16} />
          {ui.charts.viewChart}
        </Link>
        {report && reportResult?.status === "completed" ? (
          <Link className="button secondary" href={`/library?reportId=${report.id}`}>
            <BookOpenText aria-hidden="true" size={16} />
            {ui.charts.viewPortrait}
          </Link>
        ) : (
          <Link className="button secondary" href={createHref}>
            <BookOpenText aria-hidden="true" size={16} />
            {ui.charts.createPortrait}
          </Link>
        )}
        <Link className="button secondary" href={editHref}>
          <Pencil aria-hidden="true" size={16} />
          {ui.charts.editDetails}
        </Link>
      </div>
    </article>
  );
}

function SelectedChartPanel({ item }: { item: ChartListItem }) {
  const reportRequest = chartAsReportRequest(item.chart);
  const chartSnapshot = buildAstrologyChartSnapshot(reportRequest);
  const settings = chartSettings(item.chart);
  const subject = subjectContext(item.chart);

  return (
    <section className="chartDetailPanel" id="selected-chart" aria-label={ui.charts.selectedLabel}>
      <div className="chartDetailHeader">
        <div>
          <div className="eyebrow">{ui.charts.selectedEyebrow}</div>
          <h2>{item.chart.subjectName}</h2>
          <p>{birthLine(item.chart)}</p>
        </div>
        <Link className="button secondary" href={subject.source === "ally" ? "/allies" : "/self#self-birth-onboarding"}>
          {ui.charts.manageBirthData}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
      <FullChartWheel chart={chartSnapshot} />
      <dl className="chartDetailFacts">
        <div>
          <dt>{ui.charts.subjectType}</dt>
          <dd>{subject.typeLabel}</dd>
        </div>
        <div>
          <dt>{ui.charts.zodiac}</dt>
          <dd>{settings.zodiacMode === "sidereal" ? ui.self.zodiacModes.sidereal : ui.self.zodiacModes.tropical}</dd>
        </div>
        <div>
          <dt>{ui.charts.houses}</dt>
          <dd>{settings.houseSystem === "placidus" ? ui.self.houseSystems.placidus : ui.self.houseSystems["whole-sign"]}</dd>
        </div>
        <div>
          <dt>{ui.charts.chartStatus}</dt>
          <dd>{item.result?.status ?? item.chart.status}</dd>
        </div>
        <div>
          <dt>{ui.charts.engine}</dt>
          <dd>{item.result?.engine ?? ui.library.reportUnknownChartValue}</dd>
        </div>
        <div>
          <dt>{ui.charts.latestPortrait}</dt>
          <dd>{item.report ? reportTypeLabel(item.report.reportType) : ui.charts.noPortraitYet}</dd>
        </div>
      </dl>
    </section>
  );
}

async function getUserChartItems(userId: string): Promise<ChartListItem[]> {
  const [charts, chartResultRows, reports, reportResultRows] = await Promise.all([
    listUserChartMakerRequests(db, userId),
    db
      .select({
        requestId: chartResults.requestId,
        status: chartResults.status,
        engine: chartResults.engine
      })
      .from(chartResults)
      .where(eq(chartResults.userId, userId)),
    listUserAstrologyReportRequests(db, userId),
    db
      .select({
        requestId: astrologyReportResults.requestId,
        status: astrologyReportResults.status
      })
      .from(astrologyReportResults)
      .where(and(eq(astrologyReportResults.userId, userId), eq(astrologyReportResults.status, "completed")))
  ]);
  const resultByChartId = new Map(chartResultRows.map((result) => [result.requestId, result]));
  const reportResultByRequestId = new Map(reportResultRows.map((result) => [result.requestId, result]));
  const reportsByChartId = new Map<string, AstrologyReportRequest>();

  for (const report of reports) {
    if (report.chartRequestId && !reportsByChartId.has(report.chartRequestId)) {
      reportsByChartId.set(report.chartRequestId, report);
    }
  }

  return charts.map((chart) => {
    const report = reportsByChartId.get(chart.id);
    return {
      chart,
      result: resultByChartId.get(chart.id),
      report,
      reportResult: report ? reportResultByRequestId.get(report.id) : undefined
    };
  });
}

function normalizeChartId(value?: string) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function chartSettings(chart: ChartMakerRequest): ChartSettings {
  const settings = chart.context?.chartSettings;
  return {
    zodiacMode: settings?.zodiacMode ?? "tropical",
    houseSystem: settings?.houseSystem ?? "whole-sign"
  };
}

function subjectContext(chart: ChartMakerRequest) {
  const subject = chart.context?.subject;
  const source = chart.source === "self" ? "self" : "ally";
  const relationship = subject?.relationship ? String(subject.relationship) : "";
  return {
    source,
    relationship,
    typeLabel: source === "ally" ? ui.library.subjectAlly : ui.library.subjectSelf
  };
}

function chartAsReportRequest(chart: ChartMakerRequest): AstrologyReportRequest {
  return {
    id: `chart-preview:${chart.id}`,
    userId: chart.userId,
    chartRequestId: chart.id,
    reportType: "core",
    subjectName: chart.subjectName,
    birthData: chart.birthData,
    context: chart.context,
    source: chart.source === "ally" ? "ally" : "self",
    boundary: "private",
    status: chart.status === "completed" ? "completed" : "queued",
    costCredits: 0,
    createdAt: chart.createdAt,
    updatedAt: chart.updatedAt
  };
}

function birthLine(chart: ChartMakerRequest) {
  return [
    chart.birthData.date,
    chart.birthData.birthTimeKnown === false ? ui.self.birthMomentUnknownTimeShort : chart.birthData.time,
    chart.birthData.location
  ].filter(Boolean).join(" · ");
}
