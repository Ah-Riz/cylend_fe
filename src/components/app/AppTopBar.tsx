"use client";

import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ConnectWallet } from "@/components/ConnectButton";
import { useChainId } from "wagmi";
// import { mantleSepolia, sapphireTestnet } from "@/lib/wagmi";
import { sapphireTestnet, mantleSepoliaTestnet } from "wagmi/chains";

export function AppTopBar() {
  const chainId = useChainId();

  const getChainName = () => {
    if (chainId === mantleSepoliaTestnet.id) return 'Mantle';
    if (chainId === sapphireTestnet.id) return 'Sapphire';
    return 'Unknown';
  };

  return (
    <header className="relative z-30 h-14 md:h-16 border-b border-border flex items-center">
      <div className="mx-auto w-full max-w-7xl px-3 md:px-6 lg:px-8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-4">
          <SidebarTrigger className="h-9 w-9 md:h-10 md:w-10" />
          <div className="hidden md:block text-sm text-muted-foreground">
            TVP: <span className="font-mono text-foreground">$2.45M</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Network - hidden on small screens */}
          <Badge variant="secondary" className="font-normal hidden md:flex">
            {getChainName()}
          </Badge>

          {/* Privacy status - compact on mobile */}
          <Badge variant="default" className="bg-primary/10 text-primary border-primary/30 font-normal text-xs md:text-sm">
            <span className="hidden sm:inline">Privacy: Always On</span>
            <span className="sm:hidden">Privacy On</span>
          </Badge>

          {/* Wallet Connect Button */}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
