const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "anthropic/claude-haiku-latest";
const MAX_RETRIES = 1;

export interface ChatCompletionInput {
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string };
}

export async function chatCompletion(input: ChatCompletionInput): Promise<Record<string, unknown>> {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    messages: input.messages,
  };

  if (input.temperature !== undefined) {
    body.temperature = input.temperature;
  }
  if (input.maxTokens !== undefined) {
    body.max_tokens = input.maxTokens;
  }
  if (input.responseFormat) {
    body.response_format = input.responseFormat;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
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
      lastError = new Error(`Rate limited (429)`);
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
    if (!content) {
      throw new Error("Empty response from LLM");
    }

    return JSON.parse(content) as Record<string, unknown>;
  }

  throw lastError ?? new Error("Max retries exceeded");
}
