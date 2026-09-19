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
  responseFormat?: Record<string, unknown>;
  privatePortraitRoute?: boolean;
}) {
  const endpoint = openRouterChatEndpoint(input.baseUrl);
  const startedAt = Date.now();
  const body = { ...openRouterChatRequestBody(input.prompt, input.model, input.maxOutputTokens, input.reasoningEffort), ...(input.responseFormat ? { response_format: input.responseFormat } : {}), ...(input.privatePortraitRoute ? { provider: { only: [input.model === "anthropic/claude-opus-4.8" ? "amazon-bedrock" : "amazon-bedrock/global"], allow_fallbacks: false, data_collection: "deny", zdr: true, max_price: { prompt: 5, completion: 25 } } } : {}) };
  // Newer Claude endpoints do not support a sampling-temperature override.
  if (input.privatePortraitRoute && input.model !== "anthropic/claude-sonnet-4.6") Reflect.deleteProperty(body, "temperature");
  const response = await input.fetchImpl(endpoint, {
    method: "POST",
    signal: AbortSignal.timeout(input.timeoutMs),
    headers: openRouterHeaders(input.apiKey, input.siteUrl, input.appName),
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as OpenAICompatibleChatResponse & { provider?: string; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenRouter chat completions API failed with ${response.status}.`);
  }
  if (input.privatePortraitRoute && payload.provider !== "Amazon Bedrock") throw new Error("Portrait provider provenance did not match its private route.");

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
