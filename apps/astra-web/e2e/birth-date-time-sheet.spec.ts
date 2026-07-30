import { expect, type Locator, type Page, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

type JsonObject = Record<string, unknown>;

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
    if (!searchResponse.ok) throw new Error(`Mailpit search failed with ${searchResponse.status}.`);
    const search = (await searchResponse.json()) as JsonObject;
    const messages = Array.isArray(search.messages) ? search.messages : Array.isArray(search.Messages) ? search.Messages : [];

    for (const summary of messages as JsonObject[]) {
      const id = String(summary.ID ?? summary.Id ?? summary.id ?? "");
      if (!id) continue;
      const messageResponse = await fetch(new URL(`/api/v1/message/${id}`, mailpitUrl));
      if (!messageResponse.ok) continue;
      const otp = findOtp(await messageResponse.json());
      if (otp) return otp;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`No OTP found in Mailpit for ${email}.`);
}

async function signInWithOtp(page: Page, input: { email: string; name: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(input.email);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("Code").fill(await readOtpFromMailpit(input.email));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page).toHaveURL(/\/self(?:[?#]|$)/);
  await expect(page.locator(".self-profile-name")).toHaveText(input.email);
  await page.waitForLoadState("networkidle");
}

async function gotoAfterDevCompilation(page: Page, url: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url);
      return;
    } catch (error) {
      lastError = error;
      if (!(error instanceof Error) || !error.message.includes("is interrupted by another navigation")) throw error;
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    }
  }
  throw lastError;
}

async function expectNoFocusZoom(page: Page, field: Locator) {
  const before = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scale: window.visualViewport?.scale ?? 1,
    visualWidth: window.visualViewport?.width ?? window.innerWidth
  }));
  await field.focus();
  const after = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scale: window.visualViewport?.scale ?? 1,
    visualWidth: window.visualViewport?.width ?? window.innerWidth
  }));
  const fontSize = Number.parseFloat(await field.evaluate((element) => getComputedStyle(element).fontSize));

  expect(fontSize).toBeGreaterThanOrEqual(16);
  expect(after.scale).toBe(1);
  expect(after.innerWidth).toBe(before.innerWidth);
  expect(Math.abs(after.visualWidth - before.visualWidth)).toBeLessThanOrEqual(1);
}

async function chooseUnknownBirthMoment(page: Page, invalidScreenshotPath?: string) {
  await page.getByRole("button", { name: "Edit birth details" }).click();
  const dialog = page.getByRole("dialog", { name: "Birth Details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Birth moment", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText("Selected", { exact: true })).toHaveCount(0);
  const yearInput = dialog.getByLabel("Birth year");
  await yearInput.fill("2000");
  await yearInput.press("End");
  await yearInput.press("Backspace");
  await yearInput.press("Backspace");
  await yearInput.press("Backspace");
  await yearInput.press("Backspace");
  await expect(yearInput).toHaveValue("");
  await yearInput.fill("1961");
  await dialog.getByLabel("Birth month").selectOption({ label: "May" });
  await dialog.getByLabel("Birth day").selectOption("23");
  await expect(dialog.locator('[role="grid"]')).toHaveCount(0);
  await expect(dialog.getByText("Birth time unknown", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Use a noon chart")).toHaveCount(0);
  await expect(dialog.getByLabel("Time", { exact: true })).toBeEnabled();
  const checkboxBox = await dialog.locator('input[type="checkbox"]').boundingBox();
  const labelBox = await dialog.getByText("Birth time unknown", { exact: true }).boundingBox();
  expect(checkboxBox?.x ?? Number.POSITIVE_INFINITY).toBeLessThan(labelBox?.x ?? 0);
  await dialog.locator('input[type="checkbox"]').check();
  const continueButton = dialog.getByRole("button", { name: "Continue" }).first();
  await expect(continueButton).toBeEnabled();
  await dialog.getByLabel("Birth day").selectOption("");
  await expect(continueButton).toBeDisabled();
  await expect(continueButton).toHaveCSS("cursor", "not-allowed");
  await expect(dialog.getByText("Complete the month, day, and four-digit year.")).toBeVisible();
  if (invalidScreenshotPath) {
    await page.screenshot({ path: invalidScreenshotPath, fullPage: true });
  }
  await dialog.getByLabel("Birth day").selectOption("23");

  if (page.viewportSize()?.width === 390) {
    await expectNoFocusZoom(page, yearInput);
    await expect(dialog.getByLabel("Birth day")).toHaveCSS("font-size", "16px");
    const timeInput = dialog.getByLabel("Time", { exact: true });
    const unknownTimeCheckbox = dialog.locator('input[type="checkbox"]');
    await unknownTimeCheckbox.uncheck();
    await expectNoFocusZoom(page, timeInput);
    await unknownTimeCheckbox.check();
    await page.setViewportSize({ width: 390, height: 700 });
    await expect(timeInput).toBeInViewport();
    await expect(continueButton).toBeInViewport();
    expect((await timeInput.boundingBox())?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(160);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await dialog.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(continueButton).toBeInViewport();
  }

  return dialog;
}

async function chooseKnownBirthMomentWithoutPlace(page: Page) {
  await page.getByRole("button", { name: "Edit birth details" }).click();
  const dialog = page.getByRole("dialog", { name: "Birth Details" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Birth year").fill("1961");
  await dialog.getByLabel("Birth month").selectOption({ label: "May" });
  await dialog.getByLabel("Birth day").selectOption("23");
  const unknownTimeCheckbox = dialog.locator('input[type="checkbox"]');
  if (await unknownTimeCheckbox.isChecked()) {
    await unknownTimeCheckbox.click();
  }
  const timeInput = dialog.getByLabel("Time", { exact: true });
  const continueButton = dialog.getByRole("button", { name: "Continue" }).first();
  await expect(timeInput).toHaveAttribute("aria-invalid", "true");
  await expect(dialog.getByText("Enter a complete birth time, including minutes, or turn on Birth time unknown.")).toBeVisible();
  await expect(continueButton).toBeDisabled();
  await timeInput.fill("09:30");
  await expect(timeInput).toHaveAttribute("aria-invalid", "false");
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
  await expect(dialog).toHaveCount(0);
}

test.describe("birth date and time sheet", () => {
  test("Self sheet works across responsive viewports and Ally can reuse it", async ({ page }, testInfo) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !message.text().includes("Failed to load resource: the server responded with a status of 404") &&
        !message.text().includes("Failed to load resource: the server responded with a status of 403")
      ) {
        consoleMessages.push(message.text());
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (
        response.status() >= 400 &&
        !response.url().includes("/apple-touch-icon") &&
        !response.url().includes("/favicon") &&
        !response.url().includes("gravatar.com/avatar") &&
        !response.url().includes("astraportrait.com/astra-auth-desktop.png")
      ) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    const name = `Birth Sheet ${testInfo.project.name}`;
    const email = `birth-sheet-${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    await signInWithOtp(page, { email, name });

    // Compile and hydrate the report destination before the form submission triggers
    // a full-page navigation in Next development mode.
    await gotoAfterDevCompilation(page, "/library");
    await expect(testInfo.project.name === "mobile" ? page.locator(".topbar-route-title") : page.getByRole("heading", { name: "Artifacts worth keeping" })).toBeVisible();
    await page.goto("/self#self-birth-onboarding");
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /width=device-width/);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /initial-scale=1/);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
    const subjectNameInput = page.getByLabel("Your name");
    if ((page.viewportSize()?.width ?? Number.POSITIVE_INFINITY) <= 900) {
      await expectNoFocusZoom(page, subjectNameInput);
    }
    await subjectNameInput.fill(name);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await mkdir("apps/astra-web/test-results/birth-date-time-sheet", { recursive: true });
    const selfDialog = await chooseUnknownBirthMoment(
      page,
      `apps/astra-web/test-results/birth-date-time-sheet/${testInfo.project.name}-partial-date.png`
    );
    await page.screenshot({
      path: `apps/astra-web/test-results/birth-date-time-sheet/${testInfo.project.name}-self-sheet.png`,
      fullPage: true
    });
    await selfDialog.getByRole("button", { name: "Continue" }).first().click();
    await expect(selfDialog).toHaveCount(0);
    await page.getByRole("button", { name: "Edit birth location" }).click();
    const locationDialog = page.getByRole("dialog", { name: "Birth Location" });
    const locationSearch = locationDialog.getByLabel("Search birth place");
    const currentLocation = locationDialog.getByLabel("Current birth location selection");
    const locationSearchBounds = await locationSearch.boundingBox();
    const currentLocationBounds = await currentLocation.boundingBox();
    expect(locationSearchBounds?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(currentLocationBounds?.y ?? 0);
    await page.screenshot({
      path: `apps/astra-web/test-results/birth-date-time-sheet/${testInfo.project.name}-location-search-first.png`,
      fullPage: true
    });
    await locationDialog.getByRole("button", { name: "Close birth location editor" }).click();
    await expect(locationDialog).toHaveCount(0);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Step 3 of 3: Arrival")).toBeVisible();
    const arrivalResponsePromise = page.waitForResponse(
      (response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/chart-arrivals"
    );
    await page.getByRole("button", { name: "Reveal My Chart", exact: true }).click();
    expect((await arrivalResponsePromise).status()).toBe(201);
    await expect(page.getByRole("heading", { name: "Your Astra has arrived." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "First Glimpse" })).toBeVisible();
    await expect(page.getByLabel("Chart recognition")).not.toContainText("Rising");
    const persistedGlimpse = await page.getByRole("heading", { name: "First Glimpse" }).locator("..").locator("p").innerText();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Your Astra has arrived." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "First Glimpse" }).locator("..").locator("p")).toHaveText(persistedGlimpse);
    await page.getByRole("button", { name: "Enter Astra", exact: true }).click();
    await expect(page).toHaveURL(/\/self$/);
    await expect(page.getByRole("heading", { name: "Your Astra has arrived." })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Your Astra has arrived." })).toHaveCount(0);
    await page.goto("/library");
    await expect(page.getByText("Welcome Report", { exact: true })).toHaveCount(0);

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow).toBe(false);

    if (testInfo.project.name === "mobile") {
      await page.goto("/self?start=report#self-birth-onboarding");
      const orderReportButton = page.getByRole("button", { name: "Order Report", exact: true });
      await expect(orderReportButton).toBeVisible();
      await orderReportButton.click();
      const confirmDialog = page.getByRole("dialog", { name: "Confirm Report" });
      await expect(confirmDialog).toBeVisible();
      const confirmBounds = await confirmDialog.boundingBox();
      const mobileViewport = page.viewportSize();
      expect(confirmBounds?.x ?? 0).toBeGreaterThanOrEqual(16);
      expect((confirmBounds?.x ?? 0) + (confirmBounds?.width ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual((mobileViewport?.width ?? 0) - 16);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      await confirmDialog.getByRole("button", { name: "Cancel" }).click();
      await expect(confirmDialog).toHaveCount(0);
    }

    if (testInfo.project.name === "desktop") {
      await page.goto("/allies#ally-birth-onboarding");
      await page.getByLabel("Ally name").fill("QA Ally");
      await page.getByLabel("Relationship").fill("Friend");
      await page.getByRole("button", { name: "Next", exact: true }).click();
      const allyDialog = await chooseUnknownBirthMoment(page);
      await page.screenshot({
        path: "apps/astra-web/test-results/birth-date-time-sheet/desktop-ally-sheet.png",
        fullPage: true
      });
      await allyDialog.getByRole("button", { name: "Continue" }).first().click();
      await expect(allyDialog).toHaveCount(0);
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page.getByRole("button", { name: "Order Report", exact: true }).focus();
      await page.keyboard.press("Enter");
      const allyConfirmDialog = page.getByRole("dialog", { name: "Confirm Report" });
      await expect(allyConfirmDialog.getByLabel("Review report order")).toContainText("Name");
      await expect(allyConfirmDialog.getByLabel("Review report order")).not.toContainText("Your name");
      await expect(allyConfirmDialog).toContainText("Current balance");
      await expect(allyConfirmDialog).toContainText("30 Stars");
      await expect(allyConfirmDialog).not.toContainText("Not enough Stars");
      await expect(allyConfirmDialog.getByRole("button", { name: "Order Report" })).toBeVisible();
      await expect(allyConfirmDialog.getByRole("button", { name: "Cancel" })).toBeVisible();
      await allyConfirmDialog.getByRole("button", { name: "Cancel" }).click();
      await expect(allyConfirmDialog).toHaveCount(0);

      await page.goto("/self#self-birth-onboarding");
      await page.getByRole("button", { name: "1 Birth details" }).click();
      await chooseKnownBirthMomentWithoutPlace(page);
      const savedBirthDetails = page.getByRole("button", { name: "Edit birth details" });
      await expect(savedBirthDetails).toContainText("May 23, 1961");
      await expect(savedBirthDetails).toContainText("9:30 AM");
      await expect(savedBirthDetails).toContainText("America/Chicago");
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page.getByRole("button", { name: "Order Report", exact: true }).focus();
      await page.keyboard.press("Enter");
      const timedConfirmDialog = page.getByRole("dialog", { name: "Confirm Report" });
      const timedReportReview = timedConfirmDialog.getByLabel("Review report order");
      await expect(timedReportReview).toContainText("Identity Report");
      await expect(timedReportReview).toContainText("Natal chart");
      await expect(timedReportReview).not.toContainText("9:30");
      await expect(timedReportReview).not.toContainText("America/Chicago");
      await timedConfirmDialog.getByRole("button", { name: "Cancel" }).click();

      await page.getByRole("button", { name: "Switch to dark mode" }).first().click();
      await expect(page.locator("html")).toHaveAttribute("data-astra-theme", "dark");
      await page.goto("/self?start=birth_details#self-birth-onboarding");
      await page.getByRole("button", { name: "Edit birth details" }).click();
      const darkDialog = page.getByRole("dialog", { name: "Birth Details" });
      await expect(darkDialog).toBeVisible();
      await page.screenshot({
        path: "apps/astra-web/test-results/birth-date-time-sheet/desktop-dark-self-sheet.png",
        fullPage: true
      });
      const darkDialogBackground = await darkDialog.evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(darkDialogBackground).not.toBe("rgb(247, 246, 242)");
    }

    const actionablePageErrors = pageErrors.filter(
      (message) =>
        !message.includes("__nextjs_original-stack-frames") &&
        !message.includes("due to access control checks.") &&
        message !== "Load failed"
    );

    expect(consoleMessages).toEqual([]);
    expect(actionablePageErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });
});
