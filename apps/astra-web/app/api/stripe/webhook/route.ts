import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { completeStripeCheckoutPurchase, db, recordStripeEvent } from "@astra/db";
import { isStarPackKey, stripeWebhookSecret } from "../../../../lib/stars";

export const dynamic = "force-dynamic";

type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      amount_total?: number;
      currency?: string;
      customer?: string;
      id?: string;
      client_reference_id?: string;
      metadata?: Record<string, string | undefined>;
      payment_intent?: string;
    };
  };
};

function signatureParts(signature: string) {
  return Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
}

function validStripeSignature(rawBody: string, signature: string | null) {
  const secret = stripeWebhookSecret();
  if (!secret || !signature) return false;
  const parts = signatureParts(signature);
  if (!parts.t || !parts.v1) return false;

  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(parts.v1);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validStripeSignature(rawBody, request.headers.get("stripe-signature"))) {
    return NextResponse.json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  const object = event.data?.object;
  if (!event.id || !object) return NextResponse.json({ ok: false, error: "INVALID_STRIPE_EVENT" }, { status: 400 });

  const recorded = await recordStripeEvent(db, {
    eventId: event.id,
    eventType: event.type ?? "unknown",
    objectId: object.id ?? null,
    rawEvent: event as Record<string, unknown>
  });
  if (!recorded.inserted) return NextResponse.json({ ok: true, duplicate: true });

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, skipped: event.type ?? "unknown" });
  }

  const productKey = object?.metadata?.product_key ?? "";
  const userId = object?.metadata?.astra_user_id ?? object?.client_reference_id ?? "";
  const checkoutSessionId = object?.id ?? "";
  const amount = Number.parseInt(object?.metadata?.stars ?? "0", 10);

  if (!isStarPackKey(productKey) || !userId || !checkoutSessionId || !Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: "INVALID_STAR_PACK_EVENT" }, { status: 400 });
  }

  const result = await completeStripeCheckoutPurchase(db, {
    amount,
    amountMinor: object.amount_total ?? null,
    checkoutSessionId,
    currency: object.currency ?? null,
    customerId: object.customer ?? null,
    eventId: event.id,
    paymentIntentId: object.payment_intent ?? null,
    productKey,
    rawEvent: event as Record<string, unknown>,
    userId
  });

  return NextResponse.json({ ok: true, ...result });
}
