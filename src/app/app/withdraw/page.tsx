"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockchainLoader } from "@/components/animations/BlockchainLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Info, Wallet } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useReadContracts } from "wagmi";
import { useSubmitAction, useWithdrawUnused, useDepositUsed } from "@/hooks/useIngress";
import { encryptAction, ActionType } from "@/lib/sapphire";
import { parseTokenAmount, getTokenAddressForType, formatTokenAmount } from "@/lib/tokenUtils";
import { getTokenConfig, type TokenType, CONTRACTS } from "@/lib/constants";
import { type Hex, type Address } from "viem";
import { DepositSelector, type DepositOption } from "@/components/DepositSelector";
import { useDepositOptions, useUserDeposits } from "@/hooks/usePonderDeposits";
import { TransactionDialog } from "@/components/TransactionDialog";
import { useLendingPosition } from "@/hooks/useLendingPosition";

export default function Withdraw() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [asset, setAsset] = useState<TokenType | "">("");
  const [amount, setAmount] = useState("");
  const [depositId, setDepositId] = useState("");
  const [reference, setReference] = useState("");
  
  // Separate state for withdraw unused
  const [unusedDepositId, setUnusedDepositId] = useState("");
  const [unusedAmount, setUnusedAmount] = useState("");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"pending" | "confirming" | "success" | "error" | null>(null);
  
  // Separate state for withdrawUnused transaction dialog
  const [showUnusedTransactionDialog, setShowUnusedTransactionDialog] = useState(false);
  const [unusedTransactionStatus, setUnusedTransactionStatus] = useState<"pending" | "confirming" | "success" | "error" | null>(null);
  
  const { submitAction, isPending, isConfirming, isSuccess, hash, error } = useSubmitAction();
  const {
    withdrawUnused,
    hash: hashUnused,
    isPending: isPendingUnused,
    isConfirming: isConfirmingUnused,
    isSuccess: isSuccessUnused,
    error: errorUnused,
  } = useWithdrawUnused();

  // Get user deposits (with initial & remaining amounts)
  const { deposits: userDeposits } = useUserDeposits();

  // Get collateral amount from Sapphire for selected asset
  const position = useLendingPosition(asset as TokenType | "");

  // Read depositUsed for all deposits in batch to check if they've been used in submitAction
  const depositUsedQueries = useReadContracts({
    contracts: userDeposits.map((d) => ({
      address: CONTRACTS.INGRESS as Address,
      abi: [
        {
          inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          name: "depositUsed",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "depositUsed",
      args: [d.depositId as Hex],
    })),
    query: {
      enabled: userDeposits.length > 0 && !!CONTRACTS.INGRESS,
    },
  });

  // Filter deposits that can be used for withdraw collateral
  // IMPORTANT: For withdraw collateral, depositId is ONLY for ownership validation.
  // Funds come from pool total (liquidity[token].totalDeposited), NOT from depositId.
  //
  // After contract change:
  // - WITHDRAW can use depositId even if released, as long as it was used before (depositUsed=true).
  // - Active deposits (remaining > 0) are still valid references.
  //
  // Requirements:
  // 1. Belongs to user ✅
  // 2. Same token type ✅
  // 3. Allowed if:
  //    - depositUsed == true (even if released/remaining=0), OR
  //    - remainingAmount > 0 (active deposit)
  const collateralDeposits = useMemo(() => {
    return userDeposits
      .map((d, index) => {
        // Check if deposit has been used in submitAction
        const depositUsedResult = depositUsedQueries.data?.[index];
        const isUsed = depositUsedResult?.result ?? false;
        return { deposit: d, isUsed };
      })
      .filter(({ deposit, isUsed }) => {
        // Filter by token type jika asset sudah dipilih
        if (asset && deposit.tokenType !== asset) return false;
        // Allow:
        // - Used deposits (even if released/remaining=0), OR
        // - Active deposits with remaining > 0
        try {
          const remaining = parseTokenAmount(deposit.remainingAmount, deposit.tokenType);
          return isUsed || remaining > 0n;
        } catch {
          return isUsed; // Fallback to isUsed if parsing fails
        }
      })
      .map(({ deposit }) => deposit);
  }, [userDeposits, asset, depositUsedQueries.data]);

  // Filter deposits that have NEVER been used in submitAction (for withdrawUnused)
  // These are deposits where depositUsed == false (haven't been used in any encrypted action)
  // Note: withdrawUnused doesn't set depositUsed = true, so deposits can be partially withdrawn
  // and still be available for withdrawUnused
  const unusedDeposits = useMemo(() => {
    return userDeposits.filter((d, index) => {
      try {
        const remaining = parseTokenAmount(d.remainingAmount, d.tokenType);
        
        // Check if deposit has been used in submitAction
        const depositUsedResult = depositUsedQueries.data?.[index];
        const isUsed = depositUsedResult?.result ?? false;
        
        // Unused deposits: depositUsed == false AND remainingAmount > 0
        // This includes deposits that have been partially withdrawn via withdrawUnused
        // (e.g., deposit 2 USDC, withdrawUnused 1 USDC, still has 1 USDC remaining)
        return !isUsed && remaining > 0n;
      } catch {
        return false;
      }
    });
  }, [userDeposits, depositUsedQueries.data]);

  // Use collateralDeposits for withdraw collateral
  const availableDeposits = collateralDeposits;

  const handleWithdraw = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to withdraw.",
        variant: "destructive",
      });
      return;
    }

    if (!asset || !amount || !depositId) {
      toast({
        title: "Invalid input",
        description: "Please select asset, amount, and deposit.",
        variant: "destructive",
      });
      return;
    }

    const tokenType = asset as TokenType;
    const selectedDeposit = availableDeposits.find((d) => d.depositId === depositId);

    if (!selectedDeposit) {
      toast({
        title: "Invalid deposit",
        description: "Selected deposit not found.",
        variant: "destructive",
      });
      return;
    }

    // Validate amount doesn't exceed available collateral
    // For withdraw collateral, funds come from Sapphire, not from depositId
    // So we validate against position.collateral, not depositId.remainingAmount
    const withdrawAmount = parseFloat(amount);
    if (position.data && position.data.collateral > 0n) {
      const collateralAmount = parseFloat(position.data.collateralFormatted);
      if (withdrawAmount > collateralAmount) {
        toast({
          title: "Amount exceeds collateral",
          description: `You can only withdraw up to ${position.data.collateralFormatted} ${selectedDeposit.token} (your available collateral).`,
          variant: "destructive",
        });
        return;
      }
    } else {
      toast({
        title: "No collateral available",
        description: "You don't have any collateral to withdraw for this asset.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare action payload
      const tokenAddress = getTokenAddressForType(tokenType);
      const amountWei = parseTokenAmount(amount, tokenType);
      const memo = reference ? new TextEncoder().encode(reference) : new Uint8Array();

      const payload = {
        actionType: ActionType.WITHDRAW,
        token: tokenAddress,
        amount: amountWei,
        onBehalf: address,
        depositId: depositId as Hex,
        isNative: tokenType === "native",
        memo: `0x${Array.from(memo).map((b) => b.toString(16).padStart(2, "0")).join("")}` as Hex,
      };

      // Encrypt action
      const ciphertext = encryptAction(payload);

      // Show transaction dialog
      setShowTransactionDialog(true);
      setTransactionStatus("pending");

      // Submit action
      await submitAction(depositId, ciphertext);
    } catch (err) {
      console.error("Withdraw error:", err);
      setTransactionStatus("error");
      toast({
        title: "Withdrawal failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Handle transaction status changes for withdraw collateral
  useEffect(() => {
    if (isPending) {
      setTransactionStatus("pending");
    } else if (isConfirming) {
      setTransactionStatus("confirming");
    } else if (isSuccess) {
      setTransactionStatus("success");
      toast({
        title: "Withdrawal accepted.",
        description: "Encrypted instruction dispatched to the vault. Funds will be released to your wallet after validation.",
      });
      // Reset form after success
      setTimeout(() => {
        setAsset("");
        setAmount("");
        setDepositId("");
        setReference("");
      }, 2000);
    } else if (error) {
      setTransactionStatus("error");
    }
  }, [isPending, isConfirming, isSuccess, error, toast]);

  // Handle transaction status changes for withdrawUnused
  useEffect(() => {
    if (isPendingUnused) {
      setUnusedTransactionStatus("pending");
    } else if (isConfirmingUnused) {
      setUnusedTransactionStatus("confirming");
    } else if (isSuccessUnused) {
      setUnusedTransactionStatus("success");
      toast({
        title: "Withdraw unused successful.",
        description: "Funds have been withdrawn from the unused deposit.",
      });
      // Reset form after success
      setTimeout(() => {
        setUnusedDepositId("");
        setUnusedAmount("");
      }, 2000);
    } else if (errorUnused) {
      setUnusedTransactionStatus("error");
    }
  }, [isPendingUnused, isConfirmingUnused, isSuccessUnused, errorUnused, toast]);

  const selectedDeposit = availableDeposits.find((d) => d.depositId === depositId);

  const selectedUnusedDeposit = unusedDeposits.find((d) => d.depositId === unusedDepositId);

  const handleWithdrawUnused = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to withdraw.",
        variant: "destructive",
      });
      return;
    }

    if (!unusedDepositId) {
      toast({
        title: "No deposit selected",
        description: "Please select an unused deposit to withdraw from.",
        variant: "destructive",
      });
      return;
    }

    const selectedDeposit = unusedDeposits.find((d) => d.depositId === unusedDepositId);
    if (!selectedDeposit) {
      toast({
        title: "Invalid deposit",
        description: "Selected deposit not found.",
        variant: "destructive",
      });
      return;
    }

    // Parse amount if provided, otherwise 0 (full withdraw)
    let withdrawAmount: bigint | undefined = undefined;
    if (unusedAmount && parseFloat(unusedAmount) > 0) {
      try {
        withdrawAmount = parseTokenAmount(unusedAmount, selectedDeposit.tokenType);
        const remainingAmount = parseTokenAmount(selectedDeposit.remainingAmount, selectedDeposit.tokenType);
        
        if (withdrawAmount > remainingAmount) {
          toast({
            title: "Amount exceeds remaining",
            description: `You can only withdraw up to ${selectedDeposit.remainingAmount} ${selectedDeposit.token}.`,
            variant: "destructive",
          });
          return;
        }
      } catch (err) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Show transaction dialog
      setShowUnusedTransactionDialog(true);
      setUnusedTransactionStatus("pending");
      
      await withdrawUnused(unusedDepositId, withdrawAmount);
    } catch (err) {
      console.error("Withdraw unused error:", err);
      setUnusedTransactionStatus("error");
      toast({
        title: "Withdrawal failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-medium mb-2">Withdraw</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Withdraw your supplied capital from Cylend pools with privacy-preserving settlement logic.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="p-4 md:p-6 animate-slide-up">
            <div className="space-y-6">
              {/* Asset */}
              <div className="space-y-2">
                <Label>Asset</Label>
                <Select value={asset} onValueChange={(value) => setAsset(value as TokenType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset to withdraw" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdc">USDC</SelectItem>
                    <SelectItem value="usdt">USDT</SelectItem>
                    <SelectItem value="wmnt">WMNT</SelectItem>
                    <SelectItem value="native">MNT (Native)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Collateral Info */}
              {position.data && position.data.collateral > 0n && (
                <Card className="p-4 border-primary/30 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Collateral Available</span>
                    </div>
                    <span className="text-sm font-mono">
                      {position.data.collateralFormatted} {asset ? getTokenConfig(asset as TokenType).symbol : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This is your total collateral in Sapphire. You can withdraw up to this amount (subject to health factor).
                  </p>
                </Card>
              )}

              {/* Deposit Selection - Can use any depositId (just for ownership validation) */}
              <DepositSelector
                selectedDepositId={depositId}
                onSelectDeposit={setDepositId}
                filterByToken={asset}
                label="Deposit ID (Reference)"
                placeholder="Select deposit ID (for ownership validation)"
                deposits={availableDeposits}
                useHook={false}
              />
              {availableDeposits.length === 0 && asset && (
                <Card className="p-4 border-warning/30 bg-warning/5">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-foreground">
                      No available deposits for {asset.toUpperCase()}
                    </p>
                    <p className="text-muted-foreground">
                      You need at least one depositId (active or already used) as ownership reference.
                      {position.data && position.data.collateral > 0n && (
                        <>
                          {" "}
                          You already have {position.data.collateralFormatted} {asset.toUpperCase()} collateral in Sapphire. Create or re-use any depositId to proceed; funds still come from the Sapphire pool.
                        </>
                      )}
                    </p>
                  </div>
                </Card>
              )}
              {depositId && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>Note:</strong> Deposit ID is only used for ownership validation. Collateral funds come from Sapphire pool, not from this deposit.
                  </p>
                  {selectedDeposit && (
                    <p>
                      Selected deposit: {selectedDeposit.remainingAmount} {selectedDeposit.token} remaining (this amount is not used for withdrawal).
                    </p>
                  )}
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Amount</Label>
                  <span className="text-sm text-muted-foreground">
                    {position.data && position.data.collateral > 0n
                      ? `Available collateral: ${position.data.collateralFormatted} ${asset ? getTokenConfig(asset as TokenType).symbol : ""}`
                      : position.isLoading
                      ? "Loading collateral..."
                      : "No collateral available"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-mono"
                    disabled={!position.data || position.data.collateral === 0n}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (position.data && position.data.collateral > 0n) {
                        setAmount(position.data.collateralFormatted);
                      }
                    }}
                    disabled={!position.data || position.data.collateral === 0n}
                  >
                    Max
                  </Button>
                </div>
                {position.data && position.data.collateral > 0n && amount && parseFloat(amount) > parseFloat(position.data.collateralFormatted) && (
                  <p className="text-xs text-destructive">
                    Amount exceeds available collateral ({position.data.collateralFormatted} {asset ? getTokenConfig(asset as TokenType).symbol : ""})
                  </p>
                )}
                {position.data && position.data.collateral === 0n && (
                  <p className="text-xs text-muted-foreground">
                    You don't have any collateral to withdraw for this asset.
                  </p>
                )}
              </div>

              {/* Internal reference */}
              <div className="space-y-2">
                <Label>Internal reference (optional)</Label>
                <Input
                  placeholder="Desk or reporting reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Internal desk or reporting reference. Not exposed in public settlement records.
                </p>
              </div>

              {/* Privacy info */}
              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    Withdrawal instructions are encrypted and evaluated by the vault. Funds will be released to your wallet after validation.
                  </div>
                </div>
              </Card>

              {/* Submit button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleWithdraw}
                disabled={
                  !asset ||
                  !amount ||
                  !depositId ||
                  isPending ||
                  isConfirming ||
                  !isConnected ||
                  !position.data ||
                  position.data.collateral === 0n ||
                  (position.data && parseFloat(amount) > parseFloat(position.data.collateralFormatted))
                }
              >
                {isPending || isConfirming ? (
                  <div className="flex items-center gap-2">
                    <BlockchainLoader size="sm" />
                    <span>{isConfirming ? "Confirming..." : "Processing..."}</span>
                  </div>
                ) : (
                  "Withdraw"
                )}
              </Button>

            </div>
          </Card>

          {/* Separate section for Withdraw Unused */}
          <Card className="p-4 md:p-6 animate-slide-up mt-6 border-dashed">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-1">Withdraw Unused Deposit</h3>
                <p className="text-sm text-muted-foreground">
                  Withdraw deposits that have never been used in any action. Direct withdrawal from Mantle (no encryption).
                </p>
              </div>

              {/* Unused Deposit Selection */}
              <DepositSelector
                selectedDepositId={unusedDepositId}
                onSelectDeposit={setUnusedDepositId}
                label="Unused Deposit"
                placeholder="Select unused deposit to withdraw from"
                deposits={unusedDeposits}
                useHook={false}
              />
              {unusedDeposits.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No unused deposits found. Unused deposits are deposits that have never been used in any action (initialAmount == remainingAmount).
                </p>
              )}

              {/* Unused Amount */}
              {selectedUnusedDeposit && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Amount (optional)</Label>
                    <span className="text-sm text-muted-foreground">
                      Available: {selectedUnusedDeposit.remainingAmount} {selectedUnusedDeposit.token}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.00 (leave empty for full)"
                      value={unusedAmount}
                      onChange={(e) => setUnusedAmount(e.target.value)}
                      className="font-mono"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (selectedUnusedDeposit) {
                          setUnusedAmount(selectedUnusedDeposit.remainingAmount);
                        }
                      }}
                      disabled={!selectedUnusedDeposit}
                    >
                      Max
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to withdraw full amount. Partial withdrawals are supported.
                  </p>
                </div>
              )}

              {/* Withdraw Unused Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleWithdrawUnused}
                disabled={!unusedDepositId || isPendingUnused || isConfirmingUnused || !isConnected}
              >
                {isPendingUnused || isConfirmingUnused ? (
                  <div className="flex items-center gap-2">
                    <BlockchainLoader size="sm" />
                    <span>{isConfirmingUnused ? "Confirming..." : "Processing..."}</span>
                  </div>
                ) : (
                  unusedAmount && parseFloat(unusedAmount) > 0
                    ? `Withdraw ${unusedAmount} ${selectedUnusedDeposit?.token || ""}`
                    : "Withdraw Full Amount"
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Summary panel */}
        <div>
          <Card className="p-4 md:p-6 lg:sticky lg:top-6 animate-slide-up-delayed">
            <h3 className="font-medium mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Asset</span>
                  <span className="font-medium">
                    {asset ? getTokenConfig(asset as TokenType).symbol : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium font-mono">
                    {amount ? `${amount} ${asset ? getTokenConfig(asset as TokenType).symbol : ""}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="font-medium font-mono text-xs">
                    {depositId ? `${depositId.slice(0, 6)}...${depositId.slice(-4)}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium">Mantle</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Withdrawal will be processed through Cylend Escrow.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Funds will be released to your wallet after vault validation.
                  </span>
                </div>
                {position.data && amount && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Collateral remaining after withdrawal:{" "}
                      {(
                        parseFloat(position.data.collateralFormatted) - parseFloat(amount || "0")
                      ).toFixed(6)}{" "}
                      {asset ? getTokenConfig(asset as TokenType).symbol : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Dialog for Withdraw Collateral */}
      <TransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        status={transactionStatus}
        hash={hash}
        title={
          transactionStatus === "pending" ? "Confirm Withdrawal"
            : transactionStatus === "confirming" ? "Confirming Withdrawal"
            : transactionStatus === "success" ? "Withdrawal Successful"
            : transactionStatus === "error" ? "Withdrawal Failed"
            : undefined
        }
        description={
          transactionStatus === "pending" ? "Please confirm the withdrawal transaction in your wallet."
            : transactionStatus === "confirming" ? "Waiting for blockchain confirmation..."
            : transactionStatus === "success" ? "Your withdrawal request has been successfully submitted."
            : transactionStatus === "error" ? undefined
            : undefined
        }
        errorMessage={error?.message}
        onClose={() => {
          if (transactionStatus === "success" || transactionStatus === "error") {
            setShowTransactionDialog(false);
            setTransactionStatus(null);
          }
        }}
      />

      {/* Transaction Dialog for Withdraw Unused */}
      <TransactionDialog
        open={showUnusedTransactionDialog}
        onOpenChange={setShowUnusedTransactionDialog}
        status={unusedTransactionStatus}
        hash={hashUnused}
        title={
          unusedTransactionStatus === "pending" ? "Confirm Withdraw Unused"
            : unusedTransactionStatus === "confirming" ? "Confirming Withdraw Unused"
            : unusedTransactionStatus === "success" ? "Withdraw Unused Successful"
            : unusedTransactionStatus === "error" ? "Withdraw Unused Failed"
            : undefined
        }
        description={
          unusedTransactionStatus === "pending" ? "Please confirm the withdraw unused transaction in your wallet."
            : unusedTransactionStatus === "confirming" ? "Waiting for blockchain confirmation..."
            : unusedTransactionStatus === "success" ? "Your unused deposit has been successfully withdrawn."
            : unusedTransactionStatus === "error" ? undefined
            : undefined
        }
        errorMessage={errorUnused?.message}
        onClose={() => {
          if (unusedTransactionStatus === "success" || unusedTransactionStatus === "error") {
            setShowUnusedTransactionDialog(false);
            setUnusedTransactionStatus(null);
          }
        }}
      />
    </div>
  );
}

