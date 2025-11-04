/**
 * Email Service Interface
 * Abstraction for email sending functionality using Strategy Pattern
 */

export interface EmailOptions {
  to: string | string[]
  from?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

export interface IEmailService {
  /**
   * Send an email
   */
  send(options: EmailOptions): Promise<EmailResponse>

  /**
   * Check if the email service is properly configured
   */
  isConfigured(): boolean

  /**
   * Get the name of the email service provider
   */
  getProviderName(): string
}
