import { describe, it, expect, vi, beforeEach } from "vitest";
import { orchestratorAgent } from "./orchestrator.js";
import type { OpportunityFound, RiskAssessment, DebateOutcome } from "../types/index.js";

vi.mock("../debate/index.js", () => ({
  runDebate: vi.fn(),
}));

vi.mock("../tools/uniswap.js", () => ({
  getSwapQuote: vi.fn(),
}));

vi.mock("../tools/og-storage.js", () => ({
  uploadMemory: vi.fn(),
  downloadMemory: vi.fn(),
}));

vi.mock("../utils/llm.js", () => ({
  chatCompletion: vi.fn(),
}));

describe("Orchestrator Agent", () => {
  const mockOpportunity: OpportunityFound = {
    id: "opp-1",
    protocol: "uniswap-v3",
    pool: "0xpool1",
    tokenPair: ["USDC", "ETH"],
    estimatedAPY: 12.5,
    tvl: 50_000_000,
    category: "liquidity_provision",
    source: "defi-llama",
    reasoning: "High APY stable pool",
    discoveredAt: Date.now(),
    agentId: "scout-1",
  };

  const mockAssessment: RiskAssessment = {
    opportunityId: "opp-1",
    riskScore: 4,
    impermanentLoss: 2.5,
    contractRisk: "low",
    liquidityRisk: "low",
    correlationWithPortfolio: 0.2,
    reasoning: "Well-established pool",
    agentId: "risk-1",
  };

  const mockDebateOutcome: DebateOutcome = {
    strategyId: "opp-1",
    tier: "standard",
    challengesRaised: 1,
    challengesSurvived: 1,
    confidenceScore: 0.85,
    latencyMs: 3500,
    debateLog: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should coordinate debate and produce a strategy proposal", async () => {
    const { runDebate } = await import("../debate/index.js");
    vi.mocked(runDebate).mockResolvedValue(mockDebateOutcome);

    const { getSwapQuote } = await import("../tools/uniswap.js");
    vi.mocked(getSwapQuote).mockResolvedValue({
      amountOut: "1000000000000000000",
      gasEstimate: "150000",
      route: [{ protocol: "V3", percent: 100 }],
      priceImpact: 0.05,
    });

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({
      explanation: "This USDC-ETH liquidity provision strategy offers 12.5% APY with low risk. The debate confirmed data validity.",
    });

    const result = await orchestratorAgent({
      opportunity: mockOpportunity,
      riskAssessment: mockAssessment,
      agentId: "orch-1",
    });

    expect(result.proposal).toBeDefined();
    expect(result.proposal!.opportunity.id).toBe("opp-1");
    expect(result.proposal!.debateOutcome.confidenceScore).toBeGreaterThan(0);
    expect(result.proposal!.explanation).toBeTruthy();
  });

  it("should reject proposals that fail debate with low confidence", async () => {
    const { runDebate } = await import("../debate/index.js");
    vi.mocked(runDebate).mockResolvedValue({
      ...mockDebateOutcome,
      confidenceScore: 0.2,
      challengesSurvived: 0,
    });

    const result = await orchestratorAgent({
      opportunity: mockOpportunity,
      riskAssessment: { ...mockAssessment, riskScore: 8 },
      agentId: "orch-1",
    });

    expect(result.proposal).toBeNull();
    expect(result.rejectionReason).toContain("confidence");
  });

  it("should select correct debate tier based on opportunity and risk", async () => {
    const { runDebate } = await import("../debate/index.js");
    vi.mocked(runDebate).mockResolvedValue(mockDebateOutcome);

    const { getSwapQuote } = await import("../tools/uniswap.js");
    vi.mocked(getSwapQuote).mockResolvedValue({
      amountOut: "1000000000000000000",
      gasEstimate: "150000",
      route: [],
      priceImpact: 0.01,
    });

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({ explanation: "Good strategy." });

    await orchestratorAgent({
      opportunity: mockOpportunity,
      riskAssessment: mockAssessment,
      agentId: "orch-1",
    });

    expect(runDebate).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "standard" })
    );
  });

  it("should use fast path for arbitrage opportunities", async () => {
    const { runDebate } = await import("../debate/index.js");
    vi.mocked(runDebate).mockResolvedValue({
      ...mockDebateOutcome,
      tier: "fast",
    });

    const { getSwapQuote } = await import("../tools/uniswap.js");
    vi.mocked(getSwapQuote).mockResolvedValue({
      amountOut: "1000000000000000000",
      gasEstimate: "150000",
      route: [],
      priceImpact: 0.01,
    });

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({ explanation: "Quick arb." });

    await orchestratorAgent({
      opportunity: { ...mockOpportunity, category: "arbitrage" },
      riskAssessment: { ...mockAssessment, riskScore: 2 },
      agentId: "orch-1",
    });

    expect(runDebate).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "fast" })
    );
  });

  it("should persist state to 0G Storage after processing", async () => {
    const { runDebate } = await import("../debate/index.js");
    vi.mocked(runDebate).mockResolvedValue(mockDebateOutcome);

    const { getSwapQuote } = await import("../tools/uniswap.js");
    vi.mocked(getSwapQuote).mockResolvedValue({
      amountOut: "1000000000000000000",
      gasEstimate: "150000",
      route: [],
      priceImpact: 0.01,
    });

    const { chatCompletion } = await import("../utils/llm.js");
    vi.mocked(chatCompletion).mockResolvedValue({ explanation: "Persist test." });

    const { uploadMemory } = await import("../tools/og-storage.js");
    vi.mocked(uploadMemory).mockResolvedValue("0xnewRootHash");

    await orchestratorAgent({
      opportunity: mockOpportunity,
      riskAssessment: mockAssessment,
      agentId: "orch-1",
      persistState: true,
    });

    expect(uploadMemory).toHaveBeenCalled();
  });
});
