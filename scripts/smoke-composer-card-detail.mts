import assert from "node:assert/strict";

const composerBaseUrl = clean(process.env.COMPOSER_APP_SMOKE_BASE_URL) || "http://localhost:3012";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

async function fetchText(path: string) {
  const response = await fetch(`${composerBaseUrl}${path}`);
  return {
    ok: response.ok,
    status: response.status,
    text: await response.text()
  };
}

const courseCard = await fetchText("/cards/astro101_067_quiz_signs_are_styles_not_sentences");
assert.equal(courseCard.status, 200, `Expected quiz card detail to render, received ${courseCard.status}.`);
assert.match(courseCard.text, /Quiz: Signs Are Styles, Not Sentences/);
assert.match(courseCard.text, /Which statement uses the zodiac most intelligently/);
assert.match(courseCard.text, /Correct answer/);
assert.match(courseCard.text, /media\.astraportrait\.com/);
assert.match(courseCard.text, /Availability preview/);

const libraryCard = await fetchText("/cards/chart_literacy_retrograde_means_revisit");
assert.equal(libraryCard.status, 200, `Expected stream card detail to render, received ${libraryCard.status}.`);
assert.match(libraryCard.text, /Retrograde means revisit/);
assert.match(libraryCard.text, /Availability preview/);

const missingCard = await fetchText("/cards/not-a-real-composer-card");
assert.equal(missingCard.status, 404, `Expected missing card detail to 404, received ${missingCard.status}.`);

console.log("Composer card detail smoke passed: quiz card, stream card, and 404 route verified.");
