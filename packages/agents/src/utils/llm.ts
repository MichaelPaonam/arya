export interface ChatCompletionInput {
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string };
}

export async function chatCompletion(_input: ChatCompletionInput): Promise<Record<string, unknown>> {
  throw new Error("Not implemented");
}
