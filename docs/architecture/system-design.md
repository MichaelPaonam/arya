# ARYA - System Architecture

## System Overview

ARYA (Autonomous Realtime Yield Agents) is a multi-agent AI swarm for DeFi yield farming with human-in-the-loop oversight.

```
┌─────────────────────────────────────────────────────┐
│              ARYA Dashboard                          │
│  (Next.js + React + TailwindCSS + Recharts)          │
│  [Strategy Feed] [Risk Chart] [Portfolio] [Approve]  │
└──────────┬──────────────┬──────────────┬─────────────┘
           │              │              │
     ┌─────▼─────┐  ┌────▼─────┐  ┌────▼──────┐
     │ Scout      │  │ Risk     │  │ Executor  │
     │ Agent      │  │ Agent    │  │ Agent     │
     │ (discover) │  │ (score)  │  │ (execute) │
     └─────┬─────┘  └────┬─────┘  └────┬──────┘
           └──────────────┼──────────────┘
                    ┌─────▼──────┐
                    │Orchestrator│
                    └─────┬──────┘
           ┌──────────────┼──────────────┐
     ┌─────▼─────┐  ┌────▼─────┐  ┌────▼──────┐
     │ 0G Chain   │  │0G Storage│  │ KeeperHub │
     │ (iNFT ID,  │  │ (agent   │  │ (automate,│
     │  contracts)│  │  memory) │  │  monitor) │
     └───────────┘  └──────────┘  └───────────┘
                          │
                    ┌─────▼──────┐
                    │ Uniswap API│
                    │ (swap/route)│
                    └────────────┘
```

---

## Authentication Flow

### Wallet-Based Login (SIWE)

ARYA uses Sign-In With Ethereum (SIWE / EIP-4361) for authentication. No email, no password - users prove wallet ownership via cryptographic signature.

```
User clicks "Connect Wallet" (RainbowKit)
        |
        v
Wallet connects via wagmi (MetaMask, WalletConnect, etc.)
        |
        v
Frontend requests nonce from /api/auth/nonce
        |
        v
Backend generates nonce, stores in Upstash Redis (TTL: 5 min)
        |
        v
Frontend constructs SIWE message, wallet signs it
        |
        v
Frontend sends signature + message to /api/auth/verify
        |
        v
Backend verifies signature, consumes nonce, creates session in Redis (TTL: 7 days)
        |
        v
Session token set as httpOnly cookie
        |
        v
Dashboard loads with user's data (preferences, API keys, strategy history)
```

### Auth API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/nonce` | GET | Generate random nonce (stored in Redis, 5min TTL) |
| `/api/auth/verify` | POST | Verify SIWE signature, consume nonce, create session |
| `/api/auth/session` | GET | Return current session data (or 401) |
| `/api/auth/logout` | POST | Invalidate session in Redis, clear cookie |

---

## Agent Architecture

### Pipeline Flow

```
Scout discovers opportunity
        │
        ▼
Risk evaluates & scores
        │
        ▼
Agent Debate: Risk challenges Scout's assumptions (adversarial validation)
        │
        ▼
Orchestrator scores surviving strategies, packages as StrategyProposal
        │
        ▼
Dashboard presents to user
        │
        ▼
User approves / rejects
        │
        ▼ (if approved)
Executor builds tx + creates KeeperHub workflow
        │
        ▼
On-chain execution via Uniswap API (UserOperation via ERC-4337)
        │
        ▼
KeeperHub monitors position health
```

### Agent Debate Protocol (Latency-Aware)

Multiple agents proposing and critiquing strategies produces better decisions than single-agent inference. Research demonstrates this "significantly enhances mathematical and strategic reasoning" and "reduces fallacious answers and hallucinations" (Du et al., 2023).

However, full debate adds latency (2-4 LLM calls per strategy × ~1-2s each). For 20 opportunities, that's 80-160 seconds — unacceptable for time-sensitive opportunities. ARYA uses **tiered debate** to balance quality with speed.

#### Debate Tiers

| Tier | Latency Target | Debate Level | When Used |
|------|---------------|-------------|-----------|
| **Tier 1: Fast Path** | <2s | No debate. Rule-based scoring only. | Arbitrage, time-critical opportunities expiring in minutes. Known stablecoin pools. |
| **Tier 2: Standard Path** | 5-15s | Single-round challenge. Risk raises top concerns, no back-and-forth. | Most yield farming strategies. Medium risk, medium size. |
| **Tier 3: Deep Path** | 30-60s | Full multi-round debate. Adversarial challenge + response + scoring. | High-value strategies (>$1000), novel protocols, high risk scores, user-configured "always debate". |

#### Tier Routing Logic

```typescript
function selectDebateTier(strategy: StrategyProposal): DebateTier {
  // Tier 1: Fast path
  if (strategy.opportunity.source === "arbitrage") return "fast";
  if (strategy.estimatedReturn < 0.01) return "fast";
  if (strategy.expiresAt - Date.now() < 300_000) return "fast"; // expires in <5 min

  // Tier 3: Deep path
  if (strategy.actions[0].amount > DEBATE_THRESHOLD) return "deep";
  if (strategy.risk.riskScore >= 7) return "deep";
  if (strategy.opportunity.protocol === "unknown") return "deep";
  if (userPolicy.automation.debateRequired) return "deep";

  // Tier 2: Standard path (default)
  return "standard";
}
```

#### Latency Control Techniques

| Technique | How It Works | Applicable Tiers |
|-----------|-------------|-----------------|
| **Time-boxed debate** | Hard timeout: if debate unresolved in X seconds, use current best score | Tier 2, 3 |
| **Parallel debate** | Challenge multiple strategies simultaneously, don't wait sequentially | Tier 2, 3 |
| **Early exit** | If Risk Agent's first challenge is "low" severity and data-backed, skip further rounds | Tier 2 |
| **Cached challenges** | Common challenges ("low TVL", "new protocol") are pre-computed, not LLM-generated | All tiers |
| **Challenge templates** | For known risk patterns (IL > X%, TVL < $1M), use template instead of LLM call | Tier 1, 2 |
| **Debate reuse** | If same pool was debated <1 hour ago and conditions unchanged, reuse outcome | All tiers |

#### Flow Diagram

```
Strategy enters pipeline
        │
        ▼
Tier Classification (rule-based, <10ms)
        │
        ├── Tier 1: Fast Path
        │     └── Rule-based risk score → Dashboard (no LLM)
        │
        ├── Tier 2: Standard Path
        │     ├── Risk generates challenges (1 LLM call, parallel across strategies)
        │     ├── Timeout: 10s hard cap
        │     └── Score + present to Dashboard
        │
        └── Tier 3: Deep Path
              ├── Risk challenges (1 LLM call)
              ├── Scout responds (1 LLM call)
              ├── Orchestrator scores (1 LLM call or rule-based)
              ├── Timeout: 45s hard cap
              └── Score + present to Dashboard
```

#### Debate Message Types

```typescript
interface Challenge {
  challengerId: string;       // Risk agent's iNFT ID
  targetStrategyId: string;
  challengeType: "data_contradiction" | "risk_underestimate" | "assumption_invalid" | "correlation_risk";
  evidence: string;           // LLM-generated reasoning with data backing
  severity: "low" | "medium" | "high";
}

interface ChallengeResponse {
  responderId: string;        // Scout agent's iNFT ID
  challengeId: string;
  response: "concede" | "counter";
  counterEvidence?: string;
}

interface DebateOutcome {
  strategyId: string;
  tier: "fast" | "standard" | "deep";
  challengesRaised: number;
  challengesSurvived: number;
  confidenceScore: number;    // 0-1, weighted by challenge severity
  latencyMs: number;          // Actual time taken
  debateLog: (Challenge | ChallengeResponse)[];
}
```

**Hackathon scope:** Tier classification logic in Orchestrator. Tier 1 (rule-based scoring) and Tier 2 (single-round Risk challenge) implemented. Tier 3 full debate is stretch goal.

### Intent Layer

Users express desired outcomes (intents) rather than approving specific transactions. Agents compete to fulfill intents within constraints.

**Intent expression:**

```typescript
interface UserIntent {
  id: string;
  walletAddress: string;
  type: "maximize_yield" | "minimize_risk" | "rebalance" | "exit_to_stablecoin";
  constraints: {
    maxRisk?: number;             // 1-10 scale
    minAPY?: number;              // minimum acceptable yield
    maxCapitalDeployed?: bigint;  // spending limit
    allowedProtocols?: string[];  // protocol whitelist
    timeHorizon?: number;         // days
    preferStablecoins?: boolean;  // volatility preference
  };
  createdAt: number;
  expiresAt: number;
}
```

**How agents fulfill intents:**

```
User declares: "Deploy $5000 into yield, risk < 4, min 7% APY, 30-day horizon"
        │
        ▼
Scout generates multiple strategy proposals matching constraints
        │
        ▼
Risk Agent scores each against intent constraints
        │
        ▼
Debate: adversarial challenge on top candidates
        │
        ▼
Orchestrator ranks: best risk-adjusted return within bounds
        │
        ▼
If within session key bounds → auto-execute
If above bounds → present to user for approval
```

**Hackathon scope:** User preferences (risk threshold, preferred protocols, target APY) in Settings are treated as a persistent intent. Agents filter and rank strategies against these constraints. Full intent expression with competing solvers is post-hackathon.

### Agent Specifications

| Agent | Purpose | Inputs | Outputs | Key Integration |
|-------|---------|--------|---------|-----------------|
| **Scout** | Scans protocols for yield opportunities | DefiLlama API, Uniswap pool data | `OpportunityFound` messages | Uniswap API (pool data) |
| **Risk** | Evaluates each opportunity for risk | Opportunity data, historical data | `RiskAssessment` messages | 0G Storage (historical data) |
| **Executor** | Builds/submits transactions on approval | Approved strategies | `ExecutionResult` messages | Uniswap API (swap) + KeeperHub REST API |
| **Orchestrator** | Coordinates swarm, manages state | All agent messages | `StrategyProposal` to dashboard | 0G Storage (state) + 0G Chain (iNFT) |

### Message Types

```typescript
interface OpportunityFound {
  id: string;
  protocol: string;         // "uniswap-v3", "aave", "curve"
  pool: string;             // Pool address
  tokenPair: [string, string];
  estimatedAPY: number;
  tvl: number;
  source: "defi-llama" | "uniswap-api" | "on-chain";
  discoveredAt: number;     // Unix timestamp
  agentId: string;          // Scout's iNFT token ID
}

interface RiskAssessment {
  opportunityId: string;
  riskScore: number;        // 1-10 (10 = highest risk)
  impermanentLoss: number;  // Estimated IL percentage
  contractRisk: "low" | "medium" | "high";
  liquidityRisk: "low" | "medium" | "high";
  correlationWithPortfolio: number; // -1 to 1
  reasoning: string;        // LLM-generated explanation
  agentId: string;          // Risk agent's iNFT token ID
}

interface StrategyProposal {
  id: string;
  opportunity: OpportunityFound;
  risk: RiskAssessment;
  actions: SwapAction[];    // Ordered list of transactions
  estimatedGas: bigint;
  estimatedReturn: number;  // Net APY after fees
  expiresAt: number;        // Strategy validity window
}

interface ExecutionResult {
  strategyId: string;
  status: "executed" | "failed" | "expired";
  txHash?: string;
  keeperWorkflowId?: string;
  actualGas?: bigint;
  error?: string;
}
```

---

## Smart Contract Design

### Contract 1: `YieldSwarmRegistry.sol`

ERC-7857 compatible iNFT registry for agent on-chain identity.

```
Functions:
  registerAgent(agentType, metadataURI) → tokenId    // Mints iNFT for agent
  getAgent(tokenId) → AgentInfo                       // Query agent details
  getSwarmMembers() → AgentInfo[]                     // List all agents
  recordDecision(agentId, strategyHash, recommendation) // Audit trail

Events:
  AgentRegistered(tokenId, agentType, owner)
  DecisionRecorded(agentId, strategyHash, timestamp)

Structs:
  AgentInfo { tokenId, agentType, metadataURI, registeredAt, owner }
```

### Contract 2: `StrategyVault.sol`

Human-in-the-loop approval gate for fund movements.

```
Functions:
  proposeStrategy(strategyId, actions[], estimatedAPY, riskScore)
  approveStrategy(strategyId)      // Only owner can approve
  rejectStrategy(strategyId)
  executeStrategy(strategyId)      // Calls Uniswap via approved calldata
  setRiskThreshold(maxRisk)        // Auto-reject above threshold
  getActiveStrategies() → Strategy[]

Events:
  StrategyProposed(strategyId, estimatedAPY, riskScore)
  StrategyApproved(strategyId, approver)
  StrategyExecuted(strategyId, txHash)
  StrategyRejected(strategyId, reason)

Modifiers:
  onlyOwner - restricts approval/execution to wallet owner
  belowRiskThreshold - auto-rejects high-risk strategies
```

### Contract 3: `AgentReputation.sol` *(cut first if behind schedule)*

On-chain agent performance tracking.

```
Functions:
  recordOutcome(agentId, strategyId, predictedAPY, actualAPY)
  getReputation(agentId) → (accuracy, totalPredictions, avgDeviation)
  getLeaderboard() → AgentScore[]
```

---

## Smart Accounts (ERC-4337)

ARYA uses ERC-4337 account abstraction to enable bounded agent autonomy, batched transactions, and gas sponsorship. This upgrades the human-in-the-loop model from "sign every action" to "define boundaries, agents operate within them."

### Why Smart Accounts Are Required

| Problem | EOA (Traditional) | Smart Account (ERC-4337) |
|---------|-------------------|--------------------------|
| User must sign every swap | Yes - every approve + swap = 2 signatures | Session key: user defines bounds once, agent operates freely within them |
| User needs native tokens for gas | Yes - must hold 0G tokens | Paymaster sponsors gas or user pays in USDC |
| Multi-step strategies | Multiple transactions, multiple signatures | Batched: approve + swap + monitor setup in one UserOperation |
| Agent automation | Impossible without private key exposure | Session keys grant time-limited, scope-limited permissions to agents |

### Architecture

```
User creates Smart Account (one-time setup)
        |
        v
User grants session key to Executor Agent:
  - Max spend: $500
  - Allowed protocols: Uniswap only
  - Duration: 7 days
  - Allowed actions: swap, approve
        |
        v
Agent creates UserOperations within bounds
  (no further wallet signatures needed)
        |
        v
Bundler packages UserOps → EntryPoint → execution
        |
        v
Paymaster sponsors gas (demo) or user pays in USDC
```

### Components

| Component | Role in ARYA |
|-----------|-------------|
| **Smart Account Factory** | Creates user smart accounts on first login (CREATE2 deterministic address) |
| **Session Key Module** | Grants Executor Agent bounded permissions (max spend, allowed protocols, time window) |
| **StrategyVault.sol** | Still enforces approval gate for strategies above session key limits |
| **Paymaster** | Sponsors gas for demo users. Premium plan users get gas-free execution. |
| **Bundler** | Packages agent UserOperations for on-chain submission |

### Human-in-the-Loop with Session Keys

Session keys don't remove human oversight - they move it to the policy level:

| Control Layer | What User Defines | What Agent Does |
|--------------|-------------------|-----------------|
| **Session creation** | Max spend per tx, max total spend, allowed protocols, time window | Operates freely within these bounds |
| **StrategyVault** | Risk threshold (auto-reject above it) | Proposes strategies; only those within threshold proceed |
| **Dashboard alerts** | Notification preferences | User reviews agent actions retroactively |
| **Revocation** | Can revoke session key at any time | Immediately loses all permissions |

### Session Key Permissions (example)

```
{
  "grantee": "0x...executorAgent",
  "permissions": {
    "maxSpendPerTx": "500000000",     // $500 USDC
    "maxTotalSpend": "2000000000",    // $2000 USDC total
    "allowedProtocols": ["0x...uniswapRouter"],
    "allowedActions": ["swap", "approve"],
    "validUntil": 1715000000,         // 7 days from grant
    "validAfter": 1714400000
  }
}
```

### Cost Effectiveness

| Scenario | Without 4337 | With 4337 | Savings |
|----------|-------------|-----------|---------|
| Approve + swap | 2 transactions, 2 gas payments | 1 batched UserOperation | ~40% gas reduction |
| 5 strategies in a day | 10 signatures + 10 gas fees | 1 session key grant + 5 UserOps (no signatures) | 50%+ fewer interactions |
| New user onboarding | Must acquire native tokens first | Paymaster sponsors gas | Zero onboarding friction |
| Demo for judges | "Sign here... and here... and here..." | One session key, then seamless agent execution | Night-and-day UX difference |

### Fine-Grained Wallet Policy

Session keys cover spending limits, but ARYA extends this with strategy-level policy enforcement at the wallet level:

```typescript
interface WalletPolicy {
  sessionKeyId: string;
  spending: {
    maxPerTx: bigint;
    maxTotal: bigint;
    maxPerDay: bigint;
  };
  protocols: {
    allowlist: string[];       // Only these protocols
    blocklist: string[];       // Never these protocols
  };
  assets: {
    allowedTokens: string[];   // Token address whitelist
    blockedTokens: string[];
    stablecoinOnly: boolean;
    noAlgorithmicStables: boolean;
  };
  risk: {
    maxRiskScore: number;      // 1-10, reject above this
    maxConcentration: number;  // Max % in single pool (0-100)
    maxILTolerance: number;    // Max acceptable IL percentage
  };
  automation: {
    volatilityPause: number;   // Pause if portfolio drops X% in 24h
    debateRequired: boolean;   // Require debate for all strategies
    debateThreshold: bigint;   // Require debate only above this amount
  };
}
```

**Enforcement:** The smart account validates every UserOperation against the active WalletPolicy before execution. Policy is stored in smart account storage (on-chain, immutable until user updates via dashboard).

| Policy Type | Enforcement Point | Example |
|-------------|-------------------|---------|
| Spending caps | Session key module (on-chain) | Max $500/tx, $2000/day |
| Protocol allowlist | Session key module (on-chain) | Uniswap router only |
| Asset restrictions | Executor Agent (pre-submission) | No algorithmic stablecoins |
| Risk threshold | Orchestrator (pipeline) | Drop strategies with riskScore > 7 |
| Concentration limits | Orchestrator (pipeline) | Max 30% in single pool |
| Volatility triggers | KeeperHub workflow | Pause automation if portfolio -10% in 24h |
| Debate requirement | Orchestrator (pipeline) | Force Tier 3 debate for strategies > $1000 |

**Hackathon scope:** Spending caps + protocol allowlist + risk threshold enforced on-chain via session key module and StrategyVault. Asset restrictions and concentration limits enforced in Orchestrator logic. Full volatility triggers via KeeperHub post-hackathon.

### Implementation (Hackathon)

- Use ZeroDev or Pimlico SDK for smart account infrastructure
- Smart account factory deployed on 0G Chain testnet
- Session key module with spending limits and time bounds
- Simple paymaster for demo gas sponsorship
- Executor Agent creates UserOperations instead of raw transactions

---

## Sponsor Integration Details

### 0G 

| Component | Usage |
|-----------|-------|
| 0G Chain (EVM testnet) | Deploy all 3 smart contracts. Mint ERC-7857 iNFTs for each agent |
| 0G Storage | Store agent memory (discovered opportunities, risk assessments, strategy history). Persist swarm state between sessions |
| ERC-7857 iNFT | Each agent gets an iNFT with encrypted metadata (model config, strategy weights). Verifiable agent identity |

### Uniswap Foundation 

| Endpoint | Usage |
|----------|-------|
| `POST /quote` | Get swap quotes for strategy execution (token amounts, routes, gas estimates) |
| `POST /check_approval` | Verify token approvals before swap execution |
| `POST /swap` | Generate swap calldata for StrategyVault to execute |
| Pool data | Scout agent monitors pool APYs, TVL, volume for opportunity discovery |

**Required:** FEEDBACK.md documenting developer experience with the API.

### KeeperHub 

| Feature | Usage |
|---------|-------|
| REST API | Executor agent programmatically creates and manages workflows via HTTP calls from Vercel serverless functions |
| Workflows | Position health monitoring (trigger: block interval, action: check collateral ratio). Rebalancing alerts (trigger: price deviation, action: notify + prepare tx). Yield harvesting (trigger: schedule, action: claim rewards) |
| MCP Server | Alternative integration for local development (not used in production deployment) |
| CLI | Initial workflow setup and testing during development |

**Required:** Write-up explaining KeeperHub usage. **Bonus:** Builder Feedback Bounty ($500) for actionable UX feedback.

---

## Frontend Pages

### Page 1: Dashboard (Home)
- Strategy feed: cards showing pool, APY, risk score, recommending agent
- Portfolio overview: current positions, total yield earned, risk distribution chart
- Agent swarm status: which agents are active, last action, health indicators

### Page 2: Strategy Detail
- Risk analysis: radar chart (IL risk, contract risk, market risk, liquidity risk, correlation)
- Transaction preview: Uniswap swap route, estimated gas, slippage
- Approve / Reject / Modify buttons (triggers wallet signing)
- Historical performance of similar strategies

### Page 3: Agent Registry
- Agent iNFT cards with on-chain identity
- Reputation scores and accuracy history
- Activity timeline

### Page 4: Execution History
- Past strategies: proposed, approved, executed, outcomes
- KeeperHub workflow status for active automations
- P&L tracking chart

### Page 5: Settings
- Connected wallet address and session status
- Anthropic API key input (BYOK for Standard plan)
- Risk threshold configuration
- Preferred protocols and portfolio allocation targets
- Plan management (Standard vs Premium)

---

## Deployment Architecture

```
Users (browser)
      |
      v
┌─────────────────────────────────┐
│  Vercel                          │
│                                  │
│  Next.js Frontend (Edge/SSR)     │
│  /api/auth/*         (Auth)      │
│  /api/agents/scout   (Cron 15m)  │
│  /api/agents/risk    (Serverless) │
│  /api/agents/execute (Serverless) │
│  /api/orchestrator   (Serverless) │
└──────┬────────┬────────┬─────────┘
       |        |        |
       v        v        v
   0G Chain  Uniswap  KeeperHub
   0G Store  API      REST API
       |
       v
   Upstash Redis
   Sessions, user data,
   API keys (encrypted)
```

### Agent Runtime

Agents run as **Vercel serverless functions**, not long-running processes:

| Agent | Trigger | Vercel Route |
|-------|---------|-------------|
| Auth | Wallet connect/sign | `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/session`, `/api/auth/logout` |
| Scout | Cron (every 15 min) | `/api/agents/scout` |
| Risk | Scout finds opportunities | `/api/agents/risk` |
| Orchestrator | Risk completes assessment | `/api/orchestrator` |
| Executor | User clicks "Approve" | `/api/agents/execute` |

LangGraph.js state persists in 0G Storage between serverless invocations.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) | Dashboard UI |
| UI Components | shadcn/ui + TailwindCSS | Consistent, fast UI development |
| Charts | Recharts or Nivo | Risk radar, portfolio, P&L charts |
| Wallet | wagmi + viem + RainbowKit | Wallet connection + tx signing |
| Auth | siwe + @upstash/redis | SIWE wallet login + session management |
| Agents | TypeScript | Agent runtime |
| Agent Framework | LangGraph.js | Agent orchestration with state graph |
| LLM | Anthropic Claude API (Haiku 4.5) | Agent reasoning (BYOK - user provides API key) |
| Contracts | Solidity | Smart contracts |
| Contract Tooling | Foundry (forge, cast, anvil) | Compile, test, fuzz, deploy |
| Blockchain | 0G Chain Testnet | Contract deployment + iNFT |
| Blockchain | Ethereum Sepolia | KeeperHub execution chain |
| Deployment | Vercel (serverless + cron) | Frontend, API routes, agent runtime |
| Storage | 0G Storage SDK | Agent memory + strategy history |
| Session/User Data | Upstash Redis | Sessions, user preferences, encrypted API keys |
| User Data (future) | Supabase (Postgres) | Relational user data (post-hackathon) |
| Swap API | Uniswap Trading API | Quote + execute swaps |
| Automation | KeeperHub REST API | Position monitoring workflows |
| Yield Data | DefiLlama API | Pool APYs, TVL, protocol data |
| Price Data | CoinGecko API | Token prices for calculations |

---

## Future Scope: Yield Tokenization

Post-hackathon, ARYA's agent pipeline extends naturally to **yield tokenization** - decomposing yield-bearing assets into principal (PT) and yield (YT) tokens, then trading implied vs realized yield spreads.

### How It Maps to ARYA's Agents

| Agent | Current Role | Extended Role |
|-------|-------------|---------------|
| **Scout** | Discovers LP/lending yield opportunities | Also monitors Pendle PT/YT pricing for implied yield spreads against on-chain spot rates |
| **Risk** | Scores IL, contract risk, correlation | Also evaluates time-to-expiry decay, directional rate confidence, and PT/YT liquidity depth |
| **Executor** | Builds Uniswap swaps | Also builds Pendle PT/YT trades (same EVM transaction pattern) |

### Why Agents Outperform Rules Here

Implied yield arbitrage requires reasoning about rate direction (governance proposals, protocol upgrades, macro conditions) and cross-protocol spread analysis - exactly the kind of contextual synthesis that LLM agents handle and rule-based bots cannot. See `docs/submission/pitch.md` for the full analysis.

---

## MEV Awareness

MEV bots have extracted over **$1.43 billion** from Ethereum users (source: MEV Blocker). ARYA addresses this at the agent level.

### Current Mitigations

- **Slippage control** - Risk Agent sets tight slippage tolerances based on pool liquidity depth and recent volatility. Sandwich attacks become unprofitable when the allowed slippage window is narrow. MEV Blocker recommends this as a baseline defense.
- **Route optimization** - Uniswap Trading API routes trades across multiple pools to minimize price impact, reducing the profitable MEV surface.
- **UniswapX path** - UniswapX uses Dutch auctions where fillers compete to execute swaps. Orders filled from filler inventory cannot be sandwiched, and MEV is returned to swappers as improved pricing (source: Uniswap Blog).
- **Transaction preview** - Users see the exact swap route, expected output, and minimum received in the dashboard before approving. No blind transactions.

### Future: Private Transaction Submission

| Integration | Mechanism | Impact | Source |
|------------|-----------|--------|--------|
| **Flashbots Protect** | Routes transactions through private mempool via Flashbots Auction | Eliminates front-running and sandwich attacks | flashbots.net |
| **MEV Blocker** | OFA where searchers bid for backrun rights but cannot frontrun/sandwich. 90% of backrun profits rebated to users | $219B+ protected, 5.5K+ ETH rebated across 62M+ transactions | mevblocker.io |
| **MEV-Share** | Users selectively share tx data and receive compensation for MEV their orders generate | Turns MEV from user cost into user revenue | flashbots.net |

All integrations are a configuration change in the Executor Agent's transaction submission path - submit to a private RPC endpoint instead of the public mempool. No changes to StrategyVault.sol or the approval flow.

---

## Stablecoin-Aware Volatility Protection

Global stablecoin market cap exceeds $320B (source: DefiLlama), with USDT at ~59% dominance. Stablecoins are the backbone of DeFi lending, borrowing, and yield farming (source: Chainalysis). ARYA's agents treat stablecoins as a first-class defensive strategy.

### Agent Responsibilities

| Strategy | Agent | Behavior |
|----------|-------|----------|
| **Flight to safety** | Risk Agent | Detects elevated market volatility (price swings, volume spikes, funding rate extremes). Recommends partial or full conversion to stablecoins to lock gains or preserve capital |
| **Stablecoin yield discovery** | Scout Agent | Discovers stablecoin-only yield opportunities (Aave/Compound lending, Curve stablecoin pools) as low-risk alternatives to volatile LP positions |
| **Depeg risk scoring** | Risk Agent | Scores each stablecoin by collateral model, issuer risk, and historical stability. Recommends diversification across stablecoin types to avoid single-point depeg exposure |
| **Automated rebalancing** | KeeperHub | Monitors volatile asset allocation. Triggers rebalance toward stablecoins when allocation exceeds user's risk threshold |

### Stablecoin Risk Profiles

| Type | Examples | Collateral | Depeg Risk | Agent Handling |
|------|---------|-----------|-----------|----------------|
| Fiat-backed | USDT, USDC, GUSD | 1:1 USD reserves | Low | Default safe haven. Risk Agent monitors issuer reserve reports |
| Crypto-backed | DAI | Over-collateralized (200%+ in ETH) | Medium | Risk Agent monitors collateral ratio. Flags liquidation cascade risk in severe crashes |
| Algorithmic | FRAX | Algorithm-managed supply | Higher | Risk Agent applies extra caution. UST collapse (2022) demonstrated systemic failure mode |
| Commodity-backed | XAUT, PAXG | Physical gold | Low (less liquid) | Treated as inflation hedge, not primary stablecoin position |

Sources: Gemini Cryptopedia (stablecoin types), Chainalysis (market data), Binance Academy (depeg history: UST 2022, USDC 2023, USDR 2023), Flipster (volatility strategies)

### Volatility Detection Signals

The Risk Agent monitors these signals to trigger stablecoin rebalancing:

- Price volatility (rolling standard deviation exceeds threshold)
- Abnormal volume spikes (potential liquidation cascades)
- Funding rate extremes (overleveraged market)
- Protocol-specific events (exploit alerts, governance changes)
- Stablecoin depeg deviations (>0.5% from peg triggers warning)

### Why LLM Agents vs Rules

A rule-based bot triggers stablecoin rebalance when price drops X%. An LLM agent reasons about *why* the drop is happening:
- Protocol exploit → flee to stablecoins immediately
- Temporary liquidation cascade → wait it out, volatility is short-lived
- Macro event (regulatory, rate hike) → gradual de-risk over hours, not minutes

Context determines the right response. This is where LLM reasoning justifies its cost.

---

## Agent Export to External Marketplaces (Future)

ARYA is a closed system — all agents are internal. Users **train** their agents through approval/rejection decisions, building a verifiable on-chain track record. Once agents hit performance milestones, the **user** (not ARYA) lists them on existing Web3 agent marketplaces. ARYA takes 10-20% as infrastructure fee.

### Ownership Model

- User's wallet = agent operator on-chain
- AgentReputation.sol data tied to user's wallet address
- ERC-7857 iNFT credentials are portable — user takes them to any marketplace
- ARYA provides: base model, compute, tooling, strategy pipeline
- ARYA earns: 10-20% of external marketplace revenue as infrastructure fee

### How It Works

```
User interacts with ARYA (approve/reject strategies)
        │
        ▼
Agent preferences shaped by user's decisions
AgentReputation.sol tracks on-chain performance
        │
        ▼
Agent hits milestone (Gold tier: >70% win rate, 30+ days)
        │
        ▼
User lists agent on external marketplace
(Autonolas, AI Arena, Morpheus, etc.)
        │
        ▼
External users subscribe to agent's strategies
Revenue: User 70-80% / ARYA 10-20% / Platform 10%
```

### Target Platforms

| Platform | How ARYA Agents Fit | Revenue Model |
|----------|-------------------|---------------|
| **Autonolas (OLAS)** | Register as autonomous services on Autonolas registry | OLAS rewards + user subscriptions |
| **AI Arena** | Competitive ranking for strategy agents | Tournament prizes + delegated capital |
| **Morpheus (MOR)** | Contribute to decentralized AI marketplace | MOR token rewards per usage |
| **Other registries** | Any platform accepting ERC-7857 iNFT-verified agents | Platform-specific fees |

### Milestone-Based Export Criteria

| Tier | Requirement | Badge | Export Status |
|------|------------|-------|--------------|
| **Bronze** | Win rate >50% over 20 strategies | Bronze badge | Not eligible |
| **Silver** | Win rate >60% over 50 strategies | Silver badge | Eligible for listing |
| **Gold** | Win rate >70% for 30+ consecutive days | Gold badge | Premium listing |
| **Platinum** | Sharpe ratio >1.5 over 90 days, >$10K cumulative profit | Platinum badge | Template licensing |

### Gamification UI (Hackathon Scope)

The dashboard shows a functional milestone tracker fed by real AgentReputation.sol data:

- Win rate tracker with progress toward next tier
- Milestone progress bar (strategies completed, cumulative profit, streak)
- Tier badge display
- Leaderboard (anonymous ranking by risk-adjusted performance)

### Portable Credentials

`AgentReputation.sol` provides on-chain proof of performance. The ERC-7857 iNFT contains the agent's identity and encrypted model config. External platforms verify the track record by reading `AgentReputation.sol` directly — trustless, no API needed.

**Extension for export readiness** (post-hackathon):
- Cumulative profit generated (sum of actualAPY × capital)
- Win/loss ratio
- Sharpe ratio equivalent (risk-adjusted returns)
- Streak tracking (consecutive wins/losses)

### Provenance Verification: How Marketplaces Know It's ARYA-Trained

External marketplaces need to verify three things: (1) the agent was trained on ARYA, (2) the performance data is genuine, (3) the model weights match what was trained.

**Chain of trust:**

```
1. Contract Origin
   iNFT minted by YieldSwarmRegistry.sol (verified contract at known address on 0G Chain)
   → Marketplace checks: tokenId was minted by ARYA's registry, not self-minted
   → On-chain, immutable — cannot be faked

2. Performance Data Integrity
   AgentReputation.sol (permissioned writes — only ARYA's Orchestrator can record outcomes)
   → Marketplace reads: predictedAPY, actualAPY, win rate, cumulative profit
   → Data can only be written by ARYA's infrastructure, not by the user

3. Model Verification (ERC-7857 TEE/ZKP)
   iNFT encrypted metadata contains model config + strategy weights
   → TEE attestation proves the weights were produced by ARYA's training pipeline
   → ZKP alternative: prove "this model was trained on data from this AgentReputation history"
     without revealing the actual weights
```

**What each layer prevents:**

| Attack | Prevention |
|--------|-----------|
| User mints fake iNFT claiming ARYA provenance | Contract address verification — only tokens from ARYA's YieldSwarmRegistry are valid |
| User inflates reputation data | AgentReputation.sol has permissioned writes — only ARYA's Orchestrator (verified caller) can record outcomes |
| User claims different model weights than what was trained | ERC-7857 TEE/ZKP verification — encrypted metadata attestation proves model provenance |
| User copies another user's agent credentials | iNFT is non-transferable (soulbound to user's wallet) or transfer requires ARYA co-signature |

**Marketplace integration flow:**

```
Marketplace receives listing request from user wallet
        │
        ▼
Reads YieldSwarmRegistry.sol: "Was this iNFT minted by ARYA's contract?" → Yes/No
        │
        ▼
Reads AgentReputation.sol: "What's the verified track record?" → win rate, profit, Sharpe
        │
        ▼
Verifies ERC-7857 metadata: "Does TEE/ZKP attestation confirm ARYA training?" → Valid/Invalid
        │
        ▼
If all pass → Agent listed with "ARYA-Verified" badge
External subscribers trust the listing because all verification is on-chain
```

### Anti-Bypass Protection: Preventing Fee Evasion

**The threat:** A user trains on ARYA, learns winning strategies, then recreates the agent outside ARYA's ecosystem — listing it on marketplaces without the iNFT and paying no infrastructure fee.

**Why this is hard to pull off:**

| Defense Layer | How It Works |
|--------------|-------------|
| **Reputation is non-portable** | A copycat agent starts with zero track record. The ARYA-Verified badge and on-chain performance history can't be reproduced. Building credibility from scratch on external marketplaces takes months — the user loses their competitive advantage. |
| **On-chain royalty enforcement** | ARYA's infrastructure fee is encoded in the iNFT smart contract (similar to ERC-2981 royalties). Compliant marketplaces route the fee automatically. The user can't modify the iNFT contract after minting. |
| **Continuous training dependency** | A snapshot of agent weights degrades as DeFi conditions change. ARYA's live pipeline (real-time market data, debate protocol, risk scoring updates) keeps the agent current. An exported copy without ARYA's infrastructure becomes stale within weeks. |
| **ARYA co-signature on export** | The iNFT transfer/listing function requires ARYA's co-signature. ARYA only co-signs for agents whose fee terms are intact. If a user tries to list through a side channel, the iNFT lacks the co-signature and marketplaces reject it. |
| **Soulbound option** | For maximum protection, iNFTs can be soulbound (non-transferable). The user can grant marketplace listing rights through ARYA's export flow (which enforces the fee), but cannot transfer the token directly. |

**What if the user bypasses everything and manually replicates?**

They can replicate strategy logic, but they cannot replicate:
- The verified track record (on-chain, permissioned writes)
- The ARYA-Verified brand signal (which marketplaces and subscribers trust)
- The continuous model updates from ARYA's pipeline
- The debate-validated strategy confidence scores

The copycat competes against ARYA-Verified agents with proven, verifiable histories. The market will price the unverified agent at a steep discount — likely not worth the effort compared to just paying the 10-20% fee.

### Prodigy Learning: Anonymized Strategy Intelligence (Opt-In)

Some users are yield farming experts who discover novel strategies — new pool combinations, timing patterns, risk hedges that ARYA's base model hasn't seen. ARYA should learn from these users to improve the platform for everyone.

**Activation threshold:** Prodigy learning activates only after ARYA reaches **1,000+ active users**. Below that, the sample size is too small to reliably identify outlier performance vs luck, and anonymization is weaker with fewer data points. Until then, `AgentReputation.sol` collects the data — the system is ready to activate when the threshold is crossed.

**How it works:**

```
Prodigy user discovers novel strategy → high win rate, unusual pattern
        │
        ▼
System detects anomalous performance:
  - Win rate significantly above median
  - Strategy patterns not seen in base model training data
  - Risk-adjusted returns in top 5% of all users
        │
        ▼
User prompted: "Your strategies are outperforming 95% of ARYA users.
  Opt in to contribute anonymized patterns to improve ARYA's base model?"
        │
        ▼
If opted in:
  - Strategy patterns anonymized (no wallet address, no position sizes, no timing)
  - Only structural patterns extracted: pool type combinations, risk factor weightings,
    entry/exit condition logic, sector rotation signals
  - Patterns aggregated into ARYA's base model training set
  - Base model improves → all users benefit from better default strategies
        │
        ▼
Prodigy receives rewards:
  - Reduced graduation fee (5% instead of 10-20%)
  - Accelerated tier progression (2x milestone credit)
  - "Strategy Contributor" on-chain badge (recorded in iNFT metadata)
  - Revenue share: X% of platform revenue attributable to patterns they contributed
```

**Privacy guarantees:**

| What Is Shared | What Is Never Shared |
|---------------|---------------------|
| Structural strategy patterns (pool type pairs, risk weightings) | Wallet address |
| Entry/exit condition logic (anonymized) | Position sizes or capital amounts |
| Sector rotation signals | Transaction hashes or timing |
| Risk factor combinations that outperform | Any data that could identify the user |

**Why prodigies opt in:**

- Direct financial reward (lower fees, revenue share)
- On-chain recognition (Strategy Contributor badge has marketplace value)
- Faster graduation (2x milestone credit compounds quickly)
- Altruistic: their patterns help newcomers succeed

**Why ARYA benefits:**

- Base model improves without hiring strategy researchers
- Platform-wide win rates increase → more agents graduate → more infrastructure fee revenue
- Prodigy-contributed patterns become a competitive moat (other platforms don't have this data)
- Creates a virtuous cycle: better base model → attracts more prodigies → even better model
