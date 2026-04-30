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
});
