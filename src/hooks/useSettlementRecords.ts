"use client";

import { useQuery } from "@tanstack/react-query";
import { getActionsByUser, type PonderAction } from "@/lib/ponder";
import { useAccount } from "wagmi";
import { getTokenConfig, type TokenType } from "@/lib/constants";
import { formatTokenAmount } from "@/lib/tokenUtils";

export type ActionType = "SUPPLY" | "BORROW" | "REPAY" | "WITHDRAW" | "LIQUIDATE";

export interface SettlementRecord {
  actionId: string;
  date: string;
  direction: string;
  asset: string;
  amount: string;
  amountFormatted: string;
  status: "Settled" | "Released" | "Pending" | "Failed";
  vault: string;
  actionType: ActionType;
  user: string;
  depositId: string;
  createdAt: number;
  processedAt?: number | null;
}

const ACTION_TYPE_MAP: Record<number, ActionType> = {
  0: "SUPPLY",
  1: "BORROW",
  2: "REPAY",
  3: "WITHDRAW",
  4: "LIQUIDATE",
};

const ACTION_TYPE_TO_DIRECTION: Record<ActionType, string> = {
  SUPPLY: "Allocation",
  BORROW: "Release",
  REPAY: "Repayment",
  WITHDRAW: "Release",
  LIQUIDATE: "Liquidation",
};

/**
 * Hook to get settlement records for current user
 */
export function useSettlementRecords(enabled = true) {
  const { address, isConnected } = useAccount();

  return useQuery({
    queryKey: ["settlement-records", address],
    queryFn: async () => {
      if (!address) return [];

      const actions = await getActionsByUser(address.toLowerCase());
      
      const records: SettlementRecord[] = actions.map((action) => {
        const actionType = ACTION_TYPE_MAP[action.actionType] || "SUPPLY";
        const direction = ACTION_TYPE_TO_DIRECTION[actionType];
        
        // Determine token type from deposit token address
        let tokenType: TokenType = "usdc";
        if (action.deposit) {
          const tokenAddress = action.deposit.token.toLowerCase();
          if (action.deposit.isNative) {
            tokenType = "native";
          } else {
            // Match token address to token type
            const tokenConfigs = Object.entries({
              wmnt: getTokenConfig("wmnt"),
              usdc: getTokenConfig("usdc"),
              usdt: getTokenConfig("usdt"),
            });
            for (const [type, config] of tokenConfigs) {
              if (config.address.toLowerCase() === tokenAddress) {
                tokenType = type as TokenType;
                break;
              }
            }
          }
        }
        
        // Status mapping
        let status: SettlementRecord["status"] = "Pending";
        if (action.status === "processed") {
          status = actionType === "SUPPLY" ? "Released" : "Settled";
        } else if (action.status === "failed") {
          status = "Failed";
        }

        const date = new Date(action.createdAt * 1000).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        return {
          actionId: action.actionId,
          date,
          direction,
          asset: getTokenConfig(tokenType).symbol,
          amount: "0", // Amount is encrypted, not available in action
          amountFormatted: "Encrypted",
          status,
          vault: "Sapphire",
          actionType,
          user: action.user,
          depositId: action.depositId,
          createdAt: action.createdAt,
          processedAt: action.processedAt,
        };
      });

      // Sort by date (newest first)
      return records.sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: enabled && isConnected && !!address,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

/**
 * Hook to get all settlement records (for admin/institutional view)
 */
export function useAllSettlementRecords(enabled = true) {
  // This would require a different query - for now, return empty
  // In the future, we might need an admin endpoint or query all actions
  return useQuery({
    queryKey: ["settlement-records-all"],
    queryFn: async () => {
      // TODO: Implement query for all actions
      return [] as SettlementRecord[];
    },
    enabled: enabled,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

