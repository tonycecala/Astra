import type { AstrologyReportRequest } from "@astra/contracts";

import { normalizedRelationshipContextFromRequest } from "./relationshipContext";
import { reportRuleCatalog } from "./rules/catalog";

/**
 * Editorial policy is intentionally data-led and isolated from chart
 * calculation. The report engine supplies the selected evidence cards; this
 * module only turns the catalog and supplied context into stable prompt text.
 */
export type PromptPolicySignalCard = {
  title: string;
  chartSignals: Array<{ label: string }>;
  hypothesis?: string;
};

export function readerFocusInstruction(request: Pick<AstrologyReportRequest, "question" | "intent">) {
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

export function relationshipContextInstruction(request: Pick<AstrologyReportRequest, "context">) {
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
  if (!application.length) application.push("Context application: use relationship-neutral language that applies to close bonds generally.");
  return [...shared, ...application].join("\n");
}

export function editorialRoleInstruction(request: AstrologyReportRequest) {
  if (request.reportType !== "core" && request.reportType !== "core_self" && request.reportType !== "chart_interpretation" && request.reportType !== "deep") return "";
  return [
    "Editorial boundaries for the report ladder:",
    "- Identity explains the central organizing pattern; do not make it a substitute for the rest of the report.",
    "- Relationships explains connection patterns and choices; do not repeat Identity's self-definition lesson.",
    "- Growth names the enduring capacity, compensation, or pattern that must mature. It is not a whole-report summary or a generic to-do list.",
    "- Integration turns the report into two or three cross-domain operating principles. Do not re-explain Growth, repeat every chart factor, or imply present-day celestial timing."
  ].join("\n");
}

export function voicePlanForSection(title: string) {
  return reportRuleCatalog.voice.sectionClosings[title] ?? "Use a distinct, natural closing that belongs only to this chapter.";
}

export function reportVoicePlan(headings: readonly string[]) {
  return [
    "Report-level voice plan:",
    "- Give every chapter a distinct closing function. Do not reuse a move/fix/task/risk conclusion across chapters.",
    "- Avoid stock transitions such as 'The useful move,' 'The fix,' 'The task,' 'The risk,' or 'The pattern worth watching.'",
    ...headings.map((heading) => `- ${heading}: ${voicePlanForSection(heading)}`)
  ].join("\n");
}

export function enrichedSynthesisVoicePlan(cards: readonly PromptPolicySignalCard[]) {
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

export function enrichedChapterOwnershipInstruction(title: string, cards: readonly PromptPolicySignalCard[]) {
  if (!cards.some((card) => card.hypothesis)) return "";
  const instructions: Record<string, string> = {
    Identity: "Identity ownership: this is the only chapter that may explain private reflection or private processing. Keep the conclusion descriptive, not a practice sequence.",
    Work: "Work ownership: stay with allocation and contribution—what receives time, effort, skill, or visible credit. Do not use reflection, checking, private processing, or self-definition as the chapter's mechanism or conclusion.",
    Integration: "Integration ownership: stay with values and decision criteria—what to weigh, protect, choose, or decline. Do not prescribe reflection, verification, or action steps, and do not restate Work's allocation or contribution rule.",
    Drive: "Drive ownership: stay with proportion and force—how momentum finds a workable pace in the moment. Do not turn Drive into Work's task-importance, task-size, allocation, or contribution conclusion, and do not turn it into a test of whether a first impression is true.",
    Gifts: "Gifts ownership: describe a usable capacity and the contribution it can make. Do not turn ease into a warning about shallow talent, unfinished work, refinement, or verification.",
    "Blind Spots": "Blind Spots ownership: this is the only chapter that may distinguish observation from interpretation or ask the reader to check a first read before acting.",
    Growth: "Growth ownership: stay with self-updating—how a stable self-concept can take in new information. Do not repeat observation-versus-interpretation, checking a first read, or a refinement lesson."
  };
  return instructions[title] ?? "";
}

export function enrichedProseBoundaryInstruction(
  request: AstrologyReportRequest,
  title: string,
  cards: readonly PromptPolicySignalCard[]
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

export function reportEvidenceOwnershipPlan(cards: readonly PromptPolicySignalCard[]) {
  if (cards.some((card) => card.hypothesis)) {
    return [
      "Report-level evidence ownership:",
      "- Use only the atomic selected evidence in the current chapter writer packet.",
      "- Do not recover, request, or infer omitted signals or graph relationships."
    ].join("\n");
  }
  return [
    "Report-level evidence ownership:",
    "- Each chapter owns the full interpretation of its selected signals. A signal reused elsewhere may support a different consequence, but must not be reintroduced with the same aspect framing, mechanism, or conclusion.",
    ...cards.map((card) => `- ${card.title}: ${card.chartSignals.slice(0, 2).map((signal) => signal.label).join("; ") || "synthesis only"}`)
  ].join("\n");
}
