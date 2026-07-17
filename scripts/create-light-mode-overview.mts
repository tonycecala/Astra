import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const email = clean(process.env.ASTRA_OVERVIEW_EMAIL) || `overview-${Date.now()}@example.com`;
const outputDir = join(process.cwd(), "output", "astra-light-mode-overview");

const screens = [
  { route: "/journey", title: "Journey", purpose: "The living stream", next: "Open, save, or reflect" },
  { route: "/allies", title: "Allies", purpose: "People and relationship reports", next: "Choose an Ally or order a report" },
  { route: "/self", title: "Self", purpose: "Birth details and personal reports", next: "Review chart settings and order" },
  { route: "/library", title: "Library", purpose: "Saved reports and provenance", next: "Read, compare, and revisit" },
  { route: "/gifts", title: "Gifts", purpose: "Stars and portrait gifts", next: "Choose a gift or add Stars" },
  { route: "/login?next=/self", title: "Login", purpose: "Private email-code access", next: "Return directly to the requested screen", public: true }
] as const;

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

async function readOtp() {
  const searchUrl = new URL("/api/v1/search", mailpitUrl);
  searchUrl.searchParams.set("query", email);
  searchUrl.searchParams.set("limit", "10");
  const search = (await fetch(searchUrl).then((response) => response.json())) as JsonObject;
  const messages = Array.isArray(search.messages) ? search.messages : Array.isArray(search.Messages) ? search.Messages : [];
  for (const summary of messages as JsonObject[]) {
    const id = String(summary.ID ?? summary.Id ?? summary.id ?? "");
    if (!id) continue;
    const message = await fetch(new URL(`/api/v1/message/${id}`, mailpitUrl)).then((response) => response.json());
    const otp = findOtp(message);
    if (otp) return otp;
  }
  throw new Error(`No login code reached Mailpit for ${email}.`);
}

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const publicContext = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
await publicContext.addInitScript(() => window.localStorage.setItem("astra:theme:v1", "light"));
const publicPage = await publicContext.newPage();
await publicPage.goto(`${appBaseUrl}/login?next=/self`, { waitUntil: "networkidle" });
const loginPng = await publicPage.screenshot({ animations: "disabled" });

const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
await context.addInitScript(() => window.localStorage.setItem("astra:theme:v1", "light"));
const page = await context.newPage();
await page.goto(`${appBaseUrl}/login?next=/self`, { waitUntil: "networkidle" });
await page.getByRole("textbox", { name: "Email" }).fill(email);
await page.getByRole("button", { name: "Send code" }).click();
await page.getByRole("textbox", { name: "Code" }).fill(await readOtp());
await page.getByRole("button", { name: "Verify code" }).click();
await page.waitForURL(/\/self(?:[?#]|$)/);
await page.getByRole("heading", { name: email }).first().waitFor();
const sessionResponse = await page.request.get(`${appBaseUrl}/api/auth/get-session`);
const session = (await sessionResponse.json()) as JsonObject;
if (!session.user) throw new Error("The overview browser did not retain its authenticated Astra session.");

const images = new Map<string, Buffer>([["/login?next=/self", loginPng]]);
for (const screen of screens.filter((screen) => !("public" in screen && screen.public))) {
  await page.goto(`${appBaseUrl}${screen.route}`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 0));
  const bodyText = await page.locator("body").innerText();
  if (/Sign in to (?:see|create)/.test(bodyText)) throw new Error(`${screen.route} rendered its signed-out gate during overview capture.`);
  images.set(screen.route, await page.screenshot({ animations: "disabled" }));
}

const tiles = screens.map((screen, index) => {
  const data = images.get(screen.route)?.toString("base64");
  if (!data) throw new Error(`Missing screenshot for ${screen.route}.`);
  return `<section class="tile">
    <img src="data:image/png;base64,${data}" alt="${htmlEscape(screen.title)} screen">
    <div class="notes">
      <div class="number">${index + 1}</div>
      <h2>${htmlEscape(screen.title)}</h2>
      <code>${htmlEscape(screen.route.split("?")[0] || "/")}</code>
      <p>${htmlEscape(screen.purpose)}</p>
      <span>Next</span>
      <p class="next">${htmlEscape(screen.next)}</p>
    </div>
  </section>`;
}).join("\n");

const overviewHtml = `<!doctype html>
<html><head><meta charset="utf-8"><style>
@page { size: Letter portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; width: 816px; height: 1056px; overflow: hidden; }
body { padding: 28px; background: #fbfaf7; color: #171412; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
header { height: 74px; display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #a66f2d; }
h1 { margin: 0; color: #a66f2d; font-family: Georgia, serif; font-size: 30px; font-weight: 600; }
header p { width: 270px; margin: 3px 0 0; color: #625a50; font-size: 11px; line-height: 1.35; text-align: right; }
.grid { height: 926px; padding-top: 18px; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); gap: 14px; }
.tile { min-width: 0; display: grid; grid-template-columns: 132px 1fr; gap: 14px; overflow: hidden; border: 1px solid #ded8ce; border-radius: 7px; padding: 12px; background: #fff; box-shadow: 0 8px 24px rgba(64,45,25,.08); }
.tile img { width: 132px; height: 100%; min-height: 0; border: 1px solid #393936; border-radius: 5px; object-fit: cover; object-position: top; background: #f6f2ea; }
.notes { min-width: 0; align-self: center; }
.number { width: 27px; height: 27px; display: grid; place-items: center; border-radius: 50%; background: #a66f2d; color: #fff; font-weight: 800; font-size: 13px; }
h2 { margin: 10px 0 4px; color: #171412; font-family: Georgia, serif; font-size: 22px; }
code { color: #315b7d; font-size: 10px; }
.notes p { margin: 12px 0 18px; color: #625a50; font-size: 12px; line-height: 1.4; }
.notes span { display: block; color: #a66f2d; font-size: 9px; font-weight: 800; text-transform: uppercase; }
.notes p.next { margin: 3px 0 0; color: #171412; font-size: 11px; font-weight: 650; }
</style></head><body>
<header><h1>Astra in Light Mode</h1><p>Current July 2026 product map. Five primary tabs plus the private entry screen, shown at the phone viewport.</p></header>
<main class="grid">${tiles}</main>
</body></html>`;

const htmlPath = join(outputDir, "astra-light-mode-overview-letter.html");
await writeFile(htmlPath, overviewHtml);
const printContext = await browser.newContext({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 3.125, colorScheme: "light" });
const printPage = await printContext.newPage();
await printPage.goto(`file://${htmlPath}`, { waitUntil: "load" });
await printPage.screenshot({ path: join(outputDir, "astra-light-mode-overview-letter.png"), animations: "disabled" });
await printPage.pdf({ path: join(outputDir, "astra-light-mode-overview-letter.pdf"), format: "Letter", printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
await browser.close();

console.log(`Created light-mode overview in ${outputDir}.`);
