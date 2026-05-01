"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Network, Zap, Wallet, Brain, CheckCircle2 } from "lucide-react";
import { YIELD_SWARM_REGISTRY, SMART_ACCOUNT_FACTORY } from "@/lib/contracts";

type Step = "welcome" | "smart-account" | "mint-swarm" | "llm-config" | "complete";

const STEPS: Step[] = ["welcome", "smart-account", "mint-swarm", "llm-config", "complete"];

const STEP_LABELS = ["Account", "Agents", "LLM", "Ready"];

const AGENT_META = [
  { type: "scout", name: "Scout", icon: Search, desc: "Scans DeFi protocols for yield opportunities" },
  { type: "risk", name: "Risk", icon: ShieldCheck, desc: "Scores risk across IL, contract, and liquidity" },
  { type: "orchestrator", name: "Orchestrator", icon: Network, desc: "Coordinates the swarm pipeline and debate" },
  { type: "executor", name: "Executor", icon: Zap, desc: "Builds swap transactions and monitoring workflows" },
] as const;

const ANTHROPIC_MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { id: "claude-sonnet-4-6-20260320", label: "Claude Sonnet 4.6" },
  { id: "claude-opus-4-7-20260401", label: "Claude Opus 4.7" },
];

export function SetupWizard() {
  const [step, setStep] = useState<Step>("welcome");
  const { address } = useAccount();
  const router = useRouter();

  const {
    writeContract: writeSmartAccount,
    data: smartAccountHash,
    isPending: isSmartAccountPending,
  } = useWriteContract();

  const { isLoading: isSmartAccountConfirming, isSuccess: isSmartAccountSuccess } =
    useWaitForTransactionReceipt({ hash: smartAccountHash });

  const {
    writeContract: writeMintSwarm,
    data: mintSwarmHash,
    isPending: isMintPending,
  } = useWriteContract();

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } =
    useWaitForTransactionReceipt({ hash: mintSwarmHash });

  const [provider, setProvider] = useState<"anthropic" | "openrouter" | "managed">("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(ANTHROPIC_MODELS[0].id);

  const currentIndex = STEPS.indexOf(step);

  function handleDeployClick() {
    setStep("smart-account");
  }

  function handleCreateSmartAccount() {
    if (!address) return;
    writeSmartAccount({
      address: SMART_ACCOUNT_FACTORY.address,
      abi: SMART_ACCOUNT_FACTORY.abi,
      functionName: "createAccount",
      args: [address, BigInt(0)],
    });
  }

  function handleMintSwarm() {
    writeMintSwarm({
      address: YIELD_SWARM_REGISTRY.address,
      abi: YIELD_SWARM_REGISTRY.abi,
      functionName: "requestSwarm",
    });
  }

  function handleLLMSave() {
    if (apiKey) {
      localStorage.setItem("arya-llm-provider", provider);
      localStorage.setItem("arya-llm-api-key", apiKey);
      localStorage.setItem("arya-llm-model", model);
    }
    setStep("complete");
  }

  function handleSkipLLM() {
    localStorage.setItem("arya-llm-provider", "anthropic");
    localStorage.setItem("arya-llm-model", ANTHROPIC_MODELS[0].id);
    setStep("complete");
  }

  function handleComplete() {
    localStorage.setItem("arya-swarm-initialized", "true");
    router.replace("/app");
  }

  return (
    <div className="flex flex-col items-center px-6 pt-4">
      {/* Step content card */}
      <div className="glass-elevated w-full max-w-lg p-8">
        {step === "welcome" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="glass grid size-16 place-items-center rounded-xl">
              <Network className="size-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Initialize Your Swarm</h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              ARYA will deploy a smart account and provision 4 AI agents bound to your wallet.
              You&apos;ll sign two transactions on 0G Testnet.
            </p>
            <button
              onClick={handleDeployClick}
              className="inline-flex h-11 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Deploy Swarm
            </button>
          </div>
        )}

        {step === "smart-account" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="glass grid size-16 place-items-center rounded-xl">
              <Wallet className="size-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Smart Account</h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Creating a deterministic smart account for secure DeFi execution.
            </p>
            {isSmartAccountSuccess ? (
              <div className="flex items-center gap-2 text-tertiary">
                <CheckCircle2 className="size-5" />
                <span className="text-sm font-semibold">Account created</span>
              </div>
            ) : isSmartAccountConfirming || isSmartAccountPending ? (
              <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/5 px-6">
                <div className="size-4 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                <span className="text-sm font-medium text-secondary">Confirming...</span>
              </div>
            ) : (
              <button
                onClick={handleCreateSmartAccount}
                className="inline-flex h-11 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Create Account
              </button>
            )}
            <button
              onClick={() => setStep("mint-swarm")}
              disabled={!isSmartAccountSuccess}
              className="text-sm font-semibold text-secondary underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Continue
            </button>
          </div>
        )}

        {step === "mint-swarm" && (
          <div className="flex flex-col gap-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Provisioning Agents</h2>
            <p className="text-center text-sm leading-relaxed text-on-surface-variant">
              Minting 4 iNFT agents to your swarm. ARYA retains ownership; you operate them.
            </p>
            <div className="grid gap-3">
              {AGENT_META.map((agent) => {
                const Icon = agent.icon;
                const isActive = isMintSuccess;
                return (
                  <div
                    key={agent.type}
                    className={`glass flex items-center gap-4 p-4 transition-all ${
                      isActive
                        ? "!border-tertiary/30 !bg-tertiary/5"
                        : isMintConfirming || isMintPending
                          ? "animate-pulse"
                          : ""
                    }`}
                  >
                    <div
                      className={`grid size-10 place-items-center rounded-lg ${
                        isActive ? "bg-tertiary/15 text-tertiary" : "bg-on-surface-variant/10 text-on-surface-variant"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold">{agent.name}</span>
                      <p className="text-xs text-on-surface-variant">{agent.desc}</p>
                    </div>
                    {isActive && <CheckCircle2 className="size-5 text-tertiary" />}
                  </div>
                );
              })}
            </div>
            {!mintSwarmHash && !isMintPending && (
              <button
                onClick={handleMintSwarm}
                className="mx-auto inline-flex h-11 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Mint Agents
              </button>
            )}
            {(isMintPending || isMintConfirming) && !isMintSuccess && (
              <div className="mx-auto inline-flex h-11 items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/5 px-6">
                <div className="size-4 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                <span className="text-sm font-medium text-secondary">Minting agents...</span>
              </div>
            )}
            {isMintSuccess && (
              <button
                onClick={() => setStep("llm-config")}
                className="mx-auto text-sm font-semibold text-secondary underline-offset-2 hover:underline"
              >
                Continue
              </button>
            )}
          </div>
        )}

        {step === "llm-config" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="glass grid size-16 place-items-center rounded-xl">
                <Brain className="size-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Power Your Agents</h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Choose how your swarm&apos;s AI reasoning is powered.
              </p>
            </div>

            {/* Option 1: BYOK */}
            <button
              onClick={() => setProvider("anthropic")}
              className={`glass flex items-start gap-4 p-4 text-left transition-all ${
                provider !== "managed"
                  ? "!border-secondary/40 ring-1 ring-secondary/20"
                  : ""
              }`}
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary/10">
                <Zap className="size-5 text-secondary" />
              </div>
              <div>
                <span className="text-sm font-semibold">Bring Your Own Key</span>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Use your Anthropic or OpenRouter API key for full model access.
                </p>
              </div>
            </button>

            {/* BYOK expanded fields */}
            {provider !== "managed" && (
              <div className="flex flex-col gap-3 pl-1">
                <div className="flex gap-2">
                  {(["anthropic", "openrouter"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setProvider(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                        provider === p
                          ? "bg-secondary/15 text-secondary"
                          : "bg-on-surface-variant/5 text-on-surface-variant hover:bg-on-surface-variant/10"
                      }`}
                    >
                      {p === "anthropic" ? "Anthropic Direct" : "OpenRouter"}
                    </button>
                  ))}
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === "anthropic" ? "sk-ant-api03-..." : "sk-or-v1-..."}
                  className="h-11 w-full rounded-xl border border-[--glass-border] bg-[--glass-1-bg] px-4 text-sm text-foreground outline-none backdrop-blur-[20px] transition placeholder:text-on-surface-variant/50 focus:border-secondary focus:shadow-[0_0_0_2px_rgba(125,211,252,0.15)]"
                />
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-[--glass-border] bg-[--glass-1-bg] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238BAFC4%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat px-4 pr-10 text-sm text-foreground outline-none backdrop-blur-[20px] transition focus:border-secondary focus:shadow-[0_0_0_2px_rgba(125,211,252,0.15)]"
                >
                  {ANTHROPIC_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-background text-foreground">{m.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Option 2: Managed */}
            <button
              onClick={() => { setProvider("managed" as typeof provider); setApiKey(""); }}
              className={`glass flex items-start gap-4 p-4 text-left transition-all ${
                provider === "managed"
                  ? "!border-secondary/40 ring-1 ring-secondary/20"
                  : ""
              }`}
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-tertiary/10">
                <CheckCircle2 className="size-5 text-tertiary" />
              </div>
              <div>
                <span className="text-sm font-semibold">Free Managed Tier</span>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  We&apos;ll use Claude Haiku 4.5 at no cost. Upgrade anytime in Settings.
                </p>
              </div>
            </button>

            {/* Action */}
            <button
              onClick={provider === "managed" ? handleSkipLLM : handleLLMSave}
              disabled={provider !== "managed" && !apiKey}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="glass grid size-16 place-items-center rounded-xl">
              <CheckCircle2 className="size-8 text-tertiary" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Your Swarm is Ready</h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              4 agents provisioned and bound to your wallet. They&apos;ll begin scanning for yield opportunities immediately.
            </p>
            <button
              onClick={handleComplete}
              className="inline-flex h-11 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Enter Command Center
            </button>
          </div>
        )}
      </div>

      {/* Timeline / milestones below the card */}
      <div className="mt-10 flex w-full max-w-lg items-start">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center">
            {/* Connector line + dot */}
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : i <= currentIndex ? "bg-tertiary" : "bg-on-surface-variant/20"}`} />
              <div
                data-testid="step-dot"
                className={`relative z-10 grid size-8 place-items-center rounded-full border-2 transition-colors ${
                  i < currentIndex
                    ? "border-tertiary bg-tertiary/10"
                    : i === currentIndex
                      ? "border-secondary bg-secondary/10"
                      : "border-on-surface-variant/30 bg-transparent"
                }`}
              >
                {i < currentIndex ? (
                  <CheckCircle2 className="size-4 text-tertiary" />
                ) : (
                  <span className={`text-xs font-semibold ${i === currentIndex ? "text-secondary" : "text-on-surface-variant/50"}`}>
                    {i + 1}
                  </span>
                )}
              </div>
              <div className={`h-0.5 flex-1 ${i === STEP_LABELS.length - 1 ? "bg-transparent" : i < currentIndex ? "bg-tertiary" : "bg-on-surface-variant/20"}`} />
            </div>
            {/* Label */}
            <span className={`mt-2 text-xs font-medium uppercase tracking-[0.04em] ${
              i <= currentIndex ? "text-foreground" : "text-on-surface-variant/60"
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
