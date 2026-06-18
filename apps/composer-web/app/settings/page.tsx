import { PageHeader } from "../../components/PageHeader";
import { StatusCard } from "../../components/StatusCard";
import { getComposerRuntimeStatus } from "../../lib/config";
import { composerUi } from "../../lib/i18n";

export default function SettingsPage() {
  const status = getComposerRuntimeStatus();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={composerUi.settings.configuration}
        title={composerUi.pages.settings.title}
        description={composerUi.pages.settings.description}
      />
      <section className="status-grid" aria-label={composerUi.settings.configuration}>
        <StatusCard label={composerUi.settings.port} value={String(status.composerPort)} detail={composerUi.settings.reservedPort} />
        <StatusCard label={composerUi.settings.access} value={status.access.modeLabel} detail={composerUi.settings.noSupabaseAuth} tone="good" />
        <StatusCard
          label={composerUi.settings.token}
          value={status.hasInternalToken ? composerUi.dashboard.configured : composerUi.dashboard.missing}
          detail={composerUi.settings.failHardCredential}
          tone={status.hasInternalToken ? "good" : "warn"}
        />
        <StatusCard label={composerUi.settings.boundary} value={composerUi.settings.noSupabase} detail={composerUi.settings.contractsOnly} tone="good" />
      </section>
      <section className="panel">
        <div className="dense-table" role="table" aria-label={composerUi.settings.endpoints}>
          <div role="row">
            <span>{composerUi.settings.privateFeed}</span>
            <strong>{status.privateFeedEndpoint}</strong>
          </div>
          <div role="row">
            <span>{composerUi.settings.onboarding}</span>
            <strong>{status.onboardingEndpoint}</strong>
          </div>
          <div role="row">
            <span>{composerUi.settings.astraRenders}</span>
            <strong>{composerUi.settings.composerComposes}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
