/**
 * Encryption Utility
 * Encrypts sensitive data like database connection strings
 * Uses AES-256-GCM encryption
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { logger } from './logger'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 64

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables')
  }

  // Key should be 32 bytes (64 hex characters) for AES-256
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)')
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encrypt sensitive data (e.g., database URLs)
 * Returns: {encrypted}:{iv}:{authTag}:{salt}
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const salt = randomBytes(SALT_LENGTH)

    const cipher = createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Combine: encrypted:iv:authTag:salt (all hex encoded)
    const combined = [
      encrypted,
      iv.toString('hex'),
      authTag.toString('hex'),
      salt.toString('hex'),
    ].join(':')

    logger.debug('Data encrypted successfully')

    return combined
  } catch (error) {
    logger.error('Encryption failed', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt encrypted data
 * Input format: {encrypted}:{iv}:{authTag}:{salt}
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()

    // Split the combined string
    const parts = encryptedData.split(':')
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format')
    }

    const [encrypted, ivHex, authTagHex, saltHex] = parts

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    logger.debug('Data decrypted successfully')

    return decrypted
  } catch (error) {
    logger.error('Decryption failed', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Check if a string appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
  const parts = data.split(':')
  return parts.length === 4 && parts.every((part) => /^[0-9a-f]+$/i.test(part))
}

/**
 * Generate a new encryption key (for initial setup)
 * Returns a 32-byte (256-bit) key as hex string
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}
