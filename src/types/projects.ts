import type { ProjectConfig } from '@/config/projects.config'

/**
 * Project role types
 */
export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer'

/**
 * Project permission types
 */
export type ProjectPermission =
  | 'project.read'
  | 'project.update'
  | 'project.settings'
  | 'project.delete'
  | 'members.invite'
  | 'members.remove'
  | 'members.update_role'
  | 'data.create'
  | 'data.read'
  | 'data.update'
  | 'data.delete'

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  owner: [
    'project.read',
    'project.update',
    'project.settings',
    'project.delete',
    'members.invite',
    'members.remove',
    'members.update_role',
    'data.create',
    'data.read',
    'data.update',
    'data.delete',
  ],
  admin: [
    'project.read',
    'project.update',
    'project.settings',
    'members.invite',
    'members.remove',
    'members.update_role',
    'data.create',
    'data.read',
    'data.update',
    'data.delete',
  ],
  editor: [
    'project.read',
    'data.create',
    'data.read',
    'data.update',
    'data.delete',
  ],
  viewer: ['project.read', 'data.read'],
}

/**
 * Project member with user info
 */
export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: ProjectRole
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * Project with member info
 */
export interface ProjectWithRole extends ProjectConfig {
  role: ProjectRole
  memberCount?: number
}

/**
 * Project invitation
 */
export interface ProjectInvitation {
  id: string
  projectId: string
  email: string
  role: ProjectRole
  inviterId: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: Date
  createdAt: Date
}
