/**
 * Global type definitions for Cylend FE
 */

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Animation types
export interface AnimationProps {
  duration?: number;
  delay?: number;
  easing?: string;
}

// Crypto/DeFi specific types
export interface LendingPosition {
  id: string;
  lender: string;
  amount: bigint;
  apy: number;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'liquidated';
}

export interface CreditRequest {
  id: string;
  borrower: string;
  amount: bigint;
  collateral: bigint;
  terms: CreditTerms;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'repaid';
}

export interface CreditTerms {
  interestRate: number;
  duration: number; // in days
  collateralRatio: number;
  repaymentSchedule: 'bullet' | 'amortized' | 'interest-only';
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncState<T> = {
  data: Nullable<T>;
  loading: boolean;
  error: Nullable<Error>;
};
