import { CardWorkspace } from "../../components/CardWorkspace";
import { PageHeader } from "../../components/PageHeader";
import { StatusCard } from "../../components/StatusCard";
import { composerUi } from "../../lib/i18n";
import { getComposerCardSummary, listComposerCards, listImportedComposerCards, queryComposerCards } from "../../lib/cardLibrary";

export default function CardsPage() {
  const cards = listComposerCards();
  const importedCards = listImportedComposerCards();
  const summary = getComposerCardSummary(cards);
  const initialResult = queryComposerCards({ scope: "all", pageSize: 48 });

  return (
    <div className="page-stack">
      <PageHeader eyebrow={composerUi.library.starterSet} title={composerUi.pages.cards.title} description={composerUi.pages.cards.description} />
      <section className="status-grid" aria-label={composerUi.library.imageCoverage}>
        <StatusCard label={composerUi.library.importedCards} value={String(importedCards.length)} detail={composerUi.library.sourceQuarry} tone="good" />
        <StatusCard label={composerUi.library.totalCards} value={String(summary.totalCards)} detail={composerUi.library.workbench} />
        <StatusCard label={composerUi.library.imageReady} value={String(summary.cardsWithImages)} detail={composerUi.library.remoteImageMetadata} tone="good" />
        <StatusCard label={composerUi.library.courseCards} value={String(summary.courseCards)} detail={composerUi.library.astrology101} />
      </section>
      <CardWorkspace initialResult={initialResult} labels={composerUi.library} scope="all" />
    </div>
  );
}
