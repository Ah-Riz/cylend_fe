"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import {
  useDisconnect,
  useAccount,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useToast } from "@/hooks/use-toast";

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  // Get network name from the actual connected chain
  const networkName = chain?.name || "Unknown";

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-4">
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
  );
}

