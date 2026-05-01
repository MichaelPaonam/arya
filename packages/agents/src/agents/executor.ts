import type { StrategyProposal, ExecutionResult } from "../types/index.js";
import { checkApproval, buildSwapCalldata } from "../tools/uniswap.js";
import { createWorkflow, publishWorkflow } from "../tools/keeperhub.js";
import { validateSessionKey } from "../tools/session-key.js";
import { getTokenBalance, getNativeBalance } from "../tools/wallet.js";

export interface GasConfig {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface ExecutorAgentInput {
  proposal: StrategyProposal;
  walletAddress: string;
  chainId: number;
  sessionKeyAddress?: string;
  gasConfig?: GasConfig;
}

export interface ExecutorAgentOutput extends ExecutionResult {
  approvalRequired?: boolean;
  autoExecuted?: boolean;
}

export async function executorAgent(input: ExecutorAgentInput): Promise<ExecutorAgentOutput> {
  const { proposal, walletAddress, chainId, sessionKeyAddress, gasConfig } = input;

  // 1. Check expiry
  if (Date.now() > proposal.expiresAt) {
    return {
      strategyId: proposal.id,
      status: "expired",
      error: "Strategy has expired",
    };
  }

  // 2. Session key path (for fast-tier / arbitrage)
  if (proposal.debateOutcome.tier === "fast") {
    if (!sessionKeyAddress) {
      return {
        strategyId: proposal.id,
        status: "pending_approval",
        autoExecuted: false,
      };
    }

    const validation = await validateSessionKey({
      sessionKey: sessionKeyAddress,
      target: proposal.actions[0]!.target,
      value: proposal.actions[0]!.value,
    });

    if (!validation.isValid) {
      return {
        strategyId: proposal.id,
        status: "pending_approval",
        autoExecuted: false,
      };
    }

    // Auto-execute path continues below with autoExecuted flag
  }

  // 3. Wallet balance checks
  try {
    const tokenBalance = await getTokenBalance({
      token: proposal.opportunity.tokenPair[0]!,
      walletAddress,
      chainId,
    });

    if (tokenBalance) {
      const balance = BigInt(tokenBalance.balance);
      const minRequired = proposal.actions[0]?.minAmountOut ?? 0n;
      if (balance < minRequired) {
        return {
          strategyId: proposal.id,
          status: "failed",
          error: `Token balance insufficient: have ${tokenBalance.balance} ${tokenBalance.symbol}`,
        };
      }
    }

    const nativeBalance = await getNativeBalance({ walletAddress, chainId });

    if (nativeBalance && gasConfig) {
      const gasCost = BigInt(gasConfig.maxFeePerGas) * proposal.estimatedGas;
      const available = BigInt(nativeBalance.balance);
      if (available < gasCost) {
        return {
          strategyId: proposal.id,
          status: "failed",
          error: `Insufficient native balance for gas: need ${gasCost.toString()}, have ${nativeBalance.balance}`,
        };
      }
    }
  } catch (err) {
    return {
      strategyId: proposal.id,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 4. Check token approval
  const approval = await checkApproval({
    token: proposal.opportunity.tokenPair[0]!,
    amount: (proposal.actions[0]?.minAmountOut ?? 0n).toString(),
    walletAddress,
    chainId,
  });

  const approvalRequired = !approval.isApproved;

  // 5. Build swap calldata
  let swapTx;
  try {
    swapTx = await buildSwapCalldata({
      tokenIn: proposal.opportunity.tokenPair[0]!,
      tokenOut: proposal.opportunity.tokenPair[1]!,
      amount: (proposal.actions[0]?.minAmountOut ?? 0n).toString(),
      chainId,
      slippageTolerance: 0.5,
      maxFeePerGas: gasConfig?.maxFeePerGas,
      maxPriorityFeePerGas: gasConfig?.maxPriorityFeePerGas,
    });
  } catch (err) {
    return {
      strategyId: proposal.id,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 6. Create KeeperHub monitoring workflow
  const workflow = await createWorkflow({
    name: `ARYA-Monitor-${proposal.opportunity.tokenPair.join("-")}`,
    poolAddress: proposal.opportunity.pool,
    chainId,
    alertThreshold: 5.0,
  });

  await publishWorkflow(workflow.id);

  // 7. Return result
  const isAutoExecuted = proposal.debateOutcome.tier === "fast" && !!sessionKeyAddress;

  return {
    strategyId: proposal.id,
    status: "executed",
    txHash: swapTx.data,
    keeperWorkflowId: workflow.id,
    approvalRequired,
    autoExecuted: isAutoExecuted || undefined,
  };
}
