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
import { Shield, Info, AlertTriangle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useSubmitAction } from "@/hooks/useIngress";
import { encryptAction, ActionType } from "@/lib/sapphire";
import { parseTokenAmount, getTokenAddressForType, formatTokenAmount } from "@/lib/tokenUtils";
import { getTokenConfig, type TokenType } from "@/lib/constants";
import { type Hex } from "viem";
import { DepositSelector } from "@/components/DepositSelector";
import { useDepositOptions, useUserDeposits } from "@/hooks/usePonderDeposits";
import { TransactionDialog } from "@/components/TransactionDialog";

export default function Borrow() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [asset, setAsset] = useState<TokenType | "">("");
  const [amount, setAmount] = useState("");
  const [collateralDepositId, setCollateralDepositId] = useState("");
  const [reference, setReference] = useState("");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"pending" | "confirming" | "success" | "error" | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | undefined>(undefined);
  
  const { submitAction, isPending, isConfirming, isSuccess, hash, error } = useSubmitAction();

  // Get user deposits (with initial & remaining amounts)
  const { deposits: userDeposits } = useUserDeposits();

  // Hanya gunakan deposit yang sudah pernah dipakai (initial > remaining) sebagai collateral bucket
  const collateralDeposits = useMemo(() => {
    return (
      userDeposits
        // Filter by token type jika asset sudah dipilih
        .filter((d) => !asset || d.tokenType === asset)
        // Sudah pernah dipakai (misalnya untuk SUPPLY) jika initialAmount > remainingAmount
        .filter((d) => {
          try {
            const initial = parseTokenAmount(d.initialAmount, d.tokenType);
            const remaining = parseTokenAmount(d.remainingAmount, d.tokenType);
            return initial > remaining;
          } catch {
            return false;
          }
        })
    );
  }, [userDeposits, asset]);

  const selectedCollateralDeposit = collateralDeposits.find(
    (d) => d.depositId === collateralDepositId
  );

  // Collateral yang sudah dipakai dari deposit ini (initial - remaining)
  const selectedCollateralAmount = useMemo(() => {
    if (!selectedCollateralDeposit) return null;
    try {
      const initial = parseTokenAmount(
        selectedCollateralDeposit.initialAmount,
        selectedCollateralDeposit.tokenType
      );
      const remaining = parseTokenAmount(
        selectedCollateralDeposit.remainingAmount,
        selectedCollateralDeposit.tokenType
      );
      const used = initial - remaining;
      if (used <= 0n) return null;
      return formatTokenAmount(used, selectedCollateralDeposit.tokenType);
    } catch {
      return null;
    }
  }, [selectedCollateralDeposit]);

  const handleBorrow = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to borrow.",
        variant: "destructive",
      });
      return;
    }

    if (!asset || !amount || !collateralDepositId) {
      toast({
        title: "Invalid input",
        description: "Please select asset, amount, and collateral deposit.",
        variant: "destructive",
      });
      return;
    }

    const tokenType = asset as TokenType;

    if (!selectedCollateralDeposit) {
      toast({
        title: "Invalid deposit",
        description: "Selected collateral deposit not found.",
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
        actionType: ActionType.BORROW,
        token: tokenAddress,
        amount: amountWei,
        onBehalf: address,
        depositId: collateralDepositId as Hex,
        isNative: tokenType === "native",
        memo: `0x${Array.from(memo).map((b) => b.toString(16).padStart(2, "0")).join("")}` as Hex,
      };

      // Encrypt action
      const ciphertext = encryptAction(payload);

      // Show transaction dialog
      setShowTransactionDialog(true);
      setTransactionStatus("pending");

      // Submit action
      await submitAction(collateralDepositId, ciphertext);
    } catch (err) {
      console.error("Borrow error:", err);
      setTransactionStatus("error");
      toast({
        title: "Borrow failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Handle transaction status changes
  useEffect(() => {
    if (hash) {
      setTransactionHash(hash);
    }

    if (isPending && showTransactionDialog) {
      setTransactionStatus("pending");
    } else if (isConfirming && showTransactionDialog) {
      setTransactionStatus("confirming");
    } else if (isSuccess && showTransactionDialog) {
      setTransactionStatus("success");
      toast({
        title: "Borrow request submitted",
        description: "Encrypted instruction dispatched to the vault. Funds will be released after health factor validation.",
      });
      // Reset form after success
      setTimeout(() => {
        setAsset("");
        setAmount("");
        setCollateralDepositId("");
        setReference("");
         setShowTransactionDialog(false);
         setTransactionStatus(null);
       }, 3000);
    } else if (error && showTransactionDialog) {
      setTransactionStatus("error");
    }
  }, [isPending, isConfirming, isSuccess, error, hash, showTransactionDialog, toast]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-medium mb-2">Borrow</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Borrow assets using your deposits as collateral with privacy-preserving credit logic.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="p-4 md:p-6 animate-slide-up">
            <div className="space-y-6">
              {/* Asset to Borrow */}
              <div className="space-y-2">
                <Label>Asset to Borrow</Label>
                <Select value={asset} onValueChange={(value) => setAsset(value as TokenType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset to borrow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdc">USDC</SelectItem>
                    <SelectItem value="usdt">USDT</SelectItem>
                    <SelectItem value="wmnt">WMNT</SelectItem>
                    <SelectItem value="native">MNT (Native)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Amount</Label>
                  <span className="text-sm text-muted-foreground">
                    {selectedCollateralDeposit
                      ? `Available: ${selectedCollateralDeposit.remainingAmount} ${selectedCollateralDeposit.token}`
                      : "Select a collateral deposit to see available amount"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-mono"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (selectedCollateralDeposit) {
                        setAmount(selectedCollateralDeposit.remainingAmount);
                      }
                    }}
                    disabled={!selectedCollateralDeposit}
                  >
                    Max
                  </Button>
                </div>
              </div>

              {/* Collateral Deposit Selection */}
              <DepositSelector
                deposits={collateralDeposits}
                selectedDepositId={collateralDepositId}
                onSelectDeposit={setCollateralDepositId}
                label="Collateral Deposit"
                placeholder="Select deposit as collateral"
                useHook={false}
              />
              {selectedCollateralDeposit && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {selectedCollateralAmount && (
                    <p>
                      Collateral from this deposit (already supplied): {selectedCollateralAmount}{" "}
                      {selectedCollateralDeposit.token}
                    </p>
                  )}
                  <p>
                    Available in this deposit (unused): {selectedCollateralDeposit.remainingAmount}{" "}
                    {selectedCollateralDeposit.token}. Remaining balance will be updated after
                    future actions.
                  </p>
                </div>
              )}

              {/* Health Factor Warning */}
              {amount && collateralDepositId && (
                <Card className="p-4 border-warning/30 bg-warning/5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 text-sm">
                      <div className="font-medium text-foreground">
                        Estimated Health Factor: 1.25
                      </div>
                      <p className="text-muted-foreground">
                        Health factor must be ≥ 1.0 to borrow. Your position will be
                        liquidatable if health factor drops below 1.0.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Internal reference */}
              <div className="space-y-2">
                <Label>Internal reference (optional)</Label>
                <Input
                  placeholder="Desk or reporting reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Internal desk or reporting reference. Not exposed in public
                  settlement records.
                </p>
              </div>

              {/* Privacy info */}
              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    Borrow instructions are encrypted and evaluated by the vault. Health factor
                    is calculated privately on Sapphire. Funds will be released to your wallet
                    after validation.
                  </div>
                </div>
              </Card>

              {/* Submit button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleBorrow}
                disabled={
                  !asset ||
                  !amount ||
                  !collateralDepositId ||
                  isPending ||
                  isConfirming ||
                  !isConnected
                }
              >
                {isPending || isConfirming ? (
                  <div className="flex items-center gap-2">
                    <BlockchainLoader size="sm" />
                    <span>{isConfirming ? "Confirming..." : "Processing..."}</span>
                  </div>
                ) : (
                  "Borrow"
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
                  <span className="text-muted-foreground">Collateral</span>
                  <span className="font-medium">
                    {selectedCollateralDeposit && selectedCollateralAmount
                      ? `${selectedCollateralAmount} ${selectedCollateralDeposit.token}`
                      : selectedCollateralDeposit
                      ? `0 ${selectedCollateralDeposit.token}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit ID</span>
                  <span className="font-medium font-mono text-xs">
                    {collateralDepositId ? `${collateralDepositId.slice(0, 6)}...${collateralDepositId.slice(-4)}` : "—"}
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
                    Collateral deposit remains active and can be used for other actions.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Borrowed funds will be released to your wallet after vault validation.
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        status={transactionStatus}
        hash={
          (transactionHash && typeof transactionHash === "string"
            ? (transactionHash as `0x${string}`)
            : hash && typeof hash === "string"
            ? (hash as `0x${string}`)
            : undefined) || undefined
        }
        title="Borrow"
        description={
          transactionStatus === "pending"
            ? "Please confirm the transaction in your wallet."
            : transactionStatus === "confirming"
            ? "Waiting for blockchain confirmation..."
            : transactionStatus === "success"
            ? "Borrow request submitted. Funds will be released after vault validation."
            : transactionStatus === "error"
            ? "Borrow transaction failed. Please try again."
            : undefined
        }
        errorMessage={error?.message ? String(error.message) : undefined}
        onClose={() => {
          if (transactionStatus === "success" || transactionStatus === "error") {
            setShowTransactionDialog(false);
            setTransactionStatus(null);
            setTransactionHash(undefined);
          }
        }}
      />
    </div>
  );
}

