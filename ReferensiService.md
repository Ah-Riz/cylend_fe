supply 
```
import { ethers } from "hardhat";
import { encodeEnvelope, getSigner, parseCommon, TokenType } from "./utils";

const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

async function main() {
  const { ingress, destinationDomain, pubKey, tokenType, tokenAddress, decimals } =
    parseCommon();
  const amountInput = process.env.AMOUNT;
  if (!amountInput) throw new Error("Set AMOUNT");

  const amount = ethers.parseUnits(amountInput, decimals);
  if (amount === 0n) throw new Error("Amount must be > 0");

  const signer = await getSigner();
  const sender = await signer.getAddress();
  // Ambil nonce pending sekali di awal, lalu kelola manual supaya tidak bentrok
  let nextNonce = await signer.getNonce("pending");

  const contract = await ethers.getContractAt(
    "PrivateLendingIngress",
    ingress,
    signer
  );

  let depositId: string;

  if (tokenType === "native") {
    const tx = await contract.depositNative({ value: amount, nonce: nextNonce++ });
    const rcpt = await tx.wait();
    const logs = rcpt?.logs ?? [];
    const ev = logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "DepositCreated";
      } catch {
        return false;
      }
    });
    if (!ev) throw new Error("DepositCreated event not found");
    const parsed = contract.interface.parseLog(ev as any);
    if (!parsed) throw new Error("Failed to parse DepositCreated log");
    depositId = parsed.args.depositId;
    console.log(`Deposit native ok. depositId=${depositId}`);
  } else {
    const token = await ethers.getContractAt(erc20Abi, tokenAddress as string, signer);
    const allowance = await token.allowance(sender, ingress);
    if (allowance < amount) {
      const approveTx = await token.approve(ingress, amount, { nonce: nextNonce++ });
      await approveTx.wait();
    }
    const tx = await contract.depositErc20(tokenAddress as string, amount, {
      nonce: nextNonce++,
    });
    const rcpt = await tx.wait();
    const logs = rcpt?.logs ?? [];
    const ev = logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "DepositCreated";
      } catch {
        return false;
      }
    });
    if (!ev) throw new Error("DepositCreated event not found");
    const parsed = contract.interface.parseLog(ev as any);
    if (!parsed) throw new Error("Failed to parse DepositCreated log");
    depositId = parsed.args.depositId;
    console.log(`Deposit erc20 ok. depositId=${depositId}`);
  }

  // Build payload: ActionType.SUPPLY = 0
  const payload = {
    actionType: 0,
    token: tokenType === "native" ? ethers.ZeroAddress : (tokenAddress as string),
    amount,
    onBehalf: sender,
    depositId,
    isNative: tokenType === "native",
    memo: ethers.toUtf8Bytes(process.env.PRIVATE_MEMO ?? ""),
  };

  const plaintext = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "tuple(uint8 actionType,address token,uint256 amount,address onBehalf,bytes32 depositId,bool isNative,bytes memo)",
    ],
    [payload]
  );

  const { envelopeBytes } = encodeEnvelope(ethers.getBytes(plaintext), pubKey);
  
  // submitAction returns actionId, but we need to call it and wait for receipt to get the value
  // Since we can't easily get return value from transaction, we'll get it from event/mapping
  const tx2 = await contract.submitAction(destinationDomain, depositId, envelopeBytes, {
    nonce: nextNonce++,
  });
  console.log(`submitAction tx: ${tx2.hash}`);
  const receipt2 = await tx2.wait();
  
  // Get actionId from event EncryptedActionReceived -> lookup ciphertextHashToActionId
  const logs = receipt2?.logs ?? [];
  let actionId: string | null = null;
  
  const ev = logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "EncryptedActionReceived";
    } catch {
      return false;
    }
  });
  
  if (ev) {
    const parsed = contract.interface.parseLog(ev as any);
    if (parsed) {
      const encryptedDataHash = parsed.args.encryptedDataHash;
      actionId = await contract.ciphertextHashToActionId(encryptedDataHash);
    }
  }
  
  if (actionId) {
    console.log(`✅ Action ID: ${actionId}`);
    console.log(`\nTo process this action on Sapphire, run:`);
    console.log(`CORE_ADDRESS=0x... ACTION_ID=${actionId} npx hardhat run scripts/privatelending/service/processAction.ts --network sapphireTestnet`);
  } else {
    console.log(`⚠️  Could not get ACTION_ID automatically.`);
    console.log(`   You can get it by querying Ingress.ciphertextHashToActionId(encryptedDataHash) on Mantle,`);
    console.log(`   or by listening to EncryptedActionStored event on Sapphire.`);
  }
  
  console.log("Supply action dispatched.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

borrow
```
import { ethers } from "hardhat";
import { encodeEnvelope, getSigner, parseCommon } from "./utils";

async function main() {
  const { ingress, destinationDomain, pubKey, tokenType, tokenAddress, decimals } =
    parseCommon();
  const amountInput = process.env.AMOUNT;
  const depositId = process.env.DEPOSIT_ID as string;
  const onBehalf = process.env.ON_BEHALF;
  if (!amountInput) throw new Error("Set AMOUNT");
  if (!depositId) throw new Error("Set DEPOSIT_ID (collateral deposit)");

  const amount = ethers.parseUnits(amountInput, decimals);
  if (amount === 0n) throw new Error("Amount must be > 0");

  const signer = await getSigner();
  const sender = await signer.getAddress();

  const contract = await ethers.getContractAt(
    "PrivateLendingIngress",
    ingress,
    signer
  );

  // Basic off-chain checks
  const dep = await contract.deposits(depositId);
  if (dep.depositor.toLowerCase() !== sender.toLowerCase()) {
    throw new Error(`Deposit belongs to ${dep.depositor}, not ${sender}`);
  }
  if (dep.released) throw new Error("Deposit already released");
  if (dep.isNative !== (tokenType === "native"))
    throw new Error("Deposit type mismatch");
  if (!dep.isNative && tokenAddress && dep.token.toLowerCase() !== tokenAddress.toLowerCase()) {
    throw new Error("Deposit token mismatch");
  }

  const resolvedOnBehalf = onBehalf && onBehalf !== "" ? onBehalf : sender;
  if (!ethers.isAddress(resolvedOnBehalf)) {
    throw new Error(`Invalid ON_BEHALF address: ${resolvedOnBehalf}`);
  }

  const payload = {
    actionType: 1, // BORROW
    token: tokenType === "native" ? ethers.ZeroAddress : (tokenAddress as string),
    amount,
    onBehalf: resolvedOnBehalf,
    depositId,
    isNative: tokenType === "native",
    memo: ethers.toUtf8Bytes(process.env.PRIVATE_MEMO ?? ""),
  };

  const plaintext = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "tuple(uint8 actionType,address token,uint256 amount,address onBehalf,bytes32 depositId,bool isNative,bytes memo)",
    ],
    [payload]
  );

  const { envelopeBytes } = encodeEnvelope(ethers.getBytes(plaintext), pubKey);
  
  // submitAction returns actionId, but we need to call it and wait for receipt to get the value
  // Since we can't easily get return value from transaction, we'll get it from event/mapping
  const tx = await contract.submitAction(destinationDomain, depositId, envelopeBytes);
  console.log(`submitAction borrow tx: ${tx.hash}`);
  const receipt = await tx.wait();
  
  // Get actionId from event EncryptedActionReceived -> lookup ciphertextHashToActionId
  const logs = receipt?.logs ?? [];
  let actionId: string | null = null;
  
  const ev = logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "EncryptedActionReceived";
    } catch {
      return false;
    }
  });
  
  if (ev) {
    const parsed = contract.interface.parseLog(ev as any);
    if (parsed) {
      const encryptedDataHash = parsed.args.encryptedDataHash;
      actionId = await contract.ciphertextHashToActionId(encryptedDataHash);
    }
  }
  
  if (actionId) {
    console.log(`✅ Action ID: ${actionId}`);
    console.log(`\nTo process this action on Sapphire, run:`);
    console.log(`CORE_ADDRESS=0x... ACTION_ID=${actionId} npx hardhat run scripts/privatelending/service/processAction.ts --network sapphireTestnet`);
  } else {
    console.log(`⚠️  Could not get ACTION_ID automatically.`);
    console.log(`   You can get it by querying Ingress.ciphertextHashToActionId(encryptedDataHash) on Mantle,`);
    console.log(`   or by listening to EncryptedActionStored event on Sapphire.`);
  }
  
  console.log("Borrow action dispatched (release will happen after Sapphire check).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

withdraw
```
import { ethers } from "hardhat";
import { encodeEnvelope, getSigner, parseCommon } from "./utils";

async function main() {
  const { ingress, destinationDomain, pubKey, tokenType, tokenAddress, decimals } =
    parseCommon();
  const amountInput = process.env.AMOUNT;
  const depositId = process.env.DEPOSIT_ID as string;
  const onBehalf = process.env.ON_BEHALF;
  if (!amountInput) throw new Error("Set AMOUNT");
  if (!depositId) throw new Error("Set DEPOSIT_ID (collateral bucket)");

  const amount = ethers.parseUnits(amountInput, decimals);
  if (amount === 0n) throw new Error("Amount must be > 0");

  const signer = await getSigner();
  const sender = await signer.getAddress();

  const contract = await ethers.getContractAt(
    "PrivateLendingIngress",
    ingress,
    signer
  );

  // Off-chain check: ensure deposit owner
  const dep = await contract.deposits(depositId);
  if (dep.depositor.toLowerCase() !== sender.toLowerCase()) {
    throw new Error(`Deposit belongs to ${dep.depositor}, not ${sender}`);
  }
  if (dep.released) throw new Error("Deposit already released");

  const resolvedOnBehalf = onBehalf && onBehalf !== "" ? onBehalf : sender;
  if (!ethers.isAddress(resolvedOnBehalf)) {
    throw new Error(`Invalid ON_BEHALF address: ${resolvedOnBehalf}`);
  }

  const payload = {
    actionType: 3, // WITHDRAW
    token: tokenType === "native" ? ethers.ZeroAddress : (tokenAddress as string),
    amount,
    onBehalf: resolvedOnBehalf,
    depositId,
    isNative: tokenType === "native",
    memo: ethers.toUtf8Bytes(process.env.PRIVATE_MEMO ?? ""),
  };

  const plaintext = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "tuple(uint8 actionType,address token,uint256 amount,address onBehalf,bytes32 depositId,bool isNative,bytes memo)",
    ],
    [payload]
  );

  const { envelopeBytes } = encodeEnvelope(ethers.getBytes(plaintext), pubKey);
  const tx = await contract.submitAction(destinationDomain, depositId, envelopeBytes);
  console.log(`submitAction withdraw tx: ${tx.hash}`);
  const receipt = await tx.wait();
  
  // Get actionId from event EncryptedActionReceived -> lookup ciphertextHashToActionId
  const logs = receipt?.logs ?? [];
  let actionId: string | null = null;
  
  const ev = logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "EncryptedActionReceived";
    } catch {
      return false;
    }
  });
  
  if (ev) {
    const parsed = contract.interface.parseLog(ev as any);
    if (parsed) {
      const encryptedDataHash = parsed.args.encryptedDataHash;
      actionId = await contract.ciphertextHashToActionId(encryptedDataHash);
    }
  }
  
  if (actionId) {
    console.log(`✅ Action ID: ${actionId}`);
    console.log(`\nTo process this action on Sapphire, run:`);
    console.log(`CORE_ADDRESS=0x... ACTION_ID=${actionId} npx hardhat run scripts/privatelending/service/processAction.ts --network sapphireTestnet`);
  } else {
    console.log(`⚠️  Could not get ACTION_ID automatically.`);
  }
  
  console.log("Withdraw action dispatched (release after Sapphire check).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Repay
```
import { ethers } from "hardhat";
import { encodeEnvelope, getSigner, parseCommon } from "./utils";

const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

async function main() {
  const { ingress, destinationDomain, pubKey, tokenType, tokenAddress, decimals } =
    parseCommon();
  const amountInput = process.env.AMOUNT;
  const depositId = process.env.DEPOSIT_ID as string;
  const onBehalf = process.env.ON_BEHALF;
  if (!amountInput) throw new Error("Set AMOUNT");
  if (!depositId) throw new Error("Set DEPOSIT_ID (repay uses same deposit bucket)");

  const amount = ethers.parseUnits(amountInput, decimals);
  if (amount === 0n) throw new Error("Amount must be > 0");

  const signer = await getSigner();
  const sender = await signer.getAddress();

  const contract = await ethers.getContractAt(
    "PrivateLendingIngress",
    ingress,
    signer
  );

  if (tokenType === "native") {
    const tx = await contract.depositNative({ value: amount });
    await tx.wait();
  } else {
    const token = await ethers.getContractAt(erc20Abi, tokenAddress as string, signer);
    const allowance = await token.allowance(sender, ingress);
    if (allowance < amount) {
      const approveTx = await token.approve(ingress, amount);
      await approveTx.wait();
    }
    const tx = await contract.depositErc20(tokenAddress as string, amount);
    await tx.wait();
  }

  const resolvedOnBehalf = onBehalf && onBehalf !== "" ? onBehalf : sender;
  if (!ethers.isAddress(resolvedOnBehalf)) {
    throw new Error(`Invalid ON_BEHALF address: ${resolvedOnBehalf}`);
  }

  const payload = {
    actionType: 2, // REPAY
    token: tokenType === "native" ? ethers.ZeroAddress : (tokenAddress as string),
    amount,
    onBehalf: resolvedOnBehalf,
    depositId,
    isNative: tokenType === "native",
    memo: ethers.toUtf8Bytes(process.env.PRIVATE_MEMO ?? ""),
  };

  const plaintext = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "tuple(uint8 actionType,address token,uint256 amount,address onBehalf,bytes32 depositId,bool isNative,bytes memo)",
    ],
    [payload]
  );

  const { envelopeBytes } = encodeEnvelope(ethers.getBytes(plaintext), pubKey);
  const tx2 = await contract.submitAction(destinationDomain, depositId, envelopeBytes);
  console.log(`submitAction repay tx: ${tx2.hash}`);
  const receipt2 = await tx2.wait();
  
  // Get actionId from event EncryptedActionReceived -> lookup ciphertextHashToActionId
  const logs = receipt2?.logs ?? [];
  let actionId: string | null = null;
  
  const ev = logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "EncryptedActionReceived";
    } catch {
      return false;
    }
  });
  
  if (ev) {
    const parsed = contract.interface.parseLog(ev as any);
    if (parsed) {
      const encryptedDataHash = parsed.args.encryptedDataHash;
      actionId = await contract.ciphertextHashToActionId(encryptedDataHash);
    }
  }
  
  if (actionId) {
    console.log(`✅ Action ID: ${actionId}`);
    console.log(`\nTo process this action on Sapphire, run:`);
    console.log(`CORE_ADDRESS=0x... ACTION_ID=${actionId} npx hardhat run scripts/privatelending/service/processAction.ts --network sapphireTestnet`);
  } else {
    console.log(`⚠️  Could not get ACTION_ID automatically.`);
  }
  
  console.log("Repay action dispatched.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

utils
```
import { ethers } from "hardhat";
import { X25519DeoxysII } from "@oasisprotocol/sapphire-paratime";

export type TokenType = "native" | "erc20";

export function parseCommon() {
  const ingress = process.env.INGRESS_ADDRESS as string;
  const destinationDomain = Number(process.env.SAPPHIRE_DOMAIN ?? "23295");
  const pubKey = process.env.LENDING_PUBLIC_KEY;
  const tokenType = (process.env.TOKEN_TYPE ?? "native").toLowerCase() as TokenType;
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const decimals = Number(
    process.env.TOKEN_DECIMALS ?? (tokenType === "native" ? "18" : "6")
  );

  if (!ingress) throw new Error("Set INGRESS_ADDRESS env var");
  if (!pubKey || !ethers.isHexString(pubKey, 32)) {
    throw new Error("Set LENDING_PUBLIC_KEY (32-byte hex from LendingCore.vaultPublicKey)");
  }
  if (tokenType !== "native" && tokenType !== "erc20") {
    throw new Error("TOKEN_TYPE must be native or erc20");
  }
  if (tokenType === "erc20" && !tokenAddress) {
    throw new Error("Set TOKEN_ADDRESS for erc20");
  }
  if (Number.isNaN(decimals)) throw new Error("Invalid TOKEN_DECIMALS");

  return { ingress, destinationDomain, pubKey, tokenType, tokenAddress, decimals };
}

export function encodeEnvelope(plaintext: Uint8Array, pubKey: string) {
  const cipher = X25519DeoxysII.ephemeral(ethers.getBytes(pubKey));
  const { nonce, ciphertext } = cipher.encrypt(plaintext);

  let nonceBytes = ethers.getBytes(nonce);
  if (nonceBytes.length === 15) {
    const padded = new Uint8Array(16);
    padded.set(nonceBytes, 0);
    nonceBytes = padded;
  }
  if (nonceBytes.length !== 16) {
    throw new Error(`Unexpected nonce length: ${nonceBytes.length}`);
  }

  const senderPublicKeyBytes = ethers.getBytes(cipher.publicKey);
  if (senderPublicKeyBytes.length !== 32) {
    throw new Error(`Invalid sender pubkey length: ${senderPublicKeyBytes.length}`);
  }

  const envelope = {
    senderPublicKey: senderPublicKeyBytes,
    nonce: nonceBytes,
    ciphertext,
  };

  const encodedEnvelope = ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(bytes32 senderPublicKey, bytes16 nonce, bytes ciphertext)"],
    [envelope]
  );

  return { envelopeBytes: ethers.getBytes(encodedEnvelope), senderPublicKeyBytes };
}

export async function getSigner() {
  const signerPk =
    process.env.TESTER_PRIVATE_KEY ||
    process.env.PRIVATE_KEY_2 ||
    process.env.SENDER_PRIVATE_KEY ||
    process.env.PRIVATE_KEY;
  const signer = signerPk
    ? new ethers.Wallet(signerPk, ethers.provider)
    : await ethers.provider.getSigner();
  return signer;
}
```

updatepricefromrofloracle
```
import { ethers } from "hardhat";

async function main() {
  const coreAddress = process.env.CORE_ADDRESS as string;
  const token = process.env.TOKEN_ADDRESS as string || ethers.ZeroAddress; // Default to native

  if (!coreAddress) {
    throw new Error("Set CORE_ADDRESS env var.");
  }

  const contract = await ethers.getContractAt("LendingCore", coreAddress);
  const signer = await ethers.provider.getSigner();
  const signerAddress = await signer.getAddress();

  console.log(`\n=== Update Price from ROFL Oracle ===`);
  console.log(`LendingCore: ${coreAddress}`);
  console.log(`Token: ${token}`);
  console.log(`Signer: ${signerAddress}`);

  // Check if ROFL Oracle is set
  const roflOracle = await contract.roflOracles(token);
  if (roflOracle === ethers.ZeroAddress) {
    throw new Error(`ROFL Oracle not set for token ${token}. Set it first with setRoflOracle.`);
  }
  console.log(`ROFL Oracle: ${roflOracle}`);

  // Query ROFL Oracle directly to show current observation
  try {
    const roflOracleContract = await ethers.getContractAt(
      ["function getLastObservation() external view returns (uint128 value, uint block)"],
      roflOracle
    );
    const [value, blockNum] = await roflOracleContract.getLastObservation();
    console.log(`\n=== ROFL Oracle Observation ===`);
    console.log(`Value: ${value.toString()}`);
    console.log(`Block: ${blockNum.toString()}`);
    console.log(`Current Block: ${await ethers.provider.getBlockNumber()}`);
    
    // Check if observation is fresh (within 10 blocks as per ROFL Oracle pattern)
    const currentBlock = await ethers.provider.getBlockNumber();
    if (currentBlock > blockNum + 10) {
      console.warn(`⚠️  Warning: Observation is stale (${currentBlock - blockNum} blocks old)`);
    }
  } catch (error: any) {
    console.warn(`⚠️  Could not query ROFL Oracle directly: ${error.message}`);
  }

  try {
    console.log(`\nUpdating price from ROFL Oracle...`);
    const tx = await contract.updatePriceFromRoflOracle(token);
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Price updated from ROFL Oracle`);
  } catch (error: any) {
    console.error(`❌ Failed to update from ROFL Oracle: ${error.message}`);
    throw error;
  }

  // Show updated price
  const priceData = await contract.prices(token);
  console.log(`\n=== Updated Price ===`);
  console.log(`Price: ${ethers.formatUnits(priceData.price, 8)} USD`);
  console.log(`Timestamp: ${new Date(Number(priceData.timestamp) * 1000).toISOString()}`);
  console.log(`Valid: ${priceData.valid}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

setrofloracle
```
import { ethers } from "hardhat";

async function main() {
  const coreAddress = process.env.CORE_ADDRESS as string;
  const token = process.env.TOKEN_ADDRESS as string || ethers.ZeroAddress; // Default to native
  const roflOracle = process.env.ROFL_ORACLE_ADDRESS as string;

  if (!coreAddress) {
    throw new Error("Set CORE_ADDRESS env var.");
  }
  if (!roflOracle) {
    throw new Error("Set ROFL_ORACLE_ADDRESS env var.");
  }

  const contract = await ethers.getContractAt("LendingCore", coreAddress);
  const signer = await ethers.provider.getSigner();
  const signerAddress = await signer.getAddress();
  const owner = await contract.owner();

  console.log(`\n=== Set ROFL Oracle ===`);
  console.log(`LendingCore: ${coreAddress}`);
  console.log(`Token: ${token}`);
  console.log(`ROFL Oracle: ${roflOracle}`);
  console.log(`Signer: ${signerAddress}`);
  console.log(`Owner: ${owner}`);
  console.log(`Is Signer Owner: ${signerAddress.toLowerCase() === owner.toLowerCase()}`);

  if (signerAddress.toLowerCase() !== owner.toLowerCase()) {
    throw new Error("Only owner can set ROFL Oracle");
  }

  try {
    const tx = await contract.setRoflOracle(token, roflOracle);
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ ROFL Oracle set for token ${token}`);
    
    // Verify
    const setOracle = await contract.roflOracles(token);
    console.log(`\n=== Verification ===`);
    console.log(`ROFL Oracle for token ${token}: ${setOracle}`);
    if (setOracle.toLowerCase() !== roflOracle.toLowerCase()) {
      throw new Error("ROFL Oracle not set correctly");
    }
  } catch (error: any) {
    console.error(`❌ Failed to set ROFL Oracle: ${error.message}`);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

processactions
```
import { ethers } from "hardhat";

async function main() {
  const coreAddress = process.env.CORE_ADDRESS as string;
  const actionId = process.env.ACTION_ID as string;

  if (!coreAddress || !actionId) {
    throw new Error("Set CORE_ADDRESS and ACTION_ID env vars.");
  }

  const contract = await ethers.getContractAt("LendingCore", coreAddress);
  const signer = await ethers.provider.getSigner();
  const signerAddress = await signer.getAddress();
  const owner = await contract.owner();

  console.log(`\n=== Pre-flight Checks ===`);
  console.log(`LendingCore: ${coreAddress}`);
  console.log(`Action ID: ${actionId}`);
  console.log(`Signer: ${signerAddress}`);
  console.log(`Owner: ${owner}`);
  console.log(`Is Signer Owner: ${signerAddress.toLowerCase() === owner.toLowerCase()}`);

  // Check action exists
  const action = await contract.encryptedActions(actionId);
  console.log(`\nAction exists: ${action.envelope.ciphertext.length > 0}`);
  console.log(`Already processed: ${action.processed}`);
  console.log(`Origin Domain: ${action.originDomain}`);
  console.log(`Origin Router: ${ethers.hexlify(action.originRouter)}`);

  if (action.processed) {
    throw new Error("Action already processed!");
  }

  if (action.envelope.ciphertext.length === 0) {
    throw new Error("Action not found! Make sure relayer has forwarded the message from Mantle.");
  }

  // Try to decrypt and check token config before processing
  try {
    console.log(`\nPre-check: Attempting to decrypt payload...`);
    // Try static call to see if decrypt works
    await contract.processAction.staticCall(actionId, { value: 0 });
  } catch (preCheckError: any) {
    console.log(`\n⚠️  Pre-check failed: ${preCheckError.message}`);
    
    // Try to decode revert reason
    if (preCheckError.data) {
      try {
        const decoded = contract.interface.parseError(preCheckError.data);
        console.log(`Revert reason: ${decoded?.name} - ${decoded?.args}`);
      } catch {
        // Try to get reason from error message
        if (preCheckError.reason) {
          console.log(`Revert reason: ${preCheckError.reason}`);
        } else if (preCheckError.message) {
          // Check common error messages
          const msg = preCheckError.message.toLowerCase();
          if (msg.includes("token not enabled")) {
            console.log(`\n❌ Token not configured! Run configureToken first:`);
            console.log(`   npx hardhat console --network sapphireTestnet`);
            console.log(`   > await core.configureToken(tokenAddress, ltv, liquidationThreshold, borrowRate, supplyRate)`);
          } else if (msg.includes("decrypt")) {
            console.log(`\n❌ Decrypt failed! Check if LENDING_PUBLIC_KEY matches LendingCore's public key.`);
          }
        }
      }
    }
    
    // Don't throw yet, try to get more info
  }

  // Estimate gas first
  try {
    console.log(`\nEstimating gas...`);
    const gasEstimate = await contract.processAction.estimateGas(actionId, {
      value: 0,
    });
    console.log(`✅ Gas estimate: ${gasEstimate.toString()}`);
  } catch (estimateError: any) {
    console.log(`❌ Gas estimation failed: ${estimateError.message}`);
    if (estimateError.reason) {
      console.log(`Reason: ${estimateError.reason}`);
    }
    if (estimateError.data) {
      console.log(`Error data: ${estimateError.data}`);
      // Try to decode error
      try {
        const decoded = contract.interface.parseError(estimateError.data);
        console.log(`Decoded error: ${decoded?.name} - ${decoded?.args}`);
      } catch {}
    }
    throw estimateError;
  }

  console.log(`\nSending transaction...`);
  const tx = await contract.processAction(actionId as `0x${string}`, {
    value: 0,
  });
  console.log(`Transaction hash: ${tx.hash}`);
  console.log(`Waiting for confirmation...`);
  
  let receipt;
  try {
    receipt = await tx.wait();
  } catch (waitError: any) {
    console.log(`\n❌ Transaction reverted!`);
    console.log(`Hash: ${tx.hash}`);
    
    // Try to get revert reason from receipt
    if (waitError.receipt) {
      receipt = waitError.receipt;
    }
    
    // Try to call static to get revert reason
    try {
      await contract.processAction.staticCall(actionId, { value: 0 });
    } catch (staticError: any) {
      if (staticError.data) {
        try {
          const decoded = contract.interface.parseError(staticError.data);
          console.log(`\nRevert reason: ${decoded?.name}`);
          if (decoded?.args && decoded.args.length > 0) {
            console.log(`Args: ${decoded.args.join(", ")}`);
          }
        } catch {
          if (staticError.reason) {
            console.log(`\nRevert reason: ${staticError.reason}`);
          } else if (staticError.message) {
            const msg = staticError.message.toLowerCase();
            if (msg.includes("token not enabled")) {
              console.log(`\n❌ Token not configured!`);
              console.log(`   Run: npx hardhat console --network sapphireTestnet`);
              console.log(`   > await core.configureToken(tokenAddress, 7500, 8000, 1000, 500)`);
            } else if (msg.includes("decrypt")) {
              console.log(`\n❌ Decrypt failed! Check LENDING_PUBLIC_KEY.`);
            } else {
              console.log(`\nError: ${staticError.message}`);
            }
          }
        }
      }
    }
    
    throw waitError;
  }
  
  if (receipt?.status === 1) {
    console.log(`✅ Action processed! Release instruction dispatched in tx ${receipt?.hash}`);
    
    // Try to get processed payload info
    try {
      const payload = await contract.processedPayloads(actionId);
      console.log(`\n=== Processed Action Info ===`);
      console.log(`Action Type: ${payload.actionType} (0=SUPPLY, 1=BORROW, 2=REPAY, 3=WITHDRAW, 4=LIQUIDATE)`);
      console.log(`Token: ${payload.token}`);
      console.log(`Amount: ${payload.amount.toString()}`);
      console.log(`On Behalf: ${payload.onBehalf}`);
      console.log(`Deposit ID: ${payload.depositId}`);
    } catch (e) {
      console.log(`Could not fetch processed payload: ${(e as Error).message}`);
    }
  } else {
    throw new Error(`Transaction failed with status ${receipt?.status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

getactionid
```
import { ethers } from "hardhat";

async function main() {
  const ingressAddress = process.env.INGRESS_ADDRESS as string;
  const txHash = process.env.TX_HASH as string;

  if (!ingressAddress || !txHash) {
    throw new Error("Set INGRESS_ADDRESS and TX_HASH env vars.");
  }

  const contract = await ethers.getContractAt(
    "PrivateLendingIngress",
    ingressAddress
  );

  console.log(`\n=== Get Action ID from Transaction ===`);
  console.log(`Ingress: ${ingressAddress}`);
  console.log(`Transaction Hash: ${txHash}`);

  const receipt = await ethers.provider.getTransactionReceipt(txHash);
  if (!receipt) {
    throw new Error(`Transaction not found: ${txHash}`);
  }

  const logs = receipt.logs ?? [];
  const ev = logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "EncryptedActionReceived";
    } catch {
      return false;
    }
  });

  if (!ev) {
    throw new Error("EncryptedActionReceived event not found in transaction");
  }

  const parsed = contract.interface.parseLog(ev as any);
  if (!parsed) {
    throw new Error("Failed to parse EncryptedActionReceived log");
  }

  const encryptedDataHash = parsed.args.encryptedDataHash;
  const actionId = await contract.ciphertextHashToActionId(encryptedDataHash);

  console.log(`\n✅ Action ID: ${actionId}`);
  console.log(`\nTo process this action on Sapphire, run:`);
  console.log(`CORE_ADDRESS=0x... ACTION_ID=${actionId} npx hardhat run scripts/privatelending/service/processAction.ts --network sapphireTestnet`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```