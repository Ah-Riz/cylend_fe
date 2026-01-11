"use client";

import { useParams, useRouter } from "next/navigation";
import { usePonderDeposit, useDepositActions } from "@/hooks/usePonderDeposits";
import { formatTokenAmount } from "@/lib/tokenUtils";
import { getTokenConfig, type TokenType } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Calendar, Wallet, History, Copy } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function DepositDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const depositId = typeof params.id === "string" ? params.id : "";

    const { data: deposit, isLoading: isLoadingDeposit } = usePonderDeposit(depositId);
    const { data: actions, isLoading: isLoadingActions } = useDepositActions(depositId);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            description: "Copied to clipboard",
        });
    };

    if (isLoadingDeposit) {
        return <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
        </div>;
    }

    if (!deposit) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">Deposit Not Found</h2>
                <p className="text-muted-foreground mb-6">The deposit you are looking for does not exist or has not been indexed yet.</p>
                <Button onClick={() => router.push("/app/deposit")}>Back to Deposits</Button>
            </div>
        );
    }

    // Determine token type and config
    const tokenAddress = deposit.token.toLowerCase();
    let tokenType: TokenType = "usdc"; // default

    if (deposit.isNative) {
        tokenType = "native";
    } else {
        // Match token address to token type
        // This logic is duplicated from useUserDeposits, could be refactored
        const configs = [
            getTokenConfig("wmnt"),
            getTokenConfig("usdc"),
            getTokenConfig("usdt")
        ];

        const match = configs.find(c => c.address.toLowerCase() === tokenAddress);
        if (match) {
            // We need to reverse lookup the key or just use the symbol to determine type if needed
            // Simpler: assume we can just use the config we found.
            // But we need 'tokenType' string for formatTokenAmount utility if strictly typed
            if (match.symbol === "WMNT") tokenType = "wmnt";
            else if (match.symbol === "USDC") tokenType = "usdc";
            else if (match.symbol === "USDT") tokenType = "usdt";
        }
    }

    const tokenConfig = getTokenConfig(tokenType);
    const initialAmount = formatTokenAmount(BigInt(deposit.initialAmount), tokenType);
    const remainingAmount = formatTokenAmount(BigInt(deposit.remainingAmount), tokenType);

    // Calculate usage percentage
    const initial = Number(initialAmount.replace(/,/g, ''));
    const remaining = Number(remainingAmount.replace(/,/g, ''));
    const used = initial - remaining;
    const usagePercent = initial > 0 ? (used / initial) * 100 : 0;

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/app/deposit")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-medium flex items-center gap-2">
                            Deposit Details
                            <Badge variant="outline" className="font-mono text-sm font-normal text-muted-foreground">
                                ID: {depositId}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Created on {new Date(deposit.createdAt * 1000).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(depositId)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy ID
                    </Button>
                    {/* Fallback Explorer Link: Search by User Address since we lack TX Hash */}
                    <Button variant="outline" size="sm" asChild>
                        <a
                            href={`https://sepolia.mantlescan.xyz/address/${deposit.depositor}#tokentxns`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on Explorer
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Status Card */}
                <Card className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            Overview
                        </h3>
                        <Badge
                            variant={deposit.released ? "secondary" : "default"}
                            className={deposit.released ? "" : "bg-success/10 text-success border-success/30"}
                        >
                            {deposit.released ? "Released" : "Active"}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Asset</span>
                            <div className="flex items-center gap-2 font-medium">
                                {tokenConfig.icon && (
                                    <div className="relative h-5 w-5">
                                        <Image src={tokenConfig.icon} alt={tokenConfig.symbol} fill className="object-contain" />
                                    </div>
                                )}
                                {tokenConfig.symbol}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Network</span>
                            <div className="flex items-center gap-2 font-medium">
                                Mantle Sepolia
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Initial Amount</span>
                            <div className="font-mono text-lg">{initialAmount}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Remaining Balance</span>
                            <div className="font-mono text-lg font-semibold text-primary">{remainingAmount}</div>
                        </div>
                    </div>

                    {/* Usage Bar */}
                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Usage ({usagePercent.toFixed(1)}%)</span>
                            <span>{formatTokenAmount(BigInt(Math.floor(used * (10 ** tokenConfig.decimals))), tokenType)} Used</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Info Card */}
                <Card className="p-6 bg-muted/20">
                    <h3 className="font-medium text-lg mb-4">Deposit Information</h3>

                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                            <span className="text-muted-foreground">Depositor</span>
                            <span className="font-mono break-all">{deposit.depositor}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                            <span className="text-muted-foreground">Token Contract</span>
                            <span className="font-mono break-all">{deposit.token}</span>
                        </div>

                        <div className="mt-6 p-4 bg-background rounded-lg border text-muted-foreground">
                            <p className="mb-2">
                                This deposit is held in the Cylend Ingress contract. You can use this balance to perform private actions on the Sapphire network without conducting new transactions from your wallet for every action.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* History / Actions */}
            <Card className="p-6">
                <h3 className="font-medium text-lg mb-6 flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Usage History
                </h3>

                {actions && actions.length > 0 ? (
                    <div className="space-y-4">
                        {actions.map((action) => (
                            <div key={action.actionId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="space-y-1">
                                    <div className="font-medium">
                                        Action Type: {action.actionType}
                                        {/* We would map actionType number to string like 'Supply', 'Borrow' if we knew the mapping */}
                                    </div>
                                    <div className="text-sm text-muted-foreground font-mono">
                                        {new Date(action.createdAt * 1000).toLocaleString()}
                                    </div>
                                </div>
                                <Badge variant="outline">{action.status}</Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No actions have been performed with this deposit yet.
                    </div>
                )}
            </Card>
        </div>
    );
}
