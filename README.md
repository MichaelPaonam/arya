<p align="center">
  <img src="docs/arya-logo.png" alt="ARYA Logo" width="200" />
</p>

<h1 align="center">ARYA — Autonomous Realtime Yield Agents</h1>

<p align="center">
  A multi-agent AI swarm that collaboratively analyzes, recommends, and executes DeFi yield farming strategies — with human-in-the-loop oversight.
</p>

<p align="center">
  <a href="https://ethglobal.com/events/openagents">ETHGlobal Open Agents Hackathon</a>
</p>

---

## Overview

ARYA is a swarm of four specialized AI agents that work together to discover, evaluate, and execute yield farming opportunities across DeFi protocols. Unlike fully autonomous fund managers, ARYA keeps humans in control: agents analyze and recommend, users approve, and smart contracts enforce the approval gate on-chain.

**Agents analyze. Humans decide. Smart contracts enforce.**

## Architecture

```
┌─────────────────────────────────────────────┐
│              ARYA Dashboard                  │
│  [Strategy Feed] [Risk] [Portfolio] [Approve]│
└──────────┬─────────────┬──────────┬─────────┘
           │             │          │
     ┌─────▼────┐  ┌─────▼────┐  ┌─▼──────────┐
     │  Scout   │  │   Risk   │  │  Executor   │
     │  Agent   │  │  Agent   │  │   Agent     │
     └────┬─────┘  └────┬─────┘  └──┬──────────┘
          └──────────────┼───────────┘
                   ┌─────▼──────┐
                   │Orchestrator│
                   └─────┬──────┘
          ┌──────────────┼──────────────┐
    ┌─────▼─────┐  ┌─────▼─────┐  ┌────▼──────┐
    │  0G Chain  │  │ 0G Storage│  │ KeeperHub │
    │  (iNFT ID) │  │ (memory)  │  │ (automate)│
    └───────────┘  └───────────┘  └───────────┘
                         │
                   ┌─────▼──────┐
                   │Uniswap API │
                   └────────────┘
```

### Agents

| Agent | Role |
|-------|------|
| **Scout** | Discovers yield opportunities via DefiLlama and Uniswap pool data |
| **Risk** | Scores opportunities for impermanent loss, contract risk, and portfolio correlation |
| **Executor** | Builds swap transactions via Uniswap API and creates KeeperHub monitoring workflows |
| **Orchestrator** | Coordinates the swarm pipeline and manages state on 0G Storage |

### Smart Contracts (0G Chain Testnet)

| Contract | Purpose |
|----------|---------|
| `YieldSwarmRegistry.sol` | ERC-7857 iNFT registry — each agent has a verifiable on-chain identity |
| `StrategyVault.sol` | Human-in-the-loop approval gate — agents propose, only the owner can approve fund movements |
| `AgentReputation.sol` | On-chain performance tracking — agents build verifiable reputation over time |

## Sponsor Integrations

| Sponsor | Integration |
|---------|------------|
| **0G** | Agent identity (ERC-7857 iNFT on 0G Chain), agent memory and strategy history (0G Storage), multi-agent swarm architecture |
| **Uniswap Foundation** | Swap quoting, routing, and execution via Trading API. Pool data for opportunity discovery |
| **KeeperHub** | Execution layer via MCP server. Automated workflows for position monitoring, rebalancing alerts, and yield harvesting |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TailwindCSS, shadcn/ui, Recharts |
| Wallet | wagmi, viem, RainbowKit |
| Agents | TypeScript |
| Contracts | Solidity, Hardhat |
| Blockchain | 0G Chain Testnet, Ethereum Sepolia |
| Storage | 0G Storage SDK |
| Swap | Uniswap Trading API |
| Automation | KeeperHub MCP Server |
| Data | DefiLlama API, CoinGecko API |

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask configured for 0G Chain Testnet
- Uniswap API key from [developers.uniswap.org](https://developers.uniswap.org)
- KeeperHub account from [keeperhub.com](https://keeperhub.com)

### Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/open-agent.git
cd open-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in API keys and contract addresses

# Run smart contract tests
cd packages/contracts
npx hardhat test

# Start the agent swarm
cd packages/agents
npm run start

# Start the dashboard
cd packages/frontend
npm run dev
```

## Project Structure

```
open-agent/
├── docs/
│   ├── architecture/        # System design and diagrams
│   ├── research/            # Yield farming and sponsor SDK research
│   └── submission/          # Demo script, hackathon write-ups
├── packages/
│   ├── contracts/           # Solidity smart contracts
│   ├── agents/              # TypeScript agent implementations
│   └── frontend/            # Next.js dashboard
├── FEEDBACK.md              # Uniswap developer experience feedback
└── README.md                # This file
```

## How It Works

1. **Scout Agent** scans DeFi protocols and discovers yield opportunities
2. **Risk Agent** evaluates each opportunity with a multi-factor risk score
3. **Orchestrator** packages the analysis into a strategy proposal
4. **Dashboard** presents the proposal to the user with risk visualizations
5. **User approves or rejects** — the `StrategyVault` contract enforces this gate on-chain
6. **Executor Agent** builds the swap transaction via Uniswap API and submits it
7. **KeeperHub** monitors the position and triggers alerts if conditions change

## License

MIT

---

<p align="center">
  Built for <a href="https://ethglobal.com/events/openagents/prizes">ETHGlobal Open Agents</a> hackathon
</p>
