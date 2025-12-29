/**
 * Ponder GraphQL API client
 */

const PONDER_API_URL = process.env.NEXT_PUBLIC_PONDER_API_URL;

function getPonderApiUrl(): string | undefined {
  if (!PONDER_API_URL) return undefined;
  if (typeof window === "undefined") return PONDER_API_URL;

  try {
    const url = new URL(PONDER_API_URL);
    if (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      return undefined;
    }
  } catch {
    // Fall through to returning the raw env value.
  }

  return PONDER_API_URL;
}

const PONDER_DISABLE_DURATION_MS = 30_000;
let ponderDisabledUntil = 0;

function canUsePonderApi(): boolean {
  return Date.now() >= ponderDisabledUntil && !!getPonderApiUrl();
}

function disablePonderTemporarily() {
  ponderDisabledUntil = Date.now() + PONDER_DISABLE_DURATION_MS;
}

function isPonderNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof Error && /failed to fetch|network|connection refused/i.test(err.message)) return true;
  return false;
}

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
  const apiUrl = getPonderApiUrl();
  if (!apiUrl) {
    throw new Error("Ponder API URL is not configured (NEXT_PUBLIC_PONDER_API_URL)." );
  }

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
  } catch (err) {
    if (isPonderNetworkError(err)) {
      disablePonderTemporarily();
    }
    throw err;
  }

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
  if (!canUsePonderApi()) return [];

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

  try {
    const data = await query<{ deposits: { items: PonderDeposit[]; totalCount: number } }>(queryStr);
    return data.deposits.items;
  } catch (err) {
    if (isPonderNetworkError(err)) return [];
    throw err;
  }
}

/**
 * Get single deposit by ID
 */
export async function getDeposit(depositId: string): Promise<PonderDeposit | null> {
  if (!canUsePonderApi()) return null;

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

  try {
    const data = await query<{ deposit: PonderDeposit | null }>(queryStr, { depositId });
    return data.deposit;
  } catch (err) {
    if (isPonderNetworkError(err)) return null;
    throw err;
  }
}

/**
 * Get actions by deposit ID
 */
export async function getActionsByDeposit(depositId: string): Promise<PonderAction[]> {
  if (!canUsePonderApi()) return [];

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

  try {
    const data = await query<{ actions: { items: PonderAction[]; totalCount: number } }>(
      queryStr,
      { depositId }
    );
    return data.actions.items;
  } catch (err) {
    if (isPonderNetworkError(err)) return [];
    throw err;
  }
}

/**
 * Get actions by user with deposit info
 */
export async function getActionsByUser(user: string): Promise<PonderAction[]> {
  if (!canUsePonderApi()) return [];

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

  try {
    const data = await query<{ actions: { items: any[]; totalCount: number } }>(
      queryStr,
      { user }
    );
    return data.actions.items;
  } catch (err) {
    if (isPonderNetworkError(err)) return [];
    throw err;
  }
}

/**
 * Get single action by ID
 */
export async function getAction(actionId: string): Promise<PonderAction | null> {
  if (!canUsePonderApi()) return null;

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

  try {
    const data = await query<{ action: PonderAction | null }>(queryStr, { actionId });
    return data.action;
  } catch (err) {
    if (isPonderNetworkError(err)) return null;
    throw err;
  }
}

/**
 * Get liquidity info for a token
 */
export async function getLiquidity(token: string): Promise<PonderLiquidity | null> {
  if (!canUsePonderApi()) return null;

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

  try {
    const data = await query<{ liquidity: PonderLiquidity | null }>(queryStr, { token });
    return data.liquidity;
  } catch (err) {
    if (isPonderNetworkError(err)) return null;
    throw err;
  }
}

/**
 * Get price for a token
 */
export async function getPrice(token: string): Promise<PonderPrice | null> {
  if (!canUsePonderApi()) return null;

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

  try {
    const data = await query<{ price: PonderPrice | null }>(queryStr, { token });
    return data.price;
  } catch (err) {
    if (isPonderNetworkError(err)) return null;
    throw err;
  }
}

