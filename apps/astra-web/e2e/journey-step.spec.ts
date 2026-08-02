import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  appUserProfiles,
  artifacts,
  astrologyReportRequests,
  astrologyReportResults,
  creditLedgerEntries,
  createUserFeedItem,
  db,
  listUserFeedItems,
  userFeedItems
} from "@astra/db";
import { eq } from "drizzle-orm";
import { createAuthenticatedContext } from "./support/auth-session";

async function seedStep(userId: string, input: { rank: number; title: string; kind?: "artifact" | "manual" | "report_signal" }) {
  return createUserFeedItem(db, {
    id: `playwright_journey:${randomUUID()}`,
    userId,
    feedKind: input.kind ?? "manual",
    title: input.title,
    body: `${input.title} body copy for Journey lifecycle verification.`,
    displayPayload: input.kind === "artifact"
      ? { subtitle: "A completed private report", ctaLabel: "Open report", publicSignal: { reportId: randomUUID(), requestId: randomUUID() } }
      : { subtitle: "Private Journey guidance" },
    rankScore: input.rank,
    reasonCode: input.kind === "report_signal" || input.kind === "artifact"
      ? "explicit_report_signal_publish"
      : "playwright_journey_lifecycle",
    state: "available",
    availableAt: new Date().toISOString()
  });
}

test("JourneyStep is private, durable, recoverable, and responsive @auth @journey @report @responsive @release", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The lifecycle test performs its own desktop, tablet, and mobile viewport sweep.");

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const emailA = `journey-a-${suffix}@example.com`;
  const emailB = `journey-b-${suffix}@example.com`;
  const emailC = `journey-customer-${suffix}@example.com`;
  const adminEmail = `journey-admin-${suffix}@example.com`;
  const authA = await createAuthenticatedContext(browser, { email: emailA, name: emailA });
  const authB = await createAuthenticatedContext(browser, { email: emailB, name: emailB });
  const authC = await createAuthenticatedContext(browser, { email: emailC, name: emailC });
  const authAdmin = await createAuthenticatedContext(browser, { email: adminEmail, name: adminEmail });
  const { context: contextA, page: pageA, userId: userA } = authA;
  const { context: contextB, page: pageB, userId: userB } = authB;
  const { context: contextC, page: pageC, userId: userC } = authC;
  const { context: adminContext, page: adminPage, userId: adminUserId } = authAdmin;
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  for (const page of [pageA, pageB, pageC, adminPage]) {
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
  }
  await db.update(appUserProfiles).set({ onboardingStatus: "complete", updatedAt: new Date() }).where(eq(appUserProfiles.userId, userA));
  await db.update(appUserProfiles).set({ onboardingStatus: "complete", updatedAt: new Date() }).where(eq(appUserProfiles.userId, userB));
  await db.update(appUserProfiles).set({ onboardingStatus: "complete", updatedAt: new Date() }).where(eq(appUserProfiles.userId, userC));
  await db.update(appUserProfiles).set({ role: "admin", onboardingStatus: "complete", updatedAt: new Date() }).where(eq(appUserProfiles.userId, adminUserId));
  const currentStep = await seedStep(userA, { rank: 600, title: "A private current step", kind: "artifact" });
  const orphanSignal = await seedStep(userA, { rank: 550, title: "Obsolete imported report signal", kind: "report_signal" });
  await seedStep(userA, { rank: 500, title: "A private next step" });
  await seedStep(userA, { rank: 400, title: "A private third step" });
  await seedStep(userA, { rank: 300, title: "A private fourth step" });
  await seedStep(userA, { rank: 200, title: "A private fifth step" });
  await seedStep(userA, { rank: 100, title: "A private sixth step" });
  const userBOnly = await seedStep(userB, { rank: 400, title: "B private step" });

  await pageA.goto("/journey");
  const card = pageA.locator("article.astraPublishedCard");
  await expect(card).toHaveCount(1);
  await expect(card.locator(".astraPublishedCardEyebrow")).toHaveText("Current step");
  await expect(card.locator(".astraPublishedCardMedia")).toHaveCount(0);
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("A private current step");
  await expect(pageA.getByText("B private step")).toHaveCount(0);
  await expect(pageA.getByRole("link", { name: "Open report" })).toHaveAttribute("href", /\/library\?reportId=/);
  await expect(pageA.getByText("Obsolete imported report signal")).toHaveCount(0);
  const [repairedSignal] = await db.select({ state: userFeedItems.state }).from(userFeedItems).where(eq(userFeedItems.id, orphanSignal.id)).limit(1);
  expect(repairedSignal?.state).toBe("seen");
  await expect(pageA.getByRole("complementary", { name: "Upcoming Journey steps" }).getByRole("listitem")).toHaveCount(3);
  await expect(pageA.getByText("5 steps")).toBeVisible();
  await expect(pageA.getByText("2 more steps are held in your private queue.")).toBeVisible();
  await pageA.getByText("Why this now?").click();
  await expect(pageA.getByText("This recent report is ready in your private Library. Journey is bringing it forward once so you can decide what comes next.")).toBeVisible();

  const forged = await pageA.request.patch(`/api/journey/items/${encodeURIComponent(userBOnly.id)}`, { data: { action: "dismiss" } });
  expect(forged.status()).toBe(404);

  const [reportsBeforeArchive, artifactsBeforeArchive, creditsBeforeArchive] = await Promise.all([
    db.select({ id: astrologyReportRequests.id }).from(astrologyReportRequests).where(eq(astrologyReportRequests.userId, userA)),
    db.select({ id: artifacts.id }).from(artifacts).where(eq(artifacts.userId, userA)),
    db.select({ id: creditLedgerEntries.id }).from(creditLedgerEntries).where(eq(creditLedgerEntries.userId, userA))
  ]);
  await pageA.getByRole("button", { name: "Archive" }).click();
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("A private next step");
  await expect(pageA.getByText("Step archived.")).toBeVisible();
  const undoArchiveResponse = pageA.waitForResponse((response) => response.request().method() === "PATCH"
    && new URL(response.url()).pathname.includes(`/api/journey/items/${encodeURIComponent(currentStep.id)}`)
    && Boolean(response.request().postData()?.includes('"restore"')));
  await pageA.getByRole("button", { name: "Undo" }).click();
  expect((await undoArchiveResponse).ok()).toBe(true);
  await pageA.reload();
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("A private current step");

  await pageA.getByRole("button", { name: "OK" }).click();
  await expect(pageA.getByText("Noted. It will make room when something newer arrives.")).toBeVisible();
  await expect(pageA.getByRole("button", { name: "Noted" })).toBeDisabled();
  await expect(pageA.getByText("This stays current until newer guidance arrives.")).toBeVisible();
  const [acknowledged] = await db.select({ state: userFeedItems.state, displayPayload: userFeedItems.displayPayload }).from(userFeedItems).where(eq(userFeedItems.id, (await listUserFeedItems(db, { userId: userA, state: "available", limit: 20 })).items.find((item) => item.title === "A private current step")!.id)).limit(1);
  expect(acknowledged?.state).toBe("available");
  expect((acknowledged?.displayPayload as Record<string, unknown> | undefined)?.acknowledgedAt).toEqual(expect.any(String));

  await new Promise((resolve) => setTimeout(resolve, 10));
  const newerGuidance = await seedStep(userA, { rank: 25, title: "Newer private guidance" });
  await pageA.reload();
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("Newer private guidance");

  await pageA.getByRole("button", { name: "Archive" }).click();
  const repeatedArchive = await pageA.request.patch(`/api/journey/items/${encodeURIComponent(newerGuidance.id)}`, { data: { action: "archive" } });
  expect(repeatedArchive.status()).toBe(200);
  await pageA.goto("/library");
  const archive = pageA.getByLabel("Journey Archive");
  await expect(archive).toBeVisible();
  await expect(archive.getByText("Newer private guidance")).toBeVisible();
  await expect(archive.getByText("B private step")).toHaveCount(0);
  const [reportsAfterArchive, artifactsAfterArchive, creditsAfterArchive] = await Promise.all([
    db.select({ id: astrologyReportRequests.id }).from(astrologyReportRequests).where(eq(astrologyReportRequests.userId, userA)),
    db.select({ id: artifacts.id }).from(artifacts).where(eq(artifacts.userId, userA)),
    db.select({ id: creditLedgerEntries.id }).from(creditLedgerEntries).where(eq(creditLedgerEntries.userId, userA))
  ]);
  expect(reportsAfterArchive).toEqual(reportsBeforeArchive);
  expect(artifactsAfterArchive).toEqual(artifactsBeforeArchive);
  expect(creditsAfterArchive).toEqual(creditsBeforeArchive);
  await archive.getByRole("button", { name: "Return to Journey" }).click();
  await expect(pageA.getByLabel("Journey Archive")).toHaveCount(0);
  await pageA.goto("/journey");
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("Newer private guidance");

  const currentActionUrl = "**/api/journey/items/**";
  await pageA.route(currentActionUrl, (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "TEST_FAILURE" }) }));
  await pageA.getByRole("button", { name: "OK" }).click();
  await expect(pageA.locator(".form-error[role=alert]")).toHaveText("Astra could not save that change. Please try again.");
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("Newer private guidance");
  await pageA.unroute(currentActionUrl);

  for (const viewport of [{ width: 820, height: 1180 }, { width: 390, height: 844 }]) {
    await pageA.setViewportSize(viewport);
    await pageA.reload();
    await expect(card).toBeVisible();
    expect(await pageA.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }

  await pageB.goto("/journey");
  await expect(pageB.locator("article.astraPublishedCard .astraPublishedCardTitle")).toHaveText("B private step");
  await expect(pageB.getByText("A private current step")).toHaveCount(0);
  const legacyComplete = await pageB.request.patch(`/api/journey/items/${encodeURIComponent(userBOnly.id)}`, { data: { action: "complete" } });
  expect(legacyComplete.status()).toBe(200);
  await pageB.reload();
  await expect(pageB.getByRole("heading", { name: "Your Journey is clear" })).toBeVisible();
  await expect(pageB.getByRole("link", { name: "Begin with your Self" })).toHaveAttribute("href", "/self");

  const customerReports = Array.from({ length: 5 }, (_, index) => {
    const requestId = randomUUID();
    const reportType = ["identity", "core", "deep", "progressed", "synastry"][index];
    const subjectName = `Customer Subject ${index + 1}`;
    const createdAt = new Date(Date.now() - index * 60_000);
    return { requestId, reportType, subjectName, createdAt };
  });
  await db.insert(astrologyReportRequests).values(customerReports.map((report) => ({
    id: report.requestId,
    userId: userC,
    reportType: report.reportType,
    subjectName: report.subjectName,
    birthData: { date: "1990-01-01" },
    source: "self",
    boundary: "private",
    status: "completed",
    costCredits: 0,
    createdAt: report.createdAt,
    updatedAt: report.createdAt
  })));
  await db.insert(astrologyReportResults).values(customerReports.map((report) => ({
    id: randomUUID(),
    requestId: report.requestId,
    userId: userC,
    engine: "journey-customer-fixture",
    engineVersion: "1",
    status: "completed",
    summary: `${report.subjectName} private report summary.`,
    sections: [],
    provenance: [],
    publicSignal: {
      reportId: report.requestId,
      requestId: report.requestId,
      reportType: report.reportType,
      headline: `${report.subjectName} — Report`,
      summary: `${report.subjectName} has a recent private report ready in Library.`,
      tone: "grounded",
      boundary: "public_signal",
      provenanceSummary: "debug-model-writer must remain internal"
    },
    createdAt: report.createdAt
  })));

  await pageC.goto("/journey");
  await expect(pageC.locator("article.astraPublishedCard")).toHaveCount(1);
  await expect(pageC.getByRole("complementary", { name: "Upcoming Journey steps" }).getByRole("listitem")).toHaveCount(2);
  await expect(pageC.getByText("debug-model-writer must remain internal")).toHaveCount(0);
  const customerJourney = await listUserFeedItems(db, { userId: userC, state: "available", limit: 20 });
  expect(customerJourney.items.filter((item) => item.feedKind === "report_signal")).toHaveLength(3);

  await pageC.goto("/library");
  await expect(pageC.locator(".library-report-card")).toHaveCount(5);
  for (const report of customerReports) {
    await expect(pageC.getByRole("heading", { name: report.subjectName })).toBeVisible();
  }
  const persistedCustomerResults = await db.select({ id: astrologyReportResults.id }).from(astrologyReportResults).where(eq(astrologyReportResults.userId, userC));
  expect(persistedCustomerResults).toHaveLength(5);

  const adminReports = Array.from({ length: 15 }, (_, index) => {
    const requestId = randomUUID();
    const createdAt = new Date(Date.now() - index * 60_000);
    return { requestId, subjectName: `Admin Throwaway ${index + 1}`, createdAt };
  });
  await db.insert(astrologyReportRequests).values(adminReports.map((report) => ({
    id: report.requestId,
    userId: adminUserId,
    reportType: "identity",
    subjectName: report.subjectName,
    birthData: { date: "1990-01-01" },
    source: "self",
    boundary: "private",
    status: "completed",
    costCredits: 0,
    createdAt: report.createdAt,
    updatedAt: report.createdAt
  })));
  await db.insert(astrologyReportResults).values(adminReports.map((report) => ({
    id: randomUUID(),
    requestId: report.requestId,
    userId: adminUserId,
    engine: "journey-admin-fixture",
    engineVersion: "1",
    status: "completed",
    summary: `${report.subjectName} private report summary.`,
    sections: [],
    provenance: [],
    publicSignal: {
      reportId: report.requestId,
      requestId: report.requestId,
      reportType: "identity",
      headline: `${report.subjectName} — Report`,
      summary: `${report.subjectName} has a recent private report ready in Library.`,
      tone: "grounded",
      boundary: "public_signal",
      provenanceSummary: "admin test output"
    },
    createdAt: report.createdAt
  })));

  await adminPage.goto("/journey");
  await expect(adminPage.getByRole("heading", { name: "Your Journey is clear" })).toBeVisible();
  const adminJourney = await listUserFeedItems(db, { userId: adminUserId, state: "available", limit: 20 });
  expect(adminJourney.items.filter((item) => item.feedKind === "report_signal")).toHaveLength(0);

  await adminPage.goto("/library");
  await expect(adminPage.locator(".library-report-card")).toHaveCount(15);
  const persistedAdminResults = await db.select({ id: astrologyReportResults.id }).from(astrologyReportResults).where(eq(astrologyReportResults.userId, adminUserId));
  expect(persistedAdminResults).toHaveLength(15);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  await Promise.all([contextA.close(), contextB.close(), contextC.close(), adminContext.close()]);
});
