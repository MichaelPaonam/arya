"use client";

import { CheckCircle2, XCircle, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { StrategyProposal } from "@/types/pipeline";

export function StrategyApprovalDialog({
  proposal,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: {
  proposal: StrategyProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { opportunity, risk, debateOutcome, explanation, estimatedReturn } = proposal;

  const radarData = [
    { axis: "Liquidity", v: risk.liquidityRisk === "low" ? 88 : risk.liquidityRisk === "medium" ? 55 : 25 },
    { axis: "Volatility", v: 100 - risk.riskScore * 10 },
    { axis: "Smart Contract", v: risk.contractRisk === "low" ? 82 : risk.contractRisk === "medium" ? 50 : 20 },
    { axis: "Counterparty", v: 100 - risk.correlationWithPortfolio * 100 },
    { axis: "Oracle", v: 78 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-elevated border-glass-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Strategy Ready</DialogTitle>
          <DialogDescription>
            The swarm has identified a high-confidence opportunity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <h3 className="text-base font-semibold tracking-tight">
            {opportunity.protocol} → {opportunity.pool}
          </h3>

          <p className="text-sm text-on-surface-variant">{explanation}</p>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="78%">
                <PolarGrid stroke="var(--outline-variant)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--on-surface-variant)", fontSize: 11 }} />
                <Radar dataKey="v" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.18} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3">
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

          <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
            <span>TVL: ${(opportunity.tvl / 1_000_000).toFixed(1)}M</span>
            <span>·</span>
            <span>Debate: {debateOutcome.tier}</span>
            <span>·</span>
            <span>Token: {opportunity.tokenPair.join(" → ")}</span>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-3 sm:gap-3">
          <button
            onClick={onReject}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/90 px-6 text-sm font-semibold text-destructive-foreground transition hover:opacity-90"
          >
            <XCircle className="size-4" /> Reject
          </button>
          <button
            onClick={onApprove}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-tertiary px-6 text-sm font-semibold text-tertiary-foreground transition hover:opacity-90"
          >
            <CheckCircle2 className="size-4" /> Approve
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
