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

export async function sendEmail(input: SendEmailInput) {
  const apiKey = resendKey();
  if (apiKey) {
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
