import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusCard } from "../components/StatusCard";
import { getComposerCardSummary, listComposerCards } from "../lib/cardLibrary";
import { getComposerRuntimeStatus } from "../lib/config";
import { composerUi } from "../lib/i18n";
import { composerVoiceRegistry, createComposerOnboardingSeedCards, createComposerOperatorDraftFixture, previewComposerOperatorDraft } from "../src";

export default function DashboardPage() {
  const status = getComposerRuntimeStatus();
  const draft = createComposerOperatorDraftFixture();
  const preview = previewComposerOperatorDraft(draft);
  const onboardingCards = createComposerOnboardingSeedCards();
  const cardSummary = getComposerCardSummary(listComposerCards());

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={composerUi.brand}
        title={composerUi.pages.dashboard.title}
        description={composerUi.pages.dashboard.description}
      />

      <section className="status-grid" aria-label={composerUi.dashboard.statusLabel}>
        <StatusCard label={composerUi.dashboard.astraApi} value={status.astraBaseUrl} detail={composerUi.dashboard.trustedPublishTarget} tone="good" />
        <StatusCard
          label={composerUi.dashboard.internalToken}
          value={status.hasInternalToken ? composerUi.dashboard.configured : composerUi.dashboard.missing}
          detail={composerUi.dashboard.requiredBeforePublish}
          tone={status.hasInternalToken ? "good" : "warn"}
        />
        <StatusCard
          label={composerUi.dashboard.operatorPreview}
          value={preview.ok ? composerUi.dashboard.ready : composerUi.dashboard.blocked}
          detail={composerUi.dashboard.draftFixtureValidation}
          tone={preview.ok ? "good" : "warn"}
        />
        <StatusCard
          label={composerUi.dashboard.onboarding}
          value={`${onboardingCards.length} ${composerUi.onboarding.cards.toLowerCase()}`}
          detail={composerUi.dashboard.privateFirstRunBatch}
        />
        <StatusCard
          label={composerUi.library.importedCards}
          value={String(cardSummary.totalCards)}
          detail={composerUi.library.sourceQuarry}
          tone="good"
        />
        <StatusCard
          label={composerUi.library.imageReady}
          value={String(cardSummary.cardsWithImages)}
          detail={composerUi.library.remoteImageMetadata}
          tone="good"
        />
        <StatusCard
          label={composerUi.library.localAssets}
          value={String(cardSummary.localAssetFiles)}
          detail={composerUi.library.images}
        />
        <StatusCard
          label={composerUi.library.courseCards}
          value={String(cardSummary.courseCards)}
          detail={composerUi.library.courseSequence}
        />
      </section>

      <section className="work-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>{composerUi.dashboard.operatorQueue}</h2>
              <p>{composerUi.dashboard.operatorQueueDetail}</p>
            </div>
            <Link className="icon-link" href="/review" aria-label={composerUi.dashboard.openReview}>
              <ArrowUpRight aria-hidden="true" size={18} />
            </Link>
          </div>
          <div className="dense-table" role="table" aria-label={composerUi.dashboard.operatorPreviewContract}>
            <div role="row">
              <span>{composerUi.dashboard.draft}</span>
              <strong>{draft.draftId}</strong>
            </div>
            <div role="row">
              <span>{composerUi.dashboard.source}</span>
              <strong>{draft.sourceCard.title}</strong>
            </div>
            <div role="row">
              <span>{composerUi.dashboard.decision}</span>
              <strong>{draft.decisionVersion}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>{composerUi.dashboard.voiceRegistry}</h2>
              <p>{composerUi.dashboard.voiceRegistryDetail}</p>
            </div>
          </div>
          <div className="dense-table" role="table" aria-label={composerUi.dashboard.composerVoices}>
            {Object.values(composerVoiceRegistry).map((voice) => (
              <div role="row" key={voice.id}>
                <span>{voice.id}</span>
                <strong>{voice.bodyMaxWords} words</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
