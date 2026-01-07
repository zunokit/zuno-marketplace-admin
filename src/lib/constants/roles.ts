/**
 * Role Constants
 * Centralized role definitions for project members
 */

export const PROJECT_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export type ProjectRole = (typeof PROJECT_ROLES)[keyof typeof PROJECT_ROLES];

export const ROLE_PERMISSIONS = {
  [PROJECT_ROLES.OWNER]: {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canManageMembers: true,
    canManageSettings: true,
  },
  [PROJECT_ROLES.ADMIN]: {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canManageMembers: true,
    canManageSettings: false,
  },
  [PROJECT_ROLES.EDITOR]: {
    canRead: true,
    canWrite: true,
    canDelete: false,
    canManageMembers: false,
    canManageSettings: false,
  },
  [PROJECT_ROLES.VIEWER]: {
    canRead: true,
    canWrite: false,
    canDelete: false,
    canManageMembers: false,
    canManageSettings: false,
  },
} as const;
