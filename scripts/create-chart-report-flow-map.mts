import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { appUserProfiles, creditLedgerEntries, db, mirrorCreditBalanceToProfile } from "@astra/db";
import { chromium, type Locator, type Page } from "@playwright/test";
import { eq } from "drizzle-orm";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const mailpitUrl = clean(process.env.MAILPIT_API_URL) || "http://localhost:8025";
const runId = Date.now();
const email = clean(process.env.ASTRA_FLOW_MAP_EMAIL) || `chart-report-flow-${runId}@example.com`;
const name = clean(process.env.ASTRA_FLOW_MAP_NAME) || "Astra Flow Map";
const outputDir = join(process.cwd(), "output", "astra-chart-report-flow-map");

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
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
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
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No login code reached Mailpit for ${email}.`);
}

async function grantFlowMapStars() {
  const [profile] = await db.select().from(appUserProfiles).where(eq(appUserProfiles.email, email)).limit(1);
  if (!profile) throw new Error(`No profile was created for ${email}.`);
  const grantAmount = Math.max(0, 30 - profile.starBalance);
  if (!grantAmount) return;
  await db.insert(creditLedgerEntries).values({
    amount: grantAmount,
    description: "Chart/report flow-map grant",
    eventType: "admin_adjustment",
    idempotencyKey: `chart_report_flow_map:${profile.userId}:${runId}`,
    metadata: { actor: "flow-map-generator", purpose: "local-print-artifact" },
    source: "flow_map_generator",
    userId: profile.userId
  });
  await mirrorCreditBalanceToProfile(db, profile.userId);
}

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

async function capture(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  return locator.screenshot({ animations: "disabled" });
}

async function captureReportArrival(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const shell = page.locator(".reportReaderShell");
  const plate = page.locator(".reportDocumentPlate");
  await shell.waitFor();
  await plate.waitFor();
  const shellBox = await shell.boundingBox();
  const plateBox = await plate.boundingBox();
  if (!shellBox || !plateBox) throw new Error("Could not measure the generated Library report.");
  const bottom = plateBox.y + plateBox.height + 18;
  return page.screenshot({
    animations: "disabled",
    clip: {
      x: Math.max(0, shellBox.x),
      y: Math.max(0, shellBox.y),
      width: Math.min(820 - Math.max(0, shellBox.x), shellBox.width),
      height: bottom - Math.max(0, shellBox.y)
    }
  });
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, colorScheme: "light" });
await context.addInitScript(() => window.localStorage.setItem("astra:theme:v1", "light"));
const page = await context.newPage();

await page.goto(`${appBaseUrl}/login?next=/self`, { waitUntil: "networkidle" });
await page.getByRole("textbox", { name: "Email" }).fill(email);
await page.getByRole("button", { name: "Send code" }).click();
await page.getByRole("textbox", { name: "Code" }).fill(await readOtp());
await page.getByRole("button", { name: "Verify code" }).click();
await page.waitForURL(/\/self(?:[?#]|$)/);
await page.getByRole("heading", { level: 1, name: email }).waitFor();
await grantFlowMapStars();
await page.reload({ waitUntil: "networkidle" });

const panel = page.locator("#self-birth-onboarding article.card").first();
await panel.scrollIntoViewIfNeeded();
const images = new Map<string, Buffer>();
images.set("person", await capture(panel));

await panel.getByLabel("Your name").fill(name);
await panel.getByRole("button", { name: "Next", exact: true }).click();
await panel.getByRole("button", { name: "Edit birth details" }).click();
const birthDialog = page.getByRole("dialog", { name: "Birth Details" });
await birthDialog.getByLabel("Birth year").fill("1961");
await birthDialog.getByLabel("Birth month").selectOption({ label: "May" });
await birthDialog.getByRole("button", { name: "May 23, 1961" }).click();
await birthDialog.getByLabel("Time", { exact: true }).fill("09:30");
await birthDialog.getByLabel("Time Zone").selectOption("America/Chicago");
images.set("moment", await capture(birthDialog));
await birthDialog.getByRole("button", { name: "Continue" }).click();

await panel.getByRole("button", { name: "Edit birth location" }).click();
const locationDialog = page.getByRole("dialog", { name: "Birth Location" });
await locationDialog.getByLabel("Search birth place").fill("Chicago");
await locationDialog.getByRole("button", { name: "Search", exact: true }).click();
const chicagoResult = locationDialog.getByRole("button", { name: /Chicago, IL, USA/ }).first();
await chicagoResult.waitFor();
await chicagoResult.click();
images.set("place", await capture(locationDialog));
await locationDialog.getByRole("button", { name: "Continue", exact: true }).click();

await panel.getByRole("button", { name: "Next", exact: true }).click();
const chartSettings = panel.getByRole("group", { name: "Chart settings" });
const reportChoices = panel.getByRole("group", { name: "Report", exact: true });
images.set("settings", await capture(chartSettings));
images.set("report", await capture(reportChoices));
const zodiacRowBox = await chartSettings.getByRole("radiogroup", { name: "Zodiac" }).boundingBox();
const housesRowBox = await chartSettings.getByRole("radiogroup", { name: "Houses" }).boundingBox();
const settingsRowDistance =
  zodiacRowBox && housesRowBox
    ? housesRowBox.y + housesRowBox.height / 2 - (zodiacRowBox.y + zodiacRowBox.height / 2)
    : Number.POSITIVE_INFINITY;
if (settingsRowDistance > 22) {
  const settingsMetrics = await chartSettings.evaluate((fieldset) =>
    [...fieldset.querySelectorAll<HTMLElement>('[role="radiogroup"]')].map((group) => {
      const row = group.parentElement!;
      const rowStyle = getComputedStyle(row);
      const option = group.querySelector<HTMLElement>("label")!;
      const input = group.querySelector<HTMLElement>("input")!;
      return {
        groupHeight: group.getBoundingClientRect().height,
        inputHeight: input.getBoundingClientRect().height,
        inputMinHeight: getComputedStyle(input).minHeight,
        optionHeight: option.getBoundingClientRect().height,
        optionMinHeight: getComputedStyle(option).minHeight,
        rowGap: rowStyle.gap,
        rowHeight: row.getBoundingClientRect().height,
        rowMinHeight: rowStyle.minHeight
      };
    })
  );
  throw new Error(`Chart settings rows are not using compact single spacing: ${settingsRowDistance}px ${JSON.stringify(settingsMetrics)}.`);
}

await panel.getByRole("button", { name: "Order Report", exact: true }).click();
const confirmDialog = page.getByRole("dialog", { name: "Confirm Report" });
images.set("confirm", await capture(confirmDialog));
const confirmTitleAlignment = await confirmDialog.getByRole("heading", { name: "Confirm Report" }).evaluate((element) => getComputedStyle(element).textAlign);
if (confirmTitleAlignment !== "center") throw new Error("Confirm Report title is not centered.");
await confirmDialog.getByRole("button", { name: "Order Report", exact: true }).click();
await page.waitForURL(/\/library\?reportId=/, { timeout: 30_000 });
await page.locator(".reportDocumentPlate").waitFor();
images.set("arrival", await captureReportArrival(page));
images.set("provenance", await capture(page.locator(".reportDocumentPlate")));

const reportActionHeights = await page.locator(".reportActionsToolbar button").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
if (!reportActionHeights.length || Math.max(...reportActionHeights) - Math.min(...reportActionHeights) > 1) {
  throw new Error("Library report actions do not share a stable height.");
}

await page.setViewportSize({ width: 390, height: 844 });
await page.locator(".reportReaderHeader").scrollIntoViewIfNeeded();
const mobileReportMetrics = await page.evaluate(() => ({
  actionButtons: document.querySelectorAll(".reportActionsToolbar button").length,
  hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
  titleSize: Number.parseFloat(getComputedStyle(document.querySelector(".reportReaderHeader h1")!).fontSize)
}));
if (mobileReportMetrics.hasOverflow || mobileReportMetrics.actionButtons !== 6 || mobileReportMetrics.titleSize > 42) {
  throw new Error(`Mobile Library report header/actions failed layout checks: ${JSON.stringify(mobileReportMetrics)}`);
}

const stages = [
  { key: "person", title: "Name the person", label: "New chart only", body: "Self starts prefilled. A new Ally also asks relationship. Existing saved charts skip to step 4." },
  { key: "moment", title: "Birth date and time", label: "Birth facts", body: "Calendar, local time, time zone, and an explicit unknown-time choice become the birth snapshot." },
  { key: "place", title: "Add birth place", label: "Optional place", body: "Place improves coordinates and time-zone confidence. The chart can still proceed without it." },
  { key: "settings", title: "Choose chart settings", label: "Required choice", body: "Zodiac and Houses are selected up front and submitted explicitly for this report." },
  { key: "report", title: "Choose the report", label: "Basis inferred", body: "Identity, Core, and Deep use natal evidence. Progressed and Synastry reveal only their extra inputs." },
  { key: "confirm", title: "Confirm the order", label: "Trust checkpoint", body: "A final review shows report, basis, exact settings, cost, and current Star balance before purchase." },
  { key: "arrival", title: "Generate and open", label: "Library destination", body: "Astra calculates the chart, writes the interpretation, stores it, and opens the finished artifact." },
  { key: "provenance", title: "Keep the provenance", label: "Immutable snapshot", body: "The report records the basis, Zodiac, Houses, birth data, location, and chart anchors that produced it." }
] as const;

const tiles = stages.map((stage, index) => {
  const image = images.get(stage.key);
  if (!image) throw new Error(`Missing flow-map image ${stage.key}.`);
  return `<section class="tile">
    <div class="visual"><img src="data:image/png;base64,${image.toString("base64")}" alt="${htmlEscape(stage.title)}"></div>
    <div class="copy"><span class="step">${index + 1}</span><span class="label">${htmlEscape(stage.label)}</span><h2>${htmlEscape(stage.title)}</h2><p>${htmlEscape(stage.body)}</p></div>
  </section>`;
}).join("\n");

const mapHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: 17in 11in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; width: 1632px; height: 1056px; overflow: hidden; }
body { padding: 28px 34px 24px; background: #fbfaf7; color: #171412; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
header { height: 82px; display: grid; grid-template-columns: 1fr 560px; gap: 36px; align-items: start; border-bottom: 2px solid #a66f2d; }
h1 { margin: 0; color: #a66f2d; font-family: Georgia, serif; font-size: 34px; font-weight: 600; }
header p { margin: 4px 0 0; color: #625a50; font-size: 13px; line-height: 1.45; text-align: right; }
.ontology { height: 58px; display: flex; align-items: center; justify-content: center; gap: 10px; color: #315b7d; font-size: 15px; font-weight: 760; }
.ontology b { color: #a66f2d; }
.grid { height: 840px; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr); gap: 14px; }
.tile { position: relative; min-width: 0; overflow: visible; display: grid; grid-template-rows: 254px 1fr; border: 1px solid #ded8ce; border-radius: 7px; background: #fff; box-shadow: 0 8px 24px rgba(64,45,25,.07); }
.tile:not(:nth-child(4)):not(:nth-child(8))::after { content: "\\2192"; position: absolute; z-index: 3; right: -19px; top: 118px; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #a66f2d; color: #fff; font-size: 16px; }
.visual { min-height: 0; display: grid; place-items: center; overflow: hidden; padding: 10px; background: #f6f2ea; border-bottom: 1px solid #ded8ce; }
.visual img { display: block; max-width: 100%; max-height: 234px; object-fit: contain; border: 1px solid #cfc6b8; border-radius: 4px; background: #fff; }
.copy { position: relative; padding: 13px 15px 12px 54px; }
.step { position: absolute; left: 14px; top: 13px; width: 29px; height: 29px; display: grid; place-items: center; border-radius: 50%; background: #a66f2d; color: #fff; font-weight: 850; font-size: 13px; }
.label { color: #315b7d; font-size: 9px; font-weight: 850; text-transform: uppercase; }
h2 { margin: 3px 0 6px; color: #171412; font-family: Georgia, serif; font-size: 20px; line-height: 1.05; }
.copy p { margin: 0; color: #625a50; font-size: 11px; line-height: 1.38; }
footer { height: 52px; display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: end; color: #625a50; font-size: 11px; }
footer strong { color: #171412; }
</style></head><body>
<header><h1>Astra Chart &rarr; Report Product Map</h1><p><strong>The five primary tabs remain the stable product navigation.</strong> This sheet only explains the chart data-entry and report-creation workflow inside Self and Allies.</p></header>
<div class="ontology"><b>Person</b><span>&rarr;</span><b>Birth facts</b><span>&rarr;</span><b>Chart settings snapshot</b><span>&rarr;</span><b>Report basis</b><span>&rarr;</span><b>Report</b><span>&rarr;</span><b>Library</b></div>
<main class="grid">${tiles}</main>
<footer><span><strong>Flow rule:</strong> new person = steps 1-8; existing saved chart = steps 4-8. Report basis is inferred from the report choice, so there is no extra technical step.</span><span>Light mode &middot; July 2026</span></footer>
</body></html>`;

const htmlPath = join(outputDir, "astra-chart-report-flow-map-tabloid.html");
await writeFile(htmlPath, mapHtml);
const printContext = await browser.newContext({ viewport: { width: 1632, height: 1056 }, deviceScaleFactor: 3.125, colorScheme: "light" });
const printPage = await printContext.newPage();
await printPage.goto(`file://${htmlPath}`, { waitUntil: "load" });
await printPage.screenshot({ path: join(outputDir, "astra-chart-report-flow-map-tabloid.png"), animations: "disabled" });
await printPage.pdf({
  path: join(outputDir, "astra-chart-report-flow-map-tabloid.pdf"),
  width: "17in",
  height: "11in",
  landscape: true,
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" }
});
await browser.close();

console.log(`Created chart/report flow map in ${outputDir}.`);
process.exit(0);
