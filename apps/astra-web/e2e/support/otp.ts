import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type JsonObject = Record<string, unknown>;

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function findOtp(value: unknown): string | null {
  if (typeof value === "string") return value.match(/\b\d{6}\b/)?.[0] ?? null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const otp = findOtp(item);
      if (otp) return otp;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as JsonObject)) {
      const otp = findOtp(item);
      if (otp) return otp;
    }
  }
  return null;
}

async function readOtpFromFile(email: string) {
  const captureDir = clean(process.env.ASTRA_EMAIL_CAPTURE_DIR) || ".astra-email";
  const outbox = resolve(captureDir, "outbox.jsonl");

  try {
    const lines = (await readFile(outbox, "utf8")).trim().split("\n").reverse();
    for (const line of lines) {
      const message = JSON.parse(line) as JsonObject;
      if (String(message.to ?? "").toLowerCase() !== email.toLowerCase()) continue;
      const otp = findOtp(message);
      if (otp) return otp;
    }
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }

  return null;
}

async function readOtpFromMailpit(email: string) {
  const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
  const searchUrl = new URL("/api/v1/search", mailpitUrl);
  searchUrl.searchParams.set("query", email);
  searchUrl.searchParams.set("limit", "10");

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`Mailpit search failed with ${searchResponse.status}. Is Mailpit running at ${mailpitUrl}?`);
  }

  const search = (await searchResponse.json()) as JsonObject;
  const messages = Array.isArray(search.messages)
    ? search.messages
    : Array.isArray(search.Messages)
      ? search.Messages
      : [];

  for (const summary of messages as JsonObject[]) {
    const id = String(summary.ID ?? summary.Id ?? summary.id ?? "");
    if (!id) continue;
    const messageResponse = await fetch(new URL(`/api/v1/message/${id}`, mailpitUrl));
    if (!messageResponse.ok) continue;
    const otp = findOtp(await messageResponse.json());
    if (otp) return otp;
  }

  return null;
}

export async function readOtp(email: string) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const otp = clean(process.env.ASTRA_EMAIL_DELIVERY) === "file"
      ? await readOtpFromFile(email)
      : await readOtpFromMailpit(email);
    if (otp) return otp;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }

  throw new Error(`No OTP found for ${email}.`);
}
