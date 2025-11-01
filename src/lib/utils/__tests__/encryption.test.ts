/**
 * Encryption Utility Tests
 * Tests for AES-256-GCM encryption/decryption
 */

import { encrypt, decrypt, generateEncryptionKey } from '../encryption'

describe('Encryption Utility', () => {
  describe('generateEncryptionKey', () => {
    it('should generate a valid 64-character hex key', () => {
      const key = generateEncryptionKey()
      expect(key).toHaveLength(64)
      expect(key).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should generate different keys on each call', () => {
      const key1 = generateEncryptionKey()
      const key2 = generateEncryptionKey()
      expect(key1).not.toBe(key2)
    })
  })

  describe('encrypt and decrypt', () => {
    const testData = [
      { name: 'simple string', value: 'hello world' },
      { name: 'database URL', value: 'postgresql://user:pass@localhost:5432/db' },
      { name: 'long string', value: 'a'.repeat(1000) },
      { name: 'special characters', value: '!@#$%^&*()_+-={}[]|:";\'<>?,./~`' },
      { name: 'unicode characters', value: '你好世界 مرحبا العالم' },
      { name: 'empty string', value: '' },
    ]

    testData.forEach(({ name, value }) => {
      it(`should encrypt and decrypt ${name}`, () => {
        const encrypted = encrypt(value)

        // Encrypted should be different from original
        expect(encrypted).not.toBe(value)

        // Encrypted should be a non-empty string
        expect(encrypted).toBeTruthy()
        expect(typeof encrypted).toBe('string')

        // Should decrypt back to original
        const decrypted = decrypt(encrypted)
        expect(decrypted).toBe(value)
      })
    })

    it('should produce different ciphertext for same plaintext (IV randomization)', () => {
      const plaintext = 'test data'
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)

      // Different ciphertexts due to random IV
      expect(encrypted1).not.toBe(encrypted2)

      // But both decrypt to same plaintext
      expect(decrypt(encrypted1)).toBe(plaintext)
      expect(decrypt(encrypted2)).toBe(plaintext)
    })

    it('should throw error when decrypting invalid data', () => {
      expect(() => decrypt('invalid-encrypted-data')).toThrow()
    })

    it('should throw error when decrypting tampered data', () => {
      const encrypted = encrypt('test data')

      // Tamper with the encrypted data
      const tampered = encrypted.slice(0, -5) + 'xxxxx'

      expect(() => decrypt(tampered)).toThrow()
    })

    it('should handle null and undefined by throwing', () => {
      expect(() => encrypt(null as unknown as string)).toThrow()
      expect(() => encrypt(undefined as unknown as string)).toThrow()
      expect(() => decrypt(null as unknown as string)).toThrow()
      expect(() => decrypt(undefined as unknown as string)).toThrow()
    })
  })

  describe('encryption key validation', () => {
    const originalKey = process.env.ENCRYPTION_KEY

    afterEach(() => {
      process.env.ENCRYPTION_KEY = originalKey
    })

    it('should throw error if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY')
    })

    it('should throw error if ENCRYPTION_KEY is invalid length', () => {
      process.env.ENCRYPTION_KEY = 'short'

      expect(() => encrypt('test')).toThrow()
    })
  })

  describe('format validation', () => {
    it('should produce base64url encoded output', () => {
      const encrypted = encrypt('test data')

      // Base64url characters (no +, /, or =)
      expect(encrypted).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('should handle base64url padding correctly', () => {
      const testStrings = [
        'a',
        'ab',
        'abc',
        'abcd',
        'abcde',
      ]

      testStrings.forEach((str) => {
        const encrypted = encrypt(str)
        const decrypted = decrypt(encrypted)
        expect(decrypted).toBe(str)
      })
    })
  })
})
