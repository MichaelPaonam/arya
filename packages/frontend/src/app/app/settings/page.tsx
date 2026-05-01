"use client";

import { AppShell } from "@/components/app-shell";
import { Wallet, ShieldCheck, Bell, Zap, Key, Copy } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell eyebrow="Configuration" title="Settings">
      <section className="mt-7 grid gap-4 lg:grid-cols-3">
        <Card icon={Wallet} title="Connected Wallet" desc="Non-custodial. ARYA never holds your keys.">
          <Field label="Address">
            <div className="text-mono flex items-center gap-2 text-sm">
              0x84c2e1bb…5b9f31a
              <button className="rounded-md p-1 text-on-surface-variant transition hover:bg-foreground/10 hover:text-foreground">
                <Copy className="size-3.5" />
              </button>
            </div>
          </Field>
          <Field label="Network"><span className="text-sm font-semibold">Ethereum mainnet</span></Field>
          <Field label="Status">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <span className="size-1.5 rounded-full bg-tertiary" /> Connected
            </span>
          </Field>
          <button className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground/5 text-sm font-semibold transition hover:bg-foreground/10">
            Disconnect
          </button>
        </Card>

        <Card icon={ShieldCheck} title="Risk Limits" desc="Hard caps the swarm cannot cross.">
          <Slider label="Max single position" value="18%" />
          <Slider label="Max protocol exposure" value="35%" />
          <Slider label="Max high-risk allocation" value="12%" />
          <Field label="Auto-reject threshold">
            <span className="text-mono text-sm font-semibold text-warning">Risk score &gt; 75</span>
          </Field>
        </Card>

        <Card icon={Bell} title="Notifications" desc="Where the swarm pings you for approval.">
          <Toggle label="Browser push" enabled />
          <Toggle label="Email digest · daily" enabled />
          <Toggle label="Telegram bot" />
          <Toggle label="Discord webhook" enabled />
          <Field label="Approval window">
            <span className="text-sm font-semibold">15 minutes</span>
          </Field>
        </Card>

        <Card icon={Zap} title="Execution" desc="How transactions reach the chain.">
          <Field label="Default slippage"><span className="text-mono text-sm font-semibold">0.30%</span></Field>
          <Field label="MEV protection"><span className="text-sm font-semibold">Flashbots Protect</span></Field>
          <Field label="Gas strategy"><span className="text-sm font-semibold">Fast (P75)</span></Field>
          <Toggle label="Simulate before send" enabled />
        </Card>

        <Card icon={Key} title="Session Keys" desc="Scoped permissions issued to agents.">
          <KeyRow agent="Atlas" scope="USDC, DAI · max $250K" expiry="6d" />
          <KeyRow agent="Helios" scope="Pendle PT · max $100K" expiry="3d" />
          <KeyRow agent="Vega" scope="LSTs · max $200K" expiry="6d" />
          <KeyRow agent="Nyx" scope="Synthetics · max $50K" expiry="1d" />
          <button className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground/5 text-sm font-semibold transition hover:bg-foreground/10">
            Revoke all
          </button>
        </Card>

        <Card icon={ShieldCheck} title="Danger Zone" desc="Irreversible actions.">
          <p className="text-xs text-on-surface-variant">
            Pausing halts new proposals immediately. Active positions remain. Withdraw via the Vaults page.
          </p>
          <button className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-warning/15 text-sm font-semibold text-warning transition hover:bg-warning/25">
            Pause swarm
          </button>
          <button className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-destructive/15 text-sm font-semibold text-destructive transition hover:bg-destructive/25">
            Wipe agent memory
          </button>
        </Card>
      </section>
    </AppShell>
  );
}

function Card({ icon: Icon, title, desc, children }: { icon: typeof Wallet; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="glass flex flex-col gap-4 p-6">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-secondary/15 text-secondary">
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-foreground/5 px-3.5 py-2.5">
      <span className="label-eyebrow">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-foreground/5 px-3.5 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <span className={`inline-flex h-6 w-10 items-center rounded-full p-0.5 transition ${enabled ? "bg-secondary" : "bg-foreground/10"}`}>
        <span className={`size-5 rounded-full bg-background shadow-sm transition ${enabled ? "translate-x-4" : ""}`} />
      </span>
    </div>
  );
}

function Slider({ label, value }: { label: string; value: string }) {
  const pct = parseFloat(value);
  return (
    <div className="rounded-lg border border-border bg-foreground/5 px-3.5 py-3">
      <div className="flex items-center justify-between">
        <span className="label-eyebrow">{label}</span>
        <span className="text-mono text-sm font-semibold text-secondary">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.min(pct * 2.5, 100)}%` }} />
      </div>
    </div>
  );
}

function KeyRow({ agent, scope, expiry }: { agent: string; scope: string; expiry: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-foreground/5 px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{agent}</div>
        <div className="text-mono mt-0.5 truncate text-[11px] text-on-surface-variant">{scope}</div>
      </div>
      <div className="text-right">
        <div className="label-eyebrow text-[10px]">Expires</div>
        <div className="text-mono text-xs font-semibold">{expiry}</div>
      </div>
    </div>
  );
}
