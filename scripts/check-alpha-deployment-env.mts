import { resolveEmailDeliveryConfig } from "../apps/astra-web/lib/email/config";

const expectedUrl = "https://alpha.astraportrait.com";
const errors: string[] = [];
const notes: string[] = [];

function clean(name: string) {
  return process.env[name]?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function requireValue(name: string) {
  const value = clean(name);
  if (!value) errors.push(`${name} is required.`);
  return value;
}

function requireExact(name: string, expected: string) {
  const value = requireValue(name);
  if (value && value !== expected) errors.push(`${name} must be ${expected}.`);
}

const databaseUrl = requireValue("ASTRA_DATABASE_URL");
if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (!parsed.protocol.startsWith("postgres")) errors.push("ASTRA_DATABASE_URL must be a PostgreSQL URL.");
    if (["127.0.0.1", "localhost"].includes(parsed.hostname)) errors.push("ASTRA_DATABASE_URL must point to the isolated Neon alpha database.");
  } catch {
    errors.push("ASTRA_DATABASE_URL is not a valid URL.");
  }
}

const authSecret = requireValue("BETTER_AUTH_SECRET");
if (authSecret && authSecret.length < 32) errors.push("BETTER_AUTH_SECRET must be at least 32 characters.");
requireExact("BETTER_AUTH_URL", expectedUrl);
requireExact("NEXT_PUBLIC_SITE_URL", expectedUrl);

const internalToken = requireValue("ASTRA_INTERNAL_API_TOKEN");
if (internalToken && internalToken.length < 32) errors.push("ASTRA_INTERNAL_API_TOKEN must be at least 32 characters.");

requireExact("ASTRA_EMAIL_DELIVERY", "resend");
try {
  const vercelEnv = clean("VERCEL_ENV") || "preview";
  if (vercelEnv !== "preview" && vercelEnv !== "production") {
    errors.push("VERCEL_ENV must be preview or production for hosted alpha validation.");
  }
  const email = resolveEmailDeliveryConfig({ ...process.env, VERCEL_ENV: vercelEnv });
  if (email.mode !== "resend") errors.push("Hosted alpha email must use Resend.");
  if (email.mode === "resend" && !/@(?:[a-z0-9-]+\.)*astraportrait\.com(?:>|$)/i.test(email.from)) {
    errors.push("ASTRA_EMAIL_FROM must use the verified astraportrait.com domain or one of its subdomains.");
  }
} catch (error) {
  errors.push(error instanceof Error ? error.message : "Email delivery configuration is invalid.");
}

requireExact("ASTRA_EPHEMERIS_ENGINE", "local-chart-routine");
requireExact("ASTRA_REPORT_WRITER", "debug-model-writer");
requireExact("ASTRA_REPORT_MODEL_PROFILE", "production");
const reportModelProvider = clean("ASTRA_REPORT_MODEL_PROVIDER");
if (reportModelProvider && reportModelProvider !== "openrouter") {
  errors.push("ASTRA_REPORT_MODEL_PROVIDER must be openrouter when explicitly set for alpha.");
}
const reportModel = clean("ASTRA_REPORT_MODEL");
if (reportModel) {
  errors.push("ASTRA_REPORT_MODEL must be unset in alpha so the request-level production policy keeps Sonnet 5 for non-Synastry and Sonnet 4.6 for Synastry; use the admin replay path for controlled model overrides.");
}
requireExact("ASTRA_ADMIN_ENABLED", "1");
if (!clean("ASTRA_OPENROUTER_API_KEY") && !clean("OPENROUTER_API_KEY")) {
  errors.push("ASTRA_OPENROUTER_API_KEY or OPENROUTER_API_KEY is required for alpha reports.");
}

const signupCredits = Number.parseInt(requireValue("ASTRA_BETA_SIGNUP_CREDITS"), 10);
if (!Number.isInteger(signupCredits) || signupCredits <= 0) errors.push("ASTRA_BETA_SIGNUP_CREDITS must be a positive integer.");

requireExact("ASTRA_PLACE_SEARCH_PROVIDER", "open-meteo");
notes.push("Place search uses Open-Meteo's global geocoder; place remains optional if the provider is unavailable.");

const composerUrl = requireValue("COMPOSER_APP_BASE_URL");
if (composerUrl) {
  try {
    const parsed = new URL(composerUrl);
    if (parsed.protocol !== "https:") errors.push("COMPOSER_APP_BASE_URL must use HTTPS when configured for alpha.");
    if (["127.0.0.1", "localhost"].includes(parsed.hostname)) errors.push("COMPOSER_APP_BASE_URL cannot point to localhost in alpha.");
  } catch {
    errors.push("COMPOSER_APP_BASE_URL is not a valid URL.");
  }
}

if (clean("STRIPE_SECRET_KEY") || clean("STRIPE_SECRET_TEST_KEY") || clean("STRIPE_WEBHOOK_SECRET") || clean("STRIPE_WEBHOOK_TEST_SECRET")) {
  errors.push("Remove Stripe secret and webhook variables from the alpha branch; signup Stars are the purchase substitute.");
}
notes.push("Stripe is intentionally absent; each alpha signup receives configured beta Stars.");

if (errors.length) {
  console.error("Alpha environment is not ready:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Alpha environment contract passed. Secret values were not printed.");
for (const note of notes) console.log(`- ${note}`);
