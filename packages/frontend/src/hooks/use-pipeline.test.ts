import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePipeline } from "./use-pipeline";

const mockState = { currentPhase: "complete", opportunities: [], riskAssessments: [], debateOutcomes: [], proposals: [], executionResults: [], errors: [] };

function createSSEResponse(events: Record<string, unknown>[]) {
  const text = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
  const encoded = new TextEncoder().encode(text);
  let read = false;

  const body = {
    getReader: () => ({
      read: () => {
        if (!read) {
          read = true;
          return Promise.resolve({ done: false, value: encoded });
        }
        return Promise.resolve({ done: true, value: undefined });
      },
    }),
  };

  return {
    ok: true,
    headers: { get: (h: string) => h === "content-type" ? "text/event-stream" : null },
    body,
  };
}

function createJSONResponse(data: unknown, ok = true) {
  return {
    ok,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(data),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("usePipeline", () => {
  it("starts with null state and not loading", () => {
    const { result } = renderHook(() => usePipeline());
    expect(result.current.state).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.events).toEqual([]);
    expect(result.current.currentPhase).toBeNull();
  });

  it("sets loading state on trigger", async () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const { result } = renderHook(() => usePipeline());

    act(() => {
      result.current.trigger("0x1234");
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns pipeline state from SSE complete event", async () => {
    const sseEvents = [
      { type: "phase", phase: "scout", message: "Scanning..." },
      { type: "complete", state: mockState },
    ];
    global.fetch = vi.fn(() => Promise.resolve(createSSEResponse(sseEvents))) as unknown as typeof fetch;

    const { result } = renderHook(() => usePipeline());

    await act(async () => {
      await result.current.trigger("0x1234");
    });

    expect(result.current.state).toEqual(mockState);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentPhase).toBe("complete");
    expect(result.current.events.length).toBe(2);
  });

  it("falls back to JSON response when not SSE", async () => {
    global.fetch = vi.fn(() => Promise.resolve(createJSONResponse(mockState))) as unknown as typeof fetch;

    const { result } = renderHook(() => usePipeline());

    await act(async () => {
      await result.current.trigger("0x1234");
    });

    expect(result.current.state).toEqual(mockState);
    expect(result.current.isLoading).toBe(false);
  });

  it("sets error on API failure", async () => {
    global.fetch = vi.fn(() => Promise.resolve(createJSONResponse({ error: "Pipeline failed" }, false))) as unknown as typeof fetch;

    const { result } = renderHook(() => usePipeline());

    await act(async () => {
      await result.current.trigger("0x1234");
    });

    expect(result.current.error).toBe("Pipeline failed");
    expect(result.current.state).toBeNull();
  });

  it("accumulates events during SSE stream", async () => {
    const sseEvents = [
      { type: "phase", phase: "scout", message: "Scanning..." },
      { type: "api_call", service: "defillama", action: "Fetching pools", status: "started" },
      { type: "api_call", service: "defillama", action: "Fetching pools", status: "success" },
      { type: "complete", state: mockState },
    ];
    global.fetch = vi.fn(() => Promise.resolve(createSSEResponse(sseEvents))) as unknown as typeof fetch;

    const { result } = renderHook(() => usePipeline());

    await act(async () => {
      await result.current.trigger("0x1234");
    });

    expect(result.current.events.length).toBe(4);
    expect(result.current.currentPhase).toBe("complete");
  });

  it("resets state", async () => {
    const sseEvents = [{ type: "complete", state: mockState }];
    global.fetch = vi.fn(() => Promise.resolve(createSSEResponse(sseEvents))) as unknown as typeof fetch;

    const { result } = renderHook(() => usePipeline());

    await act(async () => {
      await result.current.trigger("0x1234");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.events).toEqual([]);
    expect(result.current.currentPhase).toBeNull();
  });
});
