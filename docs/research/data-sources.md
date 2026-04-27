# Data Sources for DeFi Visualization

## How CoinMarketCap Aggregates Data

CoinMarketCap does **not** read directly from blockchains. Their data pipeline:

1. **Centralized Exchange APIs** - They pull price, volume, and order book data from 600+ exchanges (Binance, Coinbase, Kraken, etc.) via exchange-provided REST/WebSocket APIs
2. **Aggregation engine** - Calculates volume-weighted average price (VWAP) across exchanges, filters wash trading, excludes outlier exchanges
3. **On-chain metrics** - For supply data (circulating supply, max supply), they supplement exchange data with blockchain node queries or project-reported data
4. **DEX data** - Aggregates from DEX protocols (Uniswap, PancakeSwap) via on-chain indexers

They are fundamentally an **exchange data aggregator**, not a blockchain indexer.

### CoinMarketCap API

| Tier | Price | Credits/month | Rate Limit | Historical Data |
|------|-------|---------------|------------|-----------------|
| Basic (Free) | $0 | 10,000 | 30/min | No |
| Hobbyist | $29/mo | 110,000 | 30/min | Limited |
| Startup | $79/mo | 300,000 | 30/min | Yes |
| Standard | $299/mo | 1.2M | 60/min | Yes |
| Professional | $699/mo | 3M | 90/min | Yes |

Free tier: 11 endpoints, personal use only, no historical data. Enough for basic price lookups but not for serious yield farming analytics.

---

## Free Data Sources for ARYA

### Tier 1: Best Options (Free, No Auth, Rich Data)

#### DefiLlama API - PRIMARY for ARYA
- **Cost:** Completely free, no API key needed
- **Base URL:** `https://api.llama.fi`
- **31 endpoints** covering:

| Category | Key Endpoints | Use in ARYA |
|----------|--------------|-------------|
| **Yields/Pools** | `/pools`, `/chart/{pool}` | Scout Agent discovers opportunities - APY, TVL, pool composition |
| **TVL** | `/protocols`, `/protocol/{name}`, `/tvl/{protocol}` | Risk Agent assesses protocol health via TVL trends |
| **Token Prices** | `/prices/current/{coins}`, `/prices/historical/{ts}/{coins}` | Risk Agent calculates impermanent loss estimates |
| **DEX Volumes** | `/overview/dexs`, `/summary/dexs/{protocol}` | Scout Agent evaluates pool liquidity/activity |
| **Fees/Revenue** | `/overview/fees`, `/summary/fees/{protocol}` | Scout Agent estimates real yield vs token emissions |
| **Stablecoins** | `/stablecoins`, `/stablecoincharts/{chain}` | Risk Agent monitors stablecoin de-peg risk |

**Verdict: This is the backbone of ARYA's data pipeline.** Free, comprehensive, covers yield farming perfectly.

#### CoinGecko API (Free Tier)
- **Cost:** Free tier available (30 calls/min, no API key for basic endpoints)
- Token prices, market data, historical charts
- Good supplement to DefiLlama for token metadata and price feeds

### Tier 2: On-Chain Data (Free/Low Cost)

#### The Graph (Decentralized Indexer)
- **What:** Indexes blockchain events into queryable subgraphs via GraphQL
- **Cost:** Free tier available for hosted subgraphs. Decentralized network charges per query (small fractions of GRT token)
- **Key subgraphs for ARYA:**
  - Uniswap v3 subgraph - pool data, positions, swap history
  - Aave subgraph - lending rates, utilization
  - Compound subgraph - supply/borrow rates
- **Verdict:** Useful for granular on-chain data that DefiLlama doesn't cover. The Uniswap subgraph is particularly relevant.

#### Public RPC Endpoints (Direct On-Chain Reads)
- **What:** Call smart contract `view` functions directly (e.g., `balanceOf`, `getReserves`, pool state)
- **Cost:** Free public RPCs exist for most chains but are rate-limited and unreliable
- **For ARYA:** Needed for interacting with our own contracts on 0G Chain testnet. Not practical for large-scale data aggregation.

#### Alchemy (RPC Provider)
- **Free tier:** 30M compute units/month, 25 req/sec, all mainnets + testnets
- **Paid:** $0.45/1M CUs
- **Supports:** Ethereum, Polygon, Arbitrum, Optimism, Base, and many more
- **For ARYA:** Good fallback RPC for reliable on-chain reads. Free tier is generous enough for hackathon.

#### Infura (RPC Provider)
- **Free tier:** 100K requests/day across all networks
- Similar to Alchemy - reliable RPC access to read on-chain state

### Tier 3: Exchange APIs (Free Tiers)

Most centralized exchanges offer free APIs for market data:

| Exchange | Free API | Rate Limit | Data Available |
|----------|----------|-----------|----------------|
| Binance | Yes, no auth for public data | 1200 req/min | Prices, order books, trades, klines |
| Coinbase | Yes, no auth for public data | 10 req/sec | Prices, trades, order books |
| Kraken | Yes, no auth for public data | 15 req/sec | OHLC, order books, trades |
| OKX | Yes, no auth for public data | 20 req/sec | Prices, order books, candles |

**For ARYA:** Not directly needed - we focus on DeFi/on-chain yield, not CEX trading. But could supplement price data if CoinGecko is slow.

---

## Recommended Data Stack for ARYA

```
Priority 1 (Must have):
  DefiLlama API ──→ Scout Agent (yields, pools, TVL, prices)
  Uniswap Trading API ──→ Executor Agent (swap quotes, execution)
  0G Chain RPC ──→ All agents (our smart contract interactions)

Priority 2 (Should have):
  CoinGecko API ──→ Risk Agent (price feeds, token metadata)
  The Graph (Uniswap subgraph) ──→ Scout Agent (granular pool data)

Priority 3 (Nice to have):
  Alchemy RPC ──→ Reliable fallback for on-chain reads
  Exchange APIs ──→ Supplementary price data
```

---

## Can We Read On-Chain Data Without Cost?

**Short answer: Yes, for reads. Writes cost gas.**

| Action | Cost | Method |
|--------|------|--------|
| Read contract state (`view`/`pure` functions) | Free | RPC `eth_call` - no transaction, no gas |
| Read events/logs | Free | RPC `eth_getLogs` - filter by topic/address |
| Read block data | Free | RPC `eth_getBlockByNumber` |
| Write/execute transactions | Gas fees | Requires signing + submitting transaction |
| Index historical events at scale | Free-ish | The Graph or run your own indexer |

**For ARYA's hackathon demo on testnet:** All reads are free (testnet RPCs). Writes use testnet tokens (free from faucets). Zero real cost.

**For a production version:** The aggregator approach (DefiLlama + The Graph) is far more efficient than raw RPC calls. Querying every Uniswap pool directly via RPC would require thousands of calls per scan - aggregators pre-index this data.

---

## Key Takeaway for ARYA

We don't need to build a data pipeline from scratch like CoinMarketCap did. DefiLlama has already aggregated the yield/pool data we need, for free, with no API key. Our Scout Agent simply queries DefiLlama endpoints and the Uniswap Trading API. The only on-chain interaction is with our own smart contracts on 0G testnet, which is free.
