import { PageHeader } from "../../components/PageHeader";
import { StreamReader } from "../../components/StreamReader";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";
import { getJourneyViewModel } from "../../lib/journey";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const { profile } = await getAstraAuthContext();
  const view = await getJourneyViewModel(profile?.userId).catch(() => null);

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
      <div className="status-strip">
        <span className="pill">{view.mode === "private" ? ui.journey.privateFeed : ui.journey.publicFallback}</span>
        <span className="pill">{ui.journey.composerDefaultPath}</span>
        <span className="pill">{ui.journey.noLegacyData}</span>
        <span className="pill">{ui.journey.cardCount(view.streamCards.length)}</span>
      </div>
      <section className="journey-state-card" aria-label={ui.journey.stateLabel}>
        <div>
          <p className="eyebrow">{ui.journey.states[view.feedState].eyebrow}</p>
          <h2>{ui.journey.states[view.feedState].title}</h2>
          <p>{ui.journey.states[view.feedState].body}</p>
        </div>
        {view.feedState === "public_preview" ? (
          <Link className="button secondary" href="/login">
            {ui.journey.signInCta}
          </Link>
        ) : null}
      </section>
      <StreamReader streamCards={view.streamCards} />
    </>
  );
}
