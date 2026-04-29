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
          │              │
    ┌─────▼─────┐  ┌─────▼──────┐
    │Uniswap API│  │Upstash     │
    │           │  │Redis       │
    └───────────┘  │(sessions)  │
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
| `YieldSwarmRegistry.sol` | ERC-7857 iNFT registry - each agent has a verifiable on-chain identity |
| `StrategyVault.sol` | Human-in-the-loop approval gate - agents propose, only the owner can approve fund movements |
| `AgentReputation.sol` | On-chain performance tracking - agents build verifiable reputation over time |
| ERC-4337 Smart Accounts | Session keys for bounded agent autonomy, batched transactions, gas sponsorship via paymaster |

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
| LLM | Anthropic Claude Haiku 4.5 (BYOK) |
| Contracts | Solidity, Foundry, ERC-4337 |
| Blockchain | 0G Chain Testnet, Ethereum Sepolia |
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
2. **An Anthropic API key** (Standard plan only) — enter in Settings for AI-powered analysis. Get one at [console.anthropic.com](https://console.anthropic.com)

That's it. No accounts to create, no infrastructure to manage. Connect your wallet, optionally add your API key, and ARYA's agents start working for you.

> Without an API key, ARYA still discovers opportunities and provides rule-based risk scores. Add a key to unlock AI-powered reasoning and strategy explanations.

### For Developers

Prerequisites for running ARYA locally:

- Node.js 18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, cast, anvil)
- Uniswap API key from [developers.uniswap.org](https://developers.uniswap.org)
- KeeperHub API key (`kh_`) from [keeperhub.com](https://keeperhub.com)
- Upstash Redis database from [upstash.com](https://upstash.com) (free tier)
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

```bash
# Clone the repository
git clone https://github.com/MichaelPaonam/arya.git
cd arya

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install frontend dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in API keys and contract addresses

# Smart contracts (Solidity + Foundry)
cd packages/contracts
forge build            # Compile contracts
forge test             # Run all tests
forge test -vvv        # Verbose output for debugging
forge test --match-contract YieldSwarmRegistryTest  # Run specific test file

# Start the dashboard (local dev)
cd packages/frontend
npm run dev
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
arya/
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

1. **User connects wallet** via RainbowKit and signs in with SIWE (Sign-In With Ethereum)
2. **Scout Agent** scans DeFi protocols and discovers yield opportunities
3. **Risk Agent** evaluates each opportunity with a multi-factor risk score
4. **Orchestrator** packages the analysis into a strategy proposal
5. **Dashboard** presents the proposal to the user with risk visualizations
6. **User approves or rejects** - the `StrategyVault` contract enforces this gate on-chain
7. **Executor Agent** builds the swap transaction via Uniswap API and submits it
8. **KeeperHub** monitors the position and triggers alerts if conditions change

## License

MIT

---

<p align="center">
  Built for <a href="https://ethglobal.com/events/openagents/prizes">ETHGlobal Open Agents</a> hackathon
</p>
