const MAX_RETRIES = 1;

export interface LlmConfig {
  provider: "anthropic" | "openrouter";
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface ChatCompletionInput {
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string };
  llm?: LlmConfig;
}

let globalLlmConfig: LlmConfig | undefined;

export function setGlobalLlmConfig(config: LlmConfig) {
  globalLlmConfig = config;
}

export async function chatCompletion(input: ChatCompletionInput): Promise<Record<string, unknown>> {
  const config = input.llm ?? globalLlmConfig;

  if (!config) {
    const apiKey = process.env["OPENROUTER_API_KEY"];
    if (!apiKey) throw new Error("No LLM configuration provided and OPENROUTER_API_KEY not set");
    return openRouterCompletion(input, apiKey, "https://openrouter.ai/api/v1", "~anthropic/claude-haiku-latest");
  }

  if (config.provider === "anthropic") {
    return anthropicCompletion(input, config);
  }
  return openRouterCompletion(input, config.apiKey, config.baseUrl ?? "https://openrouter.ai/api/v1", config.model);
}

async function anthropicCompletion(input: ChatCompletionInput, config: LlmConfig): Promise<Record<string, unknown>> {
  const baseUrl = (config.baseUrl ?? "https://api.anthropic.com").replace(/\/+$/, "");

  const systemMessages = input.messages.filter((m) => m.role === "system");
  const nonSystemMessages = input.messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    model: config.model,
    messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: input.maxTokens ?? 4096,
  };

  if (systemMessages.length > 0) {
    body.system = systemMessages.map((m) => m.content).join("\n\n");
  }
  if (input.temperature !== undefined) {
    body.temperature = input.temperature;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = response.headers.get("retry-after");
      const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      lastError = new Error("Rate limited (429)");
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;
      const errorMessage = (errorBody.error as Record<string, unknown>)?.message ?? response.statusText;
      throw new Error(`Anthropic ${response.status}: ${errorMessage}`);
    }

    const data = await response.json() as {
      content: { type: string; text: string }[];
      stop_reason: string;
    };

    const text = data.content?.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("Empty response from Anthropic");

    return extractJSON(text);
  }

  throw lastError ?? new Error("Max retries exceeded");
}

async function openRouterCompletion(input: ChatCompletionInput, apiKey: string, baseUrl: string, model: string): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    model,
    messages: input.messages,
  };

  if (input.temperature !== undefined) body.temperature = input.temperature;
  if (input.maxTokens !== undefined) body.max_tokens = input.maxTokens;
  if (input.responseFormat) body.response_format = input.responseFormat;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = response.headers.get("retry-after");
      const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      lastError = new Error("Rate limited (429)");
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;
      const errorMessage = (errorBody.error as Record<string, unknown>)?.message ?? response.statusText;
      throw new Error(`${response.status}: ${errorMessage}`);
    }

    const data = await response.json() as {
      choices: { message: { content: string }; finish_reason: string }[];
    };

    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from LLM");

    return extractJSON(content);
  }

  throw lastError ?? new Error("Max retries exceeded");
}

function extractJSON(raw: string): Record<string, unknown> {
  const stripped = raw.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {}

  const start = stripped.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in LLM response");

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(stripped.slice(start, i + 1)) as Record<string, unknown>;
      }
    }
  }

  throw new Error("Incomplete JSON object in LLM response");
}
