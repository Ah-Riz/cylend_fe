"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center gap-4">
      {/* Skeleton / Loading State */}
      {!mounted ? (
        <Button variant="outline" size="sm" className="px-2 md:px-3 opacity-50 pointer-events-none">
          <Wallet className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline">Connect</span>
        </Button>
      ) : (
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== "loading";
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus || authenticationStatus === "authenticated");

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 md:px-3 cursor-pointer"
                        onClick={openConnectModal}
                      >
                        <Wallet className="h-4 w-4 md:mr-2" />
                        <span className="hidden sm:inline">Connect</span>
                      </Button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={openChainModal}
                      >
                        Wrong network
                      </Button>
                    );
                  }

                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAccountModal}
                    >
                      {account.displayName}
                    </Button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      )}
    </div>
  );
}
