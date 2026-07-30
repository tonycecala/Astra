import { expect, type BrowserContext, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { appUserProfiles, createUserFeedItem, db, userFeedItems } from "@astra/db";
import { eq } from "drizzle-orm";

type JsonObject = Record<string, unknown>;

function findOtp(value: unknown): string | null {
  if (typeof value === "string") return value.match(/\b\d{6}\b/)?.[0] ?? null;
  if (Array.isArray(value)) return value.map(findOtp).find(Boolean) ?? null;
  if (value && typeof value === "object") return Object.values(value as JsonObject).map(findOtp).find(Boolean) ?? null;
  return null;
}

async function readOtp(email: string) {
  const mailpitUrl = process.env.MAILPIT_API_URL?.trim() || "http://localhost:8025";
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const url = new URL("/api/v1/search", mailpitUrl);
    url.searchParams.set("query", email);
    url.searchParams.set("limit", "10");
    const search = await fetch(url);
    if (!search.ok) throw new Error(`Mailpit search failed with ${search.status}.`);
    const payload = await search.json() as JsonObject;
    const messages = (Array.isArray(payload.messages) ? payload.messages : payload.Messages) as JsonObject[] | undefined;
    for (const summary of messages ?? []) {
      const id = String(summary.ID ?? summary.Id ?? summary.id ?? "");
      if (!id) continue;
      const response = await fetch(new URL(`/api/v1/message/${id}`, mailpitUrl));
      if (!response.ok) continue;
      const otp = findOtp(await response.json());
      if (otp) return otp;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No OTP found for ${email}.`);
}

async function signIn(context: BrowserContext, email: string) {
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("Code").fill(await readOtp(email));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page.locator(".self-profile-name")).toHaveText(email);
  return page;
}

async function userIdFor(email: string) {
  const [profile] = await db.select({ userId: appUserProfiles.userId }).from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
  if (!profile) throw new Error(`Expected profile for ${email}.`);
  return profile.userId;
}

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

test("JourneyStep is private, durable, recoverable, and responsive", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The lifecycle test performs its own desktop, tablet, and mobile viewport sweep.");

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const emailA = `journey-a-${suffix}@example.com`;
  const emailB = `journey-b-${suffix}@example.com`;
  const contextA = await browser.newContext({ baseURL: "http://localhost:3011" });
  const contextB = await browser.newContext({ baseURL: "http://localhost:3011" });
  const pageA = await signIn(contextA, emailA);
  const pageB = await signIn(contextB, emailB);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  for (const page of [pageA, pageB]) {
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
  }
  const userA = await userIdFor(emailA);
  const userB = await userIdFor(emailB);
  await db.update(appUserProfiles).set({ onboardingStatus: "complete", updatedAt: new Date() }).where(eq(appUserProfiles.userId, userA));
  await db.update(appUserProfiles).set({ onboardingStatus: "complete", updatedAt: new Date() }).where(eq(appUserProfiles.userId, userB));
  await seedStep(userA, { rank: 600, title: "A private current step", kind: "artifact" });
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
  await expect(card.locator(".astraPublishedCardMedia")).toBeVisible();
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

  await pageA.getByRole("button", { name: "Save for later" }).click();
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("A private next step");
  await expect(pageA.getByText("A private current step")).toBeVisible();
  await pageA.getByRole("button", { name: "Restore" }).click();
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("A private current step");

  await pageA.getByRole("button", { name: "Dismiss" }).click();
  await expect(pageA.getByText("Step dismissed.")).toBeVisible();
  await pageA.getByRole("button", { name: "Undo" }).click();
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("A private current step");

  const currentActionUrl = "**/api/journey/items/**";
  await pageA.route(currentActionUrl, (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "TEST_FAILURE" }) }));
  await pageA.getByRole("button", { name: "Complete" }).click();
  await expect(pageA.locator(".form-error[role=alert]")).toHaveText("Astra could not save that change. Please try again.");
  await expect(card.locator(".astraPublishedCardTitle")).toHaveText("A private current step");
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
  await pageB.getByRole("button", { name: "Complete" }).click();
  await expect(pageB.getByRole("heading", { name: "Your Journey is clear" })).toBeVisible();
  await expect(pageB.getByRole("button", { name: "Undo" })).toBeVisible();
  await expect(pageB.getByRole("link", { name: "Begin with your Self" })).toHaveAttribute("href", "/self");

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  await Promise.all([contextA.close(), contextB.close()]);
});
