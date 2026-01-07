/**
 * Email Service Factory
 * Factory pattern to create appropriate email service based on environment
 * Auto-detects environment and switches between Mailpit (dev) and Resend (prod)
 */

import { IEmailService } from '@/lib/core/domain/interfaces/email.service.interface'
import { MailpitSmtpService } from './mailpit-smtp.service'
import { ResendService } from './resend.service'
import { logger } from '@/lib/utils/logger'

export type EmailProvider = 'mailpit' | 'resend' | 'auto'

export class EmailServiceFactory {
  private static instance: IEmailService | null = null

  /**
   * Create email service based on environment
   */
  static create(provider: EmailProvider = 'auto'): IEmailService {
    // Return cached instance if exists
    if (this.instance) {
      return this.instance
    }

    let emailService: IEmailService

    if (provider === 'auto') {
      emailService = this.autoDetectProvider()
    } else if (provider === 'mailpit') {
      emailService = new MailpitSmtpService()
    } else {
      emailService = new ResendService()
    }

    // Cache the instance
    this.instance = emailService

    logger.info(`Email service initialized: ${emailService.getProviderName()}`, {
      provider,
      configured: emailService.isConfigured(),
    })

    return emailService
  }

  /**
   * Auto-detect email provider based on environment
   */
  private static autoDetectProvider(): IEmailService {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const hasResendKey = !!process.env.RESEND_API_KEY
    const forceProvider = process.env.EMAIL_PROVIDER as EmailProvider | undefined

    // Check if user explicitly set a provider
    if (forceProvider === 'mailpit') {
      logger.info('Using Mailpit SMTP (forced via EMAIL_PROVIDER)')
      return new MailpitSmtpService()
    }

    if (forceProvider === 'resend') {
      logger.info('Using Resend (forced via EMAIL_PROVIDER)')
      return new ResendService()
    }

    // Auto-detect based on environment
    if (isDevelopment) {
      logger.info('Using Mailpit SMTP (development environment)')
      return new MailpitSmtpService()
    }

    // Production: use Resend if configured, fallback to Mailpit
    if (hasResendKey) {
      logger.info('Using Resend (production environment with API key)')
      return new ResendService()
    }

    logger.warn('No Resend API key found, falling back to Mailpit SMTP')
    return new MailpitSmtpService()
  }

  /**
   * Reset cached instance (useful for testing)
   */
  static reset(): void {
    this.instance = null
  }

  /**
   * Get current email service instance
   */
  static getInstance(): IEmailService {
    if (!this.instance) {
      this.instance = this.create()
    }
    return this.instance
  }
}

/**
 * Helper function to get email service
 */
export function getEmailService(): IEmailService {
  return EmailServiceFactory.getInstance()
}
