'use server'

/**
 * Server Actions for Member Management
 * Manage organization members, invitations, and roles
 */

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  member as memberTable,
  invitation as invitationTable,
  user as userTable,
  organization as organizationTable,
} from '@/lib/infrastructure/database/schemas'
import { requireAuth } from '@/lib/auth/middleware'
import { errorHandler, ForbiddenError, NotFoundError, ValidationError } from '@/lib/utils/error-handler'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { getEmailService } from '@/lib/infrastructure/external/email'
import { invitationEmailTemplate } from '@/lib/infrastructure/external/email/templates'
import {
  generateInvitationToken,
  hashInvitationToken,
  generateInvitationUrl,
  calculateExpirationDate,
} from '@/lib/utils/invitation-token'

/**
 * Get all members of an organization
 */
export async function getOrganizationMembersAction(
  organizationId: string
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth()

    const members = await errorHandler(async () => {
      // Check if user is member of this organization
      const userMembership = await db.query.member.findFirst({
        where: and(
          eq(memberTable.organizationId, organizationId),
          eq(memberTable.userId, session.user.id)
        ),
      })

      if (!userMembership) {
        throw new ForbiddenError('You do not have access to this organization')
      }

      // Get all members with user details
      const results = await db
        .select({
          id: memberTable.id,
          role: memberTable.role,
          createdAt: memberTable.createdAt,
          userId: userTable.id,
          userName: userTable.name,
          userEmail: userTable.email,
          userImage: userTable.image,
          userRole: userTable.role,
        })
        .from(memberTable)
        .innerJoin(userTable, eq(memberTable.userId, userTable.id))
        .where(eq(memberTable.organizationId, organizationId))
        .orderBy(memberTable.createdAt)

      return results
    }, 'getOrganizationMembers')

    logger.info('Retrieved organization members', {
      organizationId,
      count: members.length,
      userId: session.user.id,
    })

    return serverActionSuccess(members)
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Get pending invitations for an organization
 */
export async function getOrganizationInvitationsAction(
  organizationId: string
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth()

    const invitations = await errorHandler(async () => {
      // Check if user is admin/owner of this organization
      const userMembership = await db.query.member.findFirst({
        where: and(
          eq(memberTable.organizationId, organizationId),
          eq(memberTable.userId, session.user.id)
        ),
      })

      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        throw new ForbiddenError('Only admins and owners can view invitations')
      }

      // Get all pending invitations with inviter details
      const results = await db
        .select({
          id: invitationTable.id,
          email: invitationTable.email,
          role: invitationTable.role,
          status: invitationTable.status,
          expiresAt: invitationTable.expiresAt,
          createdAt: invitationTable.createdAt,
          inviterName: userTable.name,
          inviterEmail: userTable.email,
        })
        .from(invitationTable)
        .innerJoin(userTable, eq(invitationTable.inviterId, userTable.id))
        .where(
          and(
            eq(invitationTable.organizationId, organizationId),
            eq(invitationTable.status, 'pending')
          )
        )
        .orderBy(invitationTable.createdAt)

      return results
    }, 'getOrganizationInvitations')

    return serverActionSuccess(invitations)
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Invite a user to an organization
 */
export async function inviteUserAction(
  organizationId: string,
  email: string,
  role: 'owner' | 'admin' | 'editor' | 'viewer'
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth()

    const invitation = await errorHandler(async () => {
      // Check if user is admin/owner of this organization
      const userMembership = await db.query.member.findFirst({
        where: and(
          eq(memberTable.organizationId, organizationId),
          eq(memberTable.userId, session.user.id)
        ),
      })

      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        throw new ForbiddenError('Only admins and owners can invite users')
      }

      // Get organization details
      const organization = await db.query.organization.findFirst({
        where: eq(organizationTable.id, organizationId),
      })

      if (!organization) {
        throw new NotFoundError('Organization not found')
      }

      // Check if user is already a member
      const existingMemberByEmail = await db
        .select({ userId: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1)

      if (existingMemberByEmail.length > 0) {
        const existingMember = await db.query.member.findFirst({
          where: and(
            eq(memberTable.organizationId, organizationId),
            eq(memberTable.userId, existingMemberByEmail[0].userId)
          ),
        })

        if (existingMember) {
          throw new ValidationError('User is already a member of this organization')
        }
      }

      // Check if there's a pending invitation
      const existingInvitation = await db.query.invitation.findFirst({
        where: and(
          eq(invitationTable.organizationId, organizationId),
          eq(invitationTable.email, email),
          eq(invitationTable.status, 'pending')
        ),
      })

      if (existingInvitation) {
        throw new ValidationError('An invitation has already been sent to this email')
      }

      // Generate secure invitation token
      const token = generateInvitationToken()
      const tokenHash = hashInvitationToken(token)

      // Create invitation (expires in 7 days)
      const expiresAt = calculateExpirationDate(7)

      const [newInvitation] = await db
        .insert(invitationTable)
        .values({
          id: randomUUID(),
          organizationId,
          email,
          role,
          inviterId: session.user.id,
          token: tokenHash,
          expiresAt,
          status: 'pending',
        })
        .returning()

      logger.info('Created organization invitation', {
        invitationId: newInvitation.id,
        organizationId,
        email,
        role,
        inviterId: session.user.id,
      })

      // Generate invitation URL
      const invitationUrl = generateInvitationUrl(newInvitation.id, token)

      // Get inviter details
      const inviter = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id),
      })

      // Send invitation email
      const emailService = getEmailService()

      const { html, text, subject } = invitationEmailTemplate({
        inviterName: inviter?.name || session.user.name,
        organizationName: organization.name,
        role,
        invitationUrl,
        expiresInDays: 7,
      })

      const emailResult = await emailService.send({
        to: email,
        subject,
        html,
        text,
      })

      if (!emailResult.success) {
        logger.error('Failed to send invitation email', null, {
          invitationId: newInvitation.id,
          email,
          error: emailResult.error,
        })

        // Delete invitation if email failed to send
        await db.delete(invitationTable).where(eq(invitationTable.id, newInvitation.id))

        throw new Error(
          'Failed to send invitation email. Please check email service configuration.'
        )
      }

      logger.info('Invitation email sent successfully', {
        invitationId: newInvitation.id,
        email,
        messageId: emailResult.messageId,
      })

      return newInvitation
    }, 'inviteUser')

    revalidatePath(`/members`)

    return serverActionSuccess(invitation, 'Invitation sent successfully')
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Update member role
 */
export async function updateMemberRoleAction(
  memberId: string,
  newRole: 'owner' | 'admin' | 'editor' | 'viewer'
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth()

    const updatedMember = await errorHandler(async () => {
      // Get the member record
      const targetMember = await db.query.member.findFirst({
        where: eq(memberTable.id, memberId),
      })

      if (!targetMember) {
        throw new NotFoundError('Member not found')
      }

      // Check if user is admin/owner of this organization
      const userMembership = await db.query.member.findFirst({
        where: and(
          eq(memberTable.organizationId, targetMember.organizationId),
          eq(memberTable.userId, session.user.id)
        ),
      })

      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        throw new ForbiddenError('Only admins and owners can update member roles')
      }

      // Prevent users from changing their own role
      if (targetMember.userId === session.user.id) {
        throw new ForbiddenError('You cannot change your own role')
      }

      // Update the role
      const [updated] = await db
        .update(memberTable)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(memberTable.id, memberId))
        .returning()

      logger.info('Updated member role', {
        memberId,
        organizationId: targetMember.organizationId,
        oldRole: targetMember.role,
        newRole,
        updatedBy: session.user.id,
      })

      return updated
    }, 'updateMemberRole')

    revalidatePath(`/members`)

    return serverActionSuccess(updatedMember, 'Member role updated successfully')
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Remove member from organization
 */
export async function removeMemberAction(memberId: string): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth()

    await errorHandler(async () => {
      // Get the member record
      const targetMember = await db.query.member.findFirst({
        where: eq(memberTable.id, memberId),
      })

      if (!targetMember) {
        throw new NotFoundError('Member not found')
      }

      // Check if user is admin/owner of this organization
      const userMembership = await db.query.member.findFirst({
        where: and(
          eq(memberTable.organizationId, targetMember.organizationId),
          eq(memberTable.userId, session.user.id)
        ),
      })

      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        throw new ForbiddenError('Only admins and owners can remove members')
      }

      // Prevent users from removing themselves
      if (targetMember.userId === session.user.id) {
        throw new ForbiddenError('You cannot remove yourself from the organization')
      }

      // Delete the member
      await db.delete(memberTable).where(eq(memberTable.id, memberId))

      logger.warn('Removed member from organization', {
        memberId,
        organizationId: targetMember.organizationId,
        removedBy: session.user.id,
      })
    }, 'removeMember')

    revalidatePath(`/members`)

    return serverActionSuccess(null, 'Member removed successfully')
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Cancel/revoke invitation
 */
export async function revokeInvitationAction(invitationId: string): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth()

    await errorHandler(async () => {
      // Get the invitation
      const invitation = await db.query.invitation.findFirst({
        where: eq(invitationTable.id, invitationId),
      })

      if (!invitation) {
        throw new NotFoundError('Invitation not found')
      }

      // Check if user is admin/owner of this organization
      const userMembership = await db.query.member.findFirst({
        where: and(
          eq(memberTable.organizationId, invitation.organizationId),
          eq(memberTable.userId, session.user.id)
        ),
      })

      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        throw new ForbiddenError('Only admins and owners can revoke invitations')
      }

      // Delete the invitation
      await db.delete(invitationTable).where(eq(invitationTable.id, invitationId))

      logger.info('Revoked organization invitation', {
        invitationId,
        organizationId: invitation.organizationId,
        revokedBy: session.user.id,
      })
    }, 'revokeInvitation')

    revalidatePath(`/members`)

    return serverActionSuccess(null, 'Invitation revoked successfully')
  } catch (error) {
    return serverActionError(error)
  }
}
