"use client";

import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import { sapphireTestnet, mantleSepoliaTestnet } from "wagmi/chains";

/**
 * Custom hook untuk wallet operations
 */
export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const switchToMantle = () => {
    switchChain({ chainId: mantleSepoliaTestnet.id });
  };

  const switchToSapphire = () => {
    switchChain({ chainId: sapphireTestnet.id });
  };

  const isMantle = chainId === mantleSepoliaTestnet.id;
  const isSapphire = chainId === sapphireTestnet.id;

  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    isMantle,
    isSapphire,
    disconnect,
    switchToMantle,
    switchToSapphire,
  };
}

