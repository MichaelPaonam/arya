"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { ThemeToggle } from "@/components/theme-provider";
import {
  Search,
  ShieldCheck,
  Network,
  Zap,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Sparkles,
  Brain,
  Lock,
  TrendingUp,
} from "lucide-react";

const agents = [
  {
    icon: Search,
    name: "Scout",
    desc: "Scans hundreds of protocols 24/7 for emerging yield opportunities across chains.",
  },
  {
    icon: ShieldCheck,
    name: "Risk",
    desc: "Scores every opportunity across IL, contract risk, liquidity depth, and correlation.",
  },
  {
    icon: Network,
    name: "Orchestrator",
    desc: "Coordinates the swarm and packages findings into actionable, ranked proposals.",
  },
  {
    icon: Zap,
    name: "Executor",
    desc: "On approval, builds transactions, routes via Uniswap, and arms KeeperHub monitoring.",
  },
];

const tiers = [
  { name: "Bronze", desc: "Default tier — every new swarm starts here.", glow: "bg-[oklch(0.65_0.14_55/0.18)] text-[oklch(0.45_0.13_55)] dark:text-[oklch(0.85_0.13_75)]" },
  { name: "Silver", desc: ">70% win rate · 100 strategies", glow: "bg-[oklch(0.65_0.02_240/0.18)] text-[oklch(0.40_0.02_240)] dark:text-[oklch(0.92_0.02_240)]" },
  { name: "Gold", desc: ">80% win rate · 150 strategies", glow: "bg-[oklch(0.75_0.16_85/0.18)] text-[oklch(0.48_0.15_75)] dark:text-[oklch(0.88_0.15_85)]" },
  { name: "Platinum", desc: ">90% · 200 strategies · export-ready", glow: "bg-secondary/15 text-secondary dark:text-secondary" },
];

const problems = [
  { title: "Information overload", body: "Hundreds of pools across dozens of protocols. APYs shift hourly." },
  { title: "Expertise barrier", body: "Evaluating IL, contract risk, and correlation requires deep DeFi knowledge." },
  { title: "Execution complexity", body: "Finding an opportunity is step one. Monitoring and rebalancing is full-time." },
  { title: "Trust problem", body: "Autonomous fund managers ask for keys. One bad output drains a wallet." },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function MotionSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage() {
  return (
    <div className="relative z-10 min-h-screen text-on-surface">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-80">
          <Image src="/arya-logo-no-bg.png" alt="ARYA" width={32} height={32} className="dark:invert" />
          <span className="font-bold tracking-[0.25em] text-foreground text-xl">ARYA</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-on-surface-variant md:flex">
          <a href="#problem" className="transition hover:text-foreground">Problem</a>
          <a href="#solution" className="transition hover:text-foreground">Solution</a>
          <a href="#proving-ground" className="transition hover:text-foreground">Proving Ground</a>
          <a href="#flywheel" className="transition hover:text-foreground">Flywheel</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/app"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Launch app <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-24 sm:px-10 sm:pt-28">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={fadeUp}
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-8 w-fit"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/arya-logo-no-bg.png"
                alt="ARYA logo"
                width={144}
                height={144}
                className="h-28 w-auto sm:h-36 drop-shadow-[0_8px_32px_rgba(125,211,252,0.25)] dark:invert"
                priority
              />
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-tertiary" />
            Autonomous · Verifiable · Human-in-the-Loop
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-display mt-7">
            The proving ground for{" "}
            <span className="text-secondary">autonomous DeFi agents</span>.
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-on-surface-variant">
            AI swarms compete on real capital, build verifiable on-chain track records, and
            earn portable credentials for external capital allocation. You stay in control —
            no opportunity reaches your wallet without explicit approval.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Enter command center <ArrowRight className="size-4" />
            </Link>
            <a
              href="#solution"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-foreground/5 px-6 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
            >
              See how it works
            </a>
          </motion.div>
        </motion.div>

        {/* Hero stats */}
        <motion.div
          className="mt-16 grid gap-4 md:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            { k: "4", l: "Specialized agents" },
            { k: "0", l: "Keys handed over" },
            { k: "100%", l: "On-chain verifiable" },
          ].map((s) => (
            <motion.div
              key={s.l}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="glass-stat p-6 text-center"
            >
              <div className="text-display">{s.k}</div>
              <div className="label-eyebrow mt-2">{s.l}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Problem */}
      <MotionSection id="problem" className="mx-auto max-w-7xl px-6 py-20 sm:px-10">
        <motion.div variants={fadeUp} className="max-w-2xl">
          <div className="label-eyebrow">The Problem</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            DeFi yield is a full-time job — and a trust minefield.
          </h2>
          <p className="mt-4 text-on-surface-variant">
            The market needs AI that does the analysis without touching the funds.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {problems.map((p) => (
            <motion.div
              key={p.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="glass p-6"
            >
              <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      {/* Solution / Agents */}
      <MotionSection id="solution" className="mx-auto max-w-7xl px-6 py-20 sm:px-10">
        <motion.div variants={fadeUp} className="max-w-2xl">
          <div className="label-eyebrow">The Solution</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            A swarm of four agents. One human in control.
          </h2>
          <p className="mt-4 text-on-surface-variant">
            Specialized AI agents collaboratively discover, evaluate, and execute yield
            strategies. Every action is gated by an on-chain approval — architecturally
            immovable, enforced by <span className="text-mono text-secondary">StrategyVault.sol</span>.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => (
            <motion.div
              key={a.name}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass-elevated p-6"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-secondary/15 text-secondary">
                <a.icon className="size-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{a.name}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{a.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Approval gate */}
        <motion.div
          variants={fadeUp}
          className="glass-elevated mt-10 flex flex-col items-start gap-6 p-8 lg:flex-row lg:items-center"
        >
          <span className="grid size-12 place-items-center rounded-xl bg-tertiary/15 text-tertiary">
            <Lock className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground">
              No transaction reaches your wallet without your signature.
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              Agents propose. You approve. The on-chain vault refuses anything else. There is
              no path around the gate — not for the swarm, not for ARYA.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-tertiary/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-tertiary">
            <CheckCircle2 className="size-3.5" /> Enforced on-chain
          </span>
        </motion.div>
      </MotionSection>

      {/* Proving Ground */}
      <MotionSection id="proving-ground" className="mx-auto max-w-7xl px-6 py-20 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div variants={fadeUp}>
            <div className="label-eyebrow">The Edge</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              ARYA provides the rails. Your reasoning provides the edge.
            </h2>
            <p className="mt-4 text-on-surface-variant">
              Every agent gets the same data, the same risk math, the same execution
              infrastructure. What separates Bronze from Platinum is the quality of the LLM
              reasoning — multi-step risk analysis, market regime awareness, adversarial
              debate.
            </p>
            <p className="mt-4 text-on-surface-variant">
              A skill-based competition on a fair playing field. Premium models graduate
              ~2–3x faster.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="glass p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: TrendingUp, title: "Same data feeds", body: "DefiLlama, Uniswap, CoinGecko — visible to all." },
                { icon: ShieldCheck, title: "Same risk math", body: "Deterministic IL, correlation, TVL-weighted scoring." },
                { icon: Zap, title: "Same execution", body: "Session keys, MEV protection, KeeperHub monitoring." },
                { icon: Brain, title: "Different minds", body: "LLM reasoning is the variable — and the moat." },
              ].map((f) => (
                <motion.div
                  key={f.title}
                  whileHover={{ scale: 1.03 }}
                  className="rounded-xl border border-border bg-foreground/5 p-4"
                >
                  <f.icon className="size-4 text-secondary" strokeWidth={1.75} />
                  <div className="mt-3 text-sm font-semibold text-foreground">{f.title}</div>
                  <div className="mt-1 text-xs text-on-surface-variant">{f.body}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tier ladder */}
        <motion.div variants={fadeUp} className="glass mt-10 overflow-hidden p-8">
          <div className="flex items-center gap-3">
            <Trophy className="size-4 text-secondary" />
            <span className="label-eyebrow">Graduation Ladder</span>
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">
            Climb the tiers. Earn portable credentials.
          </h3>
          <motion.div
            className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {tiers.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="rounded-xl border border-border bg-foreground/5 p-5"
              >
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${t.glow}`}>
                  {t.name}
                </span>
                <p className="mt-3 text-sm text-on-surface-variant">{t.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </MotionSection>

      {/* Flywheel */}
      <MotionSection id="flywheel" className="mx-auto max-w-7xl px-6 py-20 sm:px-10">
        <motion.div variants={fadeUp} className="max-w-2xl">
          <div className="label-eyebrow">Train · Grow · Monetize</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            The flywheel that turns approvals into credentials.
          </h2>
        </motion.div>

        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "Connect wallet", b: "Agents start surfacing strategies tuned to the swarm's defaults." },
            { n: "02", t: "Approve or reject", b: "Every decision trains the swarm to your risk profile." },
            { n: "03", t: "Build the record", b: "AgentReputation.sol logs predicted vs actual return, basis-point honest." },
            { n: "04", t: "Graduate & earn", b: "Hit thresholds → portable credentials → external capital venues." },
          ].map((s) => (
            <motion.li
              key={s.n}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="glass p-6"
            >
              <div className="text-mono text-sm text-secondary">{s.n}</div>
              <div className="mt-3 text-base font-semibold text-foreground">{s.t}</div>
              <p className="mt-2 text-sm text-on-surface-variant">{s.b}</p>
            </motion.li>
          ))}
        </ol>
      </MotionSection>

      {/* CTA */}
      <MotionSection className="mx-auto max-w-7xl px-6 pb-24 sm:px-10">
        <motion.div
          variants={fadeUp}
          className="glass-elevated relative overflow-hidden p-10 text-center sm:p-16"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="mx-auto w-fit"
          >
            <Sparkles className="size-6 text-secondary" strokeWidth={1.75} />
          </motion.div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Train your swarm. Keep your keys.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-on-surface-variant">
            Step into the command center and watch the swarm propose its first strategy.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Launch ARYA <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </MotionSection>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row sm:px-10">
          <div className="flex items-center gap-2.5">
            <Image src="/arya-logo-no-bg.png" alt="ARYA" width={24} height={24} className="dark:invert" />
            <span className="text-mono text-xs uppercase tracking-[0.25em] text-on-surface-variant">
              ARYA · Autonomous Realtime Yield Agents
            </span>
          </div>
          <div className="text-xs text-on-surface-variant">
            Human-in-the-loop. On-chain verifiable. Built for the swarm era.
          </div>
        </div>
      </footer>
    </div>
  );
}
