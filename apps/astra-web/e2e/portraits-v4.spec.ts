import { expect, test, type ConsoleMessage } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createAlly, createAstrologyReportRequest, createAstrologyReportShare, createChartMakerRequest, db, getCreditBalance, listUserAstrologyReportRequests, recordAstrologyReportResult } from "@astra/db";
import { signInWithTestSession } from "./support/auth-session";

function expectedMissingAvatar(message: ConsoleMessage) {
  return /^https:\/\/www\.gravatar\.com\/avatar\//.test(message.location().url) && message.text().includes("404");
}

test("@portraits-v4 three choices, gifted Stars, immutable reader and private support", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", message => { if (message.type() === "error" && !expectedMissingAvatar(message)) errors.push(`[${page.url()}] ${message.text()}`); });
  const failedRequests: Array<{ url: string; failure: string | undefined; type: string; page: string }> = [];
  page.on("requestfailed", request => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText, type: request.resourceType(), page: page.url() }));
  async function visit(url: string) {
    // Let the current route's prefetch finish before forcibly replacing the page.
    await page.waitForLoadState("networkidle");
    await page.goto(url);
    await page.waitForLoadState("networkidle");
  }
  const userId = await signInWithTestSession(page, { email: `v4-${testInfo.project.name}-${randomUUID()}@example.com`, name: "V4 Reader" });
  const birthData = { date: "1990-04-05", time: "09:00", timezone: "America/New_York", location: "New York", latitude: 40.7128, longitude: -74.006, birthTimeKnown: true };
  const self = await createChartMakerRequest(db, { userId, subjectName: "V4 Reader", birthData, source: "self", context: { subject: { subjectType: "self", subjectId: userId, displayName: "V4 Reader" } } });
  const ally = await createAlly(db, { userId, name: "V4 Sibling", kind: "person", relationship: "Sibling" });
  const other = await createChartMakerRequest(db, { userId, subjectName: ally.name, birthData: { ...birthData, date: "1992-08-21" }, source: "ally", context: { subject: { subjectType: "ally", allyId: ally.id, subjectId: ally.id, displayName: ally.name, relationship: "Sibling" } } });
  await visit(`/allies?chart=${other.id}&start=report`);
  const panel = page.locator('section[aria-label="Create an Ally Report"]');
  await expect(panel.getByRole("radio", { name: /Personal/ })).toBeChecked();
  await expect(panel.locator('input[name="reportType"]')).toHaveCount(3);
  await expect(panel.getByRole("radio", { name: /Identity|Core|Deep/ })).toHaveCount(0);
  const settings = panel.locator("details").filter({ has: page.locator("summary", { hasText: "Chart settings" }) });
  await expect(settings).not.toHaveAttribute("open");
  await panel.getByRole("radio", { name: /Relationship/ }).check();
  await panel.getByLabel("Who is this connection with?").selectOption(self.id);
  await expect(panel.getByLabel("Reading perspective")).toBeVisible();
  await panel.getByRole("radio", { name: /Life Chapter/ }).check();
  await expect(panel.getByLabel("As of", { exact: true })).not.toHaveValue("");
  await expect(panel.getByLabel("Who is this connection with?")).toHaveCount(0);
  await panel.getByRole("radio", { name: /Personal/ }).check();
  await panel.getByText("Add a question (optional)", { exact: true }).click();
  await panel.getByLabel("Anything you’d like this reading to explore? (optional)").fill("How can I make room for curiosity?");
  const beforeConfirmation = await getCreditBalance(db, userId);
  await panel.getByRole("button", { name: "Review report", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Confirm Report" });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByText("10 Stars", { exact: true })).toBeVisible();
  await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await getCreditBalance(db, userId)).toBe(beforeConfirmation);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath(`v4-selector-${testInfo.project.name}.png`), fullPage: true });

  const basis = { type: "natal", chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" } };
  const before = await getCreditBalance(db, userId);
  const order = await page.request.post("/api/reports", { data: { chartRequestId: self.id, reportType: "personal", reportBasis: basis, question: "Curiosity" } });
  expect(order.status()).toBe(201);
  const purchased = (await order.json()).request;
  expect(purchased.costCredits).toBe(10);
  expect(purchased.reportBasis.schemaVersion).toBe(2);
  expect(purchased.reportBasis.primary.calculationMode).toBe("full");
  expect(purchased.question).toBe("Curiosity");
  expect(await getCreditBalance(db, userId)).toBe(before - 10);
  const retired = await page.request.post("/api/reports", { data: { chartRequestId: self.id, reportType: "deep", reportBasis: basis } });
  expect(retired.status()).toBe(400);
  expect(await getCreditBalance(db, userId)).toBe(before - 10);
  const relationship = await page.request.post("/api/reports", { data: { chartRequestId: self.id, reportType: "synastry", reportBasis: { ...basis, type: "synastry", partnerChartRequestId: other.id } } });
  expect(relationship.status()).toBe(201);
  expect((await relationship.json()).request.context.synastryTone.normalizedTag).toBe("Sibling");
  const chapter = await page.request.post("/api/reports", { data: { chartRequestId: self.id, reportType: "progressed", reportBasis: { ...basis, type: "progressed", asOfDate: "2026-09-18" } } });
  expect(chapter.status()).toBe(201);
  expect(await getCreditBalance(db, userId)).toBe(before - 25);

  const result = await recordAstrologyReportResult(db, {
    requestId: purchased.id, userId, engine: "local-chart-routine", engineVersion: "v4-browser-fixture", status: "completed", summary: "A reader-first portrait.",
    sections: [{ id: "fixture-one", title: "Room to be yourself", body: "You can be curious without having to turn every possibility into a promise.\n\nThe point is to make enough room for an honest response.", emphasis: "primary" }], provenance: [],
    generationMetadata: { writer: "fixture", promptVersion: "portraits-v4-test", attemptCount: 1, orchestration: "portraits-v4", portraitsV4: { evidence: [{ id: "P01", topic: "Identity", fact: "PRIVATE_V4_FACT", meaning: "PRIVATE_V4_MEANING" }], thread: "PRIVATE_V4_THREAD", trace: [{ title: "Room to be yourself", evidenceIds: ["P01"] }], reviews: [{ accepted: true, issues: [] }] } }
  });
  const reopen = await page.request.post(`/api/reports/${purchased.id}/generate`);
  expect(reopen.status()).toBe(200);
  expect((await reopen.json()).result.id).toBe(result.id);
  expect(await getCreditBalance(db, userId)).toBe(before - 25);
  // A legacy report stays readable and falls under the single Personal filter.
  const legacy = await createAstrologyReportRequest(db, { id: randomUUID(), userId, reportType: "core", subjectName: "Legacy Reader", birthData, source: "self" });
  await recordAstrologyReportResult(db, { requestId: legacy.id, userId, engine: "fixture", engineVersion: "old", status: "completed", summary: "Preserved older reading", sections: [{ id: "legacy", title: "Identity", body: "This saved report is unchanged.", emphasis: "primary" }], provenance: [] });
  await visit("/library?filter=core");
  await expect(page.getByRole("combobox", { name: "Report filters" })).toHaveValue("personal");
  await visit(`/library?reportId=${purchased.id}`);
  await expect(page.getByRole("heading", { name: "V4 Reader — Personal" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Room to be yourself" })).toBeVisible();
  await expect(page.getByText("PRIVATE_V4_THREAD")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath(`v4-reader-${testInfo.project.name}.png`), fullPage: true });
  const share = await createAstrologyReportShare(db, { requestId: purchased.id, userId, baseUrl: testInfo.project.use.baseURL ?? process.env.ASTRA_E2E_BASE_URL ?? "http://localhost:3044" });
  if (!share) throw new Error("Share fixture failed");
  await page.context().clearCookies();
  await visit(share.shareUrl);
  await expect(page.getByRole("heading", { name: "V4 Reader — Personal" })).toBeVisible();
  expect(await (await page.request.get(share.shareUrl)).text()).not.toMatch(/PRIVATE_V4_|P01|evidenceIds/);
  expect((await page.request.post(`/api/reports/${purchased.id}/generate`)).status()).toBe(401);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await testInfo.attach("network-failures", { body: JSON.stringify(failedRequests, null, 2), contentType: "application/json" });
  expect(errors).toEqual([]);
  expect(failedRequests.filter(request => !/cancelled|ERR_ABORTED/.test(request.failure ?? ""))).toEqual([]);
});

test("@portraits-v4 confirmed order can retry a failed writer without another charge", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !expectedMissingAvatar(message)) errors.push(`${message.location().url}: ${message.text()}`); });
  const userId = await signInWithTestSession(page, { email: `v4-retry-${testInfo.project.name}-${randomUUID()}@example.com`, name: "Retry Reader" });
  const birthData = { date: "1990-04-05", time: "09:00", timezone: "America/New_York", location: "New York", latitude: 40.7128, longitude: -74.006, birthTimeKnown: true };
  const chart = await createChartMakerRequest(db, { userId, subjectName: "Retry Reader", birthData, source: "self", context: { subject: { subjectType: "self", subjectId: userId, displayName: "Retry Reader" } } });
  // A first-time account must complete Chart Arrival before paid portraits open.
  expect((await page.request.post("/api/chart-arrivals", { data: { chartRequestId: chart.id } })).status()).toBe(201);
  expect((await page.request.post(`/api/chart-arrivals/${chart.id}/complete`)).status()).toBe(200);
  await page.waitForLoadState("networkidle");
  await page.goto(`/self?chart=${chart.id}&start=report`);
  await page.waitForLoadState("networkidle");
  await page.getByText("Add a question (optional)", { exact: true }).click();
  await page.getByLabel("Anything you’d like this reading to explore? (optional)").fill("A place for curiosity");
  const before = await getCreditBalance(db, userId);
  await page.getByRole("button", { name: "Review report", exact: true }).click();
  const created = page.waitForResponse(response => new URL(response.url()).pathname === "/api/reports" && response.request().method() === "POST");
  await page.getByRole("dialog", { name: "Confirm Report" }).getByRole("button", { name: "Create report · 10 Stars", exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const { request } = await response.json();
  expect(request.question).toBe("A place for curiosity");
  // The isolated QA server has no model key: fail honestly, never serve fallback prose.
  const retry = page.getByRole("button", { name: "Try again · no extra Stars", exact: true });
  await expect(retry).toBeVisible();
  expect(await getCreditBalance(db, userId)).toBe(before - 10);
  const retried = page.waitForResponse(response => new URL(response.url()).pathname === `/api/reports/${request.id}/generate`);
  await retry.click();
  expect((await (await retried).json()).result.status).toBe("failed");
  await expect(retry).toBeVisible();
  await expect(page.getByText("Your request is saved and ready to try again.",{exact:true})).toBeVisible();
  expect(await getCreditBalance(db, userId)).toBe(before - 10);
  expect((await listUserAstrologyReportRequests(db,userId)).filter(item=>item.reportType==="personal")).toHaveLength(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath(`v4-retry-${testInfo.project.name}.png`), fullPage:true });
  expect(errors).toEqual([]);
});
