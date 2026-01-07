/**
 * Invitation Token Utilities Tests
 * Test token generation, hashing, and validation
 */

import {
  generateInvitationToken,
  hashInvitationToken,
  verifyInvitationToken,
  generateInvitationUrl,
  isInvitationExpired,
  calculateExpirationDate,
} from '../invitation-token'

describe('Invitation Token Utilities', () => {
  describe('generateInvitationToken', () => {
    it('should generate a URL-safe token', () => {
      const token = generateInvitationToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
      // URL-safe base64 shouldn't contain +, /, or =
      expect(token).not.toMatch(/[+/=]/)
    })

    it('should generate unique tokens', () => {
      const token1 = generateInvitationToken()
      const token2 = generateInvitationToken()
      expect(token1).not.toBe(token2)
    })

    it('should generate tokens with consistent length', () => {
      const token1 = generateInvitationToken()
      const token2 = generateInvitationToken()
      expect(token1.length).toBe(token2.length)
    })
  })

  describe('hashInvitationToken', () => {
    it('should hash a token consistently', () => {
      const token = 'test-token-123'
      const hash1 = hashInvitationToken(token)
      const hash2 = hashInvitationToken(token)
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashInvitationToken('token1')
      const hash2 = hashInvitationToken('token2')
      expect(hash1).not.toBe(hash2)
    })

    it('should produce hex string hash', () => {
      const token = 'test-token'
      const hash = hashInvitationToken(token)
      expect(hash).toMatch(/^[a-f0-9]+$/)
    })

    it('should produce fixed-length SHA-256 hash (64 chars)', () => {
      const token = 'test-token'
      const hash = hashInvitationToken(token)
      expect(hash.length).toBe(64) // SHA-256 = 32 bytes = 64 hex chars
    })
  })

  describe('verifyInvitationToken', () => {
    it('should verify correct token against its hash', () => {
      const token = generateInvitationToken()
      const hash = hashInvitationToken(token)
      expect(verifyInvitationToken(token, hash)).toBe(true)
    })

    it('should reject incorrect token', () => {
      const token = 'correct-token'
      const wrongToken = 'wrong-token'
      const hash = hashInvitationToken(token)
      expect(verifyInvitationToken(wrongToken, hash)).toBe(false)
    })

    it('should reject token with incorrect hash', () => {
      const token = generateInvitationToken()
      const wrongHash = hashInvitationToken('different-token')
      expect(verifyInvitationToken(token, wrongHash)).toBe(false)
    })
  })

  describe('generateInvitationUrl', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    it('should generate URL with invitation ID and token', () => {
      process.env.BETTER_AUTH_URL = 'https://example.com'
      const invitationId = 'inv-123'
      const token = 'token-abc'
      const url = generateInvitationUrl(invitationId, token)
      expect(url).toBe('https://example.com/invite/accept?id=inv-123&token=token-abc')
    })

    it('should use default localhost when BETTER_AUTH_URL is not set', () => {
      delete process.env.BETTER_AUTH_URL
      const invitationId = 'inv-456'
      const token = 'token-xyz'
      const url = generateInvitationUrl(invitationId, token)
      expect(url).toBe('http://localhost:3000/invite/accept?id=inv-456&token=token-xyz')
    })

    it('should properly encode query parameters', () => {
      process.env.BETTER_AUTH_URL = 'https://example.com'
      const invitationId = 'inv 123' // Space
      const token = 'token+abc' // Plus
      const url = generateInvitationUrl(invitationId, token)
      expect(url).toContain('id=inv 123')
      expect(url).toContain('token=token+abc')
    })
  })

  describe('isInvitationExpired', () => {
    it('should return false for future date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(isInvitationExpired(futureDate)).toBe(false)
    })

    it('should return true for past date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(isInvitationExpired(pastDate)).toBe(true)
    })

    it('should return true for current time (edge case)', () => {
      const now = new Date()
      // Subtract 1ms to ensure it's in the past
      now.setMilliseconds(now.getMilliseconds() - 1)
      expect(isInvitationExpired(now)).toBe(true)
    })
  })

  describe('calculateExpirationDate', () => {
    it('should calculate future date correctly', () => {
      const days = 7
      const expiresAt = calculateExpirationDate(days)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() + days)

      // Check if dates are close (within 1 second)
      const diff = Math.abs(expiresAt.getTime() - expectedDate.getTime())
      expect(diff).toBeLessThan(1000)
    })

    it('should handle 0 days', () => {
      const expiresAt = calculateExpirationDate(0)
      const now = new Date()
      const diff = Math.abs(expiresAt.getTime() - now.getTime())
      expect(diff).toBeLessThan(1000)
    })

    it('should handle 30 days', () => {
      const days = 30
      const expiresAt = calculateExpirationDate(days)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() + days)

      const diff = Math.abs(expiresAt.getTime() - expectedDate.getTime())
      expect(diff).toBeLessThan(1000)
    })
  })

  describe('Integration - Full invitation token flow', () => {
    it('should complete full token lifecycle', () => {
      // 1. Generate token
      const token = generateInvitationToken()
      expect(token).toBeDefined()

      // 2. Hash token for storage
      const hash = hashInvitationToken(token)
      expect(hash).toBeDefined()

      // 3. Verify token later
      const isValid = verifyInvitationToken(token, hash)
      expect(isValid).toBe(true)

      // 4. Generate invitation URL
      const invitationId = 'test-inv-123'
      const url = generateInvitationUrl(invitationId, token)
      expect(url).toContain(invitationId)
      expect(url).toContain(token)

      // 5. Calculate expiration
      const expiresAt = calculateExpirationDate(7)
      expect(isInvitationExpired(expiresAt)).toBe(false)
    })
  })
})
