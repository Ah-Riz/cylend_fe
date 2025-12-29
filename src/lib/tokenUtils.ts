import { formatUnits, parseUnits, type Address } from 'viem';
import { getTokenConfig, getTokenDecimals, type TokenType } from './constants';
export type { TokenType } from './constants';

/**
 * Format token amount to human-readable string
 */
export function formatTokenAmount(
  amount: bigint | string,
  tokenType: TokenType
): string {
  const decimals = getTokenDecimals(tokenType);
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  return formatUnits(amountBigInt, decimals);
}

/**
 * Parse token amount from string to bigint
 */
export function parseTokenAmount(amount: string, tokenType: TokenType): bigint {
  const decimals = getTokenDecimals(tokenType);
  return parseUnits(amount, decimals);
}

/**
 * Get token address for a token type
 */
export function getTokenAddressForType(tokenType: TokenType): Address {
  const config = getTokenConfig(tokenType);
  return config.address as Address;
}

/**
 * Check if token is native
 */
export function isNativeToken(tokenType: TokenType): boolean {
  return getTokenConfig(tokenType).isNative;
}

