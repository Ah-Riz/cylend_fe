import { createConfig } from "ponder";

import { PrivateLendingIngressAbi } from "./abis/PrivateLendingIngressAbi";
import { LendingCoreAbi } from "./abis/LendingCoreAbi";

export default createConfig({
  chains: {
    mantleSepolia: {
      id: 5003,
      rpc: process.env.PONDER_RPC_URL_MANTLE_SEPOLIA || process.env.MANTLE_SEPOLIA_RPC || "https://rpc.sepolia.mantle.xyz",
      ethGetLogsBlockRange: 100,
    },
    sapphireTestnet: {
      id: 23295,
      rpc: process.env.PONDER_RPC_URL_SAPPHIRE_TESTNET || process.env.SAPPHIRE_TESTNET_RPC || "https://oasis-sapphire-testnet.core.chainstack.com/2e3442bd8c763c2666d4fb5a93f27d2c",
      ethGetLogsBlockRange: 100,
    },
  },
  contracts: {
    PrivateLendingIngress: {
      chain: "mantleSepolia",
      abi: PrivateLendingIngressAbi,
      address: (process.env.NEXT_PUBLIC_INGRESS_ADDRESS || process.env.INGRESS_ADDRESS || "0xe1E911145f2bF1018d1Fb04DE2DAc8A414D82235") as `0x${string}`,
      startBlock: 32355286, // TODO: Set to actual deployment block
    },
    LendingCore: {
      chain: "sapphireTestnet",
      abi: LendingCoreAbi,
      address: (process.env.NEXT_PUBLIC_CORE_ADDRESS || process.env.CORE_ADDRESS || "0xeE848eA7DDbf1e08E8f67caEfeDe9539aF08524A") as `0x${string}`,
      startBlock: 14902992, // TODO: Set to actual deployment block
    },
  },
});
