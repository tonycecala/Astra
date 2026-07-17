import {
  type AstrologyReportSection,
  type AstrologyReportRequest,
  type BirthPlaceSearchQuery,
  type BirthPlaceSearchResponse,
  type ChartBirthData,
  type ChartCalculationMode,
  type ChartSettings,
  type RecordAstrologyReportResult,
  type ReportBasisType,
  type ReportGenerationRetryFailure,
  type ReportGenerationRetryIssue,
  type ReportGenerationRetryReasonCode,
  astrologyReportRequestSchema,
  birthPlaceSearchQuerySchema,
  birthPlaceSearchResponseSchema,
  chartSettingsSchema,
  recordAstrologyReportResultSchema
} from "@astra/contracts";
import * as horoscopeModule from "circular-natal-horoscope-js";
import {
  ASTRA_PLAINSPOKEN_READING_GRADE_MAX,
  ASTRA_PLAINSPOKEN_READING_GRADE_MIN,
  ASTRA_READABILITY_ALGORITHM,
  measureReportReadability
} from "./readability";

export {
  ASTRA_PLAINSPOKEN_READING_GRADE_MAX,
  ASTRA_PLAINSPOKEN_READING_GRADE_MIN,
  ASTRA_READABILITY_ALGORITHM,
  measureReportReadability
} from "./readability";

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
export const ASTRA_REPORT_PROMPT_VERSION = "astra-report-writer-2026-07-plainspoken-v5";
export const GEMINI_INTRO_IDENTITY_REPORT_MODEL = "google/gemini-3.5-flash";
const ASTRA_REPORT_MODEL_TIMEOUT_MS = 90_000;
const ASTRA_DEEP_REPORT_MODEL_TIMEOUT_MS = 240_000;

function isWelcomeReportRequest(request: AstrologyReportRequest) {
  const context = request.context && typeof request.context === "object" && !Array.isArray(request.context)
    ? request.context
    : undefined;
  return request.reportType === "identity" && context?.modelPilot === "gemini-intro-identity";
}

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
  premium_bakeoff: "Model Bakeoff"
};

export const reportModelProfilePurposes: Record<ReportModelProfile, string> = {
  smoke: "plumbing tests only",
  debug: "quick dev reports",
  debug_alt: "quick dev reports",
  production: "default paid report writer",
  premium_bakeoff: "premium model comparison"
};

export const reportModelProfileModels: Record<ReportModelProfile, string[]> = {
  smoke: ["openai/gpt-5.6-luna"],
  debug: ["anthropic/claude-haiku-4.5"],
  debug_alt: ["google/gemini-3.5-flash"],
  production: ["anthropic/claude-sonnet-5", "google/gemini-3.5-flash"],
  premium_bakeoff: [
    "anthropic/claude-sonnet-5",
    "openai/gpt-5.6-terra",
    "google/gemini-3.5-flash",
    "google/gemini-2.5-flash-lite",
    "moonshotai/kimi-k2.5",
    "anthropic/claude-opus-4.8",
    "openai/gpt-5.6-sol",
    "anthropic/claude-fable-5"
  ]
};

const deepReportReasoningEffortByModel = new Map<string, "none" | "minimal">([
  ["google/gemini-3.5-flash", "minimal"],
  ["google/gemini-2.5-flash-lite", "none"],
  ["moonshotai/kimi-k2.5", "none"]
]);

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
  houseCusps: Array<{ angle: number; house: number }>;
  houseSystem: HouseSystemMode;
  zodiacMode: ZodiacMode;
  calculationMode: ChartCalculationMode | "legacy";
};

export type AstrologyChartSnapshot = {
  zodiacMode: ZodiacMode;
  houseSystem: HouseSystemMode;
  calculationMode: ChartCalculationMode | "legacy";
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

type ResolvedReportBasis = {
  type: ReportBasisType;
  chartSettings: ChartSettings;
  primary: {
    chartRequestId: string;
    subjectName: string;
    birthData: ChartBirthData;
    calculationMode: ChartCalculationMode | "legacy";
  };
  partner?: {
    chartRequestId: string;
    subjectName: string;
    birthData: ChartBirthData;
    calculationMode: ChartCalculationMode | "legacy";
  };
  asOfDate?: string;
  legacy: boolean;
};

type BasisChartContext = {
  basis: ResolvedReportBasis;
  primary: ChartSignature;
  active: ChartSignature;
  partner?: ChartSignature;
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
  usage?: {
    input_tokens?: unknown;
    output_tokens?: unknown;
    total_tokens?: unknown;
  };
};

type OpenAICompatibleChatResponse = {
  choices?: Array<{
    finish_reason?: unknown;
    message?: {
      content?: unknown;
    };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    completion_tokens_details?: {
      reasoning_tokens?: unknown;
    };
    total_tokens?: unknown;
    cost?: unknown;
  };
};

type ModelUsage = {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  estimatedSpend?: number;
};

type ModelWriterResponse = {
  text: string;
  usage: ModelUsage;
  finishReason?: string;
  latencyMs: number;
};

type ValidatedWriterPart = {
  attemptCount: number;
  usage: ModelUsage;
  finishReason?: string;
  latencyMs: number;
  failures: ReportGenerationRetryFailure[];
};

type DeepSectionGeneration = ValidatedWriterPart & {
  section: AstrologyReportSection;
};

type DeepSectionPartMetadata = ValidatedWriterPart & {
  title: string;
  acceptedText?: string;
};

type SectionedDeepFailureGeneration = {
  attemptCount: number;
  usage: ModelUsage;
  latencyMs: number;
  thesis: ValidatedWriterPart;
  sections: DeepSectionPartMetadata[];
};

class DeepPartGenerationError extends Error {
  constructor(message: string, readonly title: string, readonly generation: ValidatedWriterPart) {
    super(message);
    this.name = "DeepPartGenerationError";
  }
}

class SectionedDeepReportGenerationError extends Error {
  constructor(message: string, readonly generation: SectionedDeepFailureGeneration) {
    super(message);
    this.name = "SectionedDeepReportGenerationError";
  }
}

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

type HoroscopeHouse = {
  id?: number;
  ChartPosition?: {
    StartPosition?: {
      Ecliptic?: {
        DecimalDegrees?: number;
      };
    };
  };
};

type HoroscopeLike = {
  Ascendant?: HoroscopePoint;
  CelestialBodies: Record<string, HoroscopePoint | undefined>;
  Houses?: HoroscopeHouse[];
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
const personCoreReportHeadings = ["Identity", "Relationships", "Work", "Integration"] as const;
const personDeepReportHeadings = ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Integration"] as const;
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
  "turn_off_thought"
];
const thirdPersonSubjectVerbs = [
  "is", "isn't", "was", "wasn't", "has", "hasn't", "had", "does", "doesn't", "did",
  "can", "can't", "cannot", "could", "couldn't", "may", "might", "must", "should", "shouldn't",
  "will", "won't", "would", "wouldn't", "tends", "needs", "wants", "seeks", "feels", "thinks",
  "believes", "finds", "learns", "struggles", "shows", "carries", "holds", "brings", "moves", "uses",
  "makes", "knows", "prefers", "avoids", "values", "experiences", "works", "acts", "responds", "reacts",
  "loves", "gives", "takes", "keeps", "tries"
];
const thirdPersonSubjectLabelPattern = new RegExp(
  `(?:^|[.!?]\\s+|\\n+)(?:this|the) person(?:['’]s|\\s+(?:${thirdPersonSubjectVerbs.join("|")}))\\b`,
  "i"
);

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

export function resolveAstrologyReportGenerationConfigForRequest(
  request: AstrologyReportRequest,
  env: Record<string, string | undefined> = process.env
) {
  const config = resolveAstrologyReportGenerationConfig(env);
  const modelPilot = request.context && typeof request.context === "object" && !Array.isArray(request.context)
    ? request.context.modelPilot
    : undefined;
  if (request.reportType !== "identity" || modelPilot !== "gemini-intro-identity" || config.reportWriter !== DEBUG_MODEL_REPORT_WRITER) return config;

  return {
    ...config,
    reportWriter: DEBUG_MODEL_REPORT_WRITER,
    reportModelProvider: OPENROUTER_REPORT_MODEL_PROVIDER,
    reportModel: GEMINI_INTRO_IDENTITY_REPORT_MODEL
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
    reportBasis: request.reportBasis,
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
    error: `Report writer "${writer}" is not wired. Astra will not call an LLM without an explicit writer route.`,
    reportBasis: request.reportBasis,
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
    error: `${DEBUG_MODEL_REPORT_WRITER} requires explicit model configuration (${missing.join(", ")}). Astra will not call a model or leak private chart data without this configuration.`,
    reportBasis: request.reportBasis,
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
    reportBasis: request.reportBasis,
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

function buildReportModelCallFailedResult(
  input: AstrologyReportRequest,
  message: string,
  generationMetadata?: NonNullable<RecordAstrologyReportResult["generationMetadata"]>
): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: ASTRA_ASTROLOGY_REPORT_ADAPTER,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "failed",
    reportBasis: request.reportBasis,
    generationMetadata,
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

function buildOrigin(birthData: ChartBirthData) {
  const [yearText, monthText, dayText] = birthData.date.split("-");
  const { hour, minute } = toLocalBirthTime(birthData.time);

  return new Origin({
    year: Number.parseInt(yearText ?? "", 10),
    month: Number.parseInt(monthText ?? "", 10) - 1,
    date: Number.parseInt(dayText ?? "", 10),
    hour,
    minute,
    latitude: birthData.latitude ?? 0,
    longitude: birthData.longitude ?? 0
  });
}

function pointFromHoroscope(body: string, point: HoroscopePoint, includeHouse = true): EphemerisPoint | null {
  const longitude = point.ChartPosition?.Ecliptic?.DecimalDegrees;
  if (longitude === undefined) return null;
  return {
    ...pointFor(body, longitude),
    ...(includeHouse && point.House?.id ? { house: point.House.id } : {}),
    retrograde: point.isRetrograde
  };
}

function chartSettingsFor(request: AstrologyReportRequest): ChartSettings {
  if (request.reportBasis) return request.reportBasis.chartSettings;
  return chartSettingsSchema.parse(request.context?.chartSettings ?? {});
}

function buildChartSignatureFor(
  birthData: ChartBirthData,
  chartSettings: ChartSettings,
  requestId: string,
  calculationMode: ChartCalculationMode | "legacy"
): ChartSignature {
  const includeHouses = calculationMode !== "signs-aspects-only";
  const horoscope = new Horoscope({
    origin: buildOrigin(birthData),
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
    const parsed = pointFromHoroscope(label, point, includeHouses);
    return parsed ? [parsed] : [];
  });
  const sun = points.find((point) => point.body === "Sun");
  const moon = points.find((point) => point.body === "Moon");
  if (!sun || !moon) {
    throw new Error(`Chart routine did not return Sun and Moon for report request ${requestId}.`);
  }

  const hasAscendantInputs =
    includeHouses &&
    birthData.time &&
    birthData.latitude !== undefined &&
    birthData.longitude !== undefined;
  const ascendant = hasAscendantInputs && horoscope.Ascendant ? pointFromHoroscope("Ascendant", horoscope.Ascendant, includeHouses) ?? undefined : undefined;
  const houseCusps = hasAscendantInputs
    ? (horoscope.Houses ?? []).flatMap((house, index) => {
        const angle = house.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees;
        return angle === undefined
          ? []
          : [{ angle: normalizeDegrees(angle), house: house.id ?? index + 1 }];
      })
    : [];

  return {
    sun,
    moon,
    ascendant,
    points,
    houseCusps,
    houseSystem: chartSettings.houseSystem,
    zodiacMode: chartSettings.zodiacMode,
    calculationMode
  };
}

function reportBasisFor(request: AstrologyReportRequest): ResolvedReportBasis {
  if (request.reportBasis) {
    return {
      type: request.reportBasis.type,
      chartSettings: request.reportBasis.chartSettings,
      primary: {
        chartRequestId: request.reportBasis.primary.chartRequestId,
        subjectName: request.reportBasis.primary.subjectName,
        birthData: request.reportBasis.primary.birthData,
        calculationMode: request.reportBasis.primary.calculationMode ?? "legacy"
      },
      ...(request.reportBasis.partner
        ? {
            partner: {
              chartRequestId: request.reportBasis.partner.chartRequestId,
              subjectName: request.reportBasis.partner.subjectName,
              birthData: request.reportBasis.partner.birthData,
              calculationMode: request.reportBasis.partner.calculationMode ?? "legacy"
            }
          }
        : {}),
      ...(request.reportBasis.asOfDate ? { asOfDate: request.reportBasis.asOfDate } : {}),
      legacy: request.reportBasis.schemaVersion === 1
    };
  }

  const type: ReportBasisType = request.reportType === "progressed" ? "progressed" : request.reportType === "synastry" ? "synastry" : "natal";
  const partnerContext = request.context?.synastryPartner;
  const partner = partnerContext?.birthData
    ? {
        chartRequestId: partnerContext.chartRequestId,
        subjectName: partnerContext.subjectName,
        birthData: partnerContext.birthData
      }
    : undefined;

  return {
    type,
    chartSettings: chartSettingsFor(request),
    primary: {
      chartRequestId: request.chartRequestId ?? request.id,
      subjectName: request.subjectName,
      birthData: request.birthData,
      calculationMode: "legacy"
    },
    ...(partner ? { partner: { ...partner, calculationMode: "legacy" as const } } : {}),
    ...(type === "progressed" ? { asOfDate: request.createdAt.slice(0, 10) } : {}),
    legacy: true
  };
}

function secondaryProgressedBirthData(birthData: ChartBirthData, asOfDate: string): ChartBirthData {
  const [birthYear, birthMonth, birthDay] = birthData.date.split("-").map(Number);
  const [asOfYear, asOfMonth, asOfDay] = asOfDate.split("-").map(Number);
  const { hour, minute } = toLocalBirthTime(birthData.time);
  const birthDateMs = Date.UTC(birthYear ?? 0, (birthMonth ?? 1) - 1, birthDay ?? 1, hour, minute);
  const asOfDateMs = Date.UTC(asOfYear ?? 0, (asOfMonth ?? 1) - 1, asOfDay ?? 1, hour, minute);
  const elapsedDays = Math.max(0, (asOfDateMs - birthDateMs) / 86_400_000);
  const progressedDate = new Date(birthDateMs + (elapsedDays / 365.2425) * 86_400_000);
  const date = progressedDate.toISOString().slice(0, 10);
  const time = `${String(progressedDate.getUTCHours()).padStart(2, "0")}:${String(progressedDate.getUTCMinutes()).padStart(2, "0")}`;
  return {
    ...birthData,
    date,
    time,
    birthTimeKnown: true
  };
}

function buildBasisChartContext(request: AstrologyReportRequest): BasisChartContext {
  const basis = reportBasisFor(request);
  const primary = buildChartSignatureFor(basis.primary.birthData, basis.chartSettings, request.id, basis.primary.calculationMode);
  if (basis.type === "progressed" && basis.asOfDate) {
    return {
      basis,
      primary,
      active: buildChartSignatureFor(
        secondaryProgressedBirthData(basis.primary.birthData, basis.asOfDate),
        basis.chartSettings,
        request.id,
        basis.primary.calculationMode
      )
    };
  }
  if (basis.type === "synastry" && basis.partner) {
    return {
      basis,
      primary,
      active: primary,
      partner: buildChartSignatureFor(basis.partner.birthData, basis.chartSettings, request.id, basis.partner.calculationMode)
    };
  }
  return { basis, primary, active: primary };
}

function buildChartSignature(request: AstrologyReportRequest): ChartSignature {
  return buildBasisChartContext(request).active;
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
    facts: [bodyDisplayName(bodyId), point.sign, point.house ? houseLabel(point.house) : "", point.retrograde ? "retrograde" : ""].filter(Boolean),
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
  return chartSignature.ascendant ? chartSignature.houseCusps : [];
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
    calculationMode: chartSignature.calculationMode,
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

type RawReportSignal = ReportSectionSignalCard["chartSignals"][number] & { sections: string[] };

function reportSectionSignalCardsFromRawSignals(rawSignals: RawReportSignal[], headings: readonly string[]) {
  return headings.map((heading) => {
    const meaning = sectionSignalMeanings[heading] ?? sectionSignalMeanings.Identity;
    const selected = rawSignals
      .filter((signal) => signal.sections.includes(heading))
      .sort((left, right) => {
        const leftPriority = heading === "Identity" && left.id.includes("sun") ? left.priority + 2 : left.priority;
        const rightPriority = heading === "Identity" && right.id.includes("sun") ? right.priority + 2 : right.priority;
        return rightPriority - leftPriority;
      })
      .slice(0, heading === "Right Now" || heading === "Integration" ? 3 : 4);
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
      evidenceBullets: chartSignals.map((signal) => ({
        label: signal.label,
        meaning: signal.facts.join("; ")
      }))
    };
  });
}

function buildReportSectionSignalCards(chartSignature: ChartSignature, headings: readonly string[]): ReportSectionSignalCard[] {
  const rawSignals: RawReportSignal[] = [];
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

  return reportSectionSignalCardsFromRawSignals(rawSignals, headings);
}

function crossChartSignals(
  left: ChartSignature,
  right: ChartSignature,
  labels: { left: string; right: string },
  idPrefix: string
): RawReportSignal[] {
  const signals: RawReportSignal[] = [];
  for (const leftPoint of left.points) {
    for (const rightPoint of right.points) {
      const match = aspectMatchForDistance(Math.abs(leftPoint.longitude - rightPoint.longitude));
      if (!match) continue;
      const leftBody = bodyIdFor(leftPoint.body);
      const rightBody = bodyIdFor(rightPoint.body);
      signals.push({
        id: `${idPrefix}_${leftBody}_${match.type}_${rightBody}`,
        label: `${labels.left} ${bodyDisplayName(leftBody)} ${match.type} ${labels.right} ${bodyDisplayName(rightBody)}`,
        facts: [
          `${bodyDisplayName(leftBody)} ${match.type} ${bodyDisplayName(rightBody)}`,
          `${leftPoint.degree} degrees ${leftPoint.sign}`,
          `${rightPoint.degree} degrees ${rightPoint.sign}`,
          `orb ${match.orb} degrees`
        ],
        priority: Number(Math.max(0.25, 1 - match.orb / 10).toFixed(3)),
        sections: sectionsForAspect(leftBody, rightBody)
      });
    }
  }
  return signals;
}

function progressedReportSectionSignalCards(context: BasisChartContext, headings: readonly string[]) {
  const baseCards = buildReportSectionSignalCards(context.active, headings);
  const progressedSignals = crossChartSignals(context.active, context.primary, { left: "Progressed", right: "natal" }, "progressed_to_natal");
  return baseCards.map((card) => {
    const placements = card.chartSignals.map((signal) => ({
      ...signal,
      id: `progressed_${signal.id}`,
      label: signal.label.startsWith("Progressed") ? signal.label : `Progressed ${signal.label}`,
      facts: [...signal.facts, `secondary progression as of ${context.basis.asOfDate}`]
    }));
    const crossSignals = progressedSignals
      .filter((signal) => signal.sections.includes(card.title))
      .sort((left, right) => right.priority - left.priority)
      .slice(0, 2);
    const chartSignals = [...crossSignals, ...placements].sort((left, right) => right.priority - left.priority).slice(0, 4);
    return {
      ...card,
      chartSignals,
      evidenceBullets: chartSignals.map((signal) => ({ label: signal.label, meaning: signal.facts.join("; ") }))
    };
  });
}

function synastryReportSectionSignalCards(context: BasisChartContext, headings: readonly string[]) {
  if (!context.partner || !context.basis.partner) return buildReportSectionSignalCards(context.primary, headings);
  const primaryName = context.basis.primary.subjectName;
  const partnerName = context.basis.partner.subjectName;
  const rawSignals = crossChartSignals(context.primary, context.partner, { left: primaryName, right: partnerName }, "synastry");
  rawSignals.push({
    id: "synastry_sun_pair",
    label: `${primaryName} ${context.primary.sun.sign} Sun with ${partnerName} ${context.partner.sun.sign} Sun`,
    facts: [`Sun in ${context.primary.sun.sign}`, `Sun in ${context.partner.sun.sign}`, "two-chart Sun comparison"],
    priority: 0.95,
    sections: [...synastryReportHeadings]
  });
  const bothBirthTimesKnown = context.basis.primary.birthData.birthTimeKnown !== false &&
    Boolean(context.basis.primary.birthData.time) &&
    context.basis.partner.birthData.birthTimeKnown !== false &&
    Boolean(context.basis.partner.birthData.time);
  if (bothBirthTimesKnown) {
    rawSignals.push({
      id: "synastry_moon_pair",
      label: `${primaryName} ${context.primary.moon.sign} Moon with ${partnerName} ${context.partner.moon.sign} Moon`,
      facts: [`Moon in ${context.primary.moon.sign}`, `Moon in ${context.partner.moon.sign}`, "timed two-chart Moon comparison"],
      priority: 0.9,
      sections: ["Communication", "Stability", "Friction"]
    });
  } else {
    for (let index = rawSignals.length - 1; index >= 0; index -= 1) {
      const signal = rawSignals[index];
      if (signal && /(?:^|_)(moon|ascendant)(?:_|$)/.test(signal.id)) rawSignals.splice(index, 1);
    }
  }
  return reportSectionSignalCardsFromRawSignals(rawSignals, headings);
}

function buildReportSectionSignalCardsForRequest(request: AstrologyReportRequest, headings: readonly string[]) {
  const context = buildBasisChartContext(request);
  if (context.basis.type === "progressed") return progressedReportSectionSignalCards(context, headings);
  if (context.basis.type === "synastry") return synastryReportSectionSignalCards(context, headings);
  return buildReportSectionSignalCards(context.primary, headings);
}

export function buildAstrologyReportSectionEvidence(input: AstrologyReportRequest, headings: readonly string[]): AstrologyReportSectionEvidence[] {
  return buildReportSectionSignalCardsForRequest(input, headings).map((card) => ({
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

function chartCalculationScope(chartSignature: ChartSignature) {
  return chartSignature.calculationMode === "signs-aspects-only"
    ? `${deterministicChartSettingLabel(chartSignature.zodiacMode)} zodiac with signs and aspects only; houses and Rising are omitted`
    : `${deterministicChartSettingLabel(chartSignature.zodiacMode)} zodiac and ${deterministicChartSettingLabel(chartSignature.houseSystem)} houses`;
}

function elementAdjective(element: string) {
  if (element === "air") return "airy";
  if (element === "earth") return "earthy";
  if (element === "fire") return "fiery";
  if (element === "water") return "watery";
  return element;
}

function articleFor(value: string) {
  return /^[aeiou]/i.test(value) ? "an" : "a";
}

function natalHousePlacementSummary(chartSignature: ChartSignature) {
  if (chartSignature.calculationMode === "signs-aspects-only") {
    return "The birth place or exact birth time is unresolved, so houses and Rising are omitted.";
  }
  const timedPlacements = [chartSignature.sun, chartSignature.moon]
    .filter((point) => point.house)
    .map((point) => `${point.body} in the ${houseLabel(point.house)}`);
  if (!chartSignature.ascendant || timedPlacements.length === 0) {
    return "No timed Ascendant was supplied, so house-specific interpretation is omitted.";
  }
  return `${deterministicChartSettingLabel(chartSignature.houseSystem)} places the ${timedPlacements.join(" and the ")}, with ${chartSignature.ascendant.sign} rising.`;
}

function writeDeterministicCoreReport({ request, chartSignature }: ReportWriterInput): ReportDraft {
  const basis = reportBasisFor(request);
  const { sun, moon, ascendant } = chartSignature;
  const sunSign = signForLongitude(sun.longitude);
  const moonSign = signForLongitude(moon.longitude);
  const subject = request.subjectName;
  const publicReportId = `${request.id}:public-signal`;
  const risingText = ascendant ? `, ${ascendant.sign} rising` : "";
  const chartHeadline = `${sun.sign} Sun, ${moon.sign} Moon${risingText}`;
  const reportLabel = deterministicReportLabel(request.reportType);
  const headline = `${subject} — ${reportLabel}`;
  const settingsText = chartCalculationScope(chartSignature);
  const houseText = natalHousePlacementSummary(chartSignature);

  const basisSummary = basis.type === "progressed"
    ? `the secondary progressed chart as of ${basis.asOfDate}`
    : basis.type === "synastry" && basis.partner
      ? `the two-chart comparison with ${basis.partner.subjectName}`
      : `the natal chart: ${chartHeadline}`;
  const summary = `${subject}'s ${reportLabel.toLowerCase()} uses ${basisSummary}, calculated with ${settingsText}. ${basis.type === "natal" ? houseText : ""}`.trim();
  const headings = reportHeadingsFor(request);
  const sectionCards = buildReportSectionSignalCardsForRequest(request, headings);
  const sunElement = elementAdjective(sunSign.element);
  const moonElement = elementAdjective(moonSign.element);

  return {
    summary,
    sections: sectionCards.map((card, index) => ({
      id: sectionIdFromTitle(request.id, card.title, index),
      title: card.title,
      body: [
        basis.type === "synastry" && basis.partner
          ? `${card.title} compares ${subject}'s chart with ${basis.partner.subjectName}'s chart through the cross-chart contacts selected below.`
          : basis.type === "progressed"
            ? `${card.title} reads the secondary progressed chart for ${basis.asOfDate} in relationship to the natal chart.`
            : `${subject}'s ${card.title} begins with ${chartHeadline}. The Sun at ${sun.degree} degrees ${sun.sign} gives this pattern ${articleFor(sunElement)} ${sunElement}, ${sunSign.mode} center of gravity. The Moon at ${moon.degree} degrees ${moon.sign} gives the emotional weather ${articleFor(moonElement)} ${moonElement}, ${moonSign.mode} rhythm.`,
        basis.type === "natal"
          ? houseText
          : `The calculation uses ${settingsText}, and the interpretation follows the resulting chart contacts.`,
        `Together, these signals emphasize ${card.capacities.slice(0, 2).join(" and ")}, with ${card.tensions[0]} as the central tension.`,
        `Selected evidence for this section: ${card.evidenceBullets.map((item) => `${item.label} (${item.meaning})`).join("; ")}.`,
        request.question ? `The requested focus is: "${request.question}".` : ""
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
      provenanceSummary: `${ASTRA_CHART_ROUTINE}: ${basis.type} basis, ${chartSignature.zodiacMode}, ${chartSignature.calculationMode === "signs-aspects-only" ? "signs-aspects-only" : chartSignature.houseSystem}, ${LOCAL_DETERMINISTIC_REPORT_WRITER}${basis.type === "natal" ? `, Sun ${sun.sign}, Moon ${moon.sign}${ascendant ? `, Rising ${ascendant.sign}` : ""}` : ""}`
    }
  };
}

function extractOpenAIText(response: OpenAIResponse) {
  if (typeof response.output_text === "string" && response.output_text.trim()) return cleanProviderControlText(response.output_text);

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) return cleanProviderControlText(content.text);
    }
  }

  throw new Error("OpenAI response did not include text output.");
}

function extractOpenAICompatibleChatText(response: OpenAICompatibleChatResponse) {
  for (const choice of response.choices ?? []) {
    const content = choice.message?.content;
    if (typeof content === "string" && content.trim()) return cleanProviderControlText(content);
  }

  throw new Error("OpenAI-compatible chat response did not include text output.");
}

function cleanProviderControlText(text: string) {
  return text
    .replace(/\s*turn_off_thought\s*$/i, "")
    .trim();
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

const astraPlainspokenVoiceContract = [
  "VOICE MODE: PLAINSPOKEN",
  "Target roughly a 6th to 8th grade reading level without dumbing down the insight.",
  "Use short sentences, everyday words, direct statements, and observable behavior.",
  "Say what happens, what it costs, and what can change. If a simpler sentence works, use it.",
  "Sound like a wise, experienced person speaking plainly: warm and lived-in, never academic, clinical, ornate, or stylized.",
  "Mix short and medium sentences. Keep adult psychological nuance; plain does not mean choppy or childish.",
  "Open each section with a direct second-person statement using You or Your. Vary the sentence shape across sections. Do not begin with a question or stock setup such as 'Here's the question,' 'Here is the question,' or 'This section asks.'",
  "Use words such as actually, real, really, and here's sparingly; do not turn them into a repeated voice tic.",
  "Use needed astrology terms accurately, then explain their human meaning in ordinary language."
];

function plainspokenParagraphRule(request: AstrologyReportRequest, unit: "section" | "chapter") {
  if (isWelcomeReportRequest(request)) {
    return "Write the Identity section in exactly 3 short paragraphs. Give each paragraph one coherent move; do not deliver it as one wall of text.";
  }
  return `Write each ${unit} in 2 or 3 paragraphs. Give each paragraph one coherent move; do not deliver it as one wall of text.`;
}

function buildDebugModelPrompt(request: AstrologyReportRequest, chartSignature: ChartSignature, previousErrors: string[] = []) {
  const basis = reportBasisFor(request);
  const headings = reportHeadingsFor(request);
  const v1InterpretiveContext = v1InterpretiveContextFromRequest(request);
  const sectionCards = buildReportSectionSignalCardsForRequest(request, headings);
  const requiredHeadings = headings.map((heading) => `## ${heading}`).join("\n");
  const sunPlacement = chartSignature.points.find((point) => point.body === "Sun");
  return [
    "You are writing an astrology reading from structured notes.",
    "The notes are not prose.",
    "Use the notes the way a human writer uses notes: understand them, synthesize them, then write fresh second-person prose.",
    "Before writing, infer one report-level governing thesis from the repeated signals, strongest placements, tensions, and developmental tasks.",
    "Do not print that thesis as a separate heading. Let it quietly organize every section.",
    basis.type === "progressed"
      ? `This is a secondary progressed report as of ${basis.asOfDate}. Interpret progressed placements and progressed-to-natal contacts, not generic natal traits.`
      : basis.type === "synastry"
        ? `This is a two-chart synastry report${basis.partner ? ` comparing ${basis.primary.subjectName} with ${basis.partner.subjectName}` : ""}. Interpret cross-chart contacts, not either person as a standalone natal profile.`
        : "This is a natal person report.",
    "Use direct second person: you and your.",
    "Do not use third-person labels for the subject.",
    "Do not write about the subject as a case file. Address the reader directly even when the subject name is synthetic.",
    "Do not repeat note labels as public labels.",
    "Do not say capacity, risk, developmental task, language domain, primary strain, or priority note in public prose.",
    "Do not invent chart facts.",
    chartSignature.calculationMode === "signs-aspects-only"
      ? "This is a signs-and-aspects-only chart. Do not mention houses, Rising, Ascendant, Midheaven, angles, or house-system effects."
      : "Treat Zodiac and Houses as calculation inputs: the prose must reflect the resulting signs, house placements, and evidence, not merely name the selected settings.",
    "Do not mention any placement, sign, house, aspect, or timing factor not listed in the section card.",
    "Do not use old stock phrases.",
    "Keep second-person grammar clean: write you want, you understand, you adapt, and you believe; never write you wants, you understands, you adapts, or you believes.",
    "Do not write JSON.",
    "Write plain Markdown only.",
    "",
    `Write a complete plain Markdown Astra report for ${request.subjectName}.`,
    `Selected report depth: ${request.reportType}.`,
    isWelcomeReportRequest(request)
      ? [
          "Welcome Report rules:",
          "- Aim for 250-350 words total.",
          "- Open with a clear, warm orientation to the reader's central pattern.",
          "- End with one grounded next move."
        ].join("\n")
      : request.reportType === "deep"
      ? [
          "Deep Report depth rules:",
          "- Identity should be 400-500 words.",
          "- Do not undershoot the Identity minimum; 350 words is a hard floor.",
          "- Emotions, Relationships, and Work should each be 300-425 words.",
          "- Drive, Gifts, Blind Spots, and Growth should each be 275-400 words.",
          "- Integration should be 225-325 words.",
          "- The complete Deep Report should be at least 2,625 words across its nine chapters.",
          "- Identity must feel expanded beyond an Identity Report.",
          "- Include fuller synthesis, chart ruler when relevant, and major identity aspects from the Identity card.",
          "- Every section must include a complete growth or practice sentence.",
          "- Give each section its own governing question and section-specific secondary signal.",
          "- When a signal repeats, do not repeat its thesis, warning, or practice; interpret a different consequence of that signal in the section's life domain.",
          "- Identity must not carry the report alone. The remaining eight sections must sustain premium interpretive depth."
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
    'If Integration is selected, the heading must be exactly "## Integration"; do not rename it Right Now, Timing, or Current Chapter.',
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
    ...astraPlainspokenVoiceContract,
    plainspokenParagraphRule(request, "section"),
    "Write as if the reader paid for a psychologically intelligent interpretive document, not a horoscope column.",
    "- Prefer concrete psychological claims over abstract astrological description.",
    "- Use astrological terms sparingly, but do not hide the chart logic.",
    "- Build a clean bridge from chart factor to human pattern to practical growth edge.",
    "- Include at least one memorable psychological hook.",
    "- Include at least one practical sentence the reader can apply this week.",
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
    basis.type === "natal"
      ? "Integration must synthesize enduring natal patterns into a practical way of working with the chart. It is not a forecast and must not claim a transit, progression, season, or unusual current activation."
      : "Use timing language only from the supplied dated evidence.",
    basis.type === "natal"
      ? "Across every natal section, avoid forecast language such as this season, current activation, currently active, or unusually active. Present-day practical language is welcome; invented celestial timing is not."
      : "",
    "Do not include Generation Metadata. The application appends it after validation.",
    previousErrors.length ? "The previous draft failed validation. Rewrite the full report and avoid these errors:" : "",
    ...previousErrors.map((error) => `- ${error}`),
    "",
    "Report context:",
    `- Subject: ${request.subjectName}`,
    `- Report type: ${request.reportType}`,
    `- Report basis: ${basis.type}`,
    basis.asOfDate ? `- As of: ${basis.asOfDate}` : "",
    request.question ? `- User query: ${request.question}` : "",
    request.intent ? `- Intent: ${request.intent}` : "",
    chartSignature.calculationMode === "signs-aspects-only"
      ? "- Chart detail: signs and aspects only; houses and Rising omitted"
      : `- House system: ${chartSignature.houseSystem}`,
    `- Zodiac: ${chartSignature.zodiacMode}`,
    v1InterpretiveContext?.length ? ["", "V1 interpretive context notes:", ...v1InterpretiveContext.map((note) => `- ${note}`)].join("\n") : "",
    "",
    "Section signal cards:",
    sectionCards.map(sectionSignalCardBlock).join("\n\n---\n\n"),
    "",
    "Do not copy these notes as prose. Use them the way a human writer uses notes: synthesize, choose the strongest pattern, and write fresh second-person report prose."
  ].join("\n");
}

type PromptModelWriter = (prompt: string, maxOutputTokens: number) => Promise<ModelWriterResponse>;

const deepSectionDepth: Record<string, { minimum: number; target: string; maximum: number }> = {
  Identity: { minimum: 350, target: "400-500", maximum: 540 },
  Emotions: { minimum: 300, target: "300-425", maximum: 460 },
  Relationships: { minimum: 300, target: "300-425", maximum: 460 },
  Work: { minimum: 300, target: "300-425", maximum: 460 },
  Drive: { minimum: 275, target: "275-400", maximum: 435 },
  Gifts: { minimum: 275, target: "275-400", maximum: 435 },
  "Blind Spots": { minimum: 275, target: "275-400", maximum: 435 },
  Growth: { minimum: 275, target: "275-400", maximum: 435 },
  Integration: { minimum: 225, target: "225-325", maximum: 360 }
};

function buildDeepThesisPrompt(request: AstrologyReportRequest, cards: ReportSectionSignalCard[]) {
  return [
    "You are planning one premium astrology report from structured section notes.",
    "Return one private governing thesis. Aim for 35-75 words and never exceed 90 words. Use plain prose with no heading, bullets, JSON, or metadata.",
    "This thesis is an internal writing compass, not customer-facing copy.",
    "Name the central human tension that can organize all nine chapters without reducing them to one repeated lesson.",
    "Do not mention planets, signs, houses, aspects, astrology, chart factors, or timing claims.",
    `Subject: ${request.subjectName}`,
    "Section planning notes:",
    ...cards.map((card) => `- ${card.title}: capacities ${card.capacities.join(", ")}; risks ${card.risks.join(", ")}; tension ${card.tensions.join(", ")}; task ${card.developmentalTasks.join(", ")}.`)
  ].join("\n");
}

function normalizeDeepThesis(text: string) {
  return text
    .replace(/^#+\s+.+$/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function validateDeepThesis(text: string) {
  const thesis = normalizeDeepThesis(text);
  const words = wordCount(thesis);
  const errors: ReportGenerationRetryIssue[] = [];
  if (words < 35 || words > 90) errors.push(retryIssue("thesis_length", `Governing thesis must be 35-90 words; found ${words}.`));
  if (/^\s*[\[{]/.test(text) || /^#+\s/m.test(text) || /^[-*]\s/m.test(text)) {
    errors.push(retryIssue("thesis_format", "Governing thesis must be one plain prose paragraph."));
  }
  if (new RegExp(`\\b(${reportClaimBodyNames.join("|")}|${zodiacSignNames.join("|")}|astrology|chart)\\b`, "i").test(thesis)) {
    errors.push(retryIssue("thesis_astrology", "Governing thesis must stay at the human-pattern level without astrology terms."));
  }
  return errors;
}

function retryIssue(code: ReportGenerationRetryReasonCode, message: string): ReportGenerationRetryIssue {
  return { code, message };
}

function providerRetryIssue(error: unknown): ReportGenerationRetryIssue {
  const message = error instanceof Error ? error.message : "Model provider request failed.";
  if (/did not include (?:text )?output|did not include output text/i.test(message)) {
    return retryIssue("provider_no_text", "Model provider response did not include usable text.");
  }
  if (/timeout|timed out|abort/i.test(message) || (error instanceof Error && error.name === "TimeoutError")) {
    return retryIssue("provider_timeout", "Model provider request timed out.");
  }
  const detail = message.replace(/\s+/g, " ").trim().slice(0, 240);
  return retryIssue(
    "provider_error",
    `Model provider request failed before Astra received a valid chapter.${detail ? ` Provider detail: ${detail}` : ""}`
  );
}

function deepReportReasoningEffortForModel(model: string) {
  return deepReportReasoningEffortByModel.get(model) ?? "none";
}

function retryFailure(
  attempt: number,
  issues: ReportGenerationRetryIssue[],
  latencyMs: number,
  usage: ModelUsage = {},
  finishReason?: string,
  rejectedText?: string
): ReportGenerationRetryFailure {
  return {
    attempt,
    issues,
    ...usage,
    ...(finishReason ? { finishReason } : {}),
    ...(rejectedText?.trim() ? { rejectedText } : {}),
    latencyMs
  };
}

function partGenerationMetadata(part: ValidatedWriterPart) {
  return {
    attemptCount: part.attemptCount,
    ...part.usage,
    ...(part.finishReason ? { finishReason: part.finishReason } : {}),
    latencyMs: part.latencyMs,
    failures: part.failures
  };
}

function sectionPartMetadata(part: DeepSectionGeneration): DeepSectionPartMetadata {
  return {
    title: part.section.title,
    acceptedText: part.section.body,
    attemptCount: part.attemptCount,
    usage: part.usage,
    latencyMs: part.latencyMs,
    failures: part.failures
  };
}

function buildDeepSectionPrompt(input: {
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
  thesis: string;
  previousErrors: string[];
}) {
  const { request, chartSignature, card, thesis, previousErrors } = input;
  const depth = deepSectionDepth[card.title];
  const sunPlacement = chartSignature.points.find((point) => point.body === "Sun");
  return [
    "You are writing one chapter of a premium Astra Deep Report from structured notes.",
    "Write only this chapter's body as plain Markdown. Astra supplies the chapter heading. Do not write any heading, other chapter, report title, evidence block, metadata, JSON, or planning commentary.",
    `Chapter: ${card.title}.`,
    `Target length: ${depth?.target ?? "275-400"} words. Hard minimum: ${depth?.minimum ?? 275}. Hard maximum: ${depth?.maximum ?? 435}.`,
    `Subject: ${request.subjectName}`,
    chartSignature.calculationMode === "signs-aspects-only"
      ? `Zodiac: ${chartSignature.zodiacMode}. Chart detail: signs and aspects only; do not mention houses, Rising, Ascendant, Midheaven, or angles.`
      : `Zodiac: ${chartSignature.zodiacMode}. Houses: ${chartSignature.houseSystem}.`,
    `Private governing thesis: ${thesis}`,
    "Use the thesis as a quiet through-line, not as a sentence to repeat.",
    `This chapter must answer, rather than quote or announce, this distinct governing question: ${card.tensions.join("; ")}.`,
    ...astraPlainspokenVoiceContract,
    plainspokenParagraphRule(request, "chapter"),
    "Speak directly to the reader using you and your.",
    "Translate chart factors into specific lived experience, psychological usefulness, and one practical next move.",
    "Include the chapter's gift, cost, tension, and practice naturally without using those words as labels.",
    "Use at least two selected signals when available, including a section-specific secondary signal.",
    "Do not generalize this chapter into the whole report and do not repeat a generic warning or practice from another life domain.",
    "Mention only chart factors present in this section card. Do not invent transits, progressions, current activation, or seasonal timing.",
    "Avoid textbook astrology, stock spirituality, inflated certainty, and repeated evidence verbs.",
    card.title === "Identity" && sunPlacement
      ? `The first three sentences must include "${sunPlacement.sign} Sun" or "Sun in ${sunPlacement.sign}"${chartSignature.calculationMode === "signs-aspects-only" ? "." : " and integrate its house context."}`
      : "",
    card.title === "Integration"
      ? "Synthesize enduring natal patterns into one grounded way of working with the chart. This is not a forecast and must not claim that anything is newly or currently activated."
      : "",
    "Section signal card:",
    sectionSignalCardBlock(card),
    previousErrors.length ? "The previous version of this chapter failed. Rewrite only this chapter and correct every issue:" : "",
    ...previousErrors.map((error) => `- ${error}`)
  ].filter(Boolean).join("\n");
}

function validateDeepSection(input: {
  text: string;
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
}) {
  const errors = validateRawModelText(input.text).map((message) => retryIssue("forbidden_fragment", message));
  let section: AstrologyReportSection;
  try {
    section = deepSectionFromText(input.text, input.request, input.card.title);
  } catch (error) {
    return [...errors, retryIssue("invalid_markdown", error instanceof Error ? error.message : "Chapter did not include valid Markdown prose.")];
  }
  if (section.title !== input.card.title) {
    errors.push(retryIssue("heading_mismatch", `Required heading is ## ${input.card.title}.`));
    return errors;
  }
  const depth = deepSectionDepth[input.card.title];
  const words = wordCount(section.body);
  if (depth && words < depth.minimum) errors.push(retryIssue("below_minimum", `${input.card.title} must be at least ${depth.minimum} words; found ${words}.`));
  if (depth && words > depth.maximum) errors.push(retryIssue("above_maximum", `${input.card.title} must be at most ${depth.maximum} words; found ${words}.`));
  const visibleText = `${section.title}\n${section.body}`;
  for (const fragment of forbiddenReportFragments) {
    if (visibleText.toLowerCase().includes(fragment.toLowerCase())) {
      errors.push(retryIssue("forbidden_fragment", `Forbidden public fragment found: ${fragment}`));
    }
  }
  if (thirdPersonSubjectLabelPattern.test(visibleText)) {
    errors.push(retryIssue("third_person_subject", "Third-person subject label found; address the report subject as you or your."));
  }
  errors.push(...validateUnsupportedSectionClaims({ sections: [section] } as ReportDraft, [input.card], input.chartSignature).map((message) =>
    retryIssue(message.startsWith("Missing visible chart evidence") ? "evidence_mismatch" : "unsupported_claim", message)
  ));
  if (input.card.title === "Identity") {
    const sun = input.chartSignature.points.find((point) => point.body === "Sun");
    const firstThreeSentences = section.body.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
    if (sun && !new RegExp(`\\b(${sun.sign}\\s+Sun|Sun\\s+in\\s+${sun.sign})\\b`, "i").test(firstThreeSentences)) {
      errors.push(retryIssue("identity_opening", `Identity opening must mention ${sun.sign} Sun or Sun in ${sun.sign} in the first three sentences.`));
    }
  }
  if (reportBasisFor(input.request).type === "natal" && /\b(currently active|currently activated|unusually active|pressing closer than usual|this (?:current )?season)\b/i.test(section.body)) {
    errors.push(retryIssue("natal_timing", "Natal chapter must not imply current timing without dated evidence."));
  }
  return errors;
}

function deepSectionFromText(text: string, request: AstrologyReportRequest, title: string): AstrologyReportSection {
  if (/^##\s+/m.test(text)) {
    const sections = markdownSectionsFromText(text, request);
    if (sections.length !== 1) throw new Error(`Expected one chapter, found ${sections.length}.`);
    return sections[0]!;
  }
  const body = text
    .replace(/^#\s+.+$/gm, "")
    .replace(/\*\*Chart Evidence\*\*[\s\S]*$/i, "")
    .replace(/^[-*]\s+/gm, "")
    .trim();
  if (!body) throw new Error("Model draft did not include chapter prose.");
  return {
    id: sectionIdFromTitle(request.id, title, 0),
    title,
    body,
    emphasis: "supporting"
  };
}

async function generateValidatedDeepThesis(request: AstrologyReportRequest, cards: ReportSectionSignalCard[], writer: PromptModelWriter) {
  let previousErrors: string[] = [];
  let usage: ModelUsage = {};
  let latencyMs = 0;
  const failures: ReportGenerationRetryFailure[] = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const prompt = [buildDeepThesisPrompt(request, cards), ...previousErrors.map((error) => `Previous error: ${error}`)].join("\n");
    let response: ModelWriterResponse;
    const attemptStartedAt = Date.now();
    try {
      response = await writer(prompt, 180);
    } catch (error) {
      const failureLatencyMs = Date.now() - attemptStartedAt;
      const issues = [providerRetryIssue(error)];
      failures.push(retryFailure(attempt, issues, failureLatencyMs));
      latencyMs += failureLatencyMs;
      previousErrors = issues.map((issue) => issue.message);
      continue;
    }
    usage = mergeModelUsage(usage, response.usage);
    latencyMs += response.latencyMs;
    const errors = validateDeepThesis(response.text);
    if (!errors.length) return { thesis: normalizeDeepThesis(response.text), attemptCount: attempt, usage, finishReason: response.finishReason, latencyMs, failures };
    failures.push(retryFailure(attempt, errors, response.latencyMs, response.usage, response.finishReason, response.text));
    previousErrors = errors.map((error) => error.message);
  }
  throw new DeepPartGenerationError(
    `Governing thesis failed validation after retries: ${previousErrors.join("; ")}`,
    "Governing thesis",
    { attemptCount: 3, usage, latencyMs, failures }
  );
}

async function generateValidatedDeepSection(input: {
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
  thesis: string;
  writer: PromptModelWriter;
}): Promise<DeepSectionGeneration> {
  let previousErrors: string[] = [];
  let usage: ModelUsage = {};
  let latencyMs = 0;
  const failures: ReportGenerationRetryFailure[] = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response: ModelWriterResponse;
    const attemptStartedAt = Date.now();
    try {
      response = await input.writer(buildDeepSectionPrompt({ ...input, previousErrors }), 1400);
    } catch (error) {
      const failureLatencyMs = Date.now() - attemptStartedAt;
      const issues = [providerRetryIssue(error)];
      failures.push(retryFailure(attempt, issues, failureLatencyMs));
      latencyMs += failureLatencyMs;
      previousErrors = issues.map((issue) => issue.message);
      continue;
    }
    usage = mergeModelUsage(usage, response.usage);
    latencyMs += response.latencyMs;
    const errors = validateDeepSection({ ...input, text: response.text });
    if (!errors.length) {
      const section = deepSectionFromText(response.text, input.request, input.card.title);
      return { section, attemptCount: attempt, usage, finishReason: response.finishReason, latencyMs, failures };
    }
    failures.push(retryFailure(attempt, errors, response.latencyMs, response.usage, response.finishReason, response.text));
    previousErrors = errors.map((error) => error.message);
  }
  throw new DeepPartGenerationError(
    `${input.card.title} failed validation after retries: ${previousErrors.join("; ")}`,
    input.card.title,
    { attemptCount: 3, usage, latencyMs, failures }
  );
}

async function mapWithConcurrencySettled<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>) {
  const results = new Array<PromiseSettledResult<R>>(items.length);
  let nextIndex = 0;
  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = { status: "fulfilled", value: await worker(items[index]!, index) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()));
  return results;
}

async function generateSectionedDeepDraft(input: ReportWriterInput, writer: PromptModelWriter) {
  const startedAt = Date.now();
  const headings = reportHeadingsFor(input.request);
  const cards = buildReportSectionSignalCardsForRequest(input.request, headings);
  let thesis: Awaited<ReturnType<typeof generateValidatedDeepThesis>>;
  try {
    thesis = await generateValidatedDeepThesis(input.request, cards, writer);
  } catch (error) {
    if (!(error instanceof DeepPartGenerationError)) throw error;
    throw new SectionedDeepReportGenerationError(error.message, {
      attemptCount: error.generation.attemptCount,
      usage: error.generation.usage,
      latencyMs: Date.now() - startedAt,
      thesis: error.generation,
      sections: []
    });
  }
  const settledSections = await mapWithConcurrencySettled(cards, 3, async (card, index) => {
    const generated = await generateValidatedDeepSection({ ...input, card, thesis: thesis.thesis, writer });
    return {
      ...generated,
      section: {
        ...generated.section,
        id: sectionIdFromTitle(input.request.id, card.title, index),
        emphasis: index === 0 ? "primary" : card.title === "Integration" ? "practice" : "supporting"
      } satisfies AstrologyReportSection
    };
  });
  const unexpectedFailure = settledSections.find((result) => result.status === "rejected" && !(result.reason instanceof DeepPartGenerationError));
  if (unexpectedFailure?.status === "rejected") throw unexpectedFailure.reason;
  const sectionParts = settledSections.map((result) => {
    if (result.status === "fulfilled") return sectionPartMetadata(result.value);
    const failure = result.reason as DeepPartGenerationError;
    return { title: failure.title, ...failure.generation };
  });
  const failedSections = settledSections.filter((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failedSections.length) {
    const allParts = [thesis, ...sectionParts];
    throw new SectionedDeepReportGenerationError(
      failedSections.map((result) => (result.reason as DeepPartGenerationError).message).join("; "),
      {
        attemptCount: allParts.reduce((total, part) => total + part.attemptCount, 0),
        usage: allParts.reduce((total, part) => mergeModelUsage(total, part.usage), {} as ModelUsage),
        latencyMs: Date.now() - startedAt,
        thesis,
        sections: sectionParts
      }
    );
  }
  const generatedSections = settledSections.map((result) => (result as PromiseFulfilledResult<DeepSectionGeneration>).value);
  const baseline = writeDeterministicCoreReport(input);
  const identity = generatedSections.find((generated) => generated.section.title === "Identity")?.section.body ?? "";
  const draft: ReportDraft = {
    summary: summaryFromMarkdown(identity, baseline.summary ?? `${input.request.subjectName}'s Deep Report.`),
    sections: generatedSections.map((generated) => generated.section),
    publicSignal: baseline.publicSignal
  };
  const finalErrors = validateModelDraft(input.request, draft, input.chartSignature);
  if (finalErrors.length) throw new Error(`Assembled Deep Report failed validation: ${finalErrors.join("; ")}`);
  const usage = [thesis, ...generatedSections].reduce((total, part) => mergeModelUsage(total, part.usage), {} as ModelUsage);
  return {
    draft,
    attemptCount: thesis.attemptCount + generatedSections.reduce((total, part) => total + part.attemptCount, 0),
    usage,
    latencyMs: Date.now() - startedAt,
    thesis,
    sections: generatedSections
  };
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
  const sectionCards = buildReportSectionSignalCardsForRequest(request, requiredHeadings);
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

  if (request.reportType === "deep") {
    const minimumWordsBySection = new Map([
      ["identity", 350],
      ["emotions", 300],
      ["relationships", 300],
      ["work", 300],
      ["drive", 275],
      ["gifts", 275],
      ["blind spots", 275],
      ["growth", 275],
      ["integration", 225]
    ]);
    for (const section of sectionWordCounts) {
      const minimum = minimumWordsBySection.get(section.title.trim().toLowerCase());
      if (minimum && section.words < minimum) {
        errors.push(`Deep ${section.title} should be at least ${minimum} words; found ${section.words}.`);
      }
    }
    const totalWords = sectionWordCounts.reduce((total, section) => total + section.words, 0);
    if (totalWords < 2625) errors.push(`Deep Report should be at least 2625 words; found ${totalWords}.`);
  }

  if (reportBasisFor(request).type === "natal") {
    const natalProse = draft.sections?.map((section) => section.body).join("\n") ?? "";
    const unsupportedTiming = [
      /\bcurrently active\b/i,
      /\bcurrently activated\b/i,
      /\bunusually active\b/i,
      /\bpressing closer than usual\b/i,
      /\bthis (?:current )?season\b/i
    ];
    if (unsupportedTiming.some((pattern) => pattern.test(natalProse))) {
      errors.push("Natal reports must not imply current timing without dated transit or progressed evidence.");
    }
  }

  if (visibleText.trim().startsWith("{") || visibleText.trim().startsWith("[")) {
    errors.push("Report appears to begin with raw JSON.");
  }

  for (const fragment of forbiddenReportFragments) {
    if (lowerText.includes(fragment.toLowerCase())) {
      errors.push(`Forbidden public fragment found: ${fragment}`);
    }
  }
  if (thirdPersonSubjectLabelPattern.test(visibleText)) {
    errors.push("Third-person subject label found; address the report subject as you or your.");
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

function reportReadabilityMetadata(sections: AstrologyReportSection[]) {
  return {
    algorithm: ASTRA_READABILITY_ALGORITHM,
    targetGradeMin: ASTRA_PLAINSPOKEN_READING_GRADE_MIN,
    targetGradeMax: ASTRA_PLAINSPOKEN_READING_GRADE_MAX,
    overall: measureReportReadability(sections.map((section) => `${section.title}. ${section.body}`).join("\n")),
    sections: sections.map((section) => ({
      title: section.title,
      ...measureReportReadability(section.body)
    }))
  } as const;
}

const zodiacSignNames = zodiacSigns.map((sign) => sign.name);
const reportClaimBodyNames = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Chiron",
  "Ascendant",
  "Midheaven"
] as const;
const aspectAliases: Record<string, string> = {
  conjunct: "conjunction",
  conjuncts: "conjunction",
  conjunction: "conjunction",
  opposite: "opposition",
  opposes: "opposition",
  opposition: "opposition",
  square: "square",
  squares: "square",
  trine: "trine",
  trines: "trine",
  sextile: "sextile",
  sextiles: "sextile",
  quincunx: "quincunx",
  quincunxes: "quincunx"
};
const aspectClaimNames = Object.keys(aspectAliases);

function normalizeClaim(value: string) {
  return value
    .toLowerCase()
    .replace(/\bthe\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAspectClaim(value: string) {
  return aspectAliases[value.toLowerCase()] ?? value.toLowerCase();
}

function titleCaseClaim(value: string) {
  return value[0]?.toUpperCase() ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : value;
}

function compactHouseLabel(value: number | string) {
  const house = Number(value);
  return houseLabel(Number.isFinite(house) ? house : undefined);
}

function aspectClaimKey(left: string, aspect: string, right: string) {
  const endpoints = [left.toLowerCase(), right.toLowerCase()].sort();
  return normalizeClaim(`${endpoints[0]} ${normalizeAspectClaim(aspect)} ${endpoints[1]}`);
}

function signalClaimText(signal: ReportSectionSignalCard["chartSignals"][number]) {
  return [signal.label, ...signal.facts].join(" ");
}

function allowedClaimSet(cards: ReportSectionSignalCard[], chartSignature: ChartSignature) {
  const claims = new Set<string>();
  const add = (claim: string) => {
    const normalized = normalizeClaim(claim);
    if (normalized) claims.add(normalized);
  };
  const addAspect = (left: string, aspect: string, right: string) => {
    claims.add(aspectClaimKey(left, aspect, right));
  };

  for (const point of [...chartSignature.points, ...(chartSignature.ascendant ? [chartSignature.ascendant] : [])]) {
    add(`${point.body} in ${point.sign}`);
    if (point.house) add(`${point.body} in ${compactHouseLabel(point.house)}`);
  }

  for (const card of cards) {
    for (const signal of card.chartSignals) {
      const text = signalClaimText(signal);
      add(signal.label);
      for (const match of text.matchAll(new RegExp(`\\b(${reportClaimBodyNames.join("|")})\\s+in\\s+(${zodiacSignNames.join("|")})\\b`, "gi"))) {
        add(`${match[1]} in ${titleCaseClaim(match[2])}`);
      }
      for (const match of text.matchAll(new RegExp(`\\b(${reportClaimBodyNames.join("|")})\\s+in\\s+(?:${zodiacSignNames.join("|")})\\s+in\\s+(?:the\\s+)?(\\d+)(?:st|nd|rd|th)?\\s+house\\b`, "gi"))) {
        add(`${match[1]} in ${compactHouseLabel(match[2])}`);
      }
      for (const match of text.matchAll(new RegExp(`\\b(${reportClaimBodyNames.join("|")})\\s+in\\s+(?:the\\s+)?(\\d+)(?:st|nd|rd|th)?\\s+house\\b`, "gi"))) {
        add(`${match[1]} in ${compactHouseLabel(match[2])}`);
      }
      for (const match of text.matchAll(new RegExp(`\\b(${reportClaimBodyNames.join("|")})\\s+(${aspectClaimNames.join("|")})\\s+(${reportClaimBodyNames.join("|")})\\b`, "gi"))) {
        addAspect(match[1], match[2], match[3]);
      }
      for (const match of text.matchAll(new RegExp(`\\b(${zodiacSignNames.join("|")})\\s+emphasis\\b`, "gi"))) {
        add(`${titleCaseClaim(match[1])} emphasis`);
      }
      for (const match of text.matchAll(/\b(\d+)(?:st|nd|rd|th)?\s+house emphasis\b/gi)) {
        add(`${compactHouseLabel(match[1])} emphasis`);
      }
    }
  }

  return claims;
}

function mentionedClaimLabels(text: string) {
  const claims: Array<{ label: string; key: string }> = [];
  const bodyPattern = reportClaimBodyNames.join("|");
  const signPattern = zodiacSignNames.join("|");
  const aspectPattern = aspectClaimNames.join("|");
  const pushClaim = (label: string, key = normalizeClaim(label)) => {
    if (!claims.some((claim) => claim.key === key)) claims.push({ label, key });
  };

  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})\\s+in\\s+(${signPattern})\\b`, "gi"))) {
    pushClaim(`${match[1]} in ${titleCaseClaim(match[2])}`);
  }
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})\\s+in\\s+(?:${signPattern})\\s+in\\s+(?:the\\s+)?(\\d+)(?:st|nd|rd|th)?\\s+house\\b`, "gi"))) {
    pushClaim(`${match[1]} in ${compactHouseLabel(match[2])}`);
  }
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})\\s+in\\s+(?:the\\s+)?(\\d+)(?:st|nd|rd|th)?\\s+house\\b`, "gi"))) {
    pushClaim(`${match[1]} in ${compactHouseLabel(match[2])}`);
  }
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})\\s+(${aspectPattern})\\s+(${bodyPattern})\\b`, "gi"))) {
    pushClaim(`${match[1]} ${normalizeAspectClaim(match[2])} ${match[3]}`, aspectClaimKey(match[1], match[2], match[3]));
  }
  for (const match of text.matchAll(new RegExp(`\\b(${signPattern})\\s+emphasis\\b`, "gi"))) {
    pushClaim(`${titleCaseClaim(match[1])} emphasis`);
  }
  for (const match of text.matchAll(/\b(\d+)(?:st|nd|rd|th)?[-\s]+house emphasis\b/gi)) {
    pushClaim(`${compactHouseLabel(match[1])} emphasis`);
  }

  return claims;
}

function sectionCardForTitle(cards: ReportSectionSignalCard[], title: string) {
  const normalizedTitle = normalizeClaim(title);
  return cards.find((card) => normalizeClaim(card.title) === normalizedTitle);
}

function validateEvidenceCompleteness(draft: ReportDraft, cards: ReportSectionSignalCard[]) {
  const errors: string[] = [];
  for (const section of draft.sections ?? []) {
    const card = sectionCardForTitle(cards, section.title);
    if (!card?.evidenceBullets.length) continue;
    const visibleLabels = card.evidenceBullets.map((item) => normalizeClaim(item.label));
    for (const signal of card.chartSignals) {
      const signalClaims = mentionedClaimLabels(signalClaimText(signal));
      if (!signalClaims.some((claim) => section.body.toLowerCase().includes(claim.label.toLowerCase()))) continue;
      const normalizedSignal = normalizeClaim(signal.label);
      if (!visibleLabels.some((label) => label.includes(normalizedSignal) || normalizedSignal.includes(label))) {
        errors.push(`Missing visible chart evidence in ${section.title}: ${signal.label}.`);
      }
    }
  }
  return errors;
}

function validateUnsupportedSectionClaims(draft: ReportDraft, cards: ReportSectionSignalCard[], chartSignature: ChartSignature) {
  const errors: string[] = [];
  const allowedClaims = allowedClaimSet(cards, chartSignature);
  for (const section of draft.sections ?? []) {
    for (const claim of mentionedClaimLabels(section.body)) {
      if (!allowedClaims.has(claim.key)) {
        errors.push(`Unsupported astrology claim in ${section.title}: ${claim.label} is not in the selected report evidence.`);
      }
    }
  }
  errors.push(...validateEvidenceCompleteness(draft, cards));
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

function reportModelTimeoutMsFor(request: AstrologyReportRequest) {
  return request.reportType === "deep" ? ASTRA_DEEP_REPORT_MODEL_TIMEOUT_MS : ASTRA_REPORT_MODEL_TIMEOUT_MS;
}

function nonnegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function nonnegativeInteger(value: unknown) {
  const number = nonnegativeNumber(value);
  return number === undefined ? undefined : Math.round(number);
}

function addOptionalNumbers(left: number | undefined, right: number | undefined) {
  if (left === undefined && right === undefined) return undefined;
  return (left ?? 0) + (right ?? 0);
}

function mergeModelUsage(left: ModelUsage, right: ModelUsage): ModelUsage {
  const reasoningTokens = addOptionalNumbers(left.reasoningTokens, right.reasoningTokens);
  return {
    inputTokens: addOptionalNumbers(left.inputTokens, right.inputTokens),
    outputTokens: addOptionalNumbers(left.outputTokens, right.outputTokens),
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
    totalTokens: addOptionalNumbers(left.totalTokens, right.totalTokens),
    estimatedSpend: addOptionalNumbers(left.estimatedSpend, right.estimatedSpend)
  };
}

async function parseValidatedModelDraft(input: ReportWriterInput, writer: (previousErrors?: string[]) => Promise<ModelWriterResponse>) {
  let previousErrors: string[] = [];
  let usage: ModelUsage = {};
  let latencyMs = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await writer(previousErrors);
    usage = mergeModelUsage(usage, response.usage);
    latencyMs += response.latencyMs;
    const draft = parseModelDraft(response.text, input.request, input.chartSignature);
    const errors = [
      ...(response.finishReason === "length" ? ["Writer response reached its output limit; return a complete report within the requested scope."] : []),
      ...validateRawModelText(response.text),
      ...validateModelDraft(input.request, draft, input.chartSignature)
    ];
    if (!errors.length) return { draft, attemptCount: attempt + 1, usage, latencyMs };
    previousErrors = errors;
  }

  throw new Error(`Model draft failed validation after retries: ${previousErrors.join("; ")}`);
}

async function writeOpenAIDebugModelReportText(
  input: ReportWriterInput,
  config: Required<Pick<AstrologyReportGenerationConfig, "reportModel" | "openaiApiKey">>,
  fetchImpl: typeof fetch,
  previousErrors: string[] = []
): Promise<ModelWriterResponse> {
  return writeOpenAIModelText(
    buildDebugModelPrompt(input.request, input.chartSignature, previousErrors),
    input.request,
    maxModelOutputTokensFor(input.request),
    config,
    fetchImpl
  );
}

async function writeOpenAIModelText(
  prompt: string,
  request: AstrologyReportRequest,
  maxOutputTokens: number,
  config: Required<Pick<AstrologyReportGenerationConfig, "reportModel" | "openaiApiKey">>,
  fetchImpl: typeof fetch
): Promise<ModelWriterResponse> {
  const startedAt = Date.now();
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(reportModelTimeoutMsFor(request)),
    headers: {
      authorization: `Bearer ${config.openaiApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: config.reportModel,
      input: prompt,
      max_output_tokens: maxOutputTokens
    })
  });

  const payload = (await response.json()) as OpenAIResponse & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI Responses API failed with ${response.status}.`);
  }

  return {
    text: extractOpenAIText(payload),
    usage: {
      inputTokens: nonnegativeInteger(payload.usage?.input_tokens),
      outputTokens: nonnegativeInteger(payload.usage?.output_tokens),
      totalTokens: nonnegativeInteger(payload.usage?.total_tokens)
    },
    latencyMs: Date.now() - startedAt
  };
}

async function writeOpenRouterDebugModelReportText(
  input: ReportWriterInput,
  config: Required<Pick<AstrologyReportGenerationConfig, "reportModel" | "openRouterApiKey" | "openRouterBaseUrl">>,
  fetchImpl: typeof fetch,
  previousErrors: string[] = []
): Promise<ModelWriterResponse> {
  return writeOpenRouterModelText(
    buildDebugModelPrompt(input.request, input.chartSignature, previousErrors),
    input.request,
    maxModelOutputTokensFor(input.request),
    config,
    fetchImpl
  );
}

async function writeOpenRouterModelText(
  prompt: string,
  request: AstrologyReportRequest,
  maxOutputTokens: number,
  config: Required<Pick<AstrologyReportGenerationConfig, "reportModel" | "openRouterApiKey" | "openRouterBaseUrl">>,
  fetchImpl: typeof fetch
): Promise<ModelWriterResponse> {
  const baseUrl = config.openRouterBaseUrl.replace(/\/+$/, "");
  const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
  const startedAt = Date.now();
  const response = await fetchImpl(endpoint, {
    method: "POST",
    signal: AbortSignal.timeout(reportModelTimeoutMsFor(request)),
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
          content: prompt
        }
      ],
      max_tokens: maxOutputTokens,
      ...(request.reportType === "deep" ? { reasoning: { effort: deepReportReasoningEffortForModel(config.reportModel) } } : {}),
      temperature: 0.3
    })
  });

  const payload = (await response.json()) as OpenAICompatibleChatResponse & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenRouter chat completions API failed with ${response.status}.`);
  }

  return {
    text: extractOpenAICompatibleChatText(payload),
    usage: {
      inputTokens: nonnegativeInteger(payload.usage?.prompt_tokens),
      outputTokens: nonnegativeInteger(payload.usage?.completion_tokens),
      reasoningTokens: nonnegativeInteger(payload.usage?.completion_tokens_details?.reasoning_tokens),
      totalTokens: nonnegativeInteger(payload.usage?.total_tokens),
      estimatedSpend: nonnegativeNumber(payload.usage?.cost)
    },
    finishReason: typeof payload.choices?.[0]?.finish_reason === "string" ? payload.choices[0].finish_reason : undefined,
    latencyMs: Date.now() - startedAt
  };
}

function buildLocalChartRoutineResult(input: AstrologyReportRequest, draft?: ReportDraft): RecordAstrologyReportResult {
  const request = astrologyReportRequestSchema.parse(input);
  const basisContext = buildBasisChartContext(request);
  const chartSignature = basisContext.active;
  const basis = basisContext.basis;
  const { ascendant } = chartSignature;
  const reportDraft = draft ?? writeDeterministicCoreReport({ request, chartSignature });
  const basisSummary = basis.type === "progressed"
    ? `secondary progression as of ${basis.asOfDate}`
    : basis.type === "synastry" && basis.partner
      ? `two-chart synastry with ${basis.partner.subjectName}`
      : "natal chart";

  return recordAstrologyReportResultSchema.parse({
    requestId: request.id,
    userId: request.userId,
    engine: LOCAL_CHART_ROUTINE_ENGINE,
    engineVersion: ASTRA_ASTROLOGY_REPORT_ADAPTER_VERSION,
    status: "completed",
    reportBasis: request.reportBasis,
    generationMetadata: {
      writer: LOCAL_DETERMINISTIC_REPORT_WRITER,
      promptVersion: ASTRA_REPORT_PROMPT_VERSION,
      attemptCount: 1
    },
    summary: reportDraft.summary,
    sections: reportDraft.sections,
    provenance: [
      {
        id: `${request.id}:birth-data`,
        kind: "birth_data",
        label: "Birth data",
        summary: `${basis.primary.birthData.date}${basis.primary.birthData.time ? ` ${basis.primary.birthData.time}` : " birth time unknown"}${basis.primary.birthData.location ? ` in ${basis.primary.birthData.location}` : ""}${basis.partner ? `; compared with ${basis.partner.subjectName}'s saved birth data` : ""}.`,
        boundary: "private",
        sourceId: request.id
      },
      {
        id: `${request.id}:engine`,
        kind: "engine",
        label: "Chart routine",
        summary: chartSignature.calculationMode === "signs-aspects-only"
          ? `Computed a ${basisSummary} using ${chartSignature.zodiacMode} zodiac with signs and aspects only; houses and Rising were omitted because the saved birth place or exact time was unresolved.`
          : `Computed a ${basisSummary} using ${chartSignature.zodiacMode} zodiac and ${chartSignature.houseSystem} houses with ${ASTRA_CHART_ROUTINE}${ascendant ? ", including timed angles" : ", omitting unavailable angles"}.`,
        boundary: "private"
      },
      {
        id: `${request.id}:writer`,
        kind: "manual",
        label: "Report writer",
        summary: `Wrote private sections and the public signal with ${LOCAL_DETERMINISTIC_REPORT_WRITER}; no external model provider was called.`,
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
  let generation: Awaited<ReturnType<typeof parseValidatedModelDraft>> | Awaited<ReturnType<typeof generateSectionedDeepDraft>>;
  let sectionedGeneration: Awaited<ReturnType<typeof generateSectionedDeepDraft>> | null = null;
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
      const modelConfig = { reportModel, openRouterApiKey, openRouterBaseUrl };
      if (request.reportType === "deep") {
        sectionedGeneration = await generateSectionedDeepDraft(
          writerInput,
          (prompt, maxOutputTokens) => writeOpenRouterModelText(prompt, request, maxOutputTokens, modelConfig, fetchImpl)
        );
        generation = sectionedGeneration;
      } else {
        generation = await parseValidatedModelDraft(
            writerInput,
            (previousErrors) => writeOpenRouterDebugModelReportText(writerInput, modelConfig, fetchImpl, previousErrors)
          );
      }
      draft = generation.draft;
      writerSummary = `${OPENROUTER_REPORT_MODEL_PROVIDER}/${config.reportModel}`;
    } else {
      if (!config.openaiApiKey) {
        return buildReportModelConfigUnavailableResult(request, [ASTRA_OPENAI_API_KEY_ENV]);
      }
      const reportModel = config.reportModel;
      const openaiApiKey = config.openaiApiKey;
      const writerInput = { request, chartSignature };
      const modelConfig = { reportModel, openaiApiKey };
      if (request.reportType === "deep") {
        sectionedGeneration = await generateSectionedDeepDraft(
          writerInput,
          (prompt, maxOutputTokens) => writeOpenAIModelText(prompt, request, maxOutputTokens, modelConfig, fetchImpl)
        );
        generation = sectionedGeneration;
      } else {
        generation = await parseValidatedModelDraft(
            writerInput,
            (previousErrors) => writeOpenAIDebugModelReportText(writerInput, modelConfig, fetchImpl, previousErrors)
          );
      }
      draft = generation.draft;
      writerSummary = `${OPENAI_REPORT_MODEL_PROVIDER}/${config.reportModel}`;
    }
  } catch (error) {
    if (error instanceof SectionedDeepReportGenerationError) {
      return buildReportModelCallFailedResult(request, error.message, {
        writer: DEBUG_MODEL_REPORT_WRITER,
        provider: config.reportModelProvider,
        model: config.reportModel,
        modelProfile: config.reportModelProfile,
        ...(request.reportType === "deep" && config.reportModelProvider === OPENROUTER_REPORT_MODEL_PROVIDER
          ? { reasoningEffort: deepReportReasoningEffortForModel(config.reportModel) }
          : {}),
        promptVersion: ASTRA_REPORT_PROMPT_VERSION,
        attemptCount: error.generation.attemptCount,
        ...error.generation.usage,
        latencyMs: error.generation.latencyMs,
        orchestration: "sectioned-v1",
        thesis: partGenerationMetadata(error.generation.thesis),
        sections: error.generation.sections.map((section) => ({
          title: section.title,
          ...partGenerationMetadata(section),
          ...(section.acceptedText ? { acceptedText: section.acceptedText } : {})
        }))
      });
    }
    return buildReportModelCallFailedResult(request, error instanceof Error ? error.message : "Unknown model writer error.");
  }
  const result = buildLocalChartRoutineResult(request, draft);

  return recordAstrologyReportResultSchema.parse({
    ...result,
    generationMetadata: {
      writer: DEBUG_MODEL_REPORT_WRITER,
      provider: config.reportModelProvider,
      model: config.reportModel,
      modelProfile: config.reportModelProfile,
      ...(request.reportType === "deep" && config.reportModelProvider === OPENROUTER_REPORT_MODEL_PROVIDER
        ? { reasoningEffort: deepReportReasoningEffortForModel(config.reportModel) }
        : {}),
      promptVersion: ASTRA_REPORT_PROMPT_VERSION,
      attemptCount: generation.attemptCount,
      ...generation.usage,
      latencyMs: generation.latencyMs,
      ...(sectionedGeneration
        ? {
            orchestration: "sectioned-v1" as const,
            thesis: partGenerationMetadata(sectionedGeneration.thesis),
            sections: sectionedGeneration.sections.map((section) => ({
              title: section.section.title,
              ...partGenerationMetadata(section)
            })),
            readability: reportReadabilityMetadata(draft.sections)
          }
        : { orchestration: "monolithic" as const })
    },
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
  const config = resolveAstrologyReportGenerationConfigForRequest(request, options.env);
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
