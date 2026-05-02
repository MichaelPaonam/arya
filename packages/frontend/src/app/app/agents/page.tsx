"use client";

import { AppShell } from "@/components/app-shell";
import { TierBadge } from "@/components/tier-badge";
import { useAppMode } from "@/hooks/use-app-mode";
import { Bot, TrendingUp, Activity, Award, Cpu } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const series = (seed: number) =>
  Array.from({ length: 14 }, (_, i) => ({ d: i, v: 60 + Math.sin(i / 2 + seed) * 12 + seed * 4 + i * 0.6 }));

const swarm = {
  name: "Alpha Swarm",
  tier: "gold",
  status: "active" as const,
  stats: { winRate: "83.3%", strategies: 218, aum: "$2.83M", apy: "14.2%" },
  spark: series(2),
  roles: [
    {
      name: "Scout",
      desc: "Scans hundreds of DeFi protocols 24/7 for emerging yield opportunities across chains.",
      status: "active",
      lastAction: "2min ago",
      model: "Claude Haiku 4.5",
    },
    {
      name: "Risk",
      desc: "Scores every opportunity across impermanent loss, contract risk, liquidity depth, and correlation.",
      status: "active",
      lastAction: "5min ago",
      model: "Claude Haiku 4.5",
    },
    {
      name: "Orchestrator",
      desc: "Coordinates the swarm pipeline, manages state, routes proposals through debate tiers.",
      status: "active",
      lastAction: "5min ago",
      model: "Claude Haiku 4.5",
    },
    {
      name: "Executor",
      desc: "Builds swap transactions via Uniswap API and creates KeeperHub automated workflows.",
      status: "idle",
      lastAction: "1hr ago",
      model: "Claude Haiku 4.5",
    },
  ],
};

const roles = [
  {
    name: "Scout",
    desc: "Scans hundreds of DeFi protocols 24/7 for emerging yield opportunities across chains.",
    model: "Claude Haiku 4.5",
  },
  {
    name: "Risk",
    desc: "Scores every opportunity across impermanent loss, contract risk, liquidity depth, and correlation.",
    model: "Claude Haiku 4.5",
  },
  {
    name: "Orchestrator",
    desc: "Coordinates the swarm pipeline, manages state, routes proposals through debate tiers.",
    model: "Claude Haiku 4.5",
  },
  {
    name: "Executor",
    desc: "Builds swap transactions via Uniswap API and creates KeeperHub automated workflows.",
    model: "Claude Haiku 4.5",
  },
];

export default function AgentsPage() {
  const { mode } = useAppMode();

  if (mode === "hackathon") {
    return (
      <AppShell eyebrow="Swarm Roster" title="Agents">
        <section className="mt-7 grid gap-4 md:grid-cols-4">
          {[
            { l: "Active Roles", v: "4", icon: Bot },
            { l: "Strategies Executed", v: "0", icon: TrendingUp },
            { l: "Win Rate", v: "—", icon: Activity },
            { l: "Tier", v: "Unranked", icon: Award },
          ].map((s) => (
            <div key={s.l} className="glass-stat p-5">
              <div className="flex items-center justify-between">
                <div className="label-eyebrow">{s.l}</div>
                <s.icon className="size-4 text-on-surface-variant" strokeWidth={1.75} />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{s.v}</div>
            </div>
          ))}
        </section>

        <section className="mt-5">
          <div className="glass p-6">
            <div className="flex items-start gap-4">
              <div className="grid size-12 place-items-center rounded-xl bg-secondary/15 text-secondary">
                <Bot className="size-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">Alpha Swarm</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-on-surface-variant/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    <span className="size-1.5 rounded-full bg-current" /> awaiting first scan
                  </span>
                </div>
                <div className="mt-1 text-xs text-on-surface-variant">4 roles · just provisioned</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {roles.map((role) => (
            <article key={role.name} className="glass p-6">
              <div className="flex items-start gap-4">
                <div className="grid size-10 place-items-center rounded-lg bg-secondary/10 text-secondary">
                  <Bot className="size-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold">{role.name}</h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-current" /> idle
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">{role.desc}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <Cpu className="size-3.5" /> {role.model}
                    </span>
                    <span>Last active: never</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Swarm Roster" title="Agents">
      {/* Swarm-level stats */}
      <section className="mt-7 grid gap-4 md:grid-cols-4">
        {[
          { l: "Active Roles", v: "4", icon: Bot },
          { l: "Combined AUM", v: swarm.stats.aum, icon: TrendingUp },
          { l: "Win Rate", v: swarm.stats.winRate, icon: Activity },
          { l: "Tier", v: "Gold", icon: Award },
        ].map((s) => (
          <div key={s.l} className="glass-stat p-5">
            <div className="flex items-center justify-between">
              <div className="label-eyebrow">{s.l}</div>
              <s.icon className="size-4 text-on-surface-variant" strokeWidth={1.75} />
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{s.v}</div>
          </div>
        ))}
      </section>

      {/* Swarm card */}
      <section className="mt-5">
        <div className="glass p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-12 place-items-center rounded-xl bg-secondary/15 text-secondary">
              <Bot className="size-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight">{swarm.name}</h3>
                <TierBadge tier={swarm.tier} />
                <span className="inline-flex items-center gap-1 rounded-full bg-tertiary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                  <span className="size-1.5 rounded-full bg-current" /> {swarm.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-on-surface-variant">4 roles · {swarm.stats.strategies} strategies executed</div>
            </div>
          </div>

          {/* Sparkline */}
          <div className="mt-5 h-20">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={swarm.spark} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="d" hide />
                <YAxis hide domain={["dataMin - 4", "dataMax + 4"]} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--glass-border)", borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ display: "none" }}
                />
                <Line type="monotone" dataKey="v" stroke="var(--secondary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {swarm.roles.map((role) => (
          <article key={role.name} className="glass p-6">
            <div className="flex items-start gap-4">
              <div className="grid size-10 place-items-center rounded-lg bg-secondary/10 text-secondary">
                <Bot className="size-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold">{role.name}</h4>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    role.status === "active" ? "bg-tertiary/15 text-tertiary" : "bg-muted text-muted-foreground"
                  }`}>
                    <span className="size-1.5 rounded-full bg-current" /> {role.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-on-surface-variant">{role.desc}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5">
                    <Cpu className="size-3.5" /> {role.model}
                  </span>
                  <span>Last active: {role.lastAction}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
