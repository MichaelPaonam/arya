"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { TierBadge } from "@/components/tier-badge";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { PipelineLiveFeed } from "@/components/pipeline-live-feed";
import { ScanVisualizer } from "@/components/scan-visualizer";
import { PendingStrategyCard } from "@/components/pending-strategy-card";
import { StrategyApprovalDialog } from "@/components/strategy-approval-dialog";
import { ExecutionResults } from "@/components/execution-results";
import { EmptyState } from "@/components/ui/empty-state";
import { PlaceholderStat } from "@/components/ui/placeholder-stat";
import { useAppMode } from "@/hooks/use-app-mode";
import { usePipeline } from "@/hooks/use-pipeline";
import { useStrategyVault } from "@/hooks/use-strategy-vault";
import { mockPipelineState } from "@/mocks/pipeline-state";
import type { StrategyProposal } from "@/types/pipeline";
import {
  Wallet,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Triangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const apyData = [
  { d: "Mon", v: 12.4 }, { d: "Tue", v: 13.1 }, { d: "Wed", v: 12.9 },
  { d: "Thu", v: 14.2 }, { d: "Fri", v: 15.0 }, { d: "Sat", v: 14.6 },
  { d: "Sun", v: 16.3 },
];

const opportunities = [
  { protocol: "Aave v3", chain: "Base", asset: "USDC", apy: "8.42%", tvl: "$184.2M", risk: "low" as const, agent: "Scout", tier: "platinum" },
  { protocol: "Pendle", chain: "Arbitrum", asset: "weETH", apy: "21.07%", tvl: "$62.4M", risk: "medium" as const, agent: "Scout", tier: "gold" },
  { protocol: "Morpho Blue", chain: "Ethereum", asset: "wstETH", apy: "6.18%", tvl: "$412.1M", risk: "low" as const, agent: "Scout", tier: "gold" },
  { protocol: "Ethena", chain: "Ethereum", asset: "sUSDe", apy: "29.34%", tvl: "$1.8B", risk: "high" as const, agent: "Scout", tier: "silver" },
  { protocol: "Spark", chain: "Ethereum", asset: "DAI", apy: "5.91%", tvl: "$2.1B", risk: "low" as const, agent: "Scout", tier: "platinum" },
];

export default function CommandCenterPage() {
  const { mode } = useAppMode();
  const {
    state,
    isLoading,
    error,
    events,
    currentPhase,
    proposals,
    executionResults,
    isExecuting,
    trigger,
    approve,
    reject,
    reset,
  } = usePipeline();
  const { isConnected, address } = useAccount();
  const vault = useStrategyVault();
  const [dialogProposal, setDialogProposal] = useState<StrategyProposal | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [vaultTxHash, setVaultTxHash] = useState<string | null>(null);
  const proposalsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (proposals.length > 0 && proposalsRef.current) {
      proposalsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [proposals.length]);

  // When vault approval tx confirms, proceed with off-chain execution
  useEffect(() => {
    if (vault.isConfirmed && approvingId) {
      const proposal = proposals.find((p) => p.id === approvingId);
      if (proposal) {
        setVaultTxHash(vault.txHash ?? null);
        approve([proposal], { [proposal.id]: "10" });
      }
      setApprovingId(null);
      vault.reset();
    }
  }, [vault.isConfirmed, approvingId, proposals, approve, vault]);

  const handleRunScan = async () => {
    const stored = localStorage.getItem("arya-max-risk-score");
    const maxRiskScore = stored ? parseInt(stored, 10) : 7;
    const confStored = localStorage.getItem("arya-min-confidence");
    const minConfidence = confStored ? parseFloat(confStored) : 0.4;
    const poolFilter = localStorage.getItem("arya-pool-filter") || "all";
    const poolLimitStored = localStorage.getItem("arya-pool-limit");
    const poolLimit = poolLimitStored ? parseInt(poolLimitStored, 10) : 3;
    await trigger("0xc1Ac7fd08367321b5d486a81349Ab1CB793aF0C1", { maxRiskScore, minConfidence, poolFilter, poolLimit });
  };

  const handleApproveAll = () => {
    if (isConnected && proposals.length > 0) {
      setApprovingId(proposals[0].id);
      vault.approveOnChain(proposals[0].id);
    } else {
      const amounts = Object.fromEntries(proposals.map((p) => [p.id, "10"]));
      approve(proposals, amounts);
    }
  };

  const handleRejectAll = () => {
    if (isConnected && proposals.length > 0) {
      vault.rejectOnChain(proposals[0].id, "User rejected");
    }
    reject();
  };

  const handleApproveSingle = (proposal: StrategyProposal, amount: string) => {
    if (isConnected) {
      setApprovingId(proposal.id);
      vault.approveOnChain(proposal.id);
    } else {
      approve([proposal], { [proposal.id]: amount });
    }
  };

  if (mode === "hackathon") {
    return (
      <AppShell
        eyebrow="Command Center"
        title="Yield Swarm Overview"
        actions={
          <button
            onClick={handleRunScan}
            disabled={isLoading || isExecuting}
            className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 md:inline-flex"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {isLoading ? "Scanning..." : "Run scan"}
          </button>
        }
      >
        <section className="mt-7 grid gap-4 md:grid-cols-4">
          <PlaceholderStat label="Portfolio Value" hint="After first deposit" />
          <PlaceholderStat label="Aggregate APY" hint="Weighted average" />
          <PlaceholderStat label="Win Rate" hint="30-day rolling" />
          <PlaceholderStat label="Active Vaults" hint="Open positions" />
        </section>

        {(isLoading || events.length > 0) && (
          <>
            <section className="mt-5">
              <PipelineStepper currentPhase={currentPhase} isLoading={isLoading} />
            </section>
            <section className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
              <ScanVisualizer currentPhase={currentPhase} events={events} isLoading={isLoading} />
              <PipelineLiveFeed events={events} isLoading={isLoading} />
            </section>
          </>
        )}

        {/* Proposal approval cards */}
        {proposals.length > 0 && !isExecuting && executionResults.length === 0 && (
          <section ref={proposalsRef} className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-on-surface">
                {proposals.length} {proposals.length === 1 ? "Strategy" : "Strategies"} Ready for Approval
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleApproveAll}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-tertiary px-4 text-xs font-semibold text-tertiary-foreground transition hover:opacity-90"
                >
                  <CheckCircle2 className="size-3.5" /> Approve All
                </button>
                <button
                  onClick={handleRejectAll}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive/90 px-4 text-xs font-semibold text-destructive-foreground transition hover:opacity-90"
                >
                  <XCircle className="size-3.5" /> Reject All
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {proposals.map((proposal) => (
                <PendingStrategyCard
                  key={proposal.id}
                  proposal={proposal}
                  isApproving={approvingId === proposal.id && (vault.isPending || vault.isConfirming)}
                  onApprove={(amount) => handleApproveSingle(proposal, amount)}
                  onReject={() => {
                    // Remove single proposal from the list via reject pattern
                    reject();
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Executing state */}
        {isExecuting && (
          <section className="mt-5">
            <div className="glass p-6 text-center">
              <Loader2 className="size-5 animate-spin text-secondary mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">
                Executing approved strategies...
              </p>
            </div>
          </section>
        )}

        {/* Execution results */}
        {executionResults.length > 0 && (
          <section className="mt-5">
            <ExecutionResults results={executionResults} proposals={state?.proposals ?? []} vaultTxHash={vaultTxHash} />
          </section>
        )}

        {!isLoading && events.length === 0 && proposals.length === 0 && executionResults.length === 0 && (
          <section className="mt-5">
            <EmptyState
              icon={Wallet}
              eyebrow="Getting Started"
              title="Your portfolio is empty"
              description="Run your first scan to discover yield opportunities and start deploying capital."
              primaryAction={{ label: "Run first scan", onClick: handleRunScan }}
            />
          </section>
        )}

        {state && !isLoading && state.proposals.length === 0 && proposals.length === 0 && executionResults.length === 0 && (
          <section className="mt-5">
            <div className="glass p-6 text-center">
              <p className="text-sm text-on-surface-variant">
                No strategies passed the confidence threshold. Try again later.
              </p>
            </div>
          </section>
        )}

        {error && (
          <section className="mt-5">
            <div className="glass border-destructive/30 p-6">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </section>
        )}

        {/* Strategy detail dialog */}
        {dialogProposal && (
          <StrategyApprovalDialog
            proposal={dialogProposal}
            open={!!dialogProposal}
            onOpenChange={(open) => { if (!open) setDialogProposal(null); }}
            onApprove={() => {
              handleApproveSingle(dialogProposal, "10");
              setDialogProposal(null);
            }}
            onReject={() => {
              setDialogProposal(null);
            }}
          />
        )}
      </AppShell>
    );
  }

  // Full mode (non-hackathon) — rich mock data + live pipeline
  const pendingProposal = state?.proposals?.[0] || mockPipelineState.proposals[0];

  const c = {
    secondary: "var(--secondary)",
    onSurfaceVariant: "var(--on-surface-variant)",
    outlineVariant: "var(--outline-variant)",
    popover: "var(--popover)",
    border: "var(--glass-border)",
    foreground: "var(--foreground)",
  };

  return (
    <AppShell
      eyebrow="Command Center"
      title="Yield Swarm Overview"
      actions={
        <button
          onClick={handleRunScan}
          disabled={isLoading || isExecuting}
          className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 md:inline-flex"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isLoading ? "Scanning..." : "Run scan"}
        </button>
      }
    >
      {/* Pipeline stepper (visible when loading or has results) */}
      {(isLoading || state) && (
        <section className="mt-7">
          <PipelineStepper currentPhase={currentPhase} isLoading={isLoading} />
        </section>
      )}

      {/* Scan visualizer + live feed side-by-side */}
      {(isLoading || events.length > 0) && (
        <section className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
          <ScanVisualizer currentPhase={currentPhase} events={events} isLoading={isLoading} />
          <PipelineLiveFeed events={events} isLoading={isLoading} />
        </section>
      )}

      {/* Proposal approval cards */}
      {proposals.length > 0 && !isExecuting && executionResults.length === 0 && (
        <section ref={proposalsRef} className="mt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface">
              {proposals.length} {proposals.length === 1 ? "Strategy" : "Strategies"} Ready for Approval
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleApproveAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-tertiary px-4 text-xs font-semibold text-tertiary-foreground transition hover:opacity-90"
              >
                <CheckCircle2 className="size-3.5" /> Approve All
              </button>
              <button
                onClick={handleRejectAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive/90 px-4 text-xs font-semibold text-destructive-foreground transition hover:opacity-90"
              >
                <XCircle className="size-3.5" /> Reject All
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <PendingStrategyCard
                key={proposal.id}
                proposal={proposal}
                onApprove={(amount) => handleApproveSingle(proposal, amount)}
                onReject={() => reject()}
              />
            ))}
          </div>
        </section>
      )}

      {/* Executing state */}
      {isExecuting && (
        <section className="mt-5">
          <div className="glass p-6 text-center">
            <Loader2 className="size-5 animate-spin text-secondary mx-auto mb-2" />
            <p className="text-sm text-on-surface-variant">Executing approved strategies...</p>
          </div>
        </section>
      )}

      {/* Execution results */}
      {executionResults.length > 0 && (
        <section className="mt-5">
          <ExecutionResults results={executionResults} proposals={state?.proposals ?? []} />
        </section>
      )}

      {/* Strategy approved message */}
      {state?.proposals?.[0] && !isLoading && proposals.length === 0 && executionResults.length === 0 && (
        <section className="mt-5">
          <div className="glass p-6 text-center">
            <p className="text-sm text-tertiary font-semibold">
              Strategy approved and queued for execution.
            </p>
          </div>
        </section>
      )}

      {/* No proposals message */}
      {state && !isLoading && state.proposals.length === 0 && proposals.length === 0 && executionResults.length === 0 && (
        <section className="mt-5">
          <div className="glass p-6 text-center">
            <p className="text-sm text-on-surface-variant">
              No strategies passed the confidence threshold. Try again later.
            </p>
          </div>
        </section>
      )}

      {/* Error state */}
      {error && (
        <section className="mt-5">
          <div className="glass border-destructive/30 p-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </section>
      )}

      {/* Stat row */}
      <section className="mt-7 grid gap-4 md:grid-cols-3">
        {[
          { label: "Portfolio Value", value: "$2.847M", delta: "+4.21%", icon: Wallet },
          { label: "Aggregate APY", value: "16.3%", delta: "+1.7pp", icon: TrendingUp },
          { label: "Win Rate · 30d", value: "92.4%", delta: "+0.8%", icon: Activity },
        ].map((s) => (
          <div key={s.label} className="glass-stat p-6">
            <div className="flex items-start justify-between">
              <span className="label-eyebrow">{s.label}</span>
              <s.icon className="size-4 text-on-surface-variant" strokeWidth={1.75} />
            </div>
            <div className="mt-4 text-display">{s.value}</div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-tertiary/10 px-2.5 py-1 text-xs font-semibold text-tertiary">
              {s.delta} <span className="font-normal text-on-surface-variant">vs last week</span>
            </div>
          </div>
        ))}
      </section>

      {/* Chart + Pending Approval */}
      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-eyebrow">Yield Curve · 7d</div>
              <div className="mt-1 text-lg font-semibold">Aggregate APY trajectory</div>
            </div>
            <div className="flex gap-1.5 text-xs">
              {["24h", "7d", "30d", "All"].map((t, i) => (
                <button
                  key={t}
                  className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                    i === 1 ? "bg-secondary/15 text-secondary" : "text-on-surface-variant hover:bg-foreground/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={apyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="apyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.secondary} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={c.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke={c.outlineVariant} strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="d" stroke={c.onSurfaceVariant} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke={c.onSurfaceVariant} tickLine={false} axisLine={false} fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: c.popover,
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${c.border}`,
                    borderRadius: 12,
                    color: c.foreground,
                  }}
                  labelStyle={{ color: c.onSurfaceVariant, fontSize: 11 }}
                />
                <Area type="monotone" dataKey="v" stroke={c.secondary} strokeWidth={2} fill="url(#apyFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <PendingStrategyCard
          proposal={pendingProposal}
          onApprove={(amount) => {
            handleApproveSingle(pendingProposal, amount);
          }}
          onReject={() => {
            reset();
          }}
        />
      </section>

      {/* Opportunities table */}
      <section className="glass mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <div className="label-eyebrow">Live Feed</div>
            <h2 className="mt-1 text-lg font-semibold">Swarm Picks</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="size-1.5 animate-pulse rounded-full bg-tertiary" />
            Updated 12s ago
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-left">
                {["Protocol", "Asset", "Chain", "APY", "TVL", "Risk", "Agent", ""].map((h) => (
                  <th key={h} className="label-eyebrow px-6 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.protocol + o.asset} className="border-b border-border/50 transition hover:bg-foreground/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-lg bg-secondary/10 text-secondary">
                        <Triangle className="size-3.5 fill-current" strokeWidth={0} />
                      </div>
                      <div className="font-semibold">{o.protocol}</div>
                    </div>
                  </td>
                  <td className="text-mono px-6 py-4 font-medium">{o.asset}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{o.chain}</td>
                  <td className="text-mono px-6 py-4 font-semibold text-secondary">{o.apy}</td>
                  <td className="text-mono px-6 py-4 text-on-surface-variant">{o.tvl}</td>
                  <td className="px-6 py-4"><RiskBadge level={o.risk} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{o.agent}</span>
                      <TierBadge tier={o.tier} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex h-8 items-center gap-1 rounded-lg bg-foreground/5 px-3 text-xs font-semibold transition hover:bg-foreground/10">
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Strategy Approval Dialog */}
      {dialogProposal && (
        <StrategyApprovalDialog
          proposal={dialogProposal}
          open={!!dialogProposal}
          onOpenChange={(open) => { if (!open) setDialogProposal(null); }}
          onApprove={() => {
            handleApproveSingle(dialogProposal, "10");
            setDialogProposal(null);
          }}
          onReject={() => {
            setDialogProposal(null);
          }}
        />
      )}
    </AppShell>
  );
}
