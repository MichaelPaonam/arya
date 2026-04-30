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

export async function fetchPools(_params: { minTvl: number; limit: number }): Promise<PoolData[]> {
  throw new Error("Not implemented");
}

export async function fetchPoolHistory(_poolId: string): Promise<PoolHistoryEntry[]> {
  throw new Error("Not implemented");
}

export async function fetchTokenPrices(_coins: string[]): Promise<TokenPrice[]> {
  throw new Error("Not implemented");
}
