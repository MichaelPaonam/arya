import { z } from "zod";

export interface PoolData {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
}

export interface PoolHistoryEntry {
  timestamp: string;
  tvlUsd: number;
  apy: number;
}

export interface TokenPrice {
  address: string;
  symbol: string;
  price: number;
}

const PoolResponseSchema = z.object({
  status: z.string(),
  data: z.array(z.object({
    pool: z.string(),
    chain: z.string(),
    project: z.string(),
    symbol: z.string(),
    tvlUsd: z.number(),
    apy: z.number().nullable().transform((v) => v ?? 0),
    apyBase: z.number().nullable().optional().transform((v) => v ?? undefined),
    apyReward: z.number().nullable().optional().transform((v) => v ?? undefined),
  })),
});

const PoolHistoryResponseSchema = z.object({
  status: z.string(),
  data: z.array(z.object({
    timestamp: z.string(),
    tvlUsd: z.number(),
    apy: z.number().nullable().transform((v) => v ?? 0),
  })),
});

const YIELDS_BASE_URL = "https://yields.llama.fi";
const COINS_BASE_URL = "https://coins.llama.fi";

export async function fetchPools(params: { minTvl: number; limit: number }): Promise<PoolData[]> {
  const response = await fetch(`${YIELDS_BASE_URL}/pools`);
  if (!response.ok) {
    throw new Error(`DefiLlama pools API error: ${response.status}`);
  }

  const json = await response.json();
  const parsed = PoolResponseSchema.parse(json);

  return parsed.data
    .filter((p) => p.tvlUsd >= params.minTvl)
    .sort((a, b) => b.apy - a.apy)
    .slice(0, params.limit);
}

export async function fetchPoolHistory(poolId: string): Promise<PoolHistoryEntry[]> {
  const response = await fetch(`${YIELDS_BASE_URL}/chart/${poolId}`);
  if (!response.ok) {
    throw new Error(`DefiLlama chart API error: ${response.status}`);
  }

  const json = await response.json();
  const parsed = PoolHistoryResponseSchema.parse(json);

  return parsed.data;
}

export async function fetchTokenPrices(coins: string[]): Promise<TokenPrice[]> {
  const coinParam = coins.join(",");
  const response = await fetch(`${COINS_BASE_URL}/prices/current/${coinParam}`);
  if (!response.ok) {
    throw new Error(`DefiLlama prices API error: ${response.status}`);
  }

  const json = await response.json() as { coins: Record<string, { price: number; symbol: string }> };

  return Object.entries(json.coins).map(([address, data]) => ({
    address,
    symbol: data.symbol,
    price: data.price,
  }));
}
