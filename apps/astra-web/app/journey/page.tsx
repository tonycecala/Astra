import { AuthPanel } from "../../components/AuthPanel";
import { PageHeader } from "../../components/PageHeader";
import { StreamReader } from "../../components/StreamReader";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";
import { getJourneyViewModel } from "../../lib/journey";
import Link from "next/link";

export const dynamic = "force-dynamic";

type JourneyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function intParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = Number.parseInt(firstParam(params, key) ?? "", 10);
  return Number.isFinite(value) ? value : undefined;
}

export default async function JourneyPage({ searchParams }: JourneyPageProps) {
  const { profile } = await getAstraAuthContext();
  const params = (await searchParams) ?? {};
  const composerSelected = firstParam(params, "composerSelected") === "1";
  const view = await getJourneyViewModel(profile?.userId, {
    enabled: composerSelected,
    requestType: "course",
    id: firstParam(params, "course") ?? "astrology_101",
    selectionDate: firstParam(params, "selectionDate"),
    count: intParam(params, "count"),
    eligibility: {
      source: "journey_query"
    }
  }).catch(() => null);

  if (!view) {
    return (
      <>
        <PageHeader eyebrow={ui.journey.eyebrow} title={ui.journey.title}>
          {ui.journey.intro}
        </PageHeader>
        <section className="grid" aria-label={ui.journey.streamCardsLabel}>
          <article className="card">
            <h2>{ui.journey.errorTitle}</h2>
            <p>{ui.journey.errorBody}</p>
          </article>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow={ui.journey.eyebrow} title={ui.journey.title}>
        {ui.journey.intro}
      </PageHeader>
      {!profile ? (
        <section className="grid" aria-label={ui.login.pageKicker}>
          <article className="card">
            <div className="eyebrow">{ui.login.pageKicker}</div>
            <h2>{ui.login.pageTitle}</h2>
            <p>{ui.login.pageIntro}</p>
            <AuthPanel />
          </article>
        </section>
      ) : null}
      <section className="journey-state-card" aria-label={ui.journey.stateLabel}>
        <div>
          <p className="eyebrow">{ui.journey.states[view.feedState].eyebrow}</p>
          <h2>{ui.journey.states[view.feedState].title}</h2>
          <p>{ui.journey.states[view.feedState].body}</p>
        </div>
        {view.feedState === "public_preview" ? (
          <Link className="button secondary" href="/">
            {ui.journey.signInCta}
          </Link>
        ) : null}
      </section>
      <StreamReader streamCards={view.streamCards} />
    </>
  );
}
