type EmailEnvironment = Record<string, string | undefined>;

export type EmailDeliveryConfig =
  | { mode: "file"; captureDir: string }
  | { mode: "smtp"; from: string; host: string; port: number }
  | { mode: "resend"; from: string; apiKey: string };

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function resendKey(env: EmailEnvironment) {
  if (env.VERCEL_ENV === "production") return clean(env.RESEND_PROD);
  if (env.VERCEL_ENV === "preview") return clean(env.RESEND_PREVIEW);
  return clean(env.RESEND_DEV);
}

function deliveryMode(env: EmailEnvironment) {
  const configured = clean(env.ASTRA_EMAIL_DELIVERY);
  if (configured) return configured;
  return env.VERCEL_ENV ? "resend" : "smtp";
}

function requireSender(env: EmailEnvironment, mode: "smtp" | "resend") {
  const configured = clean(env.ASTRA_EMAIL_FROM);
  if (configured) {
    if (mode === "resend" && configured.toLowerCase().includes(".local")) {
      throw new Error("ASTRA_EMAIL_FROM must use a verified public domain for Resend delivery.");
    }
    return configured;
  }

  if (mode === "smtp" && !env.VERCEL_ENV) return "Astra <hello@local.astra>";
  throw new Error("ASTRA_EMAIL_FROM is required for hosted email delivery.");
}

export function resolveEmailDeliveryConfig(env: EmailEnvironment = process.env): EmailDeliveryConfig {
  const mode = deliveryMode(env);

  if (mode === "file") {
    return {
      mode,
      captureDir: clean(env.ASTRA_EMAIL_CAPTURE_DIR) || ".astra-email"
    };
  }

  if (mode === "smtp") {
    const port = Number(clean(env.MAILPIT_SMTP_PORT) || 1025);
    if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
      throw new Error("MAILPIT_SMTP_PORT must be a valid TCP port.");
    }

    return {
      mode,
      from: requireSender(env, mode),
      host: clean(env.MAILPIT_SMTP_HOST) || "127.0.0.1",
      port
    };
  }

  if (mode === "resend") {
    const apiKey = resendKey(env);
    if (!apiKey) {
      const keyName = env.VERCEL_ENV === "production" ? "RESEND_PROD" : env.VERCEL_ENV === "preview" ? "RESEND_PREVIEW" : "RESEND_DEV";
      throw new Error(`${keyName} is required for Resend delivery.`);
    }

    return {
      mode,
      from: requireSender(env, mode),
      apiKey
    };
  }

  throw new Error("ASTRA_EMAIL_DELIVERY must be one of: file, smtp, resend.");
}
