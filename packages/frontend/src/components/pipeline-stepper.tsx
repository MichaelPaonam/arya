"use client";

import { Search, ShieldCheck, MessageSquare, Network, Zap, CheckCircle2 } from "lucide-react";
import type { PipelinePhase } from "@/types/pipeline";

const phases: { key: PipelinePhase; label: string; icon: typeof Search }[] = [
  { key: "scout", label: "Scanning", icon: Search },
  { key: "risk", label: "Assessing", icon: ShieldCheck },
  { key: "debate", label: "Debating", icon: MessageSquare },
  { key: "orchestrate", label: "Proposing", icon: Network },
  { key: "execute", label: "Ready", icon: Zap },
];

const phaseOrder: PipelinePhase[] = ["scout", "risk", "debate", "orchestrate", "execute"];

export function PipelineStepper({
  currentPhase,
  isLoading,
}: {
  currentPhase: PipelinePhase | null;
  isLoading: boolean;
}) {
  const activeIndex = currentPhase === "complete"
    ? phaseOrder.length
    : currentPhase
      ? phaseOrder.indexOf(currentPhase)
      : -1;

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between gap-2">
        {phases.map((phase, i) => {
          const isComplete = activeIndex > i;
          const isActive = i === activeIndex && isLoading;
          const Icon = isComplete ? CheckCircle2 : phase.icon;

          return (
            <div key={phase.key} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`grid size-9 place-items-center rounded-full transition-colors ${
                  isComplete
                    ? "bg-tertiary/15 text-tertiary"
                    : isActive
                      ? "bg-secondary/15 text-secondary animate-pulse"
                      : "bg-foreground/5 text-on-surface-variant"
                }`}
              >
                <Icon className="size-4" strokeWidth={1.75} />
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isComplete
                    ? "text-tertiary"
                    : isActive
                      ? "text-secondary"
                      : "text-on-surface-variant"
                }`}
              >
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
