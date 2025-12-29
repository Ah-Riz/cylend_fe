"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, formatUnits, toHex, type Address, type Hex } from "viem";
import { CONTRACTS, getTokenAddress, getTokenDecimals, type TokenType } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// ABI untuk PrivateLendingIngress
const INGRESS_ABI = [
  {
    inputs: [],
    name: "depositNative",
    outputs: [{ internalType: "bytes32", name: "depositId", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "depositErc20",
    outputs: [{ internalType: "bytes32", name: "depositId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint32", name: "destinationDomain", type: "uint32" },
      { internalType: "bytes32", name: "depositId", type: "bytes32" },
      { internalType: "bytes", name: "ciphertext", type: "bytes" },
    ],
    name: "submitAction",
    outputs: [{ internalType: "bytes32", name: "actionId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "deposits",
    outputs: [
      { internalType: "address", name: "depositor", type: "address" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bool", name: "isNative", type: "bool" },
      { internalType: "bool", name: "released", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "ciphertextHashToActionId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "depositUsed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "depositId", type: "bytes32" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdrawUnused",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Sapphire domain ID
const SAPPHIRE_DOMAIN = 23295;

/**
 * Hook untuk deposit native (MNT)
 */
export function useDepositNative() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (amount: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!CONTRACTS.INGRESS) {
      toast({
        title: "Contract not configured",
        description: "Ingress address not set.",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseUnits(amount, 18); // MNT has 18 decimals

      writeContract({
        address: CONTRACTS.INGRESS as Address,
        abi: INGRESS_ABI,
        functionName: "depositNative",
        value: amountWei,
      });
    } catch (err) {
      console.error("Deposit native error:", err);
      toast({
        title: "Transaction failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook untuk deposit ERC20 token
 * Note: Approval harus dilakukan terlebih dahulu menggunakan useERC20ApprovalFlow
 */
export function useDepositErc20() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (tokenType: TokenType, amount: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!CONTRACTS.INGRESS) {
      toast({
        title: "Contract not configured",
        description: "Ingress address not set.",
        variant: "destructive",
      });
      return;
    }

    const tokenAddress = getTokenAddress(tokenType);
    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      toast({
        title: "Invalid token",
        description: "Token address not configured.",
        variant: "destructive",
      });
      return;
    }

    try {
      const decimals = getTokenDecimals(tokenType);
      const amountWei = parseUnits(amount, decimals);

      writeContract({
        address: CONTRACTS.INGRESS as Address,
        abi: INGRESS_ABI,
        functionName: "depositErc20",
        args: [tokenAddress as Address, amountWei],
      });
    } catch (err) {
      console.error("Deposit ERC20 error:", err);
      toast({
        title: "Transaction failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook untuk submit encrypted action
 */
export function useSubmitAction() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitAction = async (
    depositId: string,
    ciphertext: Uint8Array | Hex
  ) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!CONTRACTS.INGRESS) {
      toast({
        title: "Contract not configured",
        description: "Ingress address not set.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Viem expects bytes as hex string. Convert Uint8Array to hex if needed.
      const ciphertextHex =
        typeof ciphertext === "string"
          ? (ciphertext as Hex)
          : (toHex(ciphertext as Uint8Array) as Hex);

      writeContract({
        address: CONTRACTS.INGRESS as Address,
        abi: INGRESS_ABI,
        functionName: "submitAction",
        args: [
          SAPPHIRE_DOMAIN,
          depositId as Hex,
          ciphertextHex,
        ],
      });
    } catch (err) {
      console.error("Submit action error:", err);
      toast({
        title: "Transaction failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return {
    submitAction,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook untuk withdraw unused bucket funds langsung dari Ingress (Mantle)
 * @param amount - Amount to withdraw. If 0 or not provided, withdraws full amount.
 */
export function useWithdrawUnused() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdrawUnused = async (depositId: string, amount?: bigint) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!CONTRACTS.INGRESS) {
      toast({
        title: "Contract not configured",
        description: "Ingress address not set.",
        variant: "destructive",
      });
      return;
    }

    if (!depositId) {
      toast({
        title: "No deposit selected",
        description: "Select a deposit to withdraw from.",
        variant: "destructive",
      });
      return;
    }

    try {
      // If amount is not provided or 0, contract will withdraw full amount
      const withdrawAmount = amount || 0n;
      
      writeContract({
        address: CONTRACTS.INGRESS as Address,
        abi: INGRESS_ABI,
        functionName: "withdrawUnused",
        args: [depositId as Hex, withdrawAmount],
      });
    } catch (err) {
      console.error("Withdraw unused error:", err);
      toast({
        title: "Withdrawal failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return {
    withdrawUnused,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook untuk get deposit info
 */
export function useGetDeposit(depositId: string | null) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.INGRESS as Address,
    abi: INGRESS_ABI,
    functionName: "deposits",
    args: depositId ? [depositId as Hex] : undefined,
    query: {
      enabled: !!depositId && !!CONTRACTS.INGRESS,
    },
  });

  return {
    deposit: data
      ? {
          depositor: data[0] as Address,
          token: data[1] as Address,
          amount: data[2] as bigint,
          isNative: data[3] as boolean,
          released: data[4] as boolean,
        }
      : null,
    isLoading,
    error,
  };
}

/**
 * Hook untuk check if deposit has been used in submitAction
 */
export function useDepositUsed(depositId: string | null) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.INGRESS as Address,
    abi: INGRESS_ABI,
    functionName: "depositUsed",
    args: depositId ? [depositId as Hex] : undefined,
    query: {
      enabled: !!depositId && !!CONTRACTS.INGRESS,
    },
  });

  return {
    depositUsed: data ?? false,
    isLoading,
    error,
  };
}

