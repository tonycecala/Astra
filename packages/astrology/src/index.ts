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
export const ASTRA_REPORT_PROMPT_VERSION = "astra-report-writer-2026-07-semantic-synthesis-v1";
export const GEMINI_INTRO_IDENTITY_REPORT_MODEL = "google/gemini-3.5-flash";
const ASTRA_REPORT_MODEL_TIMEOUT_MS = 90_000;
const ASTRA_DEEP_REPORT_MODEL_TIMEOUT_MS = 240_000;

function isWelcomeReportRequest(request: AstrologyReportRequest) {
  const context = request.context && typeof request.context === "object" && !Array.isArray(request.context)
    ? request.context
    : undefined;
  return request.reportType === "identity" && context?.modelPilot === "gemini-intro-identity";
}

// Legacy one-dimensional situations are retained only for the unambiguous
// compatibility values. "nontraditional" was retired because it mixed
// structure with qualitative assumptions that only explicit fields can supply.
export const relationshipSituationKeys = ["single", "partnered", "strained", "separated", "unspecified"] as const;
export type RelationshipSituation = (typeof relationshipSituationKeys)[number];

const relationshipStatuses = ["single", "partnered", "separated", "unspecified"] as const;
const relationshipConditions = ["stable", "evolving", "strained", "ending", "recovering", "unspecified"] as const;
const relationshipStructures = [
  "monogamous",
  "consensually_nonmonogamous",
  "polyamorous",
  "open",
  "long_distance",
  "living_apart",
  "queerplatonic",
  "chosen_family_centered",
  "other",
  "unspecified"
] as const;
const relationshipIntentions = ["not_seeking", "open_to_connection", "dating", "deepen", "repair", "discern", "recover", "unspecified"] as const;
const relationshipRecencies = ["recent", "established", "unspecified"] as const;

export type NormalizedRelationshipContext = {
  status: (typeof relationshipStatuses)[number];
  condition: (typeof relationshipConditions)[number];
  structure: (typeof relationshipStructures)[number];
  intention: (typeof relationshipIntentions)[number];
  recency: (typeof relationshipRecencies)[number];
  partnerPronouns: string | null;
  notes: string | null;
};

const unspecifiedRelationshipContext: NormalizedRelationshipContext = {
  status: "unspecified",
  condition: "unspecified",
  structure: "unspecified",
  intention: "unspecified",
  recency: "unspecified",
  partnerPronouns: null,
  notes: null
};

function recordValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function enumValue<const T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]) {
  return typeof value === "string" && allowed.includes(value as T[number]) ? value as T[number] : fallback;
}

export function normalizedRelationshipContextFromRequest(
  request: Pick<AstrologyReportRequest, "context">
): NormalizedRelationshipContext {
  const context = recordValue(request.context);
  const relationship = recordValue(context?.relationshipContext);
  if (!relationship) return { ...unspecifiedRelationshipContext };
  return {
    status: enumValue(relationship.status, relationshipStatuses, "unspecified"),
    condition: enumValue(relationship.condition, relationshipConditions, "unspecified"),
    structure: enumValue(relationship.structure, relationshipStructures, "unspecified"),
    intention: enumValue(relationship.intention, relationshipIntentions, "unspecified"),
    recency: enumValue(relationship.recency, relationshipRecencies, "unspecified"),
    partnerPronouns: typeof relationship.partnerPronouns === "string" ? relationship.partnerPronouns.trim() || null : null,
    notes: typeof relationship.notes === "string" ? relationship.notes.trim() || null : null
  };
}

function canonicalIdentityFromRequest(request: Pick<AstrologyReportRequest, "context">) {
  const context = recordValue(request.context);
  return typeof context?.canonicalIdentity === "string" ? normalizeReportVoice(context.canonicalIdentity.trim()) : "";
}

function readerFocusInstruction(request: Pick<AstrologyReportRequest, "question" | "intent">) {
  const entries = [
    request.question ? `- Reader question: ${request.question}` : "",
    request.intent ? `- Reader intent: ${request.intent}` : ""
  ].filter(Boolean);
  if (!entries.length) return "Reader focus: none supplied. Do not invent one.";
  return [
    "Reader focus: use the supplied question and intent as editorial context.",
    ...entries,
    "Answer the focus directly where the selected evidence supports it. Do not force it into unrelated chapters or invent facts, motives, history, or outcomes."
  ].join("\n");
}

function relationshipContextInstruction(request: Pick<AstrologyReportRequest, "context">) {
  const context = normalizedRelationshipContextFromRequest(request);
  const shared = [
    "Relationship-content rules:",
    `- Supplied context only: status=${context.status}; condition=${context.condition}; structure=${context.structure}; intention=${context.intention}; recency=${context.recency}; partner pronouns=${context.partnerPronouns ?? "not supplied"}; notes=${context.notes ?? "not supplied"}.`,
    "- Treat relationship as connection broadly: romance, partnership, former partners, friendship, family, chosen family, and other close bonds can matter.",
    "- A field marked unspecified is intentionally unknown. Leave it unknown instead of completing a plausible story.",
    "- Never infer condition from status or status from condition. Status does not establish that a bond is healthy, stable, secure, settled, strained, repairing, or in crisis.",
    "- Never infer a specific structure from other, dating from single, recency or grief from separated, or gender or number of partners.",
    "- Never infer jealousy, infidelity, coercion, abuse, consent problems, control by another person, or another person's motives, thoughts, feelings, or intentions.",
    "- Do not presume the reader has a current romantic partner, wants one, is monogamous, or should preserve a connection.",
    "- Do not use astrology to tell the reader to stay, leave, reconcile, wait, diagnose another person, or claim certainty about another person's motives.",
    "- Describe the reader's choices, boundaries, needs, and observable patterns with agency. Do not frame endurance, repair, merging, or independence as inherently virtuous.",
    "- Apply context only in Relationships and, when useful, Integration. Identity must remain context-free."
  ];
  const application: string[] = [];
  if (context.status === "single") {
    application.push("Status application: discuss friendship, chosen family, intimacy, solitude, support, and possible romance without presuming dating or seeking.");
  } else if (context.status === "partnered") {
    application.push("Status application: discuss maintaining connection, autonomy, appreciation, communication, and shared rhythms without presuming health, stability, security, crisis, strain, repair, cohabitation, monogamy, or romance.");
  } else if (context.status === "separated") {
    application.push("Status application: discuss what separation can clarify without presuming recency, grief, contact, closure-seeking, cause, or the other person's motives.");
  }
  if (context.condition === "strained") {
    application.push("Condition application: discuss strain without assuming the relationship type, cause, safety, or future. Distinguish mutual repair from one-sided endurance as a question for discernment. Safety is unknown: do not recommend direct conversation, disclosure, confrontation, repair, a boundary, a request, or contact. You may state only that any future direct exchange would need to be safe, welcome, and chosen by everyone involved.");
  }
  if (context.structure === "other") {
    application.push("Structure application: the structure is user-described as other, and nothing else is known. Discuss the value of explicit expectations without calling the structure flexible, undefined, unconventional, outside a default script, or naming or implying any particular structure.");
  } else if (context.structure !== "unspecified") {
    application.push(`Structure application: the explicitly supplied structure is ${context.structure.replaceAll("_", " ")}. Do not add unsupplied terms or participants.`);
  }
  if (context.intention === "not_seeking") {
    application.push("Intention application: the reader is not seeking a relationship. Center existing bonds, support, intimacy, solitude, and self-directed life. Do not recommend dating, romantic pursuit, staying open, or remaining in closeness longer.");
  } else if (context.intention === "open_to_connection") {
    application.push("Intention application: the reader is open to connection. This describes receptivity only; it does not mean active dating, a current bond, or an undefined relationship structure.");
  } else if (context.intention === "dating") {
    application.push("Intention application: the reader is dating. Dating-specific examples are allowed, but do not infer a particular person, pace, goal, or relationship history.");
  } else if (context.intention === "deepen") {
    application.push("Intention application: the reader wants to deepen a connection. Do not translate deepening into strain, repair, cohabitation, or a specific bond type.");
  } else if (context.intention === "repair") {
    application.push("Intention application: the reader is considering repair. This does not establish the cause, severity, mutuality, safety, or desired outcome of repair.");
  } else if (context.intention === "discern") {
    application.push("Intention application: the reader is discerning. Support observation and choice without steering toward staying, leaving, repair, or distance.");
  } else if (context.intention === "recover") {
    application.push("Intention application: recovery refers to the reader's own steadiness and forward movement. Do not reinterpret it as recovering, repairing, or resuming the connection.");
  }
  if (!application.length) {
    application.push("Context application: use relationship-neutral language that applies to close bonds generally.");
  }
  return [...shared, ...application].join("\n");
}

function editorialRoleInstruction(request: AstrologyReportRequest) {
  if (request.reportType !== "core" && request.reportType !== "core_self" && request.reportType !== "chart_interpretation" && request.reportType !== "deep") return "";
  return [
    "Editorial boundaries for the report ladder:",
    "- Identity explains the central organizing pattern; do not make it a substitute for the rest of the report.",
    "- Relationships explains connection patterns and choices; do not repeat Identity's self-definition lesson.",
    "- Growth names the enduring capacity, compensation, or pattern that must mature. It is not a whole-report summary or a generic to-do list.",
    "- Integration turns the report into two or three cross-domain operating principles. Do not re-explain Growth, repeat every chart factor, or imply present-day celestial timing."
  ].join("\n");
}

const sectionVoicePlans: Record<string, string> = {
  Identity: "Close with a plain statement of what stays consistent for the reader; do not prescribe an action.",
  Emotions: "Close by naming a condition that helps feelings become usable information; do not prescribe disclosure.",
  Relationships: "Close with a bounded relational condition or question. Do not use move, fix, task, risk, or repair as the closing frame.",
  Work: "Close with a prioritization rule that protects useful effort from scattered effort.",
  Drive: "Close with a proportion or pacing principle, not a productivity assignment.",
  Gifts: "Close by naming how a usable capacity supports contribution, connection, or expression. Do not turn it into a refinement or verification warning.",
  "Blind Spots": "Close with the report's only verification question: separate observation from interpretation before acting on a first read.",
  Growth: "Close by naming how a stable self-concept can update. Do not prescribe a deadline, confrontation, or verification practice.",
  Integration: "Close with two or three operating principles stated as choices, not a small action, fix, task, risk, or weekly assignment."
};

function voicePlanForSection(title: string) {
  return sectionVoicePlans[title] ?? "Use a distinct, natural closing that belongs only to this chapter.";
}

function reportVoicePlan(headings: readonly string[]) {
  return [
    "Report-level voice plan:",
    "- Give every chapter a distinct closing function. Do not reuse a move/fix/task/risk conclusion across chapters.",
    "- Avoid stock transitions such as 'The useful move,' 'The fix,' 'The task,' 'The risk,' or 'The pattern worth watching.'",
    ...headings.map((heading) => `- ${heading}: ${voicePlanForSection(heading)}`)
  ].join("\n");
}

function enrichedSynthesisVoicePlan(cards: readonly ReportSectionSignalCard[]) {
  if (!cards.some((card) => card.hypothesis)) return "";
  return [
    "Enriched report-level voice plan:",
    "- Treat each chapter hypothesis as a different job. Coherence comes from contrast between those jobs, not from restating one report-wide lesson.",
    "- Only Integration may connect multiple life domains or name a report-wide operating principle.",
    "- Do not repeat a reflection, check, or action sequence, closing question, or practical rule from another chapter under a new heading.",
    "- Do not use stock bridge phrases such as 'Put together,' 'Taken together,' 'This suggests,' or 'The pattern points.' State the chapter's own conclusion plainly.",
    "- Do not use 'works differently,' 'this works differently,' or a similar explanatory pivot. State the distinct meaning directly.",
    "- Identity alone owns private reflection: describe how private processing shapes self-knowledge, then name the stable rhythm without prescribing action.",
    "- Work owns allocation and contribution: discuss where time, effort, skill, and visibility create value. Do not repeat private processing, reflection, checking, or self-definition there.",
    "- Integration owns values and decision criteria: name what the reader weighs, protects, or declines when choosing. Do not turn it into a reflection-check-action sequence or repeat Work's allocation rule.",
    "- Relationships names a relational condition. Drive owns proportion and force. Gifts owns a usable resource and its contribution. Blind Spots alone owns observation versus interpretation and checking a first read. Growth alone owns self-updating: how a stable self-concept can take in new information."
  ].join("\n");
}

function enrichedChapterOwnershipInstruction(title: string, cards: readonly ReportSectionSignalCard[]) {
  if (!cards.some((card) => card.hypothesis)) return "";
  const instructions: Record<string, string> = {
    Identity: "Identity ownership: this is the only chapter that may explain private reflection or private processing. Keep the conclusion descriptive, not a practice sequence.",
    Work: "Work ownership: stay with allocation and contribution—what receives time, effort, skill, or visible credit. Do not use reflection, checking, private processing, or self-definition as the chapter's mechanism or conclusion.",
    Integration: "Integration ownership: stay with values and decision criteria—what to weigh, protect, choose, or decline. Do not prescribe reflection, verification, or action steps, and do not restate Work's allocation or contribution rule.",
    Drive: "Drive ownership: stay with proportion and force—how much effort or momentum a situation calls for. Do not turn this into a test of whether a first impression is true.",
    Gifts: "Gifts ownership: describe a usable capacity and the contribution it can make. Do not turn ease into a warning about shallow talent, unfinished work, refinement, or verification.",
    "Blind Spots": "Blind Spots ownership: this is the only chapter that may distinguish observation from interpretation or ask the reader to check a first read before acting.",
    Growth: "Growth ownership: stay with self-updating—how a stable self-concept can take in new information. Do not repeat observation-versus-interpretation, checking a first read, or a refinement lesson."
  };
  return instructions[title] ?? "";
}

function enrichedProseBoundaryInstruction(
  request: AstrologyReportRequest,
  title: string,
  cards: readonly ReportSectionSignalCard[]
) {
  if (!cards.some((card) => card.hypothesis)) return "";
  if (title === "Relationships") {
    const condition = normalizedRelationshipContextFromRequest(request).condition;
    if (condition === "strained" || condition === "ending") {
      return [
        "Relationship safety boundary for this chapter:",
        "- Safety is unknown. Do not directly advise disclosure, contact, confrontation, repair, or stating a need or boundary.",
        "- If naming a possible future conversation or disclosure, explicitly qualify it with the exact words \"when safe and appropriate\" in the same sentence.",
        "- Private discernment is always available; direct engagement is not presumed."
      ].join("\n");
    }
  }
  if (title === "Gifts") {
    return [
      "Gifts calibration boundary for this chapter:",
      "- Present capacities as bounded possibilities supported by the chart, not as established biography, reputation, routine behavior, or proven effect on other people.",
      "- Use calibrated language such as may, can, could, or \"if this fits\" for human capacities.",
      "- Do not claim that the reader routinely reads rooms, steadies groups, helps things hold together, is relied upon, or produces a known response in others."
    ].join("\n");
  }
  return "";
}

function reportEvidenceOwnershipPlan(cards: readonly ReportSectionSignalCard[]) {
  return [
    "Report-level evidence ownership:",
    "- Each chapter owns the full interpretation of its selected signals. A signal reused elsewhere may support a different consequence, but must not be reintroduced with the same aspect framing, mechanism, or conclusion.",
    ...cards.map((card) => `- ${card.title}: ${card.chartSignals.slice(0, 2).map((signal) => signal.label).join("; ") || "synthesis only"}`)
  ].join("\n");
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
  }>;
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
    (seedNode.type === "RulershipPath" && seedNode.attributes.pathType === "dispositor-chain")
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
    (terminal.type === "RulershipPath" && terminal.attributes.pathType === "dispositor-chain")
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
  return cards.map((card) => {
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
  const shared = [
    `## ${card.title}`,
    "",
    "Chart signals:",
    ...card.chartSignals.map((signal) => `- ${signal.label}: ${signal.facts.join("; ")}`),
  ];
  if (card.hypothesis) {
    return [
      ...shared,
      "",
      `Primary hypothesis: ${card.hypothesis}`,
      ...(card.counterweight ? [`Counterweight: ${card.counterweight}`] : []),
      ...(card.claimBoundary ? [`Claim boundary: ${card.claimBoundary}`] : []),
      "",
      "Claim policy: selected section signals only. Treat the hypothesis as a bounded interpretation, not biography or fact."
    ].join("\n");
  }
  return [
    ...shared,
    "",
    `Capacities: ${card.capacities.join("; ") || "none listed"}`,
    `Risks: ${card.risks.join("; ") || "none listed"}`,
    `Tensions: ${card.tensions.join("; ") || "none listed"}`,
    `Developmental tasks: ${card.developmentalTasks.join("; ") || "none listed"}`,
    "",
    "Claim policy: selected section signals only."
  ].join("\n");
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
  const baseline = writeDeterministicCoreReport({ request, chartSignature });
  if (!baseline.publicSignal) {
    throw new Error("Deterministic baseline did not include a public signal.");
  }
  const canonicalIdentity = canonicalIdentityFromRequest(request);
  const writerHeadings = new Set<string>(writerHeadingsFor(request));
  const generatedSections = markdownSectionsFromText(text, request).filter((section) => writerHeadings.has(section.title));
  const sections = assembleReportSections(request, generatedSections);

  return {
    summary: summaryFromMarkdown(canonicalIdentity || text, baseline.summary ?? `${request.subjectName}'s report is grounded in the computed chart signature.`),
    sections,
    publicSignal: {
      ...baseline.publicSignal,
      provenanceSummary: `${baseline.publicSignal.provenanceSummary}, ${DEBUG_MODEL_REPORT_WRITER}`
    }
  };
}

const astraPlainspokenVoiceContract = [
  "VOICE MODE: PLAINSPOKEN",
  "Target a 6th to 7th grade reading level, aiming near grade 6.5, without dumbing down the insight.",
  "Write like a wise farmer: calm, direct, concrete, and spare. Say only what helps. Make the point clear without decoration.",
  "Use familiar words and short sentence structures. Keep necessary astrology terms, then explain them simply.",
  "Aim for 12 to 14 words per sentence on average. Keep most sentences between 8 and 16 words, and nearly all under 20.",
  "Use one main idea per sentence. Break every stacked clause into two or more clean sentences.",
  "Prefer concrete choices, actions, needs, time, work, and relationships over poetic or psychological shorthand.",
  "Do not use vague figurative phrases such as 'lose your shape,' 'hold your center,' 'blur your edges,' 'room to breathe,' 'emotional weather,' 'live wire,' 'static,' or 'fog.' Name the plain meaning instead.",
  "For example, replace 'closeness without losing your shape' with 'closeness without giving up your own plans, friends, or time.'",
  "Say what happens, what it costs, and what can change. If a simpler sentence works, use it.",
  "Sound warm and lived-in, never academic, clinical, ornate, mystical, or clever for its own sake.",
  "Keep adult psychological nuance. Plain does not mean choppy or childish.",
  "Avoid stilted therapeutic phrasing such as 'sitting with' or 'sit with.' Prefer considering, reflecting on, notice, or a plain concrete verb.",
  "Open each section with a direct second-person statement using You or Your. Vary the sentence shape across sections. Do not begin with a question or stock setup such as 'Here's the question,' 'Here is the question,' or 'This section asks.'",
  "Use words such as actually, real, really, and here's sparingly; do not turn them into a repeated voice tic.",
  "Use needed astrology terms accurately, then explain their human meaning in ordinary language."
];

const astraInterpretiveContract = [
  "Write as if the reader paid for a psychologically intelligent interpretation, not a horoscope column.",
  "Translate chart factors into specific lived experience and observable patterns.",
  "Prefer concrete psychological claims over abstract astrological description.",
  "Build each section from chart factor to human pattern to its relevant tension or cost, then offer one section-specific useful response.",
  "Include the relevant gift naturally, but do not force gift, cost, tension, and practice into a repeated checklist.",
  "End with a useful resolution that belongs to this section. It may be a practical next step, a clear fact to notice, or a plain statement of the choice or tradeoff.",
  "Avoid textbook astrology, stock spirituality, inflated certainty, generic coaching, and repeated evidence verbs.",
  "When a signal appears in multiple sections, interpret a different consequence in each life domain instead of repeating its thesis or advice."
];

function interpretiveContractFor(cards: readonly ReportSectionSignalCard[]) {
  if (!cards.some((card) => card.hypothesis)) return astraInterpretiveContract;
  return astraInterpretiveContract.map((line) => line === "Build each section from chart factor to human pattern to its relevant tension or cost, then offer one section-specific useful response."
    ? "Build each section from chart factor to human pattern. Use the curated hypothesis, counterweight, and claim boundary when supplied; do not force every chapter through a cost-and-response sequence."
    : line
  );
}

const astraPsychologicalSafetyContract = [
  "This is reflective interpretation, not diagnosis, therapy, risk assessment, or factual knowledge about another person.",
  "Frame tendencies as possibilities with words such as may, can, might, under stress, or if this fits. Use certainty only for supplied chart facts.",
  "Hedging does not make an invented scenario supported. Stay one interpretive step from the selected evidence: name a possible tendency, tension, resource, or helpful condition without inventing a routine, recovery method, reputation, social effect, decision history, or life event.",
  "Keep examples generic and conditional. Do not turn a silence, changed plan, number, limit, group mood, work response, or another person's reaction into a likely event in the reader's life.",
  "Do not turn a chart tendency into invented biography. Never claim that the reader has probably lost a relationship, job, trust, opportunity, learned a wound early, compensated for an old injury, or already lived through a specific event.",
  "Do not infer childhood, upbringing, family dynamics, household history, early-home memories, career history, or relationship history from a house, sign, aspect, or symbolic theme.",
  "Describe observable behavior instead of labeling the reader with projection, control, avoidance, reactivity, self-sabotage, power struggle, emotional overcontrol, dissociation, or trauma.",
  "Never invent a clinical condition, trauma history, attachment style or diagnosis, abuse dynamic, compulsion, unconscious motive, old wound, or another person's inner life.",
  "When using an example involving another person, use someone or a neutral description unless partner pronouns were explicitly supplied. Do not add he, she, him, her, his, or hers.",
  "Do not claim the reader can identify another person's wound, weak spot, pressure point, motive, capacity, mood, grief, need, or what will change them. Keep perception claims anchored to what the reader notices and can verify.",
  "Do not claim that intuition, a slow planet, an aspect, or a house gives an accurate first read, privileged access to undercurrents, rapid certainty, wholesale personal change, or an established habit of self-correction.",
  "Avoid categorical biography and behavior claims such as 'you act before you think,' 'you usually land right,' or 'you react first.' Use bounded possibility language unless stating a supplied chart fact.",
  "Any recommendation involving direct conversation, disclosure, confrontation, boundaries, or repair must be conditional on it being safe and appropriate.",
  "Do not imply that the reader must repair every relationship, that endurance is virtuous, or that astrology can decide whether a relationship continues.",
  "Keep the report balanced: substantial resources and capacities, specific tensions, and proportionate applications. Gifts must not read like a disguised Blind Spots chapter.",
  "Do not diminish the reader with phrases such as party trick, impressive but thin, charm stays shallow, applause before depth, or similar contemptuous formulations.",
  "Avoid a visible rhetorical template. Across the report, use 'That's not a flaw,' 'The useful move,' 'The fix isn't,' and 'The task isn't' no more than once each, and avoid repeated not-X-but-Y constructions."
];

const astraEvidenceContract = [
  "Treat the selected section signal cards as the complete factual boundary for the prose.",
  "Mention only placements, houses, aspects, chart themes, and timing activations present in the relevant section card.",
  "Use only the relationships explicitly stated in the card. Do not extend a rulership chain, configuration, dispositor sequence, aspect geometry, or house meaning beyond those stated facts.",
  "Personal activation means natal relevance only. It never means current pressure, current activation, a present event, or unusual timing.",
  "Do not narrate a generic dispositor chain. If a direct rulership or final dispositor is essential, state only the exact relationship present in this chapter card.",
  "Counterevidence qualifies the primary hypothesis. Do not convert it into proof that the reader already has a skill, habit, accurate instinct, or corrective practice.",
  "State selected aspects plainly. Do not state or discuss orb measurements, angular distance, tightness, closeness, exactness, intensity, or precision, even as a disclaimer.",
  "Do not invent, infer, or import additional astrology facts, even when they would be plausible.",
  "Do not include provider, model, prompt version, cached status, debug labels, or generation metadata in customer-facing prose."
];

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
  if (isWelcomeReportRequest(request)) {
    return "Write the Identity section in exactly 3 short paragraphs. Give each paragraph one coherent move; do not deliver it as one wall of text.";
  }
  return `Write each ${unit} in 2 or 3 paragraphs. Give each paragraph one coherent move; do not deliver it as one wall of text.`;
}

function familyDepthRules(request: AstrologyReportRequest) {
  if (isWelcomeReportRequest(request)) {
    return [
      "Welcome Report depth rules:",
      "- Write 250-350 words total.",
      "- Open with a clear, warm orientation to the reader's central pattern.",
      "- End with one grounded next move."
    ].join("\n");
  }
  if (request.reportType === "deep") {
    return [
      "Deep Report depth rules:",
      "- Identity should be 400-500 words.",
      "- Do not undershoot the Identity minimum; 350 words is a hard floor.",
      "- Emotions, Relationships, and Work should each be 300-425 words.",
      "- Drive, Gifts, Blind Spots, and Growth should each be 275-400 words.",
      "- Integration should be 225-325 words.",
      "- The complete Deep Report should be at least 2,625 words across its nine chapters.",
      "- Identity must feel expanded beyond an Identity Report.",
      "- Include fuller synthesis, chart ruler when relevant, and major identity aspects from the Identity card.",
      "- Give each section its own governing question and section-specific secondary signal.",
      "- Identity must not carry the report alone. The remaining eight sections must sustain premium interpretive depth."
    ].join("\n");
  }
  const rules = paidReportSectionDepth[request.reportType];
  if (!rules) return "Keep the report complete, specific, and readable for the selected report type.";
  const family = request.reportType === "identity" ? "Identity" : request.reportType === "progressed" ? "Progressed" : request.reportType === "synastry" ? "Synastry" : "Core";
  return [
    `${family} Report depth rules:`,
    ...Object.entries(rules).map(([section, depth]) => `- ${section}: target ${depth.target} words; remain between ${depth.minimum} and ${depth.maximum} words.`),
    request.reportType === "core" || request.reportType === "core_self" || request.reportType === "chart_interpretation"
      ? "- Core earns its value through four distinct chapters, not by turning Identity into a second report."
      : ""
  ].filter(Boolean).join("\n");
}

function buildDebugModelPrompt(request: AstrologyReportRequest, chartSignature: ChartSignature, previousErrors: string[] = []) {
  const basis = reportBasisFor(request);
  const headings = reportHeadingsFor(request);
  const writerHeadings = writerHeadingsFor(request);
  const sectionCards = buildReportSectionSignalCardsForRequest(request, headings);
  const hasEnrichedSynthesis = sectionCards.some((card) => card.hypothesis);
  const requiredHeadings = writerHeadings.map((heading) => `## ${heading}`).join("\n");
  const sunPlacement = chartSignature.points.find((point) => point.body === "Sun");
  return [
    "You are writing an astrology reading from structured notes.",
    "The notes are not prose.",
    "Use the notes the way a human writer uses notes: understand them, synthesize them, then write fresh second-person prose.",
    hasEnrichedSynthesis
      ? "Use the supplied chapter hypotheses as the report plan. Do not invent a second governing thesis or make every chapter a variation of one lesson."
      : "Before writing, infer one report-level governing thesis from the repeated signals, strongest placements, tensions, and developmental tasks.",
    hasEnrichedSynthesis ? "Keep the chapters coherent through their distinct roles, not through a repeated sequence or conclusion." : "Do not print that thesis as a separate heading. Let it quietly organize every section.",
    basis.type === "progressed"
      ? `This is a secondary progressed report as of ${basis.asOfDate}. Interpret progressed placements and progressed-to-natal contacts, not generic natal traits.`
      : basis.type === "synastry"
        ? `This is a two-chart synastry report${basis.partner ? ` comparing ${basis.primary.subjectName} with ${basis.partner.subjectName}` : ""}. Interpret cross-chart contacts, not either person as a standalone natal profile.`
        : "This is a natal person report.",
    "Do not repeat note labels as public labels.",
    "Do not say capacity, risk, developmental task, language domain, primary strain, or priority note in public prose.",
    chartSignature.calculationMode === "signs-aspects-only"
      ? "This is a signs-and-aspects-only chart. Do not mention houses, Rising, Ascendant, Midheaven, angles, or house-system effects."
      : "Treat Zodiac and Houses as calculation inputs: the prose must reflect the resulting signs, house placements, and evidence, not merely name the selected settings.",
    "Do not write JSON.",
    "Write plain Markdown only.",
    "",
    `Write the generated chapters of a plain Markdown Astra report for ${request.subjectName}.`,
    `Selected report depth: ${request.reportType}.`,
    familyDepthRules(request),
    "",
    "Required structure:",
    `# Astra Report - ${request.subjectName}`,
    requiredHeadings,
    "",
    "Use the required headings exactly as written.",
    canonicalIdentityFromRequest(request) ? "Do not write Identity. The application inserts the canonical Identity section after generation." : "",
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
    ...interpretiveContractFor(sectionCards),
    ...astraPsychologicalSafetyContract,
    reportVoicePlan(headings),
    enrichedSynthesisVoicePlan(sectionCards),
    reportEvidenceOwnershipPlan(sectionCards),
    '- Avoid generic phrases such as "you are a natural communicator," "this aspect gifts you," "you may struggle," or "this placement indicates" unless rewritten into more specific language.',
    "Speak directly to the reader using you and your. Never describe the report subject as a case or third-person label.",
    "Keep second-person grammar clean: write you want, you understand, you adapt, and you believe; never write you wants, you understands, you adapts, or you believes.",
    "",
    ...astraEvidenceContract,
    hasEnrichedSynthesis
      ? "Make the sections feel like chapters of one chart by giving each its own consequence. Do not re-teach Identity's private reflection in Work or Integration."
      : "Make the sections feel like chapters of one chart, not isolated mini-readings. Each section should deepen or complicate the governing thesis.",
    writerHeadings.includes("Identity") ? "Identity opening rule: begin Identity from the Sun placement unless the Identity card has no Sun signal. The first or second sentence must include the exact phrase '[Sign] Sun' or 'Sun in [Sign]' using the Sun sign from the Identity card. Include Sun house or house-system nuance when present, then integrate Mercury/Sun relationship, chart ruler or Ascendant, and dominant identity aspects or themes. Do not make the Sun generic or treat it as standalone Sun-sign astrology." : "",
    basis.type === "natal"
      ? "Integration must synthesize enduring natal patterns into a practical way of working with the chart. It is not a forecast and must not claim a transit, progression, season, or unusual current activation."
      : "Use timing language only from the supplied dated evidence.",
    basis.type === "natal"
      ? "Across every natal section, avoid forecast language such as this season, current activation, currently active, or unusually active. Present-day practical language is welcome; invented celestial timing is not."
      : "",
    editorialRoleInstruction(request),
    canonicalIdentityInstruction(request),
    headings.join("\n").includes("Relationships") || basis.type === "synastry" ? relationshipContextInstruction(request) : "",
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
  const hasEnrichedSynthesis = cards.some((card) => card.hypothesis);
  return [
    "You are planning one premium astrology report from structured section notes.",
    "Return one private governing thesis. Aim for 35-75 words and never exceed 90 words. Use plain prose with no heading, bullets, JSON, or metadata.",
    "This thesis is an internal writing compass, not customer-facing copy.",
    hasEnrichedSynthesis
      ? "Name a light connective thread without reducing the chapters to one repeated mechanism, reflection-check-action sequence, or practical rule."
      : "Name the central human tension that can organize all nine chapters without reducing them to one repeated lesson.",
    "Plan at least three dimensions: a central identity pattern, a relational or agency pattern, and a stabilizing resource or developmental capacity.",
    "Assign each major aspect one primary chapter and at most one brief secondary reference. A secondary reference must extend, not restate, its primary interpretation.",
    "Deep must add breadth: nourishment, belonging, joy, meaning, creativity, thriving conditions, decision-making, or contribution must receive real space alongside tension.",
    "Do not mention planets, signs, houses, aspects, astrology, chart factors, or timing claims.",
    `Subject: ${request.subjectName}`,
    editorialRoleInstruction(request),
    canonicalIdentityInstruction(request),
    "Section planning notes:",
    ...cards.map((card) => card.hypothesis
      ? `- ${card.title}: hypothesis ${card.hypothesis}${card.counterweight ? `; counterweight ${card.counterweight}` : ""}${card.claimBoundary ? `; boundary ${card.claimBoundary}` : ""}.`
      : `- ${card.title}: capacities ${card.capacities.join(", ")}; risks ${card.risks.join(", ")}; tension ${card.tensions.join(", ")}; task ${card.developmentalTasks.join(", ")}.`)
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
  const reportCards = prosePlanningCards(buildReportSectionSignalCardsForRequest(request, reportHeadingsFor(request)));
  return [
    "You are writing one chapter of a premium Astra Deep Report from structured notes.",
    "Write only this chapter's body as plain Markdown. Astra supplies the chapter heading. Do not write any heading, other chapter, report title, evidence block, metadata, JSON, or planning commentary.",
    `Chapter: ${card.title}.`,
    `Target length: ${depth?.target ?? "275-400"} words. Hard minimum: ${depth?.minimum ?? 275}. Hard maximum: ${depth?.maximum ?? 435}.`,
    `Subject: ${request.subjectName}`,
    chartSignature.calculationMode === "signs-aspects-only"
      ? `Zodiac: ${chartSignature.zodiacMode}. Chart detail: signs and aspects only; do not mention houses, Rising, Ascendant, Midheaven, or angles.`
      : `Zodiac: ${chartSignature.zodiacMode}. Houses: ${chartSignature.houseSystem}.`,
    card.hypothesis ? `Chapter-specific synthesis: ${card.hypothesis}` : `Private governing thesis: ${thesis}`,
    card.hypothesis ? "Develop this chapter's synthesis without importing another chapter's conclusion. Use the report thesis only as background, not as a repeated frame." : "Use the thesis as a quiet through-line, not as a sentence to repeat.",
    card.hypothesis && card.counterweight ? `Counterweight to preserve: ${card.counterweight}` : "",
    card.hypothesis && card.claimBoundary ? `Claim boundary: ${card.claimBoundary}` : "",
    card.hypothesis ? "Give this chapter its own consequence or condition; do not force it into a move, fix, risk, or task conclusion." : `This chapter must answer, rather than quote or announce, this distinct governing question: ${card.tensions.join("; ")}.`,
    deepChapterFocusInstruction(request, card.title),
    ...astraPlainspokenVoiceContract,
    plainspokenParagraphRule(request, "chapter"),
    ...interpretiveContractFor([card]),
    ...astraPsychologicalSafetyContract,
    `Chapter voice plan: ${voicePlanForSection(card.title)}`,
    enrichedSynthesisVoicePlan(reportCards),
    enrichedChapterOwnershipInstruction(card.title, reportCards),
    enrichedProseBoundaryInstruction(request, card.title, reportCards),
    reportEvidenceOwnershipPlan([card]),
    ...astraEvidenceContract,
    "Use at least two selected signals when available, including a section-specific secondary signal.",
    "Do not generalize this chapter into the whole report and do not repeat a generic warning or practice from another life domain.",
    "Do not invent transits, progressions, current activation, or seasonal timing.",
    card.title === "Identity" && sunPlacement
      ? `The first three sentences must include "${sunPlacement.sign} Sun" or "Sun in ${sunPlacement.sign}"${chartSignature.calculationMode === "signs-aspects-only" ? "." : " and integrate its house context."}`
      : "",
    card.title === "Integration"
      ? "Synthesize enduring natal patterns into two or three cross-domain operating principles. This is not a second Growth chapter and not a forecast, and must not claim that anything is newly or currently activated."
      : "",
    "Section signal card:",
    sectionSignalCardBlock(card),
    previousErrors.length ? "The previous version of this chapter failed. Rewrite only this chapter and correct every issue:" : "",
    ...previousErrors.map((error) => `- ${error}`)
  ].filter(Boolean).join("\n");
}

function buildEnrichedCoreSectionPrompt(input: {
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
  previousErrors: string[];
}) {
  const { request, chartSignature, card, previousErrors } = input;
  const depth = enrichedCoreSectionDepth(request, card.title);
  return [
    "You are writing one chapter of an Astra Core Report from a single structured section card.",
    "Write only this chapter's body as plain Markdown. Astra supplies the heading. Do not write any heading, other chapter, report title, evidence block, metadata, JSON, or planning commentary.",
    `Chapter: ${card.title}.`,
    `Target length: ${depth.target} words. Hard minimum: ${depth.minimum}. Hard maximum: ${depth.maximum}.`,
    `Subject: ${request.subjectName}`,
    chartSignature.calculationMode === "signs-aspects-only"
      ? `Zodiac: ${chartSignature.zodiacMode}. Chart detail: signs and aspects only; do not mention houses, Rising, Ascendant, Midheaven, or angles.`
      : `Zodiac: ${chartSignature.zodiacMode}. Houses: ${chartSignature.houseSystem}.`,
    `Chapter-specific synthesis: ${card.hypothesis ?? card.tensions.join("; ")}`,
    card.counterweight ? `Counterweight to preserve: ${card.counterweight}` : "",
    card.claimBoundary ? `Claim boundary: ${card.claimBoundary}` : "",
    "Develop only this chapter's consequence. Do not introduce or summarize another chapter's mechanism, rule, or conclusion.",
    canonicalIdentityBridgeInstruction(request),
    deepChapterFocusInstruction(request, card.title),
    ...astraPlainspokenVoiceContract,
    plainspokenParagraphRule(request, "chapter"),
    ...interpretiveContractFor([card]),
    ...astraPsychologicalSafetyContract,
    `Chapter voice plan: ${voicePlanForSection(card.title)}`,
    enrichedSynthesisVoicePlan([card]),
    enrichedChapterOwnershipInstruction(card.title, [card]),
    enrichedProseBoundaryInstruction(request, card.title, [card]),
    reportEvidenceOwnershipPlan([card]),
    ...astraEvidenceContract,
    "Use at least two selected signals when available, including a section-specific secondary signal.",
    "Do not invent transits, progressions, current activation, seasonal timing, biography, or another person's inner state.",
    card.title === "Integration"
      ? "Integration editorial job: state values and decision criteria across domains. Do not re-teach Identity or repeat Work's allocation rule."
      : "",
    "Section signal card:",
    sectionSignalCardBlock(card),
    previousErrors.length ? "The previous version of this chapter failed. Rewrite only this chapter and correct every issue:" : "",
    ...previousErrors.map((error) => `- ${error}`)
  ].filter(Boolean).join("\n");
}

function validateSectionedReportSection(input: {
  text: string;
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
  depth: { minimum: number; target: string; maximum: number };
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
  const depth = input.depth;
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
  errors.push(...validateUnsupportedSectionClaims({ sections: [section] } as ReportDraft, [input.card]).map((message) =>
    retryIssue(message.startsWith("Missing visible chart evidence") ? "evidence_mismatch" : "unsupported_claim", message)
  ));
  errors.push(...validateRelationshipAndSafetyClaims(input.request, [section]).map((message) =>
    retryIssue("unsupported_claim", message)
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
  if (/^##\s+/m.test(text)) {
    const sections = markdownSectionsFromText(text, request);
    if (sections.length !== 1) throw new Error(`Expected one chapter, found ${sections.length}.`);
    return sections[0]!;
  }
  const body = normalizeReportVoice(
    text
      .replace(/^#\s+.+$/gm, "")
      .replace(/\*\*Chart Evidence\*\*[\s\S]*$/i, "")
      .replace(/^[-*]\s+/gm, "")
      .trim()
  );
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

async function generateValidatedEnrichedCoreSection(input: {
  request: AstrologyReportRequest;
  chartSignature: ChartSignature;
  card: ReportSectionSignalCard;
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
      response = await input.writer(buildEnrichedCoreSectionPrompt({ ...input, previousErrors }), 750);
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
    const errors = validateEnrichedCoreSection({ ...input, text: response.text });
    if (!errors.length) {
      return {
        section: deepSectionFromText(response.text, input.request, input.card.title),
        attemptCount: attempt,
        usage,
        finishReason: response.finishReason,
        latencyMs,
        failures
      };
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
const inventedBiographyPattern = /\b(?:you(?:'|’)ve likely lived through|you have likely lived through|probably (?:lost|cost)|cost you (?:a relationship|a job|trust|an opportunity)|has cost you (?:relationships?|jobs?|trust|opportunities)|you learned early|learned to compensate|compensate rather than heal|old,? tender spot|oldest wound|never quite healed|damage is already done|not enough as you were|growing up|in (?:your )?childhood|throughout your career|in past relationships|your early home life|early[- ]home memories?|what you remember about (?:your )?home|the emotional truth of (?:a|your|the) household|a family pattern)\b/i;
const unverifiedPsychologicalHistoryPattern = /\b(?:old wound|early wound|wound from (?:childhood|the past|earlier life)|history taught you|learned (?:early|in childhood)|learned self-protection|learned to (?:hide|protect|defend|compensate)|defensive (?:reaction|pattern|strategy)|a defense you built|protection you developed|early (?:family|household|relationship) dynamics?)\b/i;
const attachmentLabelPattern = /\battachment style\b/i;
const unverifiedOtherPersonInsightPattern = /\b(?:another person(?:'s)?|other people(?:'s)?|someone(?:'s)?|a person(?:'s)?)\s+(?:wound|weak spot|pressure point|capacity|motive|mood|grief|need)\b|\b(?:see|sense|know|pick up on)\s+(?:what will change someone|a person(?:'s)? weak spot|the wound in (?:a person|someone)|someone(?:'s)? (?:mood|grief|need)|what someone else is going through|things other people have not said)\b|\bbefore (?:they|someone|other people) (?:say|know)\b/i;
const unverifiedOtherPersonStatePattern = /\b(?:what|how)\s+(?:another person|someone else|they)\s+(?:want|wants|feel|feels|think|thinks|need|needs|intend|intends)\b|\b(?:another person|someone else|the other person)(?:'s|’s)\s+(?:imagination|inner life|unspoken feeling|unstated need|reaction|response)\b|\b(?:people|others|those around you)\s+(?:lean in|trust you|rely on you|look to you|experience you as|see you as)\b|\b(?:someone|another person|the other person)\s+(?:is|seems|appears|may be)\s+(?:holding back|withdrawing|upset|afraid|uncertain)\b|\b(?:make|leave)\s+(?:someone|people|others)\s+feel\b|\bwhat\s+(?:someone|another person|people|others)\s+(?:receive|take away|feel|think|need)\b/i;
const psychologicalLabelPattern = /\b(?:projection|avoidance|reactivity|self-sabotage|power struggle|emotional overcontrol|dissociation|trauma response)\b/i;
const categoricalBehaviorPattern = /\b(?:you act before you think|you react before you think|your first read .* usually lands right|you (?:usually|always|never) (?:know|sense|see|read|react|act|withdraw|overcommit)|most of the time it works|you trust your first read|you are (?:the kind|the type|someone) who|your instinct is to)\b/i;
const unsupportedScenarioPattern = /\b(?:replay(?:ing)? (?:a |the )?conversation|track(?:ing)? (?:texts?|replies)|returned favors?|daily chores?|walking it off|go(?:ing)? for a walk|need (?:real )?recovery time|intuition often proves right|settled (?:young|early)|old effort|past attempts?|older material|nothing is hidden from you|you clearly have)\b/i;
const statusToConditionPattern = /\b(?:less as (?:a )?crisis|more as texture|not (?:a )?crisis|healthy relationship|stable relationship|secure relationship|settled relationship|relationship is (?:healthy|stable|secure|settled))\b/i;
const stockConclusionPattern = /\b(?:the useful move(?: here)?|the fix|the task(?: worth naming)?|the risk|the practical move|the pattern worth watching)\b/i;
const unnecessaryOrbPrecisionPattern = /\b(?:orb(?:\s+of)?|close and exact|(?:aspect|trine|square|opposition|sextile|conjunction|quincunx)\s+(?:is\s+)?exact|exact\s+(?:aspect|trine|square|opposition|sextile|conjunction|quincunx)|(?:under|within|nearly|less than)\s+(?:one|\d+(?:\.\d+)?)\s+degrees?|degrees?\s+(?:apart|from exact))\b|\b(?:aspect|conjunct(?:ion)?|oppos(?:es|ition)|squar(?:e|es)|trin(?:e|es)|sextil(?:e|es)|quincunx(?:es)?)\b[^.!?]{0,160}\b(?:angular distance|tightness|closeness|exactness|intensity|precision|measurement)\b|\b(?:angular distance|tightness|closeness|exactness|precision|measurement)\b[^.!?]{0,160}\b(?:aspect|conjunct(?:ion)?|oppos(?:es|ition)|squar(?:e|es)|trin(?:e|es)|sextil(?:e|es)|quincunx(?:es)?)\b/i;
const impliedNatalActivationPattern = /\b(?:personal\s+)?activation\s+(?:means|shows|suggests).{0,80}\b(?:current|currently|now|pressing)\b|\bcurrently pressing\b|\bpressing on something close to you\b/i;
const personalActivationQualitativeOverreachPattern = /\b(?:personal activation|natal relevance)\b[\s\S]{0,300}\b(?:unpredictab(?:ility|le)|inspir(?:ation|ed)|clarif(?:y|ies|ied|ying|ication)|destabili(?:ze|zes|zed|zing|zation)|current timing|currently|right now|this season|makes? you|means? you|shows? that you|you (?:tend to|usually|always|become|act|react))\b|\b(?:unpredictab(?:ility|le)|inspir(?:ation|ed)|clarif(?:y|ies|ied|ying|ication)|destabili(?:ze|zes|zed|zing|zation))\b[\s\S]{0,220}\b(?:personal activation|natal relevance)\b/i;
const aspectChainInventionPattern = /\b(?:opposition|trine|square|sextile|conjunction|quincunx)\s+(?:links?|connects?)\s+(?:this|the|a)\s+.{0,50}\b(?:chain|rulership|dispositor)\b/i;
const rulershipAsAspectPattern = /\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\s+(?:is\s+)?disposed\s+by\s+(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\s*,?\s+(?:which\s+is\s+)?(?:an?\s+)?(?:conjunction|opposition|square|trine|sextile|quincunx)\s+aspect\b/i;
const genericDispositorChainNarrationPattern = /\bdispositor chains?\b|\b(?:rulership|dispositor)\s+(?:chain|sequence)\b|\b(?:the|this|a)\s+chain\s+(?:tracing|leading|running|ending|going)\s+(?:back\s+)?(?:to|through|from)\s+(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\b/i;
const privilegedPerceptionPattern = /\b(?:sharpens?|gives|offers|provides)\s+(?:you|your).{0,35}\b(?:read|sense)\s+(?:of|on)\s+(?:(?:hidden|social|group|unspoken)\s+){0,2}(?:undercurrents|signals|dynamics|people)\b|\b(?:sense|read|pick up on)\s+(?:(?:hidden|social|group|unspoken)\s+){1,2}(?:undercurrents|signals|dynamics)\b|\b(?:shapes?|influences?|guides?)\s+how\s+you\s+(?:read|sense)\s+(?:a\s+room|a\s+(?:friend\s+)?group|people|social\s+dynamics)\b|\bfirst impression\s+(?:can|may|might)?\s*(?:feel|seem)\s+(?:complete|convincing|certain|accurate)\b|\b(?:feeling|sense)\s+of\s+knowing\s+(?:can|may|might)?\s*(?:arrive|come)\s+(?:fast|quickly|immediately)\b/i;
const categoricalCertaintyOrChangePattern = /\b(?:feel|feels|seem|seems)\s+(?:sure|certain)\s+(?:right away|fast|immediately)\b|\b(?:conclusion|assessment|belief).{0,30}\bsettled fast\b|\b(?:change|update).{0,20}\b(?:all at once|by a real overhaul|wholesale)\b|\b(?:you|that part of you)\s+already\s+(?:know|knows|has learned)\s+how\b/i;
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
  if (/output limit|at most/i.test(message)) return retryIssue("above_maximum", message);
  if (/at least/i.test(message)) return retryIssue("below_minimum", message);
  if (/Missing required heading|Expected \d+ report sections/i.test(message)) return retryIssue("chapter_count", message);
  if (/Third-person subject/i.test(message)) return retryIssue("third_person_subject", message);
  if (/Unsupported astrology claim/i.test(message)) return retryIssue("unsupported_claim", message);
  if (/Missing visible chart evidence/i.test(message)) return retryIssue("evidence_mismatch", message);
  if (/Natal reports must not imply current timing/i.test(message)) return retryIssue("natal_timing", message);
  if (/Forbidden public fragment/i.test(message)) return retryIssue("forbidden_fragment", message);
  return retryIssue("invalid_markdown", message);
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
      "http-referer": process.env.OPENROUTER_SITE_URL?.trim() || ASTRA_OPENROUTER_SITE_URL,
      "x-title": process.env.OPENROUTER_APP_NAME?.trim() || ASTRA_OPENROUTER_APP_NAME
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
      reasoning: { effort: reportReasoningEffortForModel(config.reportModel) },
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
