/**
 * Application constants
 */

// Animation durations (in ms)
export const ANIMATION_DURATION = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Z-index scale
export const Z_INDEX = {
  BACKGROUND: -1,
  DEFAULT: 0,
  DROPDOWN: 10,
  STICKY: 20,
  OVERLAY: 30,
  MODAL: 40,
  POPOVER: 50,
  TOOLTIP: 60,
  TOAST: 70,
  MAXIMUM: 999,
} as const;

// App metadata
export const APP_CONFIG = {
  NAME: 'Cylend',
  DESCRIPTION: 'Privacy-Preserving Credit Infrastructure',
  URL: 'https://cylend.io',
  TWITTER_HANDLE: '@cylend',
} as const;

// Feature flags (can be overridden by env vars)
export const FEATURES = {
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  TIMEOUT: 30000, // 30 seconds
} as const;

// Contract addresses
export const CONTRACTS = {
  INGRESS: process.env.NEXT_PUBLIC_INGRESS_ADDRESS || '',
  CORE: process.env.NEXT_PUBLIC_CORE_ADDRESS || '',
  ISM: process.env.NEXT_PUBLIC_ISM_ADDRESS || '',
  LENDING_PUBLIC_KEY: process.env.NEXT_PUBLIC_LENDING_PUBLIC_KEY || '',
} as const;

// Token addresses
export const TOKENS = {
  WMNT: process.env.NEXT_PUBLIC_WMNT_ADDRESS || '',
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '',
} as const;

// Token configuration
export type TokenType = 'native' | 'wmnt' | 'usdc' | 'usdt';

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isNative: boolean;
  icon?: string;
}

export const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  native: {
    symbol: 'MNT',
    name: 'Mantle',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    isNative: true,
    icon: '/mantle-mnt-logo.png',
  },
  wmnt: {
    symbol: 'WMNT',
    name: 'Wrapped Mantle',
    address: TOKENS.WMNT,
    decimals: 18,
    isNative: false,
    icon: '/mantle-mnt-logo.png',
  },
  usdc: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: TOKENS.USDC,
    decimals: 6,
    isNative: false,
    icon: '/usd-coin-usdc-logo.png',
  },
  usdt: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: TOKENS.USDT,
    decimals: 6,
    isNative: false,
    icon: '/tether-usdt-logo.png',
  },
} as const;

// Helper to get token config
export function getTokenConfig(tokenType: TokenType): TokenConfig {
  return TOKEN_CONFIGS[tokenType];
}

// Helper to get token address
export function getTokenAddress(tokenType: TokenType): string {
  return TOKEN_CONFIGS[tokenType].address;
}

// Helper to get token decimals
export function getTokenDecimals(tokenType: TokenType): number {
  return TOKEN_CONFIGS[tokenType].decimals;
}
