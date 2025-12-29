# 🏗️ Cylend Architecture & Flow Analysis

## 📋 Executive Summary

Setelah menganalisis referensi service scripts dan flowchart, berikut adalah analisis kebutuhan arsitektur dan flow untuk aplikasi Cylend.

---

## 🔄 Current Flow (Dari Referensi)

### 1. **User Action Flow**
```
User (Frontend)
  ↓
1. Deposit (Native/ERC20) → Ingress.depositNative/depositErc20()
  ↓
2. Encrypt Payload (Client-side dengan Sapphire SDK)
  ↓
3. Submit Encrypted Action → Ingress.submitAction()
  ↓
4. Hyperlane Relayer (Forward message Mantle → Sapphire)
  ↓
5. LendingCore._handle() (Receive & Store encrypted action)
  ↓
6. ⚠️ MANUAL: processAction() (Harus dipanggil oleh owner/backend)
  ↓
7. LendingCore memproses & kirim release instruction kembali
  ↓
8. Hyperlane Relayer (Forward release Sapphire → Mantle)
  ↓
9. Ingress._handle() (Release funds ke user)
```

### 2. **Key Events**

**Mantle (Ingress):**
- `DepositCreated(depositId, depositor, token, amount, isNative)`
- `EncryptedActionReceived(encryptedDataHash)`
- `EncryptedActionProcessed(encryptedDataHash)`
- `LiquidityUpdated(token, totalDeposited, totalReserved, totalBorrowed)`

**Sapphire (LendingCore):**
- `EncryptedActionStored(actionId, originDomain, originRouter, ciphertext)`
- `ActionProcessed(actionId, actionType)`
- `PositionUpdated(user, token, positionHash)` ⚠️ **PRIVATE - hanya hash**
- `PriceUpdated(token, price, timestamp)`

---

## 🤔 Apakah Perlu Backend?

### ✅ **YA, BACKEND DIPERLUKAN** karena:

#### 1. **processAction() Harus Dipanggil**
- `processAction()` di LendingCore adalah `onlyOwner`
- Tidak bisa dipanggil langsung dari frontend (security risk)
- Perlu service yang monitor `EncryptedActionStored` events
- Auto-process actions setelah relayer forward message

#### 2. **Event Indexing & Query**
- Frontend perlu query:
  - User deposits
  - User actions (status: pending/processed)
  - Position updates (via position hash)
  - Liquidity info
- Events tersebar di 2 chains (Mantle + Sapphire)
- Perlu aggregasi data

#### 3. **Price Oracle Updates**
- `updatePriceFromRoflOracle()` perlu dipanggil secara berkala
- Monitor price staleness
- Update prices sebelum process actions

#### 4. **Real-time Updates**
- Frontend perlu real-time updates untuk:
  - Action status changes
  - Position updates
  - Liquidity changes

#### 5. **Security & Rate Limiting**
- Validasi actions sebelum process
- Rate limiting untuk prevent spam
- Monitoring & alerting

---

## 🏛️ Arsitektur yang Direkomendasikan

### **Option 1: Ponder + Custom Service** ⭐ **RECOMMENDED**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  - User interactions                                        │
│  - Wallet connection (Wagmi + RainbowKit)                  │
│  - Encrypt payload (Sapphire SDK)                          │
│  - Submit transactions (via Wagmi)                         │
│  - Query data (via Ponder GraphQL)                         │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ GraphQL Query
                        │ WebSocket (Real-time)
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    PONDER (Event Indexer)                  │
│  - Index events dari Mantle & Sapphire                     │
│  - GraphQL API                                             │
│  - Real-time subscriptions                                 │
│  - Aggregate data dari 2 chains                            │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ Monitor Events
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              ACTION PROCESSOR SERVICE                        │
│  (Custom Node.js/TypeScript Service)                        │
│                                                             │
│  Functions:                                                 │
│  1. Monitor EncryptedActionStored events                    │
│  2. Check price staleness                                  │
│  3. Update prices dari ROFL Oracle (if needed)             │
│  4. Call processAction() di Sapphire                        │
│  5. Monitor ActionProcessed events                          │
│  6. Alert jika ada errors                                  │
│                                                             │
│  Tech Stack:                                                │
│  - ethers.js v6                                            │
│  - @oasisprotocol/sapphire-paratime                        │
│  - Hyperlane SDK (monitor messages)                        │
│  - Database (PostgreSQL) untuk state tracking              │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Direct Contract Calls
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN LAYER                               │
│                                                             │
│  Mantle Sepolia:                                            │
│  - PrivateLendingIngress                                    │
│  - Hyperlane Mailbox                                        │
│                                                             │
│  Sapphire Testnet:                                          │
│  - LendingCore                                              │
│  - Hyperlane Mailbox                                        │
│  - ROFL Oracle                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Option 2: Full Custom Backend** (Alternative)

Jika tidak pakai Ponder, bisa build custom backend dengan:
- Express.js/Fastify untuk API
- Event listeners untuk Mantle & Sapphire
- PostgreSQL untuk indexing
- GraphQL server (Apollo/GraphQL Yoga)
- WebSocket untuk real-time

**Trade-off:** Lebih banyak development time, tapi lebih kontrol.

---

## 💰 Deposit Management & Partial Usage

### **Konsep DepositId**

DepositId adalah "bucket" yang menyimpan funds di Ingress contract. Setiap depositId memiliki:
- `depositor`: Address pemilik
- `token`: Token address (address(0) untuk native)
- `amount`: Sisa balance yang tersedia
- `isNative`: Boolean untuk native vs ERC20
- `released`: Boolean (true jika amount = 0)

### **Partial Usage Pattern**

**Contoh:**
1. User deposit 5 USDC → dapat `depositId: 0xabc...`
2. User supply 3 USDC menggunakan `depositId: 0xabc...`
3. Setelah action diproses, `depositId: 0xabc...` masih punya 2 USDC
4. User bisa:
   - Supply lagi 2 USDC (gunakan semua)
   - Supply 1 USDC (sisa 1 USDC)
   - Buat deposit baru untuk action lain
   - Gunakan untuk action berbeda (borrow, repay, withdraw)

### **Solusi untuk Partial Usage**

#### **1. Deposit Selection UI**

Setiap action page perlu:
- **Option 1: Pilih Deposit yang Ada**
  - Dropdown/Select untuk pilih depositId
  - Show: token, remaining amount, created date
  - Validasi: amount yang diminta <= remaining amount
  - Disable depositId yang sudah released (amount = 0)

- **Option 2: Buat Deposit Baru**
  - Button "Create New Deposit"
  - Deposit funds terlebih dahulu
  - Auto-select depositId baru setelah deposit

#### **2. Deposit Tracking**

Frontend perlu track:
```typescript
interface Deposit {
  depositId: string;
  depositor: string;
  token: string;
  initialAmount: bigint;
  remainingAmount: bigint; // Update setelah setiap action
  isNative: boolean;
  released: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}
```

#### **3. Real-time Updates**

Setelah action diproses:
- Monitor `EncryptedActionProcessed` event
- Update `remainingAmount` di local state
- Update UI untuk show remaining balance
- Mark depositId sebagai `released` jika amount = 0

#### **4. Deposit Page (`/app/deposit`)**

Page khusus untuk manage deposits:
- **List Active Deposits**
  - Table dengan: Token, Initial Amount, Remaining, Status, Actions
  - Filter by token
  - Sort by date/amount

- **Create New Deposit**
  - Form: Token (native/ERC20), Amount
  - Approve (untuk ERC20)
  - Submit deposit
  - Show depositId setelah created

- **Deposit Details**
  - Show depositId
  - Transaction history untuk depositId tersebut
  - Actions yang pernah menggunakan depositId ini

---

## 📊 Data Flow Detail

### **0. Deposit Flow (New Page)**

```
Frontend (/app/deposit):
  1. User input: token (native/ERC20), amount
  2. Check balance/allowance
  3. If ERC20: approve if needed
  4. Call depositNative() atau depositErc20()
  5. Wait for DepositCreated event
  6. Get depositId dari event
  7. Store depositId di local state / Ponder
  8. Show success: "Deposit created: 0xabc... (5 USDC)"
  
Backend (Ponder):
  1. Index DepositCreated event
  2. Store deposit data
  3. Emit real-time update
  
Frontend:
  1. Update deposit list
  2. User bisa langsung gunakan depositId untuk action
```

### **1. Supply Flow (Updated)**

```
Frontend:
  1. User input: token, amount
  2. **Deposit Selection:**
     a. Pilih depositId yang ada (jika ada)
     b. Atau buat deposit baru
  3. **Validation:**
     - Jika pilih existing: amount <= remainingAmount
     - Jika buat baru: check balance/allowance
  4. **If new deposit:**
     - Call depositNative/depositErc20() → get depositId
  5. Encrypt payload:
     - actionType: 0 (SUPPLY)
     - token, amount, onBehalf, depositId, isNative, memo
  6. Call submitAction(destinationDomain, depositId, ciphertext)
  
Backend (Action Processor):
  1. Monitor EncryptedActionStored event di Sapphire
  2. Detect new action untuk user
  3. Check price staleness
  4. Update price jika perlu
  5. Call processAction(actionId)
  6. Monitor ActionProcessed event
  7. Update status di database
  
Frontend (via Ponder):
  1. Query action status
  2. Show "Processing..." → "Processed"
  3. Monitor EncryptedActionProcessed event
  4. **Update deposit remainingAmount:**
     - remainingAmount = remainingAmount - amount
     - If remainingAmount = 0: mark as released
  5. Query position hash update
```

### **2. Borrow Flow (Updated)**

```
Frontend:
  1. User input: token, amount
  2. **Deposit Selection (Collateral):**
     - Pilih depositId yang ada sebagai collateral
     - Atau buat deposit baru untuk collateral
  3. **Validation:**
     - Collateral depositId harus punya sufficient amount
     - Check health factor (estimate)
  4. Encrypt payload (actionType: 1)
  5. Call submitAction()
  
Backend:
  1. Monitor & process action
  2. LendingCore validates health factor
  3. If valid → release funds (borrow amount)
  4. Hyperlane forward release instruction
  
Frontend:
  1. Monitor EncryptedActionProcessed event
  2. **Update deposit:**
     - Collateral depositId tetap (tidak berkurang untuk borrow)
     - Funds released ke user wallet (bukan dari depositId)
  3. Show funds released
```

### **3. Withdraw Flow (Updated)**

```
Frontend:
  1. User input: amount
  2. **Deposit Selection:**
     - Pilih depositId yang akan digunakan
     - Amount <= remainingAmount di depositId
  3. Encrypt payload (actionType: 3)
  4. Call submitAction()
  
Backend:
  1. Process action
  2. LendingCore checks health factor
  3. If valid → release collateral (withdraw amount)
  4. Hyperlane forward release instruction
  
Frontend:
  1. Monitor EncryptedActionProcessed event
  2. **Update deposit:**
     - remainingAmount = remainingAmount - amount
     - If remainingAmount = 0: mark as released
  3. Show collateral released
```

### **4. Repay Flow (Updated)**

```
Frontend:
  1. User input: amount (untuk repay)
  2. **Deposit Selection:**
     - Pilih depositId yang ada (jika ada funds)
     - Atau buat deposit baru untuk repay
  3. **If new deposit:**
     - Deposit funds terlebih dahulu
     - Get depositId
  4. Encrypt payload (actionType: 2)
  5. Call submitAction()
  
Backend:
  1. Process action
  2. Update borrow position
  3. **Note:** Repay tidak release funds, hanya update position
  
Frontend:
  1. Monitor EncryptedActionProcessed event
  2. **Update deposit:**
     - remainingAmount = remainingAmount - amount
  3. Monitor position update (via position hash)
```

---

## 🛠️ Implementation Plan

### **Phase 1: Frontend Integration** (Week 1-2)

1. **Sapphire Encryption Utils**
   ```typescript
   // src/lib/sapphire.ts
   - encodeEnvelope(plaintext, pubKey)
   - generateEphemeralKeyPair()
   ```

2. **Contract Hooks**
   ```typescript
   // src/hooks/useIngress.ts
   - useDepositNative()
   - useDepositErc20()
   - useSubmitAction()
   - useGetDeposit()
   ```

3. **Action Pages**
   - `/app/deposit` - **NEW:** Deposit management page
   - `/app/supply` - Supply page dengan deposit selection
   - `/app/borrow` - Borrow page dengan collateral selection
   - `/app/withdraw` - Withdraw page dengan deposit selection
   - `/app/repay` - Repay page dengan deposit selection

4. **Deposit Management**
   ```typescript
   // src/hooks/useDeposits.ts
   - useDeposits() // Get all user deposits
   - useDeposit(depositId) // Get specific deposit
   - useCreateDeposit() // Create new deposit
   - useDepositRemaining(depositId) // Get remaining amount
   ```

5. **Deposit Selection Component**
   ```typescript
   // src/components/DepositSelector.tsx
   - Show list of available deposits
   - Filter by token
   - Show remaining amount
   - Option to create new deposit
   ```

### **Phase 2: Ponder Setup** (Week 2-3)

1. **Install Ponder**
   ```bash
   npm create ponder@latest
   ```

2. **Configure Ponder**
   - Add Mantle Sepolia network
   - Add Sapphire Testnet network
   - Configure RPC endpoints

3. **Define Schemas**
   ```typescript
   // ponder.schema.ts
   - Deposit {
       depositId: string (indexed)
       depositor: string (indexed)
       token: string
       initialAmount: bigint
       remainingAmount: bigint // Updated after each action
       isNative: boolean
       released: boolean
       createdAt: timestamp
       lastUsedAt?: timestamp
     }
   - Action {
       actionId: string (indexed)
       depositId: string (indexed)
       user: string (indexed)
       actionType: number
       status: string (pending/processed/failed)
       createdAt: timestamp
       processedAt?: timestamp
     }
   - Position {
       user: string (indexed)
       token: string (indexed)
       positionHash: string
       updatedAt: timestamp
     }
   - Liquidity {
       token: string (indexed)
       totalDeposited: bigint
       totalReserved: bigint
       totalBorrowed: bigint
       updatedAt: timestamp
     }
   ```

4. **Event Handlers**
   - **DepositCreated**: Create new deposit record
   - **EncryptedActionReceived**: Create action record (status: pending)
   - **EncryptedActionStored**: Update action (link to Sapphire)
   - **ActionProcessed**: Update action (status: processed), update deposit remainingAmount
   - **EncryptedActionProcessed**: Update deposit remainingAmount, mark released if amount = 0
   - **PositionUpdated**: Update position hash
   - **LiquidityUpdated**: Update liquidity metrics

### **Phase 3: Action Processor Service** (Week 3-4)

1. **Setup Service**
   ```typescript
   // services/action-processor/
   - index.ts (main service)
   - event-monitor.ts
   - action-processor.ts
   - price-updater.ts
   ```

2. **Database Schema**
   ```sql
   - deposits (
       depositId VARCHAR(66) PRIMARY KEY,
       depositor VARCHAR(42) NOT NULL,
       token VARCHAR(42) NOT NULL,
       initialAmount NUMERIC NOT NULL,
       remainingAmount NUMERIC NOT NULL,
       isNative BOOLEAN NOT NULL,
       released BOOLEAN DEFAULT FALSE,
       createdAt TIMESTAMP NOT NULL,
       lastUsedAt TIMESTAMP,
       INDEX idx_depositor (depositor),
       INDEX idx_token (token),
       INDEX idx_released (released)
     )
   
   - actions (
       actionId VARCHAR(66) PRIMARY KEY,
       depositId VARCHAR(66) NOT NULL,
       user VARCHAR(42) NOT NULL,
       actionType INTEGER NOT NULL,
       status VARCHAR(20) NOT NULL, -- pending/processed/failed
       amount NUMERIC NOT NULL,
       createdAt TIMESTAMP NOT NULL,
       processedAt TIMESTAMP,
       FOREIGN KEY (depositId) REFERENCES deposits(depositId),
       INDEX idx_user (user),
       INDEX idx_depositId (depositId),
       INDEX idx_status (status)
     )
   
   - positions (
       user VARCHAR(42) NOT NULL,
       token VARCHAR(42) NOT NULL,
       positionHash VARCHAR(66) NOT NULL,
       updatedAt TIMESTAMP NOT NULL,
       PRIMARY KEY (user, token),
       INDEX idx_positionHash (positionHash)
     )
   ```

3. **Monitoring**
   - Monitor EncryptedActionStored events
   - Queue actions untuk processing
   - Retry logic untuk failed actions
   - **Update deposit remainingAmount** setelah action processed
   - Mark deposit as released jika remainingAmount = 0

### **Phase 4: Integration & Testing** (Week 4-5)

1. **End-to-end Testing**
   - Test supply flow
   - Test borrow flow
   - Test withdraw flow
   - Test repay flow

2. **Error Handling**
   - Handle failed transactions
   - Handle failed processAction
   - User notifications

3. **UI Polish**
   - Loading states
   - Error states
   - Success states
   - Real-time updates

---

## 🔐 Security Considerations

### **Frontend**
- ✅ Encryption di client-side (Sapphire SDK)
- ✅ Private key tidak pernah exposed
- ✅ Validate inputs sebelum submit
- ✅ Rate limiting untuk prevent spam

### **Backend**
- ✅ Private key untuk processAction() di secure storage
- ✅ Validate actions sebelum process
- ✅ Monitor untuk suspicious activity
- ✅ Rate limiting per user

### **Smart Contracts**
- ✅ Only owner bisa processAction()
- ✅ Deposit ownership validation
- ✅ Health factor checks
- ✅ Price staleness checks

---

## 📈 Scalability Considerations

### **Current Architecture**
- Single action processor (bisa scale horizontal)
- Ponder bisa handle high event volume
- Database bisa shard by user jika perlu

### **Future Optimizations**
- Multiple action processors dengan queue (RabbitMQ/Redis)
- Caching untuk frequently accessed data
- CDN untuk static assets
- Load balancer untuk API

---

## 🎯 Decision: Ponder vs Custom Backend

### **Ponder Advantages:**
- ✅ Fast setup (event indexing built-in)
- ✅ GraphQL API out-of-the-box
- ✅ Real-time subscriptions
- ✅ Multi-chain support
- ✅ Type-safe dengan TypeScript

### **Ponder Disadvantages:**
- ⚠️ Still need custom service untuk processAction()
- ⚠️ Learning curve untuk Ponder

### **Custom Backend Advantages:**
- ✅ Full control
- ✅ Custom logic lebih mudah
- ✅ No dependency pada Ponder

### **Custom Backend Disadvantages:**
- ❌ More development time
- ❌ Need to build event indexing
- ❌ Need to build GraphQL server
- ❌ More infrastructure to maintain

### **Recommendation:**
**Gunakan Ponder + Custom Action Processor Service**

Alasan:
1. Ponder handle event indexing dengan baik
2. GraphQL API sangat berguna untuk frontend
3. Real-time subscriptions penting untuk UX
4. Custom service hanya perlu handle processAction() logic
5. Best of both worlds

---

## 📝 Next Steps

1. ✅ Setup Ponder project
2. ✅ Configure networks (Mantle + Sapphire)
3. ✅ Define schemas (include Deposit with remainingAmount)
4. ✅ Implement event handlers (update remainingAmount)
5. ✅ Build deposit management page (`/app/deposit`)
6. ✅ Build deposit selector component
7. ✅ Update action pages dengan deposit selection
8. ✅ Build action processor service
9. ✅ Integrate frontend dengan Ponder GraphQL
10. ✅ Test end-to-end flow (including partial usage)
11. ✅ Deploy infrastructure

---

## 🎨 UI/UX Considerations untuk Deposit Management

### **Deposit Page (`/app/deposit`)**

**Layout:**
```
┌─────────────────────────────────────────┐
│  Deposit Management                    │
├─────────────────────────────────────────┤
│  [Create New Deposit] Button           │
│                                         │
│  Active Deposits:                      │
│  ┌───────────────────────────────────┐ │
│  │ Token  │ Amount │ Remaining │ ... │ │
│  │ USDC   │ 5.0    │ 2.0       │ ... │ │
│  │ MNT    │ 10.0   │ 10.0      │ ... │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Released Deposits:                    │
│  (Collapsed by default)                │
└─────────────────────────────────────────┘
```

### **Deposit Selector Component**

**Usage di Action Pages:**
```
┌─────────────────────────────────────────┐
│  Select Deposit:                       │
│  ┌───────────────────────────────────┐ │
│  │ [Dropdown]                        │ │
│  │ ▼ USDC - 2.0 remaining            │ │
│  │   MNT - 10.0 remaining            │ │
│  │   [Create New Deposit]            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Available: 2.0 USDC                   │
│  You're using: 1.5 USDC                │
│  Remaining after: 0.5 USDC             │
└─────────────────────────────────────────┘
```

### **Validation Messages**

- ✅ "Deposit selected: 2.0 USDC available"
- ⚠️ "Amount exceeds remaining: 2.0 USDC available, you're using 3.0 USDC"
- ✅ "Creating new deposit for this action..."
- ℹ️ "This deposit will have 0.5 USDC remaining after this action"

---

## 🔗 Resources

- [Ponder Documentation](https://ponder.sh)
- [Sapphire SDK](https://docs.oasis.io/build/sapphire-paratime/)
- [Hyperlane Documentation](https://docs.hyperlane.xyz)
- [Wagmi Documentation](https://wagmi.sh)

