import type { SynastryToneSnapshot } from "@astra/contracts";
import { isObservationalTone, synastryToneInstruction, synastryV3Headings } from "./allyTone";
import type { SynastryV3EvidenceRow, SynastryV3TraceRow } from "./synastryV3Validation";

export const ASTRA_SYNASTRY_V3_PROMPT_VERSION = "astra-synastry-v3-feeling-first-2026-07";

export type SynastryEvidenceJob = { title: string; evidenceBullets: Array<{ label: string; meaning: string }> };

export function buildSynastryV3EvidenceIndex(jobs: readonly SynastryEvidenceJob[]): SynastryV3EvidenceRow[] {
  const byLabel = new Map<string, SynastryV3EvidenceRow>();
  for (const job of jobs) {
    for (const bullet of job.evidenceBullets) {
      const existing = byLabel.get(bullet.label);
      if (existing) {
        if (!existing.evidenceJobs.includes(job.title)) existing.evidenceJobs.push(job.title);
        continue;
      }
      const id = `S${String(byLabel.size + 1).padStart(2, "0")}`;
      byLabel.set(bullet.label, { id, label: bullet.label, meaning: bullet.meaning, evidenceJobs: [job.title] });
    }
  }
  return [...byLabel.values()];
}

export function buildSynastryV3Prompt(input: {
  readerName: string;
  allyName: string;
  tone: SynastryToneSnapshot;
  evidenceIndex: SynastryV3EvidenceRow[];
  previousErrors?: string[];
}) {
  const headings = synastryV3Headings(input.tone, input.allyName);
  const perspective = isObservationalTone(input.tone)
    ? `Do not invent ${input.allyName}'s awareness, response, contact, endorsement, or interiority. Treat the comparison as the reader's meaning-making field.`
    : `Give ${input.allyName} an independently voiced possible interiority in every chapter, and make the relationship itself a third protagonist in every chapter. Use possibility language, never fabricated dialogue.`;
  return [
    "Write one private Astra Synastry portrait in simple, direct English.",
    `The selected reader is ${input.readerName}; address ${input.readerName} only as \"you\". The Ally is ${input.allyName}.`,
    `The authored Ally tag is ${input.tone.authoredRelationship}. It routes tone only and proves no biography, consent, history, satisfaction, exclusivity, or outcome.`,
    synastryToneInstruction(input.tone),
    perspective,
    "Write exactly six Markdown chapters in the exact order below. Target 1,500 words total; 1,350-1,650 is acceptable.",
    "Lead every paragraph with the meat: a specific feeling, desire, fear, bodily response, reversal, or hidden relational consequence. Support it lightly with one consequence, contrast, or complication.",
    "The portrait surface must contain no astrology: no planet, sign, house, aspect, orb, degree, Evidence ID, or technical chart term.",
    "Do not fabricate dialogue or concrete biography. Ban fate, destined or ancient-bond claims, containment/burden assignments, diagnoses, fixed verdicts, and claims that one person gives, carries, contributes, earns, or costs more.",
    "The packet is curated and non-exhaustive. Unlisted contacts are unknown, not absent and not evidence of unequal contribution.",
    "Return exactly two blocks and nothing else:",
    "<portrait_markdown>",
    `# ${input.readerName} + ${input.allyName}`,
    ...headings.map((heading) => `## ${heading}`),
    "</portrait_markdown>",
    "<evidence_trace_json>",
    '[{"chapter":"exact heading","evidenceIds":["S01"],"supportedFeeling":"plain description of the supported feeling"}]',
    "</evidence_trace_json>",
    "The JSON must contain exactly six rows in heading order. Use only supplied IDs. IDs and technical language belong only in the JSON trace, never in portrait Markdown.",
    "Exact chapter headings:",
    ...headings.map((heading, index) => `${index + 1}. ${heading}`),
    "Private Evidence packet:",
    JSON.stringify(input.evidenceIndex, null, 2),
    ...(input.previousErrors?.length ? ["Correct these problems from the rejected attempt:", ...input.previousErrors.map((error) => `- ${error}`)] : [])
  ].join("\n");
}

export function parseSynastryV3Response(text: string) {
  const portraitMatch = text.match(/<portrait_markdown>\s*([\s\S]*?)\s*<\/portrait_markdown>/i);
  const traceMatch = text.match(/<evidence_trace_json>\s*([\s\S]*?)\s*<\/evidence_trace_json>/i);
  if (!portraitMatch?.[1] || !traceMatch?.[1]) throw new Error("Synastry V3 response did not contain both required output blocks.");
  let trace: unknown;
  try {
    trace = JSON.parse(traceMatch[1]);
  } catch {
    throw new Error("Synastry V3 Evidence trace was not valid JSON.");
  }
  if (!Array.isArray(trace) || trace.some((row) => !isTraceRow(row))) throw new Error("Synastry V3 Evidence trace had an invalid row shape.");
  return { portrait: portraitMatch[1].trim(), trace: trace as SynastryV3TraceRow[] };
}

export function buildSynastryV3SemanticPrompt(input: { portrait: string; evidenceIndex: SynastryV3EvidenceRow[] }) {
  return [
    "Evaluate semantic support only. Do not rewrite or compare style. Decide whether representative emotional claims in the portrait are supportable possibilities from the supplied Evidence meanings.",
    "Return only JSON: {\"supportedClaims\":string[],\"unsupportedClaims\":string[],\"severity\":\"none\"|\"minor\"|\"severe\"}.",
    "Use severe only for material misrepresentation, invented fixed reality, or claims opposite to the packet; conservative preference is not severe.",
    "Portrait:", input.portrait,
    "Evidence:", JSON.stringify(input.evidenceIndex)
  ].join("\n");
}

export function parseSynastryV3SemanticResponse(text: string) {
  const candidate = text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw new Error("Semantic support response did not contain JSON.");
  const value = JSON.parse(candidate) as Record<string, unknown>;
  if (!Array.isArray(value.supportedClaims) || !Array.isArray(value.unsupportedClaims) || !new Set(["none", "minor", "severe"]).has(String(value.severity))) {
    throw new Error("Semantic support response had an invalid shape.");
  }
  return {
    supportedClaims: value.supportedClaims.filter((item): item is string => typeof item === "string"),
    unsupportedClaims: value.unsupportedClaims.filter((item): item is string => typeof item === "string"),
    severity: value.severity as "none" | "minor" | "severe"
  };
}

function isTraceRow(value: unknown): value is SynastryV3TraceRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return typeof row.chapter === "string" && Array.isArray(row.evidenceIds) && row.evidenceIds.every((id) => typeof id === "string") && typeof row.supportedFeeling === "string";
}
