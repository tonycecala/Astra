import type { AstrologyReportRequest } from "@astra/contracts";

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

export function recordValue(value: unknown) {
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
