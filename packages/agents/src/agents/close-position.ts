import { buildClosePositionCalldata, type ClosePositionCalldata } from "../tools/close-position.js";
import { validateSessionKey } from "../tools/session-key.js";
import { recordOutcome } from "../tools/on-chain.js";

export interface ClosePositionAgentInput {
  positionTokenId: string;
  poolAddress: string;
  walletAddress: string;
  chainId: number;
  liquidity: string;
  currentTick: number;
  tickLower: number;
  tickUpper: number;
  impermanentLoss: number;
  isOutOfRange: boolean;
}

export interface ClosePositionAgentResult {
  status: "closed" | "failed";
  positionId: string;
  calldata?: ClosePositionCalldata;
  autoExecuted: boolean;
  outcomeRecorded: boolean;
  netReturnBps?: number;
  reason?: string;
}

const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

export async function closePositionAgent(input: ClosePositionAgentInput): Promise<ClosePositionAgentResult> {
  const sessionValidation = await validateSessionKey({
    sessionKey: input.walletAddress,
    target: POSITION_MANAGER,
    value: 0n,
  });

  if (!sessionValidation.isValid) {
    return {
      status: "failed",
      positionId: input.positionTokenId,
      autoExecuted: false,
      outcomeRecorded: false,
      reason: sessionValidation.reason,
    };
  }

  const deadline = Math.floor(Date.now() / 1000) + 300;
  const calldata = buildClosePositionCalldata({
    tokenId: input.positionTokenId,
    liquidity: input.liquidity,
    recipient: input.walletAddress,
    deadline,
  });

  const netReturnBps = Math.round(-input.impermanentLoss * 100);

  let outcomeRecorded = false;
  try {
    await recordOutcome({
      strategyId: input.positionTokenId,
      success: false,
      actualReturn: netReturnBps,
      chainId: input.chainId,
    });
    outcomeRecorded = true;
  } catch {
    // best-effort
  }

  return {
    status: "closed",
    positionId: input.positionTokenId,
    calldata,
    autoExecuted: true,
    outcomeRecorded,
    netReturnBps,
  };
}
