"use client";

import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlaceholderStat } from "@/components/ui/placeholder-stat";
import { useAppMode } from "@/hooks/use-app-mode";
import { Wallet, Plus, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const vaults = [
  { name: "Stable Core", strat: "Atlas · stable lending", asset: "USDC", balance: "$1,205,840", apy: "8.42%", earned: "$8,412", risk: "low" as const, util: 92 },
  { name: "ETH Yield", strat: "Vega · LST + Morpho", asset: "wstETH", balance: "$684,120", apy: "6.18%", earned: "$3,108", risk: "low" as const, util: 76 },
  { name: "Fixed-Term Boost", strat: "Helios · Pendle PT", asset: "weETH", balance: "$542,300", apy: "21.07%", earned: "$11,420", risk: "medium" as const, util: 88 },
  { name: "Frontier Alpha", strat: "Nyx · synth + perp LP", asset: "sUSDe + GLP", balance: "$398,200", apy: "24.71%", earned: "$9,840", risk: "high" as const, util: 64 },
];

const tvlSeries = Array.from({ length: 30 }, (_, i) => ({
  d: i,
  v: 2.4 + Math.sin(i / 4) * 0.12 + i * 0.018,
}));

export default function VaultsPage() {
  const { mode } = useAppMode();

  if (mode === "hackathon") {
    return (
      <AppShell
        eyebrow="Strategy Vaults"
        title="Your Vaults"
        actions={
          <button className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 md:inline-flex">
            <Plus className="size-4" /> Open vault
          </button>
        }
      >
        <section className="mt-7 grid gap-4 md:grid-cols-4">
          <PlaceholderStat label="Total Deposited" hint="Across all vaults" />
          <PlaceholderStat label="Active Vaults" hint="Open positions" />
          <PlaceholderStat label="Avg. APY" hint="Blended yield" />
          <PlaceholderStat label="Best Performer" hint="Top vault" />
        </section>
        <section className="mt-5">
          <EmptyState
            icon={Wallet}
            eyebrow="Vaults"
            title="Open your first strategy vault"
            description="Strategy vaults let AI agents manage positions on your behalf. You approve every trade before execution."
            primaryAction={{ label: "Browse opportunities", href: "/app/opportunities" }}
          />
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Strategy Vaults"
      title="Your Vaults"
      actions={
        <button className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 md:inline-flex">
          <Plus className="size-4" /> Open vault
        </button>
      }
    >
      <section className="mt-7 grid gap-4 md:grid-cols-4">
        <Stat l="Total Deposited" v="$2.83M" />
        <Stat l="Lifetime Earned" v="$32,780" tone="tertiary" />
        <Stat l="Blended APY" v="14.2%" tone="secondary" />
        <Stat l="Active Vaults" v="4" />
      </section>

      <section className="glass mt-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="label-eyebrow">TVL · 30d</div>
            <h3 className="mt-1 text-lg font-semibold">Combined vault value</h3>
          </div>
          <div className="text-mono text-sm text-on-surface-variant">USD millions</div>
        </div>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={tvlSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tvlFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--outline-variant)" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="d" stroke="var(--on-surface-variant)" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis stroke="var(--on-surface-variant)" tickLine={false} axisLine={false} fontSize={11} domain={["dataMin - 0.1", "dataMax + 0.1"]} />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--glass-border)", borderRadius: 12, color: "var(--foreground)" }}
                labelStyle={{ color: "var(--on-surface-variant)", fontSize: 11 }}
              />
              <Area type="monotone" dataKey="v" stroke="var(--secondary)" strokeWidth={2} fill="url(#tvlFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {vaults.map((v) => (
          <article key={v.name} className="glass p-6">
            <div className="flex items-start gap-4">
              <div className="grid size-11 place-items-center rounded-xl bg-secondary/15 text-secondary">
                <Wallet className="size-5" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">{v.name}</h3>
                  <RiskBadge level={v.risk} />
                </div>
                <div className="mt-1 text-xs text-on-surface-variant">{v.strat}</div>
              </div>
              <div className="text-right">
                <div className="label-eyebrow">APY</div>
                <div className="text-mono mt-0.5 text-lg font-semibold text-secondary">{v.apy}</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Cell l="Balance" v={v.balance} />
              <Cell l="Earned" v={v.earned} tone="tertiary" />
              <Cell l="Asset" v={v.asset} mono />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Capacity utilization</span>
                <span className="text-mono">{v.util}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                <div className="h-full rounded-full bg-secondary" style={{ width: `${v.util}%` }} />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-tertiary text-sm font-semibold text-tertiary-foreground transition hover:opacity-90">
                <ArrowDownToLine className="size-4" /> Deposit
              </button>
              <button className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground/5 text-sm font-semibold text-foreground transition hover:bg-foreground/10">
                <ArrowUpFromLine className="size-4" /> Withdraw
              </button>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

function Stat({ l, v, tone }: { l: string; v: string; tone?: string }) {
  const toneClass = tone === "tertiary" ? "text-tertiary" : tone === "secondary" ? "text-secondary" : "text-foreground";
  return (
    <div className="glass-stat p-5">
      <div className="label-eyebrow">{l}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${toneClass}`}>{v}</div>
    </div>
  );
}

function Cell({ l, v, tone, mono }: { l: string; v: string; tone?: string; mono?: boolean }) {
  const toneClass = tone === "tertiary" ? "text-tertiary" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-foreground/5 p-3">
      <div className="label-eyebrow text-[10px]">{l}</div>
      <div className={`mt-1 text-sm font-semibold ${mono ? "text-mono" : ""} ${toneClass}`}>{v}</div>
    </div>
  );
}
