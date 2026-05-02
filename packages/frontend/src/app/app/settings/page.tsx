"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { Wallet, ShieldCheck, Bell, Zap, Key, Copy, Brain } from "lucide-react";

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

        <RiskLimitsCard />

        <Card icon={Bell} title="Notifications" desc="Where the swarm pings you for approval.">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-foreground/5 px-3.5 py-2">
            <Image src="/kh.png" alt="KeeperHub" width={16} height={16} />
            <span className="text-xs font-semibold text-on-surface-variant">Monitored by KeeperHub</span>
          </div>
          <Toggle label="Browser push" enabled />
          <Toggle label="Email digest · daily" enabled />
          <Toggle label="Telegram bot" />
          <Toggle label="Discord webhook" enabled />
          <Field label="Approval window">
            <span className="text-sm font-semibold">15 minutes</span>
          </Field>
        </Card>

        <Card icon={Zap} title="Execution" desc="How transactions reach the chain.">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-foreground/5 px-3.5 py-2">
            <Image src="/uniswap.svg" alt="Uniswap" width={16} height={16} />
            <span className="text-xs font-semibold text-on-surface-variant">Powered by Uniswap Trading API</span>
          </div>
          <Field label="Default slippage"><span className="text-mono text-sm font-semibold">0.30%</span></Field>
          <Field label="MEV protection"><span className="text-sm font-semibold">Flashbots Protect</span></Field>
          <Field label="Gas strategy"><span className="text-sm font-semibold">Fast (P75)</span></Field>
          <Toggle label="Simulate before send" enabled />
        </Card>

        <Card icon={Key} title="Session Keys" desc="Scoped permissions issued to agents.">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-foreground/5 px-3.5 py-2">
            <Image src="/0g.png" alt="0G" width={16} height={16} className="dark:invert" />
            <span className="text-xs font-semibold text-on-surface-variant">Stored on 0G Chain</span>
          </div>
          <KeyRow agent="Atlas" scope="USDC, DAI · max $250K" expiry="6d" />
          <KeyRow agent="Helios" scope="Pendle PT · max $100K" expiry="3d" />
          <KeyRow agent="Vega" scope="LSTs · max $200K" expiry="6d" />
          <KeyRow agent="Nyx" scope="Synthetics · max $50K" expiry="1d" />
          <button className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground/5 text-sm font-semibold transition hover:bg-foreground/10">
            Revoke all
          </button>
        </Card>

        <LLMConfigCard />

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

function RiskLimitsCard() {
  const [maxRiskScore, setMaxRiskScore] = useState(() => {
    if (typeof window === "undefined") return 7;
    const stored = localStorage.getItem("arya-max-risk-score");
    return stored ? parseInt(stored, 10) : 7;
  });

  const [minConfidence, setMinConfidence] = useState(() => {
    if (typeof window === "undefined") return 0.4;
    const stored = localStorage.getItem("arya-min-confidence");
    return stored ? parseFloat(stored) : 0.4;
  });

  const [poolFilter, setPoolFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return localStorage.getItem("arya-pool-filter") || "all";
  });

  const [poolLimit, setPoolLimit] = useState(() => {
    if (typeof window === "undefined") return 3;
    const stored = localStorage.getItem("arya-pool-limit");
    return stored ? parseInt(stored, 10) : 3;
  });

  const handleRiskChange = (value: number) => {
    setMaxRiskScore(value);
    localStorage.setItem("arya-max-risk-score", String(value));
  };

  const handleConfidenceChange = (value: number) => {
    setMinConfidence(value);
    localStorage.setItem("arya-min-confidence", String(value));
  };

  const handlePoolFilterChange = (value: string) => {
    setPoolFilter(value);
    localStorage.setItem("arya-pool-filter", value);
  };

  const handlePoolLimitChange = (value: number) => {
    setPoolLimit(value);
    localStorage.setItem("arya-pool-limit", String(value));
  };

  return (
    <Card icon={ShieldCheck} title="Risk Limits" desc="Hard caps the swarm cannot cross.">
      <div className="rounded-lg border border-border bg-foreground/5 px-3.5 py-3">
        <div className="label-eyebrow mb-2">Pool filter</div>
        <div className="flex gap-1">
          {(["all", "stable", "bluechip"] as const).map((f) => (
            <button
              key={f}
              onClick={() => handlePoolFilterChange(f)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${poolFilter === f ? "bg-secondary/20 text-secondary" : "text-on-surface-variant hover:text-foreground"}`}
            >
              {f === "all" ? "All pools" : f === "stable" ? "Stablecoins" : "Blue chip"}
            </button>
          ))}
        </div>
        <div className="mt-1.5 text-[10px] text-on-surface-variant">
          {poolFilter === "all" && "Top APY pools (higher risk, higher reward)"}
          {poolFilter === "stable" && "Stablecoin pairs only — low IL, APY ≤ 30%"}
          {poolFilter === "bluechip" && "TVL > $50M, APY ≤ 50% — established protocols"}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-foreground/5 px-3.5 py-3">
        <div className="flex items-center justify-between">
          <span className="label-eyebrow">Pools to scan</span>
          <span className="text-mono text-sm font-semibold text-secondary">{poolLimit}</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={poolLimit}
          onChange={(e) => handlePoolLimitChange(parseInt(e.target.value, 10))}
          className="mt-2 w-full accent-secondary"
        />
        <div className="mt-1 flex justify-between text-[10px] text-on-surface-variant">
          <span>Faster</span>
          <span>More thorough</span>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-foreground/5 px-3.5 py-3">
        <div className="flex items-center justify-between">
          <span className="label-eyebrow">Max risk score</span>
          <span className="text-mono text-sm font-semibold text-secondary">{maxRiskScore} / 10</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={maxRiskScore}
          onChange={(e) => handleRiskChange(parseInt(e.target.value, 10))}
          className="mt-2 w-full accent-secondary"
        />
        <div className="mt-1 flex justify-between text-[10px] text-on-surface-variant">
          <span>Conservative</span>
          <span>Aggressive</span>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-foreground/5 px-3.5 py-3">
        <div className="flex items-center justify-between">
          <span className="label-eyebrow">Min confidence</span>
          <span className="text-mono text-sm font-semibold text-secondary">{minConfidence.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={minConfidence}
          onChange={(e) => handleConfidenceChange(parseFloat(e.target.value))}
          className="mt-2 w-full accent-secondary"
        />
        <div className="mt-1 flex justify-between text-[10px] text-on-surface-variant">
          <span>Accept all</span>
          <span>High conviction only</span>
        </div>
      </div>
    </Card>
  );
}

const ANTHROPIC_MODELS = [
  { id: "anthropic--claude-haiku-latest", label: "Claude Haiku (latest)" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { id: "claude-sonnet-4-6-20260320", label: "Claude Sonnet 4.6" },
  { id: "claude-opus-4-7-20260401", label: "Claude Opus 4.7" },
];

function LLMConfigCard() {
  const [provider, setProvider] = useState<"anthropic" | "openrouter">(() => {
    if (typeof window === "undefined") return "anthropic";
    return (localStorage.getItem("arya-llm-provider") as "anthropic" | "openrouter") || "anthropic";
  });
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("arya-llm-api-key") || "";
  });
  const [model, setModel] = useState(() => {
    if (typeof window === "undefined") return ANTHROPIC_MODELS[0].id;
    return localStorage.getItem("arya-llm-model") || ANTHROPIC_MODELS[0].id;
  });
  const [keyInput, setKeyInput] = useState("");

  useEffect(() => {
    localStorage.setItem("arya-llm-provider", provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem("arya-llm-model", model);
  }, [model]);

  const saveKey = () => {
    if (!keyInput.trim()) return;
    setApiKey(keyInput.trim());
    localStorage.setItem("arya-llm-api-key", keyInput.trim());
    setKeyInput("");
  };

  const clearKey = () => {
    setApiKey("");
    localStorage.removeItem("arya-llm-api-key");
  };

  const maskedKey = apiKey ? `••••••••${apiKey.slice(-4)}` : "";

  return (
    <Card icon={Brain} title="LLM Configuration" desc="API key and model for the agent swarm.">
      <div className="flex gap-1 rounded-lg border border-border bg-foreground/5 p-1">
        <button
          onClick={() => { setProvider("anthropic"); setModel(ANTHROPIC_MODELS[0].id); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${provider === "anthropic" ? "bg-secondary/20 text-secondary" : "text-on-surface-variant hover:text-foreground"}`}
        >
          Anthropic
        </button>
        <button
          onClick={() => { setProvider("openrouter"); setModel(""); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${provider === "openrouter" ? "bg-secondary/20 text-secondary" : "text-on-surface-variant hover:text-foreground"}`}
        >
          OpenRouter
        </button>
      </div>

      <div className="rounded-lg border border-border bg-foreground/5 px-3.5 py-2.5">
        <div className="label-eyebrow mb-1.5">API Key</div>
        {apiKey ? (
          <div className="flex items-center justify-between">
            <span className="text-mono text-sm">{maskedKey}</span>
            <button onClick={clearKey} className="text-[10px] font-semibold uppercase tracking-wider text-destructive transition hover:text-destructive/80">
              Clear
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveKey()}
              placeholder={provider === "anthropic" ? "sk-ant-..." : "sk-or-..."}
              className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            <button onClick={saveKey} className="rounded-md bg-secondary/15 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary/25">
              Save
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-foreground/5 px-3.5 py-2.5">
        <div className="label-eyebrow mb-1.5">Model</div>
        {provider === "anthropic" ? (
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
          >
            {ANTHROPIC_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="anthropic/claude-3.5-sonnet"
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        )}
      </div>

      {apiKey && (
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-tertiary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
          <span className="size-1.5 rounded-full bg-tertiary" /> Key saved
        </span>
      )}
    </Card>
  );
}
