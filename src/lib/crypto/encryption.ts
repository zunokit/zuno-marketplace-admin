import crypto from 'crypto'

/**
 * Encryption configuration
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits

/**
 * Get encryption key from environment variables
 */
function getEncryptionKey(): Buffer {
  const key = process.env.PROJECT_ENCRYPTION_KEY
  if (!key) {
    throw new Error('PROJECT_ENCRYPTION_KEY environment variable is not set')
  }

  // Use PBKDF2 to derive a proper key from the environment variable
  return crypto.pbkdf2Sync(key, 'salt', 100000, ENCRYPTION_KEY_LENGTH, 'sha256')
}

/**
 * Encrypt sensitive data (database URLs)
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, key)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Combine IV and encrypted data
    const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex')])

    return combined.toString('base64')
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypt sensitive data (database URLs)
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedData, 'base64')

    const encrypted = combined.slice(IV_LENGTH)

    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, key)

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Hash sensitive identifiers for audit logs
 */
export function hashSensitiveData(data: string): string {
  const key = getEncryptionKey()
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}

/**
 * Generate secure random ID
 */
export function generateSecureId(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Verify encryption key is available
 */
export function verifyEncryptionSetup(): boolean {
  try {
    getEncryptionKey()
    return true
  } catch {
    return false
  }
}