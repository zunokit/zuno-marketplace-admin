/**
 * Update Member Role Use Case
 * Handles updating a member's role in an organization
 */

import type { IMemberRepository } from '@/lib/core/domain/interfaces/member.repository.interface'
import type { MemberEntity } from '@/lib/core/domain/entities/member.entity'
import type { ProjectRole } from '@/types/domain.types'
import { ForbiddenError, NotFoundError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

interface UpdateMemberRoleInput {
  memberId: string
  newRole: ProjectRole
  requesterId: string
}

export class UpdateMemberRoleUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(input: UpdateMemberRoleInput): Promise<MemberEntity> {
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

    if (!requesterMembership || !this.canManageRoles(requesterMembership.role)) {
      logger.warn('User attempted to update member role without proper permissions', {
        requesterId: input.requesterId,
        targetMemberId: input.memberId,
        requesterRole: requesterMembership?.role,
      })
      throw new ForbiddenError('Only admins and owners can update member roles')
    }

    // Prevent users from changing their own role
    if (targetMember.userId === input.requesterId) {
      throw new ForbiddenError('You cannot change your own role')
    }

    // Update the role
    const updatedMember = await this.memberRepository.update(input.memberId, {
      role: input.newRole,
    })

    logger.info('Updated member role', {
      memberId: input.memberId,
      organizationId: targetMember.organizationId,
      oldRole: targetMember.role,
      newRole: input.newRole,
      updatedBy: input.requesterId,
    })

    return updatedMember
  }

  private canManageRoles(role: ProjectRole): boolean {
    return ['owner', 'admin'].includes(role)
  }
}
