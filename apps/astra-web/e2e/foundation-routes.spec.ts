import { expect, type Page, test } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import { ASTRA_REPORT_WRITER_ENV, LOCAL_DETERMINISTIC_REPORT_WRITER, buildAstrologyReportResultAsync } from "@astra/astrology";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import { appUserProfiles, createAlly, createAstrologyReportRequest, createAstrologyReportShare, createChartMakerRequest, creditLedgerEntries, db, mirrorCreditBalanceToProfile, recordAstrologyReportResult, recordChartMakerResult } from "@astra/db";
import { eq } from "drizzle-orm";

type JsonObject = Record<string, unknown>;

const routes = [
  { path: "/", heading: "A living stream", mobileHeading: "Journey" },
  { path: "/journey", heading: "A living stream", mobileHeading: "Journey" },
  { path: "/allies", heading: "Sign in to create Ally reports", mobileHeading: "Allies" },
  { path: "/self", heading: "Sign in to see your Astra", mobileHeading: "Self" },
  { path: "/charts", heading: "Sign in to see your charts", mobileHeading: "Charts" },
  { path: "/library", heading: "Artifacts worth keeping", mobileHeading: "Library" },
  { path: "/gifts", heading: "Stars stay accountable", mobileHeading: "Gifts" },
  { path: "/login", heading: "Welcome back to Astra" }
];

function findOtp(value: unknown): string | null {
  if (typeof value === "string") return value.match(/\b\d{6}\b/)?.[0] ?? null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const otp = findOtp(item);
      if (otp) return otp;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as JsonObject)) {
      const otp = findOtp(item);
      if (otp) return otp;
    }
  }
  return null;
}

async function readOtpFromMailpit(email: string) {
  const mailpitUrl = process.env.MAILPIT_API_URL?.trim() || "http://localhost:8025";
  const deadline = Date.now() + 5_000;

  while (Date.now() < deadline) {
    const searchUrl = new URL("/api/v1/search", mailpitUrl);
    searchUrl.searchParams.set("query", email);
    searchUrl.searchParams.set("limit", "10");

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Mailpit search failed with ${searchResponse.status}. Is Mailpit running at ${mailpitUrl}?`);
    }

    const search = (await searchResponse.json()) as JsonObject;
    const messages = Array.isArray(search.messages)
      ? search.messages
      : Array.isArray(search.Messages)
        ? search.Messages
        : [];

    for (const summary of messages as JsonObject[]) {
      const id = String(summary.ID ?? summary.Id ?? summary.id ?? "");
      if (!id) continue;

      const messageResponse = await fetch(new URL(`/api/v1/message/${id}`, mailpitUrl));
      if (!messageResponse.ok) continue;
      const message = (await messageResponse.json()) as JsonObject;
      const otp = findOtp(message);
      if (otp) return otp;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`No OTP found in Mailpit for ${email}.`);
}

async function signInWithOtp(page: Page, input: { email: string; name: string }) {
  await page.goto("/login");
  await page.getByLabel("Name").fill(input.name);
  await page.getByLabel("Email").fill(input.email);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Check email for the sign-in code")).toBeVisible();

  await page.getByLabel("Code").fill(await readOtpFromMailpit(input.email));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page.getByRole("heading", { name: input.name })).toBeVisible();
}

async function chooseUnknownBirthMoment(page: Page, input: { year: string; month: string; dayLabel: string }) {
  await page.getByRole("button", { name: "Edit birth details" }).click();
  const dialog = page.getByRole("dialog", { name: "Birth Details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Birth date calendar")).toBeVisible();
  await expect(dialog.getByText("Birth moment", { exact: true })).toHaveCount(0);
  await dialog.getByLabel("Birth year").fill(input.year);
  await dialog.getByLabel("Birth month").selectOption({ label: input.month });
  await dialog.getByRole("button", { name: input.dayLabel }).click();
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

async function createCompletedReport(email: string, input: { chartRequestId?: string; name: string; reportType?: "core" | "deep" | "identity" }) {
  const [profile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
  if (!profile) throw new Error(`Expected profile for ${email}.`);
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
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      subject: { subjectType: "self", displayName: input.name }
    },
    source: "self"
  });
  const result = await recordAstrologyReportResult(
    db,
    await buildAstrologyReportResultAsync(request, {
      env: {
        ...process.env,
        [ASTRA_REPORT_WRITER_ENV]: LOCAL_DETERMINISTIC_REPORT_WRITER
      }
    })
  );
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
    test(`${route.path} renders without console errors`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto(route.path);
      if (testInfo.project.name === "mobile" && route.mobileHeading) {
        await expect(page.locator(".topbar-route-title")).toHaveText(route.mobileHeading);
      } else {
        await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      }
      expect(errors).toEqual([]);
    });
  }

  test("mobile layout has no document-level horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/journey");
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test("active navigation is visible on desktop and mobile", async ({ page }) => {
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

  test("primary journey reaches adjacent clean-start areas", async ({ page }, testInfo) => {
    await page.goto("/journey");
    await page.locator('a[href="/allies"]:visible').click();
    await expect(page.getByRole("heading", { name: testInfo.project.name === "mobile" ? "Allies" : "Sign in to create Ally reports" })).toBeVisible();
    await page.locator('a[href="/self"]:visible').click();
    await expect(page.getByRole("heading", { name: testInfo.project.name === "mobile" ? "Self" : "Sign in to see your Astra" })).toBeVisible();
  });

  test("reader filters lanes and opens card detail", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.getByLabel("Journey state")).toContainText("A public sample, not your private Journey");
    await expect(page.locator(".stream-card")).toHaveCount(12);
    await page.getByRole("tab", { name: "Practice" }).click();
    const ariesCard = page.locator(".stream-card-open").filter({ hasText: "Aries is ignition" });
    await expect(ariesCard).toBeVisible();
    await expect(page.locator(".stream-card-open").filter({ hasText: "Cleopatra: image" })).toHaveCount(0);
    await ariesCard.click();
    await expect(page.getByLabel("Card detail")).toContainText("Aries is ignition");
  });

  test("reader surfaces public fallback metadata", async ({ page }) => {
    await page.goto("/journey");
    await page.getByRole("tab", { name: "Myth and symbol" }).click();
    await page.locator(".stream-card-open").filter({ hasText: "Cleopatra: image" }).click();
    await expect(page.getByLabel("Card detail")).toContainText("Cleopatra: image, strategy, and survival");
    await expect(page.getByLabel("Card metadata")).toContainText("Card");
    await expect(page.getByLabel("Card metadata")).toContainText("Public fallback");
    await expect(page.getByLabel("Card metadata")).toContainText("Published");
  });

  test("reader save and reflect actions update state", async ({ page }) => {
    await page.goto("/journey");
    await page.getByRole("button", { name: /^Save$/ }).first().click();
    await expect(page.getByText("1 saved")).toBeVisible();
    await page.getByRole("button", { name: /^Reflect$/ }).first().click();
    await expect(page.getByText("1 reflected")).toBeVisible();
  });

  test("theme toggle switches and persists the Astra theme", async ({ page }) => {
    await page.goto("/journey");
    await page.getByRole("button", { name: "Switch to dark mode" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-astra-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-astra-theme", "dark");
    await page.getByRole("button", { name: "Switch to light mode" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-astra-theme", "light");
  });

  test("login route exposes Better Auth controls", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Authentication panel")).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Code")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
  });

  test("signed-in self onboarding requires report cost confirmation", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The auth-backed onboarding journey is covered on desktop in this regression test.");

    const email = `self-onboarding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const name = "Astra Onboarding Smoke";

    await signInWithOtp(page, { email, name });
    await page.getByRole("link", { name: "Continue to Self" }).click();

    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Request Report" })).toBeVisible();
    await expect(page.getByLabel("Alpha onboarding guidance")).toHaveCount(0);
    await expect(page.getByLabel("Chart generation flow")).toHaveCount(0);

    await page.goto("/self#self-birth-onboarding");
    await expect(page.getByText("Step 1 of 3: Your name")).toBeVisible();
    await expect(page.getByLabel("Your name")).toHaveValue(name);

    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await expect(page.getByText("Step 2 of 3: Birth details")).toBeVisible();
    await chooseUnknownBirthMoment(page, { year: "1961", month: "May", dayLabel: "May 23, 1961" });
    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await expect(page.getByText("Step 3 of 3: Report")).toBeVisible();
    const queueButton = page.getByRole("button", { name: "Order Report", exact: true });
    await expect(queueButton).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Confirm Report" })).toHaveCount(0);
    await expect(page.getByRole("radio", { name: /Core Report/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Deep Report/ })).toBeVisible();
    await expect(page.getByText("Chart settings")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Tropical" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Whole Sign" })).toBeChecked();
    await page.getByRole("radio", { name: "Sidereal" }).check();
    await page.getByRole("radio", { name: "Placidus" }).check();
    await expect(page.getByRole("radio", { name: "Sidereal" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Placidus" })).toBeChecked();
    await expect(page.getByLabel("Review birth data")).toHaveCount(0);
    await queueButton.focus();
    await page.keyboard.press("Enter");
    const confirmDialog = page.getByRole("dialog", { name: "Confirm Report" });
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByLabel("Review birth data")).toContainText("1961-05-23");
    await expect(confirmDialog.getByLabel("Review birth data")).toContainText("Birth time unknown");
    await expect(confirmDialog.getByLabel("Review birth data")).toContainText("Core Report");
    await expect(confirmDialog).toContainText("Report selected");
    await expect(confirmDialog).toContainText("Core Report");
    await expect(confirmDialog).toContainText("Cost");
    await expect(confirmDialog).toContainText("5 Stars");
    await expect(confirmDialog).toContainText("Current balance");
    await expect(confirmDialog.getByRole("button", { name: "OK" })).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(confirmDialog).toHaveCount(0);
    const onboarding = page.locator('section[aria-label="Birth data onboarding"]');
    await expect(onboarding.getByLabel("Review birth data")).toHaveCount(0);
    await expect(onboarding.getByRole("button", { name: "Order Report", exact: true })).toBeVisible();

    const existingAllyChart = await createCompletedAllyChart(email, { name: "Existing Ally", relationship: "Friend" });
    await page.goto(`/allies?chart=${existingAllyChart.request.id}&start=birth_details#ally-birth-onboarding`);
    const existingOrderPanel = page.locator('section[aria-label="Ally birth data onboarding"]');
    await expect(existingOrderPanel.getByRole("heading", { name: "Order an Ally Report" })).toBeVisible();
    await expect(existingOrderPanel.getByText("Ally report", { exact: true })).toHaveCount(0);
    await expect(existingOrderPanel.getByText("Name the Ally, add birth data")).toHaveCount(0);
    await expect(existingOrderPanel.getByText("Step 1 of 1")).toHaveCount(0);
    await expect(existingOrderPanel.getByRole("button", { name: "Back" })).toHaveCount(0);
    await expect(existingOrderPanel.getByText("Existing Ally")).toBeVisible();
    await expect(existingOrderPanel.getByText("Friend", { exact: true })).toBeVisible();
    await expect(existingOrderPanel.getByText("2021-12-23 · 01:50 · Plano, TX")).toBeVisible();
    await expect(existingOrderPanel.getByText("Birth date", { exact: true })).toHaveCount(0);
    await expect(existingOrderPanel.getByText("Birth place", { exact: true })).toHaveCount(0);

    await page.goto("/library");
    await expect(page.getByRole("heading", { name: "Artifacts worth keeping" })).toBeVisible();

    await page.goto("/journey");
    await expect(page.getByRole("heading", { name: "A living stream" })).toBeVisible();
  });

  test("admin Stars ledger and Synastry controls stay browser-visible", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The auth-backed admin and Synastry parity journey is covered on desktop.");

    const email = `alpha-parity-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const name = "Astra Alpha Admin";

    await signInWithOtp(page, { email, name });
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
    expect(checkoutResponse.ok()).toBe(true);
    const checkout = (await checkoutResponse.json()) as JsonObject;
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
    await expect(page.getByLabel("Profile")).toBeVisible();
    await expect(page.getByRole("button", { name: "Run Replay" }).first()).toBeVisible();
    await expect(page.getByText("npm run report:bakeoff -- --profiles debug,production")).toBeVisible();
    await expect(page.getByRole("table", { name: "Recent ledger entries" })).toContainText("Playwright admin parity grant");
    await expect(page.getByRole("table", { name: "Recent ledger entries" })).toContainText("stripe_checkout");
    await expect(page.getByRole("table", { name: "Recent ledger entries" })).toContainText(checkoutSessionId.slice(0, 14));

    await page.goto("/self#self-birth-onboarding");
    await expect(page.getByRole("heading", { name: "Request Report" })).toBeVisible();
    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await chooseUnknownBirthMoment(page, { year: "1961", month: "May", dayLabel: "May 23, 1961" });
    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await expect(page.getByText("Deep Report")).toBeVisible();
    await expect(page.getByText("Progressed Report")).toBeVisible();
    await expect(page.getByText("Synastry Report")).toHaveCount(0);
    await page.getByRole("button", { name: "Order Report", exact: true }).focus();
    await page.keyboard.press("Enter");
    const adminConfirmDialog = page.getByRole("dialog", { name: "Confirm Report" });
    await expect(adminConfirmDialog.getByRole("button", { name: "OK" })).toBeEnabled();
    await adminConfirmDialog.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText("Report is generating")).toBeVisible();

    await page.getByRole("button", { name: "Start another report request" }).click();
    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await chooseUnknownBirthMoment(page, { year: "1961", month: "May", dayLabel: "May 23, 1961" });
    await page.getByRole("button", { exact: true, name: "Next" }).click();
    await page.getByLabel("Synastry Report").check();
    await expect(page.getByLabel("Comparison chart")).toBeVisible();
    await expect(page.getByLabel("Comparison chart")).toContainText(name);

    const completedChart = await createCompletedChart(email, { name });
    const completedReport = await createCompletedReport(email, { chartRequestId: completedChart.request.id, name, reportType: "core" });
    await page.goto(`/admin?replayRequest=${completedReport.request.id}`);
    await expect(page.getByLabel("Selected report run inspector")).toContainText(completedReport.request.id.slice(0, 8));
    await expect(page.getByLabel("Selected report run inspector")).toContainText("completed");
    await expect(page.locator("details.adminDebugDetails")).toContainText("Report debug details");
    await expect(page.locator("details.adminDebugDetails")).toContainText("Usage");
    await expect(page.locator("details.adminDebugDetails").getByRole("link", { name: "Open Library" })).toBeVisible();

    await page.goto("/charts");
    await expect(page.getByRole("heading", { name: "Saved charts" })).toBeVisible();
    await expect(page.getByLabel("Saved charts list").getByRole("heading", { name }).first()).toBeVisible();
    await expect(page.getByText("Portrait ready")).toBeVisible();
    const selectedChart = page.getByLabel("Selected chart");
    await expect(selectedChart.getByLabel("Full natal chart wheel")).toBeVisible();
    await expect(selectedChart.getByLabel("Aspect legend")).toBeVisible();
    await expect(selectedChart).toContainText("Selected Object");
    await expect(selectedChart).toContainText("Tropical");
    await expect(selectedChart).toContainText("Whole Sign");
    await page.getByRole("link", { name: "Portrait" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/library\\?reportId=${completedReport.request.id}`));

    await page.goto("/library");
    const reportFilters = page.getByRole("navigation", { name: "Report filters" });
    await expect(reportFilters).toBeVisible();
    await expect(reportFilters.getByRole("link", { name: /Core/ })).toBeVisible();
    await reportFilters.getByRole("link", { name: /Core/ }).click();
    await expect(page).toHaveURL(/filter=core/);
    await expect(page.getByText(`${name} — Core Report`)).toBeVisible();
    await page.getByLabel("Search Library").fill(name);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/q=Astra/);
    await createAstrologyReportShare(db, { requestId: completedReport.request.id, userId: completedReport.request.userId, baseUrl: "http://localhost:3011" });
    await page.goto("/library?filter=shared");
    await expect(page.getByText(`${name} — Core Report`)).toBeVisible();
    await page.getByRole("link", { name: new RegExp(`View report: ${name}`) }).first().click();
    await expect(page.getByRole("heading", { name: `${name} — Core Report` })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How did this portrait land?" })).toBeVisible();
    const debugDetails = page.locator("details.reportDebugDetails");
    await expect(debugDetails).toContainText("Report debug details");
    await debugDetails.locator("summary").click();
    await expect(debugDetails).toContainText(completedReport.request.id);
    await expect(debugDetails).toContainText("local-chart-routine");
    await expect(debugDetails).toContainText("local-deterministic-writer");
  });
});
