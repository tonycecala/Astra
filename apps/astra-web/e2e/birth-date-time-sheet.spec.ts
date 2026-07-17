import { expect, type Page, test } from "@playwright/test";
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
  await page.getByLabel("Name").fill(input.name);
  await page.getByLabel("Email").fill(input.email);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("Code").fill(await readOtpFromMailpit(input.email));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page.locator(".self-profile-name")).toHaveText(input.name);
}

async function chooseUnknownBirthMoment(page: Page) {
  await page.getByRole("button", { name: "Edit birth details" }).click();
  const dialog = page.getByRole("dialog", { name: "Birth Details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Birth moment", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText("Selected", { exact: true })).toHaveCount(0);
  await dialog.getByLabel("Birth year").fill("1961");
  await dialog.getByLabel("Birth month").selectOption({ label: "May" });
  await dialog.getByRole("button", { name: "May 23, 1961" }).click();
  await expect(dialog.getByText("Birth time unknown", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Use a noon chart")).toHaveCount(0);
  await expect(dialog.getByLabel("Time", { exact: true })).toBeEnabled();
  const checkboxBox = await dialog.locator('input[type="checkbox"]').boundingBox();
  const labelBox = await dialog.getByText("Birth time unknown", { exact: true }).boundingBox();
  expect(checkboxBox?.x ?? Number.POSITIVE_INFINITY).toBeLessThan(labelBox?.x ?? 0);
  await dialog.locator('input[type="checkbox"]').check();
  return dialog;
}

async function chooseKnownBirthMomentWithoutPlace(page: Page) {
  await page.getByRole("button", { name: "Edit birth details" }).click();
  const dialog = page.getByRole("dialog", { name: "Birth Details" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Birth year").fill("1961");
  await dialog.getByLabel("Birth month").selectOption({ label: "May" });
  await dialog.getByRole("button", { name: "May 23, 1961" }).click();
  const unknownTimeCheckbox = dialog.locator('input[type="checkbox"]');
  if (await unknownTimeCheckbox.isChecked()) {
    await unknownTimeCheckbox.click();
  }
  const timeInput = dialog.getByLabel("Time", { exact: true });
  const continueButton = dialog.getByRole("button", { name: "Continue" }).first();
  await expect(timeInput).toHaveAttribute("aria-invalid", "true");
  await expect(dialog.getByText("Enter birth time, or turn on Birth time unknown.")).toBeVisible();
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
      if (message.type() === "error" && !message.text().includes("Failed to load resource: the server responded with a status of 404")) {
        consoleMessages.push(message.text());
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (
        response.status() >= 400 &&
        !response.url().includes("/apple-touch-icon") &&
        !response.url().includes("/favicon") &&
        !response.url().includes("gravatar.com/avatar")
      ) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    const name = `Birth Sheet ${testInfo.project.name}`;
    const email = `birth-sheet-${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    await signInWithOtp(page, { email, name });

    await page.goto("/self#self-birth-onboarding");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const selfDialog = await chooseUnknownBirthMoment(page);
    await mkdir("apps/astra-web/test-results/birth-date-time-sheet", { recursive: true });
    await page.screenshot({
      path: `apps/astra-web/test-results/birth-date-time-sheet/${testInfo.project.name}-self-sheet.png`,
      fullPage: true
    });
    await selfDialog.getByRole("button", { name: "Continue" }).first().click();
    await expect(selfDialog).toHaveCount(0);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Step 3 of 3: Report")).toBeVisible();
    await page.getByRole("button", { name: "Order Report", exact: true }).focus();
    await page.keyboard.press("Enter");
    const confirmDialog = page.getByRole("dialog", { name: "Confirm Report" });
    const reportReview = confirmDialog.getByLabel("Review report order");
    await expect(reportReview).toContainText("Identity Report");
    await expect(reportReview).toContainText("Natal chart");
    await expect(reportReview).toContainText("Tropical");
    await expect(reportReview).toContainText("Whole Sign");
    await expect(reportReview).not.toContainText("1961-05-23");
    await expect(reportReview).not.toContainText("Birth time unknown");
    await confirmDialog.getByRole("button", { name: "Cancel" }).click();

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow).toBe(false);

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
      await page.getByRole("button", { name: "Next", exact: true }).click();
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

    const actionablePageErrors = pageErrors.filter((message) => !message.includes("__nextjs_original-stack-frames") && message !== "Load failed");

    expect(consoleMessages).toEqual([]);
    expect(actionablePageErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });
});
