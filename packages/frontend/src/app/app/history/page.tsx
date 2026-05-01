"use client";

import { AppShell } from "@/components/app-shell";
import { CheckCircle2, XCircle, Clock, ArrowRight, ExternalLink } from "lucide-react";

type Status = "executed" | "rejected" | "pending";

const events: { time: string; agent: string; action: string; from?: string; to?: string; amount?: string; tx?: string; status: Status; pnl?: string }[] = [
  { time: "Today · 14:32", agent: "Helios", action: "Rebalance", from: "USDC (Aave)", to: "weETH PT (Pendle)", amount: "$84,200", tx: "0x4c…a91", status: "executed", pnl: "+$1,420" },
  { time: "Today · 12:08", agent: "Nyx", action: "Open position", to: "sUSDe (Ethena)", amount: "$32,000", tx: "0x9b…f02", status: "executed", pnl: "+$284" },
  { time: "Today · 10:51", agent: "Atlas", action: "Compound rewards", to: "USDC vault", amount: "$1,840", tx: "0x71…3de", status: "executed", pnl: "+$1,840" },
  { time: "Today · 09:14", agent: "Vega", action: "Migrate", from: "stETH (Lido)", to: "wstETH (Morpho)", amount: "$120,400", status: "pending" },
  { time: "Yesterday · 22:40", agent: "Nyx", action: "Open position", to: "GLP (GMX)", amount: "$48,000", status: "rejected" },
  { time: "Yesterday · 18:02", agent: "Helios", action: "Close position", from: "weETH PT", amount: "$60,000", tx: "0x3a…b1c", status: "executed", pnl: "+$2,108" },
  { time: "Yesterday · 11:27", agent: "Atlas", action: "Deposit", to: "DAI (Spark)", amount: "$210,000", tx: "0xee…0a4", status: "executed", pnl: "+$0" },
  { time: "2 days ago · 16:40", agent: "Vega", action: "Withdraw", from: "wstETH (Morpho)", amount: "$74,500", tx: "0x12…7fc", status: "executed", pnl: "+$3,108" },
];

const statusMap: Record<Status, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  executed: { icon: CheckCircle2, cls: "bg-tertiary/15 text-tertiary", label: "Executed" },
  rejected: { icon: XCircle, cls: "bg-destructive/15 text-destructive", label: "Rejected" },
  pending: { icon: Clock, cls: "bg-warning/15 text-warning", label: "Pending" },
};

export default function HistoryPage() {
  return (
    <AppShell eyebrow="Audit Trail" title="Activity History">
      <section className="mt-7 grid gap-4 md:grid-cols-4">
        <Stat l="Actions · 30d" v="248" />
        <Stat l="Approval Rate" v="92.4%" tone="tertiary" />
        <Stat l="Realized P&L" v="+$28,420" tone="tertiary" />
        <Stat l="Avg Latency" v="1.4s" />
      </section>

      <section className="glass mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <div className="label-eyebrow">Event Stream</div>
            <h2 className="mt-1 text-lg font-semibold">Every proposal, every approval, every transaction</h2>
          </div>
          <div className="flex gap-1.5 text-xs">
            {["All", "Executed", "Pending", "Rejected"].map((t, i) => (
              <button key={t} className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                i === 0 ? "bg-secondary/15 text-secondary" : "text-on-surface-variant hover:bg-foreground/5"
              }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <ol className="border-t border-border">
          {events.map((e, idx) => {
            const S = statusMap[e.status];
            return (
              <li key={idx} className="flex flex-wrap items-center gap-4 border-b border-border/50 px-6 py-4 transition hover:bg-foreground/5">
                <div className="w-32 shrink-0 text-xs text-on-surface-variant">{e.time}</div>

                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${S.cls}`}>
                  <S.icon className="size-3.5" /> {S.label}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">{e.agent}</span>
                    <span className="text-on-surface-variant">·</span>
                    <span className="font-medium">{e.action}</span>
                    {e.from && <span className="text-mono text-on-surface-variant">{e.from}</span>}
                    {e.from && e.to && <ArrowRight className="size-3 text-on-surface-variant" />}
                    {e.to && <span className="text-mono text-on-surface-variant">{e.to}</span>}
                  </div>
                </div>

                <div className="text-mono w-28 text-right text-sm font-semibold">{e.amount}</div>

                {e.pnl ? (
                  <div className={`text-mono w-24 text-right text-sm font-semibold ${
                    e.pnl.startsWith("+$0") ? "text-on-surface-variant" : "text-tertiary"
                  }`}>{e.pnl}</div>
                ) : (
                  <div className="w-24 text-right text-xs text-on-surface-variant">—</div>
                )}

                <div className="w-28 text-right">
                  {e.tx ? (
                    <span className="text-mono inline-flex items-center gap-1 text-xs text-secondary">
                      {e.tx} <ExternalLink className="size-3" />
                    </span>
                  ) : (
                    <span className="text-xs text-on-surface-variant">—</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </AppShell>
  );
}

function Stat({ l, v, tone }: { l: string; v: string; tone?: string }) {
  const toneClass = tone === "tertiary" ? "text-tertiary" : "text-foreground";
  return (
    <div className="glass-stat p-5">
      <div className="label-eyebrow">{l}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${toneClass}`}>{v}</div>
    </div>
  );
}
