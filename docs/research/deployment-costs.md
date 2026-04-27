# Deployment & Cost Analysis

## Hackathon Costs (6 days) - Target: ~$5

| Service | Tier | Cost | Limit |
|---------|------|------|-------|
| Vercel | Free (Hobby) | $0 | 1M invocations, 100GB BW, cron included |
| 0G Chain Testnet | Free | $0 | Faucet tokens for gas |
| 0G Storage | Free (testnet) | $0 | Testnet usage |
| Uniswap Trading API | Free tier | $0 | API key required, free for dev |
| KeeperHub | Free tier | $0 | Testnet workflows |
| DefiLlama API | Free | $0 | No auth, no rate limits published |
| CoinGecko API | Free | $0 | 30 calls/min |
| Upstash Redis | Free | $0 | 10K commands/day, 256MB storage |
| LLM (Claude Haiku 4.5) | Pay-per-use | ~$2-5 | $1/MTok input, $5/MTok output |
| **Total** | | **~$2-5** | LLM is the only real cost |

LLM cost estimate: Scout + Risk agents make ~50 LLM calls/day, ~500 tokens input + ~500 tokens output each. 6 days = 300 calls = ~0.3M tokens = ~$1.80 on Haiku. Generous buffer to $5.

---

## Post-Hackathon SaaS (monthly, early users)

| Service | Tier | Cost/month | Notes |
|---------|------|-----------|-------|
| Vercel | Pro | $20 | Includes $20 usage credit |
| Upstash Redis | Pay-as-you-go | ~$5-10 | $0.2/100K commands, sessions + cache |
| Supabase | Free | $0 | 500MB Postgres, 50K MAU (relational data) |
| 0G Chain Mainnet | Usage | ~$5-10 | Gas for agent registration, strategy recording |
| 0G Storage | Usage | ~$5-10 | Agent memory, strategy history |
| Uniswap API | Depends on tier | TBD | May need higher tier for production |
| KeeperHub | Usage | TBD | Per-workflow execution fees in USDC |
| LLM (Standard plan) | $0 - user pays | $0 | User provides own Anthropic API key |
| LLM (Premium plan) | ARYA pays | ~$5-15/user | Claude Haiku, scales with user count |
| Domain | Annual | ~$1/mo | Custom domain |
| **Total (infra only)** | | **~$30-50/mo** | Before LLM costs for premium users |

---

## LLM Model Pricing (Anthropic)

| Model | Input/MTok | Output/MTok | Best For |
|-------|-----------|-------------|----------|
| Haiku 4.5 | $1 | $5 | Agent reasoning - fast, cheap, sufficient for structured data analysis |
| Sonnet 4.6 | $3 | $15 | Complex multi-protocol strategies, Premium plan |
| Opus 4.7 | $5 | $25 | Overkill for yield farming analysis |

ARYA agents analyze structured JSON (APYs, TVL, risk factors). Haiku is the right cost/performance tradeoff for Standard plan. Premium plan can offer Sonnet for users who want deeper analysis.

---

## Deployment Platform Comparison

| Platform | Cost (24/7 backend) | Serverless | Cron | Free Tier | Verdict |
|----------|-------------------|-----------|------|-----------|---------|
| **Vercel** | N/A (serverless) | Yes | Yes (free) | 1M invocations/mo | **Selected** - all-in-one, zero infra |
| Railway | ~$18-20/mo | No | Yes | $5 trial credits | Too expensive for hackathon |
| Render | ~$7-25/mo | No | Yes | 750 hrs/mo (spins down) | Spin-down latency kills UX |
| Netlify | N/A (serverless) | Yes | Paid add-on | 300 credits/mo | Weaker serverless than Vercel |
| Fly.io | ~$5-15/mo | No | Yes | 3 shared VMs | Good but more ops overhead |

Vercel wins because agents run as serverless functions triggered by cron (Scout) and API calls (Risk, Executor). No 24/7 process needed. Frontend + API + cron in one deploy.

---

## Vercel Free Tier Limits (relevant)

| Resource | Free Limit | ARYA Usage Estimate |
|----------|-----------|-------------------|
| Serverless invocations | 1M/month | ~3K/month (Scout every 15min + Risk/Executor on demand) |
| Active CPU | 4 hours/month | ~2 hours/month (agents are fast) |
| Bandwidth | 100 GB/month | <1 GB (JSON APIs, no media) |
| Cron Jobs | Included | 1 cron (Scout every 15min) |
| Edge Requests | 1M/month | ~10K/month (dashboard traffic) |

Free tier is more than sufficient for hackathon and early SaaS.
