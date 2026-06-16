import {
  type AstrologyReportRequest,
  type BirthPlaceSearchQuery,
  type BirthPlaceSearchResponse,
  type RecordAstrologyReportResult,
  astrologyReportRequestSchema,
  birthPlaceSearchQuerySchema,
  birthPlaceSearchResponseSchema,
  recordAstrologyReportResultSchema
} from "@astra/contracts";
import * as horoscopeModule from "circular-natal-horoscope-js";

export const ASTRA_ASTROLOGY_REPORT_ADAPTER = "astra-astrology-report-adapter";
export const ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION = "0.1.0";
export const ASTRA_EPHEMERIS_ENGINE_ENV = "ASTRA_EPHEMERIS_ENGINE";
export const ASTRA_PLACE_SEARCH_PROVIDER_ENV = "ASTRA_PLACE_SEARCH_PROVIDER";
export const LOCAL_CHART_ROUTINE_ENGINE = "local-chart-routine";
export const ASTRA_CHART_ROUTINE = "circular-natal-horoscope-js";
export const ASTRA_DEFAULT_ZODIAC_MODE = "tropical";
export const ASTRA_DEFAULT_HOUSE_SYSTEM = "whole-sign";

export type AstrologyReportGenerationConfig = {
  ephemerisEngine?: string;
};

type ZodiacSign = {
  name: string;
  element: string;
  mode: string;
};

type EphemerisPoint = {
  body: string;
  longitude: number;
  sign: string;
  degree: number;
  house?: number;
  retrograde?: boolean;
};

type ChartSignature = {
  sun: EphemerisPoint;
  moon: EphemerisPoint;
  ascendant?: EphemerisPoint;
  points: EphemerisPoint[];
  houseSystem: typeof ASTRA_DEFAULT_HOUSE_SYSTEM;
  zodiacMode: typeof ASTRA_DEFAULT_ZODIAC_MODE;
};

type HoroscopeCtor = {
  new (input: {
    origin: OriginInstance;
    houseSystem: string;
    zodiac: string;
    aspectPoints: string[];
    aspectWithPoints: string[];
    aspectTypes: string[];
    language: string;
  }): HoroscopeLike;
};

type OriginCtor = {
  new (input: {
    year: number;
    month: number;
    date: number;
    hour: number;
    minute: number;
    latitude: number;
    longitude: number;
  }): OriginInstance;
};

type OriginInstance = object;

type HoroscopePoint = {
  ChartPosition?: {
    Ecliptic?: {
      DecimalDegrees?: number;
    };
  };
  House?: {
    id?: number;
  };
  isRetrograde?: boolean;
};

type HoroscopeLike = {
  Ascendant?: HoroscopePoint;
  CelestialBodies: Record<string, HoroscopePoint | undefined>;
};

const horoscopeNamespace = horoscopeModule as unknown as {
  default?: {
    Horoscope?: HoroscopeCtor;
    Origin?: OriginCtor;
  };
  "module.exports"?: {
    Horoscope?: HoroscopeCtor;
    Origin?: OriginCtor;
  };
  Horoscope?: HoroscopeCtor;
  Origin?: OriginCtor;
};

const horoscopeLib = (horoscopeNamespace.default ?? horoscopeNamespace["module.exports"] ?? horoscopeNamespace) as {
  Horoscope: HoroscopeCtor;
  Origin: OriginCtor;
};

const { Horoscope, Origin } = horoscopeLib;

export class BirthPlaceSearchUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BirthPlaceSearchUnavailableError";
  }
}

type LocalFixturePlace = {
  id: string;
  label: string;
  timezone: string;
  latitude: number;
  longitude: number;
};

const localFixturePlaces: LocalFixturePlace[] = [
  {
    id: "local:new-york-ny-us",
    label: "New York, NY, USA",
    timezone: "America/New_York",
    latitude: 40.7128,
    longitude: -74.006
  },
  {
    id: "local:los-angeles-ca-us",
    label: "Los Angeles, CA, USA",
    timezone: "America/Los_Angeles",
    latitude: 34.0522,
    longitude: -118.2437
  },
  {
    id: "local:chicago-il-us",
    label: "Chicago, IL, USA",
    timezone: "America/Chicago",
    latitude: 41.8781,
    longitude: -87.6298
  },
  {
    id: "local:london-gb",
    label: "London, England, UK",
    timezone: "Europe/London",
    latitude: 51.5072,
    longitude: -0.1276
  },
  {
    id: "local:paris-fr",
    label: "Paris, France",
    timezone: "Europe/Paris",
    latitude: 48.8566,
    longitude: 2.3522
  }
];

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function resolveAstrologyReportGenerationConfig(
  env: Record<string, string | undefined> = process.env
): AstrologyReportGenerationConfig {
  return {
    ephemerisEngine: env[ASTRA_EPHEMERIS_ENGINE_ENV]?.trim() || undefined
  };
}

export async function searchBirthPlaces(
  input: BirthPlaceSearchQuery,
  env: Record<string, string | undefined> = process.env
): Promise<BirthPlaceSearchResponse> {
  const query = birthPlaceSearchQuerySchema.parse(input);
  const provider = env[ASTRA_PLACE_SEARCH_PROVIDER_ENV]?.trim();

  if (!provider) {
    throw new BirthPlaceSearchUnavailableError(`${ASTRA_PLACE_SEARCH_PROVIDER_ENV} is not configured.`);
  }

  if (provider !== "local-fixture") {
    throw new BirthPlaceSearchUnavailableError(`Birth place provider "${provider}" is not wired yet.`);
  }

  const normalized = normalizeSearch(query.query);
  const results = localFixturePlaces
    .filter((place) => normalizeSearch(place.label).includes(normalized))
    .slice(0, query.limit)
    .map((place) => ({
      ...place,
      provider
    }));

  return birthPlaceSearchResponseSchema.parse({
    provider,
    results
  });
}

export function buildAstrologyEngineUnavailableResult(
  input: AstrologyReportRequest,
  config: AstrologyReportGenerationConfig = resolveAstrologyReportGenerationConfig()
): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);
  const missingEngine = config.ephemerisEngine
    ? "The configured ephemeris engine is not wired to a report generator yet."
    : `${ASTRA_EPHEMERIS_ENGINE_ENV} is not configured.`;

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: ASTRA_ASTROLOGY_REPORT_ADAPTER,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "failed",
    error: `${missingEngine} Astra will not fabricate a production astrology report.`,
    sections: [],
    provenance: [
      {
        id: `${request.id}:birth-data`,
        kind: "birth_data",
        label: "Birth data",
        summary: `Birth data was accepted for ${request.subjectName}, but report generation stopped before interpretation.`,
        boundary: "private",
        sourceId: request.id
      },
      {
        id: `${request.id}:engine`,
        kind: "engine",
        label: "Astrology engine",
        summary: missingEngine,
        boundary: "private"
      }
    ]
  });
}

const zodiacSigns: ZodiacSign[] = [
  { name: "Aries", element: "fire", mode: "cardinal" },
  { name: "Taurus", element: "earth", mode: "fixed" },
  { name: "Gemini", element: "air", mode: "mutable" },
  { name: "Cancer", element: "water", mode: "cardinal" },
  { name: "Leo", element: "fire", mode: "fixed" },
  { name: "Virgo", element: "earth", mode: "mutable" },
  { name: "Libra", element: "air", mode: "cardinal" },
  { name: "Scorpio", element: "water", mode: "fixed" },
  { name: "Sagittarius", element: "fire", mode: "mutable" },
  { name: "Capricorn", element: "earth", mode: "cardinal" },
  { name: "Aquarius", element: "air", mode: "fixed" },
  { name: "Pisces", element: "water", mode: "mutable" }
];

const horoscopeBodyMap = [
  ["Sun", "sun"],
  ["Moon", "moon"],
  ["Mercury", "mercury"],
  ["Venus", "venus"],
  ["Mars", "mars"],
  ["Jupiter", "jupiter"],
  ["Saturn", "saturn"],
  ["Uranus", "uranus"],
  ["Neptune", "neptune"],
  ["Pluto", "pluto"],
  ["Chiron", "chiron"]
] as const;

function round(value: number, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function signForLongitude(longitude: number) {
  return zodiacSigns[Math.floor(normalizeDegrees(longitude) / 30)] ?? zodiacSigns[0];
}

function pointFor(body: string, longitude: number): EphemerisPoint {
  const normalized = normalizeDegrees(longitude);
  const sign = signForLongitude(normalized);
  return {
    body,
    longitude: round(normalized),
    sign: sign.name,
    degree: round(normalized % 30)
  };
}

function toLocalBirthTime(time?: string) {
  const [hourText = "12", minuteText = "00"] = (time || "12:00").split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  return {
    hour: Number.isFinite(hour) ? hour : 12,
    minute: Number.isFinite(minute) ? minute : 0
  };
}

function buildOrigin(request: AstrologyReportRequest) {
  const [yearText, monthText, dayText] = request.birthData.date.split("-");
  const { hour, minute } = toLocalBirthTime(request.birthData.time);

  return new Origin({
    year: Number.parseInt(yearText ?? "", 10),
    month: Number.parseInt(monthText ?? "", 10) - 1,
    date: Number.parseInt(dayText ?? "", 10),
    hour,
    minute,
    latitude: request.birthData.latitude ?? 0,
    longitude: request.birthData.longitude ?? 0
  });
}

function pointFromHoroscope(body: string, point: HoroscopePoint): EphemerisPoint | null {
  const longitude = point.ChartPosition?.Ecliptic?.DecimalDegrees;
  if (longitude === undefined) return null;
  return {
    ...pointFor(body, longitude),
    house: point.House?.id,
    retrograde: point.isRetrograde
  };
}

function buildChartSignature(request: AstrologyReportRequest): ChartSignature {
  const horoscope = new Horoscope({
    origin: buildOrigin(request),
    houseSystem: ASTRA_DEFAULT_HOUSE_SYSTEM,
    zodiac: ASTRA_DEFAULT_ZODIAC_MODE,
    aspectPoints: ["bodies", "angles"],
    aspectWithPoints: ["bodies", "angles"],
    aspectTypes: ["major", "quincunx"],
    language: "en"
  });

  const points = horoscopeBodyMap.flatMap(([label, key]) => {
    const point = horoscope.CelestialBodies[key];
    if (!point) return [];
    const parsed = pointFromHoroscope(label, point);
    return parsed ? [parsed] : [];
  });
  const sun = points.find((point) => point.body === "Sun");
  const moon = points.find((point) => point.body === "Moon");
  if (!sun || !moon) {
    throw new Error(`Chart routine did not return Sun and Moon for report request ${request.id}.`);
  }

  const hasAscendantInputs =
    request.birthData.time &&
    request.birthData.latitude !== undefined &&
    request.birthData.longitude !== undefined;
  const ascendant = hasAscendantInputs && horoscope.Ascendant ? pointFromHoroscope("Ascendant", horoscope.Ascendant) ?? undefined : undefined;

  return {
    sun,
    moon,
    ascendant,
    points,
    houseSystem: ASTRA_DEFAULT_HOUSE_SYSTEM,
    zodiacMode: ASTRA_DEFAULT_ZODIAC_MODE
  };
}

function buildLocalChartRoutineResult(input: AstrologyReportRequest): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);
  const chartSignature = buildChartSignature(request);
  const { sun, moon, ascendant, points } = chartSignature;
  const sunSign = signForLongitude(sun.longitude);
  const subject = request.subjectName;
  const publicReportId = `${request.id}:public-signal`;
  const risingText = ascendant ? `, ${ascendant.sign} rising` : "";
  const houseText = ascendant ? ` ${ASTRA_DEFAULT_HOUSE_SYSTEM} houses begin with ${ascendant.sign}.` : "";

  const summary = `${subject}'s core report is grounded in a ${sun.sign} Sun, ${moon.sign} Moon${risingText}.${houseText}`;

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: LOCAL_CHART_ROUTINE_ENGINE,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "completed",
    summary,
    sections: [
      {
        id: `${request.id}:core-pattern`,
        title: "Core pattern",
        body: `${subject}'s Sun is at ${sun.degree} degrees ${sun.sign}, giving this report a ${sunSign.element} and ${sunSign.mode} center of gravity. The Moon is at ${moon.degree} degrees ${moon.sign}, anchoring the emotional signature in the same chart routine used by previous reports.${ascendant ? ` With ${ascendant.sign} rising, Whole Sign house language starts from a ${ascendant.sign} first house instead of making houses a decorative afterthought.` : ""}`,
        emphasis: "primary"
      },
      {
        id: `${request.id}:planetary-frame`,
        title: "Planetary frame",
        body: `The migrated chart routine calculated ecliptic longitudes for ${points.map((point) => `${point.body} in ${point.sign}`).join(", ")}. These positions are recorded as provenance-friendly evidence for later report writers and Composer signals.`,
        emphasis: "supporting"
      },
      {
        id: `${request.id}:practice`,
        title: "Practice",
        body: request.question
          ? `Use the question "${request.question}" as the reading lens. Keep the first answer specific to the birth-data pattern before turning it into stream copy.`
          : "Use the computed birth-data pattern as the reading lens before turning it into stream copy.",
        emphasis: "practice"
      }
    ],
    provenance: [
      {
        id: `${request.id}:birth-data`,
        kind: "birth_data",
        label: "Birth data",
        summary: `${request.birthData.date}${request.birthData.time ? ` ${request.birthData.time}` : " date-only"}${request.birthData.location ? ` in ${request.birthData.location}` : ""}.`,
        boundary: "private",
        sourceId: request.id
      },
      {
        id: `${request.id}:engine`,
        kind: "engine",
        label: "Chart routine",
        summary: `Computed ${ASTRA_DEFAULT_ZODIAC_MODE} Sun, Moon,${ascendant ? " Ascendant," : ""} planetary ecliptic longitudes, and ${ASTRA_DEFAULT_HOUSE_SYSTEM} chart signature with ${ASTRA_CHART_ROUTINE}.`,
        boundary: "private"
      },
      {
        id: `${request.id}:intent`,
        kind: "user_intent",
        label: "Report intent",
        summary: request.intent || request.question || "No optional intent supplied.",
        boundary: "private"
      }
    ],
    publicSignal: {
      reportId: publicReportId,
      requestId: request.id,
      reportType: request.reportType,
      headline: `${sun.sign} Sun, ${moon.sign} Moon${ascendant ? `, ${ascendant.sign} rising` : ""}`,
      summary,
      tone: "grounded",
      boundary: "public_signal",
      provenanceSummary: `${ASTRA_CHART_ROUTINE}: ${ASTRA_DEFAULT_ZODIAC_MODE}, ${ASTRA_DEFAULT_HOUSE_SYSTEM}, Sun ${sun.sign}, Moon ${moon.sign}${ascendant ? `, Rising ${ascendant.sign}` : ""}`
    }
  });
}

export function buildAstrologyReportResult(input: AstrologyReportRequest): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);
  const config = resolveAstrologyReportGenerationConfig();
  if (config.ephemerisEngine === LOCAL_CHART_ROUTINE_ENGINE) {
    return buildLocalChartRoutineResult(request);
  }
  return buildAstrologyEngineUnavailableResult(request);
}
