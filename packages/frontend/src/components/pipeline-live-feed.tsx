"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { PipelineEvent, PipelinePhase } from "@/types/pipeline";

const PHASE_CONFIG: Record<string, { icon: string; label: string }> = {
  scout: { icon: "◈", label: "Scout" },
  risk: { icon: "◈", label: "Risk Assessment" },
  orchestrate: { icon: "◈", label: "Orchestrator" },
  execute: { icon: "◈", label: "Executor" },
};

const SERVICE_LABELS: Record<string, string> = {
  defillama: "DefiLlama",
  uniswap: "Uniswap",
  "0g-storage": "0G Storage",
  keeperhub: "KeeperHub",
  "on-chain": "On-chain",
  llm: "LLM",
};

const SERVICE_ICONS: Record<string, string> = {
  defillama: "/defillama.png",
  uniswap: "/uniswap.svg",
  "0g-storage": "/0g.png",
  keeperhub: "/kh.png",
  "on-chain": "/0g.png",
};

function ServiceIcon({ service }: { service: string }) {
  const src = SERVICE_ICONS[service];
  if (!src) return null;
  return <Image src={src} alt="" width={12} height={12} className={service === "0g-storage" || service === "on-chain" ? "dark:invert" : ""} />;
}

function StatusIcon({ status }: { status: "started" | "success" | "failed" }) {
  if (status === "started") {
    return <span className="inline-block size-3 animate-spin rounded-full border border-secondary border-t-transparent" />;
  }
  if (status === "success") {
    return <span className="text-tertiary text-xs">✓</span>;
  }
  return <span className="text-red-400 text-xs">✗</span>;
}

interface PipelineLiveFeedProps {
  events: PipelineEvent[];
  isLoading: boolean;
}

export function PipelineLiveFeed({ events, isLoading }: PipelineLiveFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  if (events.length === 0 && !isLoading) return null;

  const groupedByPhase = groupEvents(events);

  return (
    <div className="glass overflow-hidden">
      <div
        ref={scrollRef}
        className="max-h-[400px] overflow-y-auto p-5 space-y-4 font-mono text-xs scrollbar-hide"
      >
        <h3 className="text-sm font-semibold text-on-surface mb-2">Pipeline Activity</h3>
        {groupedByPhase.map((group, gi) => (
          <div key={gi} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 text-secondary font-semibold mb-2">
              <span>{PHASE_CONFIG[group.phase]?.icon ?? "◈"}</span>
              <span>{PHASE_CONFIG[group.phase]?.label ?? group.phase}</span>
              {group.message && (
                <span className="text-on-surface-variant font-normal ml-1">{group.message}</span>
              )}
            </div>
            <div className="ml-5 space-y-1">
              {group.items.map((item, ii) => (
                <div key={ii} className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${ii * 50}ms`, animationFillMode: "backwards" }}>
                  <EventLine event={item} events={events} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventLine({ event, events }: { event: PipelineEvent; events: PipelineEvent[] }) {
  switch (event.type) {
    case "api_call":
      return (
        <div className="text-on-surface-variant">
          <div className="flex items-center gap-2">
            <ServiceIcon service={event.service} />
            <span className="text-on-surface-variant/80">{SERVICE_LABELS[event.service] ?? event.service}</span>
            <span className="text-on-surface-variant/60">·</span>
            <span className="break-all">{event.action}</span>
            <StatusIcon status={event.status} />
          </div>
          {event.detail && event.status === "failed" && (
            <div className="ml-5 mt-0.5 text-red-400/80 break-all">{event.detail}</div>
          )}
        </div>
      );
    case "opportunity":
      return (
        <div className="text-on-surface">
          <span className="text-tertiary mr-1">▸</span>
          {event.data.protocol} · {event.data.pool} · {formatAPY(event.data.estimatedAPY)} APY
        </div>
      );
    case "risk": {
      const opp = events.find((e) => e.type === "opportunity" && e.data.id === event.data.opportunityId);
      const label = opp && opp.type === "opportunity" ? opp.data.pool : event.data.opportunityId;
      return (
        <div className="text-on-surface">
          <span className={event.data.riskScore > 7 ? "text-red-400 mr-1" : "text-tertiary mr-1"}>▸</span>
          {label}: {event.data.riskScore}/10
          {event.data.riskScore > 7 && <span className="text-red-400/80 ml-1">— too risky</span>}
        </div>
      );
    }
    case "proposal":
      return (
        <div className="text-tertiary">
          <span className="mr-1">▸</span>
          Strategy approved: {event.data.opportunity.tokenPair.join("/")} ({formatAPY(event.data.estimatedReturn)} est.)
        </div>
      );
    case "rejection":
      return (
        <div className="text-on-surface-variant">
          <span className="text-red-400 mr-1">✗</span>
          {event.reason}
        </div>
      );
    case "error":
      return (
        <div className="text-red-400">
          <span className="mr-1">⚠</span>
          {event.message}
        </div>
      );
    case "storage_receipt":
      return (
        <div className="text-on-surface-variant rounded-lg border border-border/50 bg-foreground/5 px-3 py-2 mt-1">
          <div className="flex items-center gap-1.5 text-secondary text-[11px] font-semibold mb-1">
            <Image src="/0g.png" alt="" width={12} height={12} className="dark:invert" /> 0G Storage Receipt
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
            <span className="text-on-surface-variant/70">Root Hash</span>
            <a
              href={`https://chainscan-galileo.0g.ai/tx/${event.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-secondary hover:underline truncate"
            >
              {event.rootHash.slice(0, 8)}...{event.rootHash.slice(-6)}
            </a>
            <span className="text-on-surface-variant/70">Tx Hash</span>
            <a
              href={`https://chainscan-galileo.0g.ai/tx/${event.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-secondary hover:underline truncate"
            >
              {event.txHash.slice(0, 8)}...{event.txHash.slice(-6)}
            </a>
            <span className="text-on-surface-variant/70">File Size</span>
            <span className="font-mono">{formatBytes(event.fileSize)}</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

interface PhaseGroup {
  phase: PipelinePhase;
  message: string;
  items: PipelineEvent[];
}

function groupEvents(events: PipelineEvent[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  let current: PhaseGroup | null = null;

  for (const event of events) {
    if (event.type === "phase") {
      current = { phase: event.phase, message: event.message, items: [] };
      groups.push(current);
    } else if (event.type === "complete") {
      // Skip
    } else if (event.type === "api_call") {
      if (!current) {
        current = { phase: "scout", message: "", items: [] };
        groups.push(current);
      }
      // Collapse: if there's already a "started" entry for this action, replace it
      const existingIdx = current.items.findIndex(
        (item) => item.type === "api_call" && item.service === event.service && item.action === event.action
      );
      if (existingIdx !== -1) {
        current.items[existingIdx] = event;
      } else {
        current.items.push(event);
      }
    } else if (current) {
      current.items.push(event);
    } else {
      current = { phase: "scout", message: "", items: [event] };
      groups.push(current);
    }
  }

  return groups;
}

function formatAPY(apy: number): string {
  if (apy >= 1000) return `${(apy / 1000).toFixed(1)}k%`;
  if (apy >= 100) return `${Math.round(apy)}%`;
  return `${apy.toFixed(1)}%`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
