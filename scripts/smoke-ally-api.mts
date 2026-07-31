type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const firstEmail = clean(process.env.ASTRA_ALLY_SMOKE_EMAIL) || `ally-smoke-${Date.now()}@example.com`;
const secondEmail = clean(process.env.ASTRA_ALLY_PRIVACY_SMOKE_EMAIL) || `ally-privacy-smoke-${Date.now()}@example.com`;

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function appendCookies(currentCookieHeader: string, headers: Headers) {
  const raw = headers.get("set-cookie");
  if (!raw) return currentCookieHeader;

  const cookies = raw
    .split(/,(?=[^;,]+=)/)
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean);

  const existing = new Map(
    currentCookieHeader
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

  return [...existing.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
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

async function readOtpFromMailpit(email: string) {
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

function makeClient() {
  let cookieHeader = "";

  async function request(url: string, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    headers.set("origin", appBaseUrl);
    if (cookieHeader) headers.set("cookie", cookieHeader);
    if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

    const response = await fetch(url, { ...init, headers });
    cookieHeader = appendCookies(cookieHeader, response.headers);
    return response;
  }

  async function requestJson(url: string, init?: RequestInit) {
    const response = await request(url, init);

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`${url} failed with ${response.status}: ${text}`);
    }

    return text ? (JSON.parse(text) as JsonObject) : {};
  }

  async function expectStatus(url: string, expectedStatus: number, init?: RequestInit) {
    const response = await request(url, init);
    if (response.status !== expectedStatus) {
      throw new Error(`${url} expected ${expectedStatus} but returned ${response.status}: ${await response.text()}`);
    }
  }

  return { expectStatus, requestJson };
}

async function signIn(email: string, name: string) {
  const client = makeClient();

  await client.requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
    method: "POST",
    body: JSON.stringify({ email, type: "sign-in" })
  });

  await client.requestJson(`${authBaseUrl}/sign-in/email-otp`, {
    method: "POST",
    body: JSON.stringify({ email, otp: await readOtpFromMailpit(email), name })
  });

  return client;
}

async function expectStatus(url: string, expectedStatus: number, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, { ...init, headers });
  if (response.status !== expectedStatus) {
    throw new Error(`${url} expected ${expectedStatus} but returned ${response.status}: ${await response.text()}`);
  }
}

await expectStatus(`${appBaseUrl}/api/allies`, 401);

const firstUser = await signIn(firstEmail, "Astra Ally Smoke");
const created = await firstUser.requestJson(`${appBaseUrl}/api/allies`, {
  method: "POST",
  body: JSON.stringify({
    name: "Maya",
    kind: "person",
    relationship: "Friend",
    note: "Shared chart loop smoke"
  })
});

const allyId = (created.ally as JsonObject | undefined)?.id;
if (!allyId) throw new Error("Ally API did not return an ally id.");

await firstUser.expectStatus(`${appBaseUrl}/api/allies`, 400, {
  method: "POST",
  body: JSON.stringify({ name: "Invalid Self Ally", kind: "person", relationship: "Self" })
});

const updated = await firstUser.requestJson(`${appBaseUrl}/api/allies/${encodeURIComponent(String(allyId))}`, {
  method: "PATCH",
  body: JSON.stringify({ relationship: "Lover" })
});
if ((updated.ally as JsonObject | undefined)?.relationship !== "Lover") {
  throw new Error("Owner-scoped Ally PATCH did not persist the canonical Lover tag.");
}

const firstListed = await firstUser.requestJson(`${appBaseUrl}/api/allies`);
const firstAllies = Array.isArray(firstListed.allies) ? firstListed.allies : [];
if (!firstAllies.some((ally) => (ally as JsonObject).id === allyId)) {
  throw new Error("Ally API did not list the created Ally for the owner.");
}

const secondUser = await signIn(secondEmail, "Astra Ally Privacy Smoke");
await secondUser.expectStatus(`${appBaseUrl}/api/allies/${encodeURIComponent(String(allyId))}`, 404, {
  method: "PATCH",
  body: JSON.stringify({ relationship: "Child" })
});
const secondListed = await secondUser.requestJson(`${appBaseUrl}/api/allies`);
const secondAllies = Array.isArray(secondListed.allies) ? secondListed.allies : [];
if (secondAllies.some((ally) => (ally as JsonObject).id === allyId)) {
  throw new Error("Ally API leaked another user's Ally.");
}

console.log(`Ally API smoke passed for ${firstEmail}: ${allyId}.`);
