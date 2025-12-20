/**
 * Configuration for Action Processor Service
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Ponder API
  ponderApiUrl: process.env.PONDER_API_URL || 'http://localhost:42069/graphql',
  
  // Sapphire RPC
  sapphireRpcUrl: process.env.SAPPHIRE_RPC_URL || 'https://testnet.sapphire.oasis.io',
  
  // LendingCore Contract
  coreAddress: process.env.CORE_ADDRESS as `0x${string}`,
  
  // Owner Private Key (untuk call processAction)
  ownerPrivateKey: process.env.OWNER_PRIVATE_KEY as `0x${string}`,
  
  // Polling interval (ms)
  pollInterval: parseInt(process.env.POLL_INTERVAL || '10000', 10),
  
  // Retry config
  maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.RETRY_DELAY || '5000', 10),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

// Validation
if (!config.coreAddress) {
  throw new Error('CORE_ADDRESS environment variable is required');
}

if (!config.ownerPrivateKey) {
  throw new Error('OWNER_PRIVATE_KEY environment variable is required');
}

