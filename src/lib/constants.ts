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
