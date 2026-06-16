import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ASTRA_EPHEMERIS_ENGINE_ENV, LOCAL_CHART_ROUTINE_ENGINE, buildAstrologyReportResult } from "@astra/astrology";
import { astrologyReportRequestSchema } from "@astra/contracts";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
const email = clean(process.env.ASTRA_REPORT_SMOKE_EMAIL) || `report-smoke-${Date.now()}@example.com`;
const name = clean(process.env.ASTRA_REPORT_SMOKE_NAME) || "Tony C";

let cookieHeader = "";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

if (!internalToken) {
  throw new Error("ASTRA_INTERNAL_API_TOKEN is required for the report API smoke.");
}

function appendCookies(headers: Headers) {
  const raw = headers.get("set-cookie");
  if (!raw) return;

  const cookies = raw
    .split(/,(?=[^;,]+=)/)
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean);

  const existing = new Map(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, rest.join("=")] as const;
      })
  );

  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key) existing.set(key, rest.join("="));
  }

  cookieHeader = [...existing.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function requestJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("origin", appBaseUrl);
  if (cookieHeader) headers.set("cookie", cookieHeader);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, { ...init, headers });
  appendCookies(response.headers);

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}: ${text}`);
  }

  return text ? (JSON.parse(text) as JsonObject) : {};
}

async function expectStatus(url: string, expectedStatus: number, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, { ...init, headers });
  if (response.status !== expectedStatus) {
    throw new Error(`${url} expected ${expectedStatus} but returned ${response.status}: ${await response.text()}`);
  }
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

async function readOtpFromFileCapture() {
  const outboxDir = clean(process.env.ASTRA_EMAIL_CAPTURE_DIR) || ".astra-email";
  const text = await readFile(join(outboxDir, "outbox.jsonl"), "utf8");
  const rows = text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as JsonObject)
    .reverse();

  const row = rows.find((candidate) => candidate.to === email);
  const otp = findOtp(row);
  if (!otp) throw new Error(`No OTP found in file capture for ${email}.`);
  return otp;
}

async function readOtpFromMailpit() {
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
    const message = (await messageResponse.json()) as JsonObject;
    const otp = findOtp(message);
    if (otp) return otp;
  }

  throw new Error(`No OTP found in Mailpit for ${email}.`);
}

async function readOtp() {
  if (clean(process.env.ASTRA_EMAIL_DELIVERY) === "file") return readOtpFromFileCapture();
  return readOtpFromMailpit();
}

await expectStatus(`${appBaseUrl}/api/reports`, 401);

await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
  method: "POST",
  body: JSON.stringify({ email, type: "sign-in" })
});

await requestJson(`${authBaseUrl}/sign-in/email-otp`, {
  method: "POST",
  body: JSON.stringify({ email, otp: await readOtp(), name })
});

const created = await requestJson(`${appBaseUrl}/api/reports`, {
  method: "POST",
  body: JSON.stringify({
    reportType: "core_self",
    subjectName: name,
    birthData: {
      date: "1961-05-23",
      time: "09:30",
      timezone: "America/New_York",
      location: "New York, NY, USA",
      latitude: 40.7128,
      longitude: -74.006
    },
    question: "What report shape should Astra preserve for the stream?",
    intent: "tony-report-api-smoke",
    context: {
      source: "test:report-api"
    },
    source: "self"
  })
});

const publicCreated = await requestJson(`${appBaseUrl}/api/reports`, {
  method: "POST",
  body: JSON.stringify({
    reportType: "core_self",
    subjectName: "Albert Einstein",
    birthData: {
      date: "1879-03-14",
      time: "11:30",
      timezone: "Europe/Berlin",
      location: "Ulm, Germany",
      latitude: 48.4011,
      longitude: 9.9876
    },
    question: "What should this public sample preserve?",
    intent: "public-sample-report-api-smoke",
    context: {
      source: "Astria public data",
      sourceUrl: "https://www.astro.com/astro-databank/Einstein,_Albert",
      roddenRating: "AA"
    },
    source: "import"
  })
});

const requestId = (created.request as JsonObject | undefined)?.id;
if (!requestId) throw new Error("Report API did not return a request id.");
const publicRequestId = (publicCreated.request as JsonObject | undefined)?.id;
if (!publicRequestId) throw new Error("Report API did not return a public sample request id.");
const reportRequest = astrologyReportRequestSchema.parse(created.request);
const previousEngine = process.env[ASTRA_EPHEMERIS_ENGINE_ENV];

const listed = await requestJson(`${appBaseUrl}/api/reports`);
const requests = Array.isArray(listed.requests) ? listed.requests : [];
if (!requests.some((request) => (request as JsonObject).id === requestId)) {
  throw new Error("Report API did not list the created request for the authenticated user.");
}

const generated = await requestJson(`${appBaseUrl}/api/reports/${requestId}/generate`, {
  method: "POST"
});
if ((generated.result as JsonObject | undefined)?.status !== "completed") {
  throw new Error("User report generation route did not record a completed result.");
}
if (!((generated.result as JsonObject).publicSignal as JsonObject | undefined)?.headline) {
  throw new Error("User report generation route did not return a public signal.");
}
if (((generated.result as JsonObject).publicSignal as JsonObject).headline !== "Gemini Sun, Virgo Moon, Cancer rising") {
  throw new Error(
    `User report generation route returned the wrong Tony signature: ${((generated.result as JsonObject).publicSignal as JsonObject).headline}`
  );
}
if (!String(((generated.result as JsonObject).publicSignal as JsonObject).provenanceSummary).includes("tropical, whole-sign")) {
  throw new Error("User report generation route did not preserve tropical + whole-sign provenance.");
}
if ((generated.request as JsonObject | undefined)?.status !== "completed") {
  throw new Error("User report generation route did not return the completed report request.");
}

const publicGenerated = await requestJson(`${appBaseUrl}/api/reports/${publicRequestId}/generate`, {
  method: "POST"
});
if (((publicGenerated.result as JsonObject).publicSignal as JsonObject | undefined)?.headline !== "Pisces Sun, Sagittarius Moon, Cancer rising") {
  throw new Error(
    `User report generation route returned the wrong Einstein public signature: ${((publicGenerated.result as JsonObject).publicSignal as JsonObject | undefined)?.headline ?? "missing"}`
  );
}

const publishedSignal = await requestJson(`${appBaseUrl}/api/reports/${requestId}/publish-signal`, {
  method: "POST"
});
if ((publishedSignal.artifact as JsonObject | undefined)?.id !== `report_signal:${requestId}`) {
  throw new Error("User report signal publish route did not return the expected stream artifact.");
}
if (((publishedSignal.artifact as JsonObject).streamItem as JsonObject | undefined)?.kind !== "artifact") {
  throw new Error("User report signal publish route must publish an artifact stream item.");
}

delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
const recordPayload = buildAstrologyReportResult(reportRequest);

await expectStatus(`${appBaseUrl}/api/report-results`, 401, {
  method: "POST",
  body: JSON.stringify(recordPayload)
});
await expectStatus(`${appBaseUrl}/api/report-results`, 401, {
  method: "POST",
  headers: {
    "x-astra-internal-token": "wrong-token"
  },
  body: JSON.stringify(recordPayload)
});

process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = LOCAL_CHART_ROUTINE_ENGINE;
const completedRecordPayload = buildAstrologyReportResult(reportRequest);
const result = await requestJson(`${appBaseUrl}/api/report-results`, {
  method: "POST",
  headers: {
    "x-astra-internal-token": internalToken
  },
  body: JSON.stringify(completedRecordPayload)
});

if (!(result.result as JsonObject | undefined)?.id) {
  throw new Error("Report result API did not return a result id.");
}
if ((result.result as JsonObject).status !== "completed") {
  throw new Error(`Report result smoke expected configured engine completion, got ${(result.result as JsonObject).status}.`);
}
if ((result.result as JsonObject).engine !== LOCAL_CHART_ROUTINE_ENGINE) {
  throw new Error(`Report result smoke expected ${LOCAL_CHART_ROUTINE_ENGINE}, got ${(result.result as JsonObject).engine}.`);
}
if (!((result.result as JsonObject).publicSignal as JsonObject | undefined)?.headline) {
  throw new Error("Report result API did not preserve the public report signal.");
}
if (((result.result as JsonObject).publicSignal as JsonObject).headline !== "Gemini Sun, Virgo Moon, Cancer rising") {
  throw new Error(
    `Report result API preserved the wrong Tony signature: ${((result.result as JsonObject).publicSignal as JsonObject).headline}`
  );
}

if (previousEngine === undefined) {
  delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
} else {
  process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = previousEngine;
}

console.log(`Report API smoke passed for ${email}: ${requestId}.`);
