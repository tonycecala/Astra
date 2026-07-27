import type {
  ReportGenerationRetryFailure,
  ReportGenerationRetryIssue,
  ReportGenerationRetryReasonCode
} from "@astra/contracts";

export type RetryUsage = {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  estimatedSpend?: number;
};

export function retryIssue(code: ReportGenerationRetryReasonCode, message: string): ReportGenerationRetryIssue {
  return { code, message };
}

export function providerRetryIssue(error: unknown): ReportGenerationRetryIssue {
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

export function retryFailure(
  attempt: number,
  issues: ReportGenerationRetryIssue[],
  latencyMs: number,
  usage: RetryUsage = {},
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

export function monolithicRetryIssue(message: string): ReportGenerationRetryIssue {
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
