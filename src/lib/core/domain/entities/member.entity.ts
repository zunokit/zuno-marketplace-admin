/**
 * Member Domain Entity
 * Represents a member of an organization/project
 */

import type { ProjectRole } from '@/types/domain.types'

export interface MemberEntity {
  id: string
  organizationId: string
  userId: string
  role: ProjectRole
  createdAt: Date
  updatedAt: Date
}

export interface MemberWithUserDetails extends MemberEntity {
  userName: string
  userEmail: string
  userImage: string | null
  userGlobalRole: string
  userRole: string // Alias for userGlobalRole for backward compatibility
}

export interface CreateMemberData {
  organizationId: string
  userId: string
  role: ProjectRole
}

export interface UpdateMemberData {
  role?: ProjectRole
}
