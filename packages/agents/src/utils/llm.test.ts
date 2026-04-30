import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { chatCompletion } from "./llm.js";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("LLM Client (OpenRouter)", () => {
  it("should send request to OpenRouter with correct headers", async () => {
    server.use(
      http.post("https://openrouter.ai/api/v1/chat/completions", async ({ request }) => {
        const auth = request.headers.get("authorization");
        expect(auth).toMatch(/^Bearer /);

        const body = await request.json() as Record<string, unknown>;
        expect(body["model"]).toBe("anthropic/claude-haiku-latest");

        return HttpResponse.json({
          choices: [{
            message: { content: JSON.stringify({ result: "test" }) },
            finish_reason: "stop",
          }],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        });
      })
    );

    const result = await chatCompletion({
      messages: [{ role: "user", content: "Hello" }],
      responseFormat: { type: "json_object" },
    });

    expect(result).toEqual({ result: "test" });
  });

  it("should parse structured JSON response", async () => {
    server.use(
      http.post("https://openrouter.ai/api/v1/chat/completions", () => {
        return HttpResponse.json({
          choices: [{
            message: {
              content: JSON.stringify({
                riskScore: 5,
                reasoning: "Moderate risk due to volatility",
                contractRisk: "medium",
              }),
            },
            finish_reason: "stop",
          }],
          usage: { prompt_tokens: 200, completion_tokens: 80 },
        });
      })
    );

    const result = await chatCompletion({
      messages: [{ role: "user", content: "Assess risk" }],
      responseFormat: { type: "json_object" },
    });

    expect(result).toHaveProperty("riskScore", 5);
    expect(result).toHaveProperty("reasoning");
  });

  it("should retry on 429 rate limit", async () => {
    let callCount = 0;
    server.use(
      http.post("https://openrouter.ai/api/v1/chat/completions", () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 429, headers: { "retry-after": "1" } });
        }
        return HttpResponse.json({
          choices: [{ message: { content: '{"ok":true}' }, finish_reason: "stop" }],
          usage: { prompt_tokens: 50, completion_tokens: 10 },
        });
      })
    );

    const result = await chatCompletion({
      messages: [{ role: "user", content: "Retry test" }],
      responseFormat: { type: "json_object" },
    });

    expect(callCount).toBe(2);
    expect(result).toEqual({ ok: true });
  });

  it("should throw on non-retryable error", async () => {
    server.use(
      http.post("https://openrouter.ai/api/v1/chat/completions", () => {
        return HttpResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
      })
    );

    await expect(
      chatCompletion({
        messages: [{ role: "user", content: "Bad key" }],
        responseFormat: { type: "json_object" },
      })
    ).rejects.toThrow(/401|Invalid API key/);
  });

  it("should respect temperature parameter", async () => {
    server.use(
      http.post("https://openrouter.ai/api/v1/chat/completions", async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        expect(body["temperature"]).toBe(0);
        return HttpResponse.json({
          choices: [{ message: { content: '{"deterministic":true}' }, finish_reason: "stop" }],
          usage: { prompt_tokens: 50, completion_tokens: 10 },
        });
      })
    );

    await chatCompletion({
      messages: [{ role: "user", content: "Score this" }],
      temperature: 0,
      responseFormat: { type: "json_object" },
    });
  });

  it("should respect maxTokens parameter", async () => {
    server.use(
      http.post("https://openrouter.ai/api/v1/chat/completions", async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        expect(body["max_tokens"]).toBe(1024);
        return HttpResponse.json({
          choices: [{ message: { content: '{}' }, finish_reason: "stop" }],
          usage: { prompt_tokens: 50, completion_tokens: 10 },
        });
      })
    );

    await chatCompletion({
      messages: [{ role: "user", content: "Short" }],
      maxTokens: 1024,
      responseFormat: { type: "json_object" },
    });
  });
});
