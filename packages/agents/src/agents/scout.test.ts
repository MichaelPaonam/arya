import { describe, it, expect, vi, beforeEach } from "vitest";
import { scoutAgent } from "./scout.js";
import type { OpportunityFound } from "../types/index.js";

vi.mock("../tools/defillama.js", () => ({
  fetchPools: vi.fn(),
  fetchPoolHistory: vi.fn(),
  fetchTokenPrices: vi.fn(),
}));

vi.mock("../tools/og-storage.js", () => ({
  downloadMemory: vi.fn(),
  uploadMemory: vi.fn(),
}));

vi.mock("../utils/llm.js", () => ({
  chatCompletion: vi.fn(),
}));

describe("Scout Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should discover opportunities from DefiLlama pool data", async () => {
    const { fetchPools } = await import("../tools/defillama.js");
    vi.mocked(fetchPools).mockResolvedValue([
      { pool: "pool-1", chain: "Ethereum", project: "uniswap-v3", symbol: "USDC-ETH", tvlUsd: 50_000_000, apy: 12.5, apyBase: 8, apyReward: 4.5 },
      { pool: "pool-2", chain: "Ethereum", project: "aave-v3", symbol: "USDC", tvlUsd: 200_000_000, apy: 5.2, apyBase: 5.2, apyReward: 0 },
    ]);

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({
      opportunities: [
        {
          id: "opp-1",
          protocol: "uniswap-v3",
          pool: "pool-1",
          tokenPair: ["USDC", "ETH"],
          estimatedAPY: 12.5,
          tvl: 50_000_000,
          category: "liquidity_provision",
          source: "defi-llama",
          reasoning: "Strong TVL with consistent APY above 10%",
        },
      ],
    });

    const result = await scoutAgent({ agentId: "scout-1" });

    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0]!.category).toBe("liquidity_provision");
    expect(result.opportunities[0]!.reasoning).toBeTruthy();
  });

  it("should classify opportunities into correct categories", async () => {
    const { fetchPools } = await import("../tools/defillama.js");
    vi.mocked(fetchPools).mockResolvedValue([
      { pool: "lend-pool", chain: "Ethereum", project: "aave-v3", symbol: "USDC", tvlUsd: 100_000_000, apy: 4.5, apyBase: 4.5, apyReward: 0 },
    ]);

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({
      opportunities: [
        {
          id: "opp-lend",
          protocol: "aave-v3",
          pool: "lend-pool",
          tokenPair: ["USDC", "USDC"],
          estimatedAPY: 4.5,
          tvl: 100_000_000,
          category: "lending",
          source: "defi-llama",
          reasoning: "Single-asset lending with low risk",
        },
      ],
    });

    const result = await scoutAgent({ agentId: "scout-1" });

    expect(result.opportunities[0]!.category).toBe("lending");
  });

  it("should filter out previously discovered opportunities", async () => {
    const { downloadMemory } = await import("../tools/og-storage.js");
    vi.mocked(downloadMemory).mockResolvedValue({
      agentId: "scout-1",
      agentType: "scout",
      version: 5,
      timestamp: Date.now() - 60_000,
      state: {
        discoveredOpportunities: [
          {
            id: "opp-old",
            protocol: "uniswap-v3",
            pool: "pool-1",
            tokenPair: ["USDC", "ETH"] as [string, string],
            estimatedAPY: 12.5,
            tvl: 50_000_000,
            category: "liquidity_provision",
            source: "defi-llama" as const,
            reasoning: "Already found",
            discoveredAt: Date.now() - 60_000,
            agentId: "scout-1",
          },
        ],
      },
    });

    const { fetchPools } = await import("../tools/defillama.js");
    vi.mocked(fetchPools).mockResolvedValue([
      { pool: "pool-1", chain: "Ethereum", project: "uniswap-v3", symbol: "USDC-ETH", tvlUsd: 50_000_000, apy: 12.5, apyBase: 8, apyReward: 4.5 },
    ]);

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({ opportunities: [] });

    const result = await scoutAgent({ agentId: "scout-1", memoryRootHash: "0xprev" });

    expect(result.opportunities).toHaveLength(0);
  });

  it("should handle DefiLlama API failure gracefully", async () => {
    const { fetchPools } = await import("../tools/defillama.js");
    vi.mocked(fetchPools).mockRejectedValue(new Error("API timeout"));

    const result = await scoutAgent({ agentId: "scout-1" });

    expect(result.opportunities).toHaveLength(0);
    expect(result.error).toContain("API timeout");
  });

  it("should produce opportunities with all required fields", async () => {
    const { fetchPools } = await import("../tools/defillama.js");
    vi.mocked(fetchPools).mockResolvedValue([
      { pool: "pool-x", chain: "Ethereum", project: "curve", symbol: "3CRV", tvlUsd: 80_000_000, apy: 7.0, apyBase: 7, apyReward: 0 },
    ]);

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({
      opportunities: [
        {
          id: "opp-x",
          protocol: "curve",
          pool: "pool-x",
          tokenPair: ["DAI", "USDC"],
          estimatedAPY: 7.0,
          tvl: 80_000_000,
          category: "yield_farming",
          source: "defi-llama",
          reasoning: "Stable curve pool with high TVL",
        },
      ],
    });

    const result = await scoutAgent({ agentId: "scout-1" });
    const opp = result.opportunities[0]! as OpportunityFound;

    expect(opp.id).toBeDefined();
    expect(opp.protocol).toBeDefined();
    expect(opp.pool).toBeDefined();
    expect(opp.tokenPair).toHaveLength(2);
    expect(opp.estimatedAPY).toBeGreaterThan(0);
    expect(opp.tvl).toBeGreaterThan(0);
    expect(opp.category).toBeDefined();
    expect(opp.source).toBeDefined();
    expect(opp.reasoning).toBeDefined();
    expect(opp.discoveredAt).toBeGreaterThan(0);
    expect(opp.agentId).toBe("scout-1");
  });
});
