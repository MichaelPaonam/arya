"use client";

import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const radar = [
  { axis: "Liquidity", v: 88 },
  { axis: "Volatility", v: 42 },
  { axis: "Smart Contract", v: 76 },
  { axis: "Counterparty", v: 64 },
  { axis: "Oracle", v: 81 },
  { axis: "Correlation", v: 58 },
];

const exposure = [
  { name: "Stables", v: 42 },
  { name: "ETH LSTs", v: 28 },
  { name: "BTC", v: 12 },
  { name: "LP", v: 11 },
  { name: "Synth", v: 7 },
];

const alerts = [
  { level: "high" as const, title: "Ethena collateral concentration", body: "sUSDe position represents 18% of book. Consider trimming to <12%.", agent: "Risk Agent", time: "2m ago" },
  { level: "medium" as const, title: "Pendle PT illiquidity", body: "weETH PT order book thinned 31% in last hour. Exit window narrowing.", agent: "Scout Agent", time: "14m ago" },
  { level: "medium" as const, title: "Oracle deviation · Chainlink stETH", body: "Spot vs oracle drift 0.42% (threshold 0.50%). Watching.", agent: "Risk Agent", time: "38m ago" },
  { level: "low" as const, title: "Aave utilization elevated", body: "USDC pool at 89% utilization. Withdrawals may queue under stress.", agent: "Scout Agent", time: "1h ago" },
];

export default function RiskPage() {
  return (
    <AppShell eyebrow="Risk Radar" title="Portfolio Risk">
      <section className="mt-7 grid gap-4 md:grid-cols-4">
        <Score label="Composite Risk" value="34" tone="tertiary" sub="Low–Moderate" icon={ShieldCheck} />
        <Score label="Smart Contract" value="76" tone="secondary" sub="Audited · battle-tested" icon={ShieldCheck} />
        <Score label="Liquidity Depth" value="88" tone="secondary" sub="Deep on-chain liquidity" icon={Activity} />
        <Score label="Open Alerts" value="4" tone="warning" sub="1 high · 2 med · 1 low" icon={AlertTriangle} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="glass p-6 lg:col-span-2">
          <div className="label-eyebrow">Decomposition</div>
          <h3 className="mt-1 text-lg font-semibold">Six-vector risk signature</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="78%">
                <PolarGrid stroke="var(--outline-variant)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--on-surface-variant)", fontSize: 11 }} />
                <Radar dataKey="v" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.18} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <div className="label-eyebrow">Asset Exposure</div>
          <h3 className="mt-1 text-lg font-semibold">By bucket · %</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exposure} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--outline-variant)" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="name" stroke="var(--on-surface-variant)" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis stroke="var(--on-surface-variant)" axisLine={false} tickLine={false} fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--glass-border)", borderRadius: 12, color: "var(--foreground)" }}
                  labelStyle={{ color: "var(--on-surface-variant)", fontSize: 11 }}
                />
                <Bar dataKey="v" fill="var(--secondary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="glass mt-5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <div className="label-eyebrow">Active Alerts</div>
            <h3 className="mt-1 text-lg font-semibold">Live signal stream</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span className="size-1.5 animate-pulse rounded-full bg-tertiary" /> Streaming
          </span>
        </div>
        <ul className="border-t border-border">
          {alerts.map((a) => (
            <li key={a.title} className="flex items-start gap-4 border-b border-border/50 px-6 py-4 transition hover:bg-foreground/5">
              <div className={`mt-0.5 grid size-9 place-items-center rounded-lg ${
                a.level === "high" ? "bg-destructive/15 text-destructive" :
                a.level === "medium" ? "bg-warning/15 text-warning" : "bg-tertiary/15 text-tertiary"
              }`}>
                <ShieldAlert className="size-4" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{a.title}</span>
                  <RiskBadge level={a.level} />
                  <span className="text-xs text-on-surface-variant">· {a.agent} · {a.time}</span>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">{a.body}</p>
              </div>
              <button className="inline-flex h-8 items-center rounded-lg bg-foreground/5 px-3 text-xs font-semibold transition hover:bg-foreground/10">
                Resolve
              </button>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function Score({ label, value, sub, tone, icon: Icon }: { label: string; value: string; sub: string; tone: string; icon: typeof ShieldCheck }) {
  const toneClass = tone === "warning" ? "text-warning" : tone === "tertiary" ? "text-tertiary" : "text-secondary";
  return (
    <div className="glass-stat p-5">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{label}</div>
        <Icon className={`size-4 ${toneClass}`} strokeWidth={1.75} />
      </div>
      <div className={`mt-2 text-3xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
      <div className="mt-1 text-xs text-on-surface-variant">{sub}</div>
    </div>
  );
}
