<p align="center">
  <img src="docs/arya-logo.png" alt="ARYA Logo" width="200" />
</p>

<h1 align="center">ARYA - Autonomous Realtime Yield Agents</h1>

<p align="center">
  A multi-agent AI swarm that collaboratively analyzes, recommends, and executes DeFi yield farming strategies - with human-in-the-loop oversight.
</p>

<p align="center">
  <a href="https://ethglobal.com/events/openagents">ETHGlobal Open Agents Hackathon</a>
</p>

---

## Overview

ARYA is a swarm of four specialized AI agents that work together to discover, evaluate, and execute yield farming opportunities across DeFi protocols. Unlike fully autonomous fund managers, ARYA keeps humans in control: agents analyze and recommend, users approve, and smart contracts enforce the approval gate on-chain.

**Agents analyze. Humans decide. Smart contracts enforce.**

## Architecture

### System Overview

```mermaid
flowchart LR
    subgraph Frontend["Frontend (Next.js)"]
        Dashboard[Dashboard UI]
        Approve[Approve / Reject]
    end

    subgraph Agents["Agent Swarm (LangGraph.js)"]
        Scout[Scout Agent]
        Risk[Risk Agent]
        Orch[Orchestrator]
        Exec[Executor Agent]
    end

    subgraph Contracts["0G Chain (Solidity)"]
        Registry[YieldSwarmRegistry\nERC-7857 iNFT]
        Vault[StrategyVault\nApproval Gate]
        Rep[AgentReputation\nPerformance Log]
    end

    subgraph External["External Services"]
        DeFiLlama[DefiLlama API]
        Uniswap[Uniswap Trading API]
        KeeperHub[KeeperHub\nAutomation]
        ZeroG[0G Storage\nAgent Memory]
    end

    Dashboard -->|Run Scan| Orch
    Scout -->|Yield Data| DeFiLlama
    Scout -->|Pool Data| Uniswap
    Orch --> Scout
    Orch --> Risk
    Orch -->|Proposal| Dashboard
    Approve -->|Sign Tx| Vault
    Vault -->|Approved| Exec
    Exec --> Uniswap
    Exec --> KeeperHub
    Vault --> Rep
    Orch --> ZeroG
    Registry -.->|Identity| Agents
```

### Agent Pipeline Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Dashboard
    participant O as Orchestrator
    participant S as Scout
    participant R as Risk Agent
    participant V as StrategyVault
    participant E as Executor
    participant U as Uniswap API
    participant K as KeeperHub

    User->>UI: Click "Run Scan"
    UI->>O: POST /api/pipeline
    O->>S: Discover opportunities
    S-->>O: Yield opportunities[]
    O->>R: Assess risk
    R-->>O: Risk scores + debate
    O->>UI: Strategy proposal
    UI->>User: Present proposal (APY, risk, radar)

    alt User Approves
        User->>V: Sign approval tx (MetaMask)
        V->>E: Strategy approved on-chain
        E->>U: Build swap transaction
        U-->>E: Signed tx
        E->>K: Create monitoring workflow
        K-->>E: Workflow armed
        E-->>UI: Execution confirmed
        V->>V: Log outcome → AgentReputation
    else User Rejects
        User->>UI: Reject
        UI->>O: Feedback logged
    end
```

### Agents

| Agent | Role |
|-------|------|
| **Scout** | Discovers yield opportunities via DefiLlama and Uniswap pool data |
| **Risk** | Scores opportunities for impermanent loss, contract risk, and portfolio correlation |
| **Executor** | Builds swap transactions via Uniswap API and creates KeeperHub monitoring workflows |
| **Orchestrator** | Coordinates the swarm pipeline and manages state on 0G Storage |

### Smart Contracts (0G Chain Galileo Testnet)

All contracts are deployed on 0G Galileo Testnet (Chain ID: 16602).

| Contract | Address | Purpose |
|----------|---------|---------|
| `YieldSwarmRegistry.sol` | `0x84f8aA3b17043DC2A10da1b405Cebe2fFbB6eA41` | ERC-7857 iNFT registry - each agent has a verifiable on-chain identity |
| `StrategyVault.sol` | `0x70bf0491d71f64271fae47ad008d8c83ae6f01a9` | Human-in-the-loop approval gate - agents propose, only the owner can approve fund movements |
| `AgentReputation.sol` | `0x0e43ed89f56ade0349586bb39c494218c7389f9b` | On-chain performance tracking - agents build verifiable reputation over time |
| `SmartAccountFactory.sol` | `0xb9a693904f74e1b710e8374f4454b265b97f43b5` | CREATE2 deterministic smart account deployment for users |
| `SessionKeyModule.sol` | `0x7e32eded548a5512b7956a8b3817f2bad4bdc20a` | Session keys for bounded agent autonomy with spend limits and time bounds |

## Sponsor Integrations

| Sponsor | Integration |
|---------|------------|
| **0G** | Agent identity (ERC-7857 iNFT on 0G Chain), agent memory and strategy history (0G Storage), multi-agent swarm architecture |
| **Uniswap Foundation** | Swap quoting, routing, and execution via Trading API. Pool data for opportunity discovery |
| **KeeperHub** | Execution layer via REST API. Automated workflows for position monitoring, rebalancing alerts, and yield harvesting |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TailwindCSS, shadcn/ui, Recharts |
| Wallet | wagmi, viem, RainbowKit |
| Auth | SIWE (Sign-In With Ethereum) |
| Agent Framework | LangGraph.js (TypeScript) |
| LLM | Claude Haiku 4.5 (BYOK — Anthropic or OpenRouter) |
| Contracts | Solidity, Foundry, ERC-4337 |
| Blockchain | 0G Chain Testnet |
| Storage | 0G Storage SDK |
| Session/User Data | Upstash Redis |
| Swap | Uniswap Trading API |
| Automation | KeeperHub REST API |
| Deployment | Vercel (serverless + cron) |
| Data | DefiLlama API, CoinGecko API |

## Getting Started

### For Users

All you need to use ARYA:

1. **A Web3 wallet** (MetaMask, Rainbow, etc.) — connect via the dashboard
2. **An LLM API key** (Standard plan only) — enter in Settings for AI-powered analysis. Supports [Anthropic](https://console.anthropic.com) or [OpenRouter](https://openrouter.ai)

That's it. No accounts to create, no infrastructure to manage. Connect your wallet, optionally add your API key, and ARYA's agents start working for you.

> Without an API key, ARYA still discovers opportunities and provides rule-based risk scores. Add a key to unlock AI-powered reasoning and strategy explanations.

### For Developers

Prerequisites for running ARYA locally:

- Node.js 18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, cast, anvil)
- WalletConnect Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com)
- Uniswap API key from [developers.uniswap.org](https://developers.uniswap.org)
- KeeperHub API key (`kh_`) from [keeperhub.com](https://keeperhub.com)
- Upstash Redis database from [upstash.com](https://upstash.com) (free tier)
- LLM API key: [Anthropic](https://console.anthropic.com) or [OpenRouter](https://openrouter.ai)

```bash
# Clone the repository
git clone https://github.com/MichaelPaonam/open-agent.git
cd open-agent

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Initialize submodules (contract dependencies)
git submodule update --init --recursive

# Install frontend dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in API keys and contract addresses

# Smart contracts (Solidity + Foundry)
cd packages/contracts
forge build            # Compile contracts
forge test             # Run all tests (105 tests across 4 suites)
forge test -vvv        # Verbose output for debugging
forge test --match-contract YieldSwarmRegistryTest  # Run specific test file

# Deploy to 0G Galileo testnet
cp .env.example .env
# Fill in DEPLOYER_PRIVATE_KEY and ORCHESTRATOR_ADDRESS (both need 0G testnet gas)
source .env
forge script script/Deploy.s.sol --rpc-url og_testnet --broadcast --with-gas-price 2500000000 --priority-gas-price 2500000000

# AI Agents (TypeScript + vitest)
cd ../agents
npm install
npx vitest run         # Run all tests (103 tests across 13 test files)
npx tsc --noEmit       # Type-check

# Start the dashboard (local dev)
cd ../frontend
npm install --legacy-peer-deps
npm run dev

# Run frontend tests
npx vitest run         # 66 tests across 14 files
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (frontend + serverless agent functions)
vercel --prod
```

Agents run as Vercel serverless functions (`/api/agents/*`). The Scout Agent scans on a 15-minute cron schedule. Risk, Orchestrator, and Executor agents trigger on demand.

## Project Structure

```
open-agent/
├── docs/
│   └── arya-logo.png
├── packages/
│   ├── contracts/           # Solidity smart contracts (Foundry)
│   │   ├── src/             # Contract source files
│   │   │   ├── interfaces/  # IAgentRegistry, IERC7857 interfaces
│   │   │   ├── YieldSwarmRegistry.sol
│   │   │   ├── StrategyVault.sol
│   │   │   ├── AgentReputation.sol
│   │   │   ├── SmartAccountFactory.sol
│   │   │   └── SessionKeyModule.sol
│   │   ├── test/            # Forge test files (105 tests)
│   │   ├── script/          # Deploy scripts
│   │   ├── broadcast/       # Deployment receipts (tx hashes, addresses)
│   │   └── lib/             # Dependencies (git submodules)
│   ├── agents/              # TypeScript agent implementations (103 tests)
│   │   └── src/
│   │       ├── types/       # Zod schemas + TypeScript types
│   │       ├── tools/       # API wrappers (DefiLlama, Uniswap, KeeperHub, 0G, wallet)
│   │       ├── agents/      # Scout, Risk, Orchestrator, Executor
│   │       ├── debate/      # 3-tier debate protocol (Fast/Standard/Deep)
│   │       ├── storage/     # Redis client + 0G memory persistence
│   │       ├── utils/       # LLM client (OpenRouter), IL math
│   │       └── graph/       # Pipeline orchestration (runPipeline)
│   └── frontend/            # Next.js 14 dashboard (66 tests across 14 files)
│       └── src/
│           ├── app/         # Pages: Command, Opportunities, Agents, Risk, History, Vaults, Settings
│           ├── components/  # App shell, providers, strategy cards, dialogs
│           ├── hooks/       # useWallet, useAppMode
│           ├── lib/         # wagmi config, feature flags
│           └── mocks/       # Faker-based mock data generators
├── .env.example
└── README.md
```

## How It Works

1. **User connects wallet** via RainbowKit and signs in with SIWE (Sign-In With Ethereum)
2. **Scout Agent** scans DeFi protocols and discovers yield opportunities
3. **Risk Agent** evaluates each opportunity with a multi-factor risk score
4. **Agent Debate** — Risk challenges Scout's assumptions (3 tiers: Fast, Standard, Deep)
5. **Orchestrator** packages the analysis into a strategy proposal with confidence score
6. **Dashboard** presents the proposal to the user with risk visualizations
7. **User approves or rejects** — the `StrategyVault` contract enforces this gate on-chain
8. **Executor Agent** builds the swap transaction via Uniswap API and submits it
9. **KeeperHub** monitors the position and triggers alerts if conditions change
10. **Outcome recorded** on-chain — agent reputation updates based on strategy performance

## License

MIT

---

<p align="center">
  Built for <a href="https://ethglobal.com/events/openagents/prizes">ETHGlobal Open Agents</a> hackathon
</p>
