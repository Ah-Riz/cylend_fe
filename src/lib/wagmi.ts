import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { coinbaseWallet } from 'wagmi/connectors';
import { sapphireTestnet, mantleSepoliaTestnet } from 'wagmi/chains';

// Minimal wagmi config (no WalletConnect) to avoid bundling walletconnect logger tests on server
export const config = createConfig({
  chains: [mantleSepoliaTestnet, sapphireTestnet],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Cylend' }),
  ],
  transports: {
    [mantleSepoliaTestnet.id]: http(),
    [sapphireTestnet.id]: http(),
  },
  ssr: false,
});

export const chains = [mantleSepoliaTestnet, sapphireTestnet];

