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
});
