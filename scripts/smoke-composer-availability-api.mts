import { composerAvailabilityResponseSchema } from "@astra/contracts";
import { closeDatabaseConnection, db, getComposerLibraryCollection } from "@astra/db";
import { buildComposerAvailability } from "../apps/composer-web/lib/cardLibrary";

type JsonObject = Record<string, unknown>;

const composerBaseUrl = clean(process.env.COMPOSER_APP_SMOKE_BASE_URL) || "http://localhost:3012";
const astraBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

async function requestJson(url: string) {
  const response = await fetch(url);
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as JsonObject) : {};
  return { ok: response.ok, status: response.status, payload };
}

function parseAvailability(payload: JsonObject, label: string) {
  const parsed = composerAvailabilityResponseSchema.safeParse(payload.availability);
  if (!parsed.success) {
    throw new Error(`${label} availability did not match contract: ${JSON.stringify(parsed.error.issues)}`);
  }
  return parsed.data;
}

const directCourse = composerAvailabilityResponseSchema.parse(buildComposerAvailability({ requestType: "course", id: "astrology_101", limit: 100 }));
if (directCourse.collection.id !== "astrology_101" || directCourse.collection.cards.length !== 78) {
  throw new Error(`Expected direct Astrology 101 availability to expose 78 cards, received ${directCourse.collection.cards.length}.`);
}
for (const kind of ["quiz", "test", "certification"]) {
  if (!directCourse.collection.cards.some((card) => card.ontologyType === kind)) {
    throw new Error(`Expected direct Astrology 101 availability to include ${kind} cards.`);
  }
}
const directQuizCards = directCourse.collection.cards.filter((card) => card.quiz);
const directQuizQuestionCount = directQuizCards.reduce((total, card) => {
  const questions = Array.isArray(card.quiz?.questions) ? card.quiz.questions : [];
  return total + questions.length;
}, 0);
if (directQuizCards.length !== 11 || directQuizQuestionCount !== 40) {
  throw new Error(`Expected direct Astrology 101 availability to include 11 quiz/test payloads with 40 questions, received ${directQuizCards.length}/${directQuizQuestionCount}.`);
}

const composerCourseResponse = await requestJson(`${composerBaseUrl}/api/library/availability?requestType=course&id=astrology_101&limit=100`);
if (!composerCourseResponse.ok) {
  throw new Error(`Composer availability route failed with ${composerCourseResponse.status}: ${JSON.stringify(composerCourseResponse.payload)}`);
}
if ((composerCourseResponse.payload.cache as { persisted?: boolean } | undefined)?.persisted !== true) {
  throw new Error(`Expected Composer availability route to persist the course collection, received ${JSON.stringify(composerCourseResponse.payload.cache)}`);
}
const composerCourse = parseAvailability(composerCourseResponse.payload, "Composer course");
if (composerCourse.collection.id !== "astrology_101" || composerCourse.collection.cards.length !== 78) {
  throw new Error(`Expected Composer course route to return 78 Astrology 101 cards, received ${composerCourse.collection.cards.length}.`);
}

const persistedCourse = await getComposerLibraryCollection(db, "astrology_101");
if (!persistedCourse || persistedCourse.cards.length !== 78 || persistedCourse.kind !== "course") {
  throw new Error(`Expected persisted Astrology 101 collection to contain 78 cards, received ${JSON.stringify(persistedCourse)}`);
}
if (!persistedCourse.cards.some((card) => card.quiz)) {
  throw new Error("Expected persisted Astrology 101 collection to preserve quiz payloads.");
}

const orderedIds = composerCourse.collection.cards.slice(0, 3).map((card) => card.id);
const orderedResponse = await requestJson(`${composerBaseUrl}/api/library/availability?requestType=ordered_list&cardId=${orderedIds.join(",")}`);
if (!orderedResponse.ok) {
  throw new Error(`Composer ordered-list route failed with ${orderedResponse.status}: ${JSON.stringify(orderedResponse.payload)}`);
}
const ordered = parseAvailability(orderedResponse.payload, "Composer ordered list");
if (ordered.collection.cards.map((card) => card.id).join(",") !== orderedIds.join(",")) {
  throw new Error("Composer ordered-list availability did not preserve requested card order.");
}

const poolResponse = await requestJson(`${composerBaseUrl}/api/library/availability?requestType=onboarding&id=onboarding&limit=12`);
if (!poolResponse.ok) {
  throw new Error(`Composer pool route failed with ${poolResponse.status}: ${JSON.stringify(poolResponse.payload)}`);
}
const pool = parseAvailability(poolResponse.payload, "Composer pool");
if (pool.collection.cards.length !== 5 || !pool.collection.cards.every((card) => card.ontologyType === "onboarding")) {
  throw new Error(`Expected onboarding pool to return 5 onboarding cards, received ${pool.collection.cards.length}.`);
}

const astraCourseResponse = await requestJson(`${astraBaseUrl}/api/composer/availability?requestType=course&id=astrology_101&limit=100`);
if (!astraCourseResponse.ok) {
  throw new Error(`Astra availability route failed with ${astraCourseResponse.status}: ${JSON.stringify(astraCourseResponse.payload)}`);
}
const astraCourse = parseAvailability(astraCourseResponse.payload, "Astra proxied course");
if (astraCourse.collection.id !== composerCourse.collection.id || astraCourse.collection.cards.length !== composerCourse.collection.cards.length) {
  throw new Error("Astra availability route did not proxy the Composer course availability contract.");
}

await closeDatabaseConnection();

console.log(`Composer availability API smoke passed: ${composerCourse.collection.cards.length} course cards, ${ordered.collection.cards.length} ordered cards, ${pool.collection.cards.length} onboarding pool cards.`);
