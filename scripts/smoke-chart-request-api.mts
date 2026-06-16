import { buildChartMakerRecordResult } from "@astra/chart-maker";
import { chartMakerRequestSchema } from "@astra/contracts";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
const email = clean(process.env.ASTRA_CHART_REQUEST_SMOKE_EMAIL) || `chart-request-smoke-${Date.now()}@example.com`;
const name = clean(process.env.ASTRA_CHART_REQUEST_SMOKE_NAME) || "Tony C";

let cookieHeader = "";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

if (!internalToken) {
  throw new Error("ASTRA_INTERNAL_API_TOKEN is required for the chart request API smoke.");
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

await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
  method: "POST",
  body: JSON.stringify({ email, type: "sign-in" })
});

await requestJson(`${authBaseUrl}/sign-in/email-otp`, {
  method: "POST",
  body: JSON.stringify({ email, otp: await readOtpFromMailpit(), name })
});

const created = await requestJson(`${appBaseUrl}/api/chart-requests`, {
  method: "POST",
  body: JSON.stringify({
    subjectName: name,
    birthData: {
      date: "1961-05-23",
      time: "09:30",
      timezone: "America/New_York",
      location: "New York, NY, USA",
      latitude: 40.7128,
      longitude: -74.006
    },
    question: "What pattern should Astra queue for an independent chart maker?",
    intent: "tony-chart-api-smoke",
    context: {
      source: "test:chart-request-api"
    },
    source: "self"
  })
});

const requestId = (created.request as JsonObject | undefined)?.id;
if (!requestId) throw new Error("Chart request API did not return a request id.");
const userId = (created.request as JsonObject | undefined)?.userId;
if (typeof userId !== "string" || !userId) throw new Error("Chart request API did not return a user id.");
const chartMakerRequest = chartMakerRequestSchema.parse(created.request);

const listed = await requestJson(`${appBaseUrl}/api/chart-requests`);
const requests = Array.isArray(listed.requests) ? listed.requests : [];
if (!requests.some((request) => (request as JsonObject).id === requestId)) {
  throw new Error("Chart request API did not list the created request for the authenticated user.");
}

const result = await requestJson(`${appBaseUrl}/api/chart-results`, {
  method: "POST",
  headers: {
    "x-astra-internal-token": internalToken
  },
  body: JSON.stringify(buildChartMakerRecordResult(chartMakerRequest))
});

if (!(result.result as JsonObject | undefined)?.id) {
  throw new Error("Chart result API did not return a result id.");
}

console.log(`Chart request/result API smoke passed for ${email}: ${requestId}.`);
