/**
 * Invitation Domain Entity
 * Represents an invitation to join an organization/project
 */

import type { ProjectRole } from '@/types/domain.types'

export interface InvitationEntity {
  id: string
  organizationId: string
  email: string
  role: ProjectRole
  inviterId: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface InvitationWithInviterDetails extends InvitationEntity {
  inviterName: string
  inviterEmail: string
  organizationName: string
}

export interface CreateInvitationData {
  organizationId: string
  email: string
  role: ProjectRole
  inviterId: string
  token: string
  expiresAt: Date
}

export interface AcceptInvitationData {
  invitationId: string
  userId: string
}
