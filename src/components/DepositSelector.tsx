"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";
import { type TokenType } from "@/lib/constants";
import { useDepositOptions } from "@/hooks/usePonderDeposits";
import { BlockchainLoader } from "@/components/animations/BlockchainLoader";

export interface DepositOption {
  depositId: string;
  token: string;
  remainingAmount: string;
  isNative: boolean;
  tokenType: TokenType;
}

interface DepositSelectorProps {
  deposits?: DepositOption[]; // Optional: if not provided, will use hook
  selectedDepositId: string;
  onSelectDeposit: (depositId: string) => void;
  filterByToken?: TokenType | "";
  label?: string;
  placeholder?: string;
  showCreateButton?: boolean;
  className?: string;
  useHook?: boolean; // If true, use useDepositOptions hook instead of props
}

export function DepositSelector({
  deposits: depositsProp,
  selectedDepositId,
  onSelectDeposit,
  filterByToken,
  label = "Deposit",
  placeholder = "Select deposit",
  showCreateButton = true,
  className,
  useHook = true, // Default to using hook
}: DepositSelectorProps) {
  // Use hook if useHook is true or deposits prop is not provided
  const { deposits: depositsFromHook, isLoading } = useDepositOptions(
    useHook || !depositsProp ? filterByToken : undefined
  );

  // Use deposits from prop if provided, otherwise use hook
  const deposits = depositsProp || depositsFromHook;
  const filteredDeposits = filterByToken && depositsProp
    ? deposits.filter((d) => d.tokenType === filterByToken)
    : deposits;

  const selectedDeposit = deposits.find((d) => d.depositId === selectedDepositId);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      <Select value={selectedDepositId} onValueChange={onSelectDeposit} disabled={isLoading}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading deposits..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
              <BlockchainLoader size="sm" />
              <span>Loading deposits...</span>
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No deposits available. Create a deposit first.
            </div>
          ) : (
            filteredDeposits.map((deposit) => (
              <SelectItem key={deposit.depositId} value={deposit.depositId}>
                {deposit.token} - {deposit.remainingAmount} remaining
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {selectedDeposit && (
        <p className="text-xs text-muted-foreground">
          Available: {selectedDeposit.remainingAmount} {selectedDeposit.token}. 
          Remaining balance will be updated after transaction.
        </p>
      )}
      
      {filteredDeposits.length === 0 && showCreateButton && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            window.location.href = "/app/deposit";
          }}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Create Deposit
        </Button>
      )}
    </div>
  );
}

