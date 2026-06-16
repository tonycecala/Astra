import {
  ASTRA_DEFAULT_HOUSE_SYSTEM,
  ASTRA_DEFAULT_ZODIAC_MODE,
  ASTRA_EPHEMERIS_ENGINE_ENV,
  LOCAL_CHART_ROUTINE_ENGINE,
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

const einsteinPublicRequest = astrologyReportRequestSchema.parse({
  id: "astrology_engine_public_einstein_smoke",
  userId: "astrology_engine_smoke_public_user",
  reportType: "core_self",
  subjectName: "Albert Einstein",
  birthData: {
    date: "1879-03-14",
    time: "11:30",
    timezone: "Europe/Berlin",
    location: "Ulm, Germany",
    latitude: 48.4011,
    longitude: 9.9876
  },
  question: "What should this public sample preserve?",
  intent: "public-sample-engine-smoke",
  context: {
    source: "Astria public data",
    sourceUrl: "https://www.astro.com/astro-databank/Einstein,_Albert",
    roddenRating: "AA"
  },
  source: "import",
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

process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = LOCAL_CHART_ROUTINE_ENGINE;
const completed = buildAstrologyReportResult(reportRequest);
if (completed.status !== "completed") {
  throw new Error("Configured local astronomy engine should complete the report result.");
}
if (completed.engine !== LOCAL_CHART_ROUTINE_ENGINE) {
  throw new Error(`Expected engine ${LOCAL_CHART_ROUTINE_ENGINE}, got ${completed.engine}.`);
}
const expectedSignature = ["Gemini Sun", "Virgo Moon", "Cancer rising"];
const summary = completed.summary ?? "";
for (const phrase of expectedSignature) {
  if (!summary.includes(phrase)) {
    throw new Error(`Expected ${phrase} in report summary, got: ${summary || "missing"}`);
  }
}
if (completed.sections.length < 3) {
  throw new Error("Configured astrology report should include core, planetary, and practice sections.");
}
if (!completed.provenance.some((entry) => entry.kind === "engine")) {
  throw new Error("Configured astrology report should include engine provenance.");
}
if (completed.publicSignal?.headline !== "Gemini Sun, Virgo Moon, Cancer rising") {
  throw new Error(`Configured astrology report should expose Tony's GEM/VIR/CAN signature, got: ${completed.publicSignal?.headline ?? "missing"}`);
}
if (
  !completed.publicSignal.provenanceSummary.includes(ASTRA_DEFAULT_ZODIAC_MODE) ||
  !completed.publicSignal.provenanceSummary.includes(ASTRA_DEFAULT_HOUSE_SYSTEM)
) {
  throw new Error("Configured astrology report should expose tropical and whole-sign provenance.");
}

const publicCompleted = buildAstrologyReportResult(einsteinPublicRequest);
if (publicCompleted.publicSignal?.headline !== "Pisces Sun, Sagittarius Moon, Cancer rising") {
  throw new Error(
    `Configured astrology report should preserve Einstein's public AA chart signature, got: ${publicCompleted.publicSignal?.headline ?? "missing"}`
  );
}

if (previousEngine === undefined) {
  delete process.env[ASTRA_EPHEMERIS_ENGINE_ENV];
} else {
  process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = previousEngine;
}

console.log(`Astrology engine smoke passed with ${LOCAL_CHART_ROUTINE_ENGINE}.`);
