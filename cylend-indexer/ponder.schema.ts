import { onchainTable, primaryKey, relations } from "ponder";

// Deposit table - tracks user deposits in Ingress
export const deposit = onchainTable("deposit", (t) => ({
  depositId: t.hex().primaryKey(),
  depositor: t.hex().notNull(),
  token: t.hex().notNull(),
  initialAmount: t.bigint().notNull(),
  remainingAmount: t.bigint().notNull(), // Updated after each action
  isNative: t.boolean().notNull(),
  released: t.boolean().notNull().default(false),
  createdAt: t.integer().notNull(),
  lastUsedAt: t.integer(),
}));

// Action table - tracks encrypted actions from submission to processing
export const action = onchainTable("action", (t) => ({
  actionId: t.hex().primaryKey(),
  depositId: t.hex().notNull(),
  user: t.hex().notNull(), // onBehalf address
  actionType: t.integer().notNull(), // 0=SUPPLY, 1=BORROW, 2=REPAY, 3=WITHDRAW, 4=LIQUIDATE
  status: t.text().notNull(), // pending/processed/failed
  encryptedDataHash: t.hex(), // Hash of encrypted payload (from EncryptedActionReceived)
  createdAt: t.integer().notNull(),
  processedAt: t.integer(),
  originDomain: t.integer(), // From EncryptedActionStored
  originRouter: t.hex(), // From EncryptedActionStored
}));

// Position table - tracks user positions (only hash for privacy)
// Uses composite primary key (user, token)
export const position = onchainTable(
  "position",
  (t) => ({
    user: t.hex().notNull(),
    token: t.hex().notNull(),
    positionHash: t.hex().notNull(), // keccak256(abi.encodePacked(collateral, borrow))
    updatedAt: t.integer().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.user, table.token] }),
  })
);

// Liquidity table - tracks token liquidity metrics
export const liquidity = onchainTable("liquidity", (t) => ({
  token: t.hex().primaryKey(),
  totalDeposited: t.bigint().notNull(),
  totalReserved: t.bigint().notNull(),
  totalBorrowed: t.bigint().notNull(),
  updatedAt: t.integer().notNull(),
}));

// Price table - tracks token prices from oracle
export const price = onchainTable("price", (t) => ({
  token: t.hex().primaryKey(),
  price: t.bigint().notNull(),
  timestamp: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
}));

// ============================================================================
// Relations - Enrich GraphQL API and Query API
// ============================================================================

// Deposit relations - one deposit can have many actions
export const depositRelations = relations(deposit, ({ many }) => ({
  actions: many(action),
}));

// Action relations - each action belongs to one deposit
export const actionRelations = relations(action, ({ one }) => ({
  deposit: one(deposit, {
    fields: [action.depositId],
    references: [deposit.depositId],
  }),
}));
