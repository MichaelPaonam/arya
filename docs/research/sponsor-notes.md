# Sponsor Research Notes

## To be filled during Day 1-2 research phase

Use this document to capture SDK capabilities, limitations, and gotchas for each sponsor platform as you work through the learning phase.

---

## 0G

**Docs:** https://docs.0g.ai | **Builder Hub:** https://build.0g.ai

### 0G Chain
- EVM-compatible L1, AI-first blockchain
- 11k+ peak TPS per shard
- Testnet RPC: *(fill in during research)*
- Faucet URL: *(fill in during research)*
- Chain ID: *(fill in during research)*

### 0G Storage
- Decentralized storage with content addressing
- SDK: *(fill in during research)*
- API endpoints: *(fill in during research)*

### ERC-7857 iNFT
- Spec: https://eips.ethereum.org/EIPS/eip-7857
- Verification: TEE vs ZKP approaches
- Reference implementations: *(find on GitHub during research)*

### Notes & Gotchas
*(Fill in during research)*

---

## Uniswap Foundation

**Docs:** https://developers.uniswap.org | **AI Tools:** https://github.com/uniswap/uniswap-ai

### Trading API
- Base URL: *(fill in during research)*
- Auth: API key from developers.uniswap.org/dashboard
- Key endpoints:
  - `POST /quote` - Get swap quotes
  - `POST /check_approval` - Verify token approvals
  - `POST /swap` - Execute swaps
- Supported chains: *(fill in during research)*
- Rate limits: *(fill in during research)*

### TypeScript SDK
- Package name: *(fill in during research)*
- Key classes/functions: *(fill in during research)*

### Notes & Gotchas
*(Fill in during research)*

### FEEDBACK.md Topics to Track
- [ ] Documentation quality and gaps
- [ ] API response times and reliability
- [ ] Error messages - helpful or confusing?
- [ ] Missing endpoints or features
- [ ] TypeScript SDK DX
- [ ] What worked well

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
