type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const email = clean(process.env.ASTRA_REPORT_FAMILIES_SMOKE_EMAIL) || `report-families-${Date.now()}@example.com`;

let cookieHeader = "";

const expectedHeadings: Record<string, string[]> = {
  identity: ["Identity"],
  core: ["Identity", "Relationships", "Work", "Right Now"],
  deep: ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Right Now"],
  progressed: ["Current Chapter", "Progressed Sun", "Progressed Moon", "Integration"],
  synastry: ["Attraction", "Friction", "Communication", "Stability"]
};

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
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
    const otp = findOtp(await messageResponse.json());
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
  body: JSON.stringify({ email, otp: await readOtpFromMailpit(), name: "Astra Report Families Smoke" })
});

const generatedIds: string[] = [];

for (const [reportType, headings] of Object.entries(expectedHeadings)) {
  const created = await requestJson(`${appBaseUrl}/api/reports`, {
    method: "POST",
    body: JSON.stringify({
      reportType,
      subjectName: `Family ${reportType}`,
      birthData: {
        date: "1990-04-11",
        time: "08:20",
        timezone: "America/Chicago",
        location: "Austin, TX, USA",
        latitude: 30.2672,
        longitude: -97.7431
      },
      question: `Generate the ${reportType} report family.`,
      intent: `report-family-smoke:${reportType}`,
      context: {
        subject: {
          subjectType: reportType === "synastry" ? "ally" : "self",
          displayName: `Family ${reportType}`,
          relationship: reportType === "synastry" ? "Comparison" : undefined
        }
      },
      source: reportType === "synastry" ? "ally" : "self"
    })
  });
  const requestId = String((created.request as JsonObject | undefined)?.id ?? "");
  if (!requestId) throw new Error(`${reportType} report request did not return an id.`);

  const generated = await requestJson(`${appBaseUrl}/api/reports/${requestId}/generate`, {
    method: "POST"
  });
  const result = generated.result as JsonObject | undefined;
  if (result?.status !== "completed") {
    throw new Error(`${reportType} report did not complete.`);
  }
  const sections = Array.isArray(result.sections) ? (result.sections as JsonObject[]) : [];
  const titles = sections.map((section) => String(section.title ?? ""));
  for (const heading of headings) {
    if (!titles.includes(heading)) {
      throw new Error(`${reportType} report missing ${heading}. Got: ${titles.join(", ")}`);
    }
  }
  generatedIds.push(requestId);
}

const library = await requestJson(`${appBaseUrl}/api/reports`);
const libraryRequests = Array.isArray(library.requests) ? (library.requests as JsonObject[]) : [];
for (const requestId of generatedIds) {
  if (!libraryRequests.some((request) => request.id === requestId)) {
    throw new Error(`Generated report request ${requestId} was not listed for the signed-in user.`);
  }
}

console.log(`Report families smoke passed for ${email}: ${generatedIds.join(", ")}.`);
