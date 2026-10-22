import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createAlly, createAstrologyReportRequest, createChartMakerRequest, creditLedgerEntries, db, recordAstrologyReportResult, recordChartMakerResult } from "@astra/db";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import { eq, sql } from "drizzle-orm";
import { signInWithTestSession } from "./support/auth-session";

const birthData = {
  date: "1961-05-23",
  time: "09:30",
  timezone: "America/New_York",
  location: "New York, NY, USA",
  latitude: 40.7128,
  longitude: -74.006
};

async function makeChart(userId: string, name: string, input: { allyId?: string; unknownTime?: boolean } = {}) {
  const subject = input.allyId
    ? { subjectType: "ally", subjectId: input.allyId, allyId: input.allyId, displayName: name }
    : { subjectType: "self", displayName: name };
  const request = await createChartMakerRequest(db, {
    userId,
    subjectName: name,
    birthData: input.unknownTime ? { ...birthData, time: undefined, birthTimeKnown: false } : birthData,
    intent: "playwright-report-entry-qa",
    context: {
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      subject
    },
    source: input.allyId ? "ally" : "self"
  });
  await recordChartMakerResult(db, buildChartMakerRecordResult(request));
  return request;
}

async function makeAlly(userId: string, name: string, options: { withChart?: boolean; withReport?: boolean } = {}) {
  const ally = await createAlly(db, { userId, name, kind: "person", relationship: "Friend" });
  const chart = options.withChart ? await makeChart(userId, name, { allyId: ally.id }) : undefined;
  if (options.withReport && chart) {
    const request = await createAstrologyReportRequest(db, {
      id: randomUUID(),
      userId,
      chartRequestId: chart.id,
      reportType: "core",
      subjectName: name,
      birthData,
      intent: "playwright-prior-report-fixture",
      context: { subject: { subjectType: "ally", subjectId: ally.id, allyId: ally.id, displayName: name } },
      source: "ally"
    });
    await recordAstrologyReportResult(db, {
      requestId: request.id,
      userId,
      engine: "playwright-fixture",
      engineVersion: "1",
      status: "completed",
      summary: "Saved QA report fixture.",
      sections: [],
      provenance: []
    });
  }
  return { ally, chart };
}

function guardReportGeneration(page: Page) {
  const reportPosts: string[] = [];
  const reportPostBodies: unknown[] = [];
  const generationAttempts: string[] = [];
  page.route("**/api/reports/**/generate", async (route) => {
    generationAttempts.push(route.request().url());
    await route.abort("blockedbyclient");
  });
  page.route("**/api/reports", async (route) => {
    if (route.request().method() === "POST") {
      reportPosts.push(route.request().url());
      reportPostBodies.push(route.request().postDataJSON());
      await route.fulfill({ status: 599, contentType: "application/json", body: JSON.stringify({ error: "Blocked by report-entry E2E" }) });
      return;
    }
    await route.continue();
  });
  return { reportPosts, reportPostBodies, generationAttempts };
}

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }));
  expect(widths.body, "body should fit the viewport").toBeLessThanOrEqual(widths.viewport + 1);
  expect(widths.document, "document should fit the viewport").toBeLessThanOrEqual(widths.viewport + 1);
}

async function expectNoGenerationOrSpend(userId: string, beforeLedgerTotal: number, guard: ReturnType<typeof guardReportGeneration>, expectedBlockedPosts = 0) {
  expect(guard.reportPosts).toHaveLength(expectedBlockedPosts);
  expect(guard.generationAttempts).toEqual([]);
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${creditLedgerEntries.amount}), 0)::integer` })
    .from(creditLedgerEntries)
    .where(eq(creditLedgerEntries.userId, userId));
  expect(Number(row?.total ?? 0)).toBe(beforeLedgerTotal);
}

test.describe("report entry points", () => {
  test("Self Create report from the same chart leaves report choices active @auth @report @responsive", async ({ page }, testInfo) => {
    const name = `Report Entry Self ${testInfo.project.name}`;
    const email = `report-entry-self-${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const userId = await signInWithTestSession(page, { email, name });
    const chart = await makeChart(userId, name);
    const guard = guardReportGeneration(page);
    const [initialLedger] = await db
      .select({ total: sql<number>`coalesce(sum(${creditLedgerEntries.amount}), 0)::integer` })
      .from(creditLedgerEntries)
      .where(eq(creditLedgerEntries.userId, userId));

    await page.goto(`/self?chart=${encodeURIComponent(chart.id)}&start=birth_details#self-birth-onboarding`);
    await expect(page.locator('section[aria-label="Birth data onboarding"]')).toBeVisible();
    await page.getByRole("link", { name: "Create report", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`chart=${encodeURIComponent(chart.id)}&start=report`));
    const panel = page.locator('section[aria-label="Birth data onboarding"]');
    await expect(panel.getByRole("radio", { name: /Personal/ })).toBeVisible();
    await expect(panel.getByRole("radio", { name: /Relationship/ })).toBeVisible();
    await expect(panel.getByRole("radio", { name: /Life Chapter/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoGenerationOrSpend(userId, Number(initialLedger?.total ?? 0), guard);
  });

  test("every Ally has a labeled Create report action and selected missing-chart Ally stays attached @auth @report @responsive", async ({ page }, testInfo) => {
    const name = `Report Entry Ally Keeper ${testInfo.project.name}`;
    const email = `report-entry-allies-${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const userId = await signInWithTestSession(page, { email, name });
    const withReport = await makeAlly(userId, `Prior Report Ally ${testInfo.project.name}`, { withChart: true, withReport: true });
    const withoutReport = await makeAlly(userId, `No Report Ally ${testInfo.project.name}`, { withChart: true });
    const withoutChart = await makeAlly(userId, `No Chart Ally ${testInfo.project.name}`);
    const guard = guardReportGeneration(page);
    let expectedBlockedPosts = 0;
    const [initialLedger] = await db
      .select({ total: sql<number>`coalesce(sum(${creditLedgerEntries.amount}), 0)::integer` })
      .from(creditLedgerEntries)
      .where(eq(creditLedgerEntries.userId, userId));

    await page.goto("/allies");
    for (const allyName of [
      `Prior Report Ally ${testInfo.project.name}`,
      `No Report Ally ${testInfo.project.name}`,
      `No Chart Ally ${testInfo.project.name}`
    ]) {
      const card = page.locator("article.ally-card").filter({ hasText: allyName });
      await expect(card.getByRole("link", { name: "Create report", exact: true })).toBeVisible();
    }
    const priorReportCard = page.locator("article.ally-card").filter({ hasText: `Prior Report Ally ${testInfo.project.name}` });
    await expect(priorReportCard.getByRole("link", { name: "View report" })).toBeVisible();
    await expect(page.locator("article.ally-card").filter({ hasText: `No Report Ally ${testInfo.project.name}` }).getByRole("link", { name: "View report" })).toHaveCount(0);

    const missingChartCard = page.locator("article.ally-card").filter({ hasText: `No Chart Ally ${testInfo.project.name}` });
    await missingChartCard.getByRole("link", { name: "Create report", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/allies\\?ally=${encodeURIComponent(withoutChart.ally.id)}&start=report`));
    const panel = page.locator('section[aria-label="Create an Ally Report"]');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(`No Chart Ally ${testInfo.project.name}`);
    await expect(panel.getByText("Step 1 of 2: Birth details")).toBeVisible();
    await expect(panel.getByRole("heading", { name: `Create a Report for No Chart Ally ${testInfo.project.name}` })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`[?&]ally=${encodeURIComponent(withoutChart.ally.id)}(?:&|$)`));

    if (testInfo.project.name === "desktop") {
      await panel.getByLabel("Edit birth details").click();
      const birthDialog = page.getByRole("dialog", { name: "Birth Details" });
      await birthDialog.getByLabel("Birth year").fill("1961");
      await birthDialog.getByLabel("Birth month").selectOption({ label: "May" });
      await birthDialog.getByLabel("Birth day").selectOption("23");
      await birthDialog.locator('input[type="checkbox"]').check();
      await birthDialog.getByRole("button", { name: "Continue" }).first().click();
      await expect(birthDialog).toHaveCount(0);
      await panel.getByRole("button", { name: "Next", exact: true }).click();
      await expect(panel.getByRole("radio", { name: /Personal/ })).toBeVisible();

      await panel.getByRole("button", { name: "Create report", exact: true }).click();
      const confirmation = page.getByRole("dialog", { name: "Confirm Report" });
      await expect(confirmation.getByLabel("Review report order")).toContainText(`No Chart Ally ${testInfo.project.name}`);
      await expect(confirmation.getByLabel("Review report order")).toContainText("Cost");
      await expect(confirmation.getByLabel("Review report order")).toContainText("Stars");
      await expect(confirmation).toContainText("Current balance");
      await expect(confirmation.getByRole("button", { name: "Create portrait", exact: true })).toBeVisible();
      await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(confirmation).toHaveCount(0);
      expect(guard.reportPosts).toEqual([]);
      expect(guard.generationAttempts).toEqual([]);

      const chartBodies: Array<{ context?: { subject?: { allyId?: string; subjectId?: string } } }> = [];
      const allyPosts: string[] = [];
      await page.route("**/api/chart-requests", async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        chartBodies.push(route.request().postDataJSON());
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ request: { id: "controlled-chart-request" } }) });
      });
      await page.route("**/api/allies", async (route) => {
        if (route.request().method() === "POST") {
          allyPosts.push(route.request().url());
          await route.abort("blockedbyclient");
          return;
        }
        await route.continue();
      });

      await panel.getByRole("button", { name: "Create report", exact: true }).click();
      const confirmedOrder = page.getByRole("dialog", { name: "Confirm Report" });
      const blockedReportResponse = page.waitForResponse((response) =>
        new URL(response.url()).pathname === "/api/reports" && response.request().method() === "POST" && response.status() === 599
      );
      await confirmedOrder.getByRole("button", { name: "Create portrait", exact: true }).click();
      await blockedReportResponse;
      expect(chartBodies).toHaveLength(1);
      expect(chartBodies[0].context?.subject?.allyId).toBe(withoutChart.ally.id);
      expect(chartBodies[0].context?.subject?.subjectId).toBe(withoutChart.ally.id);
      expect(allyPosts).toEqual([]);
      expect(guard.reportPosts).toHaveLength(1);
      expectedBlockedPosts = 1;
      expect(guard.reportPostBodies[0]).toMatchObject({ chartRequestId: "controlled-chart-request" });
      expect(guard.generationAttempts).toEqual([]);
    }

    await expectNoHorizontalOverflow(page);

    // Keep fixtures referenced so a missing report/chart state cannot accidentally collapse.
    expect(withReport.chart).toBeTruthy();
    expect(withoutReport.chart).toBeTruthy();
    await expectNoGenerationOrSpend(userId, Number(initialLedger?.total ?? 0), guard, expectedBlockedPosts);
  });

  test("Life Chapter stays blocked for a chart with unknown birth time @auth @report @responsive", async ({ page }, testInfo) => {
    const name = `Unknown Time Report ${testInfo.project.name}`;
    const email = `report-entry-unknown-${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const userId = await signInWithTestSession(page, { email, name });
    const chart = await makeChart(userId, name, { unknownTime: true });
    const guard = guardReportGeneration(page);
    const [initialLedger] = await db
      .select({ total: sql<number>`coalesce(sum(${creditLedgerEntries.amount}), 0)::integer` })
      .from(creditLedgerEntries)
      .where(eq(creditLedgerEntries.userId, userId));

    await page.goto(`/self?chart=${encodeURIComponent(chart.id)}&start=report#self-birth-onboarding`);
    const panel = page.locator('section[aria-label="Birth data onboarding"]');
    await panel.getByRole("radio", { name: /Life Chapter/ }).check();
    await expect(panel.getByRole("button", { name: "Order Report", exact: true })).toBeDisabled();
    await expect(panel.getByText("Add a known birth time before creating a Life Chapter.")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoGenerationOrSpend(userId, Number(initialLedger?.total ?? 0), guard);
  });

  test("signed-out Self and Allies do not expose report creation @responsive", async ({ page }) => {
    const guard = guardReportGeneration(page);
    await page.goto("/self");
    await expect(page.getByRole("link", { name: "Create report", exact: true })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await page.goto("/allies");
    await expect(page.getByRole("link", { name: "Create report", exact: true })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    expect(guard.reportPosts).toEqual([]);
    expect(guard.generationAttempts).toEqual([]);
  });
});
