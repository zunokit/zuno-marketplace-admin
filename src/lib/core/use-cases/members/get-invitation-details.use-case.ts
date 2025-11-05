/**
 * Get Invitation Details Use Case
 * Retrieves invitation details for preview (without accepting)
 */

import type { IInvitationRepository } from '@/lib/core/domain/interfaces/invitation.repository.interface'
import type { InvitationWithInviterDetails } from '@/lib/core/domain/entities/invitation.entity'
import { NotFoundError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

export class GetInvitationDetailsUseCase {
  constructor(private invitationRepository: IInvitationRepository) {}

  async execute(invitationId: string): Promise<InvitationWithInviterDetails> {
    // Get invitation with details
    const invitation = await this.invitationRepository.findByIdWithDetails(invitationId)

    if (!invitation) {
      logger.warn('Invitation details requested for non-existent invitation', {
        invitationId,
      })
      throw new NotFoundError('Invitation not found')
    }

    logger.debug('Retrieved invitation details', {
      invitationId,
      organizationId: invitation.organizationId,
      status: invitation.status,
    })

    return invitation
  }
}
