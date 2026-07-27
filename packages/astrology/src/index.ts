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
import {
  normalizeAstrologyChartFacts,
  type NormalizedChartFacts,
  type RawAngleInput,
  type RawLunarNodeInput,
  type RawNormalizedPointInput
} from "./normalizedChartFacts";
import {
  deriveStructuralChartFacts,
  type StructuralChartFacts
} from "./structuralChartFacts";
import {
  buildMeaningComplexNetwork,
  type EvidencePath,
  type MeaningComplex,
  type MeaningComplexNetwork
} from "./meaningComplexNetwork";
import {
  selectMeaningComplexReportViews,
  type MeaningComplexChapterSelection,
  type MeaningComplexReportView,
  type MeaningComplexReportViews
} from "./meaningComplexReportViews";
import {
  normalizedRelationshipContextFromRequest,
  recordValue
} from "./report/relationshipContext";
import {
  chapterEvidencePlanningPolicy,
  planWriterFact,
  type WriterEvidenceRole
} from "./report/evidencePlanning";
import { reportRuleCatalog } from "./report/rules/catalog";
import { reportDetectors } from "./report/rules/detectors";
import {
  editorialRoleInstruction,
  enrichedChapterOwnershipInstruction,
  enrichedProseBoundaryInstruction,
  enrichedSynthesisVoicePlan,
  readerFocusInstruction,
  relationshipContextInstruction,
  reportEvidenceOwnershipPlan,
  reportVoicePlan,
  voicePlanForSection
} from "./report/promptPolicies";
import {
  buildDebugModelPrompt as buildDebugModelPromptFromContracts,
  buildDeepSectionPrompt as buildDeepSectionPromptFromContracts,
  buildDeepThesisPrompt as buildDeepThesisPromptFromContracts,
  buildEnrichedCoreSectionPrompt as buildEnrichedCoreSectionPromptFromContracts,
  buildSectionWriterPacket,
  assertDistinctChapterConclusions,
  familyDepthRules as promptBuilderFamilyDepthRules,
  interpretiveContractFor as promptBuilderInterpretiveContractFor,
  plainspokenParagraphRule as promptBuilderPlainspokenParagraphRule
} from "./report/promptBuilderContracts";
import { auditWriterClaimMarkers } from "./report/writerClaimPlanning";
import {
  monolithicRetryIssue as monolithicRetryIssueFromReport,
  providerRetryIssue as providerRetryIssueFromReport,
  retryFailure as retryFailureFromReport,
  retryIssue as retryIssueFromReport
} from "./report/retryClassification";
import {
  validateRawModelText as validateRawModelTextFromReport,
  wordCount as wordCountFromReport
} from "./report/proseValidation";
import { writeOpenAIModelText as writeOpenAIModelTextFromAdapter } from "./report/openaiAdapter";
import { writeOpenRouterModelText as writeOpenRouterModelTextFromAdapter } from "./report/openRouterAdapter";
import { parseModelDraft as parseModelDraftFromReport } from "./report/draftParsing";
import { sectionFromModelText } from "./report/sectionParsing";
import { validateSectionedReportSection as validateSectionedReportSectionFromReport } from "./report/sectionValidation";
import { retryModelPart } from "./report/retryOrchestration";
import {
  mergeProviderUsage,
  maxModelOutputTokensFor as maxModelOutputTokensForProvider,
  reportModelTimeoutMsFor as reportModelTimeoutMsForProvider
} from "./report/providerUsage";

export {
  ASTRA_PLAINSPOKEN_READING_GRADE_MAX,
  ASTRA_PLAINSPOKEN_READING_GRADE_MIN,
  ASTRA_READABILITY_ALGORITHM,
  measureReportReadability
} from "./readability";
export * from "./normalizedChartFacts";
export * from "./structuralChartFacts";
export * from "./meaningComplexNetwork";
export * from "./meaningComplexReportViews";
export {
  relationshipSituationKeys,
  normalizedRelationshipContextFromRequest,
  type NormalizedRelationshipContext,
  type RelationshipSituation
} from "./report/relationshipContext";

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
export const ASTRA_OPENROUTER_APP_NAME = "AstraComposer";
export const ASTRA_OPENROUTER_SITE_URL = "https://astracomposer.local";
export const ASTRA_PLACE_SEARCH_PROVIDER_ENV = "ASTRA_PLACE_SEARCH_PROVIDER";
export const ASTRA_OPEN_METEO_GEOCODING_URL_ENV = "ASTRA_OPEN_METEO_GEOCODING_URL";
export const LOCAL_CHART_ROUTINE_ENGINE = "local-chart-routine";
export const LOCAL_DETERMINISTIC_REPORT_WRITER = "local-deterministic-writer";
export const DEBUG_MODEL_REPORT_WRITER = "debug-model-writer";
export const OPENAI_REPORT_MODEL_PROVIDER = "openai";
export const OPENROUTER_REPORT_MODEL_PROVIDER = "openrouter";
export const OPENROUTER_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
export const ASTRA_CHART_ROUTINE = "circular-natal-horoscope-js";
export const ASTRA_DEFAULT_ZODIAC_MODE = "tropical";
export const ASTRA_DEFAULT_HOUSE_SYSTEM = "whole-sign";
export const ASTRA_SEMANTIC_SYNTHESIS_VERSION = "2.0.0-phase-4";
export const ASTRA_REPORT_PROMPT_VERSION = "astra-report-writer-2026-07-semantic-synthesis-v2-claim-planned";
export const GEMINI_INTRO_IDENTITY_REPORT_MODEL = "google/gemini-3.5-flash";
const ASTRA_REPORT_MODEL_TIMEOUT_MS = 90_000;
const ASTRA_DEEP_REPORT_MODEL_TIMEOUT_MS = 240_000;

function isWelcomeReportRequest(request: AstrologyReportRequest) {
  const context = request.context && typeof request.context === "object" && !Array.isArray(request.context)
    ? request.context
    : undefined;
  return request.reportType === "identity" && context?.modelPilot === "gemini-intro-identity";
}

function canonicalIdentityFromRequest(request: Pick<AstrologyReportRequest, "context">) {
  const context = recordValue(request.context);
  return typeof context?.canonicalIdentity === "string" ? normalizeReportVoice(context.canonicalIdentity.trim()) : "";
}

function deepChapterFocusInstruction(request: AstrologyReportRequest, title: string) {
  if (!new Set<string>(["Relationships", "Integration"]).has(title)) return "";
  const lines = [readerFocusInstruction(request)];
  if (title === "Relationships") lines.push(relationshipContextInstruction(request));
  if (title === "Integration") {
    lines.push(relationshipContextInstruction(request));
    lines.push("Integration editorial job: turn the useful findings into two or three cross-domain operating principles. Use the reader's focus only where it helps choose an honest next move.");
  }
  return lines.filter(Boolean).join("\n");
}

function canonicalIdentityInstruction(request: AstrologyReportRequest) {
  const identity = canonicalIdentityFromRequest(request);
  if (!identity) return "";
  return [
    "Canonical Identity contract:",
    "- The application will insert the canonical Identity section below; do not generate it.",
    "- Do not contradict, rewrite, or re-teach it in another chapter.",
    "- A later chapter may rely on Identity only as a short bridge. Do not restate its private-reflection mechanism, signals, or reflection-to-expression sequence.",
    "- Treat it as stable chart interpretation, not relationship context.",
    "",
    identity
  ].join("\n");
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

const reportReasoningEffortByModel = new Map<string, "none" | "minimal">([
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
  midheaven?: EphemerisPoint;
  lunarNodes: EphemerisPoint[];
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
    allowedContribution?: string;
    prohibitedInference?: string;
  }>;
  /** The two or three atomic facts authorized for model prose. */
  writerSignals?: ReportSectionSignalCard["chartSignals"];
  capacities: string[];
  risks: string[];
  tensions: string[];
  developmentalTasks: string[];
  evidenceBullets: Array<{
    label: string;
    meaning: string;
  }>;
  /** Optional, editor-curated synthesis for a named chapter. Kept internal to the report writer. */
  hypothesis?: string;
  counterweight?: string;
  claimBoundary?: string;
  chapterQuestion?: string;
  intendedConclusion?: string;
  /** Internal Phase 4 selection trace. It is never serialized into a public report contract. */
  meaningComplexIds?: string[];
};

export type AstrologyReportSectionEvidence = {
  title: string;
  evidenceBullets: Array<{
    label: string;
    meaning: string;
  }>;
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

type SectionedCoreFailureGeneration = Omit<SectionedDeepFailureGeneration, "thesis">;

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

class SectionedCoreReportGenerationError extends Error {
  constructor(message: string, readonly generation: SectionedCoreFailureGeneration) {
    super(message);
    this.name = "SectionedCoreReportGenerationError";
  }
}

class MonolithicReportGenerationError extends Error {
  constructor(message: string, readonly generation: ValidatedWriterPart) {
    super(message);
    this.name = "MonolithicReportGenerationError";
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
  Midheaven?: HoroscopePoint;
  CelestialBodies: Record<string, HoroscopePoint | undefined>;
  CelestialPoints: Record<string, HoroscopePoint | undefined>;
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
    risks: ["sorting feelings before feeling them", "withdrawing to process", "letting one mood color the whole day"],
    tensions: ["feeling versus containment"],
    developmentalTasks: ["let feeling become usable information", "build steady recovery rhythms"]
  },
  Relationships: {
    capacities: ["awareness of connection patterns", "desire", "repair skills"],
    risks: ["filling gaps with assumptions", "leaving needs unstated", "acting before checking"],
    tensions: ["closeness versus autonomy"],
    developmentalTasks: ["make relational needs explicit", "practice clear repair when safe and appropriate"]
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
    risks: ["mistaking an interpretation for an observation", "stepping away before checking", "using more force than the moment needs"],
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
    risks: ["filling gaps with assumptions", "pursuit without clarity"],
    tensions: ["desire versus actual contact"],
    developmentalTasks: ["name what is attractive without making it the whole story"]
  },
  Friction: {
    capacities: ["honest contrast", "growth pressure", "repair potential"],
    risks: ["responding before checking", "misreading motive", "repeated conflict loop"],
    tensions: ["difference versus threat"],
    developmentalTasks: ["separate useful tension from avoidable escalation"]
  },
  Communication: {
    capacities: ["translation", "listening", "shared language"],
    risks: ["assumption", "protecting a position before listening", "talking past each other"],
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
  counterweight?: unknown;
  claimBoundary?: unknown;
};

export class BirthPlaceSearchUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BirthPlaceSearchUnavailableError";
  }
}

type BirthPlaceSearchFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type OpenMeteoPlace = {
  id?: unknown;
  name?: unknown;
  admin1?: unknown;
  country?: unknown;
  timezone?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const PLACE_SEARCH_TIMEOUT_MS = 5_000;

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

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function openMeteoPlaceResult(value: OpenMeteoPlace) {
  const id = typeof value.id === "number" || typeof value.id === "string" ? String(value.id) : "";
  const name = nonEmptyString(value.name);
  const admin1 = nonEmptyString(value.admin1);
  const country = nonEmptyString(value.country);
  const timezone = nonEmptyString(value.timezone);
  const latitude = typeof value.latitude === "number" ? value.latitude : Number.NaN;
  const longitude = typeof value.longitude === "number" ? value.longitude : Number.NaN;

  if (!id || !name || !country || !timezone || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    id: `open-meteo:${id}`,
    label: [name, admin1, country].filter((part, index, parts) => part && parts.indexOf(part) === index).join(", "),
    timezone,
    latitude,
    longitude,
    provider: "open-meteo"
  };
}

async function searchOpenMeteoBirthPlaces(query: BirthPlaceSearchQuery, fetchImpl: BirthPlaceSearchFetch, endpoint = OPEN_METEO_GEOCODING_URL) {
  const url = new URL(endpoint);
  url.searchParams.set("name", query.query);
  url.searchParams.set("count", String(query.limit));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  try {
    const response = await fetchImpl(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(PLACE_SEARCH_TIMEOUT_MS)
    });
    if (!response.ok) throw new Error(`provider returned ${response.status}`);

    const payload = (await response.json()) as { results?: unknown };
    const places = Array.isArray(payload.results) ? (payload.results as OpenMeteoPlace[]) : [];
    return birthPlaceSearchResponseSchema.parse({
      provider: "open-meteo",
      results: places.map(openMeteoPlaceResult).filter((place) => place !== null)
    });
  } catch (error) {
    throw new BirthPlaceSearchUnavailableError(
      `Birth place search is temporarily unavailable${error instanceof Error && error.name === "TimeoutError" ? " (provider timeout)" : ""}.`
    );
  }
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
  env: Record<string, string | undefined> = process.env,
  fetchImpl: BirthPlaceSearchFetch = fetch
): Promise<BirthPlaceSearchResponse> {
  const query = birthPlaceSearchQuerySchema.parse(input);
  const provider = env[ASTRA_PLACE_SEARCH_PROVIDER_ENV]?.trim();

  if (!provider) {
    throw new BirthPlaceSearchUnavailableError(`${ASTRA_PLACE_SEARCH_PROVIDER_ENV} is not configured.`);
  }

  if (provider === "open-meteo") {
    return searchOpenMeteoBirthPlaces(query, fetchImpl, env[ASTRA_OPEN_METEO_GEOCODING_URL_ENV]?.trim() || OPEN_METEO_GEOCODING_URL);
  }

  if (provider !== "local-fixture") {
    throw new BirthPlaceSearchUnavailableError(`Birth place provider "${provider}" is not supported.`);
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

const horoscopeNodeMap = [
  ["North Node", "northnode"],
  ["South Node", "southnode"]
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

function pointFor(body: string, longitude: number, precision = 2): EphemerisPoint {
  const normalized = normalizeDegrees(longitude);
  const sign = signForLongitude(normalized);
  return {
    body,
    longitude: round(normalized, precision),
    sign: sign.name,
    degree: round(normalized % 30, precision)
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

function pointFromHoroscope(
  body: string,
  point: HoroscopePoint,
  includeHouse = true,
  precision = 2
): EphemerisPoint | null {
  const longitude = point.ChartPosition?.Ecliptic?.DecimalDegrees;
  if (longitude === undefined) return null;
  return {
    ...pointFor(body, longitude, precision),
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
  calculationMode: ChartCalculationMode | "legacy",
  precision = 2
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
    const parsed = pointFromHoroscope(label, point, includeHouses, precision);
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
  const ascendant = hasAscendantInputs && horoscope.Ascendant ? pointFromHoroscope("Ascendant", horoscope.Ascendant, includeHouses, precision) ?? undefined : undefined;
  const midheaven = hasAscendantInputs && horoscope.Midheaven ? pointFromHoroscope("Midheaven", horoscope.Midheaven, includeHouses, precision) ?? undefined : undefined;
  const lunarNodes = horoscopeNodeMap.flatMap(([label, key]) => {
    const point = horoscope.CelestialPoints[key];
    if (!point) return [];
    const parsed = pointFromHoroscope(label, point, includeHouses, precision);
    return parsed ? [parsed] : [];
  });
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
    midheaven,
    lunarNodes,
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

function shiftBirthDateDays(birthData: ChartBirthData, days: number): ChartBirthData {
  const [year, month, day] = birthData.date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days, 12));
  return { ...birthData, date: shifted.toISOString().slice(0, 10) };
}

function dailyMotion(current: EphemerisPoint, future: EphemerisPoint | undefined) {
  if (!future) return undefined;
  return ((future.longitude - current.longitude + 540) % 360) - 180;
}

function normalizedPointKind(body: string): RawNormalizedPointInput["kind"] {
  if (body === "Sun" || body === "Moon") return "luminary";
  if (body === "Chiron") return "chiron";
  return "planet";
}

export function buildAstrologyNormalizedChartFacts(input: AstrologyReportRequest): NormalizedChartFacts {
  const request = astrologyReportRequestSchema.parse(input);
  const basis = reportBasisFor(request);
  if (basis.type !== "natal") {
    throw new Error("Semantic Synthesis V2 Phase 1 normalizes natal chart facts only.");
  }
  const current = buildChartSignatureFor(
    basis.primary.birthData,
    basis.chartSettings,
    request.id,
    basis.primary.calculationMode,
    4
  );
  const future = buildChartSignatureFor(
    shiftBirthDateDays(basis.primary.birthData, 1),
    basis.chartSettings,
    request.id,
    basis.primary.calculationMode,
    4
  );
  const futureByBody = new Map(
    [...future.points, ...future.lunarNodes].map((point) => [point.body, point])
  );
  const points: RawNormalizedPointInput[] = current.points.map((point) => ({
    id: bodyIdFor(point.body),
    label: point.body,
    kind: normalizedPointKind(point.body),
    longitude: point.longitude,
    ...(point.house ? { house: point.house } : {}),
    retrograde: point.retrograde ?? false,
    ...(futureByBody.has(point.body)
      ? { dailyMotion: dailyMotion(point, futureByBody.get(point.body)) }
      : {}),
    sourceFactId: `${request.id}:ephemeris:${bodyIdFor(point.body)}`
  }));
  const lunarNodes: RawLunarNodeInput[] = current.lunarNodes.flatMap((point) => {
    const id = point.body === "North Node" ? "north-node" : point.body === "South Node" ? "south-node" : null;
    if (!id) return [];
    return [{
      id,
      label: point.body as RawLunarNodeInput["label"],
      longitude: point.longitude,
      ...(point.house ? { house: point.house } : {}),
      ...(futureByBody.has(point.body)
        ? { dailyMotion: dailyMotion(point, futureByBody.get(point.body)) }
        : {}),
      sourceFactId: `${request.id}:ephemeris:${id}`
    }];
  });
  const angles: RawAngleInput[] = current.calculationMode === "signs-aspects-only"
    ? []
    : [
        ...(current.ascendant
          ? [{
              id: "ascendant" as const,
              label: "Ascendant" as const,
              longitude: current.ascendant.longitude,
              sourceFactId: `${request.id}:angle:ascendant`
            }]
          : []),
        ...(current.midheaven
          ? [{
              id: "midheaven" as const,
              label: "Midheaven" as const,
              longitude: current.midheaven.longitude,
              sourceFactId: `${request.id}:angle:midheaven`
            }]
          : [])
      ];

  return normalizeAstrologyChartFacts({
    zodiacMode: current.zodiacMode,
    houseSystem: current.houseSystem,
    calculationMode: current.calculationMode,
    points,
    lunarNodes,
    angles,
    houseCusps: current.houseCusps.map((cusp) => ({
      house: cusp.house,
      longitude: cusp.angle,
      sourceFactId: `${request.id}:house-cusp:${cusp.house}`
    }))
  });
}

export function buildAstrologyStructuralChartFacts(input: AstrologyReportRequest): StructuralChartFacts {
  return deriveStructuralChartFacts(buildAstrologyNormalizedChartFacts(input));
}

export function buildAstrologyMeaningComplexNetwork(input: AstrologyReportRequest): MeaningComplexNetwork {
  const normalizedFacts = buildAstrologyNormalizedChartFacts(input);
  return buildMeaningComplexNetwork(
    normalizedFacts,
    deriveStructuralChartFacts(normalizedFacts)
  );
}

export function buildAstrologyMeaningComplexReportViews(
  input: AstrologyReportRequest
): MeaningComplexReportViews | null {
  return selectMeaningComplexReportViews(buildAstrologyMeaningComplexNetwork(input));
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

type SectionSynthesisNote = Pick<ReportSectionSignalCard, "hypothesis" | "counterweight" | "claimBoundary">;

function sectionSynthesisNotesFromRequest(request: AstrologyReportRequest) {
  const context = recordValue(request.context);
  const notes = context?.v1InterpretiveNotes;
  if (!Array.isArray(notes)) return new Map<string, SectionSynthesisNote>();

  const byTitle = new Map<string, SectionSynthesisNote>();
  for (const rawNote of notes.slice(0, 24)) {
    if (!rawNote || typeof rawNote !== "object") continue;
    const note = rawNote as InterpretiveNote;
    const title = contextString(note.label);
    const hypothesis = contextString(note.thesis) ?? contextString(note.meaning) ?? contextString(note.humanMeaning);
    if (!title || !hypothesis || byTitle.has(title)) continue;
    const counterweight = contextString(note.counterweight);
    const claimBoundary = contextString(note.claimBoundary);
    byTitle.set(title, {
      hypothesis,
      ...(counterweight ? { counterweight } : {}),
      ...(claimBoundary ? { claimBoundary } : {})
    });
  }
  return byTitle;
}

function enrichSectionSignalCards(
  request: AstrologyReportRequest,
  cards: ReportSectionSignalCard[]
) {
  const notes = sectionSynthesisNotesFromRequest(request);
  if (!notes.size) return cards;
  return cards.map((card) => ({ ...card, ...(notes.get(card.title) ?? {}) }));
}

function meaningComplexViewForRequest(
  request: AstrologyReportRequest,
  network: MeaningComplexNetwork
): MeaningComplexReportView | null {
  const views = selectMeaningComplexReportViews(network);
  if (!views) return null;
  if (request.reportType === "identity") return views.identity;
  if (request.reportType === "deep") return views.deep;
  if (
    request.reportType === "core" ||
    request.reportType === "core_self" ||
    request.reportType === "chart_interpretation"
  ) {
    return views.core;
  }
  return null;
}

function meaningComplexNetworkForReportRequest(
  request: AstrologyReportRequest
): MeaningComplexNetwork | null {
  if (
    request.reportBasis?.schemaVersion !== 2 ||
    request.reportBasis.type !== "natal" ||
    request.reportBasis.primary.calculationMode === undefined
  ) {
    return null;
  }
  const network = buildAstrologyMeaningComplexNetwork(request);
  return network.complexes.length ? network : null;
}

function readableTechnicalLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\s+/g, " ").trim();
}

function nodeFactsForSignal(
  node: MeaningComplexNetwork["nodes"][number],
  mechanism: string
) {
  const facts = [node.label];
  const sign = typeof node.attributes.sign === "string" ? node.attributes.sign : null;
  const house = typeof node.attributes.house === "number" ? node.attributes.house : null;
  const houseRuler = node.type === "RulershipPath" && node.attributes.pathType === "house_ruler";
  const rulerPointId = houseRuler && typeof node.attributes.rulerPointId === "string"
    ? node.attributes.rulerPointId
    : null;
  const rulerHouse = houseRuler && typeof node.attributes.rulerHouse === "number"
    ? node.attributes.rulerHouse
    : null;
  if (sign) {
    facts.push(sign);
    facts.push(`${node.label} in ${sign}`);
  }
  if (houseRuler && house && rulerPointId) {
    const rulerLabel = titleCaseClaim(rulerPointId);
    facts.push(`${rulerLabel} rules ${houseLabel(house)}`);
    if (rulerHouse) facts.push(`${rulerLabel} in ${houseLabel(rulerHouse)}`);
  } else if (house) {
    facts.push(houseLabel(house));
    facts.push(`${node.label} in ${houseLabel(house)}`);
  }
  if (node.type === "PersonalActivation") {
    const targetPointId = typeof node.attributes.targetPointId === "string"
      ? node.attributes.targetPointId
      : null;
    if (targetPointId) facts.push(`${titleCaseClaim(targetPointId)} has natal relevance`);
    facts.push("natal relevance only");
  }
  facts.push(readableTechnicalLabel(mechanism));
  return [...new Set(facts)];
}

function complexAnchorSignal(
  complex: MeaningComplex,
  network: MeaningComplexNetwork,
  priorityAdjustment = 0
): ReportSectionSignalCard["chartSignals"][number] | null {
  const nodeById = new Map(network.nodes.map((node) => [node.id, node]));
  const seedNode = complex.seedNodeIds.map((id) => nodeById.get(id)).find(Boolean);
  if (
    !seedNode ||
    (
      seedNode.type === "RulershipPath" &&
      /\b(?:dispositor-chain|final-dispositor)\b/.test(
        String(seedNode.attributes.pathType ?? "").replaceAll("_", "-")
      )
    )
  ) return null;
  return {
    id: `v2_anchor_${complex.id}`,
    label: seedNode.label,
    facts: nodeFactsForSignal(seedNode, complex.mechanism),
    priority: Number(Math.max(0.2, Math.min(1, complex.score.total + 0.25 + priorityAdjustment)).toFixed(4))
  };
}

function evidenceSignal(
  complex: MeaningComplex,
  path: EvidencePath,
  network: MeaningComplexNetwork
): ReportSectionSignalCard["chartSignals"][number] | null {
  const terminal = network.nodes.find((node) => node.id === path.terminalNodeId);
  if (
    !terminal ||
    (
      terminal.type === "RulershipPath" &&
      /\b(?:dispositor-chain|final-dispositor)\b/.test(
        String(terminal.attributes.pathType ?? "").replaceAll("_", "-")
      )
    )
  ) return null;
  return {
    id: `v2_evidence_${complex.id}_${path.id}`,
    label: terminal.label,
    facts: nodeFactsForSignal(terminal, path.mechanism),
    priority: Number(Math.max(0.2, Math.min(1, path.pathScore)).toFixed(4))
  };
}

function evidencePathChapterFit(
  path: EvidencePath,
  selection: MeaningComplexChapterSelection,
  network: MeaningComplexNetwork
) {
  const terminal = network.nodes.find((node) => node.id === path.terminalNodeId);
  if (!terminal) return 0;
  return terminal.domains.filter((domain) => selection.domainFocus.includes(domain)).length;
}

function authorizeWriterSignal(
  signal: ReportSectionSignalCard["chartSignals"][number],
  role: WriterEvidenceRole,
  selection: MeaningComplexChapterSelection
): ReportSectionSignalCard["chartSignals"][number] {
  const authorization = planWriterFact(selection.title, signal, role);
  return {
    ...signal,
    ...authorization
  };
}

function selectAuthorizedWriterSignals(
  chartSignals: ReportSectionSignalCard["chartSignals"],
  counterweightSignals: ReportSectionSignalCard["chartSignals"],
  selection: MeaningComplexChapterSelection
) {
  const counterweightLabels = new Set(counterweightSignals.map((signal) => signal.label));
  const selected = chartSignals.slice(0, 2);
  const counterweight = counterweightSignals.find((signal) =>
    !selected.some((candidate) => candidate.label === signal.label)
  );
  if (counterweight) selected.push(counterweight);
  if (selected.length < 3) {
    const next = chartSignals.find((signal) =>
      !selected.some((candidate) => candidate.label === signal.label)
    );
    if (next) selected.push(next);
  }
  return selected.slice(0, 3).map((signal, index) =>
    authorizeWriterSignal(
      signal,
      counterweightLabels.has(signal.label)
        ? "counterweight"
        : index === 0
          ? "primary"
          : "support",
      selection
    )
  );
}

function phase4Card(
  fallback: ReportSectionSignalCard,
  selection: MeaningComplexChapterSelection,
  view: MeaningComplexReportView,
  network: MeaningComplexNetwork,
  sharedRootUseIndex: number,
  sharedRootUseCount: number,
  primaryLabelOwners: Map<string, Set<string>>,
  ownedSignalLabels: Set<string>
): ReportSectionSignalCard {
  const complexById = new Map(network.complexes.map((complex) => [complex.id, complex]));
  const primary = complexById.get(selection.primaryComplexId);
  if (!primary) return fallback;
  const supporting = selection.supportingComplexIds
    .map((id) => complexById.get(id))
    .filter((complex): complex is MeaningComplex => Boolean(complex));
  const sharedRoot = sharedRootUseCount > 1;
  const rankedPaths = primary.supportPaths
    .slice()
    .sort((left, right) =>
      evidencePathChapterFit(right, selection, network) -
        evidencePathChapterFit(left, selection, network) ||
      right.pathScore - left.pathScore ||
      left.id.localeCompare(right.id)
    );
  const ordinaryPathLimit = selection.title === "Identity" ? 3 : view.view === "deep" ? 4 : 3;
  const pathLimit = sharedRoot
    ? Math.max(1, Math.min(ordinaryPathLimit, Math.floor(rankedPaths.length / sharedRootUseCount)))
    : ordinaryPathLimit;
  const pathStart = sharedRoot ? sharedRootUseIndex * pathLimit : 0;
  const primarySignals = rankedPaths
    .slice(pathStart)
    .map((path) => evidenceSignal(primary, path, network))
    .filter((signal): signal is ReportSectionSignalCard["chartSignals"][number] => Boolean(signal))
    .filter((signal) => {
      const label = normalizeClaim(signal.label);
      const reservedOwners = primaryLabelOwners.get(label);
      return (!reservedOwners || reservedOwners.has(selection.title)) &&
        !ownedSignalLabels.has(label);
    })
    .slice(0, pathLimit);
  const supportAnchors = supporting
    .map((complex, index) => complexAnchorSignal(complex, network, -index * 0.01))
    .filter((signal): signal is ReportSectionSignalCard["chartSignals"][number] => Boolean(signal))
    .filter((signal) => {
      const label = normalizeClaim(signal.label);
      const reservedOwners = primaryLabelOwners.get(label);
      return (!reservedOwners || reservedOwners.has(selection.title)) &&
        !ownedSignalLabels.has(label);
    });
  const primaryAnchor = complexAnchorSignal(primary, network);
  const counterweightSignals = primary.counterevidence
    .slice()
    .sort((left, right) => right.pathScore - left.pathScore || left.id.localeCompare(right.id))
    .map((path) => evidenceSignal(primary, path, network))
    .filter((signal): signal is ReportSectionSignalCard["chartSignals"][number] => Boolean(signal))
    .filter((signal) => {
      const label = normalizeClaim(signal.label);
      const reservedOwners = primaryLabelOwners.get(label);
      return (!reservedOwners || reservedOwners.has(selection.title)) &&
        !ownedSignalLabels.has(label);
    })
    .slice(0, 1);
  const chartSignals = [
    ...(primaryAnchor ? [primaryAnchor] : []),
    ...supportAnchors,
    ...primarySignals,
    ...counterweightSignals
  ].filter((signal, index, all) => all.findIndex((candidate) => candidate.label === signal.label) === index);
  const supportingMechanisms = supporting.map((complex) =>
    readableTechnicalLabel(complex.mechanism)
  );
  const hypothesis = supportingMechanisms.length
    ? `${primary.hypothesis} Supporting identity structures: ${supportingMechanisms.join("; ")}.`
    : primary.hypothesis;
  const counterweight = counterweightSignals.length
    ? `Counterevidence retained: ${counterweightSignals.map((signal) => signal.label).join("; ")}.`
    : undefined;
  const writerSignals = selectAuthorizedWriterSignals(
    chartSignals,
    counterweightSignals,
    selection
  );
  const planningPolicy = chapterEvidencePlanningPolicy(selection.title);
  return {
    ...fallback,
    chartSignals,
    evidenceBullets: chartSignals.map((signal) => ({
      label: signal.label,
      meaning: signal.facts.join("; ")
    })),
    hypothesis: [
      hypothesis,
      `Chapter application: ${selection.interpretiveJob}.`,
      ...(sharedRoot
        ? ["This complex is a shared root; develop only this chapter application and do not restate its application elsewhere."]
        : [])
    ].join(" "),
    ...(counterweight ? { counterweight } : {}),
    claimBoundary: primary.claimBoundary,
    chapterQuestion: `What can these selected facts responsibly show about ${selection.interpretiveJob}?`,
    intendedConclusion: planningPolicy.intendedConclusion,
    writerSignals,
    meaningComplexIds: [
      primary.id,
      ...supporting.map((complex) => complex.id)
    ]
  };
}

function applyMeaningComplexViewToCards(
  cards: ReportSectionSignalCard[],
  network: MeaningComplexNetwork | null,
  view: MeaningComplexReportView | null
) {
  if (!network || !view) return cards;
  const selectionByTitle = new Map(view.chapters.map((chapter) => [chapter.title, chapter]));
  const primaryUseCounts = new Map<string, number>();
  const primaryUseIndexes = new Map<string, number>();
  const primaryLabelOwners = new Map<string, Set<string>>();
  const complexById = new Map(network.complexes.map((complex) => [complex.id, complex]));
  for (const selection of view.chapters) {
    if (selection.title === "Identity") continue;
    primaryUseCounts.set(
      selection.primaryComplexId,
      (primaryUseCounts.get(selection.primaryComplexId) ?? 0) + 1
    );
    const primary = complexById.get(selection.primaryComplexId);
    const anchor = primary ? complexAnchorSignal(primary, network) : null;
    if (anchor) {
      const label = normalizeClaim(anchor.label);
      const owners = primaryLabelOwners.get(label) ?? new Set<string>();
      owners.add(selection.title);
      primaryLabelOwners.set(label, owners);
    }
  }
  const ownedSignalLabels = new Set<string>();
  const plannedCards = cards.map((card) => {
    const selection = selectionByTitle.get(card.title as MeaningComplexChapterSelection["title"]);
    if (!selection) return card;
    if (selection.title === "Identity") {
      return phase4Card(
        card,
        selection,
        view,
        network,
        0,
        1,
        new Map(),
        new Set()
      );
    }
    const useIndex = primaryUseIndexes.get(selection.primaryComplexId) ?? 0;
    primaryUseIndexes.set(selection.primaryComplexId, useIndex + 1);
    const planned = phase4Card(
      card,
      selection,
      view,
      network,
      useIndex,
      primaryUseCounts.get(selection.primaryComplexId) ?? 1,
      primaryLabelOwners,
      ownedSignalLabels
    );
    for (const signal of planned.chartSignals) {
      ownedSignalLabels.add(normalizeClaim(signal.label));
    }
    return planned;
  });
  assertDistinctChapterConclusions(plannedCards);
  return plannedCards;
}

/**
 * Enriched cards are curated chapter briefs, not a request to repeat every
 * relevant signal in every chapter. Keep Identity's private-reflection
 * material there; each enriched chapter receives only evidence that serves its
 * distinct editorial job. Ordinary reports retain their full fallback.
 */
function prosePlanningCard(card: ReportSectionSignalCard): ReportSectionSignalCard {
  if (!card.hypothesis) return card;
  if (card.meaningComplexIds?.length) return card;
  const signalKind = (signal: ReportSectionSignalCard["chartSignals"][number]) => signal.id.split("_")[0] ?? "";
  const signalBodies = (signal: ReportSectionSignalCard["chartSignals"][number]) => {
    const parts = signal.id.split("_");
    if (parts[0] === "aspect" && parts.length >= 4) return new Set([parts[1], parts[parts.length - 1]]);
    if (parts[0] === "placement" && parts[1]) return new Set([parts[1]]);
    return new Set<string>();
  };
  const isAspect = (signal: ReportSectionSignalCard["chartSignals"][number]) => signalKind(signal) === "aspect";
  const isPlacement = (signal: ReportSectionSignalCard["chartSignals"][number], body: string) =>
    signalKind(signal) === "placement" && signalBodies(signal).has(body);
  const aspectIncludes = (signal: ReportSectionSignalCard["chartSignals"][number], body: string) =>
    isAspect(signal) && signalBodies(signal).has(body);
  const isIdentityReflectionSignal = (signal: ReportSectionSignalCard["chartSignals"][number]) =>
    /\b(?:Sun|Moon)\b|Mercury in .*12th house|12th house/i.test(`${signal.label}; ${signal.facts.join("; ")}`);

  /**
   * Enriched evidence ownership is chart-agnostic. It assigns signal types and
   * planetary roles to chapter jobs; it never keys a rule to a named aspect,
   * sign, or Tony fixture.
   */
  const remainingSignals = card.title === "Work"
    ? card.chartSignals.filter((signal) =>
        !isIdentityReflectionSignal(signal) && (
          signalKind(signal) === "house" ||
          isPlacement(signal, "mercury") ||
          (aspectIncludes(signal, "mercury") && !aspectIncludes(signal, "venus"))
        )
      )
    : card.title === "Emotions"
      ? card.chartSignals.filter((signal) => isPlacement(signal, "moon") || aspectIncludes(signal, "moon"))
    : card.title === "Drive"
      ? card.chartSignals.filter((signal) =>
          isPlacement(signal, "mars") ||
          (aspectIncludes(signal, "mars") && !aspectIncludes(signal, "venus") && !aspectIncludes(signal, "neptune"))
        )
    : card.title === "Gifts"
        ? card.chartSignals.filter((signal) => isPlacement(signal, "venus"))
      : card.title === "Relationships"
        ? (() => {
            const dynamics = card.chartSignals.filter((signal) =>
              aspectIncludes(signal, "venus") ||
              (aspectIncludes(signal, "mars") && aspectIncludes(signal, "neptune"))
            );
            return dynamics.length
              ? dynamics
              : card.chartSignals.filter((signal) => isPlacement(signal, "venus") || isPlacement(signal, "mars"));
          })()
      : card.title === "Blind Spots"
        ? card.chartSignals.filter((signal) => {
            const bodies = signalBodies(signal);
            const personalBodies = ["sun", "moon", "mercury", "venus", "mars"];
            return (isAspect(signal) && personalBodies.every((body) => !bodies.has(body))) || isPlacement(signal, "saturn");
          })
        : card.title === "Growth"
          ? (() => {
              const signThemes = card.chartSignals.filter((signal) => signalKind(signal) === "sign");
              return signThemes.length > 1 ? signThemes.slice(1) : [];
            })()
          : card.title === "Integration"
            ? card.chartSignals.filter((signal) => !isIdentityReflectionSignal(signal) && !/\bMercury\b/i.test(signal.label))
            : card.chartSignals;
  return {
    ...card,
    // An enriched card may intentionally have no raw signal left after its
    // shared evidence is assigned elsewhere. Do not restore the full card:
    // its curated hypothesis remains the bounded brief for this chapter.
    chartSignals: remainingSignals
  };
}

function prosePlanningCards(cards: readonly ReportSectionSignalCard[]) {
  return cards.map(prosePlanningCard);
}

type RawReportSignal = ReportSectionSignalCard["chartSignals"][number] & { sections: string[] };

function ownedSectionsForAspect(source: string, target: string) {
  const bodies = new Set([source, target]);
  if (bodies.has("sun")) return ["Identity", "Growth"];
  if (bodies.has("moon")) return ["Emotions", "Integration"];
  if (bodies.has("venus")) return ["Relationships", "Gifts"];
  if (bodies.has("mars")) {
    return ["Drive", bodies.has("jupiter") || bodies.has("saturn") ? "Work" : "Relationships"];
  }
  if (bodies.has("mercury")) return ["Work", "Gifts"];
  return ["Growth", "Blind Spots"];
}

function reportSectionSignalCardsFromRawSignals(
  rawSignals: RawReportSignal[],
  headings: readonly string[],
  selectionLimit = 4
) {
  return headings.map((heading) => {
    const meaning = sectionSignalMeanings[heading] ?? sectionSignalMeanings.Identity;
    const selected = rawSignals
      .filter((signal) => signal.sections.includes(heading))
      .sort((left, right) => {
        const leftPriority = heading === "Identity" && left.id.includes("sun") ? left.priority + 2 : left.priority;
        const rightPriority = heading === "Identity" && right.id.includes("sun") ? right.priority + 2 : right.priority;
        return rightPriority - leftPriority;
      })
      .slice(0, heading === "Right Now" || heading === "Integration" ? 3 : selectionLimit);
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

function buildReportSectionSignalCards(
  chartSignature: ChartSignature,
  headings: readonly string[],
  selectionLimit = 4
): ReportSectionSignalCard[] {
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
        sections: ownedSectionsForAspect(source, target)
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

  return reportSectionSignalCardsFromRawSignals(rawSignals, headings, selectionLimit);
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
  const enrichedSelectionLimit = sectionSynthesisNotesFromRequest(request).size ? 12 : 4;
  const cards = context.basis.type === "progressed"
    ? progressedReportSectionSignalCards(context, headings)
    : context.basis.type === "synastry"
      ? synastryReportSectionSignalCards(context, headings)
      : buildReportSectionSignalCards(context.primary, headings, enrichedSelectionLimit);
  const enriched = enrichSectionSignalCards(request, cards);
  const network = meaningComplexNetworkForReportRequest(request);
  return applyMeaningComplexViewToCards(
    enriched,
    network,
    network ? meaningComplexViewForRequest(request, network) : null
  );
}

export function buildAstrologyReportSectionEvidence(input: AstrologyReportRequest, headings: readonly string[]): AstrologyReportSectionEvidence[] {
  return buildReportSectionSignalCardsForRequest(input, headings).map((card) => ({
    title: card.title,
    evidenceBullets: card.evidenceBullets
  }));
}

function sectionSignalCardBlock(card: ReportSectionSignalCard) {
  return buildSectionWriterPacket(card);
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
  const sectionCards = prosePlanningCards(buildReportSectionSignalCardsForRequest(request, headings));
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
            : `${subject}'s ${card.title} begins with ${chartHeadline}. The Sun at ${sun.degree} degrees ${sun.sign} gives this pattern ${articleFor(sunElement)} ${sunElement}, ${sunSign.mode} style. The Moon at ${moon.degree} degrees ${moon.sign} describes ${articleFor(moonElement)} ${moonElement}, ${moonSign.mode} emotional response.`,
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


function sectionIdFromTitle(requestId: string, title: string, index: number) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${requestId}:${slug || `section-${index + 1}`}`;
}

function normalizeReportVoice(value: string) {
  const preserveInitialCase = (match: string, replacement: string) => (
    /^[A-Z]/.test(match)
      ? `${replacement.charAt(0).toUpperCase()}${replacement.slice(1)}`
      : replacement
  );
  return value
    .replace(/\bworth sitting with\b/gi, (match) => preserveInitialCase(match, "worth considering"))
    .replace(/\bsitting with\b/gi, (match) => preserveInitialCase(match, "considering"))
    .replace(/\bsit with\b/gi, (match) => preserveInitialCase(match, "consider"))
    .replace(/\bthe task isn't to ([^.]+)\.\s+it's to\b/gi, (match, contrast: string) => (
      `${preserveInitialCase(match, "the point is not to")} ${contrast}. It is to`
    ))
    .replace(/\bthe useful move(?: here)? isn't\b/gi, (match) => preserveInitialCase(match, "a better response is not"))
    .replace(/\bthe useful move(?: here)? is\b/gi, (match) => preserveInitialCase(match, "what helps is"))
    .replace(/\bthe fix isn't\b/gi, (match) => preserveInitialCase(match, "a better response is not"))
    .replace(/\bthe fix is\b/gi, (match) => preserveInitialCase(match, "a better response is"))
    .replace(/\bthe task worth naming,\s*gently,\s*is not\b/gi, (match) => preserveInitialCase(match, "the point is not"))
    .replace(/\bthe task isn't to\b/gi, (match) => preserveInitialCase(match, "you do not need to"))
    .replace(/\bthe task isn't\b/gi, (match) => preserveInitialCase(match, "the point is not"))
    .replace(/\bthe task is\b/gi, (match) => preserveInitialCase(match, "what matters is"))
    .replace(/\bthe risk isn't\b/gi, (match) => preserveInitialCase(match, "the pressure point is not"))
    .replace(/\bthe risk is\b/gi, (match) => preserveInitialCase(match, "the pressure point is"))
    .replace(/\b(?:so\s+)?the pattern worth watching is this:\s*/gi, (match) => preserveInitialCase(match, "notice whether "))
    .replace(/\bthe pattern worth watching is\b/gi, (match) => preserveInitialCase(match, "notice whether"))
    .replace(/\bthe useful move(?: here)?\b/gi, (match) => preserveInitialCase(match, "what helps"))
    .replace(/\bthe fix\b/gi, (match) => preserveInitialCase(match, "a better response"))
    .replace(/\bthe task(?: worth naming)?\b/gi, (match) => preserveInitialCase(match, "what matters"))
    .replace(/\bthe risk\b/gi, (match) => preserveInitialCase(match, "the pressure point"))
    .replace(/\bthe practical move\b/gi, (match) => preserveInitialCase(match, "a practical response"))
    .replace(/\bthe pattern worth watching\b/gi, (match) => preserveInitialCase(match, "the pattern to notice"));
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
      const body = normalizeReportVoice(
        normalized
          .slice(bodyStart, bodyEnd)
          .replace(/\*\*Chart Evidence\*\*[\s\S]*$/i, "")
          .replace(/^[-*]\s+/gm, "")
          .trim()
      );
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

function writerHeadingsFor(request: AstrologyReportRequest): string[] {
  const headings: string[] = reportHeadingsFor(request);
  return canonicalIdentityFromRequest(request) ? headings.filter((heading) => heading !== "Identity") : headings;
}

function canonicalIdentitySection(request: AstrologyReportRequest, index: number): AstrologyReportSection | null {
  const body = canonicalIdentityFromRequest(request);
  if (!body) return null;
  return {
    id: sectionIdFromTitle(request.id, "Identity", index),
    title: "Identity",
    body,
    emphasis: "primary"
  };
}

function assembleReportSections(
  request: AstrologyReportRequest,
  generatedSections: AstrologyReportSection[]
) : AstrologyReportSection[] {
  const generatedByTitle = new Map(generatedSections.map((section) => [section.title, section]));
  return reportHeadingsFor(request).flatMap((title, index) => {
    if (title === "Identity") {
      const canonical = canonicalIdentitySection(request, index);
      if (canonical) return [canonical];
    }
    const generated = generatedByTitle.get(title);
    return generated ? [{ ...generated, id: sectionIdFromTitle(request.id, title, index), emphasis: index === 0 ? "primary" : title === "Integration" ? "practice" : "supporting" }] : [];
  });
}

function parseModelDraft(text: string, request: AstrologyReportRequest, chartSignature: ChartSignature): ReportDraft {
  return parseModelDraftFromReport(text, request, chartSignature, {
    deterministicBaseline: writeDeterministicCoreReport,
    canonicalIdentity: canonicalIdentityFromRequest,
    writerHeadings: writerHeadingsFor,
    markdownSections: markdownSectionsFromText,
    assembleSections: assembleReportSections,
    summaryFromMarkdown,
    debugWriter: DEBUG_MODEL_REPORT_WRITER
  });
}

const astraPlainspokenVoiceContract = reportRuleCatalog.voice.plainspoken;
const astraInterpretiveContract = reportRuleCatalog.voice.interpretive;

function interpretiveContractFor(cards: readonly ReportSectionSignalCard[]) {
  return promptBuilderInterpretiveContractFor(cards, astraInterpretiveContract);
}

const astraPsychologicalSafetyContract = reportRuleCatalog.safety;
const astraEvidenceContract = reportRuleCatalog.evidence;

type SectionDepthRule = { target: string; minimum: number; maximum: number };

const paidReportSectionDepth: Partial<Record<AstrologyReportRequest["reportType"], Record<string, SectionDepthRule>>> = {
  identity: {
    Identity: { target: "350-450", minimum: 325, maximum: 500 }
  },
  core: {
    Identity: { target: "350-425", minimum: 325, maximum: 475 },
    Relationships: { target: "225-300", minimum: 200, maximum: 340 },
    Work: { target: "225-300", minimum: 200, maximum: 340 },
    Integration: { target: "175-225", minimum: 150, maximum: 260 }
  },
  core_self: {
    Identity: { target: "350-425", minimum: 325, maximum: 475 },
    Relationships: { target: "225-300", minimum: 200, maximum: 340 },
    Work: { target: "225-300", minimum: 200, maximum: 340 },
    Integration: { target: "175-225", minimum: 150, maximum: 260 }
  },
  chart_interpretation: {
    Identity: { target: "350-425", minimum: 325, maximum: 475 },
    Relationships: { target: "225-300", minimum: 200, maximum: 340 },
    Work: { target: "225-300", minimum: 200, maximum: 340 },
    Integration: { target: "175-225", minimum: 150, maximum: 260 }
  },
  progressed: {
    "Current Chapter": { target: "225-300", minimum: 200, maximum: 340 },
    "Progressed Sun": { target: "200-275", minimum: 175, maximum: 315 },
    "Progressed Moon": { target: "200-275", minimum: 175, maximum: 315 },
    Integration: { target: "150-225", minimum: 140, maximum: 260 }
  },
  synastry: {
    Attraction: { target: "200-275", minimum: 175, maximum: 315 },
    Friction: { target: "200-275", minimum: 175, maximum: 315 },
    Communication: { target: "200-275", minimum: 175, maximum: 315 },
    Stability: { target: "200-275", minimum: 175, maximum: 315 }
  }
};

function plainspokenParagraphRule(request: AstrologyReportRequest, unit: "section" | "chapter") {
  return promptBuilderPlainspokenParagraphRule(request, unit, isWelcomeReportRequest);
}

function familyDepthRules(request: AstrologyReportRequest) {
  return promptBuilderFamilyDepthRules(request, isWelcomeReportRequest, paidReportSectionDepth);
}

function buildDebugModelPrompt(request: AstrologyReportRequest, chartSignature: ChartSignature, previousErrors: string[] = []) {
  return buildDebugModelPromptFromContracts(request, chartSignature, previousErrors, {
    basisFor: reportBasisFor,
    headingsFor: reportHeadingsFor,
    writerHeadingsFor: writerHeadingsFor,
    cardsForRequest: buildReportSectionSignalCardsForRequest,
    familyDepthRules,
    canonicalIdentityFromRequest,
    plainspokenContract: astraPlainspokenVoiceContract,
    plainspokenParagraphRule,
    interpretiveContractFor,
    psychologicalSafetyContract: astraPsychologicalSafetyContract,
    reportVoicePlan,
    enrichedSynthesisVoicePlan,
    reportEvidenceOwnershipPlan,
    evidenceContract: astraEvidenceContract,
    editorialRoleInstruction,
    canonicalIdentityInstruction,
    relationshipContextInstruction,
    sectionSignalCardBlock
  });
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

function enrichedCoreSectionDepth(request: AstrologyReportRequest, title: string) {
  return paidReportSectionDepth[request.reportType]?.[title] ?? { minimum: 175, target: "200-275", maximum: 315 };
}

function canonicalIdentityBridgeInstruction(request: AstrologyReportRequest) {
  if (!canonicalIdentityFromRequest(request)) return "";
  return [
    "Canonical Identity bridge:",
    "- Identity is already supplied to the reader as stable chart interpretation; do not generate or summarize it.",
    "- Do not import Identity's private-reflection mechanism, its signals, or its reflection-to-expression sequence into this chapter.",
    "- If a bridge is needed, refer only to the reader's established way of working in one short sentence, then return to this chapter's own evidence."
  ].join("\n");
}

function buildDeepThesisPrompt(request: AstrologyReportRequest, cards: ReportSectionSignalCard[]) {
  return buildDeepThesisPromptFromContracts(request, cards, {
    editorialRoleInstruction,
    canonicalIdentityInstruction
  });
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
  return retryIssueFromReport(code, message);
}

function providerRetryIssue(error: unknown): ReportGenerationRetryIssue {
  return providerRetryIssueFromReport(error);
}

function reportReasoningEffortForModel(model: string) {
  return reportReasoningEffortByModel.get(model) ?? "none";
}

function retryFailure(
  attempt: number,
  issues: ReportGenerationRetryIssue[],
  latencyMs: number,
  usage: ModelUsage = {},
  finishReason?: string,
  rejectedText?: string
): ReportGenerationRetryFailure {
  return retryFailureFromReport(attempt, issues, latencyMs, usage, finishReason, rejectedText);
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
  return buildDeepSectionPromptFromContracts(input, {
    depthForTitle: (title) => deepSectionDepth[title],
    prosePlanningCards,
    cardsForRequest: (request) => buildReportSectionSignalCardsForRequest(request, reportHeadingsFor(request)),
    deepChapterFocusInstruction,
    plainspokenContract: astraPlainspokenVoiceContract,
    plainspokenParagraphRule,
    interpretiveContractFor,
    psychologicalSafetyContract: astraPsychologicalSafetyContract,
    voicePlanForSection,
    enrichedSynthesisVoicePlan,
    enrichedChapterOwnershipInstruction,
    enrichedProseBoundaryInstruction,
    reportEvidenceOwnershipPlan,
    evidenceContract: astraEvidenceContract,
    sectionSignalCardBlock
  });
}

function buildEnrichedCoreSectionPrompt(input: {
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
  previousErrors: string[];
}) {
  return buildEnrichedCoreSectionPromptFromContracts(input, {
    depthForTitle: (title) => enrichedCoreSectionDepth(input.request, title),
    canonicalIdentityBridgeInstruction,
    deepChapterFocusInstruction,
    plainspokenContract: astraPlainspokenVoiceContract,
    plainspokenParagraphRule,
    interpretiveContractFor,
    psychologicalSafetyContract: astraPsychologicalSafetyContract,
    voicePlanForSection,
    enrichedSynthesisVoicePlan,
    enrichedChapterOwnershipInstruction,
    enrichedProseBoundaryInstruction,
    reportEvidenceOwnershipPlan,
    evidenceContract: astraEvidenceContract,
    sectionSignalCardBlock
  });
}

function validateSectionedReportSection(input: {
  text: string;
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
  depth: { minimum: number; target: string; maximum: number };
}) {
  const claimAudit = auditWriterClaimMarkers(input.text, input.card);
  return [
    ...claimAudit.errors.map((message) => retryIssue("evidence_mismatch", message)),
    ...validateSectionedReportSectionFromReport({
      text: claimAudit.prose,
      request: input.request,
      title: input.card.title,
      sunSign: input.chartSignature.points.find((point) => point.body === "Sun")?.sign,
      depth: input.depth,
      forbiddenFragments: forbiddenReportFragments,
      thirdPersonSubjectLabelPattern,
      isNatalBasis: reportBasisFor(input.request).type === "natal",
      parseSection: () => deepSectionFromText(claimAudit.prose, input.request, input.card.title),
      validateUnsupportedClaims: (section) => validateUnsupportedSectionClaims({ sections: [section] } as ReportDraft, [input.card]),
      validateRelationshipAndSafetyClaims: (sections) => validateRelationshipAndSafetyClaims(input.request, sections)
    })
  ];
}

function validateDeepSection(input: {
  text: string;
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
}) {
  return validateSectionedReportSection({
    ...input,
    depth: deepSectionDepth[input.card.title] ?? { minimum: 275, target: "275-400", maximum: 435 }
  });
}

function validateEnrichedCoreSection(input: {
  text: string;
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
}) {
  return validateSectionedReportSection({
    ...input,
    depth: enrichedCoreSectionDepth(input.request, input.card.title)
  });
}

function deepSectionFromText(text: string, request: AstrologyReportRequest, title: string): AstrologyReportSection {
  return sectionFromModelText({
    text,
    request,
    title,
    parseMarkdownSections: markdownSectionsFromText,
    normalizeVoice: normalizeReportVoice,
    sectionId: sectionIdFromTitle
  });
}

async function generateValidatedDeepThesis(request: AstrologyReportRequest, cards: ReportSectionSignalCard[], writer: PromptModelWriter) {
  const result = await retryModelPart<ModelUsage, ReportGenerationRetryIssue, ReportGenerationRetryFailure, ModelWriterResponse, string>({
    initialUsage: {},
    maxAttempts: 3,
    write: (previousErrors) => writer(
      [buildDeepThesisPrompt(request, cards), ...previousErrors.map((error) => `Previous error: ${error}`)].join("\n"),
      180
    ),
    validate: (response) => validateDeepThesis(response.text),
    value: (response) => normalizeDeepThesis(response.text),
    mergeUsage: mergeModelUsage,
    providerIssues: (error) => [providerRetryIssue(error)],
    retryFailure: (attempt, issues, latencyMs, response) => response
      ? retryFailure(attempt, issues, latencyMs, response.usage, response.finishReason, response.text)
      : retryFailure(attempt, issues, latencyMs)
  });
  if (result.ok) {
    return {
      thesis: result.value,
      attemptCount: result.state.attemptCount,
      usage: result.state.usage,
      finishReason: result.finishReason,
      latencyMs: result.state.latencyMs,
      failures: result.state.failures
    };
  }
  throw new DeepPartGenerationError(
    `Governing thesis failed validation after retries: ${result.state.previousErrors.join("; ")}`,
    "Governing thesis",
    result.state
  );
}

async function generateValidatedDeepSection(input: {
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
  thesis: string;
  writer: PromptModelWriter;
}): Promise<DeepSectionGeneration> {
  const result = await retryModelPart<ModelUsage, ReportGenerationRetryIssue, ReportGenerationRetryFailure, ModelWriterResponse, AstrologyReportSection>({
    initialUsage: {},
    maxAttempts: 3,
    write: (previousErrors) => input.writer(buildDeepSectionPrompt({ ...input, previousErrors }), 1400),
    validate: (response) => validateDeepSection({ ...input, text: response.text }),
    value: (response) => deepSectionFromText(
      auditWriterClaimMarkers(response.text, input.card).prose,
      input.request,
      input.card.title
    ),
    mergeUsage: mergeModelUsage,
    providerIssues: (error) => [providerRetryIssue(error)],
    retryFailure: (attempt, issues, latencyMs, response) => response
      ? retryFailure(attempt, issues, latencyMs, response.usage, response.finishReason, response.text)
      : retryFailure(attempt, issues, latencyMs)
  });
  if (result.ok) {
    return {
      section: result.value,
      attemptCount: result.state.attemptCount,
      usage: result.state.usage,
      finishReason: result.finishReason,
      latencyMs: result.state.latencyMs,
      failures: result.state.failures
    };
  }
  throw new DeepPartGenerationError(
    `${input.card.title} failed validation after retries: ${result.state.previousErrors.join("; ")}`,
    input.card.title,
    result.state
  );
}

async function generateValidatedEnrichedCoreSection(input: {
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
  writer: PromptModelWriter;
}): Promise<DeepSectionGeneration> {
  const result = await retryModelPart<ModelUsage, ReportGenerationRetryIssue, ReportGenerationRetryFailure, ModelWriterResponse, AstrologyReportSection>({
    initialUsage: {},
    maxAttempts: 3,
    write: (previousErrors) => input.writer(buildEnrichedCoreSectionPrompt({ ...input, previousErrors }), 750),
    validate: (response) => validateEnrichedCoreSection({ ...input, text: response.text }),
    value: (response) => deepSectionFromText(
      auditWriterClaimMarkers(response.text, input.card).prose,
      input.request,
      input.card.title
    ),
    mergeUsage: mergeModelUsage,
    providerIssues: (error) => [providerRetryIssue(error)],
    retryFailure: (attempt, issues, latencyMs, response) => response
      ? retryFailure(attempt, issues, latencyMs, response.usage, response.finishReason, response.text)
      : retryFailure(attempt, issues, latencyMs)
  });
  if (result.ok) {
    return {
      section: result.value,
      attemptCount: result.state.attemptCount,
      usage: result.state.usage,
      finishReason: result.finishReason,
      latencyMs: result.state.latencyMs,
      failures: result.state.failures
    };
  }
  throw new DeepPartGenerationError(
    `${input.card.title} failed validation after retries: ${result.state.previousErrors.join("; ")}`,
    input.card.title,
    result.state
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
  const cards = prosePlanningCards(buildReportSectionSignalCardsForRequest(input.request, headings));
  const writerCards = canonicalIdentityFromRequest(input.request)
    ? cards.filter((card) => card.title !== "Identity")
    : cards;
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
  const settledSections = await mapWithConcurrencySettled(writerCards, 3, async (card) => {
    const generated = await generateValidatedDeepSection({ ...input, card, thesis: thesis.thesis, writer });
    const index = headings.indexOf(card.title);
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
  const sections = assembleReportSections(input.request, generatedSections.map((generated) => generated.section));
  const identity = sections.find((section) => section.title === "Identity")?.body ?? "";
  const draft: ReportDraft = {
    summary: summaryFromMarkdown(identity, baseline.summary ?? `${input.request.subjectName}'s Deep Report.`),
    sections,
    publicSignal: baseline.publicSignal
  };
  const finalErrors = validateModelDraft(input.request, draft);
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

function usesSectionedEnrichedCoreGeneration(request: AstrologyReportRequest) {
  if (!new Set<AstrologyReportRequest["reportType"]>(["core", "core_self", "chart_interpretation"]).has(request.reportType)) return false;
  if (!canonicalIdentityFromRequest(request)) return false;
  return prosePlanningCards(buildReportSectionSignalCardsForRequest(request, reportHeadingsFor(request))).some((card) => card.hypothesis);
}

async function generateSectionedEnrichedCoreDraft(input: ReportWriterInput, writer: PromptModelWriter) {
  const startedAt = Date.now();
  const headings = reportHeadingsFor(input.request);
  const cards = prosePlanningCards(buildReportSectionSignalCardsForRequest(input.request, headings));
  const writerCards = cards.filter((card) => card.title !== "Identity");
  const settledSections = await mapWithConcurrencySettled(writerCards, 3, async (card) => {
    const generated = await generateValidatedEnrichedCoreSection({ ...input, card, writer });
    const index = headings.indexOf(card.title);
    return {
      ...generated,
      section: {
        ...generated.section,
        id: sectionIdFromTitle(input.request.id, card.title, index),
        emphasis: card.title === "Integration" ? "practice" : "supporting"
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
    throw new SectionedCoreReportGenerationError(
      failedSections.map((result) => (result.reason as DeepPartGenerationError).message).join("; "),
      {
        attemptCount: sectionParts.reduce((total, part) => total + part.attemptCount, 0),
        usage: sectionParts.reduce((total, part) => mergeModelUsage(total, part.usage), {} as ModelUsage),
        latencyMs: Date.now() - startedAt,
        sections: sectionParts
      }
    );
  }
  const generatedSections = settledSections.map((result) => (result as PromiseFulfilledResult<DeepSectionGeneration>).value);
  const baseline = writeDeterministicCoreReport(input);
  const sections = assembleReportSections(input.request, generatedSections.map((generated) => generated.section));
  const identity = sections.find((section) => section.title === "Identity")?.body ?? "";
  const draft: ReportDraft = {
    summary: summaryFromMarkdown(identity, baseline.summary ?? `${input.request.subjectName}'s Core Report.`),
    sections,
    publicSignal: baseline.publicSignal
  };
  const finalErrors = validateModelDraft(input.request, draft);
  if (finalErrors.length) throw new Error(`Assembled Core Report failed validation: ${finalErrors.join("; ")}`);
  const usage = generatedSections.reduce((total, part) => mergeModelUsage(total, part.usage), {} as ModelUsage);
  return {
    draft,
    attemptCount: generatedSections.reduce((total, part) => total + part.attemptCount, 0),
    usage,
    latencyMs: Date.now() - startedAt,
    sections: generatedSections
  };
}

function reportHeadingsFor(request: AstrologyReportRequest): string[] {
  if (request.reportType === "identity") return [...personIdentityReportHeadings];
  if (request.reportType === "deep") return [...personDeepReportHeadings];
  if (request.reportType === "synastry") return [...synastryReportHeadings];
  if (request.reportType === "progressed") return [...progressedReportHeadings];
  return [...personCoreReportHeadings];
}

const contextGenderedPartnerPronounPattern = /\b(?:he|him|his|she|her|hers)\b/i;
// "Mutual repair" can be an analytic distinction.  Only flag language that
// actually recommends or initiates direct relationship action.
const directRelationshipActionPattern = /\b(?:confront|(?:have|start|initiate) (?:a )?direct conversation|state (?:a|the|your) boundary|make a direct request|try to repair|repair (?:the relationship|this (?:relationship|connection)))\b/i;
const safetyConditionPattern = /\b(?:when|if|where)\s+(?:(?:direct (?:conversation|engagement)|it)\s+(?:is|['’]s)\s+)?safe(?:\s+and\s+appropriate)?\b|\bsafe and appropriate\b/i;
const inventedBiographyPattern = /\b(?:you(?:'|’)ve likely lived through|you have likely lived through|probably (?:lost|cost)|cost you (?:a relationship|a job|trust|an opportunity)|has cost you (?:relationships?|jobs?|trust|opportunities)|you learned early|learned to compensate|compensate rather than heal|old,? tender spot|old(?:est)? emotional wounds?|old wound|oldest wound|never quite healed|damage is already done|not enough as you were|growing up|in (?:your )?childhood|throughout your career|in past relationships|your early home life|early[- ]home memories?|what you remember about (?:your )?home|the emotional truth of (?:a|your|the) household|a family pattern)\b/i;
const unverifiedPsychologicalHistoryPattern = /\b(?:old wound|early wound|wound from (?:childhood|the past|earlier life)|history taught you|learned (?:early|in childhood)|learned self-protection|learned to (?:hide|protect|defend|compensate)|defensive (?:reaction|pattern|strategy)|a defense you built|protection you developed|early (?:family|household|relationship) dynamics?)\b/i;
const attachmentLabelPattern = /\battachment style\b/i;
const unverifiedOtherPersonInsightPattern = /\b(?:another person(?:'s)?|other people(?:'s)?|someone(?:'s)?|a person(?:'s)?)\s+(?:wound|weak spot|pressure point|capacity|motive|mood|grief|need)\b|\b(?:see|sense|know|pick up on)\s+(?:what will change someone|a person(?:'s)? weak spot|the wound in (?:a person|someone)|someone(?:'s)? (?:mood|grief|need)|what someone else is going through|things other people have not said)\b|\b(?:tell|know|understand|see)\s+what\s+(?:another person|someone|other people)\s+(?:means?|wants?|needs?|feels?|thinks?)\b|\bbefore (?:they|someone|other people) (?:say|know)\b/i;
const unverifiedOtherPersonStatePattern = /\b(?:what|how)\s+(?:another person|someone else|they)\s+(?:want|wants|feel|feels|think|thinks|need|needs|intend|intends)\b|\b(?:another person|someone else|the other person)(?:'s|’s)\s+(?:imagination|inner life|unspoken feeling|unstated need|reaction|response)\b|\b(?:people|others|those around you)\s+(?:lean in|trust you|rely on you|look to you|experience you as|see you as)\b|\b(?:you are|you may be|you tend to be)\s+(?:often )?seen by (?:others|people) as someone who (?:knows?|understands?) what (?:they|others|people) need\b|\b(?:someone|another person|the other person)\s+(?:is|seems|appears|may be)\s+(?:holding back|withdrawing|upset|afraid|uncertain)\b|\b(?:make|leave)\s+(?:someone|people|others)\s+feel\b|\bwhat\s+(?:someone|another person|people|others)\s+(?:receive|take away|feel|think|need)\b/i;
const psychologicalLabelPattern = /\b(?:projection|avoidance|reactivity|self-sabotage|power struggle|emotional overcontrol|dissociation|trauma response)\b/i;
const categoricalBehaviorPattern = /\b(?:you act before you think|you react before you think|your first read .* usually lands right|you (?:usually|always|never) (?:know|sense|see|read|react|act|withdraw|overcommit)|most of the time it works|you trust your first read|you are (?:the kind|the type|someone) who|your instinct is to|(?:your|a) (?:steady architecture|sustained effort|perceptual sharpness|resource judgment)|recovery through activity)\b/i;
const unsupportedScenarioPattern = /\b(?:replay(?:ing)? (?:a |the )?conversation|track(?:ing)? (?:texts?|replies)|returned favors?|daily chores?|walking it off|go(?:ing)? for a walk|need (?:real )?recovery time|intuition often proves right|settled (?:young|early)|old effort|past attempts?|older material|nothing is hidden from you|you clearly have|regulate closeness now|preference for demonstrating care|being someone who is simply there)\b/i;
const statusToConditionPattern = /\b(?:less as (?:a )?crisis|more as texture|not (?:a )?crisis|healthy relationship|stable relationship|secure relationship|settled relationship|relationship is (?:healthy|stable|secure|settled))\b/i;
const stockConclusionPattern = /\b(?:the useful move(?: here)?|the fix|the task(?: worth naming)?|the risk|the practical move|the pattern worth watching)\b/i;
const unnecessaryOrbPrecisionPattern = /\b(?:orb(?:\s+of)?|close and exact|(?:aspect|trine|square|opposition|sextile|conjunction|quincunx)\s+(?:is\s+)?exact|exact\s+(?:aspect|trine|square|opposition|sextile|conjunction|quincunx)|(?:under|within|nearly|less than)\s+(?:one|\d+(?:\.\d+)?)\s+degrees?|degrees?\s+(?:apart|from exact))\b|\b(?:aspect|conjunct(?:ion)?|oppos(?:es|ition)|squar(?:e|es)|trin(?:e|es)|sextil(?:e|es)|quincunx(?:es)?)\b[^.!?]{0,160}\b(?:angular distance|tightness|closeness|exactness|intensity|precision|measurement)\b|\b(?:angular distance|tightness|closeness|exactness|precision|measurement)\b[^.!?]{0,160}\b(?:aspect|conjunct(?:ion)?|oppos(?:es|ition)|squar(?:e|es)|trin(?:e|es)|sextil(?:e|es)|quincunx(?:es)?)\b/i;
const impliedNatalActivationPattern = /\b(?:personal\s+)?activation\s+(?:means|shows|suggests).{0,80}\b(?:current|currently|now|pressing)\b|\bcurrently pressing\b|\bpressing on something close to you\b/i;
const personalActivationQualitativeOverreachPattern = /\b(?:personal activation|natal relevance)\b[\s\S]{0,300}\b(?:unpredictab(?:ility|le)|inspir(?:ation|ed)|clarif(?:y|ies|ied|ying|ication)|destabili(?:ze|zes|zed|zing|zation)|current timing|currently|right now|this season|makes? you|means? you|shows? that you|you (?:tend to|usually|always|become|act|react))\b|\b(?:unpredictab(?:ility|le)|inspir(?:ation|ed)|clarif(?:y|ies|ied|ying|ication)|destabili(?:ze|zes|zed|zing|zation))\b[\s\S]{0,220}\b(?:personal activation|natal relevance)\b/i;
const aspectChainInventionPattern = /\b(?:opposition|trine|square|sextile|conjunction|quincunx)\s+(?:links?|connects?)\s+(?:this|the|a)\s+.{0,50}\b(?:chain|rulership|dispositor)\b/i;
const rulershipAsAspectPattern = /\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\s+(?:is\s+)?disposed\s+by\s+(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\s*,?\s+(?:which\s+is\s+)?(?:an?\s+)?(?:conjunction|opposition|square|trine|sextile|quincunx)\s+aspect\b/i;
const genericDispositorChainNarrationPattern = /\bdispositor chains?\b|\b(?:rulership|dispositor)\s+(?:chain|sequence)\b|\b(?:the|this|a)\s+chain\s+(?:tracing|leading|running|ending|going)\s+(?:back\s+)?(?:to|through|from)\s+(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\b/i;
const privilegedPerceptionPattern = /\b(?:sharpens?|gives|offers|provides)\s+(?:you|your).{0,35}\b(?:read|sense)\s+(?:of|on)\s+(?:(?:hidden|social|group|unspoken)\s+){0,2}(?:undercurrents|signals|dynamics|people)\b|\b(?:sense|read|pick up on)\s+(?:(?:hidden|social|group|unspoken)\s+){1,2}(?:undercurrents|signals|dynamics)\b|\b(?:shapes?|influences?|guides?)\s+how\s+you\s+(?:read|sense)\s+(?:a\s+room|a\s+(?:friend\s+)?group|people|social\s+dynamics)\b|\bfirst impression\s+(?:can|may|might)?\s*(?:feel|seem)\s+(?:complete|convincing|certain|accurate)\b|\b(?:feeling|sense)\s+of\s+knowing\s+(?:can|may|might)?\s*(?:arrive|come)\s+(?:fast|quickly|immediately)\b/i;
const categoricalCertaintyOrChangePattern = /\b(?:feel|feels|seem|seems)\s+(?:sure|certain)\s+(?:right away|fast|immediately)\b|\b(?:conclusion|assessment|belief).{0,30}\bsettled fast\b|\b(?:change|update).{0,20}\b(?:all at once|by a real overhaul|wholesale)\b|\b(?:immediate|rapid|sudden)\s+(?:overhaul|transformation|reinvention|change)\b|\b(?:you|that part of you)\s+already\s+(?:know|knows|has learned)\s+how\b|\b(?:counterevidence|counterweight).{0,80}\b(?:shows|proves|confirms|demonstrates).{0,80}\b(?:already|reliably)\s+(?:developed|built|learned|practiced|self-correct)\b|\byou\s+(?:have|already have|have already)\s+(?:developed|built|learned)\s+(?:a )?(?:reliable )?(?:self-correction|habit|skill)\b/i;
const explicitClaimNegationPattern = /\b(?:does not|doesn't|do not|don't|is not|isn't|are not|aren't|cannot|can't|never|no proof|not evidence|not confirmation|does nothing to prove|not that|not currently)\b/i;

function hasAffirmedClaim(text: string, pattern: RegExp) {
  return text
    .split(/(?:[.!?;]|—|\bbut\b|\byet\b)+/i)
    .some((clause) => pattern.test(clause) && !explicitClaimNegationPattern.test(clause));
}

function validateRelationshipAndSafetyClaims(
  request: AstrologyReportRequest,
  sections: readonly Pick<AstrologyReportSection, "title" | "body">[]
) {
  const errors: string[] = [];
  const context = normalizedRelationshipContextFromRequest(request);
  for (const section of sections) {
    const text = section.body;
    if (attachmentLabelPattern.test(text)) errors.push(`${section.title} must not assign an attachment style.`);
    if (inventedBiographyPattern.test(text)) errors.push(`${section.title} invents reader biography from a chart tendency.`);
    if (unverifiedPsychologicalHistoryPattern.test(text)) errors.push(`${section.title} invents an old wound, defense, or psychological history.`);
    if (unverifiedOtherPersonInsightPattern.test(text)) errors.push(`${section.title} claims unverified access to another person's vulnerabilities or inner life.`);
    if (unverifiedOtherPersonStatePattern.test(text)) errors.push(`${section.title} claims unverified access to another person's thoughts, feelings, or needs.`);
    if (psychologicalLabelPattern.test(text)) errors.push(`${section.title} uses a psychological label instead of observable behavior.`);
    if (categoricalBehaviorPattern.test(text)) errors.push(`${section.title} turns an interpretive tendency into a categorical behavior claim.`);
    if (unsupportedScenarioPattern.test(text)) errors.push(`${section.title} invents a routine, recovery method, history, or categorical scenario beyond the selected evidence.`);
    if (unnecessaryOrbPrecisionPattern.test(text)) errors.push(`${section.title} adds unnecessary orb precision instead of staying with the selected interpretive evidence.`);
    if (impliedNatalActivationPattern.test(text)) errors.push(`${section.title} turns natal personal activation into unsupported current timing or pressure.`);
    if (personalActivationQualitativeOverreachPattern.test(text)) errors.push(`${section.title} turns natal personal activation into unsupported qualities, effects, timing, or behavior.`);
    if (aspectChainInventionPattern.test(text)) errors.push(`${section.title} rewrites a rulership or dispositor chain as an aspect.`);
    if (rulershipAsAspectPattern.test(text)) errors.push(`${section.title} labels a rulership or dispositor relationship as an aspect.`);
    if (genericDispositorChainNarrationPattern.test(text)) errors.push(`${section.title} narrates an unsupported generic dispositor chain.`);
    if (hasAffirmedClaim(text, privilegedPerceptionPattern)) errors.push(`${section.title} turns symbolic evidence into privileged or accurate social perception.`);
    if (categoricalCertaintyOrChangePattern.test(text)) errors.push(`${section.title} invents rapid certainty, wholesale change, or an established self-correction habit.`);
    if (section.title === "Drive" && reportDetectors.driveWorkAllocationRepetition.test(text)) {
      errors.push("Drive repeats Work's task-importance or allocation conclusion instead of owning force and pacing.");
    }
    if (!context.partnerPronouns && contextGenderedPartnerPronounPattern.test(text)) {
      errors.push(`${section.title} uses a partner gender pronoun that was not supplied.`);
    }
    const canonicalIdentityIsSupplied = section.title === "Identity" && Boolean(canonicalIdentityFromRequest(request));
    if (!canonicalIdentityIsSupplied && stockConclusionPattern.test(text)) {
      errors.push(`${section.title} uses a prohibited stock conclusion instead of its chapter-specific voice plan.`);
    }
    if (["strained", "ending"].includes(context.condition) && directRelationshipActionPattern.test(text) && !safetyConditionPattern.test(text)) {
      errors.push(`${section.title} recommends direct relationship action without saying it is conditional on safety and appropriateness.`);
    }

    if (section.title !== "Relationships" && section.title !== "Integration") continue;
    if (context.status === "partnered" && context.condition === "unspecified" && context.intention !== "repair" &&
      (/\b(?:under strain|strained relationship|working on repair|relationship is strained|repairing the relationship|things are tense|current tension)\b/i.test(text) ||
        statusToConditionPattern.test(text))) {
      errors.push(`${section.title} infers a qualitative relationship condition from partnered status.`);
    }
    if (context.status === "single" && context.intention === "unspecified" &&
      /\b(?:on your next date|your dating life|as you date|when you date|people you date|actively dating)\b/i.test(text)) {
      errors.push(`${section.title} infers dating from single status.`);
    }
    if (context.status === "separated" &&
      /\b(?:recent breakup|recently separated|still grieving|active grief|why (?:they|he|she) left|closure|unfinished ending|the breakup)\b/i.test(text)) {
      errors.push(`${section.title} infers recency, grief, cause, or closure from separated status.`);
    }
    if (context.status === "unspecified" && context.condition === "strained" && /\bpartner\b/i.test(text)) {
      errors.push(`${section.title} infers a partner from a strained condition with unspecified status.`);
    }
    if (context.structure === "other" &&
      /\b(?:non[- ]?monogam(?:y|ous)|polyam(?:ory|orous)|open relationship|multiple partners?|metamours?|relationship anarchy|flexible and undefined|outside (?:a|the) default script|unconventional structure|(?:is not|isn['’]t|not) (?:a )?fixed script|fixed script)\b/i.test(text)) {
      errors.push(`${section.title} infers a specific quality or type from structure other.`);
    }
    if (context.intention === "not_seeking" &&
      /\b(?:start dating|date again|next date|dating life|attraction filter|open yourself to romance|seek romance|stay one extra minute when someone gets close)\b/i.test(text)) {
      errors.push(`${section.title} contradicts the not-seeking intention.`);
    }
    if (context.intention === "open_to_connection" &&
      /\b(?:actively dating|as you date|your dating life|not in a defined structure|undefined structure|without a defined structure(?: in play)?)\b/i.test(text)) {
      errors.push(`${section.title} turns openness into active dating or an undefined structure.`);
    }
    if (context.intention === "recover" &&
      /\b(?:recover|repair|restore|resume|rebuild)\s+(?:the|your|this)?\s*(?:connection|relationship|bond)\b/i.test(text)) {
      errors.push(`${section.title} turns personal recovery into recovering the connection.`);
    }
  }
  return [...new Set(errors)];
}

function validateModelDraft(request: AstrologyReportRequest, draft: ReportDraft) {
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

  const paidDepthRules = isWelcomeReportRequest(request) ? undefined : paidReportSectionDepth[request.reportType];
  if (paidDepthRules) {
    for (const section of sectionWordCounts) {
      const depth = paidDepthRules[section.title];
      if (!depth) continue;
      if (section.words < depth.minimum) {
        errors.push(`${section.title} must be at least ${depth.minimum} words for the ${request.reportType} report; found ${section.words}.`);
      }
      if (section.words > depth.maximum) {
        errors.push(`${section.title} must be at most ${depth.maximum} words for the ${request.reportType} report; found ${section.words}.`);
      }
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

  errors.push(...validateUnsupportedSectionClaims(draft, sectionCards));
  errors.push(...validateRelationshipAndSafetyClaims(request, draft.sections ?? []));

  return errors;
}

function validateRawModelText(text: string) {
  return validateRawModelTextFromReport(text);
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

function allowedClaimSet(cards: ReportSectionSignalCard[]) {
  const claims = new Set<string>();
  const add = (claim: string) => {
    const normalized = normalizeClaim(claim);
    if (normalized) claims.add(normalized);
  };
  const addAspect = (left: string, aspect: string, right: string) => {
    claims.add(aspectClaimKey(left, aspect, right));
  };

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
      for (const match of text.matchAll(new RegExp(`\\b(${reportClaimBodyNames.join("|")})\\s+(${aspectClaimNames.join("|")})\\s+(?:to\\s+|with\\s+)?(${reportClaimBodyNames.join("|")})\\b`, "gi"))) {
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
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})\\s+(${aspectPattern})\\s+(?:to\\s+|with\\s+)?(${bodyPattern})\\b`, "gi"))) {
    pushClaim(`${match[1]} ${normalizeAspectClaim(match[2])} ${match[3]}`, aspectClaimKey(match[1], match[2], match[3]));
  }
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})(?:'s|’s)\\s+(${aspectPattern})\\s+(?:to\\s+|with\\s+)?(${bodyPattern})\\b`, "gi"))) {
    pushClaim(`${match[1]} ${normalizeAspectClaim(match[2])} ${match[3]}`, aspectClaimKey(match[1], match[2], match[3]));
  }
  for (const match of text.matchAll(new RegExp(`\\b(${aspectPattern})\\s+between\\s+(${bodyPattern})\\s+and\\s+(${bodyPattern})\\b`, "gi"))) {
    pushClaim(`${match[2]} ${normalizeAspectClaim(match[1])} ${match[3]}`, aspectClaimKey(match[2], match[1], match[3]));
  }
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})(?:\\s+(?:here|also)){0,2}\\s+(?:forms?|makes?|has)\\s+(?:an?\\s+)?(${aspectPattern})\\s+(?:to\\s+|with\\s+)?(${bodyPattern})(?:\\s+and\\s+(${bodyPattern}))?\\b`, "gi"))) {
    pushClaim(`${match[1]} ${normalizeAspectClaim(match[2])} ${match[3]}`, aspectClaimKey(match[1], match[2], match[3]));
    if (match[4]) {
      pushClaim(`${match[1]} ${normalizeAspectClaim(match[2])} ${match[4]}`, aspectClaimKey(match[1], match[2], match[4]));
    }
  }
  for (const match of text.matchAll(new RegExp(`\\b(${signPattern})\\s+emphasis\\b`, "gi"))) {
    pushClaim(`${titleCaseClaim(match[1])} emphasis`);
  }
  for (const match of text.matchAll(/\b(\d+)(?:st|nd|rd|th)?[-\s]+house emphasis\b/gi)) {
    pushClaim(`${compactHouseLabel(match[1])} emphasis`);
  }

  return claims;
}

function normalizedTechnicalRelation(left: string, relation: "disposed_by", right: string) {
  return `${normalizeClaim(left)} ${relation} ${normalizeClaim(right)}`;
}

function supportedTechnicalRelations(card: ReportSectionSignalCard) {
  const relations = new Set<string>();
  const bodyPattern = reportClaimBodyNames.join("|");
  for (const signal of card.chartSignals) {
    const text = signalClaimText(signal);
    for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})\\s+disposed\\s+by\\s+(${bodyPattern})\\b`, "gi"))) {
      relations.add(normalizedTechnicalRelation(match[1]!, "disposed_by", match[2]!));
    }
    for (const match of text.matchAll(new RegExp(`\\bfinal[- ]dispositor\\s*:?\\s*(${bodyPattern})\\b`, "gi"))) {
      relations.add(`final_dispositor ${normalizeClaim(match[1]!)}`);
    }
  }
  return relations;
}

function mentionedTechnicalRelations(text: string) {
  const relations: Array<{ label: string; key: string }> = [];
  const bodyPattern = reportClaimBodyNames.join("|");
  const add = (label: string, key: string) => {
    if (!relations.some((relation) => relation.key === key)) relations.push({ label, key });
  };
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})(?:'s|’s)?\\s+dispositor\\s+(?:is|connects?\\s+through|runs?\\s+through)\\s+(${bodyPattern})\\b`, "gi"))) {
    add(
      `${match[1]} disposed by ${match[2]}`,
      normalizedTechnicalRelation(match[1]!, "disposed_by", match[2]!)
    );
  }
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})\\s+(?:is\\s+)?(?:ruled|disposed)\\s+by\\s+(${bodyPattern})\\b`, "gi"))) {
    add(
      `${match[1]} disposed by ${match[2]}`,
      normalizedTechnicalRelation(match[1]!, "disposed_by", match[2]!)
    );
  }
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})\\s+rules\\s+(${bodyPattern})\\b`, "gi"))) {
    add(
      `${match[2]} disposed by ${match[1]}`,
      normalizedTechnicalRelation(match[2]!, "disposed_by", match[1]!)
    );
  }
  for (const match of text.matchAll(new RegExp(`\\b(${bodyPattern})\\s+(?:sits|stands|acts|serves|is)\\s+(?:as\\s+)?(?:the\\s+)?final\\s+dispositor\\b|\\bfinal\\s+dispositor\\s+(?:is|in)\\s+(${bodyPattern})\\b`, "gi"))) {
    const body = match[1] ?? match[2];
    if (body) add(`${body} as final dispositor`, `final_dispositor ${normalizeClaim(body)}`);
  }
  return relations;
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

function validateUnsupportedSectionClaims(draft: ReportDraft, cards: ReportSectionSignalCard[]) {
  const errors: string[] = [];
  for (const section of draft.sections ?? []) {
    const card = sectionCardForTitle(cards, section.title);
    const allowedClaims = allowedClaimSet(card ? [card] : cards);
    for (const claim of mentionedClaimLabels(section.body)) {
      if (!allowedClaims.has(claim.key)) {
        errors.push(`Unsupported astrology claim in ${section.title}: ${claim.label} is not in the selected report evidence.`);
      }
    }
    if (card) {
      const supportedRelations = supportedTechnicalRelations(card);
      for (const relation of mentionedTechnicalRelations(section.body)) {
        if (!supportedRelations.has(relation.key)) {
          errors.push(`Unsupported astrology relationship in ${section.title}: ${relation.label} is not stated in the selected chapter evidence.`);
        }
      }
      if (card.meaningComplexIds?.length && genericDispositorChainNarrationPattern.test(section.body)) {
        errors.push(`${section.title} narrates a generic dispositor chain instead of the chapter's selected human meaning.`);
      }
    }
  }
  errors.push(...validateEvidenceCompleteness(draft, cards));
  return errors;
}

function wordCount(value: string | undefined) {
  return wordCountFromReport(value);
}

function maxModelOutputTokensFor(request: AstrologyReportRequest) {
  return maxModelOutputTokensForProvider(request.reportType);
}

function reportModelTimeoutMsFor(request: AstrologyReportRequest) {
  return reportModelTimeoutMsForProvider(request.reportType, ASTRA_REPORT_MODEL_TIMEOUT_MS, ASTRA_DEEP_REPORT_MODEL_TIMEOUT_MS);
}

function mergeModelUsage(left: ModelUsage, right: ModelUsage): ModelUsage {
  return mergeProviderUsage(left, right);
}

async function parseValidatedModelDraft(input: ReportWriterInput, writer: (previousErrors?: string[]) => Promise<ModelWriterResponse>) {
  let previousErrors: string[] = [];
  let usage: ModelUsage = {};
  let latencyMs = 0;
  const failures: ReportGenerationRetryFailure[] = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await writer(previousErrors);
    usage = mergeModelUsage(usage, response.usage);
    latencyMs += response.latencyMs;
    const draft = parseModelDraft(response.text, input.request, input.chartSignature);
    const errors = [
      ...(response.finishReason === "length" ? ["Writer response reached its output limit; return a complete report within the requested scope."] : []),
      ...validateRawModelText(response.text),
      ...validateModelDraft(input.request, draft)
    ];
    if (!errors.length) return { draft, attemptCount: attempt + 1, usage, latencyMs, failures };
    failures.push(retryFailure(
      attempt + 1,
      errors.map(monolithicRetryIssue),
      response.latencyMs,
      response.usage,
      response.finishReason,
      response.text
    ));
    previousErrors = errors;
  }

  throw new MonolithicReportGenerationError(`Model draft failed validation after retries: ${previousErrors.join("; ")}`, {
    attemptCount: failures.length,
    usage,
    latencyMs,
    failures
  });
}

function monolithicRetryIssue(message: string): ReportGenerationRetryIssue {
  return monolithicRetryIssueFromReport(message);
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
  return writeOpenAIModelTextFromAdapter({
    prompt,
    model: config.reportModel,
    apiKey: config.openaiApiKey,
    maxOutputTokens,
    timeoutMs: reportModelTimeoutMsFor(request),
    fetchImpl
  });
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
  return writeOpenRouterModelTextFromAdapter({
    prompt,
    model: config.reportModel,
    apiKey: config.openRouterApiKey,
    baseUrl: config.openRouterBaseUrl,
    maxOutputTokens,
    timeoutMs: reportModelTimeoutMsFor(request),
    reasoningEffort: reportReasoningEffortForModel(config.reportModel),
    siteUrl: process.env.OPENROUTER_SITE_URL?.trim() || ASTRA_OPENROUTER_SITE_URL,
    appName: process.env.OPENROUTER_APP_NAME?.trim() || ASTRA_OPENROUTER_APP_NAME,
    fetchImpl
  });
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
  let generation: Awaited<ReturnType<typeof parseValidatedModelDraft>> | Awaited<ReturnType<typeof generateSectionedDeepDraft>> | Awaited<ReturnType<typeof generateSectionedEnrichedCoreDraft>>;
  let sectionedGeneration: Awaited<ReturnType<typeof generateSectionedDeepDraft>> | null = null;
  let sectionedCoreGeneration: Awaited<ReturnType<typeof generateSectionedEnrichedCoreDraft>> | null = null;
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
      } else if (usesSectionedEnrichedCoreGeneration(request)) {
        sectionedCoreGeneration = await generateSectionedEnrichedCoreDraft(
          writerInput,
          (prompt, maxOutputTokens) => writeOpenRouterModelText(prompt, request, maxOutputTokens, modelConfig, fetchImpl)
        );
        generation = sectionedCoreGeneration;
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
      } else if (usesSectionedEnrichedCoreGeneration(request)) {
        sectionedCoreGeneration = await generateSectionedEnrichedCoreDraft(
          writerInput,
          (prompt, maxOutputTokens) => writeOpenAIModelText(prompt, request, maxOutputTokens, modelConfig, fetchImpl)
        );
        generation = sectionedCoreGeneration;
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
        ...(config.reportModelProvider === OPENROUTER_REPORT_MODEL_PROVIDER
          ? { reasoningEffort: reportReasoningEffortForModel(config.reportModel) }
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
    if (error instanceof SectionedCoreReportGenerationError) {
      return buildReportModelCallFailedResult(request, error.message, {
        writer: DEBUG_MODEL_REPORT_WRITER,
        provider: config.reportModelProvider,
        model: config.reportModel,
        modelProfile: config.reportModelProfile,
        ...(config.reportModelProvider === OPENROUTER_REPORT_MODEL_PROVIDER
          ? { reasoningEffort: reportReasoningEffortForModel(config.reportModel) }
          : {}),
        promptVersion: ASTRA_REPORT_PROMPT_VERSION,
        attemptCount: error.generation.attemptCount,
        ...error.generation.usage,
        latencyMs: error.generation.latencyMs,
        orchestration: "sectioned-v1",
        sections: error.generation.sections.map((section) => ({
          title: section.title,
          ...partGenerationMetadata(section),
          ...(section.acceptedText ? { acceptedText: section.acceptedText } : {})
        }))
      });
    }
    if (error instanceof MonolithicReportGenerationError) {
      return buildReportModelCallFailedResult(request, error.message, {
        writer: DEBUG_MODEL_REPORT_WRITER,
        provider: config.reportModelProvider,
        model: config.reportModel,
        modelProfile: config.reportModelProfile,
        ...(config.reportModelProvider === OPENROUTER_REPORT_MODEL_PROVIDER
          ? { reasoningEffort: reportReasoningEffortForModel(config.reportModel) }
          : {}),
        promptVersion: ASTRA_REPORT_PROMPT_VERSION,
        attemptCount: error.generation.attemptCount,
        ...error.generation.usage,
        latencyMs: error.generation.latencyMs,
        orchestration: "monolithic",
        failures: error.generation.failures
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
      ...(config.reportModelProvider === OPENROUTER_REPORT_MODEL_PROVIDER
        ? { reasoningEffort: reportReasoningEffortForModel(config.reportModel) }
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
        : sectionedCoreGeneration
          ? {
              orchestration: "sectioned-v1" as const,
              sections: sectionedCoreGeneration.sections.map((section) => ({
                title: section.section.title,
                ...partGenerationMetadata(section)
              })),
              readability: reportReadabilityMetadata(draft.sections)
            }
        : {
            orchestration: "monolithic" as const,
            ...("failures" in generation && generation.failures.length ? { failures: generation.failures } : {})
          })
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
