import { expect, test } from "@playwright/test";

type JsonObject = Record<string, unknown>;

const routes = [
  { path: "/", heading: "A living stream" },
  { path: "/journey", heading: "A living stream" },
  { path: "/allies", heading: "Companions with clear names" },
  { path: "/self", heading: "Sign in to see your Astra" },
  { path: "/library", heading: "Artifacts worth keeping" },
  { path: "/gifts", heading: "Stars stay accountable" },
  { path: "/login", heading: "Email code sign-in" }
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

test.describe("clean-start routes", () => {
  for (const route of routes) {
    test(`${route.path} renders without console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
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

  test("primary journey reaches adjacent clean-start areas", async ({ page }) => {
    await page.goto("/journey");
    await page.locator('a[href="/allies"]:visible').click();
    await expect(page.getByRole("heading", { name: "Companions with clear names" })).toBeVisible();
    await page.locator('a[href="/self"]:visible').click();
    await expect(page.getByRole("heading", { name: "Sign in to see your Astra" })).toBeVisible();
  });

  test("reader filters lanes and opens card detail", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.locator(".status-strip").getByText("Public fallback")).toBeVisible();
    await expect(page.getByLabel("Journey state")).toContainText("A public sample, not your private Journey");
    await page.getByRole("tab", { name: "Practice" }).click();
    await expect(page.getByRole("button", { name: /Three Quiet Breaths/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /The River Keeps Moving/ })).toHaveCount(0);
    await page.getByRole("button", { name: /Three Quiet Breaths/ }).click();
    await expect(page.getByLabel("Card detail")).toContainText("Three Quiet Breaths");
  });

  test("reader surfaces report-signal metadata", async ({ page }) => {
    await page.goto("/journey");
    await page.getByRole("tab", { name: "Know yourself" }).click();
    await page.getByRole("button", { name: /Report Signal Card/ }).click();
    await expect(page.getByLabel("Card detail")).toContainText("Report Signal Card");
    await expect(page.getByLabel("Card metadata")).toContainText("Report signal");
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

  test("signed-in self onboarding queues chart and report requests", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The auth-backed onboarding journey is covered once; route layout is covered on every viewport.");

    const email = `self-onboarding-${Date.now()}@example.com`;
    const name = "Astra Onboarding Smoke";

    await page.goto("/login");
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByText("Check email for the sign-in code")).toBeVisible();

    await page.getByLabel("Code").fill(await readOtpFromMailpit(email));
    await page.getByRole("button", { name: "Verify code" }).click();
    await expect(page.getByText("Signed in")).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue to Self" })).toBeVisible();

    await page.goto("/journey");
    await expect(page.locator(".status-strip").getByText("Private journey")).toBeVisible();
    await expect(page.getByLabel("Journey state")).toContainText("Composer will generate your onboarding cards");
    await expect(page.getByRole("heading", { name: "No cards in this lane" })).toBeVisible();

    await page.goto("/self");
    await page.reload();
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Build the first report request" })).toBeVisible();
    await expect(page.getByLabel("Alpha onboarding guidance")).toContainText("Subject and birth date are enough");
    await expect(page.getByText("Step 1 of 5: Subject")).toBeVisible();
    await expect(page.getByLabel("Chart generation flow")).toContainText("Birth data");
    await expect(page.getByLabel("Chart generation flow")).toContainText("Saved in Library");

    const nextButton = page.getByRole("button", { exact: true, name: "Next" });
    await nextButton.click();
    await page.getByLabel("Birth date").fill("1961-05-23");
    await nextButton.click();
    await expect(page.getByText("Date-only is valid")).toBeVisible();
    await page.getByLabel("Time and place").check();
    await page.getByLabel("Search birth place").fill("New");
    await page.getByRole("button", { exact: true, name: "Search" }).click();
    await page.getByRole("button", { name: /New York, NY, USA/ }).click();
    await page.getByLabel("Birth time (optional)").fill("09:30");
    await nextButton.click();
    await page.getByLabel("Question (optional)").fill("What pattern should Astra preserve?");
    await page.getByLabel("Intent (optional)").fill("self-onboarding-e2e");
    await page.getByLabel("Context (optional)").fill("Desktop e2e onboarding proof.");
    await nextButton.click();

    await expect(page.getByLabel("Review birth data")).toContainText("1961-05-23");
    await expect(page.getByLabel("Review birth data")).toContainText("New York, NY, USA");
    await page.locator('section[aria-label="Birth data onboarding"] form button[type="submit"]').click();
    const onboarding = page.locator('section[aria-label="Birth data onboarding"]');
    await expect(onboarding.getByRole("heading", { name: "Recent chart requests" })).toBeVisible();
    await expect(onboarding.getByRole("heading", { name: "Report status" })).toBeVisible();
    await expect(onboarding).toContainText(name);
    await expect(onboarding).toContainText("queued");
    await onboarding.getByRole("button", { exact: true, name: "Generate" }).click();
    await expect(onboarding).toContainText("Report generated");
    await expect(onboarding).toContainText("completed");
    await expect(onboarding).toContainText("Gemini Sun, Virgo Moon, Cancer rising");
    await expect(onboarding.getByLabel("Chart generation flow")).toContainText("Saved in Library");
    const reportReader = page.getByLabel("Private report reader");
    await expect(reportReader).toContainText("Generated reports are saved to Library automatically");
    await expect(reportReader).toContainText("Core pattern");
    await expect(reportReader).toContainText("Writer handoff");
    await expect(reportReader).toContainText("no LLM call, no paid provider, no credit spend");
    await expect(reportReader).toContainText("Provenance");
    await expect(reportReader.getByRole("link", { name: "Open Library" })).toBeVisible();
    await reportReader.getByRole("button", { exact: true, name: "Publish signal" }).click();
    await expect(onboarding).toContainText("Report signal published to Journey");

    await page.goto("/library");
    await expect(page.getByRole("heading", { name: "Artifacts worth keeping" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Gemini Sun, Virgo Moon, Cancer rising/ })).toBeVisible();
    await expect(page.getByText("report", { exact: true })).toBeVisible();

    await page.goto("/journey");
    await expect(page.locator(".status-strip").getByText("Private journey")).toBeVisible();
    await expect(page.getByLabel("Journey state")).toContainText("Composer is shaping this Journey");
    await page.getByRole("tab", { name: "Know yourself" }).click();
    const generatedSignals = page.locator(".stream-card-open").filter({ hasText: "Gemini Sun, Virgo Moon, Cancer rising" });
    expect(await generatedSignals.count()).toBeGreaterThan(0);
    await generatedSignals.first().click();
    await expect(page.getByLabel("Card metadata")).toContainText("Private journey");
    await expect(page.getByLabel("Card metadata")).toContainText("Available");
  });
});
