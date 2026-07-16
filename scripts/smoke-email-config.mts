import assert from "node:assert/strict";
import { resolveEmailDeliveryConfig } from "../apps/astra-web/lib/email/config";

const preview = resolveEmailDeliveryConfig({
  VERCEL_ENV: "preview",
  ASTRA_EMAIL_DELIVERY: "resend",
  ASTRA_EMAIL_FROM: "Astra <hello@updates.astraportrait.com>",
  RESEND_PREVIEW: "re_preview"
});
assert.deepEqual(preview, {
  mode: "resend",
  from: "Astra <hello@updates.astraportrait.com>",
  apiKey: "re_preview"
});

const production = resolveEmailDeliveryConfig({
  VERCEL_ENV: "production",
  ASTRA_EMAIL_FROM: "Astra <hello@updates.astraportrait.com>",
  RESEND_PROD: "re_production"
});
assert.equal(production.mode, "resend");
if (production.mode === "resend") assert.equal(production.apiKey, "re_production");

assert.throws(
  () => resolveEmailDeliveryConfig({ VERCEL_ENV: "preview", RESEND_PREVIEW: "re_preview" }),
  /ASTRA_EMAIL_FROM/
);
assert.throws(
  () =>
    resolveEmailDeliveryConfig({
      VERCEL_ENV: "preview",
      ASTRA_EMAIL_FROM: "Astra <hello@updates.astra.local>",
      RESEND_PREVIEW: "re_preview"
    }),
  /verified public domain/
);
assert.throws(
  () =>
    resolveEmailDeliveryConfig({
      VERCEL_ENV: "preview",
      ASTRA_EMAIL_FROM: "Astra <hello@updates.astraportrait.com>"
    }),
  /RESEND_PREVIEW/
);

assert.deepEqual(resolveEmailDeliveryConfig({}), {
  mode: "smtp",
  from: "Astra <hello@local.astra>",
  host: "127.0.0.1",
  port: 1025
});

console.log("email delivery configuration smoke checks passed");
