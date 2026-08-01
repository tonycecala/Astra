export type ProviderUsage = {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  estimatedSpend?: number;
};

export function nonnegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function nonnegativeInteger(value: unknown) {
  const number = nonnegativeNumber(value);
  return number === undefined ? undefined : Math.round(number);
}

function addOptionalNumbers(left: number | undefined, right: number | undefined) {
  if (left === undefined && right === undefined) return undefined;
  return (left ?? 0) + (right ?? 0);
}

export function mergeProviderUsage(left: ProviderUsage, right: ProviderUsage): ProviderUsage {
  const reasoningTokens = addOptionalNumbers(left.reasoningTokens, right.reasoningTokens);
  return {
    inputTokens: addOptionalNumbers(left.inputTokens, right.inputTokens),
    outputTokens: addOptionalNumbers(left.outputTokens, right.outputTokens),
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
    totalTokens: addOptionalNumbers(left.totalTokens, right.totalTokens),
    estimatedSpend: addOptionalNumbers(left.estimatedSpend, right.estimatedSpend)
  };
}

export function reportModelTimeoutMsFor(reportType: string, standardTimeoutMs: number, deepTimeoutMs: number) {
  // Synastry V3.1 asks the provider for a long-form portrait plus a private
  // paragraph trace, so it needs the same bounded generation window as Deep.
  return reportType === "deep" || reportType === "synastry" ? deepTimeoutMs : standardTimeoutMs;
}

export function maxModelOutputTokensFor(reportType: string) {
  if (reportType === "deep") return 8000;
  // The visible portrait is about 1,500 words, and its private paragraph-level
  // Evidence trace adds substantial structured output after the prose.
  if (reportType === "synastry") return 8000;
  if (reportType === "core" || reportType === "core_self") return 4200;
  if (reportType === "progressed") return 4200;
  return 3200;
}
