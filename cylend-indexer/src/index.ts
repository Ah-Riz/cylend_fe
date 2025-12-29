import { ponder } from "ponder:registry";
import { deposit, action, position, liquidity, price } from "ponder:schema";
import { eq, and } from "drizzle-orm";

// Sapphire domain ID
const SAPPHIRE_DOMAIN = 23295;

// Action types enum
enum ActionType {
  SUPPLY = 0,
  BORROW = 1,
  REPAY = 2,
  WITHDRAW = 3,
  LIQUIDATE = 4,
}

// ============================================================================
// PrivateLendingIngress Events (Mantle Sepolia)
// ============================================================================

ponder.on("PrivateLendingIngress:DepositCreated", async ({ event, context }) => {
  const { depositId, depositor, token, amount, isNative } = event.args;
  const blockTimestamp = Number(event.block.timestamp);

  // Insert deposit
  await context.db.insert(deposit).values({
    depositId,
    depositor,
    token,
    initialAmount: amount,
    remainingAmount: amount, // Initially same as initialAmount
    isNative,
    released: false,
    createdAt: blockTimestamp,
  });

  // Also sync liquidity state after creating deposit
  try {
    const liquidityInfo = await context.client.readContract({
      abi: context.contracts.PrivateLendingIngress.abi,
      address: context.contracts.PrivateLendingIngress.address,
      functionName: "getLiquidityInfo",
      args: [token],
    });

    await context.db
      .insert(liquidity)
      .values({
        token,
        totalDeposited: liquidityInfo.totalDeposited,
        totalReserved: liquidityInfo.totalReserved,
        totalBorrowed: liquidityInfo.totalBorrowed,
        updatedAt: blockTimestamp,
      })
      .onConflictDoUpdate((row) => ({
        totalDeposited: liquidityInfo.totalDeposited,
        totalReserved: liquidityInfo.totalReserved,
        totalBorrowed: liquidityInfo.totalBorrowed,
        updatedAt: blockTimestamp,
      }));
  } catch (err) {
    console.error("Failed to sync liquidity state:", err);
  }
});

ponder.on("PrivateLendingIngress:EncryptedActionReceived", async ({ event, context }) => {
  const { encryptedDataHash } = event.args;
  const blockTimestamp = Number(event.block.timestamp);

  // Read contract state to get actionId and depositId
  let actionId: `0x${string}` | null = null;
  let depositId: `0x${string}` = "0x0" as `0x${string}`;

  try {
    // Get actionId from contract state using context.client.readContract
    actionId = await context.client.readContract({
      abi: context.contracts.PrivateLendingIngress.abi,
      address: context.contracts.PrivateLendingIngress.address,
      functionName: "getActionIdByCiphertextHash",
      args: [encryptedDataHash],
    });

    // Get depositId from contract state
    if (actionId && actionId !== "0x0") {
      depositId = await context.client.readContract({
        abi: context.contracts.PrivateLendingIngress.abi,
        address: context.contracts.PrivateLendingIngress.address,
        functionName: "actionToDepositId",
        args: [actionId],
      });
    }
  } catch (err) {
    console.error("Failed to read contract state:", err);
    // Fallback: use transaction hash as actionId
    actionId = event.transaction.hash;
  }

  await context.db
    .insert(action)
    .values({
      actionId: actionId || event.transaction.hash,
      depositId,
      user: event.transaction.from,
      actionType: 0, // Placeholder, will be updated when decrypted
      status: "pending",
      encryptedDataHash,
      createdAt: blockTimestamp,
    })
    .onConflictDoNothing();
});

ponder.on("PrivateLendingIngress:EncryptedActionProcessed", async ({ event, context }) => {
  const { encryptedDataHash } = event.args;
  const blockTimestamp = Number(event.block.timestamp);

  // Find action by encryptedDataHash using raw SQL query builder
  // Note: Store API doesn't support WHERE clauses for non-primary keys, so we use db.sql
  const foundActions = await context.db.sql.query.action.findMany({
    where: (action, { eq }) => eq(action.encryptedDataHash, encryptedDataHash),
    limit: 1,
  });

  if (foundActions.length > 0 && foundActions[0]) {
    const actionRecord = foundActions[0];

    // Update action status using Store API (by primary key)
    await context.db
      .update(action, { actionId: actionRecord.actionId })
      .set({
        status: "processed",
        processedAt: blockTimestamp,
      });
  }
});

ponder.on("PrivateLendingIngress:LiquidityUpdated", async ({ event, context }) => {
  const { token, totalDeposited, totalReserved, totalBorrowed } = event.args;
  const blockTimestamp = Number(event.block.timestamp);

  await context.db
    .insert(liquidity)
    .values({
      token,
      totalDeposited,
      totalReserved,
      totalBorrowed,
      updatedAt: blockTimestamp,
    })
    .onConflictDoUpdate((row) => ({
      totalDeposited,
      totalReserved,
      totalBorrowed,
      updatedAt: blockTimestamp,
    }));
});

ponder.on("PrivateLendingIngress:WithdrawUnused", async ({ event, context }) => {
  const { depositId, depositor, token, amount } = event.args;
  const blockTimestamp = Number(event.block.timestamp);

  // Read remainingAmount directly from contract state
  let remainingAmount: bigint = 0n;
  let released = false;

  try {
    const depositData = await context.client.readContract({
      abi: context.contracts.PrivateLendingIngress.abi,
      address: context.contracts.PrivateLendingIngress.address,
      functionName: "deposits",
      args: [depositId],
    });

    // depositData = [depositor, token, amount, isNative, released]
    remainingAmount = depositData[2] as bigint; // amount field
    released = depositData[4] as boolean; // released field
  } catch (err) {
    console.error("Failed to read deposit state from contract:", err);
    // Fallback: calculate remainingAmount from foundDeposit
    const foundDeposit = await context.db.find(deposit, { depositId });
    if (foundDeposit) {
      remainingAmount = foundDeposit.remainingAmount >= BigInt(amount)
        ? foundDeposit.remainingAmount - BigInt(amount)
        : 0n;
      released = remainingAmount === 0n;
    } else {
      console.warn(`Deposit ${depositId} not found when processing WithdrawUnused event`);
      return;
    }
  }

  // Find deposit by depositId
  const foundDeposit = await context.db.find(deposit, { depositId });

  if (foundDeposit) {
    // Update deposit remainingAmount and released status from contract state
    await context.db
      .update(deposit, { depositId })
      .set({
        remainingAmount,
        released,
        lastUsedAt: blockTimestamp,
      });
  } else {
    // If deposit not found, it might be indexed from a different source
    console.warn(`Deposit ${depositId} not found when processing WithdrawUnused event`);
  }
});

// ============================================================================
// LendingCore Events (Sapphire Testnet)
// ============================================================================

ponder.on("LendingCore:EncryptedActionStored", async ({ event, context }) => {
  const { actionId, originDomain, originRouter } = event.args;
  const blockTimestamp = Number(event.block.timestamp);

  // Find action by actionId using Store API
  const foundAction = await context.db.find(action, { actionId });

  if (foundAction) {
    // Update existing action
    await context.db
      .update(action, { actionId })
      .set({
        originDomain: Number(originDomain),
        originRouter,
        status: "pending", // Still pending until processed
      });
  } else {
    // Create new action record if not found (might be from different chain)
    await context.db.insert(action).values({
      actionId,
      depositId: "0x0" as `0x${string}`, // Unknown until we can link it
      user: "0x0" as `0x${string}`, // Unknown until decrypted
      actionType: 0, // Unknown until decrypted
      status: "pending",
      originDomain: Number(originDomain),
      originRouter,
      createdAt: blockTimestamp,
    });
  }
});

ponder.on("LendingCore:ActionProcessed", async ({ event, context }) => {
  const { actionId, actionType } = event.args;
  const blockTimestamp = Number(event.block.timestamp);

  // Read processed payload from contract state to get depositId, amount, user, and token
  let depositId: `0x${string}` | null = null;
  let amount: bigint = 0n;
  let user: `0x${string}` | null = null;
  let token: `0x${string}` | null = null;
  let isNative = false;

  try {
    // processedPayloads returns a tuple: [actionType, token, amount, onBehalf, depositId, isNative, memo]
    const payload = await context.client.readContract({
      abi: context.contracts.LendingCore.abi,
      address: context.contracts.LendingCore.address,
      functionName: "processedPayloads",
      args: [actionId],
    });

    // Destructure tuple: [actionType, token, amount, onBehalf, depositId, isNative, memo]
    const [actionTypeValue, tokenAddress, amountValue, onBehalf, depositIdValue, isNativeValue, memo] = payload;
    depositId = depositIdValue;
    amount = amountValue;
    user = onBehalf;
    isNative = isNativeValue;
    token = isNative ? "0x0000000000000000000000000000000000000000" : tokenAddress;
  } catch (err) {
    console.error("Failed to read processedPayloads from contract:", err);
  }

  // Update action status using Store API
  const updateData: Partial<typeof action.$inferInsert> = {
    actionType: Number(actionType),
    status: "processed",
    processedAt: blockTimestamp,
  };

  if (depositId && depositId !== "0x0") {
    updateData.depositId = depositId;
  }
  if (user && user !== "0x0") {
    updateData.user = user;
  }

  await context.db
    .update(action, { actionId })
    .set(updateData);

  // Update deposit remainingAmount if we have depositId and amount
  if (depositId && depositId !== "0x0" && amount > 0n) {
    const foundDeposit = await context.db.find(deposit, { depositId });

    if (foundDeposit) {
      const newRemainingAmount = foundDeposit.remainingAmount >= amount
        ? foundDeposit.remainingAmount - amount
        : 0n;

      await context.db
        .update(deposit, { depositId })
        .set({
          remainingAmount: newRemainingAmount,
          released: newRemainingAmount === 0n,
          lastUsedAt: blockTimestamp,
        });
    }
  }

  // Sync price from contract state (if not updated via event)
  if (token) {
    try {
      // Read price from contract state
      // prices returns a tuple: [price, timestamp, valid]
      const priceData = await context.client.readContract({
        abi: context.contracts.LendingCore.abi,
        address: context.contracts.LendingCore.address,
        functionName: "prices",
        args: [token],
      });

      // Destructure tuple: [price, timestamp, valid]
      const [priceValue, timestampValue, valid] = priceData;

      if (valid && priceValue > 0n) {
        await context.db
          .insert(price)
          .values({
            token: token as `0x${string}`,
            price: priceValue,
            timestamp: Number(timestampValue),
            updatedAt: blockTimestamp,
          })
          .onConflictDoUpdate((row) => ({
            price: priceValue,
            timestamp: Number(timestampValue),
            updatedAt: blockTimestamp,
          }));
      }
    } catch (err) {
      console.error("Failed to sync price state:", err);
    }
  }
});

ponder.on("LendingCore:PositionUpdated", async ({ event, context }) => {
  const { user, token, positionHash } = event.args;
  const blockTimestamp = Number(event.block.timestamp);

  // Position table uses composite primary key (user, token)
  // Use Store API find with composite key
  const foundPosition = await context.db.find(position, { user, token });

  if (foundPosition) {
    // Update existing position using Store API
    await context.db
      .update(position, { user, token })
      .set({
        positionHash,
        updatedAt: blockTimestamp,
      });
  } else {
    // Insert new position
    await context.db.insert(position).values({
      user,
      token,
      positionHash,
      updatedAt: blockTimestamp,
    });
  }
});

ponder.on("LendingCore:PriceUpdated", async ({ event, context }) => {
  const { token, price: priceValue, timestamp } = event.args;
  const blockTimestamp = Number(event.block.timestamp);

  await context.db
    .insert(price)
    .values({
      token,
      price: priceValue,
      timestamp: Number(timestamp),
      updatedAt: blockTimestamp,
    })
    .onConflictDoUpdate((row) => ({
      price: priceValue,
      timestamp: Number(timestamp),
      updatedAt: blockTimestamp,
    }));
});
