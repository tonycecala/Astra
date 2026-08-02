import { expect, type Page, test } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import { ASTRA_REPORT_WRITER_ENV, LOCAL_DETERMINISTIC_REPORT_WRITER, buildAstrologyReportResultAsync } from "@astra/astrology";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import { appUserProfiles, artifacts, createAlly, createAstrologyReportRequest, createAstrologyReportShare, createChartMakerRequest, creditLedgerEntries, db, listUserAstrologyReportRequests, listUserAstrologyReportResults, listUserChartMakerRequests, listUserFeedItems, mirrorCreditBalanceToProfile, recordAstrologyReportResult, recordChartMakerResult, updateAuthUserProfileDisplayName } from "@astra/db";
import { eq } from "drizzle-orm";
import { signInWithTestSession } from "./support/auth-session";
import { readOtp } from "./support/otp";

type JsonObject = Record<string, unknown>;

function isExpectedNavigationCancellation(message: string) {
  return message.includes("due to access control checks.") ||
    message.includes("ChunkLoadError");
}

const routes = [
  { path: "/", heading: "Astra meets you where you are", mobileHeading: "Journey" },
  { path: "/journey", heading: "Welcome back to Astra", mobileHeading: "Journey" },
  { path: "/allies", heading: "Sign in to create Ally reports", mobileHeading: "Allies" },
  { path: "/self", heading: "Sign in to see your Astra", mobileHeading: "Self" },
  { path: "/charts", heading: "Sign in to see your charts", mobileHeading: "Charts" },
  { path: "/library", heading: "Artifacts worth keeping", mobileHeading: "Library" },
  { path: "/gifts", heading: "Sign in to see Gifts", mobileHeading: "Gifts" },
  { path: "/login", heading: "Welcome back to Astra" }
];

async function chooseUnknownBirthMoment(page: Page, input: { year: string; month: string; day: string }) {
  await page.getByRole("button", { name: "Edit birth details" }).click();
  const dialog = page.getByRole("dialog", { name: "Birth Details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[role="grid"]')).toHaveCount(0);
  await expect(dialog.getByText("Birth moment", { exact: true })).toHaveCount(0);
  await dialog.getByLabel("Birth year").fill(input.year);
  await dialog.getByLabel("Birth month").selectOption({ label: input.month });
  await dialog.getByLabel("Birth day").selectOption(input.day);
  await expect(dialog.getByText("Birth time unknown", { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("Time", { exact: true })).toBeEnabled();
  await dialog.locator('input[type="checkbox"]').check();
  await dialog.getByRole("button", { name: "Continue" }).first().click();
  await expect(dialog).toHaveCount(0);
}

async function makeProfileAdmin(email: string) {
  const [profile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
  if (!profile) throw new Error(`Expected profile for ${email}.`);
  await db.update(appUserProfiles).set({ role: "admin", updatedAt: new Date() }).where(eq(appUserProfiles.userId, profile.userId));
  await db
    .insert(creditLedgerEntries)
    .values({
      amount: 20,
      description: "Playwright admin parity grant",
      eventType: "admin_adjustment",
      idempotencyKey: `playwright_admin_grant:${profile.userId}:${Date.now()}`,
      metadata: { actor: "playwright", reason: "Admin parity browser QA" },
      source: "playwright_e2e",
      userId: profile.userId
    });
  await mirrorCreditBalanceToProfile(db, profile.userId);
}

async function userIdForEmail(email: string) {
  const [profile] = await db.select({ userId: appUserProfiles.userId }).from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
  if (!profile) throw new Error(`Expected profile for ${email}.`);
  return profile.userId;
}

async function createCompletedChart(email: string, input: { name: string }) {
  const [profile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
  if (!profile) throw new Error(`Expected profile for ${email}.`);
  const request = await createChartMakerRequest(db, {
    userId: profile.userId,
    subjectName: input.name,
    birthData: {
      date: "1961-05-23",
      time: "09:30",
      timezone: "America/New_York",
      location: "New York, NY, USA",
      latitude: 40.7128,
      longitude: -74.006
    },
    intent: "playwright-chart-home-qa",
    context: {
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      subject: { subjectType: "self", displayName: input.name }
    },
    source: "self"
  });
  const result = await recordChartMakerResult(db, buildChartMakerRecordResult(request));
  return { request, result };
}

async function createCompletedAllyChart(email: string, input: { name: string; relationship: string }) {
  const [profile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
  if (!profile) throw new Error(`Expected profile for ${email}.`);
  const ally = await createAlly(db, {
    userId: profile.userId,
    name: input.name,
    kind: "person",
    relationship: input.relationship
  });
  const request = await createChartMakerRequest(db, {
    userId: profile.userId,
    subjectName: input.name,
    birthData: {
      date: "2021-12-23",
      time: "01:50",
      timezone: "America/Chicago",
      location: "Plano, TX"
    },
    intent: "playwright-existing-ally-order-qa",
    context: {
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      subject: { subjectType: "ally", subjectId: ally.id, allyId: ally.id, displayName: input.name, relationship: input.relationship }
    },
    source: "ally"
  });
  const result = await recordChartMakerResult(db, buildChartMakerRecordResult(request));
  return { ally, request, result };
}

async function createCompletedReport(email: string, input: {
  chartRequestId?: string;
  name: string;
  reportType?: "core" | "deep" | "identity";
  chartSettings?: {
    zodiacMode: "tropical" | "sidereal";
    houseSystem: "whole-sign" | "placidus";
  };
  includeLegacyWriterCopy?: boolean;
  legacyWelcome?: boolean;
}) {
  const [profile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
  if (!profile) throw new Error(`Expected profile for ${email}.`);
  const chartSettings = input.chartSettings ?? { zodiacMode: "tropical" as const, houseSystem: "whole-sign" as const };
  const request = await createAstrologyReportRequest(db, {
    id: randomUUID(),
    userId: profile.userId,
    chartRequestId: input.chartRequestId,
    reportType: input.reportType ?? "core",
    subjectName: input.name,
    birthData: {
      date: "1961-05-23",
      time: "09:30",
      timezone: "America/New_York",
      location: "New York, NY, USA",
      latitude: 40.7128,
      longitude: -74.006
    },
    intent: "playwright-library-filter-qa",
    context: {
      chartSettings,
      subject: { subjectType: "self", displayName: input.name },
      ...(input.legacyWelcome ? { modelPilot: "gemini-intro-identity" } : {})
    },
    ...(input.chartRequestId
      ? {
          reportBasis: {
            schemaVersion: 1 as const,
            type: "natal" as const,
            chartSettings,
            primary: {
              chartRequestId: input.chartRequestId,
              subjectType: "self" as const,
              subjectId: profile.userId,
              subjectName: input.name,
              birthData: {
                date: "1961-05-23",
                time: "09:30",
                timezone: "America/New_York",
                location: "New York, NY, USA",
                latitude: 40.7128,
                longitude: -74.006
              }
            }
          }
        }
      : {}),
    source: "self"
  });
  const generatedResult = await buildAstrologyReportResultAsync(request, {
      env: {
        ...process.env,
        [ASTRA_REPORT_WRITER_ENV]: LOCAL_DETERMINISTIC_REPORT_WRITER
      }
    });
  const result = await recordAstrologyReportResult(db, input.includeLegacyWriterCopy
    ? {
        ...generatedResult,
        sections: generatedResult.sections.map((section, index) => index === 0
          ? { ...section, body: `${section.body} This draft was produced by local-deterministic-writer without an external model call.` }
          : section)
      }
    : generatedResult);
  return { request, result };
}

function signedStripeHeader(rawBody: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || process.env.STRIPE_WEBHOOK_TEST_SECRET?.trim();
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_TEST_SECRET is required for browser-visible Stripe QA.");
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

async function fulfillCheckoutThroughWebhook(page: Page, input: { checkoutSessionId: string; userId: string }) {
  const event = {
    id: `evt_playwright_${input.checkoutSessionId.replace(/[^a-zA-Z0-9]/g, "_")}`,
    type: "checkout.session.completed",
    data: {
      object: {
        amount_total: 999,
        client_reference_id: input.userId,
        currency: "usd",
        customer: "cus_playwright_admin_parity",
        id: input.checkoutSessionId,
        metadata: {
          astra_user_id: input.userId,
          product_key: "core_pack",
          product_type: "star_pack",
          stars: "5"
        },
        payment_intent: "pi_playwright_admin_parity"
      }
    }
  };
  const rawBody = JSON.stringify(event);
  const response = await page.request.post("/api/stripe/webhook", {
    data: rawBody,
    headers: {
      "content-type": "application/json",
      "stripe-signature": signedStripeHeader(rawBody)
    }
  });
  expect(response.ok()).toBe(true);
  return (await response.json()) as JsonObject;
}

test.describe("clean-start routes", () => {
  for (const route of routes) {
    test(`${route.path} renders without console errors @smoke @release`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (
          message.type() === "error" &&
          !message.text().includes("Failed to load resource: the server responded with a status of 403")
        ) {
          errors.push(message.text());
        }
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto(route.path);
      if (testInfo.project.name === "mobile" && route.mobileHeading) {
        await expect(page.locator(".topbar-route-title")).toHaveText(route.mobileHeading);
      } else {
        await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      }
      expect(
        errors.filter(
          (message) =>
            !message.includes("cannot have a negative time stamp") &&
            !message.includes("due to access control checks.")
        )
      ).toEqual([]);
    });
  }

  test("mobile layout has no document-level horizontal overflow @responsive @release", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test("active navigation is visible on desktop and mobile @smoke @responsive @release", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/self");
    const desktopSelf = page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Self" });
    await expect(desktopSelf).toHaveAttribute("aria-current", "page");
    await expect(desktopSelf).toHaveCSS("font-weight", "700");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/library");
    const mobileLibrary = page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Library" });
    await expect(mobileLibrary).toHaveAttribute("aria-current", "page");
    await expect(mobileLibrary).toHaveCSS("font-weight", "700");
  });

  test("adding an Ally creates the private chart without ordering a report @auth @journey @responsive", async ({ page }, testInfo) => {
    const email = `add-ally-${testInfo.project.name}-${Date.now()}@example.com`;
    const userId = await signInWithTestSession(page, { email, name: "Ally Keeper" });
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:") && !isExpectedNavigationCancellation(message.text())) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => { if (!isExpectedNavigationCancellation(error.message)) browserErrors.push(error.message); });

    await page.goto("/allies");
    await expect(page.getByRole("heading", { name: "Add an Ally" })).toHaveCount(0);
    const addAllyAction = page.getByRole("link", { name: "Add an Ally" }).first();
    const addAllyActionStyles = await addAllyAction.evaluate((element) => {
      const probe = document.createElement("span");
      probe.style.color = getComputedStyle(document.documentElement).getPropertyValue("--gold");
      document.body.append(probe);
      const gold = getComputedStyle(probe).color;
      probe.remove();
      const styles = getComputedStyle(element);
      return { background: styles.backgroundColor, gold, paddingLeft: Number.parseFloat(styles.paddingLeft), paddingRight: Number.parseFloat(styles.paddingRight) };
    });
    expect(addAllyActionStyles.background).toBe(addAllyActionStyles.gold);
    expect(addAllyActionStyles.paddingLeft).toBeGreaterThanOrEqual(20);
    expect(addAllyActionStyles.paddingRight).toBeGreaterThanOrEqual(20);
    await addAllyAction.click();
    const panel = page.locator('section[aria-label="Add an Ally"]');
    await expect(panel.getByRole("heading", { name: "Add an Ally" })).toBeVisible();
    await panel.getByLabel("Ally name").fill("Rowan Test Ally");
    await panel.getByLabel("Relationship").selectOption("Friend");
    await panel.getByRole("button", { name: "Next", exact: true }).click();
    await chooseUnknownBirthMoment(page, { year: "1988", month: "October", day: "12" });
    await panel.getByRole("button", { name: "Add Ally", exact: true }).click();

    await expect(page).toHaveURL(/\/allies$/);
    const card = page.locator("article.ally-card").filter({ hasText: "Rowan Test Ally" });
    await expect(page.getByRole("heading", { name: "Rowan Test Ally" })).toBeVisible();
    await expect(card.getByRole("link", { name: "View chart" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add an Ally" })).toHaveCount(0);
    expect(await listUserAstrologyReportRequests(db, userId)).toHaveLength(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(browserErrors).toEqual([]);
  });

  test("an Ally chart stays in Allies and renders one focused chart @auth @journey @responsive", async ({ page }, testInfo) => {
    const email = `ally-chart-detail-${testInfo.project.name}-${Date.now()}@example.com`;
    await signInWithTestSession(page, { email, name: "Chart Keeper" });
    const completed = await createCompletedAllyChart(email, { name: "Focused Ally", relationship: "Friend" });

    await page.goto("/allies");
    await page.locator(`[id="ally-${completed.ally.id}"]`).getByRole("link", { name: "View chart" }).click();
    await expect(page).toHaveURL(new RegExp(`/charts\\?chart=${completed.request.id}&from=allies`));
    await expect(page.getByRole("link", { name: "Back to Allies" })).toBeVisible();
    await expect(page.getByLabel("Selected chart").getByLabel("Full natal chart wheel")).toBeVisible();
    await expect(page.getByLabel("Saved charts list")).toHaveCount(0);
    const activeNavigation = page.locator('nav[aria-label="Primary navigation"]:visible, nav[aria-label="Mobile navigation"]:visible');
    await expect(activeNavigation.getByRole("link", { name: "Allies" })).toHaveAttribute("aria-current", "page");
    const topbarTitle = page.locator(".topbar-route-title:visible");
    if (await topbarTitle.count()) await expect(topbarTitle).toHaveText("Allies");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test("primary journey reaches adjacent clean-start areas @smoke @journey @release", async ({ page }, testInfo) => {
    await page.goto("/journey");
    await page.waitForLoadState("networkidle");
    await page.locator('a[href="/allies"]:visible').click();
    await expect(page).toHaveURL(/\/allies(?:[?#]|$)/);
    if (testInfo.project.name === "mobile") {
      await expect(page.locator(".topbar-route-title")).toHaveText("Allies");
    } else {
      await expect(page.getByRole("heading", { name: "Sign in to create Ally reports" })).toBeVisible();
    }
    await page.locator('a[href="/self"]:visible').click();
    await expect(page).toHaveURL(/\/self(?:[?#]|$)/);
    if (testInfo.project.name === "mobile") {
      await expect(page.locator(".topbar-route-title")).toHaveText("Self");
    } else {
      await expect(page.getByRole("heading", { name: "Sign in to see your Astra" })).toBeVisible();
    }
  });

  test("public Journey uses the established PublishedCard surface @smoke @journey", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Welcome to Astra" })).toBeVisible();
    const cards = page.getByLabel("Public Journey preview").locator("article.astraPublishedCard");
    await expect(cards).toHaveCount(4);
    const firstCard = cards.first();
    await expect(firstCard.locator(".astraPublishedCardEyebrow")).toBeVisible();
    await expect(firstCard.locator(".astraPublishedCardTitle")).toBeVisible();
    await expect(firstCard.locator(".astraPublishedCardMedia")).toBeVisible();
    await expect(firstCard.locator(".astraPublishedCardImage")).toHaveCount(1);
    const showMore = firstCard.getByRole("button", { name: "Show more" });
    await expect(showMore).toBeVisible();
    await showMore.click();
    await expect(firstCard.getByRole("button", { name: "Show less" })).toBeVisible();
  });

  test("theme toggle switches and persists the Astra theme @responsive", async ({ page }) => {
    await page.goto("/journey");
    await page.waitForLoadState("networkidle");
    await page.locator('button[aria-label="Switch to dark mode"]:visible').click();
    await expect(page.locator("html")).toHaveAttribute("data-astra-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-astra-theme", "dark");
    await page.waitForLoadState("networkidle");
    await page.locator('button[aria-label="Switch to light mode"]:visible').click();
    await expect(page.locator("html")).toHaveAttribute("data-astra-theme", "light");
  });

  test("login surface follows the Astra theme @auth @responsive", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator(".loginShell")).toHaveCSS("background-color", "rgb(238, 232, 220)");
    await expect(page.locator(".loginCard")).toHaveCSS("background-color", "rgba(255, 255, 255, 0.88)");

    await page.getByRole("button", { name: "Switch to dark mode" }).first().click();
    await expect(page.locator(".loginShell")).toHaveCSS("background-color", "rgb(8, 5, 13)");
    await expect(page.locator(".loginCard")).toHaveCSS("background-color", "rgba(8, 13, 24, 0.62)");
  });

  test("login route exposes Better Auth controls @auth @smoke @release", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Authentication panel")).toBeVisible();
    await expect(page.getByLabel("Name")).toHaveCount(0);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Code")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
  });

  test("email OTP completes a real sign-in contract @auth @release", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The real OTP contract runs once; other journeys reuse signed test sessions.");

    const email = `otp-contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByText("Check email for the sign-in code")).toBeVisible();
    await expect(page.locator(".loginStatus-success")).toHaveCSS("color", "rgb(71, 107, 85)");
    await page.getByLabel("Code").fill(await readOtp(email));
    await page.getByRole("button", { name: "Verify code" }).click();
    await expect(page).toHaveURL(/\/self(?:[?#]|$)/);
    await expect(page.locator(".self-profile-name")).toHaveText(email);
  });

  test("first Self chart creates a persisted one-time Chart Arrival @auth @journey @report @release", async ({ page }, testInfo) => {
    const email = `self-onboarding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const name = "Astra Onboarding Smoke";
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:") && !message.text().includes("due to access control checks.")) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => { if (!isExpectedNavigationCancellation(error.message)) browserErrors.push(error.message); });

    const onboardingUserId = await signInWithTestSession(page, { email, name });
    const initialCreditRows = await db.select().from(creditLedgerEntries).where(eq(creditLedgerEntries.userId, onboardingUserId));
    await expect(page).toHaveURL(/\/self(?:[?#]|$)/);

    await expect(page.locator(".self-profile-name")).toHaveText(name);
    await expect(page.getByRole("heading", { name: "Reveal your chart" })).toBeVisible();
    await expect(page.getByLabel("Alpha onboarding guidance")).toHaveCount(0);
    await expect(page.getByLabel("Chart generation flow")).toHaveCount(0);

    await updateAuthUserProfileDisplayName(db, { userId: onboardingUserId, displayName: name });
    let prematureChartRequests = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && new URL(request.url()).pathname === "/api/chart-requests") prematureChartRequests += 1;
    });
    try {
      await page.goto("/self?start=report#self-birth-onboarding");
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("interrupted by another navigation")) throw error;
      await page.goto("/self?start=report#self-birth-onboarding");
    }
    await expect(page.getByText("Step 1 of 4: Starting focus")).toBeVisible();
    await expect(page.getByText("What brings you to Astra right now?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Reveal My Chart", exact: true })).toHaveCount(0);
    expect(prematureChartRequests).toBe(0);

    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: "Your Journey is clear" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Begin with your Self" })).toHaveAttribute("href", "/self");
    const onboardingFeed = await listUserFeedItems(db, { userId: onboardingUserId, state: "available", limit: 20 });
    expect(onboardingFeed.items.filter((item) => item.reasonCode === "composer_onboarding_card")).toHaveLength(0);

    await page.goto("/self#self-birth-onboarding");
    await expect(page.getByText("Step 1 of 4: Starting focus")).toBeVisible();
    await page.getByRole("radio", { name: "Understand my relationships" }).check();
    const privateQuestion = "How can I be more honest without abandoning myself?";
    await page.getByLabel("Is there a question you want Astra to hold privately?").fill(privateQuestion);
    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await expect(page.getByText("Step 2 of 4: Your name")).toBeVisible();
    await expect(page.getByLabel("Your name")).toHaveValue(name);
    await page.getByLabel("Your name").fill(name);

    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await expect(page.getByText("Step 3 of 4: Birth details")).toBeVisible();
    await chooseUnknownBirthMoment(page, { year: "1961", month: "May", day: "23" });
    await page.getByRole("button", { name: "Edit birth location" }).click();
    const locationDialog = page.getByRole("dialog", { name: "Birth Location" });
    const searchBox = locationDialog.getByLabel("Search birth place");
    const currentSelection = locationDialog.getByLabel("Current birth location selection");
    const searchBounds = await searchBox.boundingBox();
    const selectionBounds = await currentSelection.boundingBox();
    expect(searchBounds?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(selectionBounds?.y ?? 0);
    await searchBox.fill("Cedar Rapids");
    await locationDialog.getByRole("button", { name: "Search", exact: true }).click();
    await locationDialog.getByRole("button", { name: /Cedar Rapids, Iowa, United States/ }).click();
    await expect(locationDialog.getByText("Cedar Rapids, Iowa, United States", { exact: true })).toBeVisible();
    await locationDialog.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("button", { name: "Edit birth location" })).toContainText("Cedar Rapids, Iowa, United States");
    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await expect(page.getByText("Step 4 of 4: Arrival")).toBeVisible();
    const createChartButton = page.getByRole("button", { name: "Reveal My Chart", exact: true });
    await expect(createChartButton).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Confirm Report" })).toHaveCount(0);
    await expect(page.getByRole("radio", { name: /Identity Report/ })).toHaveCount(0);
    await expect(page.getByRole("radio", { name: /Core Report/ })).toHaveCount(0);
    const chartSettings = page.getByRole("group", { name: "Chart settings" });
    await expect(chartSettings).toBeVisible();
    const settingsBox = await chartSettings.boundingBox();
    if (!settingsBox || settingsBox.height > 170) {
      throw new Error(`Chart settings must stay compact. Settings=${JSON.stringify(settingsBox)}`);
    }
    await expect(page.getByRole("radio", { name: "Tropical" })).toBeChecked();
    await page.getByRole("radio", { name: "Sidereal" }).check();
    await expect(page.getByRole("radio", { name: "Sidereal" })).toBeChecked();
    const arrivalResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/chart-arrivals");
    await createChartButton.click();
    const arrivalResponse = await arrivalResponsePromise;
    expect(arrivalResponse.status()).toBe(201);
    const arrivalPayload = await arrivalResponse.json() as { chartRequestId: string; explorerFocus: { status: string; key?: string } };
    expect(arrivalPayload.explorerFocus).toEqual({ schemaVersion: 1, status: "selected", key: "relationships" });
    await expect(page.getByRole("heading", { name: "Your Astra has arrived." })).toBeVisible();
    await expect(page.getByLabel("Chart recognition")).toContainText("Sun");
    await expect(page.getByLabel("Chart recognition")).not.toContainText("Rising");
    const glimpse = await page.getByRole("heading", { name: "First Glimpse" }).locator("..").locator("p").innerText();
    await page.reload();
    await expect(page.getByRole("heading", { name: "First Glimpse" }).locator("..").locator("p")).toHaveText(glimpse);
    const userId = await userIdForEmail(email);
    expect(await listUserAstrologyReportResults(db, userId)).toHaveLength(0);
    await page.goto("/journey");
    await expect(page.getByText("Your Astra has arrived.", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.goto("/self");
    await page.getByRole("button", { name: "Enter Astra", exact: true }).click();
    await expect(page).toHaveURL(/\/journey(?:[?#]|$)/);
    await expect(page.locator("article.astraPublishedCard .astraPublishedCardTitle")).toHaveText("Notice what you carry into connection");
    await expect(page.locator("article.astraPublishedCard .astraPublishedCardEyebrow")).toHaveText("Exploring connection patterns");
    await expect(page.getByText("Your focus: Understand my relationships")).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore this in your chart" })).toHaveAttribute("href", `/charts?chart=${encodeURIComponent(arrivalPayload.chartRequestId)}&from=self`);
    await expect(page.getByText("Why this now?")).toHaveCount(0);
    const repeatComplete = await page.request.post(`/api/chart-arrivals/${encodeURIComponent(arrivalPayload.chartRequestId)}/complete`);
    expect(repeatComplete.ok()).toBe(true);
    const journeyAfterRepeat = await listUserFeedItems(db, { userId, state: "available", limit: 20 });
    const [starterItem] = journeyAfterRepeat.items.filter((item) => item.reasonCode === "focus_first_exploration");
    expect(starterItem).toBeDefined();
    expect(journeyAfterRepeat.items.filter((item) => item.reasonCode === "focus_first_exploration")).toHaveLength(1);
    expect(journeyAfterRepeat.items.filter((item) => item.reasonCode === "composer_onboarding_card")).toHaveLength(0);
    expect(JSON.stringify(starterItem)).not.toContain(privateQuestion);
    const savedChart = (await listUserChartMakerRequests(db, userId)).find((request) => request.id === arrivalPayload.chartRequestId);
    expect(savedChart?.question).toBe(privateQuestion);
    expect(savedChart?.intent).toBe("Understand my relationships");
    expect(savedChart?.context?.explorerFocus).toEqual({ schemaVersion: 1, status: "selected", key: "relationships" });
    expect(await listUserAstrologyReportRequests(db, userId)).toHaveLength(0);
    expect(await listUserAstrologyReportResults(db, userId)).toHaveLength(0);
    expect(await db.select().from(artifacts).where(eq(artifacts.userId, userId))).toHaveLength(0);
    expect(await db.select().from(creditLedgerEntries).where(eq(creditLedgerEntries.userId, userId))).toHaveLength(initialCreditRows.length);
    await page.goto("/self");
    await page.getByRole("button", { name: "Edit focus" }).click();
    await page.getByRole("radio", { name: "Learn how my chart works" }).check();
    await page.getByRole("button", { name: "Save focus" }).click();
    await expect(page.getByText("Focus saved")).toBeVisible();
    const [starterAfterFocusEdit] = (await listUserFeedItems(db, { userId, state: "available", limit: 20 })).items.filter((item) => item.reasonCode === "focus_first_exploration");
    expect(starterAfterFocusEdit?.body).toBe(starterItem?.body);
    const savedChartAfterFocusEdit = (await listUserChartMakerRequests(db, userId)).find((request) => request.id === arrivalPayload.chartRequestId);
    expect(savedChartAfterFocusEdit?.context?.explorerFocus).toEqual({ schemaVersion: 1, status: "selected", key: "relationships" });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Your Astra has arrived." })).toHaveCount(0);

    const existingAllyChart = await createCompletedAllyChart(email, { name: "Existing Ally", relationship: "Friend" });
    await page.goto(`/allies?chart=${existingAllyChart.request.id}&start=report#ally-birth-onboarding`);
    const existingOrderPanel = page.locator('section[aria-label="Create an Ally Report"]');
    await expect(existingOrderPanel.getByRole("heading", { name: "Create a Report for Existing Ally" })).toBeVisible();
    await expect(existingOrderPanel.getByText("Ally report", { exact: true })).toHaveCount(0);
    await expect(existingOrderPanel.getByText("Name the Ally, add birth data")).toHaveCount(0);
    await expect(existingOrderPanel.getByText("Step 1 of 1")).toHaveCount(0);
    await expect(existingOrderPanel.getByRole("button", { name: "Back" })).toHaveCount(0);
    await expect(existingOrderPanel.getByText("Existing Ally", { exact: true })).toBeVisible();
    await expect(existingOrderPanel.getByText("Friend", { exact: true })).toBeVisible();
    await expect(existingOrderPanel.getByText("2021-12-23 · 01:50 · Plano, TX")).toBeVisible();
    await expect(existingOrderPanel.getByText("Birth date", { exact: true })).toHaveCount(0);
    await expect(existingOrderPanel.getByText("Birth place", { exact: true })).toHaveCount(0);
    await expect(existingOrderPanel.getByRole("button", { name: "Create Report", exact: true })).toBeVisible();
    await expect(existingOrderPanel.getByRole("button", { name: "Order Report", exact: true })).toHaveCount(0);

    await page.goto("/allies");
    await expect(page.getByRole("link", { name: "Add an Ally" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add an Ally" })).toHaveCount(0);
    const existingAllyCard = page.locator(`[id="ally-${existingAllyChart.ally.id}"]`);
    await existingAllyCard.getByRole("link", { name: "View chart" }).click();
    await expect(page).toHaveURL(new RegExp(`/charts\\?chart=${existingAllyChart.request.id}&from=allies`));
    await expect(page.getByRole("link", { name: "Back to Allies" })).toBeVisible();
    await expect(page.getByLabel("Saved charts list")).toHaveCount(0);
    await expect(page.getByLabel("Selected chart").getByLabel("Full natal chart wheel")).toBeVisible();
    await expect(page.getByRole("navigation", { name: testInfo.project.name === "mobile" ? "Mobile navigation" : "Primary navigation" }).getByRole("link", { name: "Allies" })).toHaveAttribute("aria-current", "page");
    if (testInfo.project.name === "mobile") await expect(page.locator(".topbar-route-title")).toHaveText("Allies");
    await page.getByRole("link", { name: "Back to Allies" }).click();
    await page.getByRole("link", { name: "Add an Ally" }).first().click();
    const addAllyPanel = page.locator('section[aria-label="Add an Ally"]');
    await expect(addAllyPanel.getByRole("heading", { name: "Add an Ally" })).toBeVisible();
    await expect(addAllyPanel.getByText("Step 1 of 2: Name")).toBeVisible();
    await expect(addAllyPanel.getByText("Report", { exact: true })).toHaveCount(0);

    await page.goto("/library");
    if (testInfo.project.name === "mobile") {
      await expect(page.locator(".topbar-route-title")).toHaveText("Library");
    } else {
      await expect(page.getByRole("heading", { name: "Artifacts worth keeping" })).toBeVisible();
    }

    await page.goto("/journey");
    if (testInfo.project.name === "mobile") {
      await expect(page.locator(".topbar-route-title")).toHaveText("Journey");
    } else {
      await expect(page.getByRole("heading", { name: "Your Journey", exact: true })).toBeVisible();
    }
    expect(browserErrors.filter((message) => message !== "Load failed" && !isExpectedNavigationCancellation(message))).toEqual([]);
  });

  test("legacy Welcome Report stays directly readable but hidden from normal surfaces @auth @journey @report", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Existing-account producer reconciliation is covered once on desktop.");
    const email = `journey-existing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:") && !message.text().includes("due to access control checks.")) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => { if (!isExpectedNavigationCancellation(error.message)) browserErrors.push(error.message); });
    await signInWithTestSession(page, { email, name: "Existing Journey Account" });
    const completed = await createCompletedReport(email, { name: "Existing Journey Account", reportType: "identity", legacyWelcome: true });

    await page.goto("/journey");
    const legacyHeadline = completed.result.publicSignal?.headline;
    if (legacyHeadline) {
      await expect(page.getByText(legacyHeadline, { exact: true })).toHaveCount(0);
    }
    await page.goto("/library");
    await expect(page.getByText("Welcome Report", { exact: true })).toHaveCount(0);
    await page.goto(`/library?reportId=${completed.request.id}`);
    await expect(page.getByRole("heading", { name: "Existing Journey Account — Welcome Report" })).toBeVisible();
    await page.goto("/self#self-birth-onboarding");
    await expect(page.getByRole("heading", { name: "Reveal your chart" })).toHaveCount(0);
    expect(browserErrors).toEqual([]);
  });

  test("admin Stars ledger and Synastry controls stay browser-visible @auth @report @release", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The auth-backed admin and Synastry parity journey is covered on desktop.");

    const email = `alpha-parity-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const name = "Astra Alpha Admin";

    await signInWithTestSession(page, { email, name });
    await page.goto("/self");
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await makeProfileAdmin(email);

    await page.goto("/stars");
    await expect(page.getByRole("heading", { name: "Stars" })).toBeVisible();
    await expect(page.getByText("Current balance")).toBeVisible();
    await expect(page.getByText("50 Stars")).toBeVisible();
    await page.getByRole("button", { name: "Add Stars" }).click();
    const starsDialog = page.getByRole("dialog", { name: "Choose a Star pack" });
    await expect(starsDialog).toBeVisible();
    await expect(starsDialog).toContainText("5 Stars");
    await expect(starsDialog).toContainText("$9.99");
    await expect(starsDialog).toContainText("30 Stars");
    await page.keyboard.press("Escape");
    await expect(starsDialog).toHaveCount(0);

    const [adminProfile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
    if (!adminProfile) throw new Error(`Expected admin profile for ${email}.`);
    const checkoutResponse = await page.request.post("/api/billing/create-checkout-session", {
      data: {
        cancelUrl: "http://localhost:3011/stars?checkout=cancelled",
        productKey: "core_pack",
        successUrl: "http://localhost:3011/stars?checkout=success"
      }
    });
    const checkoutBody = await checkoutResponse.text();
    expect(checkoutResponse.ok(), checkoutBody).toBe(true);
    const checkout = JSON.parse(checkoutBody) as JsonObject;
    const checkoutSessionId = String(checkout.checkoutSessionId ?? "");
    expect(checkoutSessionId).toMatch(/^cs_/);
    expect(String(checkout.url ?? "")).toContain("checkout.stripe.com");
    const fulfilled = await fulfillCheckoutThroughWebhook(page, { checkoutSessionId, userId: adminProfile.userId });
    expect(fulfilled.ok).toBe(true);
    expect(fulfilled.balance).toBe(55);
    await page.goto("/stars?checkout=success");
    await expect(page.getByText("55 Stars")).toBeVisible();

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin Console" })).toBeVisible();
    await expect(page.getByText(`Signed in as ${email} · Admin`)).toBeVisible();
    await expect(page.getByLabel("Selected User")).toContainText(email);
    await expect(page.getByLabel("Selected User")).toContainText("55");
    await expect(page.getByRole("heading", { name: "Report bakeoff controls" })).toBeVisible();
    await expect(page.getByLabel("Report request id")).toBeVisible();
    await expect(page.getByLabel("Writer")).toBeVisible();
    await expect(page.locator('select[name="modelProfile"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Run Replay" }).first()).toBeVisible();
    await expect(page.getByText("npm run report:bakeoff -- --profiles debug,production")).toBeVisible();
    await expect(page.getByRole("table", { name: "Recent ledger entries" })).toContainText("Playwright admin parity grant");
    await expect(page.getByRole("table", { name: "Recent ledger entries" })).toContainText("stripe_checkout");
    await expect(page.getByRole("table", { name: "Recent ledger entries" })).toContainText(checkoutSessionId.slice(0, 14));

    await page.goto("/self#self-birth-onboarding");
    await expect(page.getByRole("heading", { name: "Reveal your chart" })).toBeVisible();
    await page.getByRole("button", { name: "Skip for now" }).click();
    await page.getByLabel("Your name").fill(name);
    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await chooseUnknownBirthMoment(page, { year: "1961", month: "May", day: "23" });
    await page.getByRole("button", { exact: true, name: "Next" }).click();
    const revealChart = page.getByRole("button", { name: "Reveal My Chart", exact: true });
    await expect(revealChart).toBeVisible();
    await revealChart.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Your Astra has arrived." })).toBeVisible();
    await page.getByRole("button", { name: "Enter Astra", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your Astra has arrived." })).toHaveCount(0);
    const adminStarterItems = await listUserFeedItems(db, { userId: adminProfile.userId, state: "available", limit: 20 });
    expect(adminStarterItems.items.filter((item) => item.reasonCode === "focus_first_exploration")).toHaveLength(0);

    await createCompletedAllyChart(email, { name: "Admin Comparison", relationship: "Colleague" });
    await page.goto("/self#self-birth-onboarding");
    await expect(page.getByRole("heading", { name: "Request Report" })).toBeVisible();
    await expect(page.getByText("Step 1 of 2: Birth details")).toBeVisible();
    await expect(page.getByRole("button", { name: "Order Report", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Request Report", exact: true })).toHaveAttribute("href", /start=report/);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Step 2 of 2: Report")).toBeVisible();
    await expect(page.getByRole("button", { name: "Order Report", exact: true })).toBeVisible();
    await page.getByLabel("Synastry Report").check();
    await expect(page.getByLabel("Comparison chart")).toBeVisible();

    const completedChart = await createCompletedChart(email, { name });
    await page.goto(`/self?chart=${completedChart.request.id}&start=birth_details#self-birth-onboarding`);
    const selfEditPanel = page.locator('section[aria-label="Birth data onboarding"]');
    await expect(selfEditPanel.getByText("Step 1 of 2: Birth details")).toBeVisible();
    await expect(selfEditPanel.getByText("These saved birth details are locked")).toHaveCount(0);
    await expect(selfEditPanel.getByLabel("Edit birth details")).toBeEnabled();
    await expect(selfEditPanel.getByLabel("Edit birth location")).toBeEnabled();
    await expect(selfEditPanel.getByLabel("Search birth place")).toHaveCount(0);
    await selfEditPanel.getByLabel("Edit birth details").click();
    const existingSelfBirthDialog = page.getByRole("dialog", { name: "Birth Details" });
    await expect(existingSelfBirthDialog.getByLabel("Time", { exact: true })).toBeEnabled();
    await existingSelfBirthDialog.getByRole("button", { name: "Close birth date and time editor" }).click();
    await selfEditPanel.getByLabel("Edit birth location").click();
    const existingSelfLocationDialog = page.getByRole("dialog", { name: "Birth Location" });
    await expect(existingSelfLocationDialog.getByLabel("Search birth place")).toBeEditable();
    await existingSelfLocationDialog.getByRole("button", { name: "Close birth location editor" }).click();
    await selfEditPanel.getByRole("button", { exact: true, name: "Next" }).click();
    await expect(selfEditPanel.getByText("Step 2 of 2: Report")).toBeVisible();

    const completedReport = await createCompletedReport(email, {
      chartRequestId: completedChart.request.id,
      name,
      reportType: "core",
      chartSettings: { zodiacMode: "sidereal", houseSystem: "placidus" },
      includeLegacyWriterCopy: true
    });
    await page.goto(`/admin?replayRequest=${completedReport.request.id}`);
    await expect(page.getByLabel("Selected report run inspector")).toContainText(completedReport.request.id.slice(0, 8));
    await expect(page.getByLabel("Selected report run inspector")).toContainText("completed");
    await expect(page.locator("details.adminDebugDetails")).toContainText("Report debug details");
    await expect(page.locator("details.adminDebugDetails")).toContainText("Usage");
    await expect(page.locator("details.adminDebugDetails").getByRole("link", { name: "Open Library" })).toBeVisible();

    await page.goto("/charts");
    await expect(page.getByRole("heading", { name: "Saved charts" })).toBeVisible();
    await expect(page.getByLabel("Saved charts list").getByRole("heading", { name }).first()).toBeVisible();
    await expect(page.getByText("Portrait written").first()).toBeVisible();
    const selectedChart = page.getByLabel("Selected chart");
    await expect(selectedChart.getByLabel("Full natal chart wheel")).toBeVisible();
    await expect(selectedChart.getByLabel("Aspect legend")).toBeVisible();
    await expect(selectedChart).toContainText("Selected Object");
    await expect(selectedChart).toContainText("Tropical");
    await expect(selectedChart).toContainText("Whole Sign");
    await page.getByRole("link", { name: "Portrait" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/library\\?reportId=${completedReport.request.id}`));

    await page.goto("/library");
    const reportFilters = page.getByRole("region", { name: "Report filters" });
    await expect(reportFilters).toBeVisible();
    const reportFilterSelect = reportFilters.getByRole("combobox", { name: "Report filters" });
    await expect(reportFilterSelect).toContainText("Core");
    await reportFilterSelect.selectOption("core");
    await reportFilters.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/filter=core/);
    await expect(page.getByRole("link", { name: new RegExp(`View report: ${name}.*Core Report`) })).toBeVisible();
    await page.getByLabel("Search Library").fill(name);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/q=Astra/);
    await createAstrologyReportShare(db, { requestId: completedReport.request.id, userId: completedReport.request.userId, baseUrl: "http://localhost:3011" });
    await page.goto("/library?filter=shared");
    await expect(page.getByRole("link", { name: new RegExp(`View report: ${name}.*Core Report`) })).toBeVisible();
    await page.getByRole("link", { name: new RegExp(`View report: ${name}`) }).first().click();
    await expect(page.getByRole("heading", { name: `${name} — Core Report` })).toBeVisible();
    const reportChartPlate = page.getByLabel("Report basis and chart snapshot");
    await expect(reportChartPlate.getByText("Report basis", { exact: true })).toBeVisible();
    await expect(reportChartPlate).toContainText("Natal chart");
    await expect(reportChartPlate).toContainText("Sidereal");
    await expect(reportChartPlate.getByText("Legacy / unknown", { exact: true })).toHaveCount(2);
    await expect(page.locator(".reportMarkdown")).not.toContainText("local-deterministic-writer");
    await expect(page.getByRole("heading", { name: "How did this portrait land?" })).toBeVisible();
    const debugDetails = page.locator("details.reportDebugDetails");
    await expect(debugDetails).toContainText("Report debug details");
    await debugDetails.locator("summary").click();
    await expect(debugDetails).toContainText(completedReport.request.id);
    await expect(debugDetails).toContainText("local-chart-routine");
    await expect(debugDetails).toContainText("local-deterministic-writer");
  });
});
