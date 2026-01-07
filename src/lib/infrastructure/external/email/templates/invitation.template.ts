/**
 * Invitation Email Template
 * Email template for organization/project invitations
 */

import { baseEmailTemplate } from './base.template'

export interface InvitationEmailProps {
  inviteeName?: string
  inviterName: string
  organizationName: string
  role: string
  invitationUrl: string
  expiresInDays: number
}

export function invitationEmailTemplate(props: InvitationEmailProps): {
  html: string
  text: string
  subject: string
} {
  const {
    inviteeName,
    inviterName,
    organizationName,
    role,
    invitationUrl,
    expiresInDays,
  } = props

  const greeting = inviteeName ? `Hi ${inviteeName},` : 'Hi there,'

  const roleDescriptions: Record<string, string> = {
    owner: 'full access to all features and settings',
    admin: 'ability to manage members and data',
    editor: 'ability to view and edit data',
    viewer: 'read-only access to view data',
  }

  const roleDescription = roleDescriptions[role] || 'access to the project'

  const content = `
    <p style="font-size: 16px; margin-bottom: 20px;">${greeting}</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong>
      with <strong>${role}</strong> role (${roleDescription}).
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Click the button below to accept the invitation and get started:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationUrl}" class="email-button" style="display: inline-block; padding: 14px 28px; margin: 20px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <p style="font-size: 14px; color: #666666; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all; margin-top: 10px;">
      ${invitationUrl}
    </p>

    <div class="divider" style="height: 1px; background-color: #e0e0e0; margin: 30px 0;"></div>

    <p style="font-size: 14px; color: #666666; margin-top: 30px;">
      <strong>Important:</strong> This invitation will expire in ${expiresInDays} ${expiresInDays === 1 ? 'day' : 'days'}.
    </p>

    <p style="font-size: 14px; color: #666666; margin-top: 20px;">
      If you did not expect this invitation, you can safely ignore this email.
    </p>
  `

  const html = baseEmailTemplate({
    title: `You're invited to ${organizationName}`,
    content,
  })

  const text = `
${greeting}

${inviterName} has invited you to join ${organizationName} with ${role} role (${roleDescription}).

Click the link below to accept the invitation:
${invitationUrl}

This invitation will expire in ${expiresInDays} ${expiresInDays === 1 ? 'day' : 'days'}.

If you did not expect this invitation, you can safely ignore this email.
  `.trim()

  const subject = `You're invited to join ${organizationName}`

  return {
    html,
    text,
    subject,
  }
}
