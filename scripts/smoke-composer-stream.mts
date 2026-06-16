import { composerStreamArtifactSchema } from "@astra/contracts";
import {
  publishAstrologyReportSignalArtifact,
  publishComposerStreamArtifact,
  validateComposerVoiceCard
} from "../apps/composer-web/src/index";

const validFixtures = [
  {
    voice: { id: "guide" },
    header: "Five clear steps to take next",
    body: "Follow these exact actions tonight to collect a reusable draft for Codex."
  },
  {
    voice: { id: "companion" },
    header: "Quick check-in on last session",
    body: "Noticing progress matters. Try two tiny actions tonight and keep the record gentle."
  },
  {
    voice: { id: "prompt" },
    header: "Small prompt for ten minutes",
    body: "Try this micro-experiment and log the result in one paragraph."
  }
] as const;

for (const fixture of validFixtures) {
  const result = validateComposerVoiceCard(fixture);
  if (!result.ok) {
    throw new Error(`Expected ${fixture.voice.id} fixture to pass validation.`);
  }
}

const invalidFixtures = [
  {
    voice: { id: "guide" },
    header: "You must fix this now",
    body: "This uses banned guide language."
  },
  {
    voice: { id: "companion" },
    header: "You should feel bad about missing this",
    body: "This uses shame and guilt framing."
  },
  {
    voice: { id: "prompt" },
    header: "Always do this one thing",
    body: "This uses a banned prompt term."
  }
] as const;

for (const fixture of invalidFixtures) {
  const result = validateComposerVoiceCard(fixture);
  if (result.ok) {
    throw new Error(`Expected ${fixture.voice.id} fixture to fail validation.`);
  }
}

const published = publishComposerStreamArtifact({
  id: "composer_stream_artifact_smoke",
  cardId: "composer_card_smoke",
  streamItemId: "composer_stream_item_smoke",
  voiceCard: validFixtures[0],
  rationale: {
    reason: "Shown because Composer validated a guide voice card for the stream.",
    source: "composer_voice"
  },
  lane: "today",
  position: 0,
  createdAt: "2026-06-16T00:00:00.000Z"
});

if (!published.ok) {
  throw new Error("Expected Composer stream artifact publish to pass validation.");
}

composerStreamArtifactSchema.parse(published.artifact);
if (published.artifact.streamItem.status !== "published") {
  throw new Error("Composer stream publisher must default stream items to published.");
}
if (published.artifact.card.subtitle !== published.artifact.rationale.reason) {
  throw new Error("Composer stream publisher must carry the rationale into the card subtitle.");
}

const reportSignalPublished = publishAstrologyReportSignalArtifact({
  id: "composer_report_signal_artifact_smoke",
  cardId: "composer_report_signal_card_smoke",
  streamItemId: "composer_report_signal_stream_item_smoke",
  signal: {
    reportId: "report_smoke",
    requestId: "report_request_smoke",
    reportType: "core_self",
    headline: "A report signal is ready",
    summary: "Composer received a report-safe public signal without raw private report payloads.",
    tone: "grounded",
    boundary: "public_signal",
    provenanceSummary: "Shown because an astrology report exposed a public signal."
  },
  voiceCard: {
    voice: { id: "guide" },
    header: "A report signal is ready",
    body: "Composer can publish this card without loading raw private report sections."
  },
  position: 1,
  createdAt: "2026-06-16T00:00:00.000Z"
});

if (!reportSignalPublished.ok) {
  throw new Error("Expected Composer report-signal artifact publish to pass validation.");
}

composerStreamArtifactSchema.parse(reportSignalPublished.artifact);
if (reportSignalPublished.artifact.rationale.source !== "chart_result") {
  throw new Error("Composer report-signal artifacts must identify chart/report provenance.");
}
if (reportSignalPublished.artifact.streamItem.kind !== "artifact") {
  throw new Error("Composer report-signal artifacts must publish as artifact stream items.");
}

console.log(`Composer stream smoke passed: ${published.artifact.id}, ${reportSignalPublished.artifact.id}.`);
