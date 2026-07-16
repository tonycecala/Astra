type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const email = clean(process.env.ASTRA_REPORT_PARITY_EMAIL) || "astra-report-parity@example.com";
const name = "Astra Report Parity";
const profiles = (clean(process.env.ASTRA_REPORT_BAKEOFF_PROFILES) || "debug,production")
  .split(",")
  .map((profile) => profile.trim())
  .filter(Boolean);
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);

let cookieHeader = "";

const tonyBirthData = {
  date: "1961-05-23",
  time: "09:30",
  timezone: "America/New_York",
  location: "New York, NY, USA",
  latitude: 40.7128,
  longitude: -74.006
};

const v1InterpretiveNotes = [
  {
    label: "Gemini Sun/Mercury intelligence, Cancer rising sensitivity, and Moon-Pluto discernment",
    meaning: "Private perception becomes articulate public or networked contribution."
  },
  {
    label: "Moon conjunct Pluto in Virgo",
    meaning: "Emotional intelligence becomes forensic: pressure, motive, and subtle emotional data are noticed before they are spoken."
  },
  {
    label: "Venus in Aries in the 10th house",
    meaning: "Public appeal is direct, independent, entrepreneurial, and visibly tied to aesthetic courage."
  },
  {
    label: "Mars square Neptune",
    meaning: "Inspired action and mythic imagination are strong, but vision must be tested against reality quickly."
  },
  {
    label: "Right Now",
    thesis: "Uranus conjunct the natal Sun marks an identity reset through liberation, technology, voice, networks, and private awakening becoming public expression."
  }
];

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
  if (!response.ok) throw new Error(`${url} failed with ${response.status}: ${text}`);
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
  if (!searchResponse.ok) throw new Error(`Mailpit search failed with ${searchResponse.status}.`);
  const search = (await searchResponse.json()) as JsonObject;
  const messages = Array.isArray(search.messages) ? search.messages : Array.isArray(search.Messages) ? search.Messages : [];
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

function wordCount(value: unknown) {
  return String(value ?? "")
    .split(/\s+/)
    .filter(Boolean).length;
}

if (!internalToken) throw new Error("ASTRA_INTERNAL_API_TOKEN is required for report bakeoff replay.");
if (!profiles.length) throw new Error("No report model profiles selected.");

await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
  method: "POST",
  body: JSON.stringify({ email, type: "sign-in" })
});
await requestJson(`${authBaseUrl}/sign-in/email-otp`, {
  method: "POST",
  body: JSON.stringify({ email, otp: await readOtpFromMailpit(), name })
});

const results = [];
for (const profile of profiles) {
  const chart = await requestJson(`${appBaseUrl}/api/chart-requests`, {
    method: "POST",
    body: JSON.stringify({
      subjectName: "Tony Cecala",
      birthData: tonyBirthData,
      question: `Create the v1 parity chart context for Tony's ${profile} Deep report.`,
      intent: `tony-deep-${profile}-v1-parity`,
      context: {
        subject: { subjectType: "self", displayName: "Tony Cecala" },
        chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
        v1InterpretiveNotes
      },
      source: "self"
    })
  });
  const chartRequestId = String((chart.request as JsonObject | undefined)?.id ?? "");
  if (!chartRequestId) throw new Error(`Chart request did not return an id for ${profile}.`);

  const created = await requestJson(`${appBaseUrl}/api/reports`, {
    method: "POST",
    body: JSON.stringify({
      chartRequestId,
      reportType: "deep",
      reportBasis: {
        type: "natal",
        chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
      },
      question: `Create the Deep Report in the v1 voice and structure using the ${profile} profile.`,
      intent: `tony-deep-${profile}-v1-parity`
    })
  });
  const requestId = String((created.request as JsonObject | undefined)?.id ?? "");
  if (!requestId) throw new Error(`Report request did not return an id for ${profile}.`);

  const replay = await requestJson(`${appBaseUrl}/api/admin/replay-report`, {
    method: "POST",
    headers: { "x-astra-internal-token": internalToken },
    body: JSON.stringify({ requestId, modelProfile: profile })
  });
  const result = replay.result as JsonObject | undefined;
  const sections = Array.isArray(result?.sections) ? (result.sections as JsonObject[]) : [];
  results.push({
    profile,
    ok: replay.ok === true,
    requestId,
    reportUrl: `${appBaseUrl}/library?reportId=${requestId}`,
    status: result?.status,
    totalWords: sections.reduce((total, section) => total + wordCount(section.body), 0),
    identityWords: wordCount(sections.find((section) => section.title === "Identity")?.body),
    provenance: result?.provenance
  });
}

console.log(JSON.stringify({ ok: true, email, profiles, results }, null, 2));
