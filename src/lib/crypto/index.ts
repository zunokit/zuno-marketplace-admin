/**
 * Cryptography Module
 * Modern encryption utilities using AES-256-GCM
 * Provides secure encryption for sensitive data like database URLs
 */

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync, createHmac } from 'crypto';
import { logger } from '@/lib/utils/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32; // 256 bits
const PBKDF2_ITERATIONS = 100000;

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Get encryption password from environment
 */
function getEncryptionPassword(): string {
  const password = process.env.ENCRYPTION_KEY;
  if (!password) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  return password;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns encrypted data in format: salt:iv:authTag:encrypted (all hex)
 *
 * @param plaintext - Data to encrypt
 * @returns Encrypted data string
 * @throws Error if encryption fails
 *
 * @example
 * const encrypted = encrypt('postgresql://user:pass@host/db');
 * // Returns: "abc123...:def456...:ghi789...:jkl012..."
 */
export function encrypt(plaintext: string): string {
  try {
    const password = getEncryptionPassword();
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    const key = deriveKey(password, salt);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    const combined = [
      salt.toString('hex'),
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted,
    ].join(':');

    logger.debug('Data encrypted successfully');
    return combined;
  } catch (error) {
    logger.error('Encryption failed', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt AES-256-GCM encrypted data
 * Expects data in format: salt:iv:authTag:encrypted
 *
 * @param encryptedData - Encrypted data string
 * @returns Decrypted plaintext
 * @throws Error if decryption fails or data format is invalid
 *
 * @example
 * const decrypted = decrypt('abc123...:def456...:ghi789...:jkl012...');
 * // Returns: "postgresql://user:pass@host/db"
 */
export function decrypt(encryptedData: string): string {
  try {
    const password = getEncryptionPassword();
    const parts = encryptedData.split(':');

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, authTagHex, encrypted] = parts;

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const key = deriveKey(password, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    logger.debug('Data decrypted successfully');
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a string appears to be encrypted
 *
 * @param data - String to check
 * @returns true if data matches encrypted format
 */
export function isEncrypted(data: string): boolean {
  const parts = data.split(':');
  return parts.length === 4 && parts.every((part) => /^[0-9a-f]+$/i.test(part));
}

/**
 * Generate a new encryption key for initial setup
 * Returns a 32-byte (256-bit) key as hex string
 *
 * @returns 64-character hex string (32 bytes)
 *
 * @example
 * const key = generateEncryptionKey();
 * // Returns: "a1b2c3d4e5f6..." (64 hex characters)
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Generate secure random ID
 * Useful for creating unique identifiers
 *
 * @returns 32-character hex string (16 bytes)
 *
 * @example
 * const id = generateSecureId();
 * // Returns: "a1b2c3d4e5f6..." (32 hex characters)
 */
export function generateSecureId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Hash sensitive data for audit logs
 * Uses HMAC-SHA256 with encryption key
 *
 * @param data - Data to hash
 * @returns Hashed data as hex string
 *
 * @example
 * const hash = hashSensitiveData('user@example.com');
 * // Returns: "a1b2c3..." (64 hex characters)
 */
export function hashSensitiveData(data: string): string {
  const password = getEncryptionPassword();
  const salt = randomBytes(32);
  const key = deriveKey(password, salt);
  return createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Verify encryption setup is valid
 * Checks if ENCRYPTION_KEY environment variable is set
 *
 * @returns true if encryption is properly configured
 */
export function verifyEncryptionSetup(): boolean {
  try {
    getEncryptionPassword();
    return true;
  } catch {
    return false;
  }
}
