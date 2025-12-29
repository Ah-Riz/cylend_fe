"use client";

import { useQuery } from "@tanstack/react-query";
import { getActionsByDeposit, getActionsByUser, type PonderAction } from "@/lib/ponder";

/**
 * Hook to get actions by deposit ID
 */
export function usePonderActionsByDeposit(depositId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ponder-actions-deposit", depositId],
    queryFn: () => (depositId ? getActionsByDeposit(depositId) : []),
    enabled: enabled && !!depositId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook to get actions by user
 */
export function usePonderActionsByUser(user: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ponder-actions-user", user],
    queryFn: () => (user ? getActionsByUser(user) : []),
    enabled: enabled && !!user,
    refetchInterval: 10000,
  });
}

/**
 * Hook to get single action by ID
 */
export function usePonderAction(actionId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ponder-action", actionId],
    queryFn: async () => {
      if (!actionId) return null;
      
      // Query all actions and find the one matching actionId
      // Note: Ponder doesn't have direct single action query, so we query by user first
      // For now, we'll need to query all actions and filter
      // TODO: Add getAction function to ponder.ts if Ponder supports it
      return null;
    },
    enabled: enabled && !!actionId,
    refetchInterval: 10000,
  });
}

