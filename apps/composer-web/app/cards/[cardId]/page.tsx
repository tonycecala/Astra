import { PublishedCardBody } from "@astra/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Boxes, CheckCircle2, ImageIcon } from "lucide-react";
import { CardDetailWorkbenchControl } from "../../../components/CardDetailWorkbenchControl";
import { composerUi } from "../../../lib/i18n";
import { displayComposerValue, getComposerCardById, getComposerCardFeeds, getComposerCardImage, getComposerCardMemberships, getComposerCardOntologyType } from "../../../lib/cardLibrary";

type CardDetailPageProps = {
  params: Promise<{ cardId: string }>;
};

function metaRows(card: NonNullable<ReturnType<typeof getComposerCardById>>) {
  return [
    [composerUi.library.type, getComposerCardOntologyType(card)],
    [composerUi.library.status, card.status],
    [composerUi.library.feed, getComposerCardFeeds(card).join(", ")],
    [composerUi.library.lane, card.seriesId ?? card.lane ?? "unset"],
    [composerUi.library.courseSection, card.courseSectionTitle ?? "unset"],
    [composerUi.library.page, card.seriesOrder ? String(card.seriesOrder) : "unset"],
    [composerUi.library.source, card.source ?? "v1-quarry"],
    [composerUi.library.imageReady, getComposerCardImage(card) ? composerUi.dashboard.configured : composerUi.dashboard.missing]
  ];
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { cardId } = await params;
  const card = getComposerCardById(cardId);
  if (!card) notFound();

  const image = getComposerCardImage(card);
  const feeds = getComposerCardFeeds(card);
  const memberships = getComposerCardMemberships(card);
  const queueScope = card.courseId ? "course" : "all";
  const availabilityPreview = {
    id: card.id,
    kind: card.kind,
    ontologyType: getComposerCardOntologyType(card),
    courseId: card.courseId,
    sectionId: card.courseSectionId,
    seriesId: card.seriesId,
    seriesOrder: card.seriesOrder,
    feeds,
    tags: card.tags,
    hasQuiz: Boolean(card.quiz),
    hasImage: Boolean(image)
  };

  return (
    <div className="page-stack">
      <section className="panel card-detail-hero">
        <div className="card-detail-heading">
          <Link className="secondary-button" href="/cards">
            <ArrowLeft aria-hidden="true" size={16} />
            {composerUi.library.openCards}
          </Link>
          <div>
            <p className="eyebrow">{card.id}</p>
            <h1>{card.title}</h1>
            <p>{card.subtitle ?? card.excerpt ?? composerUi.library.cardDetailDescription}</p>
          </div>
        </div>
        <div className="card-detail-badges">
          <span>
            <Boxes aria-hidden="true" size={14} />
            {displayComposerValue(getComposerCardOntologyType(card))}
          </span>
          {card.courseId ? (
            <span>
              <BookOpen aria-hidden="true" size={14} />
              {card.courseTitle ?? composerUi.library.astrology101}
            </span>
          ) : null}
          {image ? (
            <span>
              <ImageIcon aria-hidden="true" size={14} />
              {composerUi.library.remoteImageMetadata}
            </span>
          ) : null}
          {card.quiz ? (
            <span>
              <CheckCircle2 aria-hidden="true" size={14} />
              {card.quiz.questions.length} {composerUi.library.questions}
            </span>
          ) : null}
        </div>
      </section>

      <CardDetailWorkbenchControl cardId={card.id} cardStatus={card.status} labels={composerUi.library} memberships={memberships} scope={queueScope} />

      <section className="card-detail-layout">
        <article className="composerCardSurface composerCardPreview composerPublishedCard astraPublishedCard card-detail-preview">
          <div className="astraPublishedCardOpen">
            <div className="astraPublishedCardContent">
              <div className="astraPublishedCardHeader">
                <p className="eyebrow astraPublishedCardEyebrow">{displayComposerValue(card.seriesId ?? card.lane ?? card.kind)}</p>
                <h2 className="astraPublishedCardTitle">{card.title}</h2>
              </div>
              <PublishedCardBody text={card.excerpt ?? card.subtitle ?? card.body} showLessLabel={composerUi.library.showLess} showMoreLabel={composerUi.library.showMore} />
              <div className="astraPublishedCardMeta">
                <span>{displayComposerValue(card.kind)}</span>
                {feeds.slice(0, 2).map((feed) => (
                  <span key={feed}>{displayComposerValue(feed)}</span>
                ))}
              </div>
            </div>
            <div className="composerPublishedCardMedia astraPublishedCardMedia" style={image ? { backgroundImage: `url("${image}")` } : undefined} />
          </div>
        </article>

        <aside className="panel card-detail-side">
          <div>
            <p className="eyebrow">{composerUi.library.cardDetail}</p>
            <h2>{composerUi.library.queryBoundary}</h2>
          </div>
          <dl className="card-detail-meta">
            {metaRows(card).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{displayComposerValue(value)}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <section className="panel card-detail-copy">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{composerUi.library.cardBody}</p>
            <h2>{card.title}</h2>
          </div>
          <span>{card.body.length}</span>
        </div>
        <div className="card-detail-body">
          {card.body.split(/\n{2,}/).map((paragraph, index) => (
            <p key={`${card.id}-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>
      </section>

      {card.quiz ? (
        <section className="panel quiz-widget-board" aria-label={composerUi.library.quizWidgets}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">{composerUi.library.quizWidgets}</p>
              <h2>{composerUi.library.multipleChoice}</h2>
            </div>
            <strong>{card.quiz.questions.length}</strong>
          </div>
          <div className="quiz-question-list">
            {card.quiz.questions.map((question, questionIndex) => {
              const correctChoice = question.choices.find((choice) => choice.isCorrect);
              return (
                <details className="quiz-question" key={question.id}>
                  <summary>
                    <span>
                      {composerUi.library.questions} {questionIndex + 1}
                    </span>
                    <strong>{question.prompt}</strong>
                  </summary>
                  <ol className="quiz-choice-list">
                    {question.choices.map((choice) => (
                      <li className={choice.isCorrect ? "quiz-choice-correct" : undefined} key={choice.id}>
                        <span>{choice.id.toUpperCase()}</span>
                        {choice.label}
                      </li>
                    ))}
                  </ol>
                  <div className="quiz-answer-panel">
                    <strong>
                      {composerUi.library.correctAnswer}: {correctChoice?.label ?? composerUi.library.noCards}
                    </strong>
                    {question.explanation ? (
                      <p>
                        {composerUi.library.explanation}: {question.explanation}
                      </p>
                    ) : null}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="panel card-detail-json">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{composerUi.library.queryBoundary}</p>
            <h2>{composerUi.library.availabilityPreview}</h2>
          </div>
        </div>
        <pre>{JSON.stringify(availabilityPreview, null, 2)}</pre>
      </section>
    </div>
  );
}
