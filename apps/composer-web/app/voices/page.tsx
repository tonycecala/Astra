import { PageHeader } from "../../components/PageHeader";
import { StatusCard } from "../../components/StatusCard";
import { composerUi } from "../../lib/i18n";
import { composerVoiceRegistry } from "../../src";

export default function VoicesPage() {
  const voices = Object.values(composerVoiceRegistry);

  return (
    <div className="page-stack">
      <PageHeader eyebrow={composerUi.library.visualModes} title={composerUi.pages.voices.title} description={composerUi.pages.voices.description} />
      <section className="status-grid" aria-label={composerUi.pages.voices.title}>
        <StatusCard label={composerUi.library.guideVoice} value={String(voices.length)} detail={composerUi.library.deterministicValidation} tone="good" />
        <StatusCard label={composerUi.library.visualModes} value={composerUi.library.heldForWorkflow} detail={composerUi.library.cleanStartFixture} />
        <StatusCard label={composerUi.library.noSupabase} value={composerUi.dashboard.ready} detail={composerUi.library.noRuntimeDdl} tone="good" />
        <StatusCard label={composerUi.library.sourceQuarry} value={composerUi.library.noPublishHooks} detail={composerUi.pages.voices.title} />
      </section>
      <section className="work-grid">
        {voices.map((voice) => (
          <article className="panel" key={voice.id}>
            <p className="eyebrow">{voice.id}</p>
            <h2>{voice.id}</h2>
            <div className="dense-table" role="table" aria-label={voice.id}>
              <div role="row">
                <span>{composerUi.library.cards}</span>
                <strong>{voice.bodyMaxWords}</strong>
              </div>
              <div role="row">
                <span>{composerUi.library.status}</span>
                <strong>{composerUi.library.deterministicValidation}</strong>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
