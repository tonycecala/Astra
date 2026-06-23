import { creditLedgerEntries, db, purchases } from "@astra/db";
import { eq } from "drizzle-orm";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const email = clean(process.env.ASTRA_STRIPE_SMOKE_EMAIL) || `stripe-smoke-${Date.now()}@example.com`;
const name = clean(process.env.ASTRA_STRIPE_SMOKE_NAME) || "Astra Stripe Smoke";

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

await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
  method: "POST",
  body: JSON.stringify({ email, type: "sign-in" })
});
await requestJson(`${authBaseUrl}/sign-in/email-otp`, {
  method: "POST",
  body: JSON.stringify({ email, otp: await readOtpFromMailpit(), name })
});
await requestJson(`${appBaseUrl}/api/reports`);

const checkout = await requestJson(`${appBaseUrl}/api/billing/create-checkout-session`, {
  method: "POST",
  body: JSON.stringify({
    productKey: "core_pack",
    successUrl: `${appBaseUrl}/stars?checkout=success`,
    cancelUrl: `${appBaseUrl}/stars?checkout=cancelled`
  })
});

const checkoutSessionId = String(checkout.checkoutSessionId ?? "");
const checkoutUrl = String(checkout.url ?? "");
if (!checkoutSessionId || !checkoutUrl.includes("checkout.stripe.com")) {
  throw new Error(`Stripe checkout did not return a valid checkout session: ${JSON.stringify(checkout)}`);
}

const purchaseRows = await db.select().from(purchases).where(eq(purchases.stripeCheckoutSessionId, checkoutSessionId));
if (purchaseRows.length !== 1 || purchaseRows[0]?.status !== "pending") {
  throw new Error(`Checkout did not record one pending purchase row for ${checkoutSessionId}.`);
}

const ledgerRows = await db.select().from(creditLedgerEntries).where(eq(creditLedgerEntries.stripeCheckoutSessionId, checkoutSessionId));
if (ledgerRows.length !== 0) {
  throw new Error("Checkout creation granted Stars before verified webhook completion.");
}

console.log(`Stripe checkout smoke passed for ${email}: ${checkoutSessionId}.`);
process.exit(0);
