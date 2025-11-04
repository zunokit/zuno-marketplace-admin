/**
 * Members Feature Types
 * Re-exports centralized domain entities for use in components
 */

import type { MemberWithUserDetails } from '@/lib/core/domain/entities/member.entity'
import type { InvitationWithInviterDetails } from '@/lib/core/domain/entities/invitation.entity'

// Re-export centralized domain entities with simpler names
export type Member = MemberWithUserDetails
export type Invitation = InvitationWithInviterDetails

export interface MembersState {
  members: Member[]
  invitations: Invitation[]
  isLoadingMembers: boolean
  isLoadingInvitations: boolean
}

export interface MembersActions {
  loadMembers: () => Promise<void>
  loadInvitations: () => Promise<void>
  refreshAll: () => Promise<void>
  revokeInvitation: (invitationId: string) => Promise<void>
}

export interface MemberDialogState {
  invite: boolean
  updateRole: boolean
  removeMember: boolean
  selectedMember: Member | null
}

export const roleIcons = {
  owner: 'Crown',
  admin: 'Shield',
  editor: 'Edit',
  viewer: 'Eye',
} as const

export const roleColors = {
  owner: 'default',
  admin: 'secondary',
  editor: 'outline',
  viewer: 'outline',
} as const
