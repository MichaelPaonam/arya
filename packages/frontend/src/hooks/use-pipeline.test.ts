import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePipeline } from "./use-pipeline";

const mockState = { currentPhase: "complete", opportunities: [], riskAssessments: [], debateOutcomes: [], proposals: [], executionResults: [], errors: [] };

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("usePipeline", () => {
  it("starts with null state and not loading", () => {
    const { result } = renderHook(() => usePipeline());
    expect(result.current.state).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets loading state on trigger", async () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const { result } = renderHook(() => usePipeline());

    act(() => {
      result.current.trigger("0x1234");
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns pipeline state on success", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockState) })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => usePipeline());

    await act(async () => {
      await result.current.trigger("0x1234");
    });

    expect(result.current.state).toEqual(mockState);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on API failure", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Pipeline failed" }) })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => usePipeline());

    await act(async () => {
      await result.current.trigger("0x1234");
    });

    expect(result.current.error).toBe("Pipeline failed");
    expect(result.current.state).toBeNull();
  });

  it("resets state", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockState) })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => usePipeline());

    await act(async () => {
      await result.current.trigger("0x1234");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
