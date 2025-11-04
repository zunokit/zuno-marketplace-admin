/**
 * Member Validation Schemas
 * Zod schemas for member-related operations
 */

import { z } from 'zod'

export const projectRoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer'])

export const inviteUserSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  email: z.string().email('Invalid email address'),
  role: projectRoleSchema,
})

export const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  role: projectRoleSchema,
})

export const removeMemberSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
})

export const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
})

export const acceptInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
  token: z.string().min(1, 'Token is required'),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>
export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>
