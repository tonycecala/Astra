import {
  buildChartMakerChartData,
  buildChartMakerRecordResult,
  chartPrecision,
  deriveSeason,
  deriveSunSign
} from "@astra/chart-maker";
import { chartMakerChartDataSchema, chartMakerRequestSchema, recordChartMakerResultSchema } from "@astra/contracts";

const now = "2026-06-16T00:00:00.000Z";

const timedRequest = chartMakerRequestSchema.parse({
  id: "chart_maker_tony_timed_smoke",
  userId: "user_tony_smoke",
  subjectName: "Tony C",
  birthData: {
    date: "1961-05-23",
    time: "09:30",
    timezone: "America/New_York",
    location: "New York, NY, USA",
    latitude: 40.7128,
    longitude: -74.006
  },
  question: "What pattern should Astra hand to Composer?",
  intent: "tony-chart-maker-module-smoke",
  context: {
    source: "test:chart-maker"
  },
  source: "self",
  status: "queued",
  createdAt: now,
  updatedAt: now
});

const dateOnlyRequest = chartMakerRequestSchema.parse({
  ...timedRequest,
  id: "chart_maker_tony_date_only_smoke",
  birthData: {
    date: "1961-05-23"
  }
});

const timedTimezoneRequest = chartMakerRequestSchema.parse({
  ...timedRequest,
  id: "chart_maker_tony_timed_timezone_smoke",
  birthData: {
    date: "1961-05-23",
    time: "09:30",
    timezone: "America/New_York"
  }
});

const unknownTimeRequest = chartMakerRequestSchema.parse({
  ...timedRequest,
  id: "chart_maker_tony_unknown_time_smoke",
  birthData: {
    date: "1961-05-23",
    timezone: "America/New_York",
    birthTimeKnown: false
  }
});

if (deriveSunSign("1961-05-23") !== "Gemini") {
  throw new Error("Tony's smoke date should derive a Gemini solar signal.");
}

if (deriveSeason("1961-05-23") !== "spring") {
  throw new Error("Tony's smoke date should derive spring.");
}

if (chartPrecision(timedRequest.birthData) !== "timed_location") {
  throw new Error("Timed Tony fixture should preserve the full precision bundle.");
}

if (chartPrecision(timedTimezoneRequest.birthData) !== "timed_timezone") {
  throw new Error("Timed Tony fixture without place should preserve time and timezone precision.");
}

if (chartPrecision(dateOnlyRequest.birthData) !== "date_only") {
  throw new Error("Date-only Tony fixture should remain a valid date-only request.");
}

if (chartPrecision(unknownTimeRequest.birthData) !== "date_only") {
  throw new Error("Unknown-time Tony fixture should avoid timed chart precision.");
}

const chartData = buildChartMakerChartData(timedRequest);
chartMakerChartDataSchema.parse(chartData);

if (chartData.derived.sunSign !== "Gemini" || chartData.precision !== "timed_location") {
  throw new Error("Chart-maker chart data did not preserve the expected Tony fixture derivations.");
}

const recordResult = buildChartMakerRecordResult(timedRequest);
recordChartMakerResultSchema.parse(recordResult);

if (recordResult.chartData?.requestId !== timedRequest.id) {
  throw new Error("Chart-maker record result did not carry the source request id.");
}

console.log(`Chart-maker module smoke passed: ${recordResult.engine} -> ${chartData.derived.sunSign}.`);
