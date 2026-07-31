import {
  normalizeAllyRelationshipTag,
  type AllyRelationshipTag,
  type SynastryToneSnapshot
} from "@astra/contracts";

type ToneRule = Pick<SynastryToneSnapshot, "structuralLens" | "romanticLanguage">;

const neutralRule: ToneRule = { structuralLens: "neutral", romanticLanguage: "prohibit" };

const rules: Record<AllyRelationshipTag, ToneRule> = {
  Family: { structuralLens: "family-generic", romanticLanguage: "prohibit" },
  Mother: { structuralLens: "family-parent", romanticLanguage: "prohibit" },
  Father: { structuralLens: "family-parent", romanticLanguage: "prohibit" },
  Child: { structuralLens: "family-caregiving-child", romanticLanguage: "prohibit" },
  Lover: { structuralLens: "adult-romantic", romanticLanguage: "lead-romantic-sexual" },
  Spouse: { structuralLens: "adult-romantic", romanticLanguage: "allow-full-romantic" },
  Partner: { structuralLens: "adult-neutral-partnership", romanticLanguage: "prohibit" },
  Sibling: { structuralLens: "family-peer", romanticLanguage: "prohibit" },
  Ex: { structuralLens: "former-romantic", romanticLanguage: "allow-full-romantic" },
  Friend: { structuralLens: "friendship", romanticLanguage: "allow-adult-overtones" },
  Companion: { structuralLens: "adult-romantic", romanticLanguage: "allow-full-romantic" },
  Business: { structuralLens: "professional", romanticLanguage: "prohibit" },
  Colleague: { structuralLens: "professional", romanticLanguage: "prohibit" },
  Mentor: { structuralLens: "mentorship", romanticLanguage: "prohibit" },
  Student: { structuralLens: "mentorship", romanticLanguage: "prohibit" },
  Ancestor: { structuralLens: "ancestral-symbolic", romanticLanguage: "prohibit" },
  Guide: { structuralLens: "mentorship", romanticLanguage: "prohibit" },
  Archetype: { structuralLens: "symbolic", romanticLanguage: "prohibit" },
  "Historical Figure": { structuralLens: "observational", romanticLanguage: "prohibit" },
  Other: neutralRule,
  Client: { structuralLens: "professional", romanticLanguage: "prohibit" },
  "Public Figure": { structuralLens: "observational", romanticLanguage: "prohibit" }
};

export function synastryToneSnapshot(input: { allyId?: string; relationship?: string }): SynastryToneSnapshot {
  const authoredRelationship = input.relationship?.trim() || "Unknown";
  const normalizedTag = normalizeAllyRelationshipTag(authoredRelationship);
  return {
    policyVersion: "ally-tone-v1",
    ...(input.allyId ? { allyId: input.allyId } : {}),
    authoredRelationship,
    normalizedTag: normalizedTag ?? "unknown",
    ...(normalizedTag ? rules[normalizedTag] : neutralRule)
  };
}

export function synastryV3Headings(tone: SynastryToneSnapshot, allyName: string) {
  const family = tone.structuralLens;
  if (family === "family-generic" || family === "family-parent" || family === "family-caregiving-child" || family === "family-peer") {
    return ["Recognition", "Your Experience", `${allyName}'s Experience`, "Safety and Trust", "Care and Autonomy", "The Family Bond"];
  }
  if (family === "professional" || family === "mentorship" || family === "adult-neutral-partnership" || family === "neutral") {
    return ["Recognition", "Your Experience", `${allyName}'s Experience`, "Coordination and Communication", "Power and Boundaries", "The Working Bond"];
  }
  if (family === "symbolic" || family === "ancestral-symbolic" || family === "observational") {
    return ["Recognition", "What the Comparison Evokes", "What the Other Chart Symbolizes", "Projection and Distance", "The Interpretive Limit", "The Meaning-Making Field"];
  }
  return ["Recognition", `What ${allyName} Awakens in You`, `What You Awaken in ${allyName}`, "Desire Under Pressure", "The Hidden Bargain", "The Relationship Between You"];
}

export function synastryToneInstruction(tone: SynastryToneSnapshot) {
  if (tone.romanticLanguage === "lead-romantic-sexual") {
    return "Lead the opening with an explicitly romantic and sexual charge supported by the evidence. Never infer consent, history, exclusivity, satisfaction, or permanence.";
  }
  if (tone.romanticLanguage === "allow-full-romantic") {
    return "Romantic and sexual language is allowed only where the supplied evidence supports it. The Ally tag proves no history, consent, satisfaction, exclusivity, or outcome.";
  }
  if (tone.romanticLanguage === "allow-adult-overtones") {
    return "Keep friendship primary. Adult romantic or sexual overtones are allowed where evidence supports them, but never assert romance, consent, or a shared history.";
  }
  return "Romantic, erotic, sexual, lover, chemistry, and adult-partner framing is prohibited. Translate intensity into the structural lens without sexualizing it.";
}

export function isObservationalTone(tone: SynastryToneSnapshot) {
  return tone.structuralLens === "observational" || tone.structuralLens === "symbolic" || tone.structuralLens === "ancestral-symbolic";
}
