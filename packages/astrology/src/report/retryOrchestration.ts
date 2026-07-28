export type RetryableModelResponse<TUsage> = {
  text: string;
  usage: TUsage;
  finishReason?: string;
  latencyMs: number;
};

export type RetryPartState<TUsage, TFailure, TIssue extends { message: string }> = {
  attemptCount: number;
  usage: TUsage;
  latencyMs: number;
  failures: TFailure[];
  previousErrors: string[];
  reviewNotes: TIssue[];
};

export async function retryModelPart<
  TUsage,
  TIssue extends { message: string },
  TFailure,
  TResponse extends RetryableModelResponse<TUsage>,
  TValue
>(input: {
  initialUsage: TUsage;
  maxAttempts: number;
  write: (previousErrors: string[]) => Promise<TResponse>;
  validate: (response: TResponse) => TIssue[];
  value: (response: TResponse) => TValue;
  mergeUsage: (left: TUsage, right: TUsage) => TUsage;
  providerIssues: (error: unknown) => TIssue[];
  retryFailure: (attempt: number, issues: TIssue[], latencyMs: number, response?: TResponse) => TFailure;
  retainValidationIssues?: boolean;
}): Promise<{ ok: true; value: TValue; finishReason: string | undefined; state: RetryPartState<TUsage, TFailure, TIssue> } | { ok: false; state: RetryPartState<TUsage, TFailure, TIssue> }> {
  let previousErrors: string[] = [];
  let usage = input.initialUsage;
  let latencyMs = 0;
  const failures: TFailure[] = [];

  for (let attempt = 1; attempt <= input.maxAttempts; attempt += 1) {
    let response: TResponse;
    const attemptStartedAt = Date.now();
    try {
      response = await input.write(previousErrors);
    } catch (error) {
      const failureLatencyMs = Date.now() - attemptStartedAt;
      const issues = input.providerIssues(error);
      failures.push(input.retryFailure(attempt, issues, failureLatencyMs));
      latencyMs += failureLatencyMs;
      previousErrors = issues.map((issue) => issue.message);
      continue;
    }
    usage = input.mergeUsage(usage, response.usage);
    latencyMs += response.latencyMs;
    const issues = input.validate(response);
    if (!issues.length || input.retainValidationIssues) {
      return {
        ok: true,
        value: input.value(response),
        finishReason: response.finishReason,
        state: { attemptCount: attempt, usage, latencyMs, failures, previousErrors, reviewNotes: issues }
      };
    }
    failures.push(input.retryFailure(attempt, issues, response.latencyMs, response));
    previousErrors = issues.map((issue) => issue.message);
  }

  return {
    ok: false,
    state: { attemptCount: input.maxAttempts, usage, latencyMs, failures, previousErrors, reviewNotes: [] }
  };
}
