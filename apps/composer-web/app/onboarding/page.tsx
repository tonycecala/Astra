import { OnboardingWorkspace } from "../../components/OnboardingWorkspace";
import { PageHeader } from "../../components/PageHeader";
import { StatusCard } from "../../components/StatusCard";
import { countComposerSignReferenceCards, getComposerCardSummary, listComposerCards } from "../../lib/cardLibrary";
import { composerUi } from "../../lib/i18n";

export default function OnboardingPage() {
  const summary = getComposerCardSummary(listComposerCards());
  const signCards = countComposerSignReferenceCards();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={composerUi.onboarding.eyebrow}
        title={composerUi.pages.onboarding.title}
        description={composerUi.pages.onboarding.description}
      />
      <section className="status-grid" aria-label={composerUi.pages.onboarding.title}>
        <StatusCard label={composerUi.library.firstRun} value={String(summary.onboardingCards)} detail={composerUi.library.onboardingFeed} tone="good" />
        <StatusCard label={composerUi.library.signWelcome} value={String(signCards)} detail={composerUi.library.starterSet} />
        <StatusCard label={composerUi.library.localAssets} value="24" detail={composerUi.library.images} tone="good" />
        <StatusCard label={composerUi.library.noSupabase} value={composerUi.dashboard.ready} detail={composerUi.settings.contractsOnly} tone="good" />
      </section>
      <OnboardingWorkspace />
    </div>
  );
}
