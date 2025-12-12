"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Shield, Wallet } from "lucide-react";
import {
  useConnection,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useAccount,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useToast } from "@/hooks/use-toast";
import { mantle, mantleSepoliaTestnet } from "wagmi/chains";
import React from "react";

export function AppTopBar() {
  const { address, isConnected } = useConnection();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { chain } = useAccount();

  // Get network name from the actual connected chain
  const networkName = chain?.name || "Unknown";

  // Check if user is on an unsupported network and auto-switch
  React.useEffect(() => {
    if (isConnected && chainId !== mantle.id && chainId !== mantleSepoliaTestnet.id) {
      toast({
        title: "Unsupported Network",
        description: "Switching to Mantle network...",
        variant: "destructive",
      });
      switchChain({ chainId: mantle.id });
    }
  }, [chainId, isConnected, switchChain, toast]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

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
        {isConnected && (
          <Badge variant="secondary" className="font-normal hidden md:flex">
            {networkName}
          </Badge>
        )}

        {/* Privacy status - compact on mobile */}
        <Badge variant="default" className="bg-primary/10 text-primary border-primary/30 font-normal">
          <Shield className="h-3 w-3 md:mr-1" />
          <span className="hidden md:inline">Privacy: Always On</span>
        </Badge>

        {/* Wallet - compact on mobile */}
        {isConnected ? (
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline font-mono text-xs md:text-sm">{formatAddress(address!)}</span>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => { disconnect(); toast({ title: "Disconnected", description: "You have been disconnected successfully." }); }}>
              Disconnect
            </Button>
          </div>
        ) : (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button variant="outline" size="sm" className="px-2 md:px-3 cursor-pointer" onClick={openConnectModal}>
                <Wallet className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Connect</span>
              </Button>
            )}
          </ConnectButton.Custom>
        )}
      </div>
    </header>
  );
}
