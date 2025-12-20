# GraphQL API Examples

Ponder otomatis generate GraphQL API dari schema. Akses di `http://localhost:42069/graphql` saat dev server running.

## Query Examples

### 1. Get All Deposits

**Using Pagination Pattern:**
```graphql
query GetDeposits {
  deposits {
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
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
```

**Or query single deposit by ID:**
```graphql
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
```

### 2. Get Deposits by User

```graphql
query GetUserDeposits($depositor: String!) {
  deposits(where: { depositor: $depositor }) {
    items {
      depositId
      token
      initialAmount
      remainingAmount
      isNative
      released
      createdAt
    }
    totalCount
  }
}
```

### 3. Get Active Deposits (Not Released)

```graphql
query GetActiveDeposits {
  deposits(where: { released: false }) {
    items {
      depositId
      depositor
      token
      remainingAmount
      createdAt
    }
    totalCount
  }
}
```

### 4. Get Actions by Deposit

**Option 1: Query deposit with nested actions (using relations):**
```graphql
query GetDepositWithActions($depositId: String!) {
  deposit(depositId: $depositId) {
    depositId
    remainingAmount
    actions {
      items {
        actionId
        actionType
        status
        user
        createdAt
        processedAt
      }
    }
  }
}
```

**Option 2: Query actions directly:**
```graphql
query GetActionsByDeposit($depositId: String!) {
  actions(where: { depositId: $depositId }) {
    items {
      actionId
      actionType
      status
      user
      createdAt
      processedAt
    }
    totalCount
  }
}
```

### 5. Get Pending Actions

```graphql
query GetPendingActions {
  actions(where: { status: "pending" }) {
    items {
      actionId
      depositId
      user
      actionType
      createdAt
    }
    totalCount
  }
}
```

### 6. Get User Positions

```graphql
query GetUserPositions($user: String!) {
  positions(where: { user: $user }) {
    items {
      user
      token
      positionHash
      updatedAt
    }
    totalCount
  }
}
```

### 7. Get Liquidity Info

**Query single liquidity by token:**
```graphql
query GetLiquidity($token: String!) {
  liquidity(token: $token) {
    token
    totalDeposited
    totalReserved
    totalBorrowed
    updatedAt
  }
}
```

**Or query all liquidity:**
```graphql
query GetAllLiquidity {
  liquiditys {
    items {
      token
      totalDeposited
      totalReserved
      totalBorrowed
      updatedAt
    }
    totalCount
  }
}
```

### 8. Get All Token Prices

```graphql
query GetPrices {
  prices {
    items {
      token
      price
      timestamp
      updatedAt
    }
    totalCount
  }
}
```

### 9. Get Price for Token

```graphql
query GetTokenPrice($token: String!) {
  price(token: $token) {
    token
    price
    timestamp
    updatedAt
  }
}
```

### 10. Complex Query: User Dashboard

```graphql
query GetUserDashboard($user: String!) {
  # User deposits
  deposits(where: { depositor: $user }) {
    items {
      depositId
      token
      initialAmount
      remainingAmount
      isNative
      released
      createdAt
    }
    totalCount
  }
  
  # User positions
  positions(where: { user: $user }) {
    items {
      token
      positionHash
      updatedAt
    }
    totalCount
  }
  
  # User actions
  actions(where: { user: $user }) {
    items {
      actionId
      depositId
      actionType
      status
      createdAt
      processedAt
    }
    totalCount
  }
}
```

### 11. Get Actions with Deposit Info (Using Relations)

```graphql
query GetActionsWithDeposits {
  actions {
    items {
      actionId
      depositId
      user
      actionType
      status
      createdAt
      # Nested query using relations
      deposit {
        token
        remainingAmount
        isNative
      }
    }
    totalCount
  }
}
```

## Using in Frontend

### With fetch

```typescript
const query = `
  query GetUserDeposits($depositor: String!) {
    deposits(where: { depositor: $depositor }) {
      depositId
      token
      remainingAmount
    }
  }
`;

const response = await fetch('http://localhost:42069/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query,
    variables: { depositor: '0x...' },
  }),
});

const { data } = await response.json();
```

### With GraphQL Client (urql/apollo)

```typescript
import { createClient } from '@urql/core';

const client = createClient({
  url: 'http://localhost:42069/graphql',
});

const { data } = await client.query(`
  query GetDeposits {
    deposits {
      depositId
      remainingAmount
    }
  }
`).toPromise();
```

## Subscription (Real-time Updates)

Ponder juga support GraphQL subscriptions untuk real-time updates:

```graphql
subscription WatchDeposits {
  deposits {
    depositId
    remainingAmount
    released
  }
}
```

## Notes

1. **GraphQL API otomatis** - Tidak perlu setup manual, Ponder generate dari schema
2. **Type-safe** - TypeScript types otomatis dari schema
3. **Real-time** - Support subscriptions untuk live updates
4. **Filtering** - Support `where` clause untuk filtering
5. **Relations** - Bisa define relations di schema untuk nested queries

