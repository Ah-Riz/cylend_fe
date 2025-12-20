# GraphQL Quick Start

Ponder GraphQL API menggunakan **Connection Pattern** untuk pagination. Semua list queries mengembalikan `edges` dan `nodes`.

## Basic Pattern

### List Queries (Multiple Results)

**Ponder menggunakan `items` bukan `edges`:**

```graphql
query {
  deposits {
    items {
      depositId
      depositor
      token
      remainingAmount
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
```

### Single Item Queries (By Primary Key)

```graphql
query {
  deposit(depositId: "0x...") {
    depositId
    depositor
    token
    remainingAmount
  }
}
```

## Common Queries

### 1. Get All Deposits

```graphql
query {
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
    }
    totalCount
  }
}
```

### 2. Get Single Deposit by ID

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
    # Nested actions using relations
    actions {
      items {
        actionId
        actionType
        status
        createdAt
      }
    }
  }
}
```

### 3. Get Deposits by User

```graphql
query GetUserDeposits($depositor: String!) {
  deposits(where: { depositor: $depositor }) {
    items {
      depositId
      token
      remainingAmount
      createdAt
    }
    totalCount
  }
}
```

### 4. Get Actions with Deposit (Nested Query)

```graphql
query GetActions {
  actions {
    items {
      actionId
      actionType
      status
      user
      createdAt
      # Nested deposit using relations
      deposit {
        depositId
        token
        remainingAmount
      }
    }
    totalCount
  }
}
```

### 5. Get Liquidity by Token

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

### 6. Get Price by Token

```graphql
query GetPrice($token: String!) {
  price(token: $token) {
    token
    price
    timestamp
    updatedAt
  }
}
```

**Or get all prices:**
```graphql
query GetAllPrices {
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

## Pagination

### Cursor-based Pagination

```graphql
query GetDepositsPaginated($first: Int!, $after: String) {
  deposits(first: $first, after: $after) {
    items {
      depositId
      remainingAmount
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

### Limit/Offset Pagination

```graphql
query GetDepositsLimit($limit: Int!, $offset: Int!) {
  deposits(limit: $limit, offset: $offset) {
    items {
      depositId
      remainingAmount
    }
    totalCount
  }
}
```

## Filtering

### Where Clauses

```graphql
query GetActiveDeposits {
  deposits(where: { 
    released: false
    depositor: "0x..."
  }) {
    items {
      depositId
      remainingAmount
    }
    totalCount
  }
}
```

### Multiple Conditions

```graphql
query GetPendingActions {
  actions(where: { 
    status: "pending"
    user: "0x..."
  }) {
    items {
      actionId
      actionType
      createdAt
    }
    totalCount
  }
}
```

## Using in Frontend

### With fetch

```typescript
const query = `
  query GetDeposits {
    deposits {
      edges {
        node {
          depositId
          remainingAmount
        }
      }
      totalCount
    }
  }
`;

const response = await fetch('http://localhost:42069/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});

const { data } = await response.json();
const deposits = data.deposits.items; // Ponder menggunakan items, bukan edges
```

### With GraphQL Client

```typescript
import { createClient } from '@urql/core';

const client = createClient({
  url: 'http://localhost:42069/graphql',
});

const { data } = await client.query(`
  query GetDeposits {
    deposits {
      edges {
        node {
          depositId
          remainingAmount
        }
      }
    }
  }
`).toPromise();

const deposits = data.deposits.items; // Ponder menggunakan items, bukan edges
```

## Important Notes

1. **List queries** menggunakan `items` (bukan `edges` → `node`)
2. **Single queries** (by primary key) return object langsung
3. **Relations** bisa digunakan untuk nested queries
4. **Pagination** support cursor-based dan limit/offset
5. **Structure**: `{ items: [...], pageInfo: {...}, totalCount: number }`

