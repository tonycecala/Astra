import { composerSelectionResponseSchema } from "@astra/contracts";
import { closeDatabaseConnection, db, listUserFeedItems, user } from "@astra/db";
import { eq } from "drizzle-orm";

type JsonObject = Record<string, unknown>;

const astraBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const runId = `composer_selection_${Date.now()}`;
const userKey = `${runId}_user`;

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

async function requestJson(url: string) {
  const response = await fetch(url);
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as JsonObject) : {};
  return { ok: response.ok, status: response.status, payload };
}

function parseSelection(payload: JsonObject, label: string) {
  const parsed = composerSelectionResponseSchema.safeParse(payload.selection);
  if (!parsed.success) {
    throw new Error(`${label} did not match selection contract: ${JSON.stringify(parsed.error.issues)}`);
  }
  return parsed.data;
}

await db.insert(user).values({
  id: userKey,
  name: userKey,
  email: `${userKey}@example.com`,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

try {
  const baseQuery = `userKey=${encodeURIComponent(userKey)}&requestType=course&id=astrology_101&selectionDate=2026-06-17&count=5&limit=100`;
  const firstResponse = await requestJson(`${astraBaseUrl}/api/composer/selection?${baseQuery}`);
  if (!firstResponse.ok) {
    throw new Error(`Astra selection route failed with ${firstResponse.status}: ${JSON.stringify(firstResponse.payload)}`);
  }
  const first = parseSelection(firstResponse.payload, "First selection");
  if (first.selectedCards.length !== 5 || first.availability.collection.cards.length !== 78) {
    throw new Error(`Expected 5 selected cards from 78 Astrology 101 cards, received ${first.selectedCards.length}/${first.availability.collection.cards.length}.`);
  }
  const availableQuizCards = first.availability.collection.cards.filter((card) => card.quiz);
  const availableQuizQuestionCount = availableQuizCards.reduce((total, card) => {
    const questions = Array.isArray(card.quiz?.questions) ? card.quiz.questions : [];
    return total + questions.length;
  }, 0);
  if (availableQuizCards.length !== 11 || availableQuizQuestionCount !== 40) {
    throw new Error(`Expected selection availability to preserve 11 quiz/test payloads with 40 questions, received ${availableQuizCards.length}/${availableQuizQuestionCount}.`);
  }

  const secondResponse = await requestJson(`${astraBaseUrl}/api/composer/selection?${baseQuery}`);
  const second = parseSelection(secondResponse.payload, "Second selection");
  if (first.selectedCards.map((card) => card.id).join(",") !== second.selectedCards.map((card) => card.id).join(",")) {
    throw new Error("Expected Composer selection to be deterministic for the same user/date/query.");
  }

  const nextDayResponse = await requestJson(`${astraBaseUrl}/api/composer/selection?userKey=${encodeURIComponent(userKey)}&requestType=course&id=astrology_101&selectionDate=2026-06-18&count=5&limit=100`);
  const nextDay = parseSelection(nextDayResponse.payload, "Next-day selection");
  if (first.selectedCards.map((card) => card.id).join(",") === nextDay.selectedCards.map((card) => card.id).join(",")) {
    throw new Error("Expected Composer selection to rotate across selection dates.");
  }

  const missingUserKey = await requestJson(`${astraBaseUrl}/api/composer/selection?requestType=course&id=astrology_101`);
  if (missingUserKey.status !== 400 || missingUserKey.payload.error !== "USER_KEY_REQUIRED") {
    throw new Error(`Expected USER_KEY_REQUIRED, received ${missingUserKey.status}: ${JSON.stringify(missingUserKey.payload)}`);
  }

  const feed = await listUserFeedItems(db, { userId: userKey, limit: 10 });
  if (feed.items.length) {
    throw new Error("Composer selection must not create user-owned feed items.");
  }

  const journeyResponse = await fetch(`${astraBaseUrl}/journey?composerSelected=1&course=astrology_101&selectionDate=2026-06-17&count=5`);
  const journeyHtml = await journeyResponse.text();
  if (!journeyResponse.ok || !journeyHtml.includes("Composer selected") || !journeyHtml.includes("Astra selected these from Composer availability")) {
    throw new Error(`Journey selected Composer path did not render the selected-mode labels. Status: ${journeyResponse.status}`);
  }
  const anonymousJourneySelectionResponse = await requestJson(`${astraBaseUrl}/api/composer/selection?userKey=anonymous&requestType=course&id=astrology_101&selectionDate=2026-06-17&count=5&limit=100`);
  const anonymousJourneySelection = parseSelection(anonymousJourneySelectionResponse.payload, "Anonymous Journey selection");
  for (const card of anonymousJourneySelection.selectedCards.slice(0, 2)) {
    if (!journeyHtml.includes(card.title)) {
      throw new Error(`Journey selected Composer path did not render selected card ${card.title}.`);
    }
  }
  if (journeyHtml.includes("Private journey")) {
    throw new Error("Journey selected Composer path must not label selected cards as private feed writes.");
  }
} finally {
  await db.delete(user).where(eq(user.id, userKey));
  await closeDatabaseConnection();
}

console.log(`Composer selection API smoke passed: ${runId}.`);
