import crypto from 'crypto';

import getConfig from '@/common/config';
import getLogger from '@/common/logger';

const authLogger = getLogger().child({ module: 'encryption' });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // For GCM, this is 12 bytes
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 32 bytes = 256 bits

interface ICryptoError extends Error {
  code?: string;
}

function getSecretKey(): string {
  const secret = getConfig().ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required');
  }
  return secret;
}

// Generate a key from the secret using PBKDF2
function getKey(secret: string): Buffer {
  // Use a fixed salt for consistent encryption/decryption
  const salt = Buffer.from('spendflix-auth-salt', 'utf8');
  const ITERATIONS = 100000;
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

export function encrypt(text: string): string {
  authLogger.debug('Starting password encryption');
  return encryptData(text);
}

// eslint-disable-next-line max-lines-per-function
function encryptData(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey(getSecretKey());
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine IV, tag, and encrypted data
    const result = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');

    authLogger.debug('Password encrypted successfully');
    return result;
  } catch (error: unknown) {
    const cryptoError = error as ICryptoError;
    authLogger.error(
      {
        error: {
          name: cryptoError?.name,
          message: cryptoError?.message,
          stack: cryptoError?.stack,
          code: cryptoError?.code,
        },
      },
      'Failed to encrypt password',
    );
    throw error;
  }
}

export function decrypt(encryptedText: string): string {
  authLogger.debug('Starting password decryption');
  return decryptData(encryptedText);
}

// eslint-disable-next-line max-lines-per-function
function decryptData(encryptedText: string): string {
  const buffer = Buffer.from(encryptedText, 'base64');
  if (buffer.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error(
      `Invalid encrypted data length: ${buffer.length} (expected at least ${IV_LENGTH + TAG_LENGTH})`,
    );
  }

  // Extract IV, tag, and encrypted data
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
  const key = getKey(getSecretKey());
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  const result = decrypted.toString('utf8');
  authLogger.debug('Password decrypted successfully');

  return result;
}
