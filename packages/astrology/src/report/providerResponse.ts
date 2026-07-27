type OpenAIResponseShape = {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ text?: unknown; type?: string }> }>;
};

type OpenAICompatibleChatResponseShape = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

export function cleanProviderControlText(text: string) {
  return text.replace(/\s*turn_off_thought\s*$/i, "").trim();
}

export function extractOpenAIText(response: OpenAIResponseShape) {
  if (typeof response.output_text === "string" && response.output_text.trim()) return cleanProviderControlText(response.output_text);
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) return cleanProviderControlText(content.text);
    }
  }
  throw new Error("OpenAI response did not include text output.");
}

export function extractOpenAICompatibleChatText(response: OpenAICompatibleChatResponseShape) {
  for (const choice of response.choices ?? []) {
    const content = choice.message?.content;
    if (typeof content === "string" && content.trim()) return cleanProviderControlText(content);
  }
  throw new Error("OpenAI-compatible chat response did not include text output.");
}

export function openRouterChatEndpoint(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}

export function openRouterChatRequestBody(prompt: string, model: string, maxOutputTokens: number, reasoningEffort: string) {
  return {
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxOutputTokens,
    reasoning: { effort: reasoningEffort },
    temperature: 0.3
  };
}

export function openRouterHeaders(apiKey: string, siteUrl: string, appName: string) {
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
    "http-referer": siteUrl,
    "x-title": appName
  };
}
