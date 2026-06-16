import {
  type ChartBirthData,
  type ChartMakerChartData,
  type ChartMakerPrecision,
  type ChartMakerRequest,
  type RecordChartMakerResult,
  chartMakerChartDataSchema,
  chartMakerRequestSchema,
  recordChartMakerResultSchema
} from "@astra/contracts";

export const ASTRA_CHART_MAKER_ENGINE = "astra-chart-maker-local-v1";

type SunSignWindow = {
  sign: string;
  starts: [month: number, day: number];
};

const sunSignWindows: SunSignWindow[] = [
  { sign: "Capricorn", starts: [1, 1] },
  { sign: "Aquarius", starts: [1, 20] },
  { sign: "Pisces", starts: [2, 19] },
  { sign: "Aries", starts: [3, 21] },
  { sign: "Taurus", starts: [4, 20] },
  { sign: "Gemini", starts: [5, 21] },
  { sign: "Cancer", starts: [6, 21] },
  { sign: "Leo", starts: [7, 23] },
  { sign: "Virgo", starts: [8, 23] },
  { sign: "Libra", starts: [9, 23] },
  { sign: "Scorpio", starts: [10, 23] },
  { sign: "Sagittarius", starts: [11, 22] },
  { sign: "Capricorn", starts: [12, 22] }
];

function dateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) throw new Error(`Invalid chart birth date: ${date}`);
  return { year, month, day };
}

function dayOfYear(date: string) {
  const { year, month, day } = dateParts(date);
  const start = Date.UTC(year, 0, 0);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86_400_000);
}

function compareMonthDay(month: number, day: number, [startMonth, startDay]: [number, number]) {
  if (month !== startMonth) return month - startMonth;
  return day - startDay;
}

export function deriveSunSign(date: string) {
  const { month, day } = dateParts(date);
  let sign = "Capricorn";
  for (const window of sunSignWindows) {
    if (compareMonthDay(month, day, window.starts) >= 0) {
      sign = window.sign;
    }
  }
  return sign;
}

export function deriveSeason(date: string) {
  const { month } = dateParts(date);
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function chartPrecision(birthData: ChartBirthData): ChartMakerPrecision {
  return birthData.time && birthData.timezone && birthData.location ? "timed_location" : "date_only";
}

function interpretationFor(request: ChartMakerRequest, precision: ChartMakerPrecision) {
  const sunSign = deriveSunSign(request.birthData.date);
  const precisionText =
    precision === "timed_location"
      ? `The request includes time, timezone, and place, so the handoff preserves the precision bundle for a future full chart engine.`
      : `The request is date-only, so this module avoids houses, angles, and time-sensitive claims.`;

  return {
    headline: `${request.subjectName} carries a ${sunSign} solar signal`,
    summary: `${precisionText} This first engine produces a stable symbolic payload for Astra, Composer, and the chart-result API to share.`,
    limits:
      precision === "timed_location"
        ? [
            "This deterministic module is a contract adapter, not a full ephemeris engine.",
            "Time, timezone, location, and coordinates are preserved for the independent ephemeris implementation."
          ]
        : [
            "This deterministic module is a contract adapter, not a full ephemeris engine.",
            "Date-only requests omit houses, angles, moon sign, ascendant, and time-sensitive placements."
          ]
  };
}

export function buildChartMakerChartData(input: ChartMakerRequest): ChartMakerChartData {
  const request = chartMakerRequestSchema.parse(input);
  const precision = chartPrecision(request.birthData);
  const chartData = {
    schemaVersion: 1,
    engine: ASTRA_CHART_MAKER_ENGINE,
    requestId: request.id,
    subjectName: request.subjectName,
    precision,
    birthData: request.birthData,
    derived: {
      sunSign: deriveSunSign(request.birthData.date),
      season: deriveSeason(request.birthData.date),
      dayOfYear: dayOfYear(request.birthData.date)
    },
    interpretation: interpretationFor(request, precision),
    requestContext: {
      question: request.question,
      intent: request.intent,
      source: request.source
    }
  };

  return chartMakerChartDataSchema.parse(chartData);
}

export function buildChartMakerRecordResult(input: ChartMakerRequest): RecordChartMakerResult {
  const request = chartMakerRequestSchema.parse(input);
  const chartData = buildChartMakerChartData(request);

  return recordChartMakerResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: ASTRA_CHART_MAKER_ENGINE,
    status: "completed",
    summary: chartData.interpretation.headline,
    chartData
  });
}

export function buildChartMakerFailureResult(input: ChartMakerRequest, error: string): RecordChartMakerResult {
  const request = chartMakerRequestSchema.parse(input);

  return recordChartMakerResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: ASTRA_CHART_MAKER_ENGINE,
    status: "failed",
    error,
    chartData: {
      schemaVersion: 1,
      engine: ASTRA_CHART_MAKER_ENGINE,
      requestId: request.id,
      status: "failed"
    }
  });
}
