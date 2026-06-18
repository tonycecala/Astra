import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { StatusCard } from "../../components/StatusCard";
import { buildComposerLibraryBoxes, composerCardOntology, displayComposerValue, getComposerCardSummary, listComposerCards } from "../../lib/cardLibrary";
import { composerUi } from "../../lib/i18n";

export default function LibraryPage() {
  const cards = listComposerCards();
  const boxes = buildComposerLibraryBoxes(cards);
  const summary = getComposerCardSummary(cards);

  return (
    <div className="page-stack">
      <PageHeader eyebrow={composerUi.library.starterLibrary} title={composerUi.pages.library.title} description={composerUi.pages.library.description} />
      <section className="status-grid" aria-label={composerUi.pages.library.title}>
        <StatusCard label={composerUi.library.readOnly} value={composerUi.dashboard.ready} detail={composerUi.library.libraryReadOnlyDetail} tone="good" />
        <StatusCard label={composerUi.library.groups} value={String(boxes.length)} detail={composerUi.library.starterSet} />
        <StatusCard label={composerUi.library.totalCards} value={String(summary.totalCards)} detail={composerUi.library.sourceQuarry} />
        <StatusCard label={composerUi.library.images} value={String(summary.cardsWithImages)} detail={composerUi.library.remoteImageMetadata} />
      </section>
      <section className="ontology-grid" aria-label={composerUi.library.ontologyTypes}>
        {composerCardOntology.map((item) => (
          <article className="panel ontology-card" key={item.id}>
            <p className="eyebrow">{composerUi.library.ontology}</p>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
      <section className="library-grid" aria-label={composerUi.library.groups}>
        {boxes.map((box) => (
          <article className="panel library-box" key={box.id}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">{displayComposerValue(box.kind)}</p>
                <h2>{box.title}</h2>
                <p>
                  {box.cardCount} {composerUi.library.cards}
                </p>
              </div>
              <Link className="icon-link" href={box.kind === "course" ? "/course" : "/cards"} aria-label={box.kind === "course" ? composerUi.library.openCourse : composerUi.library.openCards}>
                <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
            </div>
            <div className="metric-row">
              <span>
                <strong>{box.imageCount}</strong>
                {composerUi.library.images}
              </span>
              <span>
                <strong>{box.promptCount}</strong>
                {composerUi.library.prompts}
              </span>
              <span>
                <strong>{box.lessonCount}</strong>
                {composerUi.library.lessons}
              </span>
              <span>
                <strong>{box.quizCount}</strong>
                {composerUi.library.quizzes}
              </span>
              <span>
                <strong>{box.testCount + box.certificationCount}</strong>
                {composerUi.library.tests}
              </span>
            </div>
            <div className="tag-row">
              {Object.entries(box.statusCounts).map(([status, count]) => (
                <span key={status}>
                  {count} {displayComposerValue(status)}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
