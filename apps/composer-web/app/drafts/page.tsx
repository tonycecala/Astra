import { CardWorkspace } from "../../components/CardWorkspace";
import { PageHeader } from "../../components/PageHeader";
import { StatusCard } from "../../components/StatusCard";
import { composerUi } from "../../lib/i18n";
import { getComposerCardSummary, listComposerDraftCards, queryComposerCards } from "../../lib/cardLibrary";

export default function DraftsPage() {
  const cards = listComposerDraftCards();
  const summary = getComposerCardSummary(cards);
  const initialResult = queryComposerCards({ scope: "drafts", pageSize: 48 });

  return (
    <div className="page-stack">
      <PageHeader eyebrow={composerUi.library.cleanStartFixture} title={composerUi.pages.drafts.title} description={composerUi.pages.drafts.description} />
      <section className="status-grid" aria-label={composerUi.pages.drafts.title}>
        <StatusCard label={composerUi.library.importedCards} value={String(summary.totalCards)} detail={composerUi.library.noRuntimeDdl} tone="good" />
        <StatusCard label={composerUi.library.prompts} value={String(summary.cardsWithPrompts)} detail={composerUi.library.heldForWorkflow} />
        <StatusCard label={composerUi.library.imageReady} value={String(summary.cardsWithImages)} detail={composerUi.library.remoteImageMetadata} />
        <StatusCard label={composerUi.library.sourceQuarry} value={composerUi.library.noSupabase} detail={composerUi.library.cleanStartFixture} tone="good" />
      </section>
      <CardWorkspace initialResult={initialResult} labels={composerUi.library} scope="drafts" />
    </div>
  );
}
