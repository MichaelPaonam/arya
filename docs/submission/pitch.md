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

## Smart Accounts (ERC-4337) - Bounded Agent Autonomy

The biggest UX problem in agent-based DeFi: users must sign every single transaction. Approve token? Sign. Execute swap? Sign. Set up monitoring? Sign. This is friction that kills adoption and makes demos painful.

ARYA solves this with **ERC-4337 account abstraction**. Over 40 million smart accounts are deployed across Ethereum and L2s, with 100+ million UserOperations executed in 2024 alone (sources: [Ethereum.org](https://ethereum.org/en/roadmap/account-abstraction/), [Alchemy](https://www.alchemy.com/overviews/what-is-account-abstraction)).

### How It Works in ARYA

```
Traditional: User signs every action → clunky, slow, terrible demo
Smart Account: User defines bounds once → agents operate freely within them
```

**Session keys** are the key innovation. The user grants the Executor Agent a time-limited, scope-limited permission:

- "Allow swaps up to $500, only on Uniswap, for 7 days"
- Agent operates within those boundaries - no further wallet signatures
- Boundaries enforced by the smart contract, not just the UI
- User can revoke at any time

### Cost Effectiveness

| Scenario | Without 4337 | With 4337 |
|----------|-------------|-----------|
| Approve + swap | 2 transactions, 2 gas payments, 2 signatures | 1 batched UserOperation, 1 gas payment, 0 signatures (session key) |
| 5 strategies in a day | 10 signatures + 10 gas fees | 1 session key grant + 5 auto-executed UserOps |
| New user onboarding | Must acquire native tokens for gas first | Paymaster sponsors gas - zero friction |
| Pay gas in USDC | Not possible with EOA | Paymaster accepts stablecoin payment |

### Why This Matters for Investors

Session keys move human-in-the-loop from **per-transaction** to **per-policy**:
- Still human-controlled (user sets the bounds)
- Still on-chain enforced (smart contract validates every UserOperation against session permissions)
- But dramatically better UX (agents feel autonomous while actually being bounded)

This is the difference between "AI assistant that asks permission for every keystroke" and "AI assistant that operates within your defined guidelines." The latter is what users actually want.

---

## Ease of Use

1. **Connect wallet** - One click via RainbowKit (MetaMask, WalletConnect, Coinbase Wallet)
2. **Smart account created automatically** - ERC-4337 account deployed on first login, no user action needed
3. **Grant session key** - Define spending limits and allowed protocols for the agent (one signature, lasts 7 days)
4. **Set risk threshold** - Slide to your comfort level (1-10)
5. **Browse strategies** - AI agents surface opportunities with risk scores, expected returns, and swap routes
6. **Approve or reject** - For strategies within session bounds, agents execute automatically. Above bounds, one click + wallet signature.

No CLI. No config files. No repeated signing. No native token required (paymaster sponsors gas). The complexity lives in the agents, not the UI.

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

### MEV Protection

MEV (Maximal Extractable Value) bots have extracted over **$1.43 billion** from Ethereum users through sandwich attacks, front-running, and back-running ([MEV Blocker](https://mevblocker.io/)). Any DeFi platform that executes swaps without MEV awareness is leaving its users exposed.

ARYA mitigates MEV at the agent level today and has a clear path to stronger protection:

**Current mitigations:**

| Protection | How It Works |
|-----------|-------------|
| **Slippage control** | Risk Agent calculates tight slippage tolerances based on pool liquidity depth. Sandwich attacks become unprofitable when the allowed slippage window is narrow. MEV Blocker recommends this as a baseline: "you should ALWAYS set slippage control to have multiple protections in place." |
| **Route optimization** | Uniswap Trading API splits trades across pools to minimize price impact, reducing the profitable MEV surface. |
| **UniswapX integration path** | UniswapX uses Dutch auctions where fillers compete to give users better prices. Orders filled from filler inventory cannot be sandwiched, and MEV is returned to swappers as improved pricing ([Uniswap Blog](https://blog.uniswap.org/uniswapx-protocol)). |
| **Transaction preview** | Dashboard shows the exact swap route, expected output, and minimum received before the user approves. No blind transactions. |

**Future: Private transaction submission.**

| Solution | Mechanism | User Benefit |
|----------|-----------|-------------|
| **Flashbots Protect** | Routes transactions through a private mempool via Flashbots Auction, bypassing the public mempool ([Flashbots](https://www.flashbots.net/)) | Eliminates front-running and sandwich attacks entirely |
| **MEV Blocker** | Order Flow Auction where searchers bid for backrunning rights but cannot frontrun or sandwich. 90% of backrun profits rebated to users ([MEV Blocker](https://mevblocker.io/)) | Users earn from their own order flow - **$219B+ protected, 5.5K+ ETH rebated** across 62M+ transactions |
| **MEV-Share** | Users selectively share transaction data and receive compensation for MEV their orders generate ([Flashbots](https://www.flashbots.net/)) | Turns MEV from a user cost into a user revenue stream |

These integrations are configuration changes in the Executor Agent's transaction submission path - swap to a private RPC endpoint instead of the public mempool. No contract changes required.

### Stablecoin-Aware Volatility Protection

The global stablecoin market cap exceeds **$320 billion** ([DefiLlama](https://defillama.com/stablecoins)), with USDT commanding ~59% dominance. Stablecoins are the backbone of DeFi lending, borrowing, and yield farming - and a critical tool for portfolio risk management ([Chainalysis](https://www.chainalysis.com/blog/stablecoins-most-popular-asset/)).

ARYA's agents treat stablecoins as a **first-class defensive strategy**, not just another token:

**How agents use stablecoins for volatility protection:**

| Strategy | Agent Role | How It Works |
|----------|-----------|-------------|
| **Flight to safety** | Risk Agent detects elevated market volatility (price swings, volume spikes, funding rate extremes) and recommends partial conversion to stablecoins | Locks in gains during bull runs, preserves capital during downturns ([Flipster](https://flipster.io/blog/how-traders-can-use-stablecoins-to-manage-volatility-in-crypto-markets)) |
| **Stablecoin yield farming** | Scout Agent discovers stablecoin-only yield opportunities (Aave/Compound lending, Curve stablecoin pools) as low-risk alternatives | Earns passive yield with near-zero impermanent loss - stablecoins "reduce impermanent loss and maintain the efficiency of DEXs" ([Chainalysis](https://www.chainalysis.com/blog/stablecoins-most-popular-asset/)) |
| **Stablecoin diversification** | Risk Agent scores depeg risk per stablecoin type and recommends diversification across collateral models | Mitigates single-stablecoin depeg risk - history includes UST collapse (2022), USDC depeg (2023), USDR depeg (2023) ([Binance Academy](https://www.binance.com/en/academy/articles/what-are-stablecoins)) |
| **Rebalancing triggers** | KeeperHub monitoring detects when volatile asset allocation exceeds user's risk threshold and triggers rebalance toward stablecoins | Automated portfolio defense without manual monitoring |

**Stablecoin types the Risk Agent understands:**

| Type | Examples | Collateral | Depeg Risk Profile |
|------|---------|-----------|-------------------|
| Fiat-backed | USDT, USDC, GUSD | 1:1 USD reserves | Low (depends on issuer reserves and regulatory status) |
| Crypto-backed | DAI | Over-collateralized (200%+ in ETH/other crypto) | Medium (liquidation cascades in severe crashes) |
| Algorithmic | FRAX | Algorithm-managed supply | Higher (UST collapse demonstrated systemic risk) |
| Commodity-backed | XAUT, PAXG | Physical gold | Low (but less liquid, redeemable for physical gold) |

Sources: [Gemini Cryptopedia](https://www.gemini.com/cryptopedia/what-are-stablecoins-how-do-they-work), [Chainalysis](https://www.chainalysis.com/blog/stablecoins-most-popular-asset/)

**Why LLM agents matter here:** A rule-based bot can trigger a stablecoin rebalance when price drops 5%. An LLM agent can reason about *why* the market is dropping - a protocol exploit (flee immediately) vs a temporary liquidation cascade (wait it out) vs a macro event (gradual de-risk). Context determines the right response.

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

### Yield Tokenization & On-Chain Fixed Income

The next frontier for ARYA is **yield tokenization** - decomposing yield-bearing assets into their principal and forward yield components, then trading the spread.

**The mental model:** Yield tokenization turns time-based returns into tradable assets. A yield-bearing position (e.g., staked ETH earning 4% APY) is split into:

- **PT (Principal Token)** - Redeemable for the underlying asset at maturity. Trades at a discount representing the implied fixed rate.
- **YT (Yield Token)** - Captures all future yield until maturity. Price reflects the market's bet on what the variable rate will be.

This is the DeFi equivalent of fixed income trading - stripping a bond into principal and coupon components.

**Why this is perfect for LLM agents:**

| Signal | What the Agent Does |
|--------|-------------------|
| **Implied vs realized yield spread** | Pendle's YT prices imply a forward yield rate. The Scout Agent compares this to actual on-chain rates from lending protocols. When implied yield is 15% but realized yield is 10%, there's a mispricing the agent surfaces. |
| **Time-to-expiry decay** | YT value decays toward zero at maturity. The Risk Agent models this decay curve and flags when the risk/reward of holding YT shifts unfavorably. |
| **Rate direction reasoning** | Rule-based bots can't reason about whether rates will rise or fall. An LLM agent can synthesize governance proposals, protocol upgrades, and macro conditions to form a directional view. |
| **Cross-protocol arbitrage** | The same underlying yield (e.g., stETH) may be tokenized on Pendle with different implied rates than what Aave or Compound offer. Agents identify these cross-protocol spreads. |

**How it fits ARYA's architecture:**

```
Scout Agent monitors:
  - Pendle PT/YT pricing (implied yield)
  - DefiLlama/Aave/Compound spot rates (realized yield)
  - Spread = implied - realized
        |
        v
Risk Agent evaluates:
  - Spread magnitude vs historical norms
  - Time to maturity (decay risk)
  - Directional confidence
  - Liquidity depth of PT/YT markets
        |
        v
Strategy Proposal:
  "Pendle YT-stETH implies 8.2% APY but Lido is paying 4.1%.
   The market is pricing in a rate increase that hasn't materialized.
   Selling YT and locking in PT at 6.5% fixed captures the spread
   with 47 days to maturity."
        |
        v
User approves or rejects (human-in-the-loop)
```

This transforms ARYA from a yield farming optimizer into an **on-chain fixed income desk** - a category that barely exists in DeFi today but represents billions in TradFi.

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
