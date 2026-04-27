# ARYA — System Architecture

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
| **Executor** | Builds/submits transactions on approval | Approved strategies | `ExecutionResult` messages | Uniswap API (swap) + KeeperHub MCP |
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
  onlyOwner — restricts approval/execution to wallet owner
  belowRiskThreshold — auto-rejects high-risk strategies
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

### 0G (Primary — $7,500)

| Component | Usage |
|-----------|-------|
| 0G Chain (EVM testnet) | Deploy all 3 smart contracts. Mint ERC-7857 iNFTs for each agent |
| 0G Storage | Store agent memory (discovered opportunities, risk assessments, strategy history). Persist swarm state between sessions |
| ERC-7857 iNFT | Each agent gets an iNFT with encrypted metadata (model config, strategy weights). Verifiable agent identity |

### Uniswap Foundation ($5,000)

| Endpoint | Usage |
|----------|-------|
| `POST /quote` | Get swap quotes for strategy execution (token amounts, routes, gas estimates) |
| `POST /check_approval` | Verify token approvals before swap execution |
| `POST /swap` | Generate swap calldata for StrategyVault to execute |
| Pool data | Scout agent monitors pool APYs, TVL, volume for opportunity discovery |

**Required:** FEEDBACK.md documenting developer experience with the API.

### KeeperHub ($5,000 + $500 bonus)

| Feature | Usage |
|---------|-------|
| MCP Server | Executor agent programmatically creates workflows via Claude/MCP runtime |
| Workflows | Position health monitoring (trigger: block interval, action: check collateral ratio). Rebalancing alerts (trigger: price deviation, action: notify + prepare tx). Yield harvesting (trigger: schedule, action: claim rewards) |
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

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) | Dashboard UI |
| UI Components | shadcn/ui + TailwindCSS | Consistent, fast UI development |
| Charts | Recharts or Nivo | Risk radar, portfolio, P&L charts |
| Wallet | wagmi + viem + RainbowKit | Wallet connection + tx signing |
| Agents | TypeScript | Agent runtime |
| Agent Framework | LangChain.js or custom | Agent orchestration (decide in research phase) |
| LLM | Claude API or OpenAI | Agent reasoning for risk analysis |
| Contracts | Solidity | Smart contracts |
| Contract Tooling | Hardhat or Foundry | Compile, test, deploy |
| Blockchain | 0G Chain Testnet | Contract deployment + iNFT |
| Blockchain | Ethereum Sepolia | KeeperHub execution chain |
| Storage | 0G Storage SDK | Agent memory + strategy history |
| Swap API | Uniswap Trading API | Quote + execute swaps |
| Automation | KeeperHub MCP + CLI | Position monitoring workflows |
| Yield Data | DefiLlama API | Pool APYs, TVL, protocol data |
| Price Data | CoinGecko API | Token prices for calculations |
