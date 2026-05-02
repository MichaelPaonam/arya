"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { keccak256, toHex } from "viem";
import { STRATEGY_VAULT } from "@/lib/contracts";

export function useStrategyVault() {
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  function approveOnChain(strategyId: string) {
    const id = keccak256(toHex(strategyId));
    writeContract({
      address: STRATEGY_VAULT.address,
      abi: STRATEGY_VAULT.abi,
      functionName: "approveStrategy",
      args: [id],
    });
  }

  function rejectOnChain(strategyId: string, reason: string) {
    const id = keccak256(toHex(strategyId));
    writeContract({
      address: STRATEGY_VAULT.address,
      abi: STRATEGY_VAULT.abi,
      functionName: "rejectStrategy",
      args: [id, reason],
    });
  }

  return {
    approveOnChain,
    rejectOnChain,
    isPending,
    isConfirming,
    isConfirmed,
    txHash,
    error: writeError,
    reset,
  };
}
