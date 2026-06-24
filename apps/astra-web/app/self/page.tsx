import Link from "next/link";
import { ChartPie, ChevronRight, Pencil, ShieldCheck, Sparkles } from "lucide-react";
import type { ChartMakerRequest } from "@astra/contracts";
import { db, listUserAstrologyReportRequests, listUserAstrologyReportResults, listUserChartMakerRequests } from "@astra/db";
import { BirthOnboardingPanel } from "../../components/BirthOnboardingPanel";
import { PageHeader } from "../../components/PageHeader";
import { SelfTabAvatar } from "../../components/SelfTabAvatar";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";

function normalizeRole(value: string | undefined) {
  const normalizedRole = (value ?? "self").trim().toLowerCase();
  if (normalizedRole === "admin") return "Admin";
  if (normalizedRole === "operator") return "Operator";
  if (normalizedRole === "customer") return "Self";
  return value ?? "Self";
}

type BirthSummary = {
  first: string;
  second?: string;
};

function formatReadableDate(value: string) {
  const maybeDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(maybeDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(maybeDate);
}

function formatTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return value;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatBirthSummary(request?: ChartMakerRequest): BirthSummary | string {
  if (!request) {
    return ui.self.noBirthData;
  }

  const { date, time, timezone, location } = request.birthData;
  const first = `Born ${[formatReadableDate(date), location].filter(Boolean).join(" · ")}`;

  if (!time) {
    return {
      first,
      second: "Birth time unknown"
    };
  }

  return {
    first,
    second: `Birth time exact · ${formatTime(time)}${timezone ? ` · ${timezone}` : ""}`
  };
}

function formatBirthAnchorSummary(request?: ChartMakerRequest) {
  if (!request) {
    return ui.self.chartAnchorBodyMissing;
  }

  const { date, location } = request.birthData;
  const readableDate = formatReadableDate(date);

  if (location) {
    return ui.self.chartAnchorBody(`${readableDate} in ${location}`);
  }

  return ui.self.chartAnchorBody(readableDate);
}

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
  const fallbackInitial = profile.displayName.trim().slice(0, 1).toUpperCase() || "S";
  const latestRequest = chartRequests.at(0);
  const roleLine = normalizeRole(profile.role);
  const birthLine = formatBirthSummary(latestRequest);

  return (
    <>
      <PageHeader eyebrow={ui.self.eyebrow} title={profile.displayName}>
        {ui.self.intro}
      </PageHeader>
      <section className="grid" aria-label={ui.self.summaryLabel}>
        <article className="card self-profile-card">
          <SelfTabAvatar className="self-profile-avatar" email={profile.email} initial={fallbackInitial} size={192} />
          <p className="self-profile-role">{roleLine}</p>
          <h2 className="self-profile-name">{profile.displayName}</h2>
          <div className="self-profile-birth-data">
            {typeof birthLine === "string" ? (
              <p>{birthLine}</p>
            ) : (
              <>
                <p>{birthLine.first}</p>
                {birthLine.second ? <p>{birthLine.second}</p> : null}
              </>
            )}
          </div>
          <div className="self-profile-actions" role="group" aria-label={ui.self.profileActionsLabel}>
            <Link className="button secondary" href="/charts">
              <ChartPie aria-hidden="true" size={16} />
              {ui.self.viewChart}
            </Link>
            <Link className="button secondary" href="#self-birth-onboarding">
              <Sparkles aria-hidden="true" size={16} />
              {ui.self.createProfile}
            </Link>
            {profile.role === "admin" ? (
              <Link className="button secondary" href="/admin">
                <ShieldCheck aria-hidden="true" size={16} />
                {ui.account.admin}
              </Link>
            ) : null}
            <a className="button secondary" href="#self-birth-onboarding">
              <Pencil aria-hidden="true" size={16} />
              {ui.self.editBirthDetails}
            </a>
          </div>
        </article>
      </section>
      <section className="grid" aria-label={ui.self.timelineLabel}>
        <div className="self-stream-intro-wrap">
          <hr className="self-stream-separator" aria-hidden="true" />
          <div className="self-stream-intro">
            <h2>{ui.self.timelineTitle}</h2>
            <p>{ui.self.timelineIntro}</p>
          </div>
        </div>
      </section>
      <section className="grid" aria-label={ui.self.summaryLabel}>
        {latestRequest ? (
          <Link className="card self-chart-anchor" href="/charts">
            <div className="self-chart-anchor-header">
              <ChartPie aria-hidden="true" className="self-chart-anchor-icon" size={16} />
              <div className="self-chart-anchor-text">
                <div className="eyebrow self-chart-anchor-eyebrow">{ui.self.chartAnchorEyebrow}</div>
                <h2 className="self-chart-anchor-title">{ui.self.chartAnchorTitleReady}</h2>
              </div>
              <ChevronRight aria-hidden="true" className="self-chart-anchor-chevron" size={16} />
            </div>
            <p>{formatBirthAnchorSummary(latestRequest)}</p>
          </Link>
        ) : (
          <article className="card self-chart-anchor">
            <div className="self-chart-anchor-header">
              <ChartPie aria-hidden="true" className="self-chart-anchor-icon" size={16} />
              <div className="self-chart-anchor-text">
                <div className="eyebrow self-chart-anchor-eyebrow">{ui.self.chartAnchorEyebrow}</div>
                <h2 className="self-chart-anchor-title">{ui.self.chartAnchorTitleMissing}</h2>
              </div>
              <ChevronRight aria-hidden="true" className="self-chart-anchor-chevron" size={16} />
            </div>
            <p>{ui.self.chartAnchorBodyMissing}</p>
          </article>
        )}
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
      <section id="self-birth-onboarding">
        <BirthOnboardingPanel
          displayName={profile.displayName}
          role={profile.role}
          starBalance={profile.starBalance}
          initialRequests={chartRequests}
          initialReportRequests={reportRequests}
          initialReportResults={reportResults}
          initialBirthData={latestRequest?.birthData}
        />
      </section>
    </>
  );
}
