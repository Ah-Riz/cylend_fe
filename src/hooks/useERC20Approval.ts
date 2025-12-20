"use client";

import React from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, type Address } from "viem";
import { CONTRACTS, getTokenDecimals, getTokenAddress, type TokenType } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// ERC20 ABI
const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Hook untuk check ERC20 allowance
 */
export function useERC20Allowance(
  tokenAddress: Address | undefined,
  spender: Address | undefined
) {
  const { address } = useAccount();

  const { data: allowance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!spender && !!address,
    },
  });

  return {
    allowance: allowance || 0n,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook untuk approve ERC20 token
 */
export function useERC20Approve() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (tokenAddress: Address, amount: string, decimals: number) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseUnits(amount, decimals);

      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.INGRESS as Address, amountWei],
      });
    } catch (err) {
      console.error("Approve error:", err);
      toast({
        title: "Approval failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook untuk check ERC20 balance
 */
export function useERC20Balance(tokenAddress: Address | undefined) {
  const { address } = useAccount();

  const { data: balance, isLoading, error } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
    },
  });

  return {
    balance: balance || 0n,
    isLoading,
    error,
  };
}

/**
 * Combined hook untuk check allowance and approve if needed
 */
export function useERC20ApprovalFlow(tokenType: TokenType, amount: string) {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  
  // Get token address and decimals
  const tokenAddress = tokenType !== "native" 
    ? (getTokenAddress(tokenType) as Address | undefined)
    : undefined;
  
  const decimals = getTokenDecimals(tokenType);
  const ingressAddress = CONTRACTS.INGRESS as Address | undefined;

  // Approve hook
  const { approve, isPending: isApproving, isSuccess: isApproved, hash: approveHash } = useERC20Approve();

  // Check allowance - refetch after approval success
  const { allowance, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useERC20Allowance(
    tokenAddress,
    ingressAddress
  );

  // Refetch allowance after approval success
  React.useEffect(() => {
    if (isApproved) {
      // Small delay to ensure blockchain state is updated
      const timer = setTimeout(() => {
        refetchAllowance();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isApproved, refetchAllowance]);

  // Check if approval is needed
  const amountWei = amount ? parseUnits(amount, decimals) : 0n;
  const needsApproval = allowance < amountWei;

  const handleApprove = async () => {
    if (!tokenAddress || !amount) {
      toast({
        title: "Invalid input",
        description: "Token address or amount is missing.",
        variant: "destructive",
      });
      return;
    }

    await approve(tokenAddress, amount, decimals);
  };

  return {
    allowance,
    needsApproval,
    isLoadingAllowance,
    handleApprove,
    isApproving,
    isApproved,
    approveHash,
    isConnected,
    tokenAddress,
  };
}

