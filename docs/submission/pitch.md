# ARYA - Investor Pitch

## One-Liner

ARYA is a market-ready SaaS platform where AI agents find the best DeFi yields and humans keep control of the money.

---

## The Problem

Yield farming in 2026 is broken for most people:

- **Information overload** - Hundreds of pools across dozens of protocols. APYs shift hourly. No single dashboard aggregates risk-adjusted returns.
- **Expertise barrier** - Evaluating impermanent loss, smart contract risk, and portfolio correlation requires deep DeFi knowledge most users don't have.
- **Execution complexity** - Finding an opportunity is step one. Executing the swap, monitoring the position, and rebalancing on time is a full-time job.
- **Trust problem** - Fully autonomous "AI fund managers" ask users to hand over their keys. One bad model output can drain a wallet.

**The market needs AI that does the analysis without touching the funds.**

---

## The Solution

ARYA is a swarm of four specialized AI agents that collaboratively discover, evaluate, and execute yield farming strategies - with the human always in control.

**Agents analyze. Humans decide. Smart contracts enforce.**

| Agent | What It Does |
|-------|-------------|
| **Scout** | Scans protocols 24/7 for yield opportunities using real-time on-chain and off-chain data |
| **Risk** | Scores every opportunity across impermanent loss, contract risk, liquidity depth, and portfolio correlation |
| **Orchestrator** | Coordinates the swarm, packages findings into actionable strategy proposals |
| **Executor** | On user approval, builds and submits transactions via Uniswap, then sets up automated monitoring via KeeperHub |

No opportunity reaches the user's wallet without explicit approval. The `StrategyVault` smart contract enforces this on-chain - not just a UI checkbox, an architecturally immovable gate.

---

## Why LLM-Powered Agents, Not Rule-Based Bots

Traditional yield farming tools use hardcoded rules: "if APY > 10% and TVL > $1M, show it." This breaks in three ways:

| Limitation | Rule-Based | LLM-Powered Agent |
|-----------|-----------|-------------------|
| **New protocols** | Rules must be manually written for every new protocol. A new yield source launches and the bot is blind until a developer updates the config. | Agents reason about unfamiliar protocols by reading pool parameters, token mechanics, and on-chain data - no rule update needed. |
| **Context & nuance** | Rules can't weigh soft factors: "this protocol's team shipped three audits in six months" vs "this fork has no audit and launched yesterday." | LLM reasoning evaluates qualitative signals alongside quantitative data, producing risk assessments that reflect real-world context. |
| **Explanation** | Rules output a number. Users see "Risk: 7/10" with no explanation of why. | Agents produce natural language reasoning: "Risk is elevated because the pool has $800K TVL with 90% concentrated in a single LP, creating withdrawal liquidity risk." |
| **Cross-protocol correlation** | Rules evaluate each pool in isolation. They can't detect that three "safe" pools all depend on the same underlying asset. | Agents analyze portfolio-level correlation, flagging concentration risk across positions. |
| **Adaptation** | Rules are static. Market conditions change, rules don't. | Agents adapt their analysis as conditions shift - weighing recent volatility, governance changes, and protocol upgrades. |

**The bottom line:** Rule-based bots are calculators. LLM agents are analysts. ARYA needs analysts because yield farming decisions depend on context, not just thresholds.

ARYA still uses rules where rules are better - impermanent loss math is a formula, not a judgment call. The LLM layer handles what rules can't: synthesizing multiple signals into a coherent risk narrative that a human can actually understand and act on.

---

## Yield Farming for Everyone

DeFi yield farming has historically been inaccessible to anyone who isn't already deep in crypto. The jargon alone is a barrier: impermanent loss, liquidity pools, concentrated liquidity ranges, fee tiers, slippage tolerance. ARYA removes that barrier.

### What ARYA Does for Newcomers

- **Plain language explanations** - Every strategy comes with an agent-written summary: "This pool pairs ETH and USDC on Uniswap v3. You'd earn ~12% APY from trading fees. The main risk is if ETH drops sharply, you'd end up holding more ETH and less USDC than you started with - that's called impermanent loss, and the Risk Agent estimates it at ~3% over 30 days."
- **Risk scores, not jargon** - Users see a 1-10 risk score and a radar chart, not raw DeFi metrics. The complexity is processed by agents, not pushed to the user.
- **Guided decision-making** - The dashboard doesn't just show data. It shows a recommendation with reasoning. Users learn yield farming concepts naturally by reading agent explanations alongside their portfolio.
- **No direct smart contract interaction** - Users never need to call `approve()`, calculate `sqrtPriceX96`, or set a tick range. ARYA's Executor Agent handles transaction construction. The user clicks Approve and signs with their wallet.

### Realising Potential Income

Most DeFi users leave money on the table because they don't know where to look, can't evaluate risk, or don't have time to monitor positions. ARYA changes that:

- **Discovery** - The Scout Agent scans hundreds of pools 24/7. Opportunities that a manual user would never find are surfaced automatically.
- **Optimization** - The Risk Agent evaluates risk-adjusted returns, not just raw APY. A 50% APY pool with extreme impermanent loss risk is flagged; a 12% pool with stable fundamentals is recommended.
- **Monitoring** - KeeperHub automation watches active positions and alerts when conditions change. No more logging in daily to check if a pool is still healthy.
- **Learning over time** - Agent performance is tracked on-chain. Users can see which agents have the best prediction accuracy and weight their trust accordingly.

**ARYA turns yield farming from a full-time job into a 5-minute decision.**

---

## Market-Ready SaaS Product

ARYA is not a hackathon prototype that needs "productionization." It is deployed as a live SaaS from day one:

- **Vercel serverless deployment** - Frontend, agent runtime, and cron jobs in a single deploy. No infrastructure to manage.
- **Wallet-based login** - Connect MetaMask, sign a message, start using the platform. No email, no password, no onboarding friction.
- **Session persistence** - User preferences, API keys, and strategy history persist across sessions via Upstash Redis.
- **Live demo URL** - Judges, investors, and users access the same production deployment.

The architecture that runs the hackathon demo is the same architecture that scales to thousands of users.

---

## Ease of Use

1. **Connect wallet** - One click via RainbowKit (MetaMask, WalletConnect, Coinbase Wallet)
2. **Enter API key** - Paste your Anthropic key in Settings (optional - platform works without it in limited mode)
3. **Set risk threshold** - Slide to your comfort level (1-10)
4. **Browse strategies** - AI agents surface opportunities with risk scores, expected returns, and swap routes
5. **Approve or reject** - One click + wallet signature to execute

No CLI. No config files. No smart contract interactions. The complexity lives in the agents, not the UI.

---

## Responsible AI Usage

ARYA is designed around the principle that **AI should augment human decision-making, not replace it** - especially when real money is at stake.

### Triple-Layer Human-in-the-Loop

| Layer | Mechanism | What It Prevents |
|-------|-----------|-----------------|
| **Smart Contract** | `StrategyVault.sol` requires owner signature for every fund movement | Rogue agent transactions - even if the backend is compromised, funds cannot move without the user's wallet signing |
| **Agent Orchestration** | LangGraph.js `interrupt()` pauses the pipeline at the approval step | Automated execution without human review |
| **Dashboard UI** | Visual risk analysis, swap preview, and explicit Approve/Reject buttons | Uninformed decisions - users see exactly what they're approving |

### On-Chain Accountability

- Every agent has a verifiable on-chain identity via ERC-7857 iNFT on 0G Chain
- Every decision is recorded on-chain via `AgentReputation.sol`
- Agent performance (predicted vs actual APY) builds a public, immutable track record
- Users can see which agent recommended what and how accurate it has been

### Transparent Risk Scoring

- Risk scores are computed, not hallucinated - based on impermanent loss math, TVL depth, protocol age, and audit history
- LLM reasoning is used for natural language explanations, not for the scores themselves
- Users without an API key still get rule-based risk analysis (limited mode)

---

## On-Chain Verifiable & Data-Rich Dashboards

### Verifiable Agent Identity

Each agent in the swarm mints an ERC-7857 iNFT on 0G Chain with encrypted metadata storing model configuration and strategy weights. Anyone can verify on-chain:
- Which agents are active in the swarm
- What model each agent runs
- The complete decision history of every agent

### Dashboard Pages

| Page | Insights |
|------|----------|
| **Strategy Feed** | Live opportunity cards with APY, risk score, recommending agent, and confidence level |
| **Strategy Detail** | Risk radar chart (IL, contract, market, liquidity, correlation), Uniswap swap route, estimated gas, slippage |
| **Portfolio** | Current positions, total yield earned, risk distribution, P&L tracking |
| **Agent Registry** | iNFT cards with on-chain identity, reputation scores, accuracy history, activity timeline |
| **Execution History** | Full audit trail - proposed, approved, executed, and failed strategies with outcomes |

### Data Sources

- **Real-time**: DefiLlama (pool APYs, TVL, protocol data), Uniswap Trading API (swap routes, gas estimates), CoinGecko (token prices)
- **On-chain**: 0G Chain (agent identity, decision records, reputation scores), 0G Storage (agent memory, strategy history)
- **Computed**: Risk scores, impermanent loss estimates, portfolio correlation, agent accuracy metrics

---

## Future Scope - AI Model Agnostic

ARYA's agent architecture is designed to work with **any LLM provider**, not just Anthropic:

### Multi-Provider Roadmap

| Phase | Provider | Models | Status |
|-------|----------|--------|--------|
| 1 | Anthropic | Claude Haiku 4.5, Sonnet 4.6 | Current |
| 2 | OpenAI | GPT-4o-mini, GPT-4o | Planned |
| 3 | Open-source via Groq/Together | Llama, Mistral, Gemma | Planned |
| 4 | Intelligent routing | Auto-select cheapest model per task | Planned |

### Why This Matters

- **No vendor lock-in** - Users choose the model that fits their budget and accuracy requirements
- **Cost optimization** - Simple tasks (pool scanning) use cheap models; complex tasks (multi-protocol risk analysis) use premium models
- **Regulatory flexibility** - Some jurisdictions may restrict specific AI providers; ARYA adapts
- **Performance competition** - As new models launch, ARYA can integrate them immediately without architectural changes

### How It Works

The agent layer abstracts LLM calls behind a unified interface. Swapping providers is a configuration change, not a rewrite. Each agent specifies what it needs (structured JSON analysis, risk reasoning, natural language explanation) and the routing layer selects the best model for the task.

---

## Pricing Model

### Standard Plan (Free)

- User provides their own Anthropic API key (BYOK - Bring Your Own Key)
- Full access to all agents, strategies, and dashboard features
- User pays Anthropic directly based on token usage (~$2-10/month on Haiku)
- ARYA platform itself is completely free

### Limited Mode (No API Key)

- No LLM API key required
- Scout Agent discovers opportunities using on-chain data (no LLM needed)
- Risk Agent uses rule-based heuristics (IL calculation, TVL thresholds, protocol age)
- No natural language reasoning or strategy explanations
- Upgrade prompt nudges toward Standard plan

### Premium Plan (Future - ~$20-30/month)

- ARYA provides the LLM - no API key needed
- Access to higher-tier models (Sonnet for complex multi-protocol strategies)
- Priority agent execution (more frequent scans)
- Advanced analytics and strategy backtesting

### Why This Model Works

| | Standard | Premium |
|--|---------|---------|
| **User cost** | ~$2-10/mo (LLM only) | ~$20-30/mo subscription |
| **ARYA cost per user** | $0 | ~$5-15/mo (LLM) |
| **ARYA margin** | Platform is free, growth-focused | $10-15/mo per user |

The Standard plan drives adoption at zero cost to ARYA. The Premium plan monetizes power users who want convenience and advanced features. Both plans are sustainable from day one.

---

## Why Now

- **DeFi TVL is growing** - More capital, more pools, more complexity. The problem gets worse every quarter.
- **LLM costs are plummeting** - Haiku-class models deliver strong structured analysis at $1/MTok input. A year ago this cost 10x more.
- **On-chain AI identity is new** - ERC-7857 iNFT enables verifiable agent identity for the first time. ARYA is among the first to use it.
- **Human-in-the-loop is the right framing** - After a wave of "fully autonomous AI agents" that scared users, the market is ready for AI that augments rather than replaces human judgment.

---

## Ask

ARYA is built, deployed, and demo-ready. We are looking for:

1. **Early users** who want to maximize yield farming returns without the full-time monitoring burden
2. **Partners** in the DeFi infrastructure space (DEXs, lending protocols, analytics providers)
3. **Investment** to scale the agent swarm, add cross-chain support, and build the Premium tier
