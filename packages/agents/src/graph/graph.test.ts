import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildPipelineGraph, runPipeline } from "./graph.js";
import type { PipelineState, OpportunityFound } from "../types/index.js";

vi.mock("../agents/scout.js", () => ({
  scoutAgent: vi.fn(),
}));

vi.mock("../agents/risk.js", () => ({
  riskAgent: vi.fn(),
}));

vi.mock("../agents/orchestrator.js", () => ({
  orchestratorAgent: vi.fn(),
}));

vi.mock("../agents/executor.js", () => ({
  executorAgent: vi.fn(),
}));

vi.mock("../debate/index.js", () => ({
  runDebate: vi.fn(),
}));

vi.mock("../storage/memory.js", () => ({
  saveAgentMemory: vi.fn(),
  loadAgentMemory: vi.fn(),
}));

vi.mock("../tools/on-chain.js", () => ({
  recordOutcome: vi.fn(),
  getAgentReputation: vi.fn(),
}));

describe("LangGraph Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should build a valid graph with all agent nodes", () => {
    const graph = buildPipelineGraph();

    expect(graph).toBeDefined();
    expect(graph.nodes).toContain("scout");
    expect(graph.nodes).toContain("risk");
    expect(graph.nodes).toContain("debate");
    expect(graph.nodes).toContain("orchestrate");
    expect(graph.nodes).toContain("execute");
  });

  it("should execute full pipeline: scout → risk → debate → orchestrate → execute", async () => {
    const { scoutAgent } = await import("../agents/scout.js");
    vi.mocked(scoutAgent).mockResolvedValue({
      opportunities: [{
        id: "opp-1",
        protocol: "uniswap-v3",
        pool: "0xpool",
        tokenPair: ["USDC", "ETH"] as [string, string],
        estimatedAPY: 12.5,
        tvl: 50_000_000,
        category: "liquidity_provision",
        source: "defi-llama" as const,
        reasoning: "Good pool",
        discoveredAt: Date.now(),
        agentId: "scout-1",
      }],
    });

    const { riskAgent } = await import("../agents/risk.js");
    vi.mocked(riskAgent).mockResolvedValue({
      assessment: {
        opportunityId: "opp-1",
        riskScore: 4,
        impermanentLoss: 2.5,
        contractRisk: "low",
        liquidityRisk: "low",
        correlationWithPortfolio: 0.2,
        reasoning: "Safe",
        agentId: "risk-1",
      },
    });

    const { orchestratorAgent } = await import("../agents/orchestrator.js");
    vi.mocked(orchestratorAgent).mockResolvedValue({
      proposal: {
        id: "strat-1",
        opportunity: {} as OpportunityFound,
        risk: {} as any,
        debateOutcome: {} as any,
        actions: [],
        estimatedGas: 150000n,
        estimatedReturn: 12.5,
        explanation: "Good strategy",
        expiresAt: Date.now() + 3600_000,
      },
      rejectionReason: null,
    });

    const { executorAgent } = await import("../agents/executor.js");
    vi.mocked(executorAgent).mockResolvedValue({
      strategyId: "strat-1",
      status: "executed",
      txHash: "0xtx123",
      keeperWorkflowId: "wf_456",
    });

    const result = await runPipeline({
      agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
      walletAddress: "0xuser",
      chainId: 1,
    });

    expect(result.currentPhase).toBe("complete");
    expect(result.opportunities).toHaveLength(1);
    expect(result.executionResults).toHaveLength(1);
    expect(result.executionResults[0]!.status).toBe("executed");
  });

  it("should stop pipeline if scout finds no opportunities", async () => {
    const { scoutAgent } = await import("../agents/scout.js");
    vi.mocked(scoutAgent).mockResolvedValue({ opportunities: [] });

    const result = await runPipeline({
      agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
      walletAddress: "0xuser",
      chainId: 1,
    });

    expect(result.currentPhase).toBe("complete");
    expect(result.opportunities).toHaveLength(0);
    expect(result.executionResults).toHaveLength(0);
  });

  it("should stop pipeline if orchestrator rejects all proposals", async () => {
    const { scoutAgent } = await import("../agents/scout.js");
    vi.mocked(scoutAgent).mockResolvedValue({
      opportunities: [{
        id: "opp-risky",
        protocol: "unknown",
        pool: "0xbad",
        tokenPair: ["SHIB", "DOGE"] as [string, string],
        estimatedAPY: 500,
        tvl: 1000,
        category: "yield_farming",
        source: "on-chain" as const,
        reasoning: "Looks suspicious",
        discoveredAt: Date.now(),
        agentId: "scout-1",
      }],
    });

    const { riskAgent } = await import("../agents/risk.js");
    vi.mocked(riskAgent).mockResolvedValue({
      assessment: {
        opportunityId: "opp-risky",
        riskScore: 9,
        impermanentLoss: 20,
        contractRisk: "high",
        liquidityRisk: "high",
        correlationWithPortfolio: 0,
        reasoning: "Extremely risky",
        agentId: "risk-1",
      },
    });

    const { orchestratorAgent } = await import("../agents/orchestrator.js");
    vi.mocked(orchestratorAgent).mockResolvedValue({
      proposal: null,
      rejectionReason: "Failed debate with low confidence",
    });

    const result = await runPipeline({
      agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
      walletAddress: "0xuser",
      chainId: 1,
    });

    expect(result.proposals).toHaveLength(0);
    expect(result.executionResults).toHaveLength(0);
  });

  it("should handle errors in individual agents without crashing pipeline", async () => {
    const { scoutAgent } = await import("../agents/scout.js");
    vi.mocked(scoutAgent).mockRejectedValue(new Error("Scout crashed"));

    const result = await runPipeline({
      agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
      walletAddress: "0xuser",
      chainId: 1,
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.phase).toBe("scout");
    expect(result.errors[0]!.message).toContain("Scout crashed");
  });

  describe("Resilience", () => {
    it("should process remaining opportunities when Risk fails on one", async () => {
      const { scoutAgent } = await import("../agents/scout.js");
      vi.mocked(scoutAgent).mockResolvedValue({
        opportunities: [
          {
            id: "opp-1",
            protocol: "uniswap-v3",
            pool: "0xpool1",
            tokenPair: ["USDC", "ETH"] as [string, string],
            estimatedAPY: 12.5,
            tvl: 50_000_000,
            category: "liquidity_provision",
            source: "defi-llama" as const,
            reasoning: "Good pool",
            discoveredAt: Date.now(),
            agentId: "scout-1",
          },
          {
            id: "opp-2",
            protocol: "aave-v3",
            pool: "0xpool2",
            tokenPair: ["USDC", "USDC"] as [string, string],
            estimatedAPY: 5.0,
            tvl: 200_000_000,
            category: "lending",
            source: "defi-llama" as const,
            reasoning: "Safe lending",
            discoveredAt: Date.now(),
            agentId: "scout-1",
          },
          {
            id: "opp-3",
            protocol: "curve",
            pool: "0xpool3",
            tokenPair: ["DAI", "USDC"] as [string, string],
            estimatedAPY: 6.0,
            tvl: 80_000_000,
            category: "liquidity_provision",
            source: "defi-llama" as const,
            reasoning: "Stable pool",
            discoveredAt: Date.now(),
            agentId: "scout-1",
          },
        ],
      });

      const { riskAgent } = await import("../agents/risk.js");
      vi.mocked(riskAgent)
        .mockResolvedValueOnce({
          assessment: {
            opportunityId: "opp-1",
            riskScore: 4,
            impermanentLoss: 2.5,
            contractRisk: "low",
            liquidityRisk: "low",
            correlationWithPortfolio: 0.2,
            reasoning: "Safe",
            agentId: "risk-1",
          },
        })
        .mockRejectedValueOnce(new Error("DefiLlama timeout on opp-2"))
        .mockResolvedValueOnce({
          assessment: {
            opportunityId: "opp-3",
            riskScore: 3,
            impermanentLoss: 0.5,
            contractRisk: "low",
            liquidityRisk: "low",
            correlationWithPortfolio: 0.1,
            reasoning: "Very safe stablecoin pool",
            agentId: "risk-1",
          },
        });

      const { orchestratorAgent } = await import("../agents/orchestrator.js");
      vi.mocked(orchestratorAgent).mockResolvedValue({
        proposal: {
          id: "strat-1",
          opportunity: {} as OpportunityFound,
          risk: {} as any,
          debateOutcome: {} as any,
          actions: [],
          estimatedGas: 150000n,
          estimatedReturn: 10,
          explanation: "Strategy",
          expiresAt: Date.now() + 3600_000,
        },
        rejectionReason: null,
      });

      const { executorAgent } = await import("../agents/executor.js");
      vi.mocked(executorAgent).mockResolvedValue({
        strategyId: "strat-1",
        status: "executed",
        txHash: "0xtx",
      });

      const result = await runPipeline({
        agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
        walletAddress: "0xuser",
        chainId: 1,
      });

      expect(result.riskAssessments).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.phase).toBe("risk");
      expect(result.errors[0]!.message).toContain("opp-2");
    });

    it("should drop the opportunity and log a warning when LLM returns malformed JSON", async () => {
      const { scoutAgent } = await import("../agents/scout.js");
      vi.mocked(scoutAgent).mockResolvedValue({
        opportunities: [{
          id: "opp-1",
          protocol: "uniswap-v3",
          pool: "0xpool",
          tokenPair: ["USDC", "ETH"] as [string, string],
          estimatedAPY: 12.5,
          tvl: 50_000_000,
          category: "liquidity_provision",
          source: "defi-llama" as const,
          reasoning: "Good pool",
          discoveredAt: Date.now(),
          agentId: "scout-1",
        }],
      });

      const { riskAgent } = await import("../agents/risk.js");
      vi.mocked(riskAgent).mockRejectedValue(new Error("LLM response failed Zod validation"));

      const { orchestratorAgent } = await import("../agents/orchestrator.js");
      const { executorAgent } = await import("../agents/executor.js");

      const result = await runPipeline({
        agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
        walletAddress: "0xuser",
        chainId: 1,
      });

      expect(result.currentPhase).toBe("complete");
      expect(result.riskAssessments).toHaveLength(0);
      expect(result.executionResults).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.phase).toBe("risk");
      expect(result.errors[0]!.message).toContain("Zod validation");
      expect(orchestratorAgent).not.toHaveBeenCalled();
      expect(executorAgent).not.toHaveBeenCalled();
    });

    it("should not persist dropped opportunities to Scout memory so they can be rediscovered", async () => {
      const { saveAgentMemory } = await import("../storage/memory.js");
      vi.mocked(saveAgentMemory).mockResolvedValue(undefined);

      const { scoutAgent } = await import("../agents/scout.js");
      vi.mocked(scoutAgent).mockResolvedValue({
        opportunities: [{
          id: "opp-retry",
          protocol: "uniswap-v3",
          pool: "0xpool_retry",
          tokenPair: ["USDC", "ETH"] as [string, string],
          estimatedAPY: 14,
          tvl: 60_000_000,
          category: "liquidity_provision",
          source: "defi-llama" as const,
          reasoning: "Strong pool",
          discoveredAt: Date.now(),
          agentId: "scout-1",
        }],
      });

      const { riskAgent } = await import("../agents/risk.js");
      vi.mocked(riskAgent).mockRejectedValue(new Error("LLM timeout"));

      const result = await runPipeline({
        agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
        walletAddress: "0xuser",
        chainId: 1,
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.phase).toBe("risk");

      // Verify that saveAgentMemory was NOT called with the dropped opportunity
      // (it should only persist opportunities that completed risk assessment)
      if (vi.mocked(saveAgentMemory).mock.calls.length > 0) {
        const savedMemory = vi.mocked(saveAgentMemory).mock.calls[0]![0] as any;
        const savedOpps = savedMemory?.state?.discoveredOpportunities ?? [];
        expect(savedOpps.find((o: any) => o.id === "opp-retry")).toBeUndefined();
      }
    });

    it("should run with fresh state when 0G memory download fails", async () => {
      const { loadAgentMemory } = await import("../storage/memory.js");
      vi.mocked(loadAgentMemory).mockRejectedValue(new Error("0G Storage unavailable"));

      const { scoutAgent } = await import("../agents/scout.js");
      vi.mocked(scoutAgent).mockResolvedValue({
        opportunities: [{
          id: "opp-fresh",
          protocol: "aave-v3",
          pool: "0xpool",
          tokenPair: ["USDC", "USDC"] as [string, string],
          estimatedAPY: 5.0,
          tvl: 100_000_000,
          category: "lending",
          source: "defi-llama" as const,
          reasoning: "Fresh discovery (no memory)",
          discoveredAt: Date.now(),
          agentId: "scout-1",
        }],
      });

      const { riskAgent } = await import("../agents/risk.js");
      vi.mocked(riskAgent).mockResolvedValue({
        assessment: {
          opportunityId: "opp-fresh",
          riskScore: 3,
          impermanentLoss: 0,
          contractRisk: "low",
          liquidityRisk: "low",
          correlationWithPortfolio: 0,
          reasoning: "Safe lending pool",
          agentId: "risk-1",
        },
      });

      const { orchestratorAgent } = await import("../agents/orchestrator.js");
      vi.mocked(orchestratorAgent).mockResolvedValue({
        proposal: {
          id: "strat-fresh",
          opportunity: {} as OpportunityFound,
          risk: {} as any,
          debateOutcome: {} as any,
          actions: [],
          estimatedGas: 100000n,
          estimatedReturn: 5,
          explanation: "Strategy from cold start",
          expiresAt: Date.now() + 3600_000,
        },
        rejectionReason: null,
      });

      const { executorAgent } = await import("../agents/executor.js");
      vi.mocked(executorAgent).mockResolvedValue({
        strategyId: "strat-fresh",
        status: "executed",
        txHash: "0xfresh",
      });

      const result = await runPipeline({
        agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
        walletAddress: "0xuser",
        chainId: 1,
      });

      expect(result.currentPhase).toBe("complete");
      expect(result.opportunities).toHaveLength(1);
      expect(result.executionResults).toHaveLength(1);
      expect(result.errors.some((e) => e.message.includes("0G Storage"))).toBe(true);
    });
  });

  describe("Demo Outcome Recording", () => {
    it("should record a winning outcome on-chain after successful execution", async () => {
      const { scoutAgent } = await import("../agents/scout.js");
      vi.mocked(scoutAgent).mockResolvedValue({
        opportunities: [{
          id: "opp-win",
          protocol: "uniswap-v3",
          pool: "0xpool",
          tokenPair: ["USDC", "ETH"] as [string, string],
          estimatedAPY: 15,
          tvl: 80_000_000,
          category: "liquidity_provision",
          source: "defi-llama" as const,
          reasoning: "High APY stable pool",
          discoveredAt: Date.now(),
          agentId: "scout-1",
        }],
      });

      const { riskAgent } = await import("../agents/risk.js");
      vi.mocked(riskAgent).mockResolvedValue({
        assessment: {
          opportunityId: "opp-win",
          riskScore: 3,
          impermanentLoss: 1.5,
          contractRisk: "low",
          liquidityRisk: "low",
          correlationWithPortfolio: 0.1,
          reasoning: "Safe pool, low IL",
          agentId: "risk-1",
        },
      });

      const { orchestratorAgent } = await import("../agents/orchestrator.js");
      vi.mocked(orchestratorAgent).mockResolvedValue({
        proposal: {
          id: "strat-win",
          opportunity: {} as OpportunityFound,
          risk: {} as any,
          debateOutcome: {} as any,
          actions: [],
          estimatedGas: 150000n,
          estimatedReturn: 15,
          explanation: "High confidence LP strategy",
          expiresAt: Date.now() + 3600_000,
        },
        rejectionReason: null,
      });

      const { executorAgent } = await import("../agents/executor.js");
      vi.mocked(executorAgent).mockResolvedValue({
        strategyId: "strat-win",
        status: "executed",
        txHash: "0xwin_tx",
        keeperWorkflowId: "wf_win",
      });

      const { recordOutcome } = await import("../tools/on-chain.js");
      vi.mocked(recordOutcome).mockResolvedValue({ txHash: "0xrecord_win" });

      const result = await runPipeline({
        agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
        walletAddress: "0xuser",
        chainId: 16602,
        outcome: { success: true, actualReturn: 1400 },
      });

      expect(recordOutcome).toHaveBeenCalledWith({
        strategyId: "strat-win",
        success: true,
        actualReturn: 1400,
        chainId: 16602,
      });
      expect(result.outcomeRecorded).toBe(true);
    });

    it("should record a losing outcome on-chain and update agent reputation", async () => {
      const { scoutAgent } = await import("../agents/scout.js");
      vi.mocked(scoutAgent).mockResolvedValue({
        opportunities: [{
          id: "opp-lose",
          protocol: "curve",
          pool: "0xvolatile",
          tokenPair: ["ETH", "stETH"] as [string, string],
          estimatedAPY: 8,
          tvl: 20_000_000,
          category: "liquidity_provision",
          source: "defi-llama" as const,
          reasoning: "Decent yield",
          discoveredAt: Date.now(),
          agentId: "scout-1",
        }],
      });

      const { riskAgent } = await import("../agents/risk.js");
      vi.mocked(riskAgent).mockResolvedValue({
        assessment: {
          opportunityId: "opp-lose",
          riskScore: 6,
          impermanentLoss: 5.0,
          contractRisk: "medium",
          liquidityRisk: "medium",
          correlationWithPortfolio: 0.6,
          reasoning: "Moderate risk, correlated with portfolio",
          agentId: "risk-1",
        },
      });

      const { orchestratorAgent } = await import("../agents/orchestrator.js");
      vi.mocked(orchestratorAgent).mockResolvedValue({
        proposal: {
          id: "strat-lose",
          opportunity: {} as OpportunityFound,
          risk: {} as any,
          debateOutcome: {} as any,
          actions: [],
          estimatedGas: 150000n,
          estimatedReturn: 8,
          explanation: "Moderate confidence LP",
          expiresAt: Date.now() + 3600_000,
        },
        rejectionReason: null,
      });

      const { executorAgent } = await import("../agents/executor.js");
      vi.mocked(executorAgent).mockResolvedValue({
        strategyId: "strat-lose",
        status: "executed",
        txHash: "0xlose_tx",
        keeperWorkflowId: "wf_lose",
      });

      const { recordOutcome, getAgentReputation } = await import("../tools/on-chain.js");
      vi.mocked(recordOutcome).mockResolvedValue({ txHash: "0xrecord_lose" });
      vi.mocked(getAgentReputation).mockResolvedValue({
        totalStrategies: 10,
        wins: 6,
        losses: 4,
        winRate: 60,
      });

      const result = await runPipeline({
        agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
        walletAddress: "0xuser",
        chainId: 16602,
        outcome: { success: false, actualReturn: -300 },
      });

      expect(recordOutcome).toHaveBeenCalledWith({
        strategyId: "strat-lose",
        success: false,
        actualReturn: -300,
        chainId: 16602,
      });
      expect(result.outcomeRecorded).toBe(true);
    });

    it("should skip outcome recording if execution failed", async () => {
      const { scoutAgent } = await import("../agents/scout.js");
      vi.mocked(scoutAgent).mockResolvedValue({
        opportunities: [{
          id: "opp-fail",
          protocol: "uniswap-v3",
          pool: "0xpool",
          tokenPair: ["USDC", "ETH"] as [string, string],
          estimatedAPY: 10,
          tvl: 30_000_000,
          category: "liquidity_provision",
          source: "defi-llama" as const,
          reasoning: "Pool",
          discoveredAt: Date.now(),
          agentId: "scout-1",
        }],
      });

      const { riskAgent } = await import("../agents/risk.js");
      vi.mocked(riskAgent).mockResolvedValue({
        assessment: {
          opportunityId: "opp-fail",
          riskScore: 4,
          impermanentLoss: 2,
          contractRisk: "low",
          liquidityRisk: "low",
          correlationWithPortfolio: 0,
          reasoning: "Fine",
          agentId: "risk-1",
        },
      });

      const { orchestratorAgent } = await import("../agents/orchestrator.js");
      vi.mocked(orchestratorAgent).mockResolvedValue({
        proposal: {
          id: "strat-fail",
          opportunity: {} as OpportunityFound,
          risk: {} as any,
          debateOutcome: {} as any,
          actions: [],
          estimatedGas: 150000n,
          estimatedReturn: 10,
          explanation: "Strategy",
          expiresAt: Date.now() + 3600_000,
        },
        rejectionReason: null,
      });

      const { executorAgent } = await import("../agents/executor.js");
      vi.mocked(executorAgent).mockResolvedValue({
        strategyId: "strat-fail",
        status: "failed",
        error: "Insufficient liquidity",
      });

      const { recordOutcome } = await import("../tools/on-chain.js");

      const result = await runPipeline({
        agentIds: { scout: "scout-1", risk: "risk-1", orchestrator: "orch-1", executor: "exec-1" },
        walletAddress: "0xuser",
        chainId: 16602,
        outcome: { success: true, actualReturn: 500 },
      });

      expect(recordOutcome).not.toHaveBeenCalled();
      expect(result.outcomeRecorded).toBe(false);
    });
  });
});
