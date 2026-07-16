import { mkdir, appendFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { resolveEmailDeliveryConfig } from "./config";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

async function captureLocalEmail(input: SendEmailInput, captureDir: string) {
  await mkdir(captureDir, { recursive: true });
  await appendFile(
    join(captureDir, "outbox.jsonl"),
    `${JSON.stringify({ ...input, capturedAt: new Date().toISOString() })}\n`,
    "utf8"
  );
}

export async function sendEmail(input: SendEmailInput) {
  const delivery = resolveEmailDeliveryConfig();

  if (delivery.mode === "file") {
    await captureLocalEmail(input, delivery.captureDir);
    return;
  }

  if (delivery.mode === "resend") {
    const resend = new Resend(delivery.apiKey);
    const result = await resend.emails.send({
      from: delivery.from,
      to: input.to,
      subject: input.subject,
      text: input.text
    });
    if (result.error) throw new Error(`Resend delivery failed: ${result.error.message}`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: delivery.host,
    port: delivery.port,
    secure: false
  });

  await transport.sendMail({
    from: delivery.from,
    to: input.to,
    subject: input.subject,
    text: input.text
  });
}
