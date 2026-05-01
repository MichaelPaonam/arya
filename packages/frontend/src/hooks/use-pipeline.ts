"use client";

import { useState, useCallback } from "react";
import type { PipelineState } from "@/types/pipeline";

export function usePipeline() {
  const [state, setState] = useState<PipelineState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    setError(null);
    setState(null);

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, chainId: 16602 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Pipeline failed");
        return;
      }

      setState(data as PipelineState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setState(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { state, isLoading, error, trigger, reset };
}
