/**
 * Get Organization Members Use Case
 * Retrieves all members of an organization with user details
 */

import type { IMemberRepository } from '@/lib/core/domain/interfaces/member.repository.interface'
import type { MemberWithUserDetails } from '@/lib/core/domain/entities/member.entity'
import { ForbiddenError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'
import { isSuperAdmin } from '@/lib/auth/permissions'

export class GetOrganizationMembersUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(organizationId: string, userId: string): Promise<MemberWithUserDetails[]> {
    // Super admins can access all organizations
    const isAdmin = await isSuperAdmin(userId)
    
    if (!isAdmin) {
      // Check if user is member of this organization
      const userMembership = await this.memberRepository.findByUserAndOrganization(
        userId,
        organizationId
      )

      if (!userMembership) {
        logger.warn('User attempted to access organization members without membership', {
          userId,
          organizationId,
        })
        throw new ForbiddenError('You do not have access to this organization')
      }
    }

    const members = await this.memberRepository.findByOrganization(organizationId)

    logger.info('Retrieved organization members', {
      organizationId,
      memberCount: members.length,
      requestedBy: userId,
    })

    return members
  }
}
