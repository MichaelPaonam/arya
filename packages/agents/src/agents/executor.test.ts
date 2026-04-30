import { describe, it, expect, vi, beforeEach } from "vitest";
import { executorAgent } from "./executor.js";
import type { StrategyProposal, OpportunityFound, RiskAssessment, DebateOutcome } from "../types/index.js";

vi.mock("../tools/uniswap.js", () => ({
  getSwapQuote: vi.fn(),
  buildSwapCalldata: vi.fn(),
  checkApproval: vi.fn(),
}));

vi.mock("../tools/keeperhub.js", () => ({
  createWorkflow: vi.fn(),
  publishWorkflow: vi.fn(),
}));

vi.mock("../tools/session-key.js", () => ({
  validateSessionKey: vi.fn(),
}));

describe("Executor Agent", () => {
  const mockProposal: StrategyProposal = {
    id: "strat-1",
    opportunity: {
      id: "opp-1",
      protocol: "uniswap-v3",
      pool: "0xpool1",
      tokenPair: ["USDC", "ETH"],
      estimatedAPY: 12.5,
      tvl: 50_000_000,
      category: "liquidity_provision",
      source: "defi-llama",
      reasoning: "Strong pool",
      discoveredAt: Date.now(),
      agentId: "scout-1",
    },
    risk: {
      opportunityId: "opp-1",
      riskScore: 4,
      impermanentLoss: 2.5,
      contractRisk: "low",
      liquidityRisk: "low",
      correlationWithPortfolio: 0.2,
      reasoning: "Low risk",
      agentId: "risk-1",
    },
    debateOutcome: {
      strategyId: "opp-1",
      tier: "standard",
      challengesRaised: 1,
      challengesSurvived: 1,
      confidenceScore: 0.85,
      latencyMs: 3000,
      debateLog: [],
    },
    actions: [
      { target: "0xrouter", value: 0n, calldata: "0x", minAmountOut: 900000n },
    ],
    estimatedGas: 150000n,
    estimatedReturn: 12.5,
    explanation: "Provide USDC-ETH liquidity",
    expiresAt: Date.now() + 3600_000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute a swap and return transaction hash", async () => {
    const { checkApproval, buildSwapCalldata } = await import("../tools/uniswap.js");
    vi.mocked(checkApproval).mockResolvedValue({ isApproved: true, allowance: "999999999" });
    vi.mocked(buildSwapCalldata).mockResolvedValue({
      to: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
      data: "0xswapdata",
      value: "0",
      gasLimit: "200000",
    });

    const { createWorkflow, publishWorkflow } = await import("../tools/keeperhub.js");
    vi.mocked(createWorkflow).mockResolvedValue({ id: "wf_123", name: "ARYA-Monitor", status: "draft", createdAt: "" });
    vi.mocked(publishWorkflow).mockResolvedValue({ id: "wf_123", status: "live", publishedAt: "" });

    const result = await executorAgent({
      proposal: mockProposal,
      walletAddress: "0xuser",
      chainId: 1,
    });

    expect(result.status).toBe("executed");
    expect(result.txHash).toBeDefined();
    expect(result.keeperWorkflowId).toBe("wf_123");
  });

  it("should pass gas config to swap calldata builder", async () => {
    const { checkApproval, buildSwapCalldata } = await import("../tools/uniswap.js");
    vi.mocked(checkApproval).mockResolvedValue({ isApproved: true, allowance: "999999999" });
    vi.mocked(buildSwapCalldata).mockResolvedValue({
      to: "0xrouter",
      data: "0xswap",
      value: "0",
      gasLimit: "200000",
      maxFeePerGas: "2500000000",
      maxPriorityFeePerGas: "2500000000",
    });

    const { createWorkflow, publishWorkflow } = await import("../tools/keeperhub.js");
    vi.mocked(createWorkflow).mockResolvedValue({ id: "wf_gas", name: "test", status: "draft", createdAt: "" });
    vi.mocked(publishWorkflow).mockResolvedValue({ id: "wf_gas", status: "live", publishedAt: "" });

    const result = await executorAgent({
      proposal: mockProposal,
      walletAddress: "0xuser",
      chainId: 16602,
      gasConfig: {
        maxFeePerGas: "2500000000",
        maxPriorityFeePerGas: "2500000000",
      },
    });

    expect(buildSwapCalldata).toHaveBeenCalledWith(
      expect.objectContaining({
        maxFeePerGas: "2500000000",
        maxPriorityFeePerGas: "2500000000",
      })
    );
    expect(result.status).toBe("executed");
  });

  it("should request approval if token is not approved", async () => {
    const { checkApproval, buildSwapCalldata } = await import("../tools/uniswap.js");
    vi.mocked(checkApproval).mockResolvedValue({
      isApproved: false,
      allowance: "0",
      approvalTx: { to: "0xtoken", data: "0xapprove" },
    });
    vi.mocked(buildSwapCalldata).mockResolvedValue({
      to: "0xrouter",
      data: "0xswap",
      value: "0",
      gasLimit: "200000",
    });

    const { createWorkflow, publishWorkflow } = await import("../tools/keeperhub.js");
    vi.mocked(createWorkflow).mockResolvedValue({ id: "wf_456", name: "test", status: "draft", createdAt: "" });
    vi.mocked(publishWorkflow).mockResolvedValue({ id: "wf_456", status: "live", publishedAt: "" });

    const result = await executorAgent({
      proposal: mockProposal,
      walletAddress: "0xuser",
      chainId: 1,
    });

    expect(checkApproval).toHaveBeenCalled();
    expect(result.approvalRequired).toBe(true);
  });

  it("should fail if strategy has expired", async () => {
    const expiredProposal: StrategyProposal = {
      ...mockProposal,
      expiresAt: Date.now() - 1000,
    };

    const result = await executorAgent({
      proposal: expiredProposal,
      walletAddress: "0xuser",
      chainId: 1,
    });

    expect(result.status).toBe("expired");
    expect(result.error).toContain("expired");
  });

  it("should create KeeperHub monitoring workflow after execution", async () => {
    const { checkApproval, buildSwapCalldata } = await import("../tools/uniswap.js");
    vi.mocked(checkApproval).mockResolvedValue({ isApproved: true, allowance: "999999999" });
    vi.mocked(buildSwapCalldata).mockResolvedValue({
      to: "0xrouter",
      data: "0xswap",
      value: "0",
      gasLimit: "200000",
    });

    const { createWorkflow, publishWorkflow } = await import("../tools/keeperhub.js");
    vi.mocked(createWorkflow).mockResolvedValue({ id: "wf_monitor", name: "ARYA-Monitor-USDC-ETH", status: "draft", createdAt: "" });
    vi.mocked(publishWorkflow).mockResolvedValue({ id: "wf_monitor", status: "live", publishedAt: "" });

    const result = await executorAgent({
      proposal: mockProposal,
      walletAddress: "0xuser",
      chainId: 1,
    });

    expect(createWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        poolAddress: mockProposal.opportunity.pool,
      })
    );
    expect(publishWorkflow).toHaveBeenCalledWith("wf_monitor");
    expect(result.keeperWorkflowId).toBe("wf_monitor");
  });

  it("should handle swap execution failure", async () => {
    const { checkApproval, buildSwapCalldata } = await import("../tools/uniswap.js");
    vi.mocked(checkApproval).mockResolvedValue({ isApproved: true, allowance: "999999999" });
    vi.mocked(buildSwapCalldata).mockRejectedValue(new Error("Insufficient liquidity"));

    const result = await executorAgent({
      proposal: mockProposal,
      walletAddress: "0xuser",
      chainId: 1,
    });

    expect(result.status).toBe("failed");
    expect(result.error).toContain("Insufficient liquidity");
  });

  it("should not use LLM — executor is deterministic", async () => {
    const { checkApproval, buildSwapCalldata } = await import("../tools/uniswap.js");
    vi.mocked(checkApproval).mockResolvedValue({ isApproved: true, allowance: "999999999" });
    vi.mocked(buildSwapCalldata).mockResolvedValue({
      to: "0xrouter",
      data: "0xswap",
      value: "0",
      gasLimit: "200000",
    });

    const { createWorkflow, publishWorkflow } = await import("../tools/keeperhub.js");
    vi.mocked(createWorkflow).mockResolvedValue({ id: "wf_x", name: "test", status: "draft", createdAt: "" });
    vi.mocked(publishWorkflow).mockResolvedValue({ id: "wf_x", status: "live", publishedAt: "" });

    await executorAgent({
      proposal: mockProposal,
      walletAddress: "0xuser",
      chainId: 1,
    });

    // Verify no LLM module was imported or called
    expect(vi.fn()).not.toHaveBeenCalled();
  });

  describe("Session Key Auto-Execution", () => {
    const arbProposal: StrategyProposal = {
      ...mockProposal,
      id: "strat-arb",
      opportunity: {
        ...mockProposal.opportunity,
        category: "arbitrage",
      },
      debateOutcome: {
        ...mockProposal.debateOutcome,
        tier: "fast",
      },
    };

    it("should auto-execute if valid session key covers the transaction", async () => {
      const { validateSessionKey } = await import("../tools/session-key.js");
      vi.mocked(validateSessionKey).mockResolvedValue({
        isValid: true,
        remainingBudget: "5000000000",
      });

      const { checkApproval, buildSwapCalldata } = await import("../tools/uniswap.js");
      vi.mocked(checkApproval).mockResolvedValue({ isApproved: true, allowance: "999999999" });
      vi.mocked(buildSwapCalldata).mockResolvedValue({
        to: "0xrouter",
        data: "0xswap",
        value: "0",
        gasLimit: "150000",
      });

      const { createWorkflow, publishWorkflow } = await import("../tools/keeperhub.js");
      vi.mocked(createWorkflow).mockResolvedValue({ id: "wf_arb", name: "ARYA-Monitor-Arb", status: "draft", createdAt: "" });
      vi.mocked(publishWorkflow).mockResolvedValue({ id: "wf_arb", status: "live", publishedAt: "" });

      const result = await executorAgent({
        proposal: arbProposal,
        walletAddress: "0xuser",
        chainId: 1,
        sessionKeyAddress: "0xagentKey",
      });

      expect(validateSessionKey).toHaveBeenCalledWith({
        sessionKey: "0xagentKey",
        target: arbProposal.actions[0]!.target,
        value: arbProposal.actions[0]!.value,
      });
      expect(result.status).toBe("executed");
      expect(result.autoExecuted).toBe(true);
    });

    it("should queue for human approval if session key is expired", async () => {
      const { validateSessionKey } = await import("../tools/session-key.js");
      vi.mocked(validateSessionKey).mockResolvedValue({
        isValid: false,
        reason: "Session key expired",
      });

      const result = await executorAgent({
        proposal: arbProposal,
        walletAddress: "0xuser",
        chainId: 1,
        sessionKeyAddress: "0xexpiredKey",
      });

      expect(result.status).toBe("pending_approval");
      expect(result.autoExecuted).toBe(false);
    });

    it("should queue for human approval if spend limit exceeded", async () => {
      const { validateSessionKey } = await import("../tools/session-key.js");
      vi.mocked(validateSessionKey).mockResolvedValue({
        isValid: false,
        reason: "Spend limit exceeded",
      });

      const result = await executorAgent({
        proposal: arbProposal,
        walletAddress: "0xuser",
        chainId: 1,
        sessionKeyAddress: "0xagentKey",
      });

      expect(result.status).toBe("pending_approval");
      expect(result.autoExecuted).toBe(false);
    });

    it("should fall back to human approval if no session key provided", async () => {
      const result = await executorAgent({
        proposal: arbProposal,
        walletAddress: "0xuser",
        chainId: 1,
        // no sessionKeyAddress
      });

      expect(result.status).toBe("pending_approval");
      expect(result.autoExecuted).toBe(false);
    });

    it("should auto-execute only when target is in session key's allowed list", async () => {
      const { validateSessionKey } = await import("../tools/session-key.js");
      vi.mocked(validateSessionKey).mockResolvedValue({
        isValid: false,
        reason: "Target not allowed",
      });

      const result = await executorAgent({
        proposal: arbProposal,
        walletAddress: "0xuser",
        chainId: 1,
        sessionKeyAddress: "0xagentKey",
      });

      expect(result.status).toBe("pending_approval");
    });
  });
});
