"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function Repay() {
  const { toast } = useToast();
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const handleRepay = () => {
    toast({
      title: "Repayment instruction received.",
      description: "Settlement record will update after vault confirmation.",
    });
    // Reset form
    setAsset("");
    setAmount("");
    setReference("");
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-medium mb-2">Repay / Settle</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Submit repayments with privacy-preserving settlement logic.
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
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdc">USDC</SelectItem>
                    <SelectItem value="mnt">MNT</SelectItem>
                    <SelectItem value="weth">WETH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Amount</Label>
                  <span className="text-sm text-muted-foreground">
                    Outstanding: $50,000
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
                  <Button variant="secondary" onClick={() => setAmount("50000")}>
                    Full
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
                    Repayment instructions are encrypted and evaluated by the vault. Public settlement records show repayments into escrow, not specific loan IDs.
                  </div>
                </div>
              </Card>

              {/* Submit button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleRepay}
                disabled={!asset || !amount}
              >
                Submit repayment
              </Button>
            </div>
          </Card>
        </div>

        {/* Summary panel */}
        <div>
          <Card className="p-6 sticky top-6 animate-slide-up-delayed">
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
                    Repayment will be processed through Cylend Escrow.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Settlement records are updated after vault confirmation.
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
