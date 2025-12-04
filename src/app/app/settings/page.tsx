"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Network, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const [maskBalances, setMaskBalances] = useState(false);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-medium mb-2">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Configure your institutional preferences and privacy controls.
        </p>
      </div>

      {/* Profile / Desk */}
      <Card className="p-4 md:p-6 stagger-1 hover-lift">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Profile & Desk</h3>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-border">
            <div>
              <div className="text-sm font-medium">Wallet Address</div>
              <div className="text-sm text-muted-foreground font-mono mt-1">
                0x742d...9c8a
              </div>
            </div>
            <Badge variant="secondary">Connected</Badge>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <div className="text-sm font-medium">Role</div>
              <div className="text-sm text-muted-foreground mt-1">
                Institutional Allocator
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Records & Privacy */}
      <Card className="p-4 md:p-6 stagger-2 hover-lift">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Records & Privacy</h3>
        </div>

        <div className="space-y-6">
          {/* Privacy status */}
          <div className="p-4 bg-primary/5 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Privacy: Always On</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cylend protects commercial intent by default. There is no standard mode. All allocations and repayments route through the vault.
            </p>
          </div>

          {/* Mask balances toggle */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <div className="space-y-1">
              <div className="text-sm font-medium">Mask balances on screen</div>
              <div className="text-sm text-muted-foreground">
                Hide exact numbers until revealed (client-side only)
              </div>
            </div>
            <Button
              variant={maskBalances ? "default" : "secondary"}
              size="sm"
              onClick={() => setMaskBalances(!maskBalances)}
            >
              {maskBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Network */}
      <Card className="p-4 md:p-6 stagger-3 hover-lift">
        <div className="flex items-center gap-3 mb-6">
          <Network className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Network</h3>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3">
            <div>
              <div className="text-sm font-medium">Current Network</div>
              <div className="text-sm text-muted-foreground mt-1">
                Assets custodied on Mantle with confidential logic on Sapphire
              </div>
            </div>
            <Badge variant="default" className="bg-primary/10 text-primary border-primary/30">
              Mantle
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
