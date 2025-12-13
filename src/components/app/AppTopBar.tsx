"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Shield, Wallet } from "lucide-react";

export function AppTopBar() {
  return (
    <header className="h-14 md:h-16 border-b border-border flex items-center justify-between px-3 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger />
        <div className="hidden sm:block text-sm text-muted-foreground">
          TVP: <span className="font-mono text-foreground">$17.6M</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Network - hidden on small screens */}
        <Badge variant="secondary" className="font-normal hidden md:flex">
          Mantle
        </Badge>

        {/* Privacy status - compact on mobile */}
        <Badge variant="default" className="bg-primary/10 text-primary border-primary/30 font-normal">
          <Shield className="h-3 w-3 md:mr-1" />
          <span className="hidden md:inline">Privacy: Always On</span>
        </Badge>

        {/* Wallet - compact on mobile */}
        <Button variant="outline" size="sm" className="px-2 md:px-3">
          <Wallet className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline font-mono text-xs md:text-sm">0x742d...9c8a</span>
        </Button>
      </div>
    </header>
  );
}
