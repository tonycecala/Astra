import { createHmac } from "node:crypto";
import { creditLedgerEntries, db, getCreditBalance, purchases, stripeEvents } from "@astra/db";
import { eq } from "drizzle-orm";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const email = clean(process.env.ASTRA_STRIPE_WEBHOOK_SMOKE_EMAIL) || `stripe-webhook-smoke-${Date.now()}@example.com`;
const name = clean(process.env.ASTRA_STRIPE_WEBHOOK_SMOKE_NAME) || "Astra Stripe Webhook Smoke";
const webhookSecret = clean(process.env.STRIPE_WEBHOOK_SECRET) || clean(process.env.STRIPE_WEBHOOK_TEST_SECRET);

let cookieHeader = "";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
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
  if (!response.ok) throw new Error(`${url} failed with ${response.status}: ${text}`);
  return text ? (JSON.parse(text) as JsonObject) : {};
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

async function readOtpFromMailpit() {
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

  throw new Error(`No OTP found in Mailpit for ${email}.`);
}

function signedStripeHeader(rawBody: string) {
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_TEST_SECRET is required.");
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", webhookSecret).update(`${timestamp}.${rawBody}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

async function postStripeWebhook(event: JsonObject) {
  const rawBody = JSON.stringify(event);
  const response = await fetch(`${appBaseUrl}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signedStripeHeader(rawBody)
    },
    body: rawBody
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Webhook failed with ${response.status}: ${text}`);
  return text ? (JSON.parse(text) as JsonObject) : {};
}

await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
  method: "POST",
  body: JSON.stringify({ email, type: "sign-in" })
});
await requestJson(`${authBaseUrl}/sign-in/email-otp`, {
  method: "POST",
  body: JSON.stringify({ email, otp: await readOtpFromMailpit(), name })
});
await requestJson(`${appBaseUrl}/api/reports`);

const session = await requestJson(`${appBaseUrl}/api/billing/create-checkout-session`, {
  method: "POST",
  body: JSON.stringify({
    productKey: "core_pack",
    successUrl: `${appBaseUrl}/stars?checkout=success`,
    cancelUrl: `${appBaseUrl}/stars?checkout=cancelled`
  })
});

const checkoutSessionId = String(session.checkoutSessionId ?? "");
if (!checkoutSessionId) throw new Error(`Checkout session was not created: ${JSON.stringify(session)}`);

const [pendingPurchase] = await db.select().from(purchases).where(eq(purchases.stripeCheckoutSessionId, checkoutSessionId)).limit(1);
if (!pendingPurchase || pendingPurchase.status !== "pending") throw new Error(`Missing pending purchase row for ${checkoutSessionId}.`);

const startingBalance = await getCreditBalance(db, pendingPurchase.userId);
const eventId = `evt_local_${checkoutSessionId.replace(/[^a-zA-Z0-9]/g, "_")}`;
const event = {
  id: eventId,
  type: "checkout.session.completed",
  data: {
    object: {
      amount_total: pendingPurchase.amountMinor ?? 500,
      client_reference_id: pendingPurchase.userId,
      currency: pendingPurchase.currency ?? "usd",
      customer: "cus_local_webhook_smoke",
      id: checkoutSessionId,
      metadata: {
        astra_user_id: pendingPurchase.userId,
        product_key: "core_pack",
        product_type: "star_pack",
        stars: "5"
      },
      payment_intent: "pi_local_webhook_smoke"
    }
  }
};

const fulfilled = await postStripeWebhook(event);
if (fulfilled.ok !== true || Number(fulfilled.balance) !== startingBalance + 5) {
  throw new Error(`Webhook did not fulfill expected balance: ${JSON.stringify(fulfilled)}`);
}

const duplicate = await postStripeWebhook(event);
if (duplicate.ok !== true || duplicate.duplicate !== true) {
  throw new Error(`Duplicate webhook was not idempotent: ${JSON.stringify(duplicate)}`);
}

const purchaseRows = await db.select().from(purchases).where(eq(purchases.stripeCheckoutSessionId, checkoutSessionId));
if (purchaseRows.length !== 1 || purchaseRows[0]?.status !== "paid") {
  throw new Error(`Webhook did not mark purchase paid for ${checkoutSessionId}.`);
}

const ledgerRows = await db.select().from(creditLedgerEntries).where(eq(creditLedgerEntries.stripeCheckoutSessionId, checkoutSessionId));
if (ledgerRows.length !== 1 || ledgerRows[0]?.amount !== 5) {
  throw new Error(`Webhook did not create exactly one 5-Star ledger entry for ${checkoutSessionId}.`);
}

const eventRows = await db.select().from(stripeEvents).where(eq(stripeEvents.id, eventId));
if (eventRows.length !== 1) throw new Error(`Webhook event ${eventId} was not recorded.`);

const endingBalance = await getCreditBalance(db, pendingPurchase.userId);
if (endingBalance !== startingBalance + 5) {
  throw new Error(`Expected final balance ${startingBalance + 5}; found ${endingBalance}.`);
}

console.log(`Stripe webhook fulfillment smoke passed for ${email}: ${checkoutSessionId}, balance ${startingBalance} -> ${endingBalance}.`);
process.exit(0);
