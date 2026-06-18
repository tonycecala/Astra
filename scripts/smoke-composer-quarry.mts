import { execFileSync } from "node:child_process";
import {
  buildComposerLibraryBoxes,
  buildAstrology101CourseSections,
  composerCardOntology,
  countComposerSignReferenceCards,
  getComposerCardImage,
  getComposerCardSummary,
  listComposerCards,
  listComposerCourseCards,
  listImportedComposerCards,
  queryComposerCards
} from "../apps/composer-web/lib/cardLibrary";
import { createComposerOnboardingSeedCards } from "../apps/composer-web/src";

const cards = listComposerCards();
const importedCards = listImportedComposerCards();
const summary = getComposerCardSummary(cards);
const boxes = buildComposerLibraryBoxes(cards);
const courseCards = listComposerCourseCards(cards);
const courseSections = buildAstrology101CourseSections(courseCards);
const onboardingCards = createComposerOnboardingSeedCards();
const signReferenceCount = countComposerSignReferenceCards();

if (importedCards.length !== 205) {
  throw new Error(`Expected 205 imported v1 Composer cards, received ${importedCards.length}.`);
}

if (summary.totalCards !== 283) {
  throw new Error(`Expected 283 total Composer cards after v1 Astrology 101 import, received ${summary.totalCards}.`);
}

const importedImageCount = importedCards.filter(getComposerCardImage).length;
if (importedImageCount !== 200) {
  throw new Error(`Expected 200 cards with image metadata, received ${summary.cardsWithImages}.`);
}

const courseImageCount = courseCards.filter(getComposerCardImage).length;
if (courseImageCount !== 78) {
  throw new Error(`Expected all 78 Astrology 101 course cards to carry remote image metadata, received ${courseImageCount}.`);
}

if (summary.onboardingCards !== 5) {
  throw new Error(`Expected 5 first-run onboarding cards, received ${summary.onboardingCards}.`);
}

if (onboardingCards.length !== 5) {
  throw new Error(`Expected publishable onboarding workflow to expose 5 cards, received ${onboardingCards.length}.`);
}

if (courseCards.length !== 78) {
  throw new Error(`Expected 78 Astrology 101 course cards, received ${courseCards.length}.`);
}

if (courseSections.length !== 7) {
  throw new Error(`Expected Astrology 101 to expose 7 course sections, received ${courseSections.length}.`);
}

const assessmentKinds = new Set(courseCards.filter((card) => ["quiz", "test", "certification"].includes(card.kind)).map((card) => card.kind));
for (const kind of ["quiz", "test", "certification"]) {
  if (!assessmentKinds.has(kind)) {
    throw new Error(`Expected Astrology 101 to include ${kind} cards.`);
  }
}

const quizCards = courseCards.filter((card) => card.quiz);
const quizQuestionCount = quizCards.reduce((total, card) => total + (card.quiz?.questions.length ?? 0), 0);
if (quizCards.length !== 11 || quizQuestionCount !== 40) {
  throw new Error(`Expected 11 structured quiz/test cards with 40 questions, received ${quizCards.length}/${quizQuestionCount}.`);
}

for (const card of quizCards) {
  for (const question of card.quiz?.questions ?? []) {
    if (question.choices.length < 2 || question.choices.filter((choice) => choice.isCorrect).length !== 1) {
      throw new Error(`Expected ${card.id}/${question.id} to include multiple choices with exactly one correct answer.`);
    }
  }
}

for (const ontologyType of ["lesson", "reflection", "quiz", "test", "certification", "art", "onboarding", "series"]) {
  if (!composerCardOntology.some((item) => item.id === ontologyType)) {
    throw new Error(`Expected Composer card ontology to include ${ontologyType}.`);
  }
}

if (signReferenceCount !== 12) {
  throw new Error(`Expected 12 sign reference cards, received ${signReferenceCount}.`);
}

if (boxes.length < 5) {
  throw new Error(`Expected at least 5 library groups, received ${boxes.length}.`);
}

const firstPage = queryComposerCards({ pageSize: 48 });
if (firstPage.cards.length !== 48 || firstPage.totalCards !== 283 || firstPage.pageCount !== 6) {
  throw new Error(`Expected paged card query to return 48/283 cards over 6 pages, received ${firstPage.cards.length}/${firstPage.totalCards}/${firstPage.pageCount}.`);
}

if (!firstPage.pageState.cacheKey.startsWith("composer_cards:") || firstPage.pageState.windowStart !== 1 || firstPage.pageState.windowEnd !== 48 || !firstPage.pageState.hasNextPage) {
  throw new Error(`Expected first page to expose stable cache/window state, received ${JSON.stringify(firstPage.pageState)}.`);
}

const firstPageDifferentFilterOrder = queryComposerCards({ feeds: ["standard", "public"], pageSize: 48 });
const firstPageStableFilterOrder = queryComposerCards({ feeds: ["public", "standard"], pageSize: 48 });
if (firstPageDifferentFilterOrder.pageState.cacheKey !== firstPageStableFilterOrder.pageState.cacheKey) {
  throw new Error("Expected query cache key to be stable when multi-select filter order changes.");
}

const cleopatraQuery = queryComposerCards({ query: "cleopatra", pageSize: 12 });
if (cleopatraQuery.totalCards !== 1 || !cleopatraQuery.cards[0]?.title.toLowerCase().includes("cleopatra")) {
  throw new Error("Expected Composer card query to find the Cleopatra card.");
}

const courseQuery = queryComposerCards({ scope: "course", pageSize: 48 });
if (courseQuery.totalCards !== 78 || courseQuery.cards.length !== 48 || courseQuery.pageCount !== 2) {
  throw new Error(`Expected course query to page 78 Astrology 101 cards over 2 pages, received ${courseQuery.cards.length}/${courseQuery.totalCards}/${courseQuery.pageCount}.`);
}

const trackedGeneratedImages = execFileSync("git", ["ls-files", "apps/composer-web/public/generated"], {
  encoding: "utf8"
})
  .trim()
  .split("\n")
  .filter(Boolean)
  .filter((path) => /\.(?:avif|gif|jpe?g|png|webp)$/i.test(path));

if (trackedGeneratedImages.length) {
  throw new Error(`Generated Composer image binaries must not be tracked by git: ${trackedGeneratedImages.slice(0, 5).join(", ")}`);
}

const missingImageMetadata = importedCards.filter((card) => !getComposerCardImage(card));
if (missingImageMetadata.length !== 5) {
  throw new Error(`Expected only 5 cards without image metadata, received ${missingImageMetadata.length}.`);
}

console.log(
  `Composer quarry smoke passed: ${importedCards.length} imported cards, ${summary.totalCards} total cards, ${importedImageCount} stream image metadata records, ${courseImageCount} course image metadata records, ${courseSections.length} Astrology 101 sections, no tracked generated image binaries.`
);
