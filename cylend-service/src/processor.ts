/**
 * Process actions on Sapphire LendingCore
 */

import { createWalletClient, createPublicClient, http, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sapphireTestnet } from 'viem/chains';
import { config } from './config.js';
import { LendingCoreAbi } from '../abis/LendingCoreAbi.js';

// Create clients once for reuse
const account = privateKeyToAccount(config.ownerPrivateKey);
const walletClient = createWalletClient({
  account,
  chain: sapphireTestnet,
  transport: http(config.sapphireRpcUrl),
});
const publicClient = createPublicClient({
  chain: sapphireTestnet,
  transport: http(config.sapphireRpcUrl),
});

/**
 * Check if action is already processed on-chain
 */
async function isActionProcessedOnChain(actionId: Hex): Promise<boolean> {
  try {
    const actionData = await publicClient.readContract({
      address: config.coreAddress,
      abi: LendingCoreAbi,
      functionName: 'encryptedActions',
      args: [actionId],
    });

    return actionData.processed === true;
  } catch (error) {
    console.error(`[Processor] Failed to check on-chain status for ${actionId}:`, error);
    return false; // Assume not processed if check fails
  }
}

/**
 * Process a single action on LendingCore
 */
export async function processAction(actionId: Hex): Promise<{ success: boolean; txHash?: Hex; error?: string }> {
  try {
    // Check if already processed on-chain before sending transaction
    const alreadyProcessed = await isActionProcessedOnChain(actionId);
    if (alreadyProcessed) {
      console.log(`[Processor] Action ${actionId} already processed on-chain, skipping`);
      return { success: true }; // Return success since it's already done
    }

    console.log(`[Processor] Processing action: ${actionId}`);
    console.log(`[Processor] Account: ${account.address}`);
    console.log(`[Processor] Core Address: ${config.coreAddress}`);

    // Call processAction
    const hash = await walletClient.writeContract({
      address: config.coreAddress,
      abi: LendingCoreAbi,
      functionName: 'processAction',
      args: [actionId],
      value: 0n,
    });

    console.log(`[Processor] Transaction sent: ${hash}`);

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`[Processor] ✅ Action processed successfully: ${actionId}`);
      return { success: true, txHash: hash };
    } else {
      console.error(`[Processor] ❌ Transaction failed: ${hash}`);
      return { success: false, error: 'Transaction reverted' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if error is "duplicate transaction" or "already processed"
    if (errorMessage.includes('duplicate') || errorMessage.includes('already processed')) {
      console.log(`[Processor] Action ${actionId} already processed (duplicate transaction), treating as success`);
      return { success: true };
    }
    
    console.error(`[Processor] ❌ Failed to process action ${actionId}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Process action with retry logic
 */
export async function processActionWithRetry(
  actionId: Hex,
  maxRetries: number = config.maxRetries,
  delay: number = config.retryDelay
): Promise<{ success: boolean; txHash?: Hex; error?: string }> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Check if already processed before retry
    const alreadyProcessed = await isActionProcessedOnChain(actionId);
    if (alreadyProcessed) {
      console.log(`[Processor] Action ${actionId} already processed on-chain, skipping retry`);
      return { success: true };
    }

    console.log(`[Processor] Attempt ${attempt}/${maxRetries} for action ${actionId}`);

    const result = await processAction(actionId);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    // Don't retry if it's a duplicate transaction error
    if (lastError?.includes('duplicate')) {
      console.log(`[Processor] Duplicate transaction detected, treating as success`);
      return { success: true };
    }

    if (attempt < maxRetries) {
      const waitTime = delay * attempt; // Exponential backoff
      console.log(`[Processor] Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  console.error(`[Processor] ❌ Failed after ${maxRetries} attempts: ${actionId}`);
  return { success: false, error: lastError || 'Max retries exceeded' };
}

