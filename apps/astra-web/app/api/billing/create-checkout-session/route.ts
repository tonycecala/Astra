import { NextResponse } from "next/server";
import { db, recordPendingStripeCheckout } from "@astra/db";
import { STAR_PACKS, isStarPackKey, stripePriceIdForStarPack, stripeSecretKey } from "../../../../lib/stars";
import { getAstraAuthContext } from "../../../../lib/auth/profile";

export const dynamic = "force-dynamic";

type StripeCheckoutResponse = {
  amount_total?: number;
  currency?: string;
  error?: { message?: string };
  id?: string;
  url?: string;
};

export async function POST(request: Request) {
  const { profile, session } = await getAstraAuthContext();
  if (!profile || !session?.user) return NextResponse.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });

  const payload = (await request.json()) as { cancelUrl?: string; productKey?: string; successUrl?: string };
  const productKey = String(payload.productKey ?? "");
  if (!isStarPackKey(productKey)) {
    return NextResponse.json({ ok: false, error: "INVALID_STAR_PACK" }, { status: 400 });
  }

  const secretKey = stripeSecretKey();
  if (!secretKey) return NextResponse.json({ ok: false, error: "STRIPE_NOT_CONFIGURED" }, { status: 400 });

  const priceId = stripePriceIdForStarPack(productKey);
  if (!priceId) return NextResponse.json({ ok: false, error: "STRIPE_PRICE_MISSING" }, { status: 400 });

  const origin = new URL(request.url).origin;
  const pack = STAR_PACKS[productKey];
  const body = new URLSearchParams({
    mode: "payment",
    success_url: payload.successUrl || `${origin}/stars?checkout=success`,
    cancel_url: payload.cancelUrl || `${origin}/stars?checkout=cancelled`,
    client_reference_id: profile.userId,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[astra_user_id]": profile.userId,
    "metadata[astra_profile_id]": profile.id,
    "metadata[astra_auth_user_id]": session.user.id,
    "metadata[product_key]": productKey,
    "metadata[product_type]": "star_pack",
    "metadata[stars]": String(pack.stars)
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const stripePayload = (await response.json()) as StripeCheckoutResponse;

  if (!response.ok || !stripePayload.id || !stripePayload.url) {
    return NextResponse.json({ ok: false, error: stripePayload.error?.message ?? "STRIPE_CHECKOUT_FAILED" }, { status: 400 });
  }

  await recordPendingStripeCheckout(db, {
    amountMinor: stripePayload.amount_total ?? null,
    checkoutSessionId: stripePayload.id,
    currency: stripePayload.currency ?? null,
    productKey,
    userId: profile.userId
  });

  return NextResponse.json({ ok: true, checkoutSessionId: stripePayload.id, url: stripePayload.url });
}
