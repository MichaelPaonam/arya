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

# Start the dashboard (local dev)
cd ../frontend
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
│   ├── agents/              # TypeScript agent implementations
│   └── frontend/            # Next.js dashboard
├── .env.example
└── README.md
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
