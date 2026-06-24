export type StarPackKey = "core_pack" | "deep_pack" | "explorer_pack";

export const STAR_PACKS: Record<StarPackKey, { label: string; stars: number; priceUsd: number; note: string }> = {
  core_pack: { label: "Starter Stars", stars: 5, priceUsd: 9.99, note: "A focused refill for Core reports." },
  deep_pack: { label: "Deep Sky Stars", stars: 10, priceUsd: 19.99, note: "Enough room for deeper reads." },
  explorer_pack: { label: "Explorer Stars", stars: 30, priceUsd: 59.99, note: "A longer alpha testing run." }
};

export function isStarPackKey(value: string): value is StarPackKey {
  return value === "core_pack" || value === "deep_pack" || value === "explorer_pack";
}

export function starCostForReportType(reportType: string) {
  if (reportType === "identity") return 1;
  if (reportType === "core" || reportType === "core_self" || reportType === "progressed") return 5;
  if (reportType === "deep" || reportType === "synastry") return 10;
  return 0;
}

export function stripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || process.env.STRIPE_SECRET_TEST_KEY?.trim() || "";
}

export function stripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || process.env.STRIPE_WEBHOOK_TEST_SECRET?.trim() || "";
}

export function stripePriceIdForStarPack(packKey: StarPackKey) {
  const normalized = packKey.toUpperCase();
  const secret = stripeSecretKey();
  const preferredMode = secret.startsWith("sk_live_") ? "LIVE" : "TEST";
  const candidates = [
    `STRIPE_PRICE_${normalized}_${preferredMode}`,
    `STRIPE_${preferredMode}_PRICE_${normalized}`,
    `STRIPE_PRICE_${normalized}`,
    `STRIPE_PRICE_${normalized}_TEST`,
    `STRIPE_PRICE_${normalized}_LIVE`,
    `STRIPE_TEST_PRICE_${normalized}`,
    `STRIPE_LIVE_PRICE_${normalized}`
  ];

  for (const key of candidates) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  return "";
}
