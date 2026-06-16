import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { prepareComposerOnboardingCardsBatch } from "../apps/composer-web/src/index";
import {
  closeDatabaseConnection,
  db,
  getUserFeedItemById,
  listUserFeedItems,
  sourceCards,
  user,
  userFeedItems
} from "@astra/db";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
const runId = `composer_onboarding_${Date.now()}`;
const email = clean(process.env.ASTRA_COMPOSER_ONBOARDING_SMOKE_EMAIL) || `${runId}@example.com`;
const name = clean(process.env.ASTRA_COMPOSER_ONBOARDING_SMOKE_NAME) || "Composer Onboarding Smoke";
const now = new Date().toISOString();
const targetUserB = `${runId}_user_b`;

let cookieHeader = "";
let targetUserA = "";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

if (!internalToken) {
  throw new Error("ASTRA_INTERNAL_API_TOKEN is required for the Composer onboarding cards smoke.");
}

function appendCookies(headers: Headers) {
  const raw = headers.get("set-cookie");
  if (!raw) return;

  const cookies = raw
    .split(/,(?=[^;,]+=)/)
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean);

  const existing = new Map(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, rest.join("=")] as const;
      })
  );

  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key) existing.set(key, rest.join("="));
  }

  cookieHeader = [...existing.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function requestJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("origin", appBaseUrl);
  if (cookieHeader) headers.set("cookie", cookieHeader);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, { ...init, headers });
  appendCookies(response.headers);

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}: ${text}`);
  }

  return text ? (JSON.parse(text) as JsonObject) : {};
}

async function requestText(url: string, cookie = cookieHeader) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(url, { headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}: ${text}`);
  }
  return text;
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

async function signInSmokeUser() {
  await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
    method: "POST",
    body: JSON.stringify({ email, type: "sign-in" })
  });

  await requestJson(`${authBaseUrl}/sign-in/email-otp`, {
    method: "POST",
    body: JSON.stringify({ email, otp: await readOtp(), name })
  });

  const session = await requestJson(`${authBaseUrl}/get-session`);
  const sessionUser = session.user as JsonObject | undefined;
  const userId = typeof sessionUser?.id === "string" ? sessionUser.id : "";
  if (!userId) throw new Error("Composer onboarding smoke did not create an authenticated user.");
  return userId;
}

async function insertUser(id: string, userEmail: string) {
  await db.insert(user).values({
    id,
    name: id,
    email: userEmail,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

try {
  const publicHtml = await requestText(`${appBaseUrl}/journey`, "");
  if (
    !publicHtml.includes("Public fallback") ||
    !publicHtml.includes("12 cards") ||
    !publicHtml.includes("Cleopatra: image, strategy, and survival")
  ) {
    throw new Error("Signed-out Journey did not render the twelve-card public preview from the Composer inventory.");
  }
  if (publicHtml.includes("Welcome to Astra")) {
    throw new Error("Signed-out public Journey leaked private onboarding card copy.");
  }

  targetUserA = await signInSmokeUser();
  await insertUser(targetUserB, `${targetUserB}@example.com`);

  const firstRunPrivateHtml = await requestText(`${appBaseUrl}/journey`);
  if (
    !firstRunPrivateHtml.includes("Private journey") ||
    !firstRunPrivateHtml.includes("Composer will generate your onboarding cards")
  ) {
    throw new Error("Signed-in first-run Journey did not show the Composer onboarding state before publish.");
  }
  if (firstRunPrivateHtml.includes("Cleopatra: image, strategy, and survival")) {
    throw new Error("Signed-in first-run Journey must not copy public preview cards.");
  }

  const prepared = prepareComposerOnboardingCardsBatch({
    targetUserId: targetUserA,
    batchId: `${runId}_batch`,
    createdAt: now
  });
  if (!prepared.ok) {
    throw new Error(`Composer onboarding batch rejected valid cards: ${JSON.stringify(prepared.issues)}`);
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await requestJson(`${appBaseUrl}/api/composer/onboarding-cards`, {
      method: "POST",
      headers: { "x-astra-internal-token": internalToken },
      body: JSON.stringify(prepared.batch)
    });
    const batch = response.batch as JsonObject | undefined;
    const writes = Array.isArray(batch?.writes) ? batch.writes : [];
    if (batch?.targetUserId !== targetUserA || writes.length !== prepared.batch.cards.length) {
      throw new Error("Composer onboarding API did not return the expected user-owned batch.");
    }
  }

  const feedA = await listUserFeedItems(db, { userId: targetUserA, state: "available", limit: 20 });
  for (const card of prepared.batch.cards) {
    if (!feedA.items.some((item) => item.id === card.feedItem.id && item.title === card.feedItem.title)) {
      throw new Error(`Target user private feed did not include onboarding card: ${card.feedItem.title}`);
    }
  }

  for (const card of prepared.batch.cards) {
    const forgedRead = await getUserFeedItemById(db, { userId: targetUserB, feedItemId: card.feedItem.id ?? "" });
    if (forgedRead) throw new Error("Another user could read a Composer onboarding card.");
  }

  const feedB = await listUserFeedItems(db, { userId: targetUserB, state: "available", limit: 20 });
  if (feedB.items.some((item) => prepared.batch.cards.some((card) => card.feedItem.id === item.id || card.feedItem.title === item.title))) {
    throw new Error("Another user's private feed listed Composer onboarding cards.");
  }

  const publicAfterHtml = await requestText(`${appBaseUrl}/journey`, "");
  if (publicAfterHtml.includes("Welcome to Astra")) {
    throw new Error("Signed-out public Journey leaked onboarding cards after publish.");
  }

  const privateHtml = await requestText(`${appBaseUrl}/journey`);
  if (!privateHtml.includes("Private journey") || !privateHtml.includes("Composer is shaping this Journey") || !privateHtml.includes("Welcome to Astra")) {
    throw new Error("Signed-in Journey did not render the Composer onboarding cards.");
  }
} finally {
  const prepared = prepareComposerOnboardingCardsBatch({
    targetUserId: targetUserA || "__cleanup__",
    batchId: `${runId}_cleanup`,
    createdAt: now
  });
  if (prepared.ok) {
    for (const card of prepared.batch.cards) {
      await db.delete(userFeedItems).where(eq(userFeedItems.id, card.feedItem.id ?? ""));
      await db.delete(sourceCards).where(eq(sourceCards.id, card.feedItem.sourceCardId ?? ""));
    }
  }
  await db.delete(user).where(eq(user.id, targetUserB));
  await db.delete(user).where(eq(user.email, email));
  await closeDatabaseConnection();
}

console.log(`Composer onboarding cards smoke passed: ${runId}.`);
