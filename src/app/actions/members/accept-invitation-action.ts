'use server'

/**
 * Accept Invitation Server Action
 * Clean architecture implementation using use cases and repositories
 */

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/middleware'
import type { ServerActionResponse } from '@/lib/utils/api-response'
import { withServerAction } from '@/lib/utils/try-catch'
import { container } from '@/lib/core/di-container'
import type { MemberEntity } from '@/lib/core/domain/entities/member.entity'
import type { InvitationWithInviterDetails } from '@/lib/core/domain/entities/invitation.entity'

/**
 * Accept invitation and join organization
 */
export async function acceptInvitationAction(
  invitationId: string,
  token: string
): Promise<ServerActionResponse<MemberEntity>> {
  return withServerAction(async () => {
    const session = await requireAuth()

    // Get user details for email verification
    const useCase = container.acceptInvitationUseCase()
    const member = await useCase.execute({
      invitationId,
      token,
      userId: session.user.id,
      userEmail: session.user.email,
    })

    revalidatePath('/members')
    revalidatePath('/dashboard')

    return member
  }, 'acceptInvitationAction')
}

/**
 * Get invitation details for preview (without accepting)
 */
export async function getInvitationDetailsAction(
  invitationId: string
): Promise<ServerActionResponse<InvitationWithInviterDetails>> {
  return withServerAction(async () => {
    const useCase = container.getInvitationDetailsUseCase()
    const invitation = await useCase.execute(invitationId)

    return invitation
  }, 'getInvitationDetailsAction')
}
