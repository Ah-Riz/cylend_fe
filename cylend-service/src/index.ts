/**
 * Cylend Action Processor Service
 * 
 * Monitors pending actions from Ponder and processes them on Sapphire LendingCore
 */

import { config } from './config.js';
import { getPendingActions, isActionPending } from './monitor.js';
import { processActionWithRetry } from './processor.js';
import type { Hex } from 'viem';

// Track processed actions to avoid duplicates
const processedActions = new Set<string>();
// Track actions currently being processed (lock mechanism)
const processingActions = new Set<string>();

/**
 * Main processing loop
 */
async function processPendingActions() {
  // Prevent concurrent execution
  if (processingActions.size > 0) {
    console.log(`[Monitor] Previous batch still processing, skipping...`);
    return;
  }

  try {
    console.log(`[Monitor] Checking for pending actions...`);

    const pendingActions = await getPendingActions();

    if (pendingActions.length === 0) {
      console.log(`[Monitor] No pending actions found`);
      return;
    }

    console.log(`[Monitor] Found ${pendingActions.length} pending action(s)`);

    for (const action of pendingActions) {
      const actionId = action.actionId as Hex;

      // Skip if already processed in this session
      if (processedActions.has(actionId)) {
        console.log(`[Monitor] Action ${actionId} already processed in this session, skipping`);
        continue;
      }

      // Skip if currently being processed
      if (processingActions.has(actionId)) {
        console.log(`[Monitor] Action ${actionId} is currently being processed, skipping`);
        continue;
      }

      // Double-check action is still pending
      const stillPending = await isActionPending(actionId);
      if (!stillPending) {
        console.log(`[Monitor] Action ${actionId} is no longer pending, skipping`);
        processedActions.add(actionId); // Mark as processed to avoid re-checking
        continue;
      }

      // Mark as processing
      processingActions.add(actionId);

      console.log(`[Monitor] Processing action: ${actionId}`);
      console.log(`[Monitor]   - Deposit ID: ${action.depositId}`);
      console.log(`[Monitor]   - User: ${action.user}`);
      console.log(`[Monitor]   - Action Type: ${action.actionType}`);

      try {
        // Process action with retry
        const result = await processActionWithRetry(actionId);

        if (result.success) {
          console.log(`[Monitor] ✅ Successfully processed action ${actionId}`);
          processedActions.add(actionId);
          // Keep in processedActions for 5 minutes to avoid re-processing
          setTimeout(() => {
            processedActions.delete(actionId);
          }, 5 * 60 * 1000);
        } else {
          console.error(`[Monitor] ❌ Failed to process action ${actionId}: ${result.error}`);
          // Don't add to processedActions, allow retry in next poll
        }
      } finally {
        // Always remove from processing set
        processingActions.delete(actionId);
      }
    }
  } catch (error) {
    console.error(`[Monitor] Error in processing loop:`, error);
  } finally {
    // Clear processing set in case of error
    processingActions.clear();
  }
}

/**
 * Start the service
 */
function start() {
  console.log('🚀 Cylend Action Processor Service starting...');
  console.log(`[Config] Ponder API: ${config.ponderApiUrl}`);
  console.log(`[Config] Sapphire RPC: ${config.sapphireRpcUrl}`);
  console.log(`[Config] Core Address: ${config.coreAddress}`);
  console.log(`[Config] Poll Interval: ${config.pollInterval}ms`);

  // Process immediately on start
  processPendingActions();

  // Then process every pollInterval
  setInterval(() => {
    processPendingActions();
  }, config.pollInterval);

  console.log(`✅ Service started. Polling every ${config.pollInterval}ms`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down service...');
  process.exit(0);
});

// Start the service
start();

