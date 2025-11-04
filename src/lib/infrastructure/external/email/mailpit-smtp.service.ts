/**
 * Mailpit SMTP Email Service
 * Development email service using Mailpit for testing
 * Mailpit is a local SMTP server for testing emails
 */

import nodemailer, { Transporter } from 'nodemailer'
import { BaseEmailService } from './base-email.service'
import {
  EmailOptions,
  EmailResponse,
} from '@/lib/core/domain/interfaces/email.service.interface'
import { logger } from '@/lib/utils/logger'

export class MailpitSmtpService extends BaseEmailService {
  private transporter: Transporter | null = null
  private host: string
  private port: number
  private user?: string
  private pass?: string

  constructor() {
    super()

    // Mailpit default configuration
    this.host = process.env.SMTP_HOST || 'localhost'
    this.port = parseInt(process.env.SMTP_PORT || '1025', 10)
    this.user = process.env.SMTP_USER
    this.pass = process.env.SMTP_PASS

    this.initializeTransporter()
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: false, // Mailpit doesn't use TLS
        auth: this.user && this.pass ? {
          user: this.user,
          pass: this.pass,
        } : undefined,
        // Disable TLS for local development
        tls: {
          rejectUnauthorized: false,
        },
      })

      logger.info('Mailpit SMTP transporter initialized', {
        host: this.host,
        port: this.port,
      })
    } catch (error) {
      logger.error('Failed to initialize Mailpit SMTP transporter', error)
      this.transporter = null
    }
  }

  /**
   * Check if SMTP service is configured
   */
  isConfigured(): boolean {
    return this.transporter !== null
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'Mailpit SMTP'
  }

  /**
   * Send email via Mailpit SMTP
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'SMTP transporter not initialized',
      }
    }

    try {
      const info = await this.transporter.sendMail({
        from: options.from,
        to: this.normalizeRecipient(options.to),
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      })

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      logger.error('Mailpit SMTP send failed', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMTP error',
      }
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false
    }

    try {
      await this.transporter.verify()
      logger.info('Mailpit SMTP connection verified')
      return true
    } catch (error) {
      logger.error('Mailpit SMTP connection verification failed', error)
      return false
    }
  }
}
