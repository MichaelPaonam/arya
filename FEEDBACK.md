# Uniswap Trading API — Developer Feedback

## Project

**ARYA — Autonomous Realtime Yield Agents**

A multi-agent AI swarm that discovers, evaluates, and executes DeFi yield strategies with human-in-the-loop oversight. The Executor agent uses the Uniswap Trading API for swap quoting and transaction building.

## How We Used It

1. **Swap Quoting** — When the Orchestrator proposes a strategy (e.g., "enter USDC/ETH pool on Uniswap V3"), the Executor agent calls the Trading API `/quote` endpoint to get the optimal route, expected output, and price impact.

2. **Transaction Building** — On user approval, the Executor uses the API response to build an executable swap transaction with slippage protection and deadline.

3. **Pool Data** — The Scout agent references Uniswap pool metadata (TVL, fee tier, volume) as one signal among several when scoring yield opportunities.

## Integration Points

- `packages/agents/src/tools/uniswap.ts` — API client wrapper (quote, swap building, pool data)
- `packages/frontend/src/app/api/pipeline/route.ts` — Server-side pipeline that triggers execution
- `packages/agents/src/agents/executor.ts` — Executor agent that calls the Uniswap tool

## What Worked Well

- **Clear REST API design** — The `/quote` and `/swap` endpoints are intuitive and well-structured. Request/response shapes are predictable.
- **Permit2 support** — Native Permit2 integration simplifies the approval flow for users (one signature instead of approve + swap).
- **Multi-chain routing** — Being able to specify chainId and get routes across Uniswap deployments without changing the integration pattern.
- **Fast response times** — Quote responses consistently under 500ms, which matters for our real-time SSE pipeline streaming.

## What Could Be Improved

- **TypeScript SDK** — There's no official TypeScript SDK for the Trading API. We wrote our own wrapper (`uniswap.ts`). An official client with typed request/response objects would save integration time.
- **Error messages** — When a quote fails (insufficient liquidity, unsupported pair), the error responses are sometimes generic. More specific error codes (e.g., `INSUFFICIENT_LIQUIDITY` vs `PAIR_NOT_FOUND` vs `AMOUNT_TOO_SMALL`) would reduce debugging time.
- **Rate limit headers** — We didn't encounter rate limits during development, but the docs don't clearly state the limits or include `X-RateLimit-*` headers in responses. For production agents that poll frequently, knowing the budget upfront would help.
- **Testnet support** — The Trading API primarily targets mainnet. For hackathon projects deploying on testnets, having a sandbox/testnet mode (even with fake liquidity) would make end-to-end testing much easier without risking real funds.
- **Webhook for quote expiry** — Quotes have a TTL, but there's no push notification when they expire. For our async approval flow (user reviews strategy → approves minutes later), we have to re-quote. A webhook or longer TTL option for "soft quotes" would help.

## Overall Rating

**7/10** — Solid API design, fast and reliable. The main gap is developer tooling (SDK, better errors, testnet mode). The API itself does exactly what it promises.

## Team

ARYA Autonomous Realtime Yield Agents
