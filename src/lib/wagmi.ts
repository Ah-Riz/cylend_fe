import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sapphireTestnet, mantleSepoliaTestnet } from 'wagmi/chains';
import { WALLETCONNECT_PROJECT_ID } from "@/config"

export const chains = [mantleSepoliaTestnet, sapphireTestnet];

// Minimal wagmi config (no WalletConnect) to avoid bundling walletconnect logger tests on server
export const config = getDefaultConfig({
  appName: "Cylend",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [mantleSepoliaTestnet],
  ssr: false,
});
