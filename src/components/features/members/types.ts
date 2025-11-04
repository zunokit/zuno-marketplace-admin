/**
 * Members Feature Types
 * Types specific to the member management feature
 */

import type { ProjectRole } from '@/types/domain.types'

export interface Member {
  id: string
  role: ProjectRole
  createdAt: Date
  userId: string
  userName: string
  userEmail: string
  userImage: string | null
  userRole: string
}

export interface Invitation {
  id: string
  email: string
  role: ProjectRole
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: Date
  createdAt: Date
  inviterName: string
  inviterEmail: string
}

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
