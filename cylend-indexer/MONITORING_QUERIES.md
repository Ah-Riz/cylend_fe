# Monitoring Queries untuk Track Deposit & Action Status

## 1. Query Deposit dengan Remaining Amount

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
    # Nested actions untuk lihat history
    actions {
      items {
        actionId
        actionType
        status
        amount
        createdAt
        processedAt
      }
    }
  }
}
```

**Variables:**
```json
{
  "depositId": "0x62b629815eea2e8974bc4601588dc0a0b663210e8c1f31f54a86d829ea622da4"
}
```

## 2. Query Action Status untuk Monitor Processing

```graphql
query GetAction($actionId: String!) {
  action(actionId: $actionId) {
    actionId
    depositId
    user
    actionType
    status
    createdAt
    processedAt
    originDomain
    originRouter
    # Nested deposit untuk lihat remaining amount
    deposit {
      depositId
      remainingAmount
      initialAmount
    }
  }
}
```

**Variables:**
```json
{
  "actionId": "0xb1bee67291737602cce2b383e4b0e2511f1f61c7d38090ba1cd4faccb9a04e2a"
}
```

## 3. Query Semua Actions untuk Deposit Tertentu

```graphql
query GetDepositActions($depositId: String!) {
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

**Variables:**
```json
{
  "depositId": "0x62b629815eea2e8974bc4601588dc0a0b663210e8c1f31f54a86d829ea622da4"
}
```

## 4. Query Actions yang Sudah Processed

```graphql
query GetProcessedActions {
  actions(where: { status: "processed" }) {
    items {
      actionId
      depositId
      actionType
      status
      createdAt
      processedAt
      deposit {
        remainingAmount
        initialAmount
      }
    }
    totalCount
  }
}
```

## 5. Query Deposit dengan Filter by User

```graphql
query GetUserDeposits($user: String!) {
  deposits(where: { depositor: $user }) {
    items {
      depositId
      token
      initialAmount
      remainingAmount
      released
      createdAt
      lastUsedAt
    }
    totalCount
  }
}
```

**Variables:**
```json
{
  "user": "0x0170aeadb4dad9e3d873280b8d39c8efac34ef6b"
}
```

## 6. Query untuk Monitor Remaining Amount Changes

```graphql
query MonitorDeposit($depositId: String!) {
  deposit(depositId: $depositId) {
    depositId
    initialAmount
    remainingAmount
    released
    lastUsedAt
    actions {
      items {
        actionId
        actionType
        status
        createdAt
        processedAt
      }
    }
  }
}
```

## Cara Menggunakan

### 1. Cek Status Action Saat Ini

Action ID: `0xb1bee67291737602cce2b383e4b0e2511f1f61c7d38090ba1cd4faccb9a04e2a`

```graphql
query {
  action(actionId: "0xb1bee67291737602cce2b383e4b0e2511f1f61c7d38090ba1cd4faccb9a04e2a") {
    actionId
    status
    processedAt
    deposit {
      remainingAmount
    }
  }
}
```

### 2. Cek Deposit Remaining Amount

```graphql
query {
  deposit(depositId: "0x62b629815eea2e8974bc4601588dc0a0b663210e8c1f31f54a86d829ea622da4") {
    depositId
    initialAmount
    remainingAmount
    lastUsedAt
  }
}
```

## Catatan Penting

1. **Status "pending"** berarti action sudah dikirim ke Ingress tapi belum diproses di Sapphire
2. **remainingAmount akan berkurang** setelah action diproses di LendingCore (Sapphire)
3. **processedAt** akan terisi setelah action diproses
4. **lastUsedAt** akan update setelah action diproses

## Expected Flow

1. **Submit Action** → Status: `pending`, `remainingAmount`: belum berubah
2. **Action Diproses di Sapphire** → Status: `processed`, `processedAt`: terisi, `remainingAmount`: berkurang
3. **Jika remainingAmount = 0** → `released: true`

## Query untuk Real-time Monitoring

Gunakan polling setiap 5-10 detik untuk monitor perubahan:

```graphql
query MonitorAction($actionId: String!) {
  action(actionId: $actionId) {
    status
    processedAt
    deposit {
      remainingAmount
    }
  }
}
```

