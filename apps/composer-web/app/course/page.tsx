import { CardWorkspace } from "../../components/CardWorkspace";
import { CourseAssessmentCard } from "../../components/CourseAssessmentCard";
import { PageHeader } from "../../components/PageHeader";
import { StatusCard } from "../../components/StatusCard";
import { composerUi } from "../../lib/i18n";
import { buildAstrology101CourseSections, getComposerCardImage, getComposerCardSummary, getComposerCardOntologyType, listComposerCourseCards, queryComposerCards } from "../../lib/cardLibrary";

export default function CoursePage() {
  const cards = listComposerCourseCards();
  const sections = buildAstrology101CourseSections(cards);
  const summary = getComposerCardSummary(cards);
  const quizCount = sections.reduce((total, section) => total + section.quizCount, 0);
  const testCount = sections.reduce((total, section) => total + section.testCount, 0);
  const certificationCount = sections.reduce((total, section) => total + section.certificationCount, 0);
  const quizQuestionCount = cards.reduce((total, card) => total + (card.quiz?.questions.length ?? 0), 0);
  const assessmentCards = cards.filter((card) => ["quiz", "test", "certification"].includes(getComposerCardOntologyType(card)));
  const initialResult = queryComposerCards({ scope: "course", pageSize: 48 });

  return (
    <div className="page-stack">
      <PageHeader eyebrow={composerUi.library.courseSequence} title={composerUi.pages.course.title} description={composerUi.pages.course.description} />
      <section className="status-grid" aria-label={composerUi.library.courseSequence}>
        <StatusCard label={composerUi.library.courseCards} value={String(summary.totalCards)} detail={composerUi.library.v1AuthoredCourse} tone="good" />
        <StatusCard label={composerUi.library.sections} value={String(sections.length)} detail={composerUi.library.sectionedCourse} />
        <StatusCard label={composerUi.library.quizzes} value={String(quizCount)} detail={`${quizQuestionCount} ${composerUi.library.questions}`} />
        <StatusCard label={composerUi.library.tests} value={String(testCount + certificationCount)} detail={composerUi.library.certificationCards} />
      </section>
      <section className="course-section-grid" aria-label={composerUi.library.sectionedCourse}>
        {sections.map((section) => (
          <article className="panel course-section-card" key={section.id}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">
                  {composerUi.library.section} {section.order}
                </p>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <strong>{section.cards.length}</strong>
            </div>
            <div className="metric-row">
              <span>
                <strong>{section.lessonCount}</strong>
                {composerUi.library.lessons}
              </span>
              <span>
                <strong>{section.quizCount}</strong>
                {composerUi.library.quizzes}
              </span>
              <span>
                <strong>{section.testCount}</strong>
                {composerUi.library.tests}
              </span>
              <span>
                <strong>{section.certificationCount}</strong>
                {composerUi.library.certifications}
              </span>
            </div>
            <dl className="course-section-range">
              <div>
                <dt>{composerUi.library.firstCard}</dt>
                <dd>{section.cards[0]?.title ?? composerUi.library.noCards}</dd>
              </div>
              <div>
                <dt>{composerUi.library.lastCard}</dt>
                <dd>{section.cards[section.cards.length - 1]?.title ?? composerUi.library.noCards}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
      <section className="panel quiz-widget-board" aria-label={composerUi.library.quizWidgets}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">{composerUi.library.quizWidgets}</p>
            <h2>{composerUi.library.assessments}</h2>
            <p>
              {quizCount} {composerUi.library.quizzes} · {testCount} {composerUi.library.tests} · {certificationCount} {composerUi.library.certifications}
            </p>
          </div>
          <strong>{quizQuestionCount}</strong>
        </div>
        <div className="quiz-widget-list">
          {assessmentCards.map((card) => (
            <CourseAssessmentCard
              card={{
                body: card.body,
                courseSectionTitle: card.courseSectionTitle,
                excerpt: card.excerpt,
                id: card.id,
                imageUrl: getComposerCardImage(card) || undefined,
                kind: card.kind,
                ontologyType: getComposerCardOntologyType(card),
                quiz: card.quiz,
                seriesOrder: card.seriesOrder,
                subtitle: card.subtitle,
                title: card.title
              }}
              key={card.id}
              labels={composerUi.library}
            />
          ))}
        </div>
      </section>
      <CardWorkspace initialResult={initialResult} labels={composerUi.library} scope="course" />
    </div>
  );
}
