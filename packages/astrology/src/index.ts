import {
  type AstrologyReportSection,
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
export const ASTRA_REPORT_WRITER_ENV = "ASTRA_REPORT_WRITER";
export const ASTRA_REPORT_MODEL_PROVIDER_ENV = "ASTRA_REPORT_MODEL_PROVIDER";
export const ASTRA_REPORT_MODEL_ENV = "ASTRA_REPORT_MODEL";
export const ASTRA_OPENAI_API_KEY_ENV = "ASTRA_OPENAI_API_KEY";
export const ASTRA_OPENROUTER_API_KEY_ENV = "ASTRA_OPENROUTER_API_KEY";
export const ASTRA_OPENROUTER_BASE_URL_ENV = "ASTRA_OPENROUTER_BASE_URL";
export const ASTRA_PLACE_SEARCH_PROVIDER_ENV = "ASTRA_PLACE_SEARCH_PROVIDER";
export const LOCAL_CHART_ROUTINE_ENGINE = "local-chart-routine";
export const LOCAL_DETERMINISTIC_REPORT_WRITER = "local-deterministic-writer";
export const DEBUG_MODEL_REPORT_WRITER = "debug-model-writer";
export const OPENAI_REPORT_MODEL_PROVIDER = "openai";
export const OPENROUTER_REPORT_MODEL_PROVIDER = "openrouter";
export const OPENROUTER_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
export const ASTRA_CHART_ROUTINE = "circular-natal-horoscope-js";
export const ASTRA_DEFAULT_ZODIAC_MODE = "tropical";
export const ASTRA_DEFAULT_HOUSE_SYSTEM = "whole-sign";

export type AstrologyReportGenerationConfig = {
  ephemerisEngine?: string;
  reportWriter?: string;
  reportModelProvider?: string;
  reportModel?: string;
  openaiApiKey?: string;
  openRouterApiKey?: string;
  openRouterBaseUrl?: string;
};

export type AstrologyReportGenerationOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
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

type ReportWriterInput = {
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
};

type ReportDraft = Pick<RecordAstrologyReportResult, "summary" | "sections" | "publicSignal">;

type OpenAIResponse = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      text?: unknown;
      type?: string;
    }>;
  }>;
};

type OpenAICompatibleChatResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
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

const personIdentityReportHeadings = ["Identity"] as const;
const personCoreReportHeadings = ["Identity", "Relationships", "Work", "Right Now"] as const;
const personDeepReportHeadings = ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Right Now"] as const;
const synastryReportHeadings = ["Attraction", "Friction", "Communication", "Stability"] as const;
const progressedReportHeadings = ["Current Chapter", "Progressed Sun", "Progressed Moon", "Integration"] as const;
const forbiddenReportFragments = [
  '"sections"',
  '"body"',
  '"section"',
  "Chart Evidence",
  "Generation Metadata",
  "schema",
  "deterministicBaseline",
  "Primary strain:",
  "Developmental task:",
  "Language domain:",
  "Priority note:",
  "this person",
  "the person"
];

type InterpretiveNote = {
  label?: unknown;
  thesis?: unknown;
  meaning?: unknown;
  humanMeaning?: unknown;
  evidence?: unknown;
  practicalInstruction?: unknown;
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
    ephemerisEngine: env[ASTRA_EPHEMERIS_ENGINE_ENV]?.trim() || undefined,
    reportWriter: env[ASTRA_REPORT_WRITER_ENV]?.trim() || LOCAL_DETERMINISTIC_REPORT_WRITER,
    reportModelProvider: env[ASTRA_REPORT_MODEL_PROVIDER_ENV]?.trim() || undefined,
    reportModel: env[ASTRA_REPORT_MODEL_ENV]?.trim() || undefined,
    openaiApiKey: env[ASTRA_OPENAI_API_KEY_ENV]?.trim() || undefined,
    openRouterApiKey: env[ASTRA_OPENROUTER_API_KEY_ENV]?.trim() || env.OPENROUTER_API_KEY?.trim() || undefined,
    openRouterBaseUrl: env[ASTRA_OPENROUTER_BASE_URL_ENV]?.trim() || env.OPENROUTER_BASE_URL?.trim() || OPENROUTER_DEFAULT_BASE_URL
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

function buildReportWriterUnavailableResult(input: AstrologyReportRequest, writer: string): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: ASTRA_ASTROLOGY_REPORT_ADAPTER,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "failed",
    error: `Report writer "${writer}" is not wired. Astra will not spend credits or call an LLM without an explicit writer route.`,
    sections: [],
    provenance: [
      {
        id: `${request.id}:birth-data`,
        kind: "birth_data",
        label: "Birth data",
        summary: `Birth data was accepted for ${request.subjectName}, but report writing stopped before interpretation.`,
        boundary: "private",
        sourceId: request.id
      },
      {
        id: `${request.id}:writer`,
        kind: "manual",
        label: "Report writer",
        summary: `Unsupported writer: ${writer}.`,
        boundary: "private"
      }
    ]
  });
}

function buildReportModelConfigUnavailableResult(
  input: AstrologyReportRequest,
  missing: string[]
): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: ASTRA_ASTROLOGY_REPORT_ADAPTER,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "failed",
    error: `${DEBUG_MODEL_REPORT_WRITER} requires explicit model configuration (${missing.join(", ")}). Astra will not call a model, spend credits, or leak private chart data without this configuration.`,
    sections: [],
    provenance: [
      {
        id: `${request.id}:birth-data`,
        kind: "birth_data",
        label: "Birth data",
        summary: `Birth data was accepted for ${request.subjectName}, but the debug model writer stopped before any provider call.`,
        boundary: "private",
        sourceId: request.id
      },
      {
        id: `${request.id}:writer`,
        kind: "manual",
        label: "Report writer",
        summary: `${DEBUG_MODEL_REPORT_WRITER} failed closed because ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} missing.`,
        boundary: "private"
      }
    ]
  });
}

function buildReportModelProviderUnavailableResult(
  input: AstrologyReportRequest,
  provider: string
): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: ASTRA_ASTROLOGY_REPORT_ADAPTER,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "failed",
    error: `Report model provider "${provider}" is not wired. Supported debug providers: ${OPENAI_REPORT_MODEL_PROVIDER}, ${OPENROUTER_REPORT_MODEL_PROVIDER}.`,
    sections: [],
    provenance: [
      {
        id: `${request.id}:writer`,
        kind: "manual",
        label: "Report writer",
        summary: `${DEBUG_MODEL_REPORT_WRITER} rejected unsupported provider "${provider}" before any model call.`,
        boundary: "private"
      }
    ]
  });
}

function buildReportModelCallFailedResult(input: AstrologyReportRequest, message: string): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: ASTRA_ASTROLOGY_REPORT_ADAPTER,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "failed",
    error: `${DEBUG_MODEL_REPORT_WRITER} failed before a report draft was accepted: ${message}`,
    sections: [],
    provenance: [
      {
        id: `${request.id}:writer`,
        kind: "manual",
        label: "Report writer",
        summary: `${DEBUG_MODEL_REPORT_WRITER} did not produce a validated draft. No public signal was emitted.`,
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

function formatPoint(point: EphemerisPoint) {
  const houseText = point.house ? `, house ${point.house}` : "";
  const retrogradeText = point.retrograde ? ", retrograde" : "";
  return `${point.body} ${point.degree} degrees ${point.sign}${houseText}${retrogradeText}`;
}

function contextString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function compactInterpretiveNote(note: InterpretiveNote) {
  const parts = [
    contextString(note.label),
    contextString(note.thesis),
    contextString(note.meaning) ?? contextString(note.humanMeaning),
    contextString(note.evidence),
    contextString(note.practicalInstruction)
  ].filter(Boolean);
  return parts.length ? parts.join(": ") : null;
}

function v1InterpretiveContextFromRequest(request: AstrologyReportRequest) {
  const context = request.context;
  const notes = context && typeof context === "object" ? (context.v1InterpretiveNotes as unknown) : undefined;
  if (!Array.isArray(notes)) return null;

  const compactNotes = notes
    .map((note) => (note && typeof note === "object" ? compactInterpretiveNote(note as InterpretiveNote) : null))
    .filter(Boolean)
    .slice(0, 24);

  return compactNotes.length ? compactNotes : null;
}

function writeDeterministicCoreReport({ request, chartSignature }: ReportWriterInput): ReportDraft {
  const { sun, moon, ascendant, points } = chartSignature;
  const sunSign = signForLongitude(sun.longitude);
  const moonSign = signForLongitude(moon.longitude);
  const subject = request.subjectName;
  const publicReportId = `${request.id}:public-signal`;
  const risingText = ascendant ? `, ${ascendant.sign} rising` : "";
  const headline = `${sun.sign} Sun, ${moon.sign} Moon${risingText}`;
  const houseText = ascendant
    ? `${ASTRA_DEFAULT_HOUSE_SYSTEM} houses begin with ${ascendant.sign} as the first-house field.`
    : "No timed Ascendant was supplied, so house language stays out of the public signature.";
  const questionText = request.question
    ? `The reading lens is the user's question: "${request.question}"`
    : "The reading lens is the computed birth-data pattern because no optional question was supplied.";
  const intentText = request.intent ? `Intent marker: ${request.intent}.` : "No optional intent marker was supplied.";

  const summary = `${subject}'s core report is grounded in ${headline}. ${houseText}`;

  return {
    summary,
    sections: [
      {
        id: `${request.id}:core-pattern`,
        title: "Core pattern",
        body: `${subject}'s report opens with a ${sun.sign} Sun and ${moon.sign} Moon. The Sun sits at ${sun.degree} degrees ${sun.sign}, giving the report a ${sunSign.element} and ${sunSign.mode} center of gravity. The Moon sits at ${moon.degree} degrees ${moon.sign}, giving the emotional weather a ${moonSign.element} and ${moonSign.mode} rhythm.`,
        emphasis: "primary"
      },
      {
        id: `${request.id}:rising-houses`,
        title: "Rising and houses",
        body: ascendant
          ? `${subject}'s Ascendant is ${formatPoint(ascendant)}. In Whole Sign houses, the report treats ${ascendant.sign} as the first house and keeps house language tied to the timed chart instead of decorative copy.`
          : "This report does not publish rising or house language because the request does not include enough timed and located birth data.",
        emphasis: ascendant ? "primary" : "supporting"
      },
      {
        id: `${request.id}:planetary-frame`,
        title: "Planetary frame",
        body: `The non-LLM writer receives a structured chart frame: ${points.map(formatPoint).join("; ")}. This gives later prose and Composer signals a deterministic evidence trail before any model-backed writer is introduced.`,
        emphasis: "supporting"
      },
      {
        id: `${request.id}:reading-lens`,
        title: "Reading lens",
        body: `${questionText}. ${intentText} The deterministic writer keeps this as a private report constraint and exposes only the concise public signal to Composer.`,
        emphasis: "practice"
      },
      {
        id: `${request.id}:writer-handoff`,
        title: "Writer handoff",
        body: `This draft was produced by ${LOCAL_DETERMINISTIC_REPORT_WRITER}: no LLM call, no paid provider, no credit spend. It is intentionally structured so a lower-debug model route can be compared against the same chart signature later.`,
        emphasis: "supporting"
      }
    ],
    publicSignal: {
      reportId: publicReportId,
      requestId: request.id,
      reportType: request.reportType,
      headline,
      summary,
      tone: "grounded",
      boundary: "public_signal",
      provenanceSummary: `${ASTRA_CHART_ROUTINE}: ${ASTRA_DEFAULT_ZODIAC_MODE}, ${ASTRA_DEFAULT_HOUSE_SYSTEM}, ${LOCAL_DETERMINISTIC_REPORT_WRITER}, Sun ${sun.sign}, Moon ${moon.sign}${ascendant ? `, Rising ${ascendant.sign}` : ""}`
    }
  };
}

function extractOpenAIText(response: OpenAIResponse) {
  if (typeof response.output_text === "string" && response.output_text.trim()) return response.output_text.trim();

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) return content.text.trim();
    }
  }

  throw new Error("OpenAI response did not include text output.");
}

function extractOpenAICompatibleChatText(response: OpenAICompatibleChatResponse) {
  for (const choice of response.choices ?? []) {
    const content = choice.message?.content;
    if (typeof content === "string" && content.trim()) return content.trim();
  }

  throw new Error("OpenAI-compatible chat response did not include text output.");
}

function sectionIdFromTitle(requestId: string, title: string, index: number) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${requestId}:${slug || `section-${index + 1}`}`;
}

function markdownSectionsFromText(text: string, request: AstrologyReportRequest): AstrologyReportSection[] {
  const normalized = text
    .replace(/^#\s+.+$/m, "")
    .replace(/\r\n/g, "\n")
    .trim();
  const matches = [...normalized.matchAll(/^##\s+(.+?)\s*\n([\s\S]*?)(?=^##\s+|\n#\s+|$)/gm)];
  const sections = matches
    .map((match, index) => {
      const title = (match[1] ?? "").trim();
      const body = (match[2] ?? "")
        .replace(/\*\*Chart Evidence\*\*[\s\S]*$/i, "")
        .replace(/^[-*]\s+/gm, "")
        .trim();
      if (!title || !body || /^generation metadata$/i.test(title)) return null;
      return {
        id: sectionIdFromTitle(request.id, title, index),
        title,
        body,
        emphasis: index === 0 ? "primary" : index === 2 ? "practice" : "supporting"
      } satisfies AstrologyReportSection;
    })
    .filter((section): section is AstrologyReportSection => Boolean(section));

  if (sections.length < 1) {
    throw new Error("Model draft did not include Markdown report sections.");
  }

  return sections;
}

function summaryFromMarkdown(text: string, fallback: string) {
  const withoutMetadata = text.replace(/^##\s+Generation Metadata\s*[\s\S]*$/im, "").trim();
  const firstParagraph = withoutMetadata
    .split(/\n{2,}/)
    .map((part) => part.replace(/^#+\s+.+$/gm, "").trim())
    .find((part) => part && !part.startsWith("##"));
  return firstParagraph ? firstParagraph.slice(0, 700) : fallback;
}

function parseModelDraft(text: string, request: AstrologyReportRequest, chartSignature: ChartSignature): ReportDraft {
  const baseline = writeDeterministicCoreReport({ request, chartSignature });
  if (!baseline.publicSignal) {
    throw new Error("Deterministic baseline did not include a public signal.");
  }

  return {
    summary: summaryFromMarkdown(text, baseline.summary ?? `${request.subjectName}'s report is grounded in the computed chart signature.`),
    sections: markdownSectionsFromText(text, request),
    publicSignal: {
      ...baseline.publicSignal,
      provenanceSummary: `${baseline.publicSignal.provenanceSummary}, ${DEBUG_MODEL_REPORT_WRITER}`
    }
  };
}

function buildDebugModelPrompt(request: AstrologyReportRequest, chartSignature: ChartSignature, previousErrors: string[] = []) {
  const baseline = writeDeterministicCoreReport({ request, chartSignature });
  const headings = reportHeadingsFor(request);
  const v1InterpretiveContext = v1InterpretiveContextFromRequest(request);
  return [
    "Write a private astrology report draft in Markdown.",
    "Return Markdown only.",
    "Use the required H2 section headings exactly.",
    ...headings.map((heading) => `## ${heading}`),
    "Do not include JSON, schema names, metadata, bullets, or Chart Evidence.",
    "Do not include birth date, birth time, coordinates, full provenance, or private user identifiers in any public-facing language.",
    "Preserve the chart signature exactly.",
    "Use direct second-person language when the subject is a person; do not write 'the person' or 'this person'.",
    "Write like Astra v1: psychologically intelligent, concrete, direct, and grounded in lived experience rather than textbook inventory.",
    "Make sections feel like chapters of one chart, not isolated mini-readings.",
    "In each section, translate chart factors into the gift, the cost, and the practice in natural prose; do not use those words as labels.",
    "End each section with a useful sentence the reader can apply or recognize.",
    request.reportType === "deep"
      ? "Deep Report depth: write all nine sections with v1-like substance. Identity should be 350-500 words; other sections should be rich enough to read as paid report chapters without padding."
      : "Keep the report complete, specific, and readable for the selected report type.",
    previousErrors.length ? "The previous draft failed validation. Rewrite the full report and avoid these errors:" : "",
    ...previousErrors.map((error) => `- ${error}`),
    JSON.stringify({
      subjectName: request.subjectName,
      reportType: request.reportType,
      question: request.question,
      intent: request.intent,
      v1InterpretiveContext,
      chartSignature: {
        sun: chartSignature.sun,
        moon: chartSignature.moon,
        ascendant: chartSignature.ascendant,
        points: chartSignature.points,
        zodiacMode: chartSignature.zodiacMode,
        houseSystem: chartSignature.houseSystem
      },
      deterministicBaseline: baseline
    })
  ].join("\n");
}

function reportHeadingsFor(request: AstrologyReportRequest) {
  if (request.reportType === "identity") return [...personIdentityReportHeadings];
  if (request.reportType === "deep") return [...personDeepReportHeadings];
  if (request.reportType === "synastry") return [...synastryReportHeadings];
  if (request.reportType === "progressed") return [...progressedReportHeadings];
  return [...personCoreReportHeadings];
}

function validateModelDraft(request: AstrologyReportRequest, draft: ReportDraft) {
  const errors: string[] = [];
  const requiredHeadings = reportHeadingsFor(request);
  const sectionTitles = new Set((draft.sections ?? []).map((section) => section.title.trim().toLowerCase()));
  const visibleText = [
    draft.summary,
    ...(draft.sections ?? []).flatMap((section) => [section.title, section.body])
  ]
    .filter(Boolean)
    .join("\n");
  const lowerText = visibleText.toLowerCase();

  for (const heading of requiredHeadings) {
    if (!sectionTitles.has(heading.toLowerCase())) {
      errors.push(`Missing required heading: ## ${heading}`);
    }
  }

  if ((draft.sections?.length ?? 0) < requiredHeadings.length) {
    errors.push(`Expected ${requiredHeadings.length} report sections, found ${draft.sections?.length ?? 0}.`);
  }

  if (visibleText.trim().startsWith("{") || visibleText.trim().startsWith("[")) {
    errors.push("Report appears to begin with raw JSON.");
  }

  for (const fragment of forbiddenReportFragments) {
    if (lowerText.includes(fragment.toLowerCase())) {
      errors.push(`Forbidden public fragment found: ${fragment}`);
    }
  }

  return errors;
}

function maxModelOutputTokensFor(request: AstrologyReportRequest) {
  if (request.reportType === "deep") return 8000;
  if (request.reportType === "core" || request.reportType === "core_self") return 4200;
  if (request.reportType === "progressed" || request.reportType === "synastry") return 4200;
  return 3200;
}

async function parseValidatedModelDraft(input: ReportWriterInput, writer: (previousErrors?: string[]) => Promise<string>) {
  let previousErrors: string[] = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const text = await writer(previousErrors);
    const draft = parseModelDraft(text, input.request, input.chartSignature);
    const errors = validateModelDraft(input.request, draft);
    if (!errors.length) return draft;
    previousErrors = errors;
  }

  throw new Error(`Model draft failed validation after retries: ${previousErrors.join("; ")}`);
}

async function writeOpenAIDebugModelReportText(
  input: ReportWriterInput,
  config: Required<Pick<AstrologyReportGenerationConfig, "reportModel" | "openaiApiKey">>,
  fetchImpl: typeof fetch,
  previousErrors: string[] = []
): Promise<string> {
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.openaiApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: config.reportModel,
      input: buildDebugModelPrompt(input.request, input.chartSignature, previousErrors),
      max_output_tokens: maxModelOutputTokensFor(input.request)
    })
  });

  const payload = (await response.json()) as OpenAIResponse & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI Responses API failed with ${response.status}.`);
  }

  return extractOpenAIText(payload);
}

async function writeOpenRouterDebugModelReportText(
  input: ReportWriterInput,
  config: Required<Pick<AstrologyReportGenerationConfig, "reportModel" | "openRouterApiKey" | "openRouterBaseUrl">>,
  fetchImpl: typeof fetch,
  previousErrors: string[] = []
): Promise<string> {
  const baseUrl = config.openRouterBaseUrl.replace(/\/+$/, "");
  const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.openRouterApiKey}`,
      "content-type": "application/json",
      "http-referer": "http://localhost:3011",
      "x-title": "Astra"
    },
    body: JSON.stringify({
      model: config.reportModel,
      messages: [
        {
          role: "user",
          content: buildDebugModelPrompt(input.request, input.chartSignature, previousErrors)
        }
      ],
      max_tokens: maxModelOutputTokensFor(input.request),
      temperature: 0.3
    })
  });

  const payload = (await response.json()) as OpenAICompatibleChatResponse & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenRouter chat completions API failed with ${response.status}.`);
  }

  return extractOpenAICompatibleChatText(payload);
}

function buildLocalChartRoutineResult(input: AstrologyReportRequest, draft?: ReportDraft): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);
  const chartSignature = buildChartSignature(request);
  const { ascendant } = chartSignature;
  const reportDraft = draft ?? writeDeterministicCoreReport({ request, chartSignature });

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: LOCAL_CHART_ROUTINE_ENGINE,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "completed",
    summary: reportDraft.summary,
    sections: reportDraft.sections,
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
        id: `${request.id}:writer`,
        kind: "manual",
        label: "Report writer",
        summary: `Wrote private sections and public signal with ${LOCAL_DETERMINISTIC_REPORT_WRITER}; no LLM provider, no paid route, no credit spend.`,
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
    publicSignal: reportDraft.publicSignal
  });
}

async function buildDebugModelReportResult(
  input: AstrologyReportRequest,
  config: AstrologyReportGenerationConfig,
  fetchImpl: typeof fetch
): Promise<RecordAstrologyReportResult> {
  const request = astrologyReportRequestSchema.parse(input);
  if (!config.reportModelProvider || !config.reportModel) {
    const missing = [
      config.reportModelProvider ? null : ASTRA_REPORT_MODEL_PROVIDER_ENV,
      config.reportModel ? null : ASTRA_REPORT_MODEL_ENV
    ].filter(Boolean) as string[];
    return buildReportModelConfigUnavailableResult(request, missing);
  }
  if (config.reportModelProvider !== OPENAI_REPORT_MODEL_PROVIDER && config.reportModelProvider !== OPENROUTER_REPORT_MODEL_PROVIDER) {
    return buildReportModelProviderUnavailableResult(request, config.reportModelProvider);
  }

  const chartSignature = buildChartSignature(request);
  let draft: ReportDraft;
  let writerSummary: string;
  try {
    if (config.reportModelProvider === OPENROUTER_REPORT_MODEL_PROVIDER) {
      if (!config.openRouterApiKey || !config.openRouterBaseUrl) {
        const missing = [
          config.openRouterApiKey ? null : ASTRA_OPENROUTER_API_KEY_ENV,
          config.openRouterBaseUrl ? null : ASTRA_OPENROUTER_BASE_URL_ENV
        ].filter(Boolean) as string[];
        return buildReportModelConfigUnavailableResult(request, missing);
      }
      const reportModel = config.reportModel;
      const openRouterApiKey = config.openRouterApiKey;
      const openRouterBaseUrl = config.openRouterBaseUrl;
      const writerInput = { request, chartSignature };
      draft = await parseValidatedModelDraft(
        writerInput,
        (previousErrors) =>
          writeOpenRouterDebugModelReportText(
            writerInput,
            {
              reportModel,
              openRouterApiKey,
              openRouterBaseUrl
            },
            fetchImpl,
            previousErrors
          )
      );
      writerSummary = `${OPENROUTER_REPORT_MODEL_PROVIDER}/${config.reportModel}`;
    } else {
      if (!config.openaiApiKey) {
        return buildReportModelConfigUnavailableResult(request, [ASTRA_OPENAI_API_KEY_ENV]);
      }
      const reportModel = config.reportModel;
      const openaiApiKey = config.openaiApiKey;
      const writerInput = { request, chartSignature };
      draft = await parseValidatedModelDraft(
        writerInput,
        (previousErrors) =>
          writeOpenAIDebugModelReportText(
            writerInput,
            { reportModel, openaiApiKey },
            fetchImpl,
            previousErrors
          )
      );
      writerSummary = `${OPENAI_REPORT_MODEL_PROVIDER}/${config.reportModel}`;
    }
  } catch (error) {
    return buildReportModelCallFailedResult(request, error instanceof Error ? error.message : "Unknown model writer error.");
  }
  const result = buildLocalChartRoutineResult(request, draft);

  return recordAstrologyReportResultSchema.parse({
    ...result,
    provenance: [
      ...result.provenance.filter((entry) => entry.id !== `${request.id}:writer`),
      {
        id: `${request.id}:writer`,
        kind: "manual",
        label: "Report writer",
        summary: `Wrote private sections with ${DEBUG_MODEL_REPORT_WRITER} via ${writerSummary}; credit lifecycle is still disabled.`,
        boundary: "private"
      }
    ]
  });
}

export function buildAstrologyReportResult(input: AstrologyReportRequest): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);
  const config = resolveAstrologyReportGenerationConfig();
  if (config.ephemerisEngine === LOCAL_CHART_ROUTINE_ENGINE) {
    if (config.reportWriter !== LOCAL_DETERMINISTIC_REPORT_WRITER) {
      return buildReportWriterUnavailableResult(request, config.reportWriter ?? "");
    }
    return buildLocalChartRoutineResult(request);
  }
  return buildAstrologyEngineUnavailableResult(request);
}

export async function buildAstrologyReportResultAsync(
  input: AstrologyReportRequest,
  options: AstrologyReportGenerationOptions = {}
): Promise<RecordAstrologyReportResult> {
  const request = astrologyReportRequestSchema.parse(input);
  const config = resolveAstrologyReportGenerationConfig(options.env);
  const fetchImpl = options.fetchImpl ?? fetch;
  if (config.ephemerisEngine === LOCAL_CHART_ROUTINE_ENGINE) {
    if (config.reportWriter === DEBUG_MODEL_REPORT_WRITER) {
      return buildDebugModelReportResult(request, config, fetchImpl);
    }
    if (config.reportWriter !== LOCAL_DETERMINISTIC_REPORT_WRITER) {
      return buildReportWriterUnavailableResult(request, config.reportWriter ?? "");
    }
    return buildLocalChartRoutineResult(request);
  }
  return buildAstrologyEngineUnavailableResult(request);
}
