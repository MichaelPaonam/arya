import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectDebateTier } from "./router.js";
import { runTier1 } from "./tier1-fast.js";
import { runTier2 } from "./tier2-standard.js";
import { runTier3 } from "./tier3-deep.js";
import { runDebate } from "./index.js";
import type { OpportunityFound, RiskAssessment, DebateTier } from "../types/index.js";

vi.mock("../utils/llm.js", () => ({
  chatCompletion: vi.fn(),
}));

describe("Debate Protocol", () => {
  const mockOpportunity: OpportunityFound = {
    id: "opp-1",
    protocol: "uniswap-v3",
    pool: "0xpool",
    tokenPair: ["USDC", "ETH"],
    estimatedAPY: 12.5,
    tvl: 50_000_000,
    category: "liquidity_provision",
    source: "defi-llama",
    reasoning: "High APY",
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
    reasoning: "Low risk",
    agentId: "risk-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Tier Router", () => {
    it("should route arbitrage to fast tier", () => {
      const tier = selectDebateTier(
        { ...mockOpportunity, category: "arbitrage" },
        mockAssessment
      );
      expect(tier).toBe("fast");
    });

    it("should route low risk + high TVL to fast tier", () => {
      const tier = selectDebateTier(
        { ...mockOpportunity, tvl: 100_000_000 },
        { ...mockAssessment, riskScore: 2 }
      );
      expect(tier).toBe("fast");
    });

    it("should route high risk to deep tier", () => {
      const tier = selectDebateTier(
        mockOpportunity,
        { ...mockAssessment, riskScore: 8 }
      );
      expect(tier).toBe("deep");
    });

    it("should route unknown protocol to deep tier", () => {
      const tier = selectDebateTier(
        { ...mockOpportunity, protocol: "unknown" },
        mockAssessment
      );
      expect(tier).toBe("deep");
    });

    it("should default to standard tier", () => {
      const tier = selectDebateTier(mockOpportunity, mockAssessment);
      expect(tier).toBe("standard");
    });

    it("should route stablecoin lending with low risk to fast", () => {
      const tier = selectDebateTier(
        { ...mockOpportunity, category: "lending", tvl: 200_000_000 },
        { ...mockAssessment, riskScore: 2 }
      );
      expect(tier).toBe("fast");
    });
  });

  describe("Tier 1: Fast Path", () => {
    it("should produce outcome without LLM call", async () => {
      const outcome = await runTier1({
        opportunity: mockOpportunity,
        riskAssessment: mockAssessment,
      });

      expect(outcome.tier).toBe("fast");
      expect(outcome.confidenceScore).toBeGreaterThan(0);
      expect(outcome.latencyMs).toBeLessThan(2000);
      expect(outcome.debateLog).toHaveLength(0);
    });

    it("should compute confidence from risk score", async () => {
      const lowRisk = await runTier1({
        opportunity: mockOpportunity,
        riskAssessment: { ...mockAssessment, riskScore: 2 },
      });

      const highRisk = await runTier1({
        opportunity: mockOpportunity,
        riskAssessment: { ...mockAssessment, riskScore: 6 },
      });

      expect(lowRisk.confidenceScore).toBeGreaterThan(highRisk.confidenceScore);
    });
  });

  describe("Tier 2: Standard Path", () => {
    it("should generate one challenge from Risk agent", async () => {
      const { chatCompletion } = await import("../utils/llm.js");
      vi.mocked(chatCompletion).mockResolvedValue({
        challengeType: "risk_underestimate",
        evidence: "Historical volatility of ETH suggests higher IL than estimated.",
        severity: "medium",
      });

      const outcome = await runTier2({
        opportunity: mockOpportunity,
        riskAssessment: mockAssessment,
        riskAgentId: "risk-1",
      });

      expect(outcome.tier).toBe("standard");
      expect(outcome.challengesRaised).toBe(1);
      expect(outcome.debateLog).toHaveLength(1);
      expect(outcome.debateLog[0]).toHaveProperty("evidence");
    });

    it("should respect 10s timeout", async () => {
      const { chatCompletion } = await import("../utils/llm.js");
      vi.mocked(chatCompletion).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          challengeType: "assumption_invalid",
          evidence: "Delayed response",
          severity: "low",
        }), 15_000))
      );

      const outcome = await runTier2({
        opportunity: mockOpportunity,
        riskAssessment: mockAssessment,
        riskAgentId: "risk-1",
        timeoutMs: 10_000,
      });

      expect(outcome.latencyMs).toBeLessThanOrEqual(10_500);
    });
  });

  describe("Tier 3: Deep Path", () => {
    it("should produce multi-round debate with challenge and response", async () => {
      const { chatCompletion } = await import("../utils/llm.js");

      // Round 1: Risk challenges
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          challengeType: "data_contradiction",
          evidence: "APY has been declining for 2 weeks",
          severity: "high",
        })
        // Round 1: Scout responds
        .mockResolvedValueOnce({
          response: "counter",
          counterEvidence: "Decline was due to temporary liquidity event, now recovered",
        })
        // Round 2: Risk re-challenges
        .mockResolvedValueOnce({
          challengeType: "assumption_invalid",
          evidence: "Recovery may not sustain — similar patterns preceded 3 past collapses",
          severity: "medium",
        })
        // Round 2: Scout responds
        .mockResolvedValueOnce({
          response: "concede",
        })
        // Orchestrator scores
        .mockResolvedValueOnce({
          confidenceScore: 0.6,
        });

      const outcome = await runTier3({
        opportunity: mockOpportunity,
        riskAssessment: mockAssessment,
        riskAgentId: "risk-1",
        scoutAgentId: "scout-1",
        orchestratorAgentId: "orch-1",
        maxRounds: 3,
      });

      expect(outcome.tier).toBe("deep");
      expect(outcome.challengesRaised).toBe(2);
      expect(outcome.challengesSurvived).toBe(1);
      expect(outcome.confidenceScore).toBe(0.6);
      expect(outcome.debateLog.length).toBeGreaterThanOrEqual(3);
    });

    it("should stop after max rounds even if not resolved", async () => {
      const { chatCompletion } = await import("../utils/llm.js");

      // 3 rounds of counter
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({ challengeType: "risk_underestimate", evidence: "Challenge 1", severity: "medium" })
        .mockResolvedValueOnce({ response: "counter", counterEvidence: "Counter 1" })
        .mockResolvedValueOnce({ challengeType: "correlation_risk", evidence: "Challenge 2", severity: "medium" })
        .mockResolvedValueOnce({ response: "counter", counterEvidence: "Counter 2" })
        .mockResolvedValueOnce({ challengeType: "assumption_invalid", evidence: "Challenge 3", severity: "low" })
        .mockResolvedValueOnce({ response: "counter", counterEvidence: "Counter 3" })
        .mockResolvedValueOnce({ confidenceScore: 0.75 });

      const outcome = await runTier3({
        opportunity: mockOpportunity,
        riskAssessment: mockAssessment,
        riskAgentId: "risk-1",
        scoutAgentId: "scout-1",
        orchestratorAgentId: "orch-1",
        maxRounds: 3,
      });

      expect(outcome.challengesRaised).toBeLessThanOrEqual(3);
      expect(outcome.confidenceScore).toBeGreaterThan(0);
    });

    it("should respect 45s timeout", async () => {
      const { chatCompletion } = await import("../utils/llm.js");
      vi.mocked(chatCompletion).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          challengeType: "data_contradiction",
          evidence: "Slow",
          severity: "low",
        }), 50_000))
      );

      const outcome = await runTier3({
        opportunity: mockOpportunity,
        riskAssessment: mockAssessment,
        riskAgentId: "risk-1",
        scoutAgentId: "scout-1",
        orchestratorAgentId: "orch-1",
        maxRounds: 3,
        timeoutMs: 45_000,
      });

      expect(outcome.latencyMs).toBeLessThanOrEqual(45_500);
    });

    it("should end early if Scout concedes first challenge", async () => {
      const { chatCompletion } = await import("../utils/llm.js");
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          challengeType: "risk_underestimate",
          evidence: "Contract has no audit",
          severity: "high",
        })
        .mockResolvedValueOnce({
          response: "concede",
        })
        .mockResolvedValueOnce({
          confidenceScore: 0.3,
        });

      const outcome = await runTier3({
        opportunity: mockOpportunity,
        riskAssessment: mockAssessment,
        riskAgentId: "risk-1",
        scoutAgentId: "scout-1",
        orchestratorAgentId: "orch-1",
        maxRounds: 3,
      });

      expect(outcome.challengesRaised).toBe(1);
      expect(outcome.challengesSurvived).toBe(0);
      expect(outcome.confidenceScore).toBe(0.3);
    });
  });

  describe("runDebate (integration)", () => {
    it("should route to correct tier and return outcome", async () => {
      const { chatCompletion } = await import("../utils/llm.js");
      vi.mocked(chatCompletion).mockResolvedValue({
        challengeType: "assumption_invalid",
        evidence: "Some concern",
        severity: "low",
      });

      const outcome = await runDebate({
        opportunity: mockOpportunity,
        riskAssessment: mockAssessment,
        tier: "standard",
        riskAgentId: "risk-1",
        scoutAgentId: "scout-1",
        orchestratorAgentId: "orch-1",
      });

      expect(outcome.tier).toBe("standard");
      expect(outcome.strategyId).toBe("opp-1");
    });
  });
});
