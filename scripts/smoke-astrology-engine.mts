import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  LOCAL_ASTRONOMY_ENGINE,
  buildAstrologyReportResult
} from "@astra/astrology";
import { astrologyReportRequestSchema } from "@astra/contracts";

const reportRequest = astrologyReportRequestSchema.parse({
  id: "astrology_engine_smoke",
  userId: "astrology_engine_smoke_user",
  reportType: "core_self",
  subjectName: "Tony C",
  birthData: {
    date: "1961-05-23",
    time: "09:30",
    timezone: "America/New_York",
    location: "New York, NY, USA",
    latitude: 40.7128,
    longitude: -74.006
  },
  question: "What should this report preserve?",
  intent: "astrology-engine-smoke",
  source: "self",
  boundary: "private",
  status: "queued",
  costCredits: 0,
  createdAt: "2026-06-16T00:00:00.000Z",
  updatedAt: "2026-06-16T00:00:00.000Z"
});

const previousEngine = process.env[ASTRA_EPHEMERIS_ENGINE_ENV];

delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
const unavailable = buildAstrologyReportResult(reportRequest);
if (unavailable.status !== "failed") {
  throw new Error("Unconfigured astrology engine must fail explicitly.");
}
if (!unavailable.error?.includes(ASTRA_EPHEMERIS_ENGINE_ENV)) {
  throw new Error(`Unconfigured astrology engine error must name ${ASTRA_EPHEMERIS_ENGINE_ENV}.`);
}

process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = LOCAL_ASTRONOMY_ENGINE;
const completed = buildAstrologyReportResult(reportRequest);
if (completed.status !== "completed") {
  throw new Error("Configured local astronomy engine should complete the report result.");
}
if (completed.engine !== LOCAL_ASTRONOMY_ENGINE) {
  throw new Error(`Expected engine ${LOCAL_ASTRONOMY_ENGINE}, got ${completed.engine}.`);
}
if (!completed.summary?.includes("Gemini")) {
  throw new Error(`Expected Gemini in report summary, got: ${completed.summary ?? "missing"}`);
}
if (completed.sections.length < 3) {
  throw new Error("Configured astrology report should include core, planetary, and practice sections.");
}
if (!completed.provenance.some((entry) => entry.kind === "engine")) {
  throw new Error("Configured astrology report should include engine provenance.");
}
if (!completed.publicSignal?.headline.includes("Gemini")) {
  throw new Error("Configured astrology report should expose a Gemini public signal headline.");
}

if (previousEngine === undefined) {
  delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
} else {
  process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = previousEngine;
}

console.log(`Astrology engine smoke passed with ${LOCAL_ASTRONOMY_ENGINE}.`);
