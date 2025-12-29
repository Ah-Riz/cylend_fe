"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { createPublicClient, http, type Hex } from "viem";
import { sapphireTestnet } from "viem/chains";
import { useAccount } from "wagmi";
import { CONTRACTS, getTokenAddress, type TokenType } from "@/lib/constants";
import { formatTokenAmount } from "@/lib/tokenUtils";
import { LendingCoreAbi } from "@/abis/LendingCoreAbi";

const SAPPHIRE_RPC_URL =
  process.env.NEXT_PUBLIC_SAPPHIRE_RPC_URL || "https://testnet.sapphire.oasis.io";

// Read-only client to Sapphire network
const sapphireClient = createPublicClient({
  chain: sapphireTestnet,
  transport: http(SAPPHIRE_RPC_URL),
});

export interface LendingPosition {
  collateral: bigint;
  borrow: bigint;
  collateralFormatted: string;
  borrowFormatted: string;
}

export function useLendingPosition(
  tokenType?: TokenType | ""
): UseQueryResult<LendingPosition | null> {
  const { address, isConnected } = useAccount();

  return useQuery<LendingPosition | null>({
    queryKey: ["lending-position", address, tokenType],
    enabled: !!address && !!isConnected && !!tokenType && !!CONTRACTS.CORE,
    queryFn: async () => {
      if (!address || !tokenType || !CONTRACTS.CORE) return null;

      const tokenAddress = getTokenAddress(tokenType);
      const [collateral, borrow] = await sapphireClient.readContract({
        address: CONTRACTS.CORE as Hex,
        abi: LendingCoreAbi,
        functionName: "positions",
        args: [address as Hex, tokenAddress as Hex],
      });

      return {
        collateral,
        borrow,
        collateralFormatted: formatTokenAmount(collateral, tokenType),
        borrowFormatted: formatTokenAmount(borrow, tokenType),
      };
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}


