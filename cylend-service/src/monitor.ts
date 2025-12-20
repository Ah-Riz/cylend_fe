/**
 * Monitor pending actions from Ponder GraphQL API
 */

import { config } from './config.js';

export interface PonderAction {
  actionId: string;
  depositId: string;
  user: string;
  actionType: number;
  status: string;
  createdAt: number;
  processedAt?: number | null;
}

/**
 * Query pending actions from Ponder GraphQL API
 */
export async function getPendingActions(): Promise<PonderAction[]> {
  const query = `
    query GetPendingActions {
      actions(where: { status: "pending" }) {
        items {
          actionId
          depositId
          user
          actionType
          status
          createdAt
          processedAt
        }
        totalCount
      }
    }
  `;

  try {
    const response = await fetch(config.ponderApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      errors?: Array<{ message: string }>;
      data?: {
        actions: {
          items: PonderAction[];
          totalCount: number;
        };
      };
    };

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data?.actions.items || [];
  } catch (error) {
    console.error('Failed to fetch pending actions:', error);
    throw error;
  }
}

/**
 * Check if action is still pending
 */
export async function isActionPending(actionId: string): Promise<boolean> {
  const query = `
    query GetAction($actionId: String!) {
      action(actionId: $actionId) {
        actionId
        status
      }
    }
  `;

  try {
    const response = await fetch(config.ponderApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { actionId },
      }),
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as {
      errors?: Array<{ message: string }>;
      data?: {
        action: {
          actionId: string;
          status: string;
        } | null;
      };
    };
    const action = result.data?.action;

    return action?.status === 'pending';
  } catch (error) {
    console.error(`Failed to check action ${actionId}:`, error);
    return false;
  }
}

