import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { eq } from "drizzle-orm";
import { prepareComposerOnboardingCardsBatch } from "../apps/composer-web/src/index";
import { closeDatabaseConnection, db, sourceCards, user, userFeedItems } from "@astra/db";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
const runId = `composer_onboarding_mobile_${Date.now()}`;
const email = `${runId}@example.com`;
const now = new Date().toISOString();

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

if (!internalToken) {
  throw new Error("ASTRA_INTERNAL_API_TOKEN is required for the Composer onboarding mobile smoke.");
}

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

async function readOtpFromFileCapture() {
  const outboxDir = clean(process.env.ASTRA_EMAIL_CAPTURE_DIR) || ".astra-email";
  const text = await readFile(join(outboxDir, "outbox.jsonl"), "utf8");
  const rows = text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as JsonObject)
    .reverse();

  const row = rows.find((candidate) => candidate.to === email);
  const otp = findOtp(row);
  if (!otp) throw new Error(`No OTP found in file capture for ${email}.`);
  return otp;
}

async function readOtpFromMailpit() {
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

async function readOtp() {
  if (clean(process.env.ASTRA_EMAIL_DELIVERY) === "file") return readOtpFromFileCapture();
  return readOtpFromMailpit();
}

async function assertNoOverflow(page: import("@playwright/test").Page, label: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error(`${label} had document-level horizontal overflow on mobile.`);
}

async function findUserIdByEmail(userEmail: string) {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, userEmail)).limit(1);
  const userId = row?.id ?? "";
  if (!userId) throw new Error(`No Better Auth user found for ${userEmail}.`);
  return userId;
}

async function postOnboardingBatch(targetUserId: string) {
  const prepared = prepareComposerOnboardingCardsBatch({
    targetUserId,
    batchId: `${runId}_batch`,
    createdAt: now
  });
  if (!prepared.ok) throw new Error(`Composer onboarding batch failed: ${JSON.stringify(prepared.issues)}`);

  const response = await fetch(`${appBaseUrl}/api/composer/onboarding-cards`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-astra-internal-token": internalToken
    },
    body: JSON.stringify(prepared.batch)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Composer onboarding API failed with ${response.status}: ${text}`);
  return prepared.batch;
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const page = await context.newPage();
const errors: string[] = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

let targetUserId = "";

try {
  await page.goto(`${appBaseUrl}/journey`);
  await page.locator(".status-strip").getByText("Public fallback").waitFor();
  await page.locator(".status-strip").getByText("12 cards").waitFor();
  await page.locator(".stream-card-open").filter({ hasText: "Cleopatra: image" }).waitFor();
  if (await page.getByText("Welcome to Astra").count()) {
    throw new Error("Mobile signed-out Journey leaked Composer onboarding cards.");
  }
  await assertNoOverflow(page, "Mobile signed-out Journey");

  await page.goto(`${appBaseUrl}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByText("Check email for the sign-in code").waitFor();
  await page.getByLabel("Code").fill(await readOtp());
  await page.getByRole("button", { name: "Verify code" }).click();
  await page.getByText("Signed in").waitFor();

  targetUserId = await findUserIdByEmail(email);

  await page.goto(`${appBaseUrl}/journey`);
  await page.locator(".status-strip").getByText("Private journey").waitFor();
  await page.getByText("Composer will generate your onboarding cards").waitFor();
  if (await page.getByText("Cleopatra: image, strategy, and survival").count()) {
    throw new Error("Mobile signed-in first-run Journey copied public preview cards.");
  }
  await assertNoOverflow(page, "Mobile signed-in first-run Journey");

  const batch = await postOnboardingBatch(targetUserId);
  await page.reload();
  await page.locator(".status-strip").getByText("Private journey").waitFor();
  await page.locator(".status-strip").getByText("5 cards").waitFor();
  await page.locator(".stream-card-open").filter({ hasText: "Welcome to Astra" }).waitFor();
  if (await page.locator(".status-strip").getByText("Public fallback").count()) {
    throw new Error("Mobile signed-in Journey showed public fallback after Composer onboarding publish.");
  }
  await assertNoOverflow(page, "Mobile signed-in Composer onboarding Journey");

  if (errors.length) throw new Error(`Mobile Composer onboarding browser errors: ${errors.join(" | ")}`);

  console.log(`Composer onboarding mobile smoke passed: ${runId}.`);

  for (const card of batch.cards) {
    await db.delete(userFeedItems).where(eq(userFeedItems.id, card.feedItem.id ?? ""));
    await db.delete(sourceCards).where(eq(sourceCards.id, card.feedItem.sourceCardId ?? ""));
  }
} finally {
  await context.close();
  await browser.close();
  await db.delete(user).where(eq(user.email, email));
  await closeDatabaseConnection();
}
