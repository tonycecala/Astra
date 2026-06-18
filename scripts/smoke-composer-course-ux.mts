import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const composerBaseUrl = clean(process.env.COMPOSER_APP_SMOKE_BASE_URL) || "http://localhost:3012";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

const browser = await chromium.launch();

try {
  for (const [label, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["tablet", { width: 820, height: 1180 }],
    ["phone", { width: 390, height: 844 }]
  ] as const) {
    const page = await browser.newPage({ viewport });
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") consoleMessages.push(`${message.type()}: ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(`${composerBaseUrl}/course`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".courseAssessmentCard", { timeout: 15_000 });

    assert.equal(await page.locator(".courseAssessmentCard").count(), 12, `${label}: expected 12 quiz/test/cert assessment cards.`);
    assert.equal(await page.locator(".courseAssessmentCard img").count(), 12, `${label}: expected every assessment card to render an image.`);
    assert.equal(await page.locator(".courseAssessmentCard .assessment-detail-link").count(), 0, `${label}: assessment type pills must not navigate.`);
    assert.equal(await page.locator(".courseAssessmentCard .assessment-type-pill").count(), 12, `${label}: expected inert assessment type badges.`);

    const firstQuestion = page.locator(".composerQuizQuestionToggle").first();
    assert.equal(await firstQuestion.getAttribute("aria-expanded"), "true", `${label}: first quiz question should start expanded.`);
    await firstQuestion.click();
    assert.equal(await firstQuestion.getAttribute("aria-expanded"), "false", `${label}: first quiz question should collapse.`);
    await firstQuestion.click();
    assert.equal(await firstQuestion.getAttribute("aria-expanded"), "true", `${label}: first quiz question should reopen.`);

    await page.locator(".composerMiniAction").first().click();
    assert.equal(await page.locator(".composerQuizChoiceList em").count(), 1, `${label}: answer reveal should mark exactly one correct choice for the open question.`);

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(hasHorizontalOverflow, false, `${label}: Course page should not horizontally overflow.`);
    assert.deepEqual(consoleMessages, [], `${label}: expected no console warnings/errors, received ${consoleMessages.join("; ")}`);
    assert.deepEqual(pageErrors, [], `${label}: expected no page errors, received ${pageErrors.join("; ")}`);

    await page.close();
  }
} finally {
  await browser.close();
}

console.log("Composer Course UX smoke passed: assessment images, inert badges, v1-style quiz reveal, and responsive overflow verified.");
