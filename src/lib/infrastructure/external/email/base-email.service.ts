/**
 * Base Email Service
 * Abstract base class implementing common email service functionality
 */

import {
  IEmailService,
  EmailOptions,
  EmailResponse,
} from '@/lib/core/domain/interfaces/email.service.interface'
import { logger } from '@/lib/utils/logger'

export abstract class BaseEmailService implements IEmailService {
  protected defaultFrom: string

  constructor(defaultFrom?: string) {
    this.defaultFrom = defaultFrom || process.env.EMAIL_FROM || 'noreply@example.com'
  }

  /**
   * Abstract method to be implemented by concrete email services
   */
  abstract sendEmail(options: EmailOptions): Promise<EmailResponse>

  /**
   * Abstract method to check configuration
   */
  abstract isConfigured(): boolean

  /**
   * Abstract method to get provider name
   */
  abstract getProviderName(): string

  /**
   * Send email with error handling and logging
   */
  async send(options: EmailOptions): Promise<EmailResponse> {
    try {
      // Validate options
      this.validateEmailOptions(options)

      // Set default from address if not provided
      const emailOptions: EmailOptions = {
        ...options,
        from: options.from || this.defaultFrom,
      }

      // Check if service is configured
      if (!this.isConfigured()) {
        const error = `${this.getProviderName()} email service is not properly configured`
        logger.error(error)
        return {
          success: false,
          error,
        }
      }

      // Log email attempt
      logger.info(`Sending email via ${this.getProviderName()}`, {
        to: emailOptions.to,
        subject: emailOptions.subject,
      })

      // Send email using concrete implementation
      const response = await this.sendEmail(emailOptions)

      if (response.success) {
        logger.info(`Email sent successfully via ${this.getProviderName()}`, {
          messageId: response.messageId,
          to: emailOptions.to,
        })
      } else {
        logger.error(`Failed to send email via ${this.getProviderName()}`, null, {
          error: response.error,
          to: emailOptions.to,
        })
      }

      return response
    } catch (error) {
      logger.error('Email sending failed with exception', error, {
        provider: this.getProviderName(),
        to: options.to,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate email options
   */
  protected validateEmailOptions(options: EmailOptions): void {
    if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) {
      throw new Error('Email recipient (to) is required')
    }

    if (!options.subject || options.subject.trim() === '') {
      throw new Error('Email subject is required')
    }

    if (!options.html || options.html.trim() === '') {
      throw new Error('Email HTML content is required')
    }
  }

  /**
   * Normalize email recipient to string
   */
  protected normalizeRecipient(to: string | string[]): string {
    return Array.isArray(to) ? to.join(', ') : to
  }
}
