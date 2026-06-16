import { PageHeader } from "../../components/PageHeader";
import { ui } from "../../lib/i18n";

export default function JourneyLoading() {
  return (
    <>
      <PageHeader eyebrow={ui.journey.eyebrow} title={ui.journey.title}>
        {ui.journey.intro}
      </PageHeader>
      <section className="grid" aria-label={ui.journey.streamCardsLabel}>
        <article className="card">
          <h2>{ui.journey.loadingTitle}</h2>
          <p>{ui.journey.loadingBody}</p>
        </article>
      </section>
    </>
  );
}
