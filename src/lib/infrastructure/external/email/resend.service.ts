/**
 * Resend Email Service
 * Production email service using Resend API
 * https://resend.com/docs
 */

import { Resend } from 'resend'
import { BaseEmailService } from './base-email.service'
import {
  EmailOptions,
  EmailResponse,
} from '@/lib/core/domain/interfaces/email.service.interface'
import { logger } from '@/lib/utils/logger'

export class ResendService extends BaseEmailService {
  private resend: Resend | null = null
  private apiKey: string | undefined

  constructor() {
    super()

    this.apiKey = process.env.RESEND_API_KEY

    if (this.apiKey) {
      this.initializeResend()
    } else {
      logger.warn('Resend API key not found in environment variables')
    }
  }

  /**
   * Initialize Resend client
   */
  private initializeResend(): void {
    try {
      if (!this.apiKey) {
        throw new Error('Resend API key is required')
      }

      this.resend = new Resend(this.apiKey)
      logger.info('Resend email service initialized')
    } catch (error) {
      logger.error('Failed to initialize Resend email service', error)
      this.resend = null
    }
  }

  /**
   * Check if Resend service is configured
   */
  isConfigured(): boolean {
    return this.resend !== null && this.apiKey !== undefined
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'Resend'
  }

  /**
   * Send email via Resend API
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    if (!this.resend) {
      return {
        success: false,
        error: 'Resend client not initialized',
      }
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from!,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      })

      if (error) {
        logger.error('Resend API error', null, { error })
        return {
          success: false,
          error: error.message || 'Resend API error',
        }
      }

      return {
        success: true,
        messageId: data?.id,
      }
    } catch (error) {
      logger.error('Resend send failed', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Resend error',
      }
    }
  }
}
