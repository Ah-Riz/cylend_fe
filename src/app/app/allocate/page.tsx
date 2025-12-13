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
import { Shield, Info } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Allocate() {
  const { toast } = useToast();
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAllocate = async () => {
    setIsLoading(true);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Allocation accepted.",
      description: "Encrypted instruction dispatched to the vault. A settlement record will appear once funds are released.",
    });
    
    // Reset form
    setAsset("");
    setAmount("");
    setReference("");
    setIsLoading(false);
  };

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
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset pool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdc">USDC on Mantle</SelectItem>
                    <SelectItem value="mnt">MNT on Mantle</SelectItem>
                    <SelectItem value="weth">WETH on Mantle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Amount</Label>
                  <span className="text-sm text-muted-foreground">
                    Balance: $250,000
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
                  <Button variant="secondary" onClick={() => setAmount("250000")}>
                    Max
                  </Button>
                </div>
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
                disabled={!asset || !amount || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <BlockchainLoader size="sm" />
                    <span>Processing...</span>
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
                  <span className="font-medium">{asset ? asset.toUpperCase() : "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium font-mono">
                    {amount ? `$${parseInt(amount).toLocaleString()}` : "—"}
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
    </div>
  );
}
