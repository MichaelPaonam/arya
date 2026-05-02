"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, TrendingUp, ShieldCheck, Zap, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import type { StrategyProposal } from "@/types/pipeline";

export function PendingStrategyCard({
  proposal,
  isApproving,
  onApprove,
  onReject,
}: {
  proposal: StrategyProposal;
  isApproving?: boolean;
  onApprove: (amount: string) => void;
  onReject: () => void;
}) {
  const { opportunity, risk, debateOutcome, estimatedReturn, explanation } = proposal;
  const [amount, setAmount] = useState("");

  const radarData = [
    { axis: "Liquidity", v: risk.liquidityRisk === "low" ? 88 : risk.liquidityRisk === "medium" ? 55 : 25 },
    { axis: "Volatility", v: 100 - risk.riskScore * 10 },
    { axis: "Smart Contract", v: risk.contractRisk === "low" ? 82 : risk.contractRisk === "medium" ? 50 : 20 },
    { axis: "Counterparty", v: 100 - risk.correlationWithPortfolio * 100 },
    { axis: "Oracle", v: 78 },
  ];

  return (
    <article className="glass flex flex-col p-5">
      <div className="flex items-start justify-between">
        <div className="label-eyebrow">Pending Approval</div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
          review
        </span>
      </div>

      <h3 className="mt-2 text-sm font-semibold tracking-tight">
        {opportunity.protocol} → {opportunity.pool}
      </h3>

      <p className="mt-2 text-xs text-on-surface-variant line-clamp-3">
        {explanation}
      </p>

      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <RadarChart data={radarData} outerRadius="78%">
            <PolarGrid stroke="var(--outline-variant)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--on-surface-variant)", fontSize: 10 }} />
            <Radar dataKey="v" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.18} strokeWidth={1.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-foreground/5 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-on-surface-variant">
            <TrendingUp className="size-3" /> APY
          </div>
          <div className="mt-0.5 text-sm font-semibold text-secondary">
            {estimatedReturn.toFixed(2)}%
          </div>
        </div>
        <div className="rounded-lg border border-border bg-foreground/5 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-on-surface-variant">
            <ShieldCheck className="size-3" /> Risk
          </div>
          <div className="mt-0.5 text-sm font-semibold">
            {risk.riskScore}/10
          </div>
        </div>
        <div className="rounded-lg border border-border bg-foreground/5 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-on-surface-variant">
            <Zap className="size-3" /> Conf
          </div>
          <div className="mt-0.5 text-sm font-semibold">
            {(debateOutcome.confidenceScore * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Amount ({opportunity.tokenPair[0]})
          </label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-foreground/5 px-3 py-2 text-sm font-mono placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(amount || "10")}
            disabled={isApproving}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-tertiary px-3 text-xs font-semibold text-tertiary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {isApproving ? (
              <><Loader2 className="size-3.5 animate-spin" /> Signing...</>
            ) : (
              <><CheckCircle2 className="size-3.5" /> Approve</>
            )}
          </button>
          <button
            onClick={onReject}
            disabled={isApproving}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive/90 px-3 text-xs font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            <XCircle className="size-3.5" /> Reject
          </button>
        </div>
      </div>
    </article>
  );
}
