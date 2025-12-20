import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sapphireTestnet, mantleSepoliaTestnet } from 'wagmi/chains';

// Wagmi Config dengan RainbowKit
export const config = getDefaultConfig({
  appName: 'Cylend',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [mantleSepoliaTestnet, sapphireTestnet],
  ssr: true, // Enable server-side rendering support
});

// Export chains for use in other files
export const chains = [mantleSepoliaTestnet, sapphireTestnet];

