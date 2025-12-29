"use client";

import { useQuery } from "@tanstack/react-query";
import { getLiquidity, getPrice, type PonderLiquidity, type PonderPrice } from "@/lib/ponder";
import { createPublicClient, http, type Hex } from "viem";
import { sapphireTestnet } from "viem/chains";
import { CONTRACTS, getTokenConfig, type TokenType, TOKEN_CONFIGS } from "@/lib/constants";
import { formatTokenAmount, parseTokenAmount } from "@/lib/tokenUtils";

const SAPPHIRE_RPC_URL =
  process.env.NEXT_PUBLIC_SAPPHIRE_RPC_URL || "https://testnet.sapphire.oasis.io";

// Read-only client to Sapphire network
const sapphireClient = createPublicClient({
  chain: sapphireTestnet,
  transport: http(SAPPHIRE_RPC_URL),
});

// Token pool configuration
// Format: [tokenAddress, LTV (bps), liquidationThreshold (bps), borrowRate (bps), supplyRate (bps)]
export const TOKEN_POOL_CONFIG: Record<TokenType, {
  ltv: number; // Loan-to-Value (bps, e.g., 7500 = 75%)
  liquidationThreshold: number; // (bps, e.g., 8000 = 80%)
  borrowRate: number; // Annual rate (bps, e.g., 1000 = 10%)
  supplyRate: number; // Annual rate (bps, e.g., 500 = 5%)
}> = {
  usdc: {
    ltv: 7500, // 75%
    liquidationThreshold: 8000, // 80%
    borrowRate: 1000, // 10% APR
    supplyRate: 500, // 5% APR
  },
  usdt: {
    ltv: 7500,
    liquidationThreshold: 8000,
    borrowRate: 1000,
    supplyRate: 500,
  },
  wmnt: {
    ltv: 7500,
    liquidationThreshold: 8000,
    borrowRate: 1000,
    supplyRate: 500,
  },
  native: {
    ltv: 7500,
    liquidationThreshold: 8000,
    borrowRate: 1000,
    supplyRate: 500,
  },
};

export interface PoolData {
  tokenType: TokenType;
  token: string; // token address
  symbol: string;
  icon: string;
  totalDeposited: bigint;
  totalDepositedFormatted: string;
  totalReserved: bigint;
  totalReservedFormatted: string;
  totalBorrowed: bigint;
  totalBorrowedFormatted: string;
  availableLiquidity: bigint; // totalDeposited - totalReserved - totalBorrowed
  availableLiquidityFormatted: string;
  utilization: number; // (totalBorrowed / totalDeposited) * 100
  utilizationFormatted: string;
  lendAPY: number; // supplyRate / 100 (from config)
  lendAPYFormatted: string;
  borrowAPR: number; // borrowRate / 100 (from config)
  borrowAPRFormatted: string;
  tvp: bigint; // Total Value Protected = totalDeposited
  tvpFormatted: string;
  price: bigint | null;
  priceFormatted: string | null;
  ltv: number;
  liquidationThreshold: number;
}

/**
 * Hook to get all pools data
 */
export function usePools() {
  const tokenTypes: TokenType[] = ["usdc", "usdt", "wmnt", "native"];

  return useQuery({
    queryKey: ["pools"],
    queryFn: async () => {
      const pools: PoolData[] = [];

      for (const tokenType of tokenTypes) {
        const tokenConfig = getTokenConfig(tokenType);
        const poolConfig = TOKEN_POOL_CONFIG[tokenType];
        const tokenAddress = tokenConfig.address.toLowerCase();

        // Get liquidity from Ponder
        const liquidity = await getLiquidity(tokenAddress);
        
        // Get price from Ponder
        const price = await getPrice(tokenAddress);

        if (liquidity) {
          const totalDeposited = BigInt(liquidity.totalDeposited);
          const totalReserved = BigInt(liquidity.totalReserved);
          const totalBorrowed = BigInt(liquidity.totalBorrowed);
          const availableLiquidity = totalDeposited > (totalReserved + totalBorrowed)
            ? totalDeposited - totalReserved - totalBorrowed
            : 0n;

          const utilization = totalDeposited > 0n
            ? Number((totalBorrowed * 10000n) / totalDeposited) / 100
            : 0;

          const priceValue = price ? BigInt(price.price) : null;

          pools.push({
            tokenType,
            token: tokenAddress,
            symbol: tokenConfig.symbol,
            icon: tokenConfig.icon || "💵",
            totalDeposited,
            totalDepositedFormatted: formatTokenAmount(totalDeposited, tokenType),
            totalReserved,
            totalReservedFormatted: formatTokenAmount(totalReserved, tokenType),
            totalBorrowed,
            totalBorrowedFormatted: formatTokenAmount(totalBorrowed, tokenType),
            availableLiquidity,
            availableLiquidityFormatted: formatTokenAmount(availableLiquidity, tokenType),
            utilization,
            utilizationFormatted: `${utilization.toFixed(2)}%`,
            lendAPY: poolConfig.supplyRate / 100,
            lendAPYFormatted: `${(poolConfig.supplyRate / 100).toFixed(2)}%`,
            borrowAPR: poolConfig.borrowRate / 100,
            borrowAPRFormatted: `${(poolConfig.borrowRate / 100).toFixed(2)}%`,
            tvp: totalDeposited,
            tvpFormatted: formatTokenAmount(totalDeposited, tokenType),
            price: priceValue,
            priceFormatted: priceValue ? formatTokenAmount(priceValue, tokenType) : null,
            ltv: poolConfig.ltv,
            liquidationThreshold: poolConfig.liquidationThreshold,
          });
        } else {
          // If no liquidity data, still show pool with zero values
          pools.push({
            tokenType,
            token: tokenAddress,
            symbol: tokenConfig.symbol,
            icon: tokenConfig.icon || "💵",
            totalDeposited: 0n,
            totalDepositedFormatted: "0",
            totalReserved: 0n,
            totalReservedFormatted: "0",
            totalBorrowed: 0n,
            totalBorrowedFormatted: "0",
            availableLiquidity: 0n,
            availableLiquidityFormatted: "0",
            utilization: 0,
            utilizationFormatted: "0%",
            lendAPY: poolConfig.supplyRate / 100,
            lendAPYFormatted: `${(poolConfig.supplyRate / 100).toFixed(2)}%`,
            borrowAPR: poolConfig.borrowRate / 100,
            borrowAPRFormatted: `${(poolConfig.borrowRate / 100).toFixed(2)}%`,
            tvp: 0n,
            tvpFormatted: "0",
            price: null,
            priceFormatted: null,
            ltv: poolConfig.ltv,
            liquidationThreshold: poolConfig.liquidationThreshold,
          });
        }
      }

      return pools;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

/**
 * Hook to get single pool data
 */
export function usePool(tokenType: TokenType) {
  return useQuery({
    queryKey: ["pool", tokenType],
    queryFn: async () => {
      const tokenConfig = getTokenConfig(tokenType);
      const poolConfig = TOKEN_POOL_CONFIG[tokenType];
      const tokenAddress = tokenConfig.address.toLowerCase();

      const liquidity = await getLiquidity(tokenAddress);
      const price = await getPrice(tokenAddress);

      if (!liquidity) {
        return null;
      }

      const totalDeposited = BigInt(liquidity.totalDeposited);
      const totalReserved = BigInt(liquidity.totalReserved);
      const totalBorrowed = BigInt(liquidity.totalBorrowed);
      const availableLiquidity = totalDeposited > (totalReserved + totalBorrowed)
        ? totalDeposited - totalReserved - totalBorrowed
        : 0n;

      const utilization = totalDeposited > 0n
        ? Number((totalBorrowed * 10000n) / totalDeposited) / 100
        : 0;

      const priceValue = price ? BigInt(price.price) : null;

      return {
        tokenType,
        token: tokenAddress,
        symbol: tokenConfig.symbol,
        icon: tokenConfig.icon || "💵",
        totalDeposited,
        totalDepositedFormatted: formatTokenAmount(totalDeposited, tokenType),
        totalReserved,
        totalReservedFormatted: formatTokenAmount(totalReserved, tokenType),
        totalBorrowed,
        totalBorrowedFormatted: formatTokenAmount(totalBorrowed, tokenType),
        availableLiquidity,
        availableLiquidityFormatted: formatTokenAmount(availableLiquidity, tokenType),
        utilization,
        utilizationFormatted: `${utilization.toFixed(2)}%`,
        lendAPY: poolConfig.supplyRate / 100,
        lendAPYFormatted: `${(poolConfig.supplyRate / 100).toFixed(2)}%`,
        borrowAPR: poolConfig.borrowRate / 100,
        borrowAPRFormatted: `${(poolConfig.borrowRate / 100).toFixed(2)}%`,
        tvp: totalDeposited,
        tvpFormatted: formatTokenAmount(totalDeposited, tokenType),
        price: priceValue,
        priceFormatted: priceValue ? formatTokenAmount(priceValue, tokenType) : null,
        ltv: poolConfig.ltv,
        liquidationThreshold: poolConfig.liquidationThreshold,
      } as PoolData;
    },
    enabled: !!tokenType,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

