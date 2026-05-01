"use client";

import { CheckCircle2, XCircle, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import type { StrategyProposal } from "@/types/pipeline";

export function StrategyProposalCard({
  proposal,
  onApprove,
  onReject,
}: {
  proposal: StrategyProposal;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { opportunity, risk, debateOutcome, explanation, estimatedReturn } = proposal;

  return (
    <article className="glass-elevated p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="label-eyebrow">Strategy Proposal</div>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">
            {opportunity.protocol} → {opportunity.pool}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
          <span className="size-1.5 rounded-full bg-current animate-pulse" /> Awaiting approval
        </span>
      </div>

      <p className="mt-4 text-sm text-on-surface-variant">{explanation}</p>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-foreground/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <TrendingUp className="size-3.5" /> Est. APY
          </div>
          <div className="mt-1 text-lg font-semibold text-secondary">
            {estimatedReturn.toFixed(2)}%
          </div>
        </div>
        <div className="rounded-xl border border-border bg-foreground/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <ShieldCheck className="size-3.5" /> Risk Score
          </div>
          <div className="mt-1 text-lg font-semibold">
            {risk.riskScore}/10
          </div>
        </div>
        <div className="rounded-xl border border-border bg-foreground/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Zap className="size-3.5" /> Confidence
          </div>
          <div className="mt-1 text-lg font-semibold">
            {(debateOutcome.confidenceScore * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-on-surface-variant">
        <span>TVL: ${(opportunity.tvl / 1_000_000).toFixed(1)}M</span>
        <span>·</span>
        <span>Debate: {debateOutcome.tier}</span>
        <span>·</span>
        <span>Contract risk: {risk.contractRisk}</span>
        <span>·</span>
        <span>Token: {opportunity.tokenPair.join(" → ")}</span>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onApprove}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <CheckCircle2 className="size-4" /> Approve
        </button>
        <button
          onClick={onReject}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground/5 px-6 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
        >
          <XCircle className="size-4" /> Reject
        </button>
      </div>
    </article>
  );
}
