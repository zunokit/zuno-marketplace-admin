/**
 * Accept Invitation Use Case
 * Handles invitation acceptance and creates organization membership
 */

import type { IMemberRepository } from '@/lib/core/domain/interfaces/member.repository.interface'
import type { IInvitationRepository } from '@/lib/core/domain/interfaces/invitation.repository.interface'
import type { MemberEntity } from '@/lib/core/domain/entities/member.entity'
import { NotFoundError, ValidationError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'
import {
  verifyInvitationToken,
  isInvitationExpired,
} from '@/lib/utils/invitation-token'

interface AcceptInvitationInput {
  invitationId: string
  token: string
  userId: string
  userEmail: string
}

export class AcceptInvitationUseCase {
  constructor(
    private memberRepository: IMemberRepository,
    private invitationRepository: IInvitationRepository
  ) {}

  async execute(input: AcceptInvitationInput): Promise<MemberEntity> {
    const { invitationId, token, userId, userEmail } = input

    // Get invitation
    const invitation = await this.invitationRepository.findById(invitationId)

    if (!invitation) {
      throw new NotFoundError('Invitation not found')
    }

    // Verify invitation token
    if (!verifyInvitationToken(token, invitation.token)) {
      logger.warn('Invalid invitation token attempt', {
        invitationId,
        userId,
      })
      throw new ValidationError('Invalid invitation token')
    }

    // Check if invitation has expired
    if (isInvitationExpired(invitation.expiresAt)) {
      // Mark invitation as expired
      await this.invitationRepository.updateStatus(invitationId, 'expired')

      logger.warn('Expired invitation access attempt', {
        invitationId,
        userId,
        expiresAt: invitation.expiresAt,
      })
      throw new ValidationError('This invitation has expired')
    }

    // Check if invitation status is pending
    if (invitation.status !== 'pending') {
      throw new ValidationError(
        `This invitation has already been ${invitation.status}`
      )
    }

    // Verify invited email matches current user's email
    if (userEmail !== invitation.email) {
      logger.warn('Email mismatch in invitation acceptance', {
        invitationId,
        userId,
        invitationEmail: invitation.email,
        userEmail,
      })
      throw new ValidationError(
        'This invitation was sent to a different email address'
      )
    }

    // Check if user is already a member
    const existingMember = await this.memberRepository.findByUserAndOrganization(
      userId,
      invitation.organizationId
    )

    if (existingMember) {
      // Update invitation status to accepted
      await this.invitationRepository.updateStatus(invitationId, 'accepted')

      throw new ValidationError('You are already a member of this organization')
    }

    // Create member record
    const newMember = await this.memberRepository.create({
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role,
    })

    // Update invitation status to accepted
    await this.invitationRepository.updateStatus(invitationId, 'accepted')

    logger.info('User accepted invitation', {
      invitationId,
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role,
    })

    return newMember
  }
}
