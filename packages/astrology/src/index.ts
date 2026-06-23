import {
  type AstrologyReportSection,
  type AstrologyReportRequest,
  type BirthPlaceSearchQuery,
  type BirthPlaceSearchResponse,
  type ChartSettings,
  type RecordAstrologyReportResult,
  astrologyReportRequestSchema,
  birthPlaceSearchQuerySchema,
  birthPlaceSearchResponseSchema,
  chartSettingsSchema,
  recordAstrologyReportResultSchema
} from "@astra/contracts";
import * as horoscopeModule from "circular-natal-horoscope-js";

export const ASTRA_ASTROLOGY_REPORT_ADAPTER = "astra-astrology-report-adapter";
export const ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION = "0.1.0";
export const ASTRA_EPHEMERIS_ENGINE_ENV = "ASTRA_EPHEMERIS_ENGINE";
export const ASTRA_REPORT_WRITER_ENV = "ASTRA_REPORT_WRITER";
export const ASTRA_REPORT_MODEL_PROFILE_ENV = "ASTRA_REPORT_MODEL_PROFILE";
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

type ZodiacMode = ChartSettings["zodiacMode"];
type HouseSystemMode = ChartSettings["houseSystem"];

export const reportModelProfileKeys = ["smoke", "debug", "debug_alt", "production", "premium_bakeoff"] as const;

export type ReportModelProfile = (typeof reportModelProfileKeys)[number];

export type ResolvedReportModelProfile = {
  profile: ReportModelProfile;
  label: string;
  purpose: string;
  provider: typeof OPENROUTER_REPORT_MODEL_PROVIDER | typeof OPENAI_REPORT_MODEL_PROVIDER;
  model: string;
};

export const reportModelProfileLabels: Record<ReportModelProfile, string> = {
  smoke: "System Test",
  debug: "Quick Draft",
  debug_alt: "Standard Draft",
  production: "Polished Report",
  premium_bakeoff: "Best-of-Three"
};

export const reportModelProfilePurposes: Record<ReportModelProfile, string> = {
  smoke: "plumbing tests only",
  debug: "quick dev reports",
  debug_alt: "quick dev reports",
  production: "default paid report writer",
  premium_bakeoff: "premium model comparison"
};

export const reportModelProfileModels: Record<ReportModelProfile, string[]> = {
  smoke: ["openai/gpt-5.4-nano"],
  debug: ["anthropic/claude-haiku-4.5"],
  debug_alt: ["openai/gpt-5.4-mini"],
  production: ["anthropic/claude-sonnet-4.6"],
  premium_bakeoff: ["anthropic/claude-sonnet-4.6", "openai/gpt-5.5", "google/gemini-3.1-pro-preview"]
};

export type AstrologyReportGenerationConfig = {
  ephemerisEngine?: string;
  reportWriter?: string;
  reportModelProfile?: ReportModelProfile;
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
  houseSystem: HouseSystemMode;
  zodiacMode: ZodiacMode;
};

export type AstrologyChartSnapshot = {
  zodiacMode: ZodiacMode;
  houseSystem: HouseSystemMode;
  placements: Array<{
    bodyId: string;
    angle: number;
    sign: string;
    house?: number;
  }>;
  aspects: Array<{
    id: string;
    type: "conjunction" | "sextile" | "square" | "trine" | "opposition";
    source: string;
    target: string;
  }>;
  houseCusps: Array<{
    angle: number;
    house: number;
  }>;
};

type ReportWriterInput = {
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
};

type ReportDraft = Pick<RecordAstrologyReportResult, "summary" | "sections" | "publicSignal">;

type ReportSectionSignalCard = {
  title: string;
  chartSignals: Array<{
    id: string;
    label: string;
    facts: string[];
    priority: number;
  }>;
  capacities: string[];
  risks: string[];
  tensions: string[];
  developmentalTasks: string[];
  evidenceBullets: Array<{
    label: string;
    meaning: string;
  }>;
};

export type AstrologyReportSectionEvidence = {
  title: string;
  evidenceBullets: Array<{
    label: string;
    meaning: string;
  }>;
};

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

const bodyDisplayNames: Record<string, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
  chiron: "Chiron",
  ascendant: "Ascendant",
  midheaven: "Midheaven"
};

const sectionSignalMeanings: Record<string, Pick<ReportSectionSignalCard, "capacities" | "risks" | "tensions" | "developmentalTasks">> = {
  Identity: {
    capacities: ["self-definition", "recognizable style", "central organizing motive"],
    risks: ["overidentification", "diffused self-presentation"],
    tensions: ["identity versus adaptation"],
    developmentalTasks: ["name the central motive", "separate signal from performance"]
  },
  Emotions: {
    capacities: ["emotional perception", "memory", "protective intelligence"],
    risks: ["emotional overcontrol", "withdrawal", "mood saturation"],
    tensions: ["feeling versus containment"],
    developmentalTasks: ["let feeling become usable information", "build steady recovery rhythms"]
  },
  Relationships: {
    capacities: ["attachment pattern awareness", "desire", "repair"],
    risks: ["projection", "avoidance", "reactivity"],
    tensions: ["closeness versus autonomy"],
    developmentalTasks: ["make relational needs explicit", "practice direct repair"]
  },
  Work: {
    capacities: ["craft", "execution", "role clarity"],
    risks: ["scattered effort", "overextension", "misplaced obligation"],
    tensions: ["visibility versus usefulness"],
    developmentalTasks: ["sequence the work", "test ambition against available bandwidth"]
  },
  Drive: {
    capacities: ["initiative", "courage", "momentum"],
    risks: ["impulse", "burnout", "misdirected force"],
    tensions: ["speed versus proportion"],
    developmentalTasks: ["pace action", "choose the next concrete move"]
  },
  Gifts: {
    capacities: ["repeatable strength", "creative leverage", "natural resource"],
    risks: ["underuse", "overreliance on ease"],
    tensions: ["talent versus practice"],
    developmentalTasks: ["make strengths practical", "turn ease into craft"]
  },
  "Blind Spots": {
    capacities: ["pattern recognition", "self-correction"],
    risks: ["distortion", "avoidance", "excess"],
    tensions: ["instinct versus consequence"],
    developmentalTasks: ["catch the repeated distortion early", "add friction before escalation"]
  },
  Growth: {
    capacities: ["integration", "maturity", "range"],
    risks: ["stagnation", "repeating the old compensation"],
    tensions: ["known self versus emerging demand"],
    developmentalTasks: ["integrate the strongest tension", "practice the neglected side"]
  },
  "Right Now": {
    capacities: ["current focus", "timed adjustment", "practical response"],
    risks: ["turning a season into an identity", "overreacting to pressure"],
    tensions: ["current activation versus natal pattern"],
    developmentalTasks: ["respond to the active cycle", "choose one practical adjustment"]
  },
  Attraction: {
    capacities: ["chemistry", "recognition", "relational aliveness"],
    risks: ["projection", "pursuit without clarity"],
    tensions: ["desire versus actual contact"],
    developmentalTasks: ["name what is attractive without making it the whole story"]
  },
  Friction: {
    capacities: ["honest contrast", "growth pressure", "repair potential"],
    risks: ["reactivity", "misread motive", "repeated conflict loop"],
    tensions: ["difference versus threat"],
    developmentalTasks: ["separate useful tension from avoidable escalation"]
  },
  Communication: {
    capacities: ["translation", "listening", "shared language"],
    risks: ["assumption", "defensiveness", "talking past each other"],
    tensions: ["meaning intended versus meaning received"],
    developmentalTasks: ["make the implicit agreement explicit"]
  },
  Stability: {
    capacities: ["commitment", "structure", "reliability"],
    risks: ["stagnation", "duty replacing choice"],
    tensions: ["security versus growth"],
    developmentalTasks: ["build containers that can still breathe"]
  },
  "Current Chapter": {
    capacities: ["developmental timing", "phase awareness", "current focus"],
    risks: ["confusing transition with identity", "overcorrecting"],
    tensions: ["old self versus emerging season"],
    developmentalTasks: ["name the chapter before forcing the outcome"]
  },
  "Progressed Sun": {
    capacities: ["identity development", "direction", "life emphasis"],
    risks: ["holding an expired self-image", "forcing certainty too early"],
    tensions: ["becoming versus continuity"],
    developmentalTasks: ["let the new center become visible through practice"]
  },
  "Progressed Moon": {
    capacities: ["emotional timing", "need recognition", "instinctive adjustment"],
    risks: ["mood as mandate", "overattachment to temporary weather"],
    tensions: ["feeling state versus durable truth"],
    developmentalTasks: ["honor the need without making it permanent law"]
  },
  Integration: {
    capacities: ["synthesis", "embodiment", "right-sized action"],
    risks: ["fragmentation", "insight without behavior"],
    tensions: ["knowing versus living"],
    developmentalTasks: ["turn the reading into one concrete adjustment"]
  }
};

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

export function parseReportModelProfile(value: string | null | undefined): ReportModelProfile | undefined {
  return reportModelProfileKeys.includes(value as ReportModelProfile) ? (value as ReportModelProfile) : undefined;
}

export function resolveReportModelProfile(profile: ReportModelProfile, modelOverride?: string | null): ResolvedReportModelProfile {
  const models = reportModelProfileModels[profile];
  const model = modelOverride && models.includes(modelOverride) ? modelOverride : models[0];
  return {
    profile,
    label: reportModelProfileLabels[profile],
    purpose: reportModelProfilePurposes[profile],
    provider: OPENROUTER_REPORT_MODEL_PROVIDER,
    model
  };
}

export function resolveAstrologyReportGenerationConfig(
  env: Record<string, string | undefined> = process.env
): AstrologyReportGenerationConfig {
  const reportModelProfile = parseReportModelProfile(env[ASTRA_REPORT_MODEL_PROFILE_ENV]?.trim());
  const profileConfig = reportModelProfile
    ? resolveReportModelProfile(reportModelProfile, env[ASTRA_REPORT_MODEL_ENV]?.trim() || undefined)
    : null;

  return {
    ephemerisEngine: env[ASTRA_EPHEMERIS_ENGINE_ENV]?.trim() || undefined,
    reportWriter: env[ASTRA_REPORT_WRITER_ENV]?.trim() || LOCAL_DETERMINISTIC_REPORT_WRITER,
    reportModelProfile,
    reportModelProvider: env[ASTRA_REPORT_MODEL_PROVIDER_ENV]?.trim() || profileConfig?.provider || undefined,
    reportModel: env[ASTRA_REPORT_MODEL_ENV]?.trim() || profileConfig?.model || undefined,
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

function chartSettingsFor(request: AstrologyReportRequest): ChartSettings {
  return chartSettingsSchema.parse(request.context?.chartSettings ?? {});
}

function buildChartSignature(request: AstrologyReportRequest): ChartSignature {
  const chartSettings = chartSettingsFor(request);
  const horoscope = new Horoscope({
    origin: buildOrigin(request),
    houseSystem: chartSettings.houseSystem,
    zodiac: chartSettings.zodiacMode,
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
    houseSystem: chartSettings.houseSystem,
    zodiacMode: chartSettings.zodiacMode
  };
}

function formatPoint(point: EphemerisPoint) {
  const houseText = point.house ? `, house ${point.house}` : "";
  const retrogradeText = point.retrograde ? ", retrograde" : "";
  return `${point.body} ${point.degree} degrees ${point.sign}${houseText}${retrogradeText}`;
}

function bodyDisplayName(bodyId: string) {
  return bodyDisplayNames[bodyId] ?? bodyId;
}

function bodyIdFor(body: string) {
  return body.toLowerCase().replace(/\s+/g, "-");
}

function houseLabel(house?: number) {
  return house ? `${house}${house === 1 ? "st" : house === 2 ? "nd" : house === 3 ? "rd" : "th"} house` : "house unavailable";
}

function placementSignal(point: EphemerisPoint) {
  const bodyId = bodyIdFor(point.body);
  return {
    id: `placement_${bodyId}`,
    label: `${bodyDisplayName(bodyId)} in ${point.sign}${point.house ? ` in the ${houseLabel(point.house)}` : ""}`,
    facts: [bodyDisplayName(bodyId), point.sign, houseLabel(point.house), point.retrograde ? "retrograde" : ""].filter(Boolean),
    priority: point.body === "Sun" ? 1 : point.body === "Moon" ? 0.96 : point.body === "Ascendant" ? 0.92 : 0.68
  };
}

function sectionsForPlacement(point: EphemerisPoint) {
  const bodyId = bodyIdFor(point.body);
  const sections = new Set<string>();
  if (bodyId === "sun") sections.add("Identity");
  if (bodyId === "sun") {
    sections.add("Current Chapter");
    sections.add("Progressed Sun");
  }
  if (bodyId === "moon") {
    sections.add("Emotions");
    sections.add("Identity");
    sections.add("Current Chapter");
    sections.add("Progressed Moon");
  }
  if (bodyId === "venus") {
    sections.add("Relationships");
    sections.add("Gifts");
    sections.add("Attraction");
    sections.add("Stability");
  }
  if (bodyId === "mars") {
    sections.add("Drive");
    sections.add("Relationships");
    sections.add("Growth");
    sections.add("Attraction");
    sections.add("Friction");
  }
  if (bodyId === "mercury") {
    sections.add("Identity");
    sections.add("Work");
    sections.add("Communication");
  }
  if (bodyId === "saturn") {
    sections.add("Work");
    sections.add("Growth");
    sections.add("Blind Spots");
    sections.add("Stability");
    sections.add("Friction");
  }
  sections.add("Integration");
  if (point.house === 10 || point.house === 6 || point.house === 2) sections.add("Work");
  if (point.house === 7) sections.add("Relationships");
  if (point.house === 4 || point.house === 8 || point.house === 12) sections.add("Emotions");
  return [...sections];
}

function sectionsForAspect(source: string, target: string) {
  const bodies = [source, target];
  const sections = new Set<string>();
  if (bodies.includes("sun")) sections.add("Identity");
  if (bodies.includes("moon")) sections.add("Emotions");
  if (bodies.includes("venus") || bodies.includes("mars")) sections.add("Relationships");
  if (bodies.includes("venus") || bodies.includes("mars")) sections.add("Attraction");
  if (bodies.includes("mars") || bodies.includes("saturn") || bodies.includes("pluto")) sections.add("Friction");
  if (bodies.includes("mercury") || bodies.includes("moon")) sections.add("Communication");
  if (bodies.includes("saturn") || bodies.includes("venus")) sections.add("Stability");
  if (bodies.includes("mars")) sections.add("Drive");
  if (bodies.some((body) => ["jupiter", "saturn", "uranus", "neptune", "pluto", "chiron"].includes(body))) {
    sections.add("Growth");
    sections.add("Blind Spots");
  }
  if (bodies.includes("sun")) sections.add("Progressed Sun");
  if (bodies.includes("moon")) sections.add("Progressed Moon");
  sections.add("Current Chapter");
  sections.add("Integration");
  return [...sections];
}

function aspectMatchForDistance(distance: number) {
  const majorAspects = [
    ["conjunction", 0, 8],
    ["sextile", 60, 5],
    ["square", 90, 7],
    ["trine", 120, 7],
    ["opposition", 180, 8]
  ] as const;
  const normalized = Math.min(distance, 360 - distance);
  const match = majorAspects.find(([, angle, orb]) => Math.abs(normalized - angle) <= orb);
  return match ? { type: match[0], orb: Number(Math.abs(normalized - match[1]).toFixed(1)) } : null;
}

function aspectTypeForDistance(distance: number): AstrologyChartSnapshot["aspects"][number]["type"] | null {
  return aspectMatchForDistance(distance)?.type ?? null;
}

function buildHouseCusps(chartSignature: ChartSignature) {
  const firstHouseSignLongitude = chartSignature.ascendant ? Math.floor(chartSignature.ascendant.longitude / 30) * 30 : 0;
  return Array.from({ length: 12 }, (_, index) => ({
    angle: normalizeDegrees(firstHouseSignLongitude + index * 30),
    house: index + 1
  }));
}

export function buildAstrologyChartSnapshot(input: AstrologyReportRequest): AstrologyChartSnapshot {
  const request = astrologyReportRequestSchema.parse(input);
  const chartSignature = buildChartSignature(request);
  const placements = [
    ...chartSignature.points,
    ...(chartSignature.ascendant ? [chartSignature.ascendant] : [])
  ].map((point) => ({
    bodyId: bodyIdFor(point.body),
    angle: point.longitude,
    sign: point.sign,
    house: point.house
  }));
  const aspectPlacements = placements.filter((placement) => placement.bodyId !== "ascendant");
  const aspects: AstrologyChartSnapshot["aspects"] = [];

  for (let leftIndex = 0; leftIndex < aspectPlacements.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < aspectPlacements.length; rightIndex += 1) {
      const left = aspectPlacements[leftIndex];
      const right = aspectPlacements[rightIndex];
      if (!left || !right) continue;
      const type = aspectTypeForDistance(Math.abs(left.angle - right.angle));
      if (!type) continue;
      aspects.push({
        id: `${left.bodyId}-${right.bodyId}-${type}`,
        type,
        source: left.bodyId,
        target: right.bodyId
      });
    }
  }

  return {
    zodiacMode: chartSignature.zodiacMode,
    houseSystem: chartSignature.houseSystem,
    placements,
    aspects,
    houseCusps: buildHouseCusps(chartSignature)
  };
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

function buildReportSectionSignalCards(chartSignature: ChartSignature, headings: readonly string[]): ReportSectionSignalCard[] {
  type RawSignal = ReportSectionSignalCard["chartSignals"][number] & { sections: string[] };
  const rawSignals: RawSignal[] = [];
  const placements = [
    ...chartSignature.points,
    ...(chartSignature.ascendant ? [chartSignature.ascendant] : [])
  ];

  for (const point of placements) {
    rawSignals.push({
      ...placementSignal(point),
      sections: sectionsForPlacement(point)
    });
  }

  const aspectPlacements = placements.filter((point) => bodyIdFor(point.body) !== "ascendant");
  for (let leftIndex = 0; leftIndex < aspectPlacements.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < aspectPlacements.length; rightIndex += 1) {
      const left = aspectPlacements[leftIndex];
      const right = aspectPlacements[rightIndex];
      if (!left || !right) continue;
      const match = aspectMatchForDistance(Math.abs(left.longitude - right.longitude));
      if (!match) continue;
      const source = bodyIdFor(left.body);
      const target = bodyIdFor(right.body);
      rawSignals.push({
        id: `aspect_${source}_${match.type}_${target}`,
        label: `${bodyDisplayName(source)} ${match.type} ${bodyDisplayName(target)}`,
        facts: [bodyDisplayName(source), match.type, bodyDisplayName(target), `orb ${match.orb} degrees`],
        priority: Number(Math.max(0.2, 1 - match.orb / 10).toFixed(3)),
        sections: sectionsForAspect(source, target)
      });
    }
  }

  const signCounts = new Map<string, number>();
  const houseCounts = new Map<number, number>();
  for (const point of placements) {
    signCounts.set(point.sign, (signCounts.get(point.sign) ?? 0) + 1);
    if (point.house) houseCounts.set(point.house, (houseCounts.get(point.house) ?? 0) + 1);
  }
  for (const [sign, count] of [...signCounts.entries()].filter(([, count]) => count >= 2).sort((left, right) => right[1] - left[1]).slice(0, 3)) {
    rawSignals.push({
      id: `sign_theme_${sign.toLowerCase()}`,
      label: `${sign} emphasis`,
      facts: [sign, `${count} placements`],
      priority: 0.7 + count / 20,
      sections: ["Identity", "Gifts", "Blind Spots", "Growth"]
    });
  }
  for (const [house, count] of [...houseCounts.entries()].filter(([, count]) => count >= 2).sort((left, right) => right[1] - left[1]).slice(0, 3)) {
    const workHouses = [2, 6, 10];
    rawSignals.push({
      id: `house_theme_${house}`,
      label: `${houseLabel(house)} emphasis`,
      facts: [houseLabel(house), `${count} placements`],
      priority: 0.68 + count / 20,
      sections: workHouses.includes(house) ? ["Work", "Growth"] : ["Identity", "Growth", "Blind Spots"]
    });
  }

  return headings.map((heading) => {
    const meaning = sectionSignalMeanings[heading] ?? sectionSignalMeanings.Identity;
    const selected = rawSignals
      .filter((signal) => signal.sections.includes(heading))
      .sort((left, right) => {
        const leftPriority = heading === "Identity" && left.id.includes("sun") ? left.priority + 2 : left.priority;
        const rightPriority = heading === "Identity" && right.id.includes("sun") ? right.priority + 2 : right.priority;
        return rightPriority - leftPriority;
      })
      .slice(0, heading === "Right Now" ? 3 : 4);
    const fallback = selected.length ? selected : rawSignals.slice().sort((left, right) => right.priority - left.priority).slice(0, 2);
    const chartSignals = fallback.map((signal) => ({
      id: signal.id,
      label: signal.label,
      facts: signal.facts,
      priority: signal.priority
    }));
    return {
      title: heading,
      chartSignals,
      capacities: meaning.capacities,
      risks: meaning.risks,
      tensions: meaning.tensions,
      developmentalTasks: meaning.developmentalTasks,
      evidenceBullets: chartSignals.slice(0, 3).map((signal) => ({
        label: signal.label,
        meaning: signal.facts.join("; ")
      }))
    };
  });
}

export function buildAstrologyReportSectionEvidence(input: AstrologyReportRequest, headings: readonly string[]): AstrologyReportSectionEvidence[] {
  const chartSignature = buildChartSignature(input);
  return buildReportSectionSignalCards(chartSignature, headings).map((card) => ({
    title: card.title,
    evidenceBullets: card.evidenceBullets
  }));
}

function sectionSignalCardBlock(card: ReportSectionSignalCard) {
  return [
    `## ${card.title}`,
    "",
    "Chart signals:",
    ...card.chartSignals.map((signal) => `- ${signal.label}: ${signal.facts.join("; ")}`),
    "",
    `Capacities: ${card.capacities.join("; ") || "none listed"}`,
    `Risks: ${card.risks.join("; ") || "none listed"}`,
    `Tensions: ${card.tensions.join("; ") || "none listed"}`,
    `Developmental tasks: ${card.developmentalTasks.join("; ") || "none listed"}`,
    "",
    "Claim policy: selected section signals only."
  ].join("\n");
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

function deterministicReportLabel(reportType: AstrologyReportRequest["reportType"]) {
  if (reportType === "identity") return "Identity Report";
  if (reportType === "deep") return "Deep Report";
  if (reportType === "progressed") return "Progressed Report";
  if (reportType === "synastry") return "Synastry Report";
  return "Core Report";
}

function deterministicChartSettingLabel(value: string) {
  if (value === "whole-sign") return "Whole Sign";
  return value.slice(0, 1).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

function writeDeterministicCoreReport({ request, chartSignature }: ReportWriterInput): ReportDraft {
  const { sun, moon, ascendant } = chartSignature;
  const sunSign = signForLongitude(sun.longitude);
  const moonSign = signForLongitude(moon.longitude);
  const subject = request.subjectName;
  const publicReportId = `${request.id}:public-signal`;
  const risingText = ascendant ? `, ${ascendant.sign} rising` : "";
  const chartHeadline = `${sun.sign} Sun, ${moon.sign} Moon${risingText}`;
  const reportLabel = deterministicReportLabel(request.reportType);
  const headline = `${subject} — ${reportLabel}`;
  const houseText = ascendant
    ? `${deterministicChartSettingLabel(chartSignature.houseSystem)} houses begin with ${ascendant.sign} as the first-house field.`
    : "No timed Ascendant was supplied, so house language stays out of the public signature.";
  const questionText = request.question
    ? `The reading lens is the user's question: "${request.question}"`
    : "The reading lens is the computed birth-data pattern because no optional question was supplied.";
  const intentText = request.intent ? `Intent marker: ${request.intent}.` : "No optional intent marker was supplied.";

  const summary = `${subject}'s ${reportLabel.toLowerCase()} is grounded in ${chartHeadline}. ${houseText}`;
  const headings = reportHeadingsFor(request);
  const sectionCards = buildReportSectionSignalCards(chartSignature, headings);

  return {
    summary,
    sections: sectionCards.map((card, index) => ({
      id: sectionIdFromTitle(request.id, card.title, index),
      title: card.title,
      body: [
        `${subject}'s ${card.title} section is grounded in ${chartHeadline}. The Sun sits at ${sun.degree} degrees ${sun.sign}, giving the report a ${sunSign.element} and ${sunSign.mode} center of gravity. The Moon sits at ${moon.degree} degrees ${moon.sign}, giving the emotional weather a ${moonSign.element} and ${moonSign.mode} rhythm.`,
        ascendant
          ? `The Ascendant is ${formatPoint(ascendant)}, so ${deterministicChartSettingLabel(chartSignature.houseSystem)} houses shape the timed chart field.`
          : "No timed Ascendant was supplied, so house language stays out of the public signature.",
        `Selected evidence for this section: ${card.evidenceBullets.map((item) => `${item.label} (${item.meaning})`).join("; ")}.`,
        `${questionText}. ${intentText}`,
        index === 0
          ? `This draft was produced by ${LOCAL_DETERMINISTIC_REPORT_WRITER}: no LLM call, no paid provider, no credit spend.`
          : "The deterministic writer keeps this as private structure and exposes only the concise public signal to Composer."
      ].join(" "),
      emphasis: index === 0 ? "primary" : card.title === "Right Now" || card.title === "Integration" ? "practice" : "supporting"
    })),
    publicSignal: {
      reportId: publicReportId,
      requestId: request.id,
      reportType: request.reportType,
      headline,
      summary,
      tone: "grounded",
      boundary: "public_signal",
      provenanceSummary: `${ASTRA_CHART_ROUTINE}: ${chartSignature.zodiacMode}, ${chartSignature.houseSystem}, ${LOCAL_DETERMINISTIC_REPORT_WRITER}, Sun ${sun.sign}, Moon ${moon.sign}${ascendant ? `, Rising ${ascendant.sign}` : ""}`
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
  const headings = [...normalized.matchAll(/^##\s+(.+?)\s*$/gm)];
  const sections = headings
    .map((match, index) => {
      const title = (match[1] ?? "").trim();
      const bodyStart = (match.index ?? 0) + match[0].length;
      const bodyEnd = headings[index + 1]?.index ?? normalized.length;
      const body = normalized
        .slice(bodyStart, bodyEnd)
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
  const headings = reportHeadingsFor(request);
  const v1InterpretiveContext = v1InterpretiveContextFromRequest(request);
  const sectionCards = buildReportSectionSignalCards(chartSignature, headings);
  const requiredHeadings = headings.map((heading) => `## ${heading}`).join("\n");
  const sunPlacement = chartSignature.points.find((point) => point.body === "Sun");
  return [
    "You are writing an astrology reading from structured notes.",
    "The notes are not prose.",
    "Use the notes the way a human writer uses notes: understand them, synthesize them, then write fresh second-person prose.",
    "Before writing, infer one report-level governing thesis from the repeated signals, strongest placements, tensions, and developmental tasks.",
    "Do not print that thesis as a separate heading. Let it quietly organize every section.",
    "This is a natal/person report.",
    "Use direct second person: you and your.",
    "Do not use third-person labels for the subject.",
    "Do not write about the subject as a case file. Address the reader directly even when the subject name is synthetic.",
    "Do not repeat note labels as public labels.",
    "Do not say capacity, risk, developmental task, language domain, primary strain, or priority note in public prose.",
    "Do not invent chart facts.",
    "Do not mention any placement, sign, house, aspect, or timing factor not listed in the section card.",
    "Do not use old stock phrases.",
    "Keep second-person grammar clean: write you want, you understand, you adapt, and you believe; never write you wants, you understands, you adapts, or you believes.",
    "Do not write JSON.",
    "Write plain Markdown only.",
    "",
    `Write a complete plain Markdown Astra report for ${request.subjectName}.`,
    `Selected report depth: ${request.reportType}.`,
    request.reportType === "deep"
      ? [
          "Deep Report depth rules:",
          "- Identity should be 400-500 words.",
          "- Do not undershoot the Identity minimum; 350 words is a hard floor.",
          "- Identity must feel expanded beyond an Identity Report.",
          "- Include fuller synthesis, chart ruler when relevant, and major identity aspects from the Identity card.",
          "- You may include a complete growth or practice sentence.",
          "- Because Deep has many sections, keep the Identity section rich without trying to carry the entire report alone."
        ].join("\n")
      : request.reportType === "core" || request.reportType === "core_self" || request.reportType === "chart_interpretation"
        ? [
            "Core Report depth rules:",
            "- Identity should be 550-700 words when it is the paid Core Report lead section.",
            "- Identity must feel expanded beyond an Identity Report.",
            "- Include fuller synthesis, chart ruler when relevant, and major identity aspects from the Identity card.",
            "- You may include a complete growth or practice sentence."
          ].join("\n")
      : "Keep the report complete, specific, and readable for the selected report type.",
    "",
    "Required structure:",
    `# Astra Report - ${request.subjectName}`,
    requiredHeadings,
    "",
    "Use the required headings exactly as written.",
    'If Right Now is selected, the heading must be exactly "## Right Now"; never write "## Timing" or any timing heading variant.',
    "",
    "Write only the prose body for each selected section.",
    "Do not write Chart Evidence.",
    "Do not write evidence bullets.",
    "Do not write metadata.",
    "Do not write debug text.",
    "The application will render Chart Evidence deterministically after you return the prose.",
    sunPlacement ? `For this chart, the required Sun opening phrase is either "${sunPlacement.sign} Sun" or "Sun in ${sunPlacement.sign}". Use one of those exact phrases in the first or second sentence of Identity.` : "",
    "",
    "Astra Voice Contract:",
    "Write as if the reader paid for a psychologically intelligent interpretive document, not a horoscope column.",
    "- Speak directly to the reader using you and your.",
    "- Translate astrological factors into lived human experience.",
    "- Prefer concrete psychological claims over abstract astrological description.",
    "- Use astrological terms sparingly, but do not hide the chart logic.",
    "- Build a clean bridge from chart factor to human pattern to practical growth edge.",
    "- Include at least one memorable psychological hook.",
    "- Include at least one practical sentence the reader can apply this week.",
    "- Keep the tone calm, intelligent, specific, and human.",
    '- Avoid generic phrases such as "you are a natural communicator," "this aspect gifts you," "you may struggle," or "this placement indicates" unless rewritten into more specific language.',
    "- Do not mention any planet, sign, house, aspect, decan, progression, or timing factor unless it is present in the supplied chart evidence or allowed interpretation inputs.",
    "- Do not include provider, model, prompt version, cached status, debug labels, or generation metadata in the customer-facing report.",
    "",
    "Only mention placements, houses, aspects, chart themes, and timing activations that are present in the selected section signals.",
    "Do not introduce new astrology facts. If a chart factor is not listed in the section card, do not mention it.",
    "Make the sections feel like chapters of one chart, not isolated mini-readings. Each section should deepen or complicate the governing thesis.",
    "Translate every major chart symbol into lived experience: what someone may feel, notice, repeat, avoid, practice, protect, overdo, or learn to make explicit.",
    "In every major section, include the gift, the cost, and the practice implied by the section signals. Do this in natural prose; do not use gift/cost/practice as labels.",
    "End each section's prose with a clear useful sentence: a practical next move, a psychologically resonant recognition, or a concise way to hold the section's tension.",
    "Avoid textbook phrasing. Prefer concrete human sentences over symbolic inventory.",
    "Avoid repeated evidence verbs such as grounds, links, indicates, highlights, and suggests.",
    "When the same signal appears in multiple sections, interpret it through that section's function instead of repeating the same sentence.",
    "Identity opening rule: begin Identity from the Sun placement unless the Identity card has no Sun signal. The first or second sentence must include the exact phrase '[Sign] Sun' or 'Sun in [Sign]' using the Sun sign from the Identity card. Include Sun house or house-system nuance when present, then integrate Mercury/Sun relationship, chart ruler or Ascendant, and dominant identity aspects or themes. Do not make the Sun generic or treat it as standalone Sun-sign astrology.",
    "Right Now must begin with a paragraph that starts exactly: Right now,",
    "Right Now must include the active timing signal, natal target or cycle context, interpretation, and practical instruction when those notes are present.",
    "Do not include Generation Metadata. The application appends it after validation.",
    previousErrors.length ? "The previous draft failed validation. Rewrite the full report and avoid these errors:" : "",
    ...previousErrors.map((error) => `- ${error}`),
    "",
    "Report context:",
    `- Subject: ${request.subjectName}`,
    `- Report type: ${request.reportType}`,
    request.question ? `- User query: ${request.question}` : "",
    request.intent ? `- Intent: ${request.intent}` : "",
    `- House system: ${chartSignature.houseSystem}`,
    `- Zodiac: ${chartSignature.zodiacMode}`,
    v1InterpretiveContext?.length ? ["", "V1 interpretive context notes:", ...v1InterpretiveContext.map((note) => `- ${note}`)].join("\n") : "",
    "",
    "Section signal cards:",
    sectionCards.map(sectionSignalCardBlock).join("\n\n---\n\n"),
    "",
    "Do not copy these notes as prose. Use them the way a human writer uses notes: synthesize, choose the strongest pattern, and write fresh second-person report prose."
  ].join("\n");
}

function reportHeadingsFor(request: AstrologyReportRequest) {
  if (request.reportType === "identity") return [...personIdentityReportHeadings];
  if (request.reportType === "deep") return [...personDeepReportHeadings];
  if (request.reportType === "synastry") return [...synastryReportHeadings];
  if (request.reportType === "progressed") return [...progressedReportHeadings];
  return [...personCoreReportHeadings];
}

function validateModelDraft(request: AstrologyReportRequest, draft: ReportDraft, chartSignature: ChartSignature) {
  const errors: string[] = [];
  const requiredHeadings = reportHeadingsFor(request);
  const sectionCards = buildReportSectionSignalCards(chartSignature, requiredHeadings);
  const sectionTitles = new Set((draft.sections ?? []).map((section) => section.title.trim().toLowerCase()));
  const sectionWordCounts = (draft.sections ?? []).map((section) => ({
    title: section.title,
    words: wordCount(section.body)
  }));
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

  if ((request.reportType === "core" || request.reportType === "core_self" || request.reportType === "deep") && sectionTitles.has("identity")) {
    const identityWords = sectionWordCounts.find((section) => section.title.trim().toLowerCase() === "identity")?.words ?? 0;
    if (identityWords > 0 && identityWords < 350) {
      errors.push(`${request.reportType === "deep" ? "Deep" : "Core"} Identity should be at least 350 words; found ${identityWords}.`);
    }
  }

  if (visibleText.trim().startsWith("{") || visibleText.trim().startsWith("[")) {
    errors.push("Report appears to begin with raw JSON.");
  }

  for (const fragment of forbiddenReportFragments) {
    if ((fragment === "the person" || fragment === "this person") && !new RegExp(`\\b${fragment}\\b`, "i").test(visibleText)) {
      continue;
    }
    if (lowerText.includes(fragment.toLowerCase())) {
      errors.push(`Forbidden public fragment found: ${fragment}`);
    }
  }

  errors.push(...validateUnsupportedSectionClaims(draft, sectionCards, chartSignature));

  return errors;
}

function validateRawModelText(text: string) {
  const errors: string[] = [];
  if (/\*\*Chart Evidence\*\*/i.test(text)) {
    errors.push("Writer output must not include Chart Evidence; evidence is rendered deterministically.");
  }
  return errors;
}

const zodiacSignNames = zodiacSigns.map((sign) => sign.name);
const aspectClaimNames = ["conjunction", "sextile", "square", "trine", "opposition", "quincunx"];

function mentionedTerms(text: string, terms: readonly string[]) {
  return terms.filter((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
}

function allowedEvidenceText(card: ReportSectionSignalCard | undefined) {
  if (!card) return "";
  return [
    card.title,
    ...card.chartSignals.flatMap((signal) => [signal.label, ...signal.facts]),
    ...card.evidenceBullets.flatMap((item) => [item.label, item.meaning])
  ].join("\n");
}

function validateUnsupportedSectionClaims(draft: ReportDraft, cards: ReportSectionSignalCard[], chartSignature: ChartSignature) {
  const errors: string[] = [];
  const allowedText = [
    ...cards.map(allowedEvidenceText),
    chartSignature.sun.sign,
    chartSignature.moon.sign,
    chartSignature.ascendant?.sign ?? "",
    ...chartSignature.points.flatMap((point) => [point.body, point.sign, houseLabel(point.house)])
  ].join("\n");
  for (const section of draft.sections ?? []) {
    for (const sign of mentionedTerms(section.body, zodiacSignNames)) {
      if (!new RegExp(`\\b${sign}\\b`, "i").test(allowedText)) {
        errors.push(`Unsupported astrology claim in ${section.title}: ${sign} is not in the selected report evidence.`);
      }
    }
    for (const aspect of mentionedTerms(section.body, aspectClaimNames)) {
      if (!new RegExp(`\\b${aspect}\\b`, "i").test(allowedText)) {
        errors.push(`Unsupported astrology claim in ${section.title}: ${aspect} is not in the selected report evidence.`);
      }
    }
  }
  return errors;
}

function wordCount(value: string | undefined) {
  return String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
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
    const errors = [...validateRawModelText(text), ...validateModelDraft(input.request, draft, input.chartSignature)];
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
        summary: `Computed ${chartSignature.zodiacMode} Sun, Moon,${ascendant ? " Ascendant," : ""} planetary ecliptic longitudes, and ${chartSignature.houseSystem} chart signature with ${ASTRA_CHART_ROUTINE}.`,
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
