import { expect, test } from "@playwright/test";
import { appUserProfiles, createChartMakerRequest, db, listUserFeedItems } from "@astra/db";
import { eq } from "drizzle-orm";
import { createAuthenticatedContext } from "./support/auth-session";

test("focus remains private and non-customer arrivals create no starter @auth @journey @release", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Persistence and role boundaries are viewport-independent.");
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const customer = await createAuthenticatedContext(browser, { email: `focus-private-${suffix}@example.com`, name: "Private Focus" });
  const other = await createAuthenticatedContext(browser, { email: `focus-other-${suffix}@example.com`, name: "Other Explorer" });
  const privateQuestion = "This question must remain in my private profile and request.";

  const save = await customer.page.request.patch("/api/profile/focus", {
    data: { status: "selected", key: "self_understanding", question: privateQuestion }
  });
  expect(save.ok()).toBe(true);
  const [customerProfile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.userId, customer.userId)).limit(1);
  const [otherProfile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.userId, other.userId)).limit(1);
  expect(JSON.stringify(customerProfile?.metadata)).toContain(privateQuestion);
  expect(JSON.stringify(otherProfile?.metadata)).not.toContain(privateQuestion);

  for (const role of ["operator", "admin"] as const) {
    const actor = await createAuthenticatedContext(browser, { email: `focus-${role}-${suffix}@example.com`, name: `${role} focus` });
    await db.update(appUserProfiles).set({ role, updatedAt: new Date() }).where(eq(appUserProfiles.userId, actor.userId));
    const focusResponse = await actor.page.request.patch("/api/profile/focus", { data: { status: "skipped" } });
    expect(focusResponse.ok()).toBe(true);
    const chart = await createChartMakerRequest(db, {
      userId: actor.userId,
      subjectName: `${role} focus`,
      birthData: { date: "1984-01-24", birthTimeKnown: false, timezone: "UTC" },
      context: {
        subject: { subjectType: "self", displayName: `${role} focus` },
        chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
        explorerFocus: { schemaVersion: 1, status: "skipped" }
      },
      source: "self"
    });
    const arrival = await actor.page.request.post("/api/chart-arrivals", { data: { chartRequestId: chart.id } });
    expect(arrival.status()).toBe(201);
    const complete = await actor.page.request.post(`/api/chart-arrivals/${encodeURIComponent(chart.id)}/complete`);
    expect(complete.ok()).toBe(true);
    const feed = await listUserFeedItems(db, { userId: actor.userId, state: "available", limit: 20 });
    expect(feed.items.filter((item) => item.reasonCode === "focus_first_exploration")).toHaveLength(0);
    await actor.context.close();
  }

  await customer.context.close();
  await other.context.close();
});
