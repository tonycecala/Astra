"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { ComposerCardQuiz } from "../lib/cardLibrary";

type CourseAssessmentLabels = {
  answer: string;
  answerKey: string;
  hideAnswer: string;
  noCards: string;
  question: string;
  questions: string;
  showAnswer: string;
};

export type CourseAssessmentCardModel = {
  body: string;
  courseSectionTitle?: string;
  excerpt?: string;
  id: string;
  imageUrl?: string;
  kind: string;
  ontologyType: string;
  quiz?: ComposerCardQuiz;
  seriesOrder?: number;
  subtitle?: string;
  title: string;
};

type CourseAssessmentCardProps = {
  card: CourseAssessmentCardModel;
  labels: CourseAssessmentLabels;
};

function splitAssessmentCopy(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function questionCountLabel(count: number, labels: CourseAssessmentLabels) {
  return `${count} ${count === 1 ? labels.question.toLowerCase() : labels.questions}`;
}

export function CourseAssessmentCard({ card, labels }: CourseAssessmentCardProps) {
  const firstQuestionId = card.quiz?.questions[0]?.id ?? null;
  const [showQuizAnswers, setShowQuizAnswers] = useState(false);
  const [expandedQuizQuestionId, setExpandedQuizQuestionId] = useState<string | null>(firstQuestionId);
  const copy = useMemo(() => splitAssessmentCopy(card.body), [card.body]);
  const deck = card.subtitle ?? card.excerpt ?? "";
  const questionCount = card.quiz?.questions.length ?? 0;

  return (
    <article className="courseAssessmentCard">
      <div className="courseAssessmentMain">
        <div className="courseAssessmentMedia" aria-label={card.title}>
          {card.imageUrl ? <img src={card.imageUrl} alt="" loading="lazy" /> : <div className="courseAssessmentImageFallback">{card.ontologyType}</div>}
        </div>
        <div className="courseAssessmentCopy">
          <div className="quiz-widget-heading">
            <div>
              <p className="eyebrow">{card.courseSectionTitle ?? card.ontologyType}</p>
              <h3>{card.title}</h3>
              {deck ? <p>{deck}</p> : null}
            </div>
            <span className="assessment-type-pill">{card.quiz ? questionCountLabel(questionCount, labels) : card.ontologyType}</span>
          </div>
          <div className="courseAssessmentBody">
            {copy.length > 0 ? copy.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : <p>{labels.noCards}</p>}
          </div>
        </div>
      </div>
      {card.quiz ? (
        <section className="composerQuizReview" aria-label={`${card.title} ${labels.questions}`}>
          <div className="composerQuizReviewHeader">
            <span>{questionCountLabel(questionCount, labels)}</span>
            <button className="composerMiniAction" type="button" onClick={() => setShowQuizAnswers((current) => !current)}>
              {showQuizAnswers ? labels.hideAnswer : labels.showAnswer}
            </button>
          </div>
          <ol className="composerQuizQuestionList">
            {card.quiz.questions.map((question, index) => {
              const isExpanded = expandedQuizQuestionId === question.id;

              return (
                <li key={question.id}>
                  <button
                    aria-expanded={isExpanded}
                    className="composerQuizQuestionToggle"
                    type="button"
                    onClick={() => {
                      setShowQuizAnswers(false);
                      setExpandedQuizQuestionId((current) => (current === question.id ? null : question.id));
                    }}
                  >
                    <span>
                      <small>
                        {labels.question} {index + 1}
                      </small>
                      <strong>{question.prompt}</strong>
                    </span>
                    <span aria-hidden="true" className="composerQuizQuestionArrow">
                      {isExpanded ? <ChevronDown size={16} strokeWidth={2.4} /> : <ChevronRight size={16} strokeWidth={2.4} />}
                    </span>
                  </button>
                  {isExpanded ? (
                    <div className="composerQuizQuestionAnswer">
                      <ol className="composerQuizChoiceList" type="A">
                        {question.choices.map((choice) => (
                          <li className={showQuizAnswers && choice.isCorrect ? "composerQuizChoice-correct" : undefined} key={choice.id}>
                            <span>{choice.label}</span>
                            {showQuizAnswers && choice.isCorrect ? <em>{labels.answer}</em> : null}
                          </li>
                        ))}
                      </ol>
                      {showQuizAnswers && question.explanation ? <p>{question.explanation}</p> : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <section className="composerQuizReview" aria-label={`${card.title} ${labels.answerKey}`}>
          <div className="composerQuizReviewHeader">
            <span>{labels.answerKey}</span>
          </div>
          <div className="composerQuizQuestionAnswer">
            <p>{card.excerpt ?? card.subtitle ?? card.body}</p>
          </div>
        </section>
      )}
    </article>
  );
}
