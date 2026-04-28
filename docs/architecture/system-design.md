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
Orchestrator packages as StrategyProposal
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
On-chain execution via Uniswap API
        │
        ▼
KeeperHub monitors position health
```

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
| Contract Tooling | Hardhat or Foundry | Compile, test, deploy |
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
