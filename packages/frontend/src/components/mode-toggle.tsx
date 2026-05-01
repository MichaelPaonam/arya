"use client";

import { useAppMode } from "@/hooks/use-app-mode";

export function ModeToggle() {
  const { mode, setMode } = useAppMode();
  const isHackathon = mode === "hackathon";

  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-foreground/5 px-3.5 py-2.5 text-xs font-semibold cursor-pointer">
      <span className="text-on-surface-variant">Demo mode</span>
      <button
        role="switch"
        aria-checked={isHackathon}
        onClick={() => setMode(isHackathon ? "full" : "hackathon")}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          isHackathon ? "bg-secondary" : "bg-foreground/20"
        }`}
      >
        <span
          className={`inline-block size-3.5 rounded-full bg-white transition-transform ${
            isHackathon ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </label>
  );
}
