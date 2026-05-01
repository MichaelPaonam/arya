"use client";

import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { TierBadge } from "@/components/tier-badge";
import {
  TrendingUp,
  Activity,
  Wallet,
  Triangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  CartesianGrid,
} from "recharts";

const apyData = [
  { d: "Mon", v: 12.4 }, { d: "Tue", v: 13.1 }, { d: "Wed", v: 12.9 },
  { d: "Thu", v: 14.2 }, { d: "Fri", v: 15.0 }, { d: "Sat", v: 14.6 },
  { d: "Sun", v: 16.3 },
];

const radar = [
  { axis: "Liquidity", v: 88 },
  { axis: "Volatility", v: 42 },
  { axis: "Smart Contract", v: 76 },
  { axis: "Counterparty", v: 64 },
  { axis: "Oracle", v: 81 },
];

const opportunities = [
  { protocol: "Aave v3", chain: "Base", asset: "USDC", apy: "8.42%", tvl: "$184.2M", risk: "low" as const, agent: "Scout", tier: "platinum" },
  { protocol: "Pendle", chain: "Arbitrum", asset: "weETH", apy: "21.07%", tvl: "$62.4M", risk: "medium" as const, agent: "Scout", tier: "gold" },
  { protocol: "Morpho Blue", chain: "Ethereum", asset: "wstETH", apy: "6.18%", tvl: "$412.1M", risk: "low" as const, agent: "Scout", tier: "gold" },
  { protocol: "Ethena", chain: "Ethereum", asset: "sUSDe", apy: "29.34%", tvl: "$1.8B", risk: "high" as const, agent: "Scout", tier: "silver" },
  { protocol: "Spark", chain: "Ethereum", asset: "DAI", apy: "5.91%", tvl: "$2.1B", risk: "low" as const, agent: "Scout", tier: "platinum" },
];

export default function CommandCenterPage() {
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
        <button className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 md:inline-flex">
          Run scan
        </button>
      }
    >
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

      {/* Chart + Strategy detail */}
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
            <ResponsiveContainer width="100%" height="100%">
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

        {/* Pending strategy */}
        <div className="glass-elevated p-6">
          <div className="flex items-center justify-between">
            <span className="label-eyebrow">Pending Approval</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-warning">
              <span className="size-1.5 rounded-full bg-warning" /> review
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold leading-tight">Rebalance USDC → Pendle weETH PT</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Agent <span className="text-secondary">Scout</span> proposes routing 18% of stable bucket into a fixed-yield principal token expiring Dec 26.
          </p>

          <div className="mt-5 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="78%">
                <PolarGrid stroke={c.outlineVariant} />
                <PolarAngleAxis dataKey="axis" tick={{ fill: c.onSurfaceVariant, fontSize: 10 }} />
                <Radar dataKey="v" stroke={c.secondary} fill={c.secondary} fillOpacity={0.18} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-mono mt-5 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-foreground/5 p-3">
              <div className="label-eyebrow">Est APY</div>
              <div className="mt-1 text-base font-semibold text-foreground">21.07%</div>
            </div>
            <div className="rounded-lg border border-border bg-foreground/5 p-3">
              <div className="label-eyebrow">Slippage</div>
              <div className="mt-1 text-base font-semibold text-foreground">0.12%</div>
            </div>
            <div className="rounded-lg border border-border bg-foreground/5 p-3">
              <div className="label-eyebrow">Risk</div>
              <div className="mt-1 text-base font-semibold text-warning">Med</div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-tertiary text-sm font-semibold text-tertiary-foreground transition hover:opacity-90">
              <CheckCircle2 className="size-4" /> Approve
            </button>
            <button className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/90 text-sm font-semibold text-destructive-foreground transition hover:opacity-90">
              <XCircle className="size-4" /> Reject
            </button>
          </div>
        </div>
      </section>

      {/* Opportunities table */}
      <section className="glass mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <div className="label-eyebrow">Live Feed</div>
            <h2 className="mt-1 text-lg font-semibold">Top opportunities surfaced by the swarm</h2>
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
    </AppShell>
  );
}
