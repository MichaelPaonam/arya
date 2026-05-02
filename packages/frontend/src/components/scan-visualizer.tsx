"use client";

import { motion } from "framer-motion";
import { Bot, Cpu, Activity, Radar, ShieldCheck, Network, CheckCircle2 } from "lucide-react";
import type { PipelinePhase, PipelineEvent } from "@/types/pipeline";

const STAGES: { phase: PipelinePhase; label: string; icon: typeof Cpu }[] = [
  { phase: "scout", label: "Scanning DeFi pools", icon: Radar },
  { phase: "risk", label: "Assessing risk scores", icon: ShieldCheck },
  { phase: "orchestrate", label: "Building strategies", icon: Network },
  { phase: "execute", label: "Awaiting approval", icon: Activity },
];

interface ScanVisualizerProps {
  currentPhase: PipelinePhase | null;
  events: PipelineEvent[];
  isLoading: boolean;
}

export function ScanVisualizer({ currentPhase, events, isLoading }: ScanVisualizerProps) {
  const done = currentPhase === "complete" && !isLoading;
  const activeIndex = getActiveIndex(currentPhase);

  const opportunityCount = events.filter((e) => e.type === "opportunity").length;
  const riskCount = events.filter((e) => e.type === "risk").length;
  const proposalCount = events.filter((e) => e.type === "proposal").length;

  return (
    <div className="glass overflow-hidden p-6 flex flex-col items-center">
      {/* Radar visualization */}
      <div className="relative grid h-48 w-48 place-items-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-secondary/30"
            style={{ width: 60 + i * 44, height: 60 + i * 44 }}
            animate={isLoading ? { scale: [1, 1.5], opacity: [0.5, 0] } : { scale: 1, opacity: 0.2 }}
            transition={{ duration: 2.4, repeat: isLoading ? Infinity : 0, delay: i * 0.6, ease: "easeOut" }}
          />
        ))}

        {isLoading && (
          <motion.div
            className="absolute size-40 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, var(--color-secondary) 40deg, transparent 80deg)",
              maskImage: "radial-gradient(circle, black 50%, transparent 72%)",
              WebkitMaskImage: "radial-gradient(circle, black 50%, transparent 72%)",
              opacity: 0.4,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
          />
        )}

        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const r = 50 + (i % 3) * 16;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          return (
            <motion.span
              key={i}
              className="absolute size-1.5 rounded-full bg-secondary shadow-[0_0_6px_var(--color-secondary)]"
              style={{ x, y }}
              animate={isLoading ? { opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] } : { opacity: 0.4, scale: 1 }}
              transition={{ duration: 1.8, repeat: isLoading ? Infinity : 0, delay: i * 0.12 }}
            />
          );
        })}

        <motion.div
          className="relative grid size-16 place-items-center rounded-2xl border border-secondary/40 bg-gradient-to-br from-secondary/20 to-tertiary/10 backdrop-blur-xl"
          animate={isLoading ? { y: [0, -4, 0], rotate: [0, 1, -1, 0] } : { y: 0, rotate: 0 }}
          transition={{ duration: 3.2, repeat: isLoading ? Infinity : 0, ease: "easeInOut" }}
          style={{ boxShadow: "0 0 30px color-mix(in oklab, var(--color-secondary) 30%, transparent)" }}
        >
          <Bot className="size-8 text-primary" strokeWidth={1.5} />
          {isLoading && (
            <motion.span
              className="absolute left-1/2 top-[42%] size-1 -translate-x-1/2 rounded-full bg-tertiary"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      {/* Telemetry counters */}
      <div className="mt-4 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
          {done ? "Scan complete" : isLoading ? "Agent scanning" : "Idle"}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-mono text-lg font-semibold tabular-nums">{opportunityCount}</div>
            <div className="text-[10px] text-on-surface-variant">Pools</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold tabular-nums">{riskCount}</div>
            <div className="text-[10px] text-on-surface-variant">Assessed</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold tabular-nums">{proposalCount}</div>
            <div className="text-[10px] text-on-surface-variant">Strategies</div>
          </div>
        </div>
      </div>

      {/* Stage list */}
      <ul className="mt-5 w-full space-y-1.5">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const active = i === activeIndex && isLoading;
          const complete = i < activeIndex || done;
          return (
            <motion.li
              key={s.phase}
              className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-1.5 text-xs"
              initial={{ opacity: 0, x: -6 }}
              animate={{
                opacity: complete || active ? 1 : 0.4,
                x: 0,
              }}
              transition={{ delay: i * 0.05 }}
            >
              <span
                className={`grid size-6 place-items-center rounded-md ${
                  complete
                    ? "bg-tertiary/15 text-tertiary"
                    : active
                      ? "bg-secondary/20 text-secondary"
                      : "bg-foreground/5 text-on-surface-variant"
                }`}
              >
                {complete ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3.5" />}
              </span>
              <span className={complete ? "text-on-surface" : "text-on-surface-variant"}>
                {s.label}
              </span>
              {active && (
                <motion.span
                  className="ml-auto size-1.5 rounded-full bg-secondary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

function getActiveIndex(phase: PipelinePhase | null): number {
  if (!phase) return -1;
  const map: Record<string, number> = { scout: 0, risk: 1, orchestrate: 2, execute: 3, complete: 4 };
  return map[phase] ?? -1;
}
