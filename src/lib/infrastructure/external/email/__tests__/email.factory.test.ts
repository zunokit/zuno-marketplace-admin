/**
 * Email Factory Tests
 * Test email service factory and provider auto-detection
 */

import { EmailServiceFactory } from '../email.factory'
import { MailpitSmtpService } from '../mailpit-smtp.service'
import { ResendService } from '../resend.service'

describe('EmailServiceFactory', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment and factory instance before each test
    jest.resetModules()
    process.env = { ...originalEnv }
    EmailServiceFactory.reset()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('create', () => {
    it('should create Mailpit service when provider is mailpit', () => {
      const service = EmailServiceFactory.create('mailpit')
      expect(service).toBeInstanceOf(MailpitSmtpService)
      expect(service.getProviderName()).toBe('Mailpit SMTP')
    })

    it('should create Resend service when provider is resend', () => {
      const service = EmailServiceFactory.create('resend')
      expect(service).toBeInstanceOf(ResendService)
      expect(service.getProviderName()).toBe('Resend')
    })

    it('should cache service instance', () => {
      const service1 = EmailServiceFactory.create('mailpit')
      const service2 = EmailServiceFactory.getInstance()
      expect(service1).toBe(service2)
    })
  })

  describe('autoDetectProvider - development', () => {
    it('should use Mailpit in development environment', () => {
      process.env.NODE_ENV = 'development'
      const service = EmailServiceFactory.create('auto')
      expect(service.getProviderName()).toBe('Mailpit SMTP')
    })

    it('should respect EMAIL_PROVIDER=mailpit override', () => {
      process.env.NODE_ENV = 'production'
      process.env.EMAIL_PROVIDER = 'mailpit'
      const service = EmailServiceFactory.create('auto')
      expect(service.getProviderName()).toBe('Mailpit SMTP')
    })
  })

  describe('autoDetectProvider - production', () => {
    it('should use Resend in production with API key', () => {
      process.env.NODE_ENV = 'production'
      process.env.RESEND_API_KEY = 're_test_key'
      const service = EmailServiceFactory.create('auto')
      expect(service.getProviderName()).toBe('Resend')
    })

    it('should fallback to Mailpit in production without API key', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.RESEND_API_KEY
      const service = EmailServiceFactory.create('auto')
      expect(service.getProviderName()).toBe('Mailpit SMTP')
    })

    it('should respect EMAIL_PROVIDER=resend override', () => {
      process.env.NODE_ENV = 'development'
      process.env.EMAIL_PROVIDER = 'resend'
      process.env.RESEND_API_KEY = 're_test_key'
      const service = EmailServiceFactory.create('auto')
      expect(service.getProviderName()).toBe('Resend')
    })
  })

  describe('getInstance', () => {
    it('should create and return instance', () => {
      const service = EmailServiceFactory.getInstance()
      expect(service).toBeDefined()
    })

    it('should return cached instance', () => {
      const service1 = EmailServiceFactory.getInstance()
      const service2 = EmailServiceFactory.getInstance()
      expect(service1).toBe(service2)
    })
  })

  describe('reset', () => {
    it('should clear cached instance', () => {
      const service1 = EmailServiceFactory.getInstance()
      EmailServiceFactory.reset()
      const service2 = EmailServiceFactory.getInstance()
      expect(service1).not.toBe(service2)
    })
  })
})
