import { PageHeader } from "../../components/PageHeader";
import { StatusCard } from "../../components/StatusCard";
import { composerUi } from "../../lib/i18n";

export default function OffersPage() {
  return (
    <div className="page-stack">
      <PageHeader eyebrow={composerUi.library.heldForWorkflow} title={composerUi.pages.offers.title} description={composerUi.pages.offers.description} />
      <section className="status-grid" aria-label={composerUi.pages.offers.title}>
        <StatusCard label={composerUi.library.offerDrafts} value="0" detail={composerUi.library.heldForWorkflow} />
        <StatusCard label={composerUi.library.sponsorCards} value="0" detail={composerUi.library.noPublishHooks} tone="good" />
        <StatusCard label={composerUi.library.noSupabase} value={composerUi.dashboard.ready} detail={composerUi.library.cleanStartFixture} tone="good" />
        <StatusCard label={composerUi.library.noRuntimeDdl} value={composerUi.dashboard.ready} detail={composerUi.settings.contractsOnly} tone="good" />
      </section>
      <section className="panel">
        <h2>{composerUi.pages.offers.title}</h2>
        <p>{composerUi.pages.offers.description}</p>
      </section>
    </div>
  );
}
