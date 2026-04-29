# Sponsor Research Notes

## To be filled during Day 1-2 research phase

Use this document to capture SDK capabilities, limitations, and gotchas for each sponsor platform as you work through the learning phase.

---

## 0G

**Docs:** https://docs.0g.ai | **Builder Hub:** https://build.0g.ai

### 0G Chain
- EVM-compatible L1, AI-first blockchain
- 11k+ peak TPS per shard
- Testnet RPC: *(Network name - OG-Galileo-Testnet (added to metamask), chain ID - 16602, Token Symbol - 0G, Block Explorer - https://chainscan-galileo.0g.ai, RPC: evmrpc-testnet.0g.ai)*
- Faucet URL: *(https://faucet.0g.ai and https://cloud.google.com/application/web3/faucet/0g/galileo)*
- Chain ID: *(16602)*

### 0G Storage
- Decentralized storage with content addressing
- SDK: *(npm install @0g-foundation/0g-ts-sdk ethers)*
- API endpoints: *(fill in during research)*
- Reference: *(github.com/0gfoundation/0g-storage-ts-starter-kit)*

### ERC-7857 iNFT
- Spec: https://eips.ethereum.org/EIPS/eip-7857
- Verification: TEE vs ZKP approaches (I think it should TEE + ZKP. TEE for speed and ZKP for provability. Let me know what you think.)
- Technical Setup: Seems to require API access (keys for 0G storage and Compute services) refer build.0g.ai/compute/ and build.0g.ai/storage/
- Reference implementations: *(github.com/0gfoundation/agenticID-examples)*
- docs: build.0g.ai/agentic-id/

### Notes & Gotchas
*(Documentation seems to show only code without much explaination. Add your thoughts too.)*

---

## Uniswap Foundation

**Docs:** https://developers.uniswap.org | **AI Tools:** https://github.com/uniswap/uniswap-ai

### Trading API
- Base URL: *(https://trade-api.gateway.uniswap.org/v1)*
- Auth: API key from developers.uniswap.org/dashboard
- Key endpoints:
  - `POST /quote` - Get swap quotes
  - `POST /check_approval` - Verify token approvals
  - `POST /swap` - Execute swaps
- Supported chains: *(fill in during research)*
- Rate limits: *(fill in during research)*
- interesting headers: x-permit2-disabled: false

### TypeScript SDK
- Package name: *(experimental - forge install uniswap/v4-core and forge install uniswap/v4-periphery, also available npm i @uniswap/v4-sdk. LTS - npm i --save @uniswap/v3-sdk @uniswap/sdk-core. Note, a Uniswap V3 fork is deployed on 0G chain and therefore, v3 seems like the right option)*
- Key classes/functions: *(developers.uniswap.org/docs/api-reference/aggregator_quote, developers.uniswap.org/docs/api-reference/check_approval, developers.uniswap.org/docs/api-reference/create_swap_transaction, developers.uniswap.org/docs/api-reference/get_swaps)*

### Notes & Gotchas
*(There are claude code skills references in the documentation. Not sure how that is relevant for us. Please use agents to research)*

### FEEDBACK.md Topics to Track
- [ ] Documentation quality and gaps
- [x] API response times and reliability
- [x] Error messages - helpful or confusing?
- [ ] Missing endpoints or features
- [ ] TypeScript SDK DX
- [x] What worked well

---

## KeeperHub

**Docs:** https://docs.keeperhub.com

### Platform Overview
- "Execution layer for onchain agents"
- Supports 12 EVM chains, 20+ protocol integrations
- Non-custodial wallets via Turnkey secure enclaves

### REST API (primary integration for production)
- Base URL: *(fill in during research)*
- Auth method: *(fill in during research)*
- Key endpoints: *(fill in during research)*

### MCP Server (alternative for local development)
- Connection method: *(fill in during research)*
- Available tools/functions: *(fill in during research)*

### Workflows
- Trigger types: *(fill in during research)*
- Condition types: *(fill in during research)*
- Action types: *(fill in during research)*
- Supported protocols: Aave, Uniswap, Curve, Lido, Morpho, Pendle, Yearn, Compound, Safe

### CLI
- Install: *(fill in during research)*
- Key commands: *(fill in during research)*

### Payment Rails
- x402 protocol: *(fill in during research)*
- MPP (Micropayment Protocol): *(fill in during research)*

### Notes & Gotchas
*(Fill in during research)*

### Feedback Bounty Topics to Track ($500)
- [ ] UX friction points
- [ ] Bugs encountered
- [ ] Documentation gaps
- [ ] Feature requests
- [ ] What worked well

---

## Other APIs

### DefiLlama
- Docs: https://defillama.com/docs/api
- Endpoints to test:
  - `/pools` - All yield farming pools
  - `/yields` - Current yield data
  - Protocol TVL data
- Rate limits: *(fill in during research)*

### CoinGecko
- Docs: https://www.coingecko.com/en/api
- Token price data for calculations
- Free tier limits: *(fill in during research)*
