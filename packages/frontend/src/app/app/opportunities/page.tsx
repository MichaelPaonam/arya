"use client";

import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { TierBadge } from "@/components/tier-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlaceholderStat } from "@/components/ui/placeholder-stat";
import { useAppMode } from "@/hooks/use-app-mode";
import { useScanResults } from "@/hooks/use-scan-results";
import { Triangle, Filter, ArrowUpDown, Sparkles } from "lucide-react";

const opps = [
  { protocol: "Aave v3", chain: "Base", asset: "USDC", apy: "8.42%", base: "5.10%", reward: "3.32%", tvl: "$184.2M", risk: "low" as const, swarm: "Alpha Swarm", tier: "platinum", category: "Lending" },
  { protocol: "Pendle", chain: "Arbitrum", asset: "weETH PT", apy: "21.07%", base: "21.07%", reward: "—", tvl: "$62.4M", risk: "medium" as const, swarm: "Alpha Swarm", tier: "gold", category: "Fixed Yield" },
  { protocol: "Morpho Blue", chain: "Ethereum", asset: "wstETH", apy: "6.18%", base: "4.20%", reward: "1.98%", tvl: "$412.1M", risk: "low" as const, swarm: "Alpha Swarm", tier: "gold", category: "Lending" },
  { protocol: "Ethena", chain: "Ethereum", asset: "sUSDe", apy: "29.34%", base: "29.34%", reward: "—", tvl: "$1.8B", risk: "high" as const, swarm: "Alpha Swarm", tier: "silver", category: "Synthetic" },
  { protocol: "Spark", chain: "Ethereum", asset: "DAI", apy: "5.91%", base: "5.91%", reward: "—", tvl: "$2.1B", risk: "low" as const, swarm: "Alpha Swarm", tier: "platinum", category: "Lending" },
  { protocol: "GMX v2", chain: "Arbitrum", asset: "GLP", apy: "18.62%", base: "12.40%", reward: "6.22%", tvl: "$144.8M", risk: "high" as const, swarm: "Alpha Swarm", tier: "silver", category: "Perp LP" },
  { protocol: "Convex", chain: "Ethereum", asset: "crvUSD/USDC", apy: "11.85%", base: "4.10%", reward: "7.75%", tvl: "$58.3M", risk: "medium" as const, swarm: "Alpha Swarm", tier: "gold", category: "Stable LP" },
  { protocol: "Aerodrome", chain: "Base", asset: "ETH/USDC", apy: "26.40%", base: "9.20%", reward: "17.20%", tvl: "$31.2M", risk: "medium" as const, swarm: "Alpha Swarm", tier: "gold", category: "Volatile LP" },
  { protocol: "Curve", chain: "Ethereum", asset: "3pool", apy: "4.82%", base: "2.10%", reward: "2.72%", tvl: "$320.6M", risk: "low" as const, swarm: "Alpha Swarm", tier: "platinum", category: "Stable LP" },
  { protocol: "Lido", chain: "Ethereum", asset: "stETH", apy: "3.21%", base: "3.21%", reward: "—", tvl: "$28.4B", risk: "low" as const, swarm: "Alpha Swarm", tier: "gold", category: "Liquid Staking" },
];

const categories = ["All", "Lending", "Fixed Yield", "Stable LP", "Volatile LP", "Liquid Staking", "Perp LP", "Synthetic"];
const chains = ["All chains", "Ethereum", "Arbitrum", "Base", "Optimism"];
const risks = ["Any risk", "Low only", "Low + Medium", "All risks"];

function riskLevel(score: number): "low" | "medium" | "high" {
  if (score <= 3) return "low";
  if (score <= 6) return "medium";
  return "high";
}

function formatTvl(tvl: number): string {
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(1)}M`;
  if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(0)}K`;
  return `$${tvl.toFixed(0)}`;
}

export default function OpportunitiesPage() {
  const { mode } = useAppMode();
  const scanData = useScanResults();

  if (mode === "hackathon") {
    if (!scanData || scanData.opportunities.length === 0) {
      return (
        <AppShell
          eyebrow="Live Feed"
          title="Yield Opportunities"
          actions={
            <button className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 md:inline-flex">
              <Sparkles className="size-4" /> Run scan
            </button>
          }
        >
          <section className="mt-7 grid gap-4 md:grid-cols-4">
            <PlaceholderStat label="Best APY Found" hint="Across all pools" />
            <PlaceholderStat label="Pools Scanned" hint="DeFi protocols" />
            <PlaceholderStat label="Risk-Adjusted Score" hint="Top opportunity" />
            <PlaceholderStat label="Time to Next Scan" hint="Auto-refresh" />
          </section>
          <section className="mt-5">
            <EmptyState
              icon={Sparkles}
              eyebrow="Discovery"
              title="No opportunities surfaced yet"
              description="The yield swarm will surface the best risk-adjusted opportunities once you initiate your first scan."
              primaryAction={{ label: "Run scan", href: "/app" }}
            />
          </section>
        </AppShell>
      );
    }

    const bestApy = Math.max(...scanData.opportunities.map((o) => o.estimatedAPY));
    const riskMap = new Map(scanData.riskAssessments.map((r) => [r.opportunityId, r]));

    return (
      <AppShell
        eyebrow="Live Feed"
        title="Yield Opportunities"
        actions={
          <button className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 md:inline-flex">
            <Sparkles className="size-4" /> Run scan
          </button>
        }
      >
        <section className="mt-7 grid gap-4 md:grid-cols-4">
          {[
            { l: "Best APY Found", v: `${bestApy.toFixed(1)}%` },
            { l: "Pools Scanned", v: String(scanData.opportunities.length) },
            { l: "Risk Assessed", v: String(scanData.riskAssessments.length) },
            { l: "Strategies Proposed", v: String(scanData.proposals.length) },
          ].map((s) => (
            <div key={s.l} className="glass-stat p-5">
              <div className="label-eyebrow">{s.l}</div>
              <div className="mt-2 text-xl font-semibold tracking-tight">{s.v}</div>
            </div>
          ))}
        </section>

        <section className="glass mt-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border text-left">
                  {["Protocol", "Pair", "Category", "APY", "TVL", "Risk"].map((h) => (
                    <th key={h} className="label-eyebrow whitespace-nowrap px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scanData.opportunities.map((o) => {
                  const risk = riskMap.get(o.id);
                  return (
                    <tr key={o.id} className="border-b border-border/50 transition hover:bg-foreground/5">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-8 place-items-center rounded-lg bg-secondary/10 text-secondary">
                            <Triangle className="size-3.5 fill-current" strokeWidth={0} />
                          </div>
                          <div className="font-semibold">{o.protocol}</div>
                        </div>
                      </td>
                      <td className="text-mono px-4 py-4 font-medium">{o.tokenPair.join(" / ")}</td>
                      <td className="px-4 py-4 text-on-surface-variant">{o.category}</td>
                      <td className="text-mono px-4 py-4 font-semibold text-secondary">{o.estimatedAPY.toFixed(2)}%</td>
                      <td className="text-mono px-4 py-4 text-on-surface-variant">{formatTvl(o.tvl)}</td>
                      <td className="px-4 py-4">
                        {risk ? <RiskBadge level={riskLevel(risk.riskScore)} /> : <span className="text-xs text-on-surface-variant">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Live Feed"
      title="Yield Opportunities"
      actions={
        <button className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 md:inline-flex">
          <Sparkles className="size-4" /> Run scan
        </button>
      }
    >
      {/* Stat strip */}
      <section className="mt-7 grid gap-4 md:grid-cols-4">
        {[
          { l: "Tracked Pools", v: "1,284" },
          { l: "Avg APY · Top 50", v: "12.7%" },
          { l: "Best Risk-Adjusted", v: "Aave v3 Base" },
          { l: "Last Scan", v: "12s ago" },
        ].map((s) => (
          <div key={s.l} className="glass-stat p-5">
            <div className="label-eyebrow">{s.l}</div>
            <div className="mt-2 text-xl font-semibold tracking-tight">{s.v}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="glass mt-5 flex flex-wrap items-center gap-2 px-4 py-3">
        <Filter className="size-4 text-on-surface-variant" />
        <Pills items={categories} />
        <span className="mx-1 h-5 w-px bg-border" />
        <FilterButton label={chains[0]} />
        <FilterButton label={risks[0]} />
        <button className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground/5 px-3 text-xs font-semibold transition hover:bg-foreground/10">
          <ArrowUpDown className="size-3.5" /> Sort: APY desc
        </button>
      </section>

      {/* Table */}
      <section className="glass mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-left">
                {["Protocol", "Asset", "Chain", "Category", "Base", "Rewards", "Net APY", "TVL", "Risk", "Swarm"].map((h) => (
                  <th key={h} className="label-eyebrow whitespace-nowrap px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {opps.map((o) => (
                <tr key={o.protocol + o.asset} className="border-b border-border/50 transition hover:bg-foreground/5">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-lg bg-secondary/10 text-secondary">
                        <Triangle className="size-3.5 fill-current" strokeWidth={0} />
                      </div>
                      <div className="font-semibold">{o.protocol}</div>
                    </div>
                  </td>
                  <td className="text-mono px-4 py-4 font-medium">{o.asset}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{o.chain}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{o.category}</td>
                  <td className="text-mono px-4 py-4 text-on-surface-variant">{o.base}</td>
                  <td className="text-mono px-4 py-4 text-on-surface-variant">{o.reward}</td>
                  <td className="text-mono px-4 py-4 font-semibold text-secondary">{o.apy}</td>
                  <td className="text-mono px-4 py-4 text-on-surface-variant">{o.tvl}</td>
                  <td className="px-4 py-4"><RiskBadge level={o.risk} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-on-surface-variant">{o.swarm}</span>
                      <div className="flex items-center justify-between gap-2">
                        <TierBadge tier={o.tier} />
                        <button className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground transition hover:opacity-90">
                          Allocate
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function Pills({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((c, i) => (
        <button
          key={c}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            i === 0 ? "bg-secondary/15 text-secondary" : "text-on-surface-variant hover:bg-foreground/5"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-foreground/5 px-3 text-xs font-semibold text-on-surface-variant transition hover:bg-foreground/10">
      {label}
    </button>
  );
}
