import { toBytes, encodeAbiParameters, type Hex, type Address } from 'viem';
import { X25519DeoxysII } from '@oasisprotocol/sapphire-paratime';
import { CONTRACTS } from './constants';

/**
 * Encrypt plaintext payload using Sapphire X25519DeoxysII encryption
 * @param plaintext - Plaintext bytes to encrypt
 * @param publicKey - LendingCore public key (32-byte hex string)
 * @returns Encrypted envelope bytes and sender public key
 */
export function encodeEnvelope(
  plaintext: Uint8Array,
  publicKey: string
): { envelopeBytes: Uint8Array; senderPublicKeyBytes: Uint8Array } {
  // Validate public key
  if (!publicKey || !publicKey.startsWith('0x')) {
    throw new Error('Public key must be a hex string starting with 0x');
  }

  const pubKeyBytes = toBytes(publicKey as Hex);
  if (pubKeyBytes.length !== 32) {
    throw new Error(`Invalid public key length: ${pubKeyBytes.length}, expected 32`);
  }

  // Create ephemeral cipher
  const cipher = X25519DeoxysII.ephemeral(pubKeyBytes);
  const { nonce, ciphertext } = cipher.encrypt(plaintext);

  // Helper to convert Uint8Array to Hex
  const bytesToHex = (bytes: Uint8Array): Hex => {
    return `0x${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}` as Hex;
  };

  // Ensure nonce is 16 bytes
  let nonceBytes = toBytes(bytesToHex(nonce));
  if (nonceBytes.length === 15) {
    const padded = new Uint8Array(16);
    padded.set(nonceBytes, 0);
    nonceBytes = padded;
  }
  if (nonceBytes.length !== 16) {
    throw new Error(`Unexpected nonce length: ${nonceBytes.length}, expected 16`);
  }

  // Get sender public key
  const senderPublicKeyBytes = toBytes(bytesToHex(cipher.publicKey));
  if (senderPublicKeyBytes.length !== 32) {
    throw new Error(
      `Invalid sender pubkey length: ${senderPublicKeyBytes.length}, expected 32`
    );
  }

  const envelope = {
    senderPublicKey: bytesToHex(senderPublicKeyBytes),
    nonce: bytesToHex(nonceBytes),
    ciphertext: bytesToHex(ciphertext),
  };

  // Encode envelope using viem
  const encodedEnvelope = encodeAbiParameters(
    [
      {
        type: 'tuple',
        components: [
          { name: 'senderPublicKey', type: 'bytes32' },
          { name: 'nonce', type: 'bytes16' },
          { name: 'ciphertext', type: 'bytes' },
        ],
      },
    ],
    [envelope]
  );

  return {
    envelopeBytes: toBytes(encodedEnvelope),
    senderPublicKeyBytes,
  };
}

/**
 * Encode action payload to plaintext bytes
 * @param payload - Action payload object
 * @returns Encoded plaintext bytes
 */
export interface ActionPayload {
  actionType: number; // 0=SUPPLY, 1=BORROW, 2=REPAY, 3=WITHDRAW, 4=LIQUIDATE
  token: Address; // Token address (address(0) for native)
  amount: bigint;
  onBehalf: Address; // User address
  depositId: Hex; // Deposit ID (bytes32)
  isNative: boolean;
  memo: Hex; // Optional memo bytes
}

export function encodeActionPayload(payload: ActionPayload): Uint8Array {
  const encoded = encodeAbiParameters(
    [
      {
        type: 'tuple',
        components: [
          { name: 'actionType', type: 'uint8' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'onBehalf', type: 'address' },
          { name: 'depositId', type: 'bytes32' },
          { name: 'isNative', type: 'bool' },
          { name: 'memo', type: 'bytes' },
        ],
      },
    ],
    [payload]
  );
  return toBytes(encoded);
}

/**
 * Encrypt action payload for submission to LendingCore
 * @param payload - Action payload
 * @param publicKey - LendingCore public key (optional, uses default from constants)
 * @returns Encrypted envelope bytes ready for submitAction()
 */
export function encryptAction(
  payload: ActionPayload,
  publicKey?: string
): Uint8Array {
  const pubKey = publicKey || CONTRACTS.LENDING_PUBLIC_KEY;
  if (!pubKey) {
    throw new Error('LendingCore public key not configured');
  }

  const plaintext = encodeActionPayload(payload);
  const { envelopeBytes } = encodeEnvelope(plaintext, pubKey);
  return envelopeBytes;
}

/**
 * Action types enum
 */
export enum ActionType {
  SUPPLY = 0,
  BORROW = 1,
  REPAY = 2,
  WITHDRAW = 3,
  LIQUIDATE = 4,
}

