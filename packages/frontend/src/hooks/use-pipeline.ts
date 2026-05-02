"use client";

import { useState, useCallback, useRef } from "react";
import type { PipelineState, PipelineEvent, PipelinePhase, StrategyProposal, ExecutionResult } from "@/types/pipeline";

export interface UsePipelineReturn {
  state: PipelineState | null;
  isLoading: boolean;
  error: string | null;
  events: PipelineEvent[];
  currentPhase: PipelinePhase | null;
  proposals: StrategyProposal[];
  executionResults: ExecutionResult[];
  isExecuting: boolean;
  trigger: (walletAddress: string, options?: { maxRiskScore?: number; minConfidence?: number; poolFilter?: string }) => Promise<void>;
  approve: (proposals: StrategyProposal[], amounts: Record<string, string>) => Promise<void>;
  reject: () => void;
  reset: () => void;
}

export function usePipeline(): UsePipelineReturn {
  const [state, setState] = useState<PipelineState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [currentPhase, setCurrentPhase] = useState<PipelinePhase | null>(null);
  const [proposals, setProposals] = useState<StrategyProposal[]>([]);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const walletRef = useRef<string>("");

  const trigger = useCallback(async (walletAddress: string, options?: { maxRiskScore?: number; minConfidence?: number; poolFilter?: string }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    walletRef.current = walletAddress;

    setIsLoading(true);
    setError(null);
    setState(null);
    setEvents([]);
    setCurrentPhase(null);
    setProposals([]);
    setExecutionResults([]);

    try {
      const llmProvider = localStorage.getItem("arya-llm-provider") || undefined;
      const llmApiKey = localStorage.getItem("arya-llm-api-key") || undefined;
      const llmModel = localStorage.getItem("arya-llm-model") || undefined;

      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          chainId: 16602,
          maxRiskScore: options?.maxRiskScore,
          minConfidence: options?.minConfidence,
          poolFilter: options?.poolFilter,
          llmProvider,
          llmApiKey,
          llmModel,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "Pipeline failed");
        setIsLoading(false);
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        const data = await res.json();
        setState(data as PipelineState);
        setIsLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          if (!json) continue;

          try {
            const event = JSON.parse(json) as PipelineEvent;
            setEvents((prev) => [...prev, event]);

            switch (event.type) {
              case "phase":
                setCurrentPhase(event.phase);
                break;
              case "awaiting_approval":
                setProposals(event.proposals);
                break;
              case "complete":
                setState(event.state);
                setCurrentPhase("complete");
                break;
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Network error");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approve = useCallback(async (selectedProposals: StrategyProposal[], amounts: Record<string, string>) => {
    setIsExecuting(true);
    setError(null);

    try {
      const res = await fetch("/api/pipeline/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposals: selectedProposals,
          walletAddress: walletRef.current,
          chainId: 16602,
          amounts,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "Execution failed");
        return;
      }

      const { results } = await res.json() as { results: ExecutionResult[] };
      setExecutionResults(results);
      setProposals([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const reject = useCallback(() => {
    setProposals([]);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(null);
    setError(null);
    setIsLoading(false);
    setEvents([]);
    setCurrentPhase(null);
    setProposals([]);
    setExecutionResults([]);
    setIsExecuting(false);
  }, []);

  return { state, isLoading, error, events, currentPhase, proposals, executionResults, isExecuting, trigger, approve, reject, reset };
}
