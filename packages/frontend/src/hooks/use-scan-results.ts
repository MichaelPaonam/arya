"use client";

import { useState, useEffect } from "react";
import type { PipelineState } from "@/types/pipeline";

const STORAGE_KEY = "arya-last-scan";

export function useScanResults(): PipelineState | null {
  const [data, setData] = useState<PipelineState | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        // Corrupt data — ignore
      }
    }
  }, []);

  return data;
}
