'use server'

/**
 * Server Actions for Member Management
 * Clean architecture implementation using use cases and repositories
 */

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/middleware'
import { type ServerActionResponse } from '@/lib/utils/api-response'
import { withServerAction } from '@/lib/utils/try-catch'
import { container } from '@/lib/core/di-container'
import { inviteUserSchema, updateMemberRoleSchema, removeMemberSchema, revokeInvitationSchema } from '@/lib/validations/member'
import type { MemberWithUserDetails } from '@/lib/core/domain/entities/member.entity'
import type { InvitationWithInviterDetails } from '@/lib/core/domain/entities/invitation.entity'
import type { ProjectRole } from '@/types/domain.types'

/**
 * Get all members of an organization
 */
export async function getOrganizationMembersAction(
  organizationId: string
): Promise<ServerActionResponse<MemberWithUserDetails[]>> {
  return withServerAction(async () => {
    const session = await requireAuth()

    const useCase = container.getOrganizationMembersUseCase()
    const members = await useCase.execute(organizationId, session.user.id)

    return members
  }, 'getOrganizationMembersAction')
}

/**
 * Get pending invitations for an organization
 */
export async function getOrganizationInvitationsAction(
  organizationId: string
): Promise<ServerActionResponse<InvitationWithInviterDetails[]>> {
  return withServerAction(async () => {
    const session = await requireAuth()

    const useCase = container.getOrganizationInvitationsUseCase()
    const invitations = await useCase.execute(organizationId, session.user.id)

    return invitations
  }, 'getOrganizationInvitationsAction')
}

/**
 * Invite a user to an organization
 */
export async function inviteUserAction(
  organizationId: string,
  email: string,
  role: ProjectRole
): Promise<ServerActionResponse<{ message: string }>> {
  return withServerAction(async () => {
    const session = await requireAuth()

    // Validate input
    const validatedInput = inviteUserSchema.parse({
      organizationId,
      email,
      role,
    })

    const useCase = container.inviteUserUseCase()
    await useCase.execute({
      organizationId: validatedInput.organizationId,
      email: validatedInput.email,
      role: validatedInput.role,
      inviterId: session.user.id,
      inviterName: session.user.name,
    })

    revalidatePath('/members')

    return { message: 'Invitation sent successfully' }
  }, 'inviteUserAction')
}

/**
 * Update member role
 */
export async function updateMemberRoleAction(
  memberId: string,
  newRole: ProjectRole
): Promise<ServerActionResponse<{ message: string }>> {
  return withServerAction(async () => {
    const session = await requireAuth()

    // Validate input
    const validatedInput = updateMemberRoleSchema.parse({
      memberId,
      role: newRole,
    })

    const useCase = container.updateMemberRoleUseCase()
    await useCase.execute({
      memberId: validatedInput.memberId,
      newRole: validatedInput.role,
      requesterId: session.user.id,
    })

    revalidatePath('/members')

    return { message: 'Member role updated successfully' }
  }, 'updateMemberRoleAction')
}

/**
 * Remove member from organization
 */
export async function removeMemberAction(
  memberId: string
): Promise<ServerActionResponse<{ message: string }>> {
  return withServerAction(async () => {
    const session = await requireAuth()

    // Validate input
    const validatedInput = removeMemberSchema.parse({ memberId })

    const useCase = container.removeMemberUseCase()
    await useCase.execute({
      memberId: validatedInput.memberId,
      requesterId: session.user.id,
    })

    revalidatePath('/members')

    return { message: 'Member removed successfully' }
  }, 'removeMemberAction')
}

/**
 * Cancel/revoke invitation
 */
export async function revokeInvitationAction(
  invitationId: string
): Promise<ServerActionResponse<{ message: string }>> {
  return withServerAction(async () => {
    const session = await requireAuth()

    // Validate input
    const validatedInput = revokeInvitationSchema.parse({ invitationId })

    const useCase = container.revokeInvitationUseCase()
    await useCase.execute({
      invitationId: validatedInput.invitationId,
      requesterId: session.user.id,
    })

    revalidatePath('/members')

    return { message: 'Invitation revoked successfully' }
  }, 'revokeInvitationAction')
}
