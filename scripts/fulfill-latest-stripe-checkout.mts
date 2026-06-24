import { createHmac } from "node:crypto";
import { appUserProfiles, db, getCreditBalance, purchases } from "@astra/db";
import { and, desc, eq } from "drizzle-orm";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const email = clean(process.env.ASTRA_STRIPE_FULFILL_EMAIL) || "astra-report-parity@example.com";
const webhookSecret = clean(process.env.STRIPE_WEBHOOK_SECRET) || clean(process.env.STRIPE_WEBHOOK_TEST_SECRET);

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function signedStripeHeader(rawBody: string) {
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_TEST_SECRET is required.");
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", webhookSecret).update(`${timestamp}.${rawBody}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

const [profile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
if (!profile) throw new Error(`No profile found for ${email}.`);

const [purchase] = await db
  .select()
  .from(purchases)
  .where(and(eq(purchases.userId, profile.userId), eq(purchases.status, "pending")))
  .orderBy(desc(purchases.createdAt))
  .limit(1);

if (!purchase?.stripeCheckoutSessionId) throw new Error(`No pending Stripe checkout found for ${email}.`);

const productKey = typeof purchase.rawEvent === "object" && purchase.rawEvent && !Array.isArray(purchase.rawEvent) ? String((purchase.rawEvent as JsonObject).productKey ?? "core_pack") : "core_pack";
const stars = productKey === "explorer_pack" ? 30 : productKey === "deep_pack" ? 10 : 5;
const before = await getCreditBalance(db, profile.userId);
const eventId = `evt_local_${purchase.stripeCheckoutSessionId.replace(/[^a-zA-Z0-9]/g, "_")}`;
const event = {
  id: eventId,
  type: "checkout.session.completed",
  data: {
    object: {
      amount_total: purchase.amountMinor ?? null,
      client_reference_id: profile.userId,
      currency: purchase.currency ?? "usd",
      customer: "cus_local_alpha_checkout",
      id: purchase.stripeCheckoutSessionId,
      metadata: {
        astra_user_id: profile.userId,
        product_key: productKey,
        product_type: "star_pack",
        stars: String(stars)
      },
      payment_intent: "pi_local_alpha_checkout"
    }
  }
};

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
const payload = text ? (JSON.parse(text) as JsonObject) : {};
const after = await getCreditBalance(db, profile.userId);

console.log(
  JSON.stringify(
    {
      after,
      before,
      checkoutSessionId: purchase.stripeCheckoutSessionId,
      email,
      eventId,
      payload,
      productKey,
      stars
    },
    null,
    2
  )
);
process.exit(0);
