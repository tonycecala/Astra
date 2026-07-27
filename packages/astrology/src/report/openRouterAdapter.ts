import {
  extractOpenAICompatibleChatText,
  openRouterChatEndpoint,
  openRouterChatRequestBody,
  openRouterHeaders
} from "./providerResponse";
import { nonnegativeInteger, nonnegativeNumber } from "./providerUsage";

type OpenAICompatibleChatResponse = {
  choices?: Array<{
    finish_reason?: unknown;
    message?: { content?: unknown };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    completion_tokens_details?: { reasoning_tokens?: unknown };
    total_tokens?: unknown;
    cost?: unknown;
  };
};

export async function writeOpenRouterModelText(input: {
  prompt: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  maxOutputTokens: number;
  timeoutMs: number;
  reasoningEffort: string;
  siteUrl: string;
  appName: string;
  fetchImpl: typeof fetch;
}) {
  const endpoint = openRouterChatEndpoint(input.baseUrl);
  const startedAt = Date.now();
  const response = await input.fetchImpl(endpoint, {
    method: "POST",
    signal: AbortSignal.timeout(input.timeoutMs),
    headers: openRouterHeaders(input.apiKey, input.siteUrl, input.appName),
    body: JSON.stringify(openRouterChatRequestBody(input.prompt, input.model, input.maxOutputTokens, input.reasoningEffort))
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
