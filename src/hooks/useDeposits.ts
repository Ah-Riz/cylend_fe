"use client";

import { useAccount } from "wagmi";
import { useDepositNative, useDepositErc20, useGetDeposit } from "./useIngress";
import { type TokenType } from "@/lib/constants";

/**
 * Hook untuk manage deposits
 * Combines deposit functions and deposit querying
 */
export function useDeposits() {
  const { address, isConnected } = useAccount();
  const { deposit: depositNative, ...nativeState } = useDepositNative();
  const { deposit: depositErc20, ...erc20State } = useDepositErc20();

  const createDeposit = async (tokenType: TokenType, amount: string) => {
    if (tokenType === "native") {
      return depositNative(amount);
    } else {
      return depositErc20(tokenType, amount);
    }
  };

  return {
    createDeposit,
    isPending: nativeState.isPending || erc20State.isPending,
    isConfirming: nativeState.isConfirming || erc20State.isConfirming,
    isSuccess: nativeState.isSuccess || erc20State.isSuccess,
    hash: nativeState.hash || erc20State.hash,
    error: nativeState.error || erc20State.error,
  };
}

/**
 * Hook untuk get deposit by ID
 */
export function useDeposit(depositId: string | null) {
  return useGetDeposit(depositId);
}

/**
 * Hook untuk get deposit remaining amount
 * Returns formatted string
 */
export function useDepositRemaining(depositId: string | null, decimals: number = 18) {
  const { deposit, isLoading } = useGetDeposit(depositId);

  if (!deposit) {
    return { remaining: "0", isLoading };
  }

  // Format amount based on token decimals
  const remaining = deposit.amount.toString();
  // TODO: Format with proper decimals
  return { remaining, isLoading };
}

