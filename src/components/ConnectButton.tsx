"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();

  return (
    <div className="flex items-center gap-4">
      {isConnected && (
        <div className="text-sm text-muted-foreground">
          {/* Connected to {chain?.name} ({address?.slice(0, 6)}...{address?.slice(-4)}) */}
        </div>
      )}
      <ConnectButton />
    </div>
  );
}

