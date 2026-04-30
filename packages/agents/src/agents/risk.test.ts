import { describe, it, expect, vi, beforeEach } from "vitest";
import { riskAgent } from "./risk.js";
import type { OpportunityFound, RiskAssessment } from "../types/index.js";

vi.mock("../tools/defillama.js", () => ({
  fetchPoolHistory: vi.fn(),
  fetchTokenPrices: vi.fn(),
}));

vi.mock("../tools/og-storage.js", () => ({
  downloadMemory: vi.fn(),
}));

vi.mock("../utils/llm.js", () => ({
  chatCompletion: vi.fn(),
}));

vi.mock("../utils/impermanent-loss.js", () => ({
  calculateIL: vi.fn(),
}));

describe("Risk Agent", () => {
  const mockOpportunity: OpportunityFound = {
    id: "opp-1",
    protocol: "uniswap-v3",
    pool: "0xpool1",
    tokenPair: ["USDC", "ETH"],
    estimatedAPY: 12.5,
    tvl: 50_000_000,
    category: "liquidity_provision",
    source: "defi-llama",
    reasoning: "Strong TVL",
    discoveredAt: Date.now(),
    agentId: "scout-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should produce a risk assessment for a given opportunity", async () => {
    const { fetchPoolHistory } = await import("../tools/defillama.js");
    vi.mocked(fetchPoolHistory).mockResolvedValue([
      { timestamp: "2026-04-01", tvlUsd: 48_000_000, apy: 11 },
      { timestamp: "2026-04-15", tvlUsd: 50_000_000, apy: 12.5 },
      { timestamp: "2026-04-30", tvlUsd: 51_000_000, apy: 13 },
    ]);

    const { calculateIL } = await import("../utils/impermanent-loss.js");
    vi.mocked(calculateIL).mockReturnValue(2.5);

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({
      riskScore: 4,
      contractRisk: "low",
      liquidityRisk: "low",
      correlationWithPortfolio: 0.3,
      reasoning: "Well-established pool with consistent TVL growth. Low IL risk for stablecoin pair.",
    });

    const result = await riskAgent({
      opportunity: mockOpportunity,
      agentId: "risk-1",
    });

    expect(result.assessment.riskScore).toBeGreaterThanOrEqual(1);
    expect(result.assessment.riskScore).toBeLessThanOrEqual(10);
    expect(result.assessment.impermanentLoss).toBe(2.5);
    expect(result.assessment.reasoning).toBeTruthy();
    expect(result.assessment.opportunityId).toBe("opp-1");
  });

  it("should assign high risk score to low TVL pools", async () => {
    const lowTvlOpp: OpportunityFound = {
      ...mockOpportunity,
      tvl: 100_000,
      protocol: "unknown-dex",
    };

    const { fetchPoolHistory } = await import("../tools/defillama.js");
    vi.mocked(fetchPoolHistory).mockResolvedValue([]);

    const { calculateIL } = await import("../utils/impermanent-loss.js");
    vi.mocked(calculateIL).mockReturnValue(8.0);

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({
      riskScore: 9,
      contractRisk: "high",
      liquidityRisk: "high",
      correlationWithPortfolio: 0,
      reasoning: "Unknown protocol with negligible TVL. High risk of rug pull or liquidity drain.",
    });

    const result = await riskAgent({
      opportunity: lowTvlOpp,
      agentId: "risk-1",
    });

    expect(result.assessment.riskScore).toBeGreaterThanOrEqual(7);
    expect(result.assessment.contractRisk).toBe("high");
  });

  it("should calculate impermanent loss using price history", async () => {
    const { fetchPoolHistory, fetchTokenPrices } = await import("../tools/defillama.js");
    vi.mocked(fetchPoolHistory).mockResolvedValue([
      { timestamp: "2026-04-01", tvlUsd: 50_000_000, apy: 12 },
    ]);
    vi.mocked(fetchTokenPrices).mockResolvedValue([
      { address: "ethereum:0xusdc", symbol: "USDC", price: 1.0 },
      { address: "ethereum:0xweth", symbol: "WETH", price: 3200 },
    ]);

    const { calculateIL } = await import("../utils/impermanent-loss.js");
    vi.mocked(calculateIL).mockReturnValue(5.7);

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({
      riskScore: 5,
      contractRisk: "low",
      liquidityRisk: "medium",
      correlationWithPortfolio: 0.2,
      reasoning: "Moderate IL risk due to ETH volatility.",
    });

    const result = await riskAgent({
      opportunity: mockOpportunity,
      agentId: "risk-1",
    });

    expect(calculateIL).toHaveBeenCalled();
    expect(result.assessment.impermanentLoss).toBe(5.7);
  });

  it("should handle missing historical data gracefully", async () => {
    const { fetchPoolHistory } = await import("../tools/defillama.js");
    vi.mocked(fetchPoolHistory).mockResolvedValue([]);

    const { calculateIL } = await import("../utils/impermanent-loss.js");
    vi.mocked(calculateIL).mockReturnValue(0);

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({
      riskScore: 6,
      contractRisk: "medium",
      liquidityRisk: "medium",
      correlationWithPortfolio: 0,
      reasoning: "Insufficient historical data increases uncertainty.",
    });

    const result = await riskAgent({
      opportunity: mockOpportunity,
      agentId: "risk-1",
    });

    expect(result.assessment.riskScore).toBeGreaterThanOrEqual(5);
    expect(result.assessment.reasoning).toContain("historical");
  });

  it("should produce assessments that conform to RiskAssessment schema", async () => {
    const { fetchPoolHistory } = await import("../tools/defillama.js");
    vi.mocked(fetchPoolHistory).mockResolvedValue([{ timestamp: "2026-04-01", tvlUsd: 50_000_000, apy: 12 }]);

    const { calculateIL } = await import("../utils/impermanent-loss.js");
    vi.mocked(calculateIL).mockReturnValue(3.0);

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({
      riskScore: 4,
      contractRisk: "low",
      liquidityRisk: "low",
      correlationWithPortfolio: 0.1,
      reasoning: "Stable and well-audited protocol.",
    });

    const result = await riskAgent({
      opportunity: mockOpportunity,
      agentId: "risk-1",
    });

    const assessment: RiskAssessment = result.assessment;
    expect(assessment.opportunityId).toBe(mockOpportunity.id);
    expect(assessment.agentId).toBe("risk-1");
    expect(["low", "medium", "high"]).toContain(assessment.contractRisk);
    expect(["low", "medium", "high"]).toContain(assessment.liquidityRisk);
    expect(assessment.correlationWithPortfolio).toBeGreaterThanOrEqual(-1);
    expect(assessment.correlationWithPortfolio).toBeLessThanOrEqual(1);
  });
});
