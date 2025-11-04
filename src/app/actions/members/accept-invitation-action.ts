'use server'

/**
 * Accept Invitation Server Action
 * Handle invitation acceptance and create organization membership
 */

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  member as memberTable,
  invitation as invitationTable,
  user as userTable,
} from '@/lib/infrastructure/database/schemas'
import { requireAuth } from '@/lib/auth/middleware'
import {
  errorHandler,
  NotFoundError,
  ValidationError,
} from '@/lib/utils/error-handler'
import {
  serverActionSuccess,
  serverActionError,
  type ServerActionResponse,
} from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import {
  verifyInvitationToken,
  isInvitationExpired,
} from '@/lib/utils/invitation-token'

/**
 * Accept invitation and join organization
 */
export async function acceptInvitationAction(
  invitationId: string,
  token: string
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth()

    const member = await errorHandler(async () => {
      // Get invitation
      const invitation = await db.query.invitation.findFirst({
        where: eq(invitationTable.id, invitationId),
      })

      if (!invitation) {
        throw new NotFoundError('Invitation not found')
      }

      // Verify invitation token
      if (!verifyInvitationToken(token, invitation.token)) {
        throw new ValidationError('Invalid invitation token')
      }

      // Check if invitation has expired
      if (isInvitationExpired(invitation.expiresAt)) {
        // Mark invitation as expired
        await db
          .update(invitationTable)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq(invitationTable.id, invitationId))

        throw new ValidationError('This invitation has expired')
      }

      // Check if invitation status is pending
      if (invitation.status !== 'pending') {
        throw new ValidationError(
          `This invitation has already been ${invitation.status}`
        )
      }

      // Verify invited email matches current user's email
      const currentUser = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id),
      })

      if (!currentUser) {
        throw new NotFoundError('User not found')
      }

      if (currentUser.email !== invitation.email) {
        throw new ValidationError(
          'This invitation was sent to a different email address'
        )
      }

      // Check if user is already a member
      const existingMember = await db.query.member.findFirst({
        where: and(
          eq(memberTable.organizationId, invitation.organizationId),
          eq(memberTable.userId, session.user.id)
        ),
      })

      if (existingMember) {
        // Update invitation status to accepted
        await db
          .update(invitationTable)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(invitationTable.id, invitationId))

        throw new ValidationError('You are already a member of this organization')
      }

      // Create member record
      const [newMember] = await db
        .insert(memberTable)
        .values({
          id: randomUUID(),
          organizationId: invitation.organizationId,
          userId: session.user.id,
          role: invitation.role || 'viewer',
          createdAt: new Date(),
        })
        .returning()

      // Update invitation status to accepted
      await db
        .update(invitationTable)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(invitationTable.id, invitationId))

      logger.info('User accepted invitation', {
        invitationId,
        organizationId: invitation.organizationId,
        userId: session.user.id,
        role: invitation.role,
      })

      return newMember
    }, 'acceptInvitation')

    revalidatePath('/members')
    revalidatePath('/dashboard')

    return serverActionSuccess(
      member,
      'Invitation accepted successfully. Welcome to the organization!'
    )
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Get invitation details for preview (without accepting)
 */
export async function getInvitationDetailsAction(
  invitationId: string
): Promise<ServerActionResponse> {
  try {
    const invitation = await errorHandler(async () => {
      const result = await db
        .select({
          id: invitationTable.id,
          email: invitationTable.email,
          role: invitationTable.role,
          status: invitationTable.status,
          expiresAt: invitationTable.expiresAt,
          organizationId: invitationTable.organizationId,
          organizationName: invitationTable.organizationId, // Will be joined
          inviterName: userTable.name,
          inviterEmail: userTable.email,
        })
        .from(invitationTable)
        .innerJoin(userTable, eq(invitationTable.inviterId, userTable.id))
        .where(eq(invitationTable.id, invitationId))
        .limit(1)

      if (result.length === 0) {
        throw new NotFoundError('Invitation not found')
      }

      const invitation = result[0]

      // Get organization name
      const organization = await db.query.organization.findFirst({
        where: eq(invitationTable.organizationId, invitation.organizationId),
      })

      return {
        ...invitation,
        organizationName: organization?.name || 'Unknown Organization',
      }
    }, 'getInvitationDetails')

    return serverActionSuccess(invitation)
  } catch (error) {
    return serverActionError(error)
  }
}
