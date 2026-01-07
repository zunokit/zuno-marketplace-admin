/**
 * Revoke Invitation Use Case
 * Handles revoking a pending invitation
 */

import type { IMemberRepository } from '@/lib/core/domain/interfaces/member.repository.interface'
import type { IInvitationRepository } from '@/lib/core/domain/interfaces/invitation.repository.interface'
import type { ProjectRole } from '@/types/domain.types'
import { ForbiddenError, NotFoundError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'
import { isSuperAdmin } from '@/lib/auth/permissions'

interface RevokeInvitationInput {
  invitationId: string
  requesterId: string
}

export class RevokeInvitationUseCase {
  constructor(
    private memberRepository: IMemberRepository,
    private invitationRepository: IInvitationRepository
  ) {}

  async execute(input: RevokeInvitationInput): Promise<void> {
    // Get the invitation
    const invitation = await this.invitationRepository.findById(input.invitationId)

    if (!invitation) {
      throw new NotFoundError('Invitation not found')
    }

    // Super admins can manage any organization
    const isAdmin = await isSuperAdmin(input.requesterId)
    
    if (!isAdmin) {
      // Check if requester is admin/owner of this organization
      const requesterMembership = await this.memberRepository.findByUserAndOrganization(
        input.requesterId,
        invitation.organizationId
      )

      if (!requesterMembership || !this.canRevokeInvitations(requesterMembership.role)) {
        logger.warn('User attempted to revoke invitation without proper permissions', {
          requesterId: input.requesterId,
          invitationId: input.invitationId,
          requesterRole: requesterMembership?.role,
        })
        throw new ForbiddenError('Only admins and owners can revoke invitations')
      }
    }

    // Delete the invitation
    await this.invitationRepository.delete(input.invitationId)

    logger.info('Revoked organization invitation', {
      invitationId: input.invitationId,
      organizationId: invitation.organizationId,
      revokedBy: input.requesterId,
    })
  }

  private canRevokeInvitations(role: ProjectRole): boolean {
    return ['owner', 'admin'].includes(role)
  }
}
