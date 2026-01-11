"use client";

import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

const RainbowConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((m) => m.ConnectButton),
  { ssr: false },
);

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center gap-4">
      {mounted && isConnected && (
        <div className="text-sm text-muted-foreground">
          {/* Connected to {chain?.name} ({address?.slice(0, 6)}...{address?.slice(-4)}) */}
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
