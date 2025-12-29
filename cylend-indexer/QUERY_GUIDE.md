# Ponder Query Guide

Ponder menyediakan beberapa cara untuk query data yang sudah di-index:

1. **GraphQL** - Auto-generated dari schema
2. **SQL over HTTP** - Type-safe SQL queries dengan Drizzle
3. **Direct SQL** - Raw SQL queries
4. **API Endpoints** - Custom REST endpoints

## 1. GraphQL API

### Setup

GraphQL sudah di-enable di `src/api/index.ts`. Akses di:
- **GraphQL Endpoint**: `http://localhost:42069/graphql`
- **GraphiQL Interface**: Buka `http://localhost:42069/graphql` di browser

### Basic Query

```graphql
query GetDeposits {
  deposits {
    depositId
    depositor
    token
    initialAmount
    remainingAmount
    isNative
    released
    createdAt
  }
}
```

### Query dengan Filter

```graphql
query GetUserDeposits($depositor: String!) {
  deposits(where: { depositor: $depositor }) {
    depositId
    token
    remainingAmount
  }
}
```

### Query dengan Pagination

```graphql
query GetDepositsPaginated($first: Int!, $after: String) {
  deposits(first: $first, after: $after) {
    edges {
      node {
        depositId
        remainingAmount
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
```

### Nested Queries (Relations)

```graphql
query GetActionsWithDeposit {
  actions {
    actionId
    depositId
    actionType
    status
    deposit {
      token
      remainingAmount
    }
  }
}
```

### Menggunakan di Frontend

```typescript
// With fetch
const query = `
  query GetUserDeposits($depositor: String!) {
    deposits(where: { depositor: $depositor }) {
      depositId
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

## 2. SQL over HTTP

### Setup

SQL over HTTP sudah di-enable di `src/api/index.ts`. Akses di: `http://localhost:42069/sql`

### Install Dependencies

```bash
pnpm add @ponder/client @ponder/react @tanstack/react-query
```

### Create Client

```typescript
// lib/ponder.ts
import { createClient } from "@ponder/client";
import * as schema from "../../cylend-indexer/ponder.schema";

export const client = createClient("http://localhost:42069/sql", { schema });
```

### Basic Query

```typescript
import { client } from "./lib/ponder";
import * as schema from "../../cylend-indexer/ponder.schema";

// Get all deposits
const deposits = await client.db
  .select()
  .from(schema.deposit);

// Get deposits with filter
import { eq, desc } from "@ponder/client";

const userDeposits = await client.db
  .select()
  .from(schema.deposit)
  .where(eq(schema.deposit.depositor, "0x..."))
  .orderBy(desc(schema.deposit.createdAt));
```

### Live Queries (Real-time Updates)

```typescript
import { client } from "./lib/ponder";
import * as schema from "../../cylend-indexer/ponder.schema";

await client.live(
  (db) => db.select().from(schema.deposit),
  (result) => {
    // Handle result updates
    console.log("Deposits updated:", result);
  },
  (error) => {
    // Handle error
    console.error("Error:", error);
  }
);
```

### React Hook

```typescript
// app/layout.tsx
import { PonderProvider } from "@ponder/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { client } from "../lib/ponder";

const queryClient = new QueryClient();

export default function Layout({ children }) {
  return (
    <PonderProvider client={client}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PonderProvider>
  );
}
```

```typescript
// components/DepositsList.tsx
import { usePonderQuery } from "@ponder/react";
import * as schema from "../../cylend-indexer/ponder.schema";
import { eq, desc } from "@ponder/client";

export function DepositsList({ userAddress }: { userAddress: string }) {
  const { data, isLoading, error } = usePonderQuery({
    queryFn: (db) =>
      db
        .select()
        .from(schema.deposit)
        .where(eq(schema.deposit.depositor, userAddress))
        .orderBy(desc(schema.deposit.createdAt)),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map((deposit) => (
        <div key={deposit.depositId}>
          {deposit.depositId} - {deposit.remainingAmount.toString()}
        </div>
      ))}
    </div>
  );
}
```

### Pagination

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import { usePonderClient } from "@ponder/react";
import * as schema from "../../cylend-indexer/ponder.schema";
import { desc } from "@ponder/client";

const client = usePonderClient();

const query = useInfiniteQuery({
  queryKey: ["deposits"],
  queryFn: ({ pageParam }) =>
    client.db
      .select()
      .from(schema.deposit)
      .orderBy(desc(schema.deposit.createdAt))
      .limit(100)
      .offset(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) =>
    lastPage.length === 100 ? pages.length * 100 : undefined,
});
```

## 3. Direct SQL

Untuk advanced use cases, bisa langsung query database:

```typescript
import { sql } from "@ponder/client";

const result = await client.db.execute(
  sql`SELECT * FROM deposit WHERE depositor = ${userAddress} LIMIT 10`
);
```

## 4. API Endpoints

Bisa juga membuat custom REST endpoints di `src/api/index.ts`:

```typescript
import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { eq } from "@ponder/client";

const app = new Hono();

// Custom endpoint
app.get("/api/deposits/:user", async (c) => {
  const user = c.req.param("user");
  
  const deposits = await db
    .select()
    .from(schema.deposit)
    .where(eq(schema.deposit.depositor, user as `0x${string}`));
  
  return c.json(deposits);
});

export default app;
```

## Comparison

| Feature | GraphQL | SQL over HTTP | Direct SQL |
|---------|---------|---------------|------------|
| Type Safety | ✅ Auto-generated | ✅ Full TypeScript | ❌ Manual |
| Real-time | ✅ Subscriptions | ✅ Live queries | ❌ Polling |
| Flexibility | ⚠️ Schema-based | ✅ Full SQL | ✅ Full SQL |
| Learning Curve | Easy | Medium | Hard |
| Best For | Simple queries | Complex queries | Advanced use cases |

## Examples

### Get User Dashboard Data

**GraphQL:**
```graphql
query GetUserDashboard($user: String!) {
  deposits(where: { depositor: $user }) {
    depositId
    remainingAmount
  }
  actions(where: { user: $user }) {
    actionId
    actionType
    status
  }
  positions(where: { user: $user }) {
    token
    positionHash
  }
}
```

**SQL over HTTP:**
```typescript
const [deposits, actions, positions] = await Promise.all([
  client.db.select().from(schema.deposit).where(eq(schema.deposit.depositor, user)),
  client.db.select().from(schema.action).where(eq(schema.action.user, user)),
  client.db.select().from(schema.position).where(eq(schema.position.user, user)),
]);
```

### Get Active Deposits with Actions

**GraphQL:**
```graphql
query GetActiveDeposits {
  deposits(where: { released: false }) {
    depositId
    remainingAmount
    actions {
      actionId
      actionType
      status
    }
  }
}
```

**SQL over HTTP:**
```typescript
const deposits = await client.db
  .select()
  .from(schema.deposit)
  .where(eq(schema.deposit.released, false));

// Then get actions for each deposit
const actions = await client.db
  .select()
  .from(schema.action)
  .where(
    inArray(
      schema.action.depositId,
      deposits.map((d) => d.depositId)
    )
  );
```

## Security Notes

- **GraphQL**: Auto-generated, safe by design
- **SQL over HTTP**: 
  - Read-only transactions
  - Query validator (only SELECT allowed)
  - Resource limits (500ms timeout, 512MB work_mem)
- **Direct SQL**: Same security as SQL over HTTP

## References

- [GraphQL Docs](https://ponder.sh/docs/query/graphql)
- [SQL over HTTP Docs](https://ponder.sh/docs/query/sql-over-http)
- [API Endpoints Docs](https://ponder.sh/docs/query/api-endpoints)
- [Direct SQL Docs](https://ponder.sh/docs/query/direct-sql)

