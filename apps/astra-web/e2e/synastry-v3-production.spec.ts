import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { allyRelationshipTags } from "@astra/contracts";
import { ASTRA_SYNASTRY_V3_PROMPT_VERSION, synastryToneSnapshot, synastryV3Headings } from "@astra/astrology";
import { createAlly, createAstrologyReportRequest, createAstrologyReportShare, createChartMakerRequest, db, recordAstrologyReportResult } from "@astra/db";
import { signInWithTestSession } from "./support/auth-session";

test.describe("Synastry V3 production boundary", () => {
  test("canonical Ally edit, private Evidence, and public-share suppression", async ({ page }, testInfo) => {
    const errors: string[] = [];
    const expectedCancellation = (message: string) => message.includes("due to access control checks.") || message.includes("ChunkLoadError");
    page.on("console", (message) => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:") && !expectedCancellation(message.text())) errors.push(message.text()); });
    page.on("pageerror", (error) => { if (!expectedCancellation(error.message)) errors.push(error.message); });

    await page.goto("/allies");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await page.goto("/library");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    const email = `synastry-v3-${testInfo.project.name}-${Date.now()}@example.com`;
    const userId = await signInWithTestSession(page, { email, name: "V3 Reader" });
    const ally = await createAlly(db, { userId, name: "Cheyenne", kind: "person", relationship: "Friend" });
    const allyChart = await createChartMakerRequest(db, {
      userId,
      subjectName: "Cheyenne",
      birthData: { date: "1964-09-08", time: "14:15", timezone: "America/Chicago", location: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 },
      source: "ally",
      context: {
        subject: { subjectType: "ally", subjectId: ally.id, allyId: ally.id, displayName: "Cheyenne", relationship: "Friend" },
        chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
      }
    });
    await page.goto("/allies#ally-birth-onboarding");
    const createSelector = page.getByLabel("Relationship").last();
    await expect(createSelector).toBeVisible();
    const optionLabels = await createSelector.locator("option").allTextContents();
    for (const tag of allyRelationshipTags) expect(optionLabels).toContain(tag);
    expect(optionLabels).not.toContain("Self");

    const card = page.locator(`[id="ally-${ally.id}"]`);
    await expect(card.locator(".ally-card-badge")).toHaveText("Friend");
    await card.getByRole("button", { name: "Edit Ally: Cheyenne" }).click();
    const editDialog = page.getByRole("dialog", { name: "Edit Cheyenne" });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel("Relationship tag").selectOption("Lover");
    await editDialog.getByRole("button", { name: "Save" }).click();
    await expect(editDialog.getByText("Relationship saved.")).toBeVisible();
    await expect(card.locator(".ally-card-badge")).toHaveText("Lover");
    await page.reload();
    await expect(page.locator(`[id="ally-${ally.id}"] .ally-card-badge`)).toHaveText("Lover");
    await createChartMakerRequest(db, {
      userId,
      subjectName: "V3 Reader",
      birthData: { date: "1961-05-23", time: "09:30", timezone: "America/New_York", location: "New York, NY, USA", latitude: 40.7128, longitude: -74.006 },
      source: "self",
      context: {
        subject: { subjectType: "self", subjectId: userId, displayName: "V3 Reader" },
        chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
      }
    });
    await page.locator(`[id="ally-${ally.id}"]`).getByRole("link", { name: "Create portrait" }).click();
    const reportOrderPanel = page.locator('section[aria-label="Ally birth data onboarding"]');
    await expect(reportOrderPanel.getByText("Lover", { exact: true })).toBeVisible();
    const mobileReportSubmit = reportOrderPanel.locator("[data-mobile-report-submit]");
    if (testInfo.project.name === "mobile") {
      await reportOrderPanel.getByLabel("Synastry Report").check();
      await reportOrderPanel.getByLabel("Comparison chart").selectOption({ index: 1 });
      await reportOrderPanel.getByText("Reading perspective").scrollIntoViewIfNeeded();
      await expect(mobileReportSubmit).toBeVisible();
      await expect(mobileReportSubmit).toBeInViewport();
    } else {
      await expect(mobileReportSubmit).toBeHidden();
    }
    await page.locator(`[id="ally-${ally.id}"]`).getByRole("button", { name: "Edit Ally: Cheyenne" }).click();
    await page.getByRole("dialog", { name: "Edit Cheyenne" }).getByRole("link", { name: "Edit birth details" }).click();
    await expect(page).toHaveURL(new RegExp(`/allies\\?chart=${allyChart.id}&start=birth_details`));
    const birthEditPanel = page.locator('section[aria-label="Ally birth data onboarding"]');
    await expect(birthEditPanel.getByText("Step 1 of 2: Birth details")).toBeVisible();
    await expect(birthEditPanel.getByLabel("Edit birth details")).toBeEnabled();
    await expect(birthEditPanel.getByLabel("Edit birth location")).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    const tone = synastryToneSnapshot({ allyId: ally.id, relationship: "Lover" });
    const headings = synastryV3Headings(tone, "Cheyenne");
    const requestId = randomUUID();
    const request = await createAstrologyReportRequest(db, {
      id: requestId,
      userId,
      reportType: "synastry",
      subjectName: "V3 Reader",
      birthData: { date: "1961-05-23", time: "09:30", timezone: "America/New_York", location: "New York, NY, USA", latitude: 40.7128, longitude: -74.006 },
      context: { subject: { subjectType: "self", displayName: "V3 Reader" }, synastryTone: tone },
      source: "self"
    });
    await recordAstrologyReportResult(db, {
      requestId,
      userId,
      engine: "local-chart-routine",
      engineVersion: "v3-browser-fixture",
      status: "completed",
      summary: "A feeling-first relationship portrait.",
      sections: headings.map((title, index) => ({
        id: `${requestId}:section:${index + 1}`,
        title,
        body: `A distinct feeling opens here. Cheyenne remains independently present, and the relationship between you develops its own consequence in chapter ${index + 1}.`,
        emphasis: index === 0 ? "primary" : "supporting"
      })),
      provenance: [{ id: `${requestId}:private`, kind: "engine", label: "Private engine note", summary: "Private provenance must not be shared.", boundary: "private" }],
      publicSignal: {
        reportId: `${requestId}:signal`, requestId, reportType: "synastry", headline: "V3 Reader + Cheyenne", summary: "A feeling-first relationship portrait.", tone: "grounded", boundary: "public_signal", provenanceSummary: "Feeling-first portrait."
      },
      generationMetadata: {
        writer: "debug-model-writer", promptVersion: ASTRA_SYNASTRY_V3_PROMPT_VERSION, attemptCount: 1, orchestration: "synastry-v3",
        reviewNotes: [{ code: "unsupported_claim", message: "INTERNAL_REVIEW_NOTE" }],
        synastryV3: {
          schemaVersion: 2,
          sourceReportIds: [],
          tone,
          evidenceIndex: [{ id: "S01", label: "PRIVATE_TECHNICAL_EVIDENCE", meaning: "Exact private evidence meaning", evidenceJobs: ["Attraction"] }],
          chapterTrace: headings.map((chapter) => ({
            chapter,
            paragraphIndex: 1,
            evidenceIds: ["S01"],
            mechanism: "A private evidence-grounded mechanism.",
            livedExpression: "A conditional possible experience.",
            relationalConsequence: "A possible relational consequence.",
            supportedFeeling: "a distinct feeling"
          })),
          validation: { wordCount: 1500, acceptedWordRange: { minimum: 1350, maximum: 1650 }, boundaryViolations: [], fatalCategories: [], reviewNotes: ["PRIVATE_V3_REVIEW_NOTE"], greenLight: true },
          semanticSupport: { supportedClaims: ["a distinct feeling"], unsupportedClaims: [], severity: "none", latencyMs: 1 }
        }
      }
    });
    const share = await createAstrologyReportShare(db, { requestId: request.id, userId, baseUrl: "http://localhost:3011" });
    if (!share) throw new Error("Could not create browser share fixture.");

    await page.goto(`/library?reportId=${requestId}`);
    await expect(page.getByRole("heading", { name: "V3 Reader — Synastry Report" })).toBeVisible();
    await expect(page.locator("details.reportMarkdownEvidence")).toHaveCount(6);
    await page.locator("details.reportMarkdownEvidence").first().getByText("Chart Evidence").click();
    await expect(page.getByText(/S01 · PRIVATE_TECHNICAL_EVIDENCE/).first()).toBeVisible();
    await expect(page.getByText("PRIVATE_V3_REVIEW_NOTE")).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.context().clearCookies();
    await page.goto(share.shareUrl);
    await expect(page.getByRole("heading", { name: "V3 Reader — Synastry Report" })).toBeVisible();
    await expect(page.locator("details.reportMarkdownEvidence")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/S01|PRIVATE_TECHNICAL_EVIDENCE|PRIVATE_V3_REVIEW_NOTE|INTERNAL_REVIEW_NOTE/);
    const response = await page.request.get(share.shareUrl);
    const html = await response.text();
    expect(html).not.toMatch(/S01|PRIVATE_TECHNICAL_EVIDENCE|PRIVATE_V3_REVIEW_NOTE|INTERNAL_REVIEW_NOTE|Private provenance/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
});
