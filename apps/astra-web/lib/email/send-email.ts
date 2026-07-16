import { mkdir, appendFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";
import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function resendKey() {
  if (process.env.VERCEL_ENV === "production") return clean(process.env.RESEND_PROD);
  if (process.env.VERCEL_ENV === "preview") return clean(process.env.RESEND_PREVIEW);
  return clean(process.env.RESEND_DEV);
}

function shouldCaptureEmailToFile() {
  return clean(process.env.ASTRA_EMAIL_DELIVERY) === "file";
}

function shouldUseLocalSmtp() {
  return clean(process.env.ASTRA_EMAIL_DELIVERY) === "smtp";
}

async function captureLocalEmail(input: SendEmailInput) {
  const outboxDir = clean(process.env.ASTRA_EMAIL_CAPTURE_DIR) || ".astra-email";
  await mkdir(outboxDir, { recursive: true });
  await appendFile(
    join(outboxDir, "outbox.jsonl"),
    `${JSON.stringify({ ...input, capturedAt: new Date().toISOString() })}\n`,
    "utf8"
  );
}

export async function sendEmail(input: SendEmailInput) {
  if (shouldCaptureEmailToFile()) {
    await captureLocalEmail(input);
    return;
  }

  const apiKey = resendKey();
  if (apiKey && !shouldUseLocalSmtp()) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Astra <hello@updates.astra.local>",
      to: input.to,
      subject: input.subject,
      text: input.text
    });
    return;
  }

  const transport = nodemailer.createTransport({
    host: clean(process.env.MAILPIT_SMTP_HOST) || "127.0.0.1",
    port: Number(clean(process.env.MAILPIT_SMTP_PORT) || 1025),
    secure: false
  });

  await transport.sendMail({
    from: "Astra <hello@local.astra>",
    to: input.to,
    subject: input.subject,
    text: input.text
  });
}
