import type { AstrologyReportRequest, AstrologyReportSection, ReportGenerationRetryIssue } from "@astra/contracts";
import { validateRawModelText, wordCount } from "./proseValidation";
import { retryIssue } from "./retryClassification";

type SectionDepth = { minimum: number; target: string; maximum: number };

export function validateSectionedReportSection(input: {
  text: string;
  request: AstrologyReportRequest;
  title: string;
  sunSign?: string;
  depth: SectionDepth;
  forbiddenFragments: readonly string[];
  thirdPersonSubjectLabelPattern: RegExp;
  isNatalBasis: boolean;
  parseSection: () => AstrologyReportSection;
  validateUnsupportedClaims: (section: AstrologyReportSection) => string[];
  validateRelationshipAndSafetyClaims: (sections: AstrologyReportSection[]) => string[];
}): ReportGenerationRetryIssue[] {
  const errors = validateRawModelText(input.text).map((message) => retryIssue("forbidden_fragment", message));
  let section: AstrologyReportSection;
  try {
    section = input.parseSection();
  } catch (error) {
    return [...errors, retryIssue("invalid_markdown", error instanceof Error ? error.message : "Chapter did not include valid Markdown prose.")];
  }
  if (section.title !== input.title) {
    errors.push(retryIssue("heading_mismatch", `Required heading is ## ${input.title}.`));
    return errors;
  }
  const words = wordCount(section.body);
  if (words < input.depth.minimum) errors.push(retryIssue("below_minimum", `${input.title} must be at least ${input.depth.minimum} words; found ${words}.`));
  if (words > input.depth.maximum) errors.push(retryIssue("above_maximum", `${input.title} must be at most ${input.depth.maximum} words; found ${words}.`));
  const visibleText = `${section.title}\n${section.body}`;
  for (const fragment of input.forbiddenFragments) {
    if (visibleText.toLowerCase().includes(fragment.toLowerCase())) {
      errors.push(retryIssue("forbidden_fragment", `Forbidden public fragment found: ${fragment}`));
    }
  }
  if (input.thirdPersonSubjectLabelPattern.test(visibleText)) {
    errors.push(retryIssue("third_person_subject", "Third-person subject label found; address the report subject as you or your."));
  }
  errors.push(...input.validateUnsupportedClaims(section).map((message) =>
    retryIssue(message.startsWith("Missing visible chart evidence") ? "evidence_mismatch" : "unsupported_claim", message)
  ));
  errors.push(...input.validateRelationshipAndSafetyClaims([section]).map((message) =>
    retryIssue("unsupported_claim", message)
  ));
  if (input.title === "Identity") {
    const firstThreeSentences = section.body.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
    if (input.sunSign && !new RegExp(`\\b(${input.sunSign}\\s+Sun|Sun\\s+in\\s+${input.sunSign})\\b`, "i").test(firstThreeSentences)) {
      errors.push(retryIssue("identity_opening", `Identity opening must mention ${input.sunSign} Sun or Sun in ${input.sunSign} in the first three sentences.`));
    }
  }
  if (input.isNatalBasis && /\b(currently active|currently activated|unusually active|pressing closer than usual|this (?:current )?season)\b/i.test(section.body)) {
    errors.push(retryIssue("natal_timing", "Natal chapter must not imply current timing without dated evidence."));
  }
  return errors;
}
