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
import { Body, EclipticLongitude, MoonPhase, SunPosition } from "astronomy-engine";

export const ASTRA_ASTROLOGY_REPORT_ADAPTER = "astra-astrology-report-adapter";
export const ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION = "0.1.0";
export const ASTRA_EPHEMERIS_ENGINE_ENV = "ASTRA_EPHEMERIS_ENGINE";
export const ASTRA_PLACE_SEARCH_PROVIDER_ENV = "ASTRA_PLACE_SEARCH_PROVIDER";
export const LOCAL_ASTRONOMY_ENGINE = "local-astronomy-engine";

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
};

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

const planetBodies = [
  ["Moon", Body.Moon],
  ["Mercury", Body.Mercury],
  ["Venus", Body.Venus],
  ["Mars", Body.Mars],
  ["Jupiter", Body.Jupiter],
  ["Saturn", Body.Saturn]
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

function birthDateTimeUtc(request: AstrologyReportRequest) {
  const time = request.birthData.time ?? "12:00";
  const date = new Date(`${request.birthData.date}T${time}:00Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid birth date/time for astrology report request ${request.id}.`);
  }

  return date;
}

function moonPhaseLabel(moonPhase: number) {
  if (moonPhase < 45 || moonPhase >= 315) return "new moon";
  if (moonPhase < 135) return "waxing moon";
  if (moonPhase < 225) return "full moon";
  return "waning moon";
}

function buildLocalAstronomyEngineResult(input: AstrologyReportRequest): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);
  const date = birthDateTimeUtc(request);
  const sun = pointFor("Sun", SunPosition(date).elon);
  const points = [sun, ...planetBodies.map(([label, body]) => pointFor(label, EclipticLongitude(body, date)))];
  const moonPhase = round(MoonPhase(date));
  const phaseLabel = moonPhaseLabel(moonPhase);
  const sunSign = signForLongitude(sun.longitude);
  const moon = points.find((point) => point.body === "Moon") ?? pointFor("Moon", 0);
  const subject = request.subjectName;
  const publicReportId = `${request.id}:public-signal`;

  const summary = `${subject}'s core report is grounded in a ${sun.sign} Sun, ${moon.sign} Moon, and ${phaseLabel}.`;

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: LOCAL_ASTRONOMY_ENGINE,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "completed",
    summary,
    sections: [
      {
        id: `${request.id}:core-pattern`,
        title: "Core pattern",
        body: `${subject}'s Sun is at ${sun.degree} degrees ${sun.sign}, giving this report a ${sunSign.element} and ${sunSign.mode} center of gravity. The Moon is at ${moon.degree} degrees ${moon.sign}, so the emotional weather asks for ${phaseLabel} pacing rather than generic inspiration.`,
        emphasis: "primary"
      },
      {
        id: `${request.id}:planetary-frame`,
        title: "Planetary frame",
        body: `The local ephemeris adapter calculated ecliptic longitudes for ${points.map((point) => `${point.body} in ${point.sign}`).join(", ")}. These positions are recorded as provenance-friendly evidence for later report writers and Composer signals.`,
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
        label: "Astronomy Engine",
        summary: `Computed Sun, Moon, visible-planet ecliptic longitudes, and moon phase with ${LOCAL_ASTRONOMY_ENGINE}.`,
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
      headline: `${sun.sign} Sun, ${moon.sign} Moon`,
      summary,
      tone: "grounded",
      boundary: "public_signal",
      provenanceSummary: `${LOCAL_ASTRONOMY_ENGINE}: Sun ${sun.sign}, Moon ${moon.sign}, ${phaseLabel}`
    }
  });
}

export function buildAstrologyReportResult(input: AstrologyReportRequest): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);
  const config = resolveAstrologyReportGenerationConfig();
  if (config.ephemerisEngine === LOCAL_ASTRONOMY_ENGINE) {
    return buildLocalAstronomyEngineResult(request);
  }
  return buildAstrologyEngineUnavailableResult(request);
}
