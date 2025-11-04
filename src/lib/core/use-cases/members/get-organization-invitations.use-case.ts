/**
 * Get Organization Invitations Use Case
 * Retrieves pending invitations for an organization
 */

import type { IMemberRepository } from '@/lib/core/domain/interfaces/member.repository.interface'
import type { IInvitationRepository } from '@/lib/core/domain/interfaces/invitation.repository.interface'
import type { InvitationWithInviterDetails } from '@/lib/core/domain/entities/invitation.entity'
import { ForbiddenError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'
import type { ProjectRole } from '@/types/domain.types'

export class GetOrganizationInvitationsUseCase {
  constructor(
    private memberRepository: IMemberRepository,
    private invitationRepository: IInvitationRepository
  ) {}

  async execute(
    organizationId: string,
    userId: string
  ): Promise<InvitationWithInviterDetails[]> {
    // Check if user is admin/owner of this organization
    const userMembership = await this.memberRepository.findByUserAndOrganization(
      userId,
      organizationId
    )

    if (!userMembership || !this.canManageInvitations(userMembership.role)) {
      logger.warn('User attempted to view invitations without proper permissions', {
        userId,
        organizationId,
        userRole: userMembership?.role,
      })
      throw new ForbiddenError('Only admins and owners can view invitations')
    }

    const invitations = await this.invitationRepository.findPendingByOrganization(organizationId)

    logger.info('Retrieved organization invitations', {
      organizationId,
      invitationCount: invitations.length,
      requestedBy: userId,
    })

    return invitations
  }

  private canManageInvitations(role: ProjectRole): boolean {
    return ['owner', 'admin'].includes(role)
  }
}
