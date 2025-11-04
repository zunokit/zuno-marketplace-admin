/**
 * Remove Member Use Case
 * Handles removing a member from an organization
 */

import type { IMemberRepository } from '@/lib/core/domain/interfaces/member.repository.interface'
import type { ProjectRole } from '@/types/domain.types'
import { ForbiddenError, NotFoundError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

interface RemoveMemberInput {
  memberId: string
  requesterId: string
}

export class RemoveMemberUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(input: RemoveMemberInput): Promise<void> {
    // Get the target member
    const targetMember = await this.memberRepository.findById(input.memberId)

    if (!targetMember) {
      throw new NotFoundError('Member not found')
    }

    // Check if requester is admin/owner of this organization
    const requesterMembership = await this.memberRepository.findByUserAndOrganization(
      input.requesterId,
      targetMember.organizationId
    )

    if (!requesterMembership || !this.canRemoveMembers(requesterMembership.role)) {
      logger.warn('User attempted to remove member without proper permissions', {
        requesterId: input.requesterId,
        targetMemberId: input.memberId,
        requesterRole: requesterMembership?.role,
      })
      throw new ForbiddenError('Only admins and owners can remove members')
    }

    // Prevent users from removing themselves
    if (targetMember.userId === input.requesterId) {
      throw new ForbiddenError('You cannot remove yourself from the organization')
    }

    // Delete the member
    await this.memberRepository.delete(input.memberId)

    logger.warn('Removed member from organization', {
      memberId: input.memberId,
      organizationId: targetMember.organizationId,
      removedBy: input.requesterId,
    })
  }

  private canRemoveMembers(role: ProjectRole): boolean {
    return ['owner', 'admin'].includes(role)
  }
}
