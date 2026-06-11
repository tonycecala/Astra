import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", heading: "A living stream" },
  { path: "/journey", heading: "A living stream" },
  { path: "/allies", heading: "Companions with clear names" },
  { path: "/self", heading: "Astra Founder" },
  { path: "/library", heading: "Artifacts worth keeping" },
  { path: "/gifts", heading: "Stars stay accountable" },
  { path: "/login", heading: "Better Auth boundary" }
];

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

  test("primary journey reaches adjacent clean-start areas", async ({ page }) => {
    await page.goto("/journey");
    await page.locator('a[href="/allies"]:visible').click();
    await expect(page.getByRole("heading", { name: "Companions with clear names" })).toBeVisible();
    await page.locator('a[href="/self"]:visible').click();
    await expect(page.getByRole("heading", { name: "Astra Founder" })).toBeVisible();
  });

  test("reader filters lanes and opens card detail", async ({ page }) => {
    await page.goto("/journey");
    await page.getByRole("tab", { name: "Practice" }).click();
    await expect(page.getByRole("button", { name: /Three Quiet Breaths/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /The River Keeps Moving/ })).toHaveCount(0);
    await page.getByRole("button", { name: /Three Quiet Breaths/ }).click();
    await expect(page.getByLabel("Card detail")).toContainText("Three Quiet Breaths");
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
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });
});
