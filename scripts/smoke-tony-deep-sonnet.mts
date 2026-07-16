import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { chromium } from "@playwright/test";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const authBaseUrl = `${appBaseUrl}/api/auth`;
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const email = clean(process.env.ASTRA_TONY_DEEP_SMOKE_EMAIL) || "astra-report-parity@example.com";
const name = "Tony Cecala";
const outputDir = join(process.cwd(), "output", "playwright");

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
    label: "Sun/Mercury in Gemini, 12th Whole Sign / 11th Placidus",
    meaning: "Language, translation, movement, and connective intelligence arise from private perception and become useful through networks, audience, or collective contribution."
  },
  {
    label: "Cancer rising; chart ruler Moon in Virgo near the 3rd-house cusp",
    meaning: "Sensitive perception is filtered through discrimination, words, craft, and immediate-pattern recognition."
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
    label: "Mars in Leo, 2nd Whole Sign / 1st Placidus",
    meaning: "Creative will is tied to self-worth and visible self-assertion; action wants to feel authored, warm, and alive."
  },
  {
    label: "Mars opposite Jupiter",
    meaning: "Creative will meets systems-scale vision; momentum needs proportion so appetite does not become overreach."
  },
  {
    label: "Mars square Neptune",
    meaning: "Inspired action and mythic imagination are strong, but vision must be tested against reality quickly."
  },
  {
    label: "Uranus conjunct natal Sun",
    meaning: "Identity reset through liberation, technology, voice, networks, and private awakening becoming public expression.",
    practicalInstruction: "Test the new signal in one concrete public, technical, or networked form without abandoning structures that still carry you."
  },
  {
    label: "Identity",
    thesis: "Identity is organized around language, motion, translation, and the bridge from private perception to public or networked intelligence."
  },
  {
    label: "Emotions",
    thesis: "Emotional life is perceptive, exacting, and psychologically deep, with a tendency to analyze before surrendering to feeling."
  },
  {
    label: "Relationships",
    thesis: "Attraction needs aliveness, direct signal, and visible courage, but stability requires separating real presence from dramatic charge."
  },
  {
    label: "Work",
    thesis: "Work becomes strongest when private insight, fast language, direct public charisma, and network intelligence have a visible channel."
  },
  {
    label: "Drive",
    thesis: "Drive is creative, proud, visionary, and large-scale, but it needs proportion and a reality test."
  },
  {
    label: "Gifts",
    thesis: "The gift is forensic perception translated into language, pattern recognition, and connective intelligence."
  },
  {
    label: "Blind Spots",
    thesis: "The same imagination and multiplicity that create possibility can scatter focus or blur the difference between signal and fantasy."
  },
  {
    label: "Growth",
    thesis: "Growth comes from making vision testable and letting private intelligence become shared contribution without scattering the center."
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

function wordCount(value: unknown) {
  return String(value ?? "")
    .split(/\s+/)
    .filter(Boolean).length;
}

await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
  method: "POST",
  body: JSON.stringify({ email, type: "sign-in" })
});

await requestJson(`${authBaseUrl}/sign-in/email-otp`, {
  method: "POST",
  body: JSON.stringify({ email, otp: await readOtpFromMailpit(), name })
});

const chart = await requestJson(`${appBaseUrl}/api/chart-requests`, {
  method: "POST",
  body: JSON.stringify({
    subjectName: name,
    birthData: tonyBirthData,
    question: "Create the v1 parity chart context for Tony's Sonnet Deep report.",
    intent: "tony-deep-sonnet-v1-parity",
    context: {
      subject: {
        subjectType: "self",
        displayName: name
      },
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      v1InterpretiveNotes
    },
    source: "self"
  })
});
const chartRequestId = String((chart.request as JsonObject | undefined)?.id ?? "");
if (!chartRequestId) throw new Error("Tony chart request did not return an id.");

const created = await requestJson(`${appBaseUrl}/api/reports`, {
  method: "POST",
  body: JSON.stringify({
    chartRequestId,
    reportType: "deep",
    reportBasis: {
      type: "natal",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }
    },
    question: "Create the Deep Report in the v1 voice and structure.",
    intent: "tony-deep-sonnet-v1-parity"
  })
});

const requestId = String((created.request as JsonObject | undefined)?.id ?? "");
if (!requestId) throw new Error("Tony Deep report request did not return an id.");

const generated = await requestJson(`${appBaseUrl}/api/reports/${requestId}/generate`, {
  method: "POST"
});
const result = generated.result as JsonObject | undefined;
if (result?.status !== "completed") throw new Error("Tony Deep Sonnet report did not complete.");

const sections = Array.isArray(result.sections) ? (result.sections as JsonObject[]) : [];
const expectedHeadings = ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Right Now"];
const titles = sections.map((section) => String(section.title ?? ""));
for (const heading of expectedHeadings) {
  if (!titles.includes(heading)) {
    throw new Error(`Tony Deep Sonnet report missing ${heading}. Got: ${titles.join(", ")}`);
  }
}

const totalWords = sections.reduce((total, section) => total + wordCount(section.body), 0);
const identityWords = wordCount(sections.find((section) => section.title === "Identity")?.body);
if (totalWords < 2400) throw new Error(`Tony Deep Sonnet report is too thin to review: ${totalWords} words.`);
if (identityWords < 350) throw new Error(`Tony Deep Sonnet Identity section is too thin to review: ${identityWords} words.`);

const provenance = JSON.stringify(result.provenance ?? []);
if (!provenance.includes("anthropic/claude-sonnet")) {
  throw new Error(`Tony Deep report provenance does not show Sonnet. Provenance: ${provenance}`);
}

const reportUrl = `${appBaseUrl}/library?reportId=${requestId}`;
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const consoleMessages: string[] = [];
const failedResponses: string[] = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: {
      cookie: cookieHeader
    }
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") consoleMessages.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(reportUrl, { waitUntil: "networkidle" });
  await page.getByText("Deep Portrait").first().waitFor();
  await page.getByRole("heading", { name: "Identity" }).waitFor();
  await page.getByRole("heading", { name: "Right Now" }).waitFor();
  await page.screenshot({
    path: join(outputDir, "job1-tony-deep-sonnet-report-desktop.png"),
    fullPage: true
  });

  await page.goto(`${appBaseUrl}/library`, { waitUntil: "networkidle" });
  await page.getByText("Deep Report").first().waitFor();
  const libraryText = await page.locator("body").innerText();
  if (libraryText.includes("Uranus conjunct the natal Sun marks an identity reset")) {
    throw new Error("Library list rendered heavy report body text instead of short report headers.");
  }
  await page.screenshot({
    path: join(outputDir, "job1-tony-deep-sonnet-library-short-list-desktop.png"),
    fullPage: true
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(reportUrl, { waitUntil: "networkidle" });
  await page.getByText("Deep Portrait").first().waitFor();
  await page.screenshot({
    path: join(outputDir, "job1-tony-deep-sonnet-report-mobile.png"),
    fullPage: true
  });

  await context.close();
} finally {
  await browser.close();
}

const appFailures = failedResponses.filter((failure) => failure.includes(appBaseUrl));
if (appFailures.length) throw new Error(`Rendered report had failed app responses: ${appFailures.join("; ")}`);
if (consoleMessages.length) throw new Error(`Rendered report had browser console errors: ${consoleMessages.join("; ")}`);

await requestJson(`${authBaseUrl}/email-otp/send-verification-otp`, {
  method: "POST",
  body: JSON.stringify({ email, type: "sign-in" })
});
const freshOtp = await readOtpFromMailpit();

console.log(
  JSON.stringify(
    {
      ok: true,
      email,
      otp: freshOtp,
      reportUrl,
      requestId,
      totalWords,
      identityWords,
      screenshots: [
        join(outputDir, "job1-tony-deep-sonnet-report-desktop.png"),
        join(outputDir, "job1-tony-deep-sonnet-library-short-list-desktop.png"),
        join(outputDir, "job1-tony-deep-sonnet-report-mobile.png")
      ]
    },
    null,
    2
  )
);
