"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ConnectWallet } from "@/components/ConnectButton";
import { useChainId } from "wagmi";
import { sapphireTestnet, mantleSepoliaTestnet } from "wagmi/chains";
import { usePools } from "@/hooks/usePools";

export function AppTopBar() {
  const chainId = useChainId();
  const { data: pools } = usePools();

  const totalTVP = useMemo(() => {
    if (!pools) return 0;
    return pools.reduce((acc, pool) => {
      const amount = parseFloat(pool.tvpFormatted.replace(/,/g, ''));
      // If price is not available, assume 1 (e.g. for stablecoins/testing) or use actual price if we had it.
      // pool.priceFormatted is derived via formatTokenAmount using token decimals.
      // If priceFormatted is null, we can't calculate USD value accurately.
      // However, for hackathon context, we might default to 1 for stables or 0.
      // Let's fallback to 0 if no price.
      const price = pool.priceFormatted ? parseFloat(pool.priceFormatted.replace(/,/g, '')) : 0;
      return acc + (amount * price);
    }, 0);
  }, [pools]);

  const formattedTVP = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(totalTVP);

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
            TVP: <span className="font-mono text-foreground">{formattedTVP}</span>
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
