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
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useSubmitAction } from "@/hooks/useIngress";
import { encryptAction, ActionType } from "@/lib/sapphire";
import { parseTokenAmount, getTokenAddressForType, formatTokenAmount, type TokenType } from "@/lib/tokenUtils";
import { getTokenConfig } from "@/lib/constants";
import { type Hex } from "viem";
import { DepositSelector } from "@/components/DepositSelector";
import { useDepositOptions } from "@/hooks/usePonderDeposits";
import { TransactionDialog } from "@/components/TransactionDialog";

export default function Allocate() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [asset, setAsset] = useState<TokenType | "">("");
  const [amount, setAmount] = useState("");
  const [depositId, setDepositId] = useState("");
  const [reference, setReference] = useState("");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"pending" | "confirming" | "success" | "error" | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | undefined>(undefined);
  
  const { submitAction, isPending, isConfirming, isSuccess, hash, error } = useSubmitAction();

  // Get deposits from Ponder
  const { deposits: availableDeposits } = useDepositOptions(asset || undefined);
  const selectedDeposit = availableDeposits.find((d) => d.depositId === depositId);

  const handleAllocate = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to allocate capital.",
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

    if (!selectedDeposit) {
      toast({
        title: "Invalid deposit",
        description: "Selected deposit not found.",
        variant: "destructive",
      });
      return;
    }

    // Validate amount doesn't exceed remaining balance
    const amountBigInt = parseTokenAmount(amount, tokenType);
    const remainingBigInt = parseTokenAmount(selectedDeposit.remainingAmount, selectedDeposit.tokenType);

    if (amountBigInt > remainingBigInt) {
      toast({
        title: "Insufficient deposit balance",
        description: `Amount exceeds remaining balance in selected deposit (${selectedDeposit.remainingAmount} ${selectedDeposit.token}).`,
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
        actionType: ActionType.SUPPLY,
        token: tokenAddress,
        amount: amountWei,
        onBehalf: address,
        depositId: depositId as Hex,
        isNative: tokenType === "native",
        memo: `0x${Array.from(memo).map((b) => b.toString(16).padStart(2, "0")).join("")}` as Hex,
      };

      // Encrypt action
      const ciphertext = encryptAction(payload);

      // Show transaction dialog immediately
      setShowTransactionDialog(true);
      setTransactionStatus("pending");

      // Submit action
      await submitAction(depositId, ciphertext);
    } catch (err) {
      console.error("Allocate error:", err);
      setTransactionStatus("error");
      toast({
        title: "Allocation failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Handle transaction hash update
  useEffect(() => {
    if (hash) {
      setTransactionHash(hash);
    }
  }, [hash]);

  // Handle transaction status changes
  useEffect(() => {
    if (!showTransactionDialog) return;

    if (isPending) {
      setTransactionStatus("pending");
    } else if (isConfirming) {
      setTransactionStatus("confirming");
    } else if (isSuccess) {
      setTransactionStatus("success");
    toast({
      title: "Allocation accepted.",
      description: "Encrypted instruction dispatched to the vault. A settlement record will appear once funds are released.",
    });
      // Reset form after success
      setTimeout(() => {
    setAsset("");
    setAmount("");
        setDepositId("");
    setReference("");
        setShowTransactionDialog(false);
        setTransactionStatus(null);
        setTransactionHash(undefined);
      }, 3000);
    } else if (error) {
      setTransactionStatus("error");
    }
  }, [isPending, isConfirming, isSuccess, error, showTransactionDialog, toast]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-medium mb-2">Allocate Capital</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Deploy capital into Cylend pools with privacy-preserving credit logic.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="p-4 md:p-6 animate-slide-up">
            <div className="space-y-6">
              {/* Pool & Asset */}
              <div className="space-y-2">
                <Label>Pool & Asset</Label>
                <Select value={asset} onValueChange={(value) => setAsset(value as TokenType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset pool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdc">USDC on Mantle</SelectItem>
                    <SelectItem value="usdt">USDT on Mantle</SelectItem>
                    <SelectItem value="wmnt">WMNT on Mantle</SelectItem>
                    <SelectItem value="native">MNT (Native) on Mantle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Deposit Selection */}
              <DepositSelector
                selectedDepositId={depositId}
                onSelectDeposit={setDepositId}
                filterByToken={asset}
                label="Deposit"
                placeholder="Select deposit to use"
                useHook={true}
              />

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Amount</Label>
                  <span className="text-sm text-muted-foreground">
                    Available in deposit: {selectedDeposit ? `${selectedDeposit.remainingAmount} ${selectedDeposit.token}` : "—"}
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
                      if (selectedDeposit) {
                        setAmount(selectedDeposit.remainingAmount);
                      }
                    }}
                    disabled={!selectedDeposit}
                  >
                    Max
                  </Button>
                </div>
                {selectedDeposit && amount && parseTokenAmount(amount, asset as TokenType) > parseTokenAmount(selectedDeposit.remainingAmount, selectedDeposit.tokenType) && (
                  <p className="text-xs text-destructive">
                    Amount exceeds available balance in selected deposit ({selectedDeposit.remainingAmount} {selectedDeposit.token})
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
                    Instruction details are encrypted with the vault&apos;s key and evaluated off-chain inside Sapphire. Only the Cylend Vault can authorize releases.
                  </div>
                </div>
              </Card>

              {/* Submit button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleAllocate}
                disabled={!asset || !amount || !depositId || isPending || isConfirming || !isConnected}
              >
                {isPending || isConfirming ? (
                  <div className="flex items-center gap-2">
                    <BlockchainLoader size="sm" />
                    <span>{isConfirming ? "Confirming..." : "Processing..."}</span>
                  </div>
                ) : (
                  'Deploy capital'
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
                    {depositId && typeof depositId === 'string' && depositId.length > 10
                      ? `${depositId.slice(0, 6)}...${depositId.slice(-4)}`
                      : depositId || "—"}
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
                    Funds will be held in Cylend Escrow on Mantle.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Public explorers see escrow and disbursement, not Lender → Borrower pairs.
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
          (transactionHash && typeof transactionHash === 'string')
            ? (transactionHash as `0x${string}`)
            : (hash && typeof hash === 'string')
            ? (hash as `0x${string}`)
            : undefined
        }
        title="Allocate Capital"
        description={
          transactionStatus === "pending"
            ? "Please confirm the transaction in your wallet."
            : transactionStatus === "confirming"
            ? "Waiting for blockchain confirmation..."
            : transactionStatus === "success"
            ? "Encrypted instruction dispatched to the vault. A settlement record will appear once funds are released."
            : transactionStatus === "error"
            ? "Allocation failed. Please try again."
            : ""
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
