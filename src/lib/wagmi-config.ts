import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mantle, mantleSepoliaTestnet } from "wagmi/chains";
import { WALLETCONNECT_PROJECT_ID } from "@/config"

export const config = getDefaultConfig({
  appName: "Cylend",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [mantle, mantleSepoliaTestnet],
  // ssr: true,
});