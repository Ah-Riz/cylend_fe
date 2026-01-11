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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info, Wallet, Plus, CheckCircle2, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useDeposits } from "@/hooks/useDeposits";
import { useERC20ApprovalFlow, useERC20Balance } from "@/hooks/useERC20Approval";
import { useBalance } from "wagmi";
import { formatTokenAmount, parseTokenAmount, getTokenAddressForType } from "@/lib/tokenUtils";
import { type TokenType, getTokenConfig } from "@/lib/constants";
import { CONTRACTS } from "@/lib/constants";
import { type Address } from "viem";
import { TransactionDialog } from "@/components/TransactionDialog";
import { useUserDeposits } from "@/hooks/usePonderDeposits";

export default function Deposit() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [asset, setAsset] = useState<TokenType | "">("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"pending" | "confirming" | "success" | "error" | null>(null);
  const [transactionType, setTransactionType] = useState<"approval" | "deposit" | null>(null);

  // Deposit hooks
  const { createDeposit, isPending, isConfirming, isSuccess, hash, error } = useDeposits();

  // Balance hooks
  const nativeBalance = useBalance({ address });
  const tokenAddress = asset && asset !== "native"
    ? (getTokenAddressForType(asset) as Address | undefined)
    : undefined;
  const erc20Balance = useERC20Balance(tokenAddress);

  // Approval flow for ERC20 tokens (only when ERC20 is selected)
  const approvalFlow = useERC20ApprovalFlow(
    asset && asset !== "native" ? asset : "usdc", // fallback for hook, won't be used if native
    asset && asset !== "native" ? amount : "0" // only check approval if ERC20
  );

  // Get deposits from Ponder
  const { deposits, isLoading: isLoadingDeposits } = useUserDeposits();

  const handleCreateDeposit = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a deposit.",
        variant: "destructive",
      });
      return;
    }

    if (!asset || !amount) {
      toast({
        title: "Invalid input",
        description: "Please select an asset and enter an amount.",
        variant: "destructive",
      });
      return;
    }

    const tokenType = asset as TokenType;

    // Check balance
    if (tokenType === "native") {
      const balance = nativeBalance.data?.value || 0n;
      const amountWei = parseTokenAmount(amount, tokenType);
      if (balance < amountWei) {
        toast({
          title: "Insufficient balance",
          description: `You don't have enough ${asset.toUpperCase()}.`,
          variant: "destructive",
        });
        return;
      }
    } else {
      const balance = erc20Balance.balance;
      const amountWei = parseTokenAmount(amount, tokenType);
      if (balance < amountWei) {
        toast({
          title: "Insufficient balance",
          description: `You don't have enough ${asset.toUpperCase()}.`,
          variant: "destructive",
        });
        return;
      }

      // Check approval for ERC20
      if (approvalFlow.needsApproval && !approvalFlow.isApproved) {
        toast({
          title: "Approval required",
          description: "Please approve token spending first, then try again.",
          variant: "default",
        });
        return;
      }
    }

    setIsLoading(true);
    setTransactionType("deposit");
    setShowTransactionDialog(true);
    setTransactionStatus("pending");

    try {
      await createDeposit(tokenType, amount);
    } catch (err) {
      console.error("Create deposit error:", err);
      setTransactionStatus("error");
      toast({
        title: "Deposit failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Handle approval transaction status
  useEffect(() => {
    if (approvalFlow.isApproving) {
      setTransactionType("approval");
      setShowTransactionDialog(true);
      setTransactionStatus("pending");
    } else if (approvalFlow.isApproved && transactionType === "approval") {
      setTransactionStatus("success");
      setTimeout(() => {
        setShowTransactionDialog(false);
        setTransactionType(null);
        setTransactionStatus(null);
      }, 2000);
    }
  }, [approvalFlow.isApproving, approvalFlow.isApproved, transactionType]);

  // Handle deposit transaction status changes
  useEffect(() => {
    if (transactionType === "deposit") {
      if (isPending) {
        setTransactionStatus("pending");
      } else if (isConfirming) {
        setTransactionStatus("confirming");
      } else if (isSuccess) {
        setTransactionStatus("success");
        // Reset form after success
        setTimeout(() => {
          setAsset("");
          setAmount("");
          setShowCreateForm(false);
          setIsLoading(false);
          setTransactionType(null);
        }, 2000);
      } else if (error) {
        setTransactionStatus("error");
        setIsLoading(false);
      }
    }
  }, [isPending, isConfirming, isSuccess, error, transactionType]);

  // Get balance display
  const getBalance = () => {
    if (!asset) return "—";
    if (asset === "native") {
      return nativeBalance.data
        ? formatTokenAmount(nativeBalance.data.value, "native")
        : "0";
    } else {
      return formatTokenAmount(erc20Balance.balance, asset);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-medium mb-2">Deposit Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Create and manage your deposits for lending actions.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Deposit
        </Button>
      </div>

      {/* Create Deposit Form */}
      {showCreateForm && (
        <Card className="p-4 md:p-6 animate-slide-up">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Create New Deposit</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>

            {/* Asset */}
            <div className="space-y-2">
              <Label>Asset</Label>
              <Select value={asset} onValueChange={(value) => setAsset(value as TokenType | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">MNT (Native)</SelectItem>
                  <SelectItem value="wmnt">WMNT</SelectItem>
                  <SelectItem value="usdc">USDC</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Amount</Label>
                <span className="text-sm text-muted-foreground">
                  Balance: {getBalance()} {asset ? asset.toUpperCase() : ""}
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
                    const balance = getBalance();
                    if (balance !== "—") {
                      setAmount(balance);
                    }
                  }}
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Approval notice for ERC20 */}
            {asset && asset !== "native" && approvalFlow.needsApproval && (
              <Card className="p-4 border-warning/30 bg-warning/5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-foreground mb-1">
                        Approval Required
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        You need to approve {asset.toUpperCase()} spending before creating a deposit.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTransactionType("approval");
                          approvalFlow.handleApprove();
                        }}
                        disabled={approvalFlow.isApproving || !amount}
                        className="w-full"
                      >
                        {approvalFlow.isApproving ? (
                          <div className="flex items-center gap-2">
                            <BlockchainLoader size="sm" />
                            <span>Approving...</span>
                          </div>
                        ) : (
                          `Approve ${asset.toUpperCase()}`
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Approved status */}
            {asset && asset !== "native" && !approvalFlow.needsApproval && approvalFlow.allowance > 0n && (
              <Card className="p-4 border-success/30 bg-success/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {asset.toUpperCase()} approved. You can create a deposit.
                  </span>
                </div>
              </Card>
            )}

            {/* Privacy info */}
            <Card className="p-4 border-primary/30 bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="relative h-5 w-5 flex-shrink-0 mt-0.5">
                  <Image
                    src="/mantle-mnt-logo.png"
                    alt="Mantle"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Funds will be held in Cylend Escrow on Mantle. You can use this deposit for
                  multiple actions (supply, borrow, repay, withdraw) until the balance is
                  depleted.
                </div>
              </div>
            </Card>

            {/* Submit button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleCreateDeposit}
              disabled={
                !asset ||
                !amount ||
                isLoading ||
                isPending ||
                isConfirming ||
                !isConnected ||
                (asset !== "native" && approvalFlow.needsApproval)
              }
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span>Create Deposit</span>
              </div>
            </Button>
          </div>
        </Card>
      )}

      {/* Active Deposits */}
      <Card className="p-4 md:p-6">
        <h2 className="text-lg font-medium mb-4">Active Deposits</h2>
        {deposits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active deposits yet.</p>
            <p className="text-sm mt-2">Create a deposit to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[800px] px-4 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deposit ID</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead className="text-right">Initial Amount</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit, index) => (
                    <TableRow key={index} className="group">
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          {deposit.depositId}
                          <a
                            href={`https://sepolia.mantlescan.xyz/address/${CONTRACTS.INGRESS}`} // Best we can do without TX Hash
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                            title="View Contract on Explorer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{deposit.token}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {deposit.initialAmount} {deposit.token}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {deposit.remainingAmount} {deposit.token}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={deposit.released ? "secondary" : "default"}
                          className={
                            deposit.released
                              ? "bg-muted text-muted-foreground"
                              : "bg-success/10 text-success border-success/30"
                          }
                        >
                          {deposit.released ? "Released" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {deposit.createdAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/app/deposit/${deposit.depositId}`)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">How deposits work:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Each deposit creates a unique deposit ID (bucket) for your funds</li>
              <li>You can use the same deposit ID for multiple actions until balance is depleted</li>
              <li>Remaining balance updates automatically after each action is processed</li>
              <li>Deposits are held in Cylend Escrow on Mantle until used</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        status={transactionStatus}
        hash={transactionType === "approval" ? approvalFlow.approveHash : hash}
        title={
          transactionType === "approval"
            ? transactionStatus === "pending" ? "Confirm Approval"
              : transactionStatus === "confirming" ? "Confirming Approval"
                : transactionStatus === "success" ? "Approval Successful"
                  : transactionStatus === "error" ? "Approval Failed"
                    : undefined
            : transactionStatus === "pending" ? "Confirm Deposit"
              : transactionStatus === "confirming" ? "Confirming Deposit"
                : transactionStatus === "success" ? "Deposit Successful"
                  : transactionStatus === "error" ? "Deposit Failed"
                    : undefined
        }
        description={
          transactionType === "approval"
            ? transactionStatus === "pending" ? "Please confirm the approval transaction in your wallet."
              : transactionStatus === "confirming" ? "Waiting for blockchain confirmation..."
                : transactionStatus === "success" ? "Token approval successful. You can now create a deposit."
                  : transactionStatus === "error" ? undefined
                    : undefined
            : transactionStatus === "pending" ? "Please confirm the deposit transaction in your wallet."
              : transactionStatus === "confirming" ? "Waiting for blockchain confirmation..."
                : transactionStatus === "success" ? "Your deposit has been successfully created."
                  : transactionStatus === "error" ? undefined
                    : undefined
        }
        errorMessage={error?.message}
        onClose={() => {
          if (transactionStatus === "success" || transactionStatus === "error") {
            setShowTransactionDialog(false);
            setTransactionStatus(null);
            setTransactionType(null);
          }
        }}
      />
    </div>
  );
}

