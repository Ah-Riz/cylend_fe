/**
 * Ponder GraphQL API client
 */

const PONDER_API_URL = process.env.NEXT_PUBLIC_PONDER_API_URL || 'http://localhost:42069/graphql';

export interface PonderDeposit {
  depositId: string;
  depositor: string;
  token: string;
  initialAmount: string;
  remainingAmount: string;
  isNative: boolean;
  released: boolean;
  createdAt: number;
  lastUsedAt?: number | null;
}

export interface PonderAction {
  actionId: string;
  depositId: string;
  user: string;
  actionType: number;
  status: string;
  encryptedDataHash?: string | null;
  createdAt: number;
  processedAt?: number | null;
  originDomain?: number | null;
  originRouter?: string | null;
  deposit?: {
    token: string;
    isNative: boolean;
  } | null;
}

export interface PonderPosition {
  user: string;
  token: string;
  positionHash: string;
  updatedAt: number;
}

export interface PonderLiquidity {
  token: string;
  totalDeposited: string;
  totalReserved: string;
  totalBorrowed: string;
  updatedAt: number;
}

export interface PonderPrice {
  token: string;
  price: string;
  timestamp: number;
  updatedAt: number;
}

/**
 * GraphQL query helper
 */
async function query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const response = await fetch(PONDER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL query failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

/**
 * Get all deposits
 */
export async function getDeposits(where?: {
  depositor?: string;
  released?: boolean;
  token?: string;
}): Promise<PonderDeposit[]> {
  const whereClause = where
    ? `where: {
        ${where.depositor ? `depositor: "${where.depositor}",` : ''}
        ${where.released !== undefined ? `released: ${where.released},` : ''}
        ${where.token ? `token: "${where.token}",` : ''}
      }`
    : '';

  const queryStr = `
    query GetDeposits {
      deposits(${whereClause}) {
        items {
          depositId
          depositor
          token
          initialAmount
          remainingAmount
          isNative
          released
          createdAt
          lastUsedAt
        }
        totalCount
      }
    }
  `;

  const data = await query<{ deposits: { items: PonderDeposit[]; totalCount: number } }>(queryStr);
  return data.deposits.items;
}

/**
 * Get single deposit by ID
 */
export async function getDeposit(depositId: string): Promise<PonderDeposit | null> {
  const queryStr = `
    query GetDeposit($depositId: String!) {
      deposit(depositId: $depositId) {
        depositId
        depositor
        token
        initialAmount
        remainingAmount
        isNative
        released
        createdAt
        lastUsedAt
      }
    }
  `;

  const data = await query<{ deposit: PonderDeposit | null }>(queryStr, { depositId });
  return data.deposit;
}

/**
 * Get actions by deposit ID
 */
export async function getActionsByDeposit(depositId: string): Promise<PonderAction[]> {
  const queryStr = `
    query GetActionsByDeposit($depositId: String!) {
      actions(where: { depositId: $depositId }) {
        items {
          actionId
          depositId
          user
          actionType
          status
          encryptedDataHash
          createdAt
          processedAt
          originDomain
          originRouter
        }
        totalCount
      }
    }
  `;

  const data = await query<{ actions: { items: PonderAction[]; totalCount: number } }>(
    queryStr,
    { depositId }
  );
  return data.actions.items;
}

/**
 * Get actions by user with deposit info
 */
export async function getActionsByUser(user: string): Promise<PonderAction[]> {
  const queryStr = `
    query GetActionsByUser($user: String!) {
      actions(where: { user: $user }) {
        items {
          actionId
          depositId
          user
          actionType
          status
          createdAt
          processedAt
          originDomain
          originRouter
          deposit {
            token
            isNative
          }
        }
        totalCount
      }
    }
  `;

  const data = await query<{ actions: { items: any[]; totalCount: number } }>(
    queryStr,
    { user }
  );
  return data.actions.items;
}

/**
 * Get single action by ID
 */
export async function getAction(actionId: string): Promise<PonderAction | null> {
  const queryStr = `
    query GetAction($actionId: String!) {
      action(actionId: $actionId) {
        actionId
        depositId
        user
        actionType
        status
        encryptedDataHash
        createdAt
        processedAt
        originDomain
        originRouter
      }
    }
  `;

  const data = await query<{ action: PonderAction | null }>(queryStr, { actionId });
  return data.action;
}

/**
 * Get liquidity info for a token
 */
export async function getLiquidity(token: string): Promise<PonderLiquidity | null> {
  const queryStr = `
    query GetLiquidity($token: String!) {
      liquidity(token: $token) {
        token
        totalDeposited
        totalReserved
        totalBorrowed
        updatedAt
      }
    }
  `;

  const data = await query<{ liquidity: PonderLiquidity | null }>(queryStr, { token });
  return data.liquidity;
}

/**
 * Get price for a token
 */
export async function getPrice(token: string): Promise<PonderPrice | null> {
  const queryStr = `
    query GetPrice($token: String!) {
      price(token: $token) {
        token
        price
        timestamp
        updatedAt
      }
    }
  `;

  const data = await query<{ price: PonderPrice | null }>(queryStr, { token });
  return data.price;
}

