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
