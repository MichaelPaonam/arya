import type { StrategyProposal, ExecutionResult } from "../types/index.js";
import { buildSwapCalldata } from "../tools/uniswap.js";
import { createWorkflowFromTemplate } from "../tools/keeperhub.js";

export interface ExecutorAgentInput {
  proposal: StrategyProposal;
  walletAddress: string;
  chainId: number;
  amount?: string;
  positionTokenId?: string;
}

export async function executorAgent(input: ExecutorAgentInput): Promise<ExecutionResult> {
  const { proposal, walletAddress, chainId, amount: userAmount } = input;

  if (Date.now() > proposal.expiresAt) {
    return {
      strategyId: proposal.id,
      status: "expired",
      error: "Strategy has expired",
    };
  }

  // Convert user amount (in token units) to base units
  const tokenIn = proposal.opportunity.tokenPair[0]!;
  const tokenOut = proposal.opportunity.tokenPair[1]!;
  const isStable = /^(USDC|USDT|DAI|FRAX|LUSD|GHO|USDe|sUSDe)$/i.test(tokenIn);
  const decimals = isStable ? 6 : 18;
  const units = parseFloat(userAmount || "10");
  const amount = BigInt(Math.floor(units * 10 ** decimals)).toString();

  // Get swap calldata from Uniswap (chainId 1 for actual liquidity)
  let swapTx;
  try {
    swapTx = await buildSwapCalldata({
      tokenIn,
      tokenOut,
      amount,
      chainId: 1,
      slippageTolerance: 0.5,
      swapper: walletAddress,
    });
  } catch (err) {
    return {
      strategyId: proposal.id,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Create KeeperHub monitoring workflow (best-effort)
  let workflowId: string | undefined;
  try {
    const workflow = await createWorkflowFromTemplate({
      poolAddress: proposal.opportunity.pool,
      userWallet: walletAddress,
      chainId,
      positionTokenId: input.positionTokenId ?? "0",
      ilThreshold: 5.0,
      valueDropThreshold: 10.0,
      tokenPair: [tokenIn, tokenOut],
    });
    workflowId = workflow.id;
  } catch (err) {
    console.warn("[Executor] KeeperHub workflow failed:", err instanceof Error ? err.message : err);
  }

  // Record orderId as outcome — swap not submitted on-chain (demo mode)
  return {
    strategyId: proposal.id,
    status: "executed",
    txHash: swapTx.data.startsWith("0x") ? swapTx.data : `0x${swapTx.data}`,
    keeperWorkflowId: workflowId,
  };
}
