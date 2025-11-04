/**
 * Invite User Use Case
 * Handles inviting a user to an organization
 */

import { db } from '@/lib/db'
import { user as userTable, organization as organizationTable } from '@/lib/infrastructure/database/schemas'
import { eq } from 'drizzle-orm'
import type { IMemberRepository } from '@/lib/core/domain/interfaces/member.repository.interface'
import type { IInvitationRepository } from '@/lib/core/domain/interfaces/invitation.repository.interface'
import type { IEmailService } from '@/lib/core/domain/interfaces/email.service.interface'
import type { InvitationEntity } from '@/lib/core/domain/entities/invitation.entity'
import type { ProjectRole } from '@/types/domain.types'
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'
import {
  generateInvitationToken,
  hashInvitationToken,
  generateInvitationUrl,
  calculateExpirationDate,
} from '@/lib/utils/invitation-token'
import { invitationEmailTemplate } from '@/lib/infrastructure/external/email/templates'

interface InviteUserInput {
  organizationId: string
  email: string
  role: ProjectRole
  inviterId: string
  inviterName: string
}

export class InviteUserUseCase {
  constructor(
    private memberRepository: IMemberRepository,
    private invitationRepository: IInvitationRepository,
    private emailService: IEmailService
  ) {}

  async execute(input: InviteUserInput): Promise<InvitationEntity> {
    // Check if inviter is admin/owner of this organization
    const inviterMembership = await this.memberRepository.findByUserAndOrganization(
      input.inviterId,
      input.organizationId
    )

    if (!inviterMembership || !this.canInviteUsers(inviterMembership.role)) {
      logger.warn('User attempted to invite without proper permissions', {
        userId: input.inviterId,
        organizationId: input.organizationId,
        userRole: inviterMembership?.role,
      })
      throw new ForbiddenError('Only admins and owners can invite users')
    }

    // Get organization details
    const organization = await db.query.organization.findFirst({
      where: eq(organizationTable.id, input.organizationId),
    })

    if (!organization) {
      throw new NotFoundError('Organization not found')
    }

    // Check if user is already a member
    const existingUserResult = await db
      .select({ userId: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, input.email))
      .limit(1)

    if (existingUserResult.length > 0) {
      const existingMember = await this.memberRepository.findByUserAndOrganization(
        existingUserResult[0].userId,
        input.organizationId
      )

      if (existingMember) {
        throw new ValidationError('User is already a member of this organization')
      }
    }

    // Check if there's a pending invitation
    const existingInvitation = await this.invitationRepository.findPendingByEmailAndOrganization(
      input.email,
      input.organizationId
    )

    if (existingInvitation) {
      throw new ValidationError('An invitation has already been sent to this email')
    }

    // Generate secure invitation token
    const token = generateInvitationToken()
    const tokenHash = hashInvitationToken(token)

    // Create invitation (expires in 7 days)
    const expiresAt = calculateExpirationDate(7)

    const invitation = await this.invitationRepository.create({
      organizationId: input.organizationId,
      email: input.email,
      role: input.role,
      inviterId: input.inviterId,
      token: tokenHash,
      expiresAt,
    })

    logger.info('Created organization invitation', {
      invitationId: invitation.id,
      organizationId: input.organizationId,
      email: input.email,
      role: input.role,
      inviterId: input.inviterId,
    })

    // Generate invitation URL
    const invitationUrl = generateInvitationUrl(invitation.id, token)

    // Send invitation email
    const { html, text, subject } = invitationEmailTemplate({
      inviterName: input.inviterName,
      organizationName: organization.name,
      role: input.role,
      invitationUrl,
      expiresInDays: 7,
    })

    const emailResult = await this.emailService.send({
      to: input.email,
      subject,
      html,
      text,
    })

    if (!emailResult.success) {
      logger.error('Failed to send invitation email', emailResult.error, {
        invitationId: invitation.id,
        email: input.email,
      })

      // Delete invitation if email failed to send
      await this.invitationRepository.delete(invitation.id)

      throw new Error('Failed to send invitation email. Please check email service configuration.')
    }

    logger.info('Invitation email sent successfully', {
      invitationId: invitation.id,
      email: input.email,
      messageId: emailResult.messageId,
    })

    return invitation
  }

  private canInviteUsers(role: ProjectRole): boolean {
    return ['owner', 'admin'].includes(role)
  }
}
