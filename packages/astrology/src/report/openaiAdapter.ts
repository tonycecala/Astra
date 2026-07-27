import { extractOpenAIText } from "./providerResponse";
import { nonnegativeInteger } from "./providerUsage";

type OpenAIResponse = {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ text?: unknown; type?: string }> }>;
  usage?: { input_tokens?: unknown; output_tokens?: unknown; total_tokens?: unknown };
};

export async function writeOpenAIModelText(input: {
  prompt: string;
  model: string;
  apiKey: string;
  maxOutputTokens: number;
  timeoutMs: number;
  fetchImpl: typeof fetch;
}) {
  const startedAt = Date.now();
  const response = await input.fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(input.timeoutMs),
    headers: { authorization: `Bearer ${input.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: input.model, input: input.prompt, max_output_tokens: input.maxOutputTokens })
  });
  const payload = (await response.json()) as OpenAIResponse & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI Responses API failed with ${response.status}.`);
  return {
    text: extractOpenAIText(payload),
    usage: {
      inputTokens: nonnegativeInteger(payload.usage?.input_tokens),
      outputTokens: nonnegativeInteger(payload.usage?.output_tokens),
      totalTokens: nonnegativeInteger(payload.usage?.total_tokens)
    },
    latencyMs: Date.now() - startedAt
  };
}
