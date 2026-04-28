# Billing & Revenue Model

## Core Principle

LLM costs are the biggest variable expense. Instead of absorbing them, shift the cost to users on the Standard plan by requiring their own API key (BYOK - Bring Your Own Key). This makes ARYA sustainable from day one. Revenue scales through graduation fees as users train agents for external marketplaces.

---

## ARYA's Revenue Streams

| Stream | Source | When | Margin |
|--------|--------|------|--------|
| **Premium subscriptions** | $20-30/month per Premium user | From launch | ~$10-15/user after LLM costs |
| **Graduation infrastructure fee** | 10% of graduated agent's marketplace revenue (Premium) / 20% (Standard) / 5% (Strategy Contributors) | 3-6 months post-launch | ~90% margin (no incremental cost) |
| **Paymaster gas margin** | Small markup on gas sponsorship (users pay USDC, ARYA batches) | From launch | ~5-10% on gas costs |
| **Prodigy-improved base model** | Better base model → higher platform-wide win rates → more agents graduate → more graduation fees | After 1,000+ active users | Compounds without additional spend |
| **Template licensing (future)** | Platinum-tier strategy templates sold to external builders | 6+ months | High margin (one-time creation, recurring sales) |

**Revenue compounding:** Graduated agents earn indefinitely. Year 2 revenue includes Year 1 graduates still earning. Each new graduate adds to recurring revenue without additional acquisition cost.

---

## User Passive Income Opportunities

| Income Source | How It Works | Who Gets It |
|--------------|-------------|-------------|
| **Yield farming returns** | Agents discover and execute yield strategies. User earns APY on deployed capital. | All users |
| **Agent marketplace revenue** | Once graduated (Gold+ tier), user lists agent on Autonolas/AI Arena. External subscribers pay for strategies. | Users who reach Gold+ tier |
| **MEV rebates (future)** | MEV-Share/MEV Blocker return backrun profits to users as improved execution prices | All users (when enabled) |
| **Template licensing (future)** | Platinum-tier users license their agent's strategy templates to other builders | Platinum users only |

**The pitch to users:** "Use ARYA for free, earn yield today, and train an agent that earns passive income for you tomorrow — without you even being online."

---

## Plans

| Plan | LLM Provider | API Key | Who Pays LLM | Platform Price |
|------|-------------|---------|--------------|---------------|
| **Standard (default)** | Anthropic (Claude Haiku 4.5) | User provides their own | User pays Anthropic directly | Free |
| **Premium** | Anthropic (Claude Sonnet 4.6 + Haiku 4.5) | ARYA's key (managed) | ARYA absorbs, charges subscription | ~$20-30/month |

---

## Standard Plan (default)

- User enters their Anthropic API key in ARYA's settings page
- Agents use that key for all LLM calls (risk analysis, opportunity evaluation, strategy reasoning)
- User pays Anthropic directly based on their token usage
- ARYA platform itself is free to use
- **Estimated user LLM cost:** ~$2-10/month on Haiku depending on scan frequency and portfolio complexity
- Only Anthropic API supported initially (Claude Haiku 4.5 for agents)
- Future scope: OpenAI, Google Gemini, open-source models (Llama, Mistral via Groq/Together)
- **Graduation fee:** 20% of external marketplace revenue

### Implementation

- Settings page with API key input field (masked after entry)
- Key encrypted using AES-256-GCM before storing in Upstash Redis
- Encryption key stored in Vercel environment variable (`ENCRYPTION_SECRET`)
- Key validated on save (test call to Anthropic API)
- All agent LLM calls route through a server-side proxy that injects the user's key
- API key decrypted server-side only in Vercel serverless functions - never sent back to the browser
- If no key configured, agents run in "limited mode" (rule-based analysis only, no LLM reasoning)

### Limited Mode (no API key)

Users without an API key still get value:
- Scout Agent discovers opportunities using DefiLlama data (no LLM needed)
- Risk Agent uses rule-based heuristics (IL calculation, TVL thresholds, protocol age)
- No natural language reasoning or strategy explanations
- Dashboard still shows opportunities and basic risk scores
- Upgrade prompt: "Add your Anthropic API key for AI-powered risk analysis"

---

## Premium Plan (~$20-30/month)

### The Premium Edge: Better Strategies, Faster Graduation

Premium isn't just "no API key hassle." Premium users produce **objectively better strategies** because their agents have access to superior tooling:

| Advantage | Standard | Premium | Why It Produces Better Strategies |
|-----------|---------|---------|----------------------------------|
| **LLM model** | Haiku 4.5 | Sonnet 4.6 for Tier 3 debate + complex analysis | Deeper reasoning catches risks Haiku misses. Nuanced multi-factor analysis → fewer bad strategies survive → higher win rate |
| **Scan frequency** | Every 15 minutes | Every 5 minutes | Sees opportunities 10 min earlier. In DeFi, first-mover on new pools = better rates before TVL dilutes returns |
| **Debate depth** | Tier 3 only above $ threshold | Can force Tier 3 (full debate) on every strategy | More rigorous vetting on all strategies, not just large ones → catches subtle risks on smaller positions |
| **Historical backtesting** | Current state only | Backtest against historical pool data before proposing | "This pattern appeared 12 times in 6 months — 9 were profitable" vs guessing. Data-driven confidence |
| **Scout variants** | Single Scout Agent | Multi-Scout ensemble (conservative, aggressive, stablecoin-focused) | Multiple scanning strategies surface opportunities a single Scout would miss. Best-of-3 beats best-of-1 |
| **Graduation fee** | 20% infrastructure fee | 10% infrastructure fee | Direct financial incentive — keep more of what your agent earns on marketplaces |

### The Compounding Premium Advantage

```
Premium user:
  Better model → higher win rate → faster milestone progression
  Faster scans → more opportunities evaluated → more data points per week
  Full debate → fewer bad strategies → cleaner track record
  Backtesting → pre-validated strategies → confidence before execution
  Multi-Scout → broader discovery → opportunities Standard users miss
        |
        v
Result: Premium agents graduate to Gold tier ~2-3x faster than Standard
        |
        v
And when they graduate: 10% fee (Premium) vs 20% fee (Standard)
= Premium users earn significantly more from the same marketplace revenue
```

### ARYA's Premium Unit Economics

| Metric | Value |
|--------|-------|
| Subscription price | $20-30/month |
| LLM cost per Premium user (Sonnet + Haiku mix) | ~$10-15/month |
| Margin per Premium user (subscription only) | ~$10-15/month |
| Graduation fee revenue (once agent exports) | 10% of ongoing marketplace revenue (recurring, indefinite) |

---

## Hackathon Implementation

- Single Anthropic API key configured in `.env` (our own key for the demo)
- Settings page UI exists with API key input (demonstrates the BYOK concept)
- Judges can see the billing model is thought through
- Total demo cost: ~$2-5 in Anthropic API charges

---

## Cost per User

| Plan | User's Monthly LLM Cost | ARYA's Cost per User | ARYA's Revenue per User |
|------|------------------------|---------------------|------------------------|
| Standard (Haiku) | ~$2-10 | $0 | Graduation fee only (20%) |
| Standard (no key) | $0 | $0 | $0 (free tier, growth) |
| Premium | $0 | ~$10-15 | $20-30 sub + graduation fee (10%) |

---

## Future: Multi-Provider Support

Phase 1 (hackathon): Anthropic only (Claude Haiku 4.5)
Phase 2: Add OpenAI (GPT-4o-mini as cost-efficient alternative)
Phase 3: Add open-source via Groq/Together (Llama, Mistral - cheapest option)
Phase 4: Model routing - automatically select the cheapest model that meets accuracy requirements per task

---

## Agent Marketplace Revenue (Future)

Once users train agents to verified performance milestones via `AgentReputation.sol`, they list them on **existing Web3 agent marketplaces**. ARYA does not build its own marketplace — it exports proven agents to established platforms and takes an infrastructure fee.

### Revenue Model

```
User trains agent internally → builds on-chain track record
        │
        ▼
Agent hits export milestone (e.g., Gold tier: >70% win rate, 30+ days)
        │
        ▼
User lists agent on external marketplace (Autonolas, AI Arena, Morpheus)
User's wallet = agent operator on the marketplace
        │
        ▼
External subscribers pay for agent's strategies
        │
        ▼
Revenue split:
  Standard user: User 70% / ARYA 20% / Platform 10%
  Premium user:  User 80% / ARYA 10% / Platform 10%
  Strategy Contributor: User 85% / ARYA 5% / Platform 10%
```

### Anti-Bypass Protections

| Defense | How It Works |
|---------|-------------|
| **On-chain royalty** | ARYA's fee encoded in iNFT contract (ERC-2981 pattern). Compliant marketplaces route automatically. |
| **Co-signature on export** | iNFT listing requires ARYA's co-signature. Only granted when fee terms intact. |
| **Reputation non-portability** | Copycat agents start with zero track record. Rebuilding takes months. |
| **Continuous training dependency** | Agent weights degrade without ARYA's live pipeline. Exported snapshots go stale. |

### Prodigy Contributor Rewards (Activates at 1,000+ Users)

Below 1,000 users, the sample size is too small to reliably identify outlier performance vs luck, and anonymization is weaker with fewer data points. `AgentReputation.sol` collects data from day one — the system is ready to activate when the threshold is crossed.

Users whose agents consistently outperform (top 5% win rate, novel patterns) can opt in to contribute anonymized strategy patterns to ARYA's base model:

| Reward | Value |
|--------|-------|
| **Reduced graduation fee** | 5% instead of 10-20% |
| **Accelerated tier progression** | 2x milestone credit |
| **On-chain badge** | "Strategy Contributor" in iNFT metadata |
| **Revenue share** | % of platform revenue attributable to contributed patterns |

Privacy: Only structural patterns extracted (pool combinations, risk weightings, entry/exit logic). No wallet address, position sizes, or timing data ever shared.

### Target Platforms

| Platform | Fit | Revenue Type |
|----------|-----|-------------|
| **Autonolas (OLAS)** | Register agents as autonomous services | OLAS rewards + user subscriptions |
| **AI Arena** | Competitive strategy agent ranking | Tournament prizes + delegated capital |
| **Morpheus (MOR)** | Decentralized AI agent marketplace | MOR token rewards per usage |

### Milestone-Based Export Criteria

| Tier | Requirement | Export Status | Revenue Potential |
|------|------------|--------------|-------------------|
| **Bronze** | Win rate >50% over 20 strategies | Not eligible — still training | Gamification only |
| **Silver** | Win rate >60% over 50 strategies | Eligible for basic listing | Early subscribers |
| **Gold** | Win rate >70% for 30+ consecutive days | Premium listing with badge | Active revenue stream |
| **Platinum** | Sharpe >1.5 over 90 days, >$10K cumulative profit | Template licensing | Licensing + subscriptions |

### Portable Credentials

The ERC-7857 iNFT + `AgentReputation.sol` data serve as **portable, trustless credentials**:
- External platforms verify agent track record by reading 0G Chain directly
- No API trust required — all performance data is on-chain
- Agent identity (model config, strategy weights) encrypted in iNFT metadata

### When This Kicks In

This is a **post-hackathon** revenue stream. During the hackathon, `AgentReputation.sol` builds the foundation. Once agents run in production and accumulate enough data points, the export path activates.

Estimated timeline: 3-6 months post-launch (need sufficient data for credible milestone claims).
