import { composerStreamArtifactSchema } from "@astra/contracts";
import { publishAstrologyReportSignalArtifact } from "../apps/composer-web/src/index";

type JsonObject = Record<string, unknown>;

const appBaseUrl = clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
const internalToken = clean(process.env.ASTRA_INTERNAL_API_TOKEN);

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

if (!internalToken) {
  throw new Error("ASTRA_INTERNAL_API_TOKEN is required for the Composer ingest API smoke.");
}

async function requestJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}: ${text}`);
  }

  return text ? (JSON.parse(text) as JsonObject) : {};
}

const createdAt = "2026-06-16T00:00:00.000Z";
const artifact = composerStreamArtifactSchema.parse({
  id: "composer_ingest_api_smoke",
  target: "stream",
  publisher: "composer",
  rationale: {
    reason: "Shown because the Composer ingest smoke published a contract-backed stream card.",
    source: "manual"
  },
  voiceCard: {
    voice: { id: "guide" },
    header: "Composer Handshake Card",
    body: "Astra accepted this card through the Composer artifact contract and stored it in the public stream."
  },
  card: {
    id: "composer_card_ingest_smoke",
    title: "Composer Handshake Card",
    subtitle: "Shown because the Composer ingest smoke published a contract-backed stream card.",
    body: "Astra accepted this card through the Composer artifact contract and stored it in the public stream.",
    lane: "today",
    tone: "grounded",
    ctaLabel: "Open",
    ctaAction: "open",
    publishedAt: createdAt
  },
  streamItem: {
    id: "composer_stream_item_ingest_smoke",
    cardId: "composer_card_ingest_smoke",
    kind: "card",
    position: 99,
    status: "published",
    audience: "all"
  },
  createdAt
});

const response = await requestJson(`${appBaseUrl}/api/composer/stream-artifacts`, {
  method: "POST",
  headers: {
    "x-astra-internal-token": internalToken
  },
  body: JSON.stringify(artifact)
});

if ((response.artifact as JsonObject | undefined)?.id !== artifact.id) {
  throw new Error("Composer stream artifact ingest API did not return the stored artifact.");
}

const reportSignalArtifact = publishAstrologyReportSignalArtifact({
  id: "composer_report_signal_ingest_smoke",
  cardId: "composer_report_signal_card_ingest_smoke",
  streamItemId: "composer_report_signal_stream_item_ingest_smoke",
  signal: {
    reportId: "report_signal_ingest_smoke",
    requestId: "report_request_signal_ingest_smoke",
    reportType: "core_self",
    headline: "Report Signal Card",
    summary: "Astra rendered this stream card from a Composer report signal without exposing raw private report payloads.",
    tone: "grounded",
    boundary: "public_signal",
    provenanceSummary: "Shown because a private report exposed an approved public signal."
  },
  voiceCard: {
    voice: { id: "guide" },
    header: "Report Signal Card",
    body: "Astra rendered this stream card from a Composer report signal without exposing raw private report payloads."
  },
  position: 100,
  createdAt
});

if (!reportSignalArtifact.ok) {
  throw new Error("Composer report-signal artifact fixture did not validate.");
}

const signalResponse = await requestJson(`${appBaseUrl}/api/composer/stream-artifacts`, {
  method: "POST",
  headers: {
    "x-astra-internal-token": internalToken
  },
  body: JSON.stringify(reportSignalArtifact.artifact)
});

if ((signalResponse.artifact as JsonObject | undefined)?.id !== reportSignalArtifact.artifact.id) {
  throw new Error("Composer report-signal ingest API did not return the stored artifact.");
}

const journey = await fetch(`${appBaseUrl}/journey`);
const html = await journey.text();
if (!journey.ok || !html.includes("Composer Handshake Card")) {
  throw new Error(`/journey did not render the Composer-ingested stream card. Status: ${journey.status}`);
}
if (!html.includes("Report Signal Card")) {
  throw new Error("/journey did not render the Composer-ingested report signal card.");
}

console.log(`Composer stream ingest API smoke passed: ${artifact.id}, ${reportSignalArtifact.artifact.id}.`);
