import type { OpportunityFound } from "../types/index.js";
import { fetchPools } from "../tools/defillama.js";
import { downloadMemory } from "../tools/og-storage.js";
import { chatCompletion } from "../utils/llm.js";
import type { AgentMemoryBlob } from "../types/index.js";

export interface ScoutAgentInput {
  agentId: string;
  memoryRootHash?: string;
  poolFilter?: "all" | "stable" | "bluechip";
  poolLimit?: number;
  uniswapOnly?: boolean;
  chainId?: number;
}

export interface ScoutAgentOutput {
  opportunities: OpportunityFound[];
  error?: string;
}

export async function scoutAgent(input: ScoutAgentInput): Promise<ScoutAgentOutput> {
  let previousPools: Set<string> = new Set();

  if (input.memoryRootHash) {
    try {
      const memory: AgentMemoryBlob = await downloadMemory(input.memoryRootHash);
      const previousOpps = memory.state.discoveredOpportunities ?? [];
      previousPools = new Set(previousOpps.map((o) => o.pool));
    } catch {
      // Memory unavailable — proceed without deduplication
    }
  }

  let pools;
  try {
    const filter = input.poolFilter ?? "all";
    pools = await fetchPools({
      minTvl: filter === "bluechip" ? 50_000_000 : 1_000_000,
      limit: input.poolLimit ?? 3,
      maxApy: filter === "stable" ? 30 : filter === "bluechip" ? 50 : undefined,
      stablecoinOnly: filter === "stable",
      uniswapOnly: input.uniswapOnly ?? true,
      chainId: input.chainId ?? 1,
    });
  } catch (err) {
    return {
      opportunities: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const poolsToAnalyze = pools.filter((p) => !previousPools.has(p.pool));
  if (poolsToAnalyze.length === 0) {
    return { opportunities: [] };
  }

  const result = await chatCompletion({
    messages: [
      {
        role: "system",
        content: "You are a DeFi yield scout. Analyze the provided pool data and identify the best opportunities. Return a JSON object with an \"opportunities\" array. Each opportunity must have: id, protocol, pool, tokenPair (array of 2 strings), estimatedAPY, tvl, category (one of: liquidity_provision, yield_farming, arbitrage, lending, staking), source (\"defi-llama\"), reasoning (why this is interesting).",
      },
      {
        role: "user",
        content: JSON.stringify(poolsToAnalyze),
      },
    ],
    temperature: 0.3,
    maxTokens: 4096,
    responseFormat: { type: "json_object" },
  });

  const parsed = result as { opportunities?: Array<Omit<OpportunityFound, "discoveredAt" | "agentId">> };
  const opportunities: OpportunityFound[] = (parsed.opportunities ?? []).map((opp) => ({
    ...opp,
    discoveredAt: Date.now(),
    agentId: input.agentId,
  }));

  return { opportunities };
}
