"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { getDeposits, getDeposit, type PonderDeposit } from "@/lib/ponder";
import { formatTokenAmount } from "@/lib/tokenUtils";
import { getTokenConfig, type TokenType } from "@/lib/constants";
import { type Address } from "viem";

/**
 * Hook to get all deposits (optionally filtered by user)
 */
export function usePonderDeposits(options?: {
  depositor?: string;
  released?: boolean;
  token?: string;
  enabled?: boolean;
}) {
  const { address } = useAccount();
  const depositor = options?.depositor || address;

  return useQuery({
    queryKey: ["ponder-deposits", depositor, options?.released, options?.token],
    queryFn: () =>
      getDeposits({
        depositor: depositor || undefined,
        released: options?.released,
        token: options?.token,
      }),
    enabled: options?.enabled !== false && !!depositor,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook to get single deposit by ID
 */
export function usePonderDeposit(depositId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ponder-deposit", depositId],
    queryFn: () => (depositId ? getDeposit(depositId) : null),
    enabled: enabled && !!depositId,
    refetchInterval: 10000,
  });
}

/**
 * Hook to get user deposits formatted for UI
 */
export function useUserDeposits() {
  const { address, isConnected } = useAccount();
  const { data: deposits, isLoading, error } = usePonderDeposits({
    depositor: address || undefined,
    enabled: isConnected,
  });

  // Transform Ponder deposits to DepositOption format
  const formattedDeposits = deposits?.map((deposit) => {
    // Determine token type from token address
    const tokenAddress = deposit.token.toLowerCase();
    let tokenType: TokenType = "usdc"; // default

    if (deposit.isNative) {
      tokenType = "native";
    } else {
      // Match token address to token type
      const tokenConfigs = Object.entries(getTokenConfig("usdc")); // Just to get access to getTokenConfig
      for (const [type, config] of Object.entries({
        wmnt: getTokenConfig("wmnt"),
        usdc: getTokenConfig("usdc"),
        usdt: getTokenConfig("usdt"),
      })) {
        if (config.address.toLowerCase() === tokenAddress) {
          tokenType = type as TokenType;
          break;
        }
      }
    }

    const tokenConfig = getTokenConfig(tokenType);
    const remainingAmount = formatTokenAmount(
      BigInt(deposit.remainingAmount),
      tokenType
    );

    return {
      depositId: deposit.depositId,
      token: tokenConfig.symbol,
      remainingAmount,
      isNative: deposit.isNative,
      tokenType,
      initialAmount: formatTokenAmount(BigInt(deposit.initialAmount), tokenType),
      released: deposit.released,
      createdAt: new Date(deposit.createdAt * 1000).toLocaleString(),
      lastUsedAt: deposit.lastUsedAt
        ? new Date(deposit.lastUsedAt * 1000).toLocaleString()
        : undefined,
    };
  });

  return {
    deposits: formattedDeposits || [],
    isLoading,
    error,
    refetch: () => {}, // Will be handled by react-query
  };
}

/**
 * Hook to get deposits formatted for DepositSelector
 */
export function useDepositOptions(filterByToken?: TokenType | "") {
  const { address, isConnected } = useAccount();
  const { data: deposits, isLoading } = usePonderDeposits({
    depositor: address || undefined,
    released: false, // Only active deposits
    enabled: isConnected,
  });

  const formattedDeposits = deposits
    ?.map((deposit) => {
      // Determine token type from token address
      const tokenAddress = deposit.token.toLowerCase();
      let tokenType: TokenType = "usdc";

      if (deposit.isNative) {
        tokenType = "native";
      } else {
        for (const [type, config] of Object.entries({
          wmnt: getTokenConfig("wmnt"),
          usdc: getTokenConfig("usdc"),
          usdt: getTokenConfig("usdt"),
        })) {
          if (config.address.toLowerCase() === tokenAddress) {
            tokenType = type as TokenType;
            break;
          }
        }
      }

      const tokenConfig = getTokenConfig(tokenType);
      const remainingAmount = formatTokenAmount(
        BigInt(deposit.remainingAmount),
        tokenType
      );

      return {
        depositId: deposit.depositId,
        token: tokenConfig.symbol,
        remainingAmount,
        isNative: deposit.isNative,
        tokenType,
      };
    })
    .filter((deposit) => {
      // Filter by token type if specified
      if (filterByToken) {
        return deposit.tokenType === filterByToken;
      }
      return true;
    });

  return {
    deposits: formattedDeposits || [],
    isLoading,
  };
}

