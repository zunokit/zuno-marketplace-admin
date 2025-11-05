/**
 * RBAC (Role-Based Access Control) Utilities
 * Advanced permission utilities built on top of core permissions module
 *
 * @module rbac
 * @description Provides higher-level RBAC utilities including:
 * - Resource-based access control with RBACContext
 * - Multi-permission checking
 * - Role comparison and hierarchy
 * - Permission guards and decorators
 * - Utility functions for permission management
 *
 * For basic permission checks, use @/lib/auth/permissions directly.
 * Use this module for advanced RBAC patterns and resource-based permissions.
 *
 * @example
 * ```typescript
 * // Resource-based access control
 * const canAccess = await rbacService.canAccess({
 *   userId,
 *   resourceId: projectId,
 *   resourceType: 'project',
 *   action: 'project.update'
 * })
 *
 * // Check multiple permissions at once
 * const permissions = await checkMultiplePermissions(userId, projectId, [
 *   'data.read',
 *   'data.update',
 *   'data.delete'
 * ])
 * // Returns: { 'data.read': true, 'data.update': true, 'data.delete': false }
 * ```
 */

import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { member as memberTable } from '@/lib/infrastructure/database/schemas'
import type { ProjectPermission, ProjectRole } from '@/types/domain.types'
import { ROLE_PERMISSIONS } from '@/types/domain.types'
import {
  checkProjectPermission,
  requireProjectPermission,
  getUserProjectRole,
  isSuperAdmin,
} from '@/lib/auth/permissions'
import { logger } from '@/lib/utils/logger'
import { ForbiddenError } from '@/lib/utils/error-handler'
import { withErrorHandling } from '@/lib/utils/try-catch'

/**
 * RBAC Context for access control decisions
 * Generic interface for resource-based permission checks
 *
 * @property userId - The ID of the user requesting access
 * @property resourceId - Optional ID of the specific resource
 * @property resourceType - Type of resource (e.g., 'project', 'user', 'data')
 * @property action - The action to perform (e.g., 'read', 'update', 'delete')
 */
export interface RBACContext {
  userId: string
  resourceId?: string
  resourceType?: string
  action: string
}

/**
 * Resource-based permission checker service
 * Provides flexible, context-based permission checking for various resource types
 */
class RBACService {
  /**
   * Check if user has specific permission for a resource
   * Supports multiple resource types with extensible switch-based routing
   *
   * @param context - RBAC context containing user, resource, and action info
   * @returns true if user has permission, false otherwise
   *
   * @example
   * ```typescript
   * const canEdit = await rbacService.canAccess({
   *   userId: 'user-123',
   *   resourceId: 'project-456',
   *   resourceType: 'project',
   *   action: 'project.update'
   * })
   * ```
   */
  async canAccess(context: RBACContext): Promise<boolean> {
    const { userId, resourceId, resourceType, action } = context

    const result = await withErrorHandling(
      async () => {
        // Super admins have access to everything
        if (await isSuperAdmin(userId)) {
          return true
        }

        // Route to appropriate permission checker based on resource type
        switch (resourceType) {
          case 'project':
          case 'data':
            // Both project and data permissions use project-level RBAC
            return resourceId
              ? await checkProjectPermission(userId, resourceId, action as ProjectPermission)
              : false

          case 'user':
            return await this.checkUserPermission(userId, action)

          default:
            return false
        }
      },
      {
        context: 'rbacService.canAccess',
        fallback: false, // Deny access on error (security-first)
        shouldLog: true,
      }
    )

    return result.data
  }

  /**
   * Require specific permission (throws ForbiddenError if not authorized)
   * Use this in server actions and API routes to enforce permissions
   *
   * @param context - RBAC context containing user, resource, and action info
   * @throws ForbiddenError if user lacks required permission
   *
   * @example
   * ```typescript
   * // In a server action
   * await rbacService.requireAccess({
   *   userId,
   *   resourceId: projectId,
   *   resourceType: 'project',
   *   action: 'project.delete'
   * })
   * // If user lacks permission, error is thrown and execution stops
   * await deleteProject(projectId)
   * ```
   */
  async requireAccess(context: RBACContext): Promise<void> {
    const hasPermission = await this.canAccess(context)

    if (!hasPermission) {
      throw new ForbiddenError(
        `Access denied: Missing permission '${context.action}' for ${context.resourceType || 'resource'}`
      )
    }
  }

  /**
   * Check user-level permissions (account-level, not project-level)
   * Handles permissions like user.read, user.update, user.delete
   *
   * @param userId - The ID of the user
   * @param action - The action to perform
   * @returns true if user has permission, false otherwise
   *
   * @private
   */
  private async checkUserPermission(userId: string, action: string): Promise<boolean> {
    const result = await withErrorHandling(
      async () => {
        const user = await db.query.user.findFirst({
          where: eq(db.query.user.id, userId),
        })

        if (!user) return false

        // Define user-level permissions
        const userPermissions: Record<string, boolean> = {
          'user.read': true, // Everyone can read user data
          'user.update': userId === user.id, // Users can only update themselves
          'user.delete': user.role === 'super_admin', // Only super admins can delete
        }

        return userPermissions[action] || false
      },
      {
        context: 'checkUserPermission',
        fallback: false,
        shouldLog: true,
      }
    )

    return result.data
  }

  /**
   * Check if user has ANY of the required permissions
   * Returns true if user has at least one permission
   *
   * @param userId - The ID of the user
   * @param projectId - The ID of the project
   * @param permissions - Array of permissions to check
   * @returns true if user has at least one permission
   *
   * @example
   * ```typescript
   * const canModifyData = await rbacService.hasAnyPermission(
   *   userId,
   *   projectId,
   *   ['data.update', 'data.delete']
   * )
   * ```
   */
  async hasAnyPermission(
    userId: string,
    projectId: string,
    permissions: ProjectPermission[]
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await checkProjectPermission(userId, projectId, permission)) {
        return true
      }
    }
    return false
  }

  /**
   * Check if user has ALL of the required permissions
   * Returns true only if user has every permission
   *
   * @param userId - The ID of the user
   * @param projectId - The ID of the project
   * @param permissions - Array of permissions to check
   * @returns true if user has all permissions
   *
   * @example
   * ```typescript
   * const canFullyManageData = await rbacService.hasAllPermissions(
   *   userId,
   *   projectId,
   *   ['data.create', 'data.read', 'data.update', 'data.delete']
   * )
   * ```
   */
  async hasAllPermissions(
    userId: string,
    projectId: string,
    permissions: ProjectPermission[]
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await checkProjectPermission(userId, projectId, permission))) {
        return false
      }
    }
    return true
  }

  /**
   * Get all permissions for a user in a specific project
   * Returns the full list of permissions based on user's role
   *
   * @param userId - The ID of the user
   * @param projectId - The ID of the project
   * @returns Array of permissions the user has
   *
   * @example
   * ```typescript
   * const permissions = await rbacService.getUserPermissions(userId, projectId)
   * // ['project.read', 'data.read', 'data.update', ...]
   * ```
   */
  async getUserPermissions(userId: string, projectId: string): Promise<ProjectPermission[]> {
    const result = await withErrorHandling(
      async () => {
        const role = await getUserProjectRole(userId, projectId)
        if (!role) return []

        return ROLE_PERMISSIONS[role] || []
      },
      {
        context: 'getUserPermissions',
        fallback: [],
        shouldLog: true,
      }
    )

    return result.data
  }

  /**
   * Check if user can access a specific resource by ID
   * Determines if user is a member or has access to the resource
   *
   * @param userId - The ID of the user
   * @param resourceId - The ID of the resource
   * @param resourceType - Type of resource
   * @returns true if user can access the resource
   *
   * @example
   * ```typescript
   * const canAccess = await rbacService.canAccessResourceById(
   *   userId,
   *   projectId,
   *   'project'
   * )
   * ```
   */
  async canAccessResourceById(
    userId: string,
    resourceId: string,
    resourceType: 'project' | 'user' | 'data'
  ): Promise<boolean> {
    const result = await withErrorHandling(
      async () => {
        switch (resourceType) {
          case 'project': {
            // Check if user is a project member
            const membership = await db.query.member.findFirst({
              where: and(
                eq(memberTable.userId, userId),
                eq(memberTable.organizationId, resourceId)
              ),
            })
            return !!membership
          }

          case 'user':
            // Users can access their own data
            return userId === resourceId

          case 'data':
            // For data, check if user has read permission in the project
            return await checkProjectPermission(userId, resourceId, 'data.read')

          default:
            return false
        }
      },
      {
        context: 'canAccessResourceById',
        fallback: false,
        shouldLog: true,
      }
    )

    return result.data
  }
}

// Create singleton instance
export const rbacService = new RBACService()

// Export methods for direct use
export const {
  canAccess,
  requireAccess,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canAccessResourceById,
} = rbacService

/**
 * Higher-order function to create permission-protected handlers
 * Wraps a handler function with automatic permission checking
 *
 * @template TArgs - Argument types for the handler
 * @template TReturn - Return type of the handler
 * @param handler - The handler function to protect
 * @param permission - The required permission
 * @returns Protected handler function
 *
 * @example
 * ```typescript
 * const deleteData = withPermissionCheck(
 *   async (userId, projectId, dataId) => {
 *     return await db.delete(data).where(eq(data.id, dataId))
 *   },
 *   'data.delete'
 * )
 *
 * // Usage - automatically checks permission before executing
 * await deleteData(userId, projectId, dataId)
 * ```
 */
export function withPermissionCheck<TArgs extends unknown[], TReturn>(
  handler: (userId: string, projectId: string, ...args: TArgs) => Promise<TReturn>,
  permission: ProjectPermission
) {
  return async (userId: string, projectId: string, ...args: TArgs): Promise<TReturn> => {
    await requireProjectPermission(userId, projectId, permission)
    return await handler(userId, projectId, ...args)
  }
}

/**
 * Create a resource guard with CRUD permission methods
 * Factory function for creating permission guards for specific resource types
 *
 * @param resourceType - The type of resource to guard
 * @returns Object with permission checking methods
 *
 * @example
 * ```typescript
 * const projectGuard = createResourceGuard('project')
 *
 * // In a component
 * const canEdit = await projectGuard.canUpdate(userId, projectId)
 * const canDelete = await projectGuard.canDelete(userId, projectId)
 *
 * // Enforce permission (throws on failure)
 * await projectGuard.requireUpdate(userId, projectId)
 * ```
 */
export function createResourceGuard(resourceType: string) {
  return {
    canRead: async (userId: string, resourceId?: string) =>
      await rbacService.canAccess({
        userId,
        resourceId,
        resourceType,
        action: `${resourceType}.read`,
      }),

    canCreate: async (userId: string, resourceId?: string) =>
      await rbacService.canAccess({
        userId,
        resourceId,
        resourceType,
        action: `${resourceType}.create`,
      }),

    canUpdate: async (userId: string, resourceId?: string) =>
      await rbacService.canAccess({
        userId,
        resourceId,
        resourceType,
        action: `${resourceType}.update`,
      }),

    canDelete: async (userId: string, resourceId?: string) =>
      await rbacService.canAccess({
        userId,
        resourceId,
        resourceType,
        action: `${resourceType}.delete`,
      }),

    requireRead: async (userId: string, resourceId?: string) =>
      await rbacService.requireAccess({
        userId,
        resourceId,
        resourceType,
        action: `${resourceType}.read`,
      }),

    requireUpdate: async (userId: string, resourceId?: string) =>
      await rbacService.requireAccess({
        userId,
        resourceId,
        resourceType,
        action: `${resourceType}.update`,
      }),

    requireDelete: async (userId: string, resourceId?: string) =>
      await rbacService.requireAccess({
        userId,
        resourceId,
        resourceType,
        action: `${resourceType}.delete`,
      }),
  }
}

/**
 * Check multiple permissions for a user and return results
 * Efficient way to check many permissions at once
 *
 * @param userId - The ID of the user
 * @param projectId - The ID of the project
 * @param permissions - Array of permissions to check
 * @returns Object mapping each permission to boolean result
 *
 * @example
 * ```typescript
 * const permissions = await checkMultiplePermissions(
 *   userId,
 *   projectId,
 *   ['data.read', 'data.update', 'data.delete']
 * )
 * // Returns: { 'data.read': true, 'data.update': true, 'data.delete': false }
 *
 * // Use in UI to conditionally render buttons
 * {permissions['data.update'] && <EditButton />}
 * {permissions['data.delete'] && <DeleteButton />}
 * ```
 */
export async function checkMultiplePermissions(
  userId: string,
  projectId: string,
  permissions: ProjectPermission[]
): Promise<Record<ProjectPermission, boolean>> {
  const results: Record<string, boolean> = {}

  // Check all permissions (could be parallelized with Promise.all for better performance)
  for (const permission of permissions) {
    results[permission] = await checkProjectPermission(userId, projectId, permission)
  }

  return results as Record<ProjectPermission, boolean>
}

/**
 * Permission utility functions for role and permission management
 * Pure utility functions that don't require database access
 */
export const PermissionUtils = {
  /**
   * Get the highest role a user has across all projects
   *
   * @param userId - The ID of the user
   * @returns The highest role, or null if user has no projects
   *
   * @example
   * ```typescript
   * const highest = await PermissionUtils.getHighestRole(userId)
   * // Returns: 'owner' if user is owner in any project
   * ```
   */
  getHighestRole: async (userId: string): Promise<ProjectRole | null> => {
    const result = await withErrorHandling(
      async () => {
        const memberships = await db.query.member.findMany({
          where: eq(memberTable.userId, userId),
        })

        if (memberships.length === 0) return null

        const roleHierarchy: Record<ProjectRole, number> = {
          owner: 4,
          admin: 3,
          editor: 2,
          viewer: 1,
        }

        let highestRole: ProjectRole = 'viewer'
        let highestLevel = 0

        for (const membership of memberships) {
          const role = membership.role as ProjectRole
          const level = roleHierarchy[role] || 0
          if (level > highestLevel) {
            highestLevel = level
            highestRole = role
          }
        }

        return highestRole
      },
      {
        context: 'getHighestRole',
        fallback: null,
        shouldLog: true,
      }
    )

    return result.data
  },

  /**
   * Check if a role has a specific permission (pure function)
   *
   * @param role - The project role
   * @param permission - The permission to check
   * @returns true if role has permission
   *
   * @example
   * ```typescript
   * const canDelete = PermissionUtils.roleHasPermission('editor', 'data.delete')
   * // Returns: true
   * ```
   */
  roleHasPermission: (role: ProjectRole, permission: ProjectPermission): boolean => {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false
  },

  /**
   * Get all available project permissions
   *
   * @returns Array of all permission strings
   */
  getAllPermissions: (): ProjectPermission[] => {
    return [
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
    ]
  },

  /**
   * Calculate permission difference between two roles
   * Useful for role change audit logs or UI feedback
   *
   * @param fromRole - The original role
   * @param toRole - The new role
   * @returns Object with added and removed permissions
   *
   * @example
   * ```typescript
   * const diff = PermissionUtils.getPermissionDifference('viewer', 'editor')
   * // Returns: { added: ['data.create', 'data.update', 'data.delete'], removed: [] }
   * ```
   */
  getPermissionDifference: (
    fromRole: ProjectRole,
    toRole: ProjectRole
  ): {
    added: ProjectPermission[]
    removed: ProjectPermission[]
  } => {
    const fromPermissions = ROLE_PERMISSIONS[fromRole] || []
    const toPermissions = ROLE_PERMISSIONS[toRole] || []

    const added = toPermissions.filter((p) => !fromPermissions.includes(p))
    const removed = fromPermissions.filter((p) => !toPermissions.includes(p))

    return { added, removed }
  },

  /**
   * Get combined permissions from multiple roles
   * Returns union of all permissions across roles
   *
   * @param roles - Array of roles to combine
   * @returns Array of unique permissions
   *
   * @example
   * ```typescript
   * const permissions = PermissionUtils.getCombinedPermissions(['viewer', 'editor'])
   * // Returns: unique set of permissions from both roles
   * ```
   */
  getCombinedPermissions: (roles: ProjectRole[]): ProjectPermission[] => {
    const permissions = new Set<ProjectPermission>()
    roles.forEach((role) => {
      const rolePermissions = ROLE_PERMISSIONS[role] || []
      rolePermissions.forEach((permission) => permissions.add(permission))
    })
    return Array.from(permissions)
  },

  /**
   * Check if role A has equal or higher privileges than role B
   * Based on role hierarchy: owner > admin > editor > viewer
   *
   * @param roleA - First role to compare
   * @param roleB - Second role to compare
   * @returns true if roleA >= roleB in hierarchy
   *
   * @example
   * ```typescript
   * PermissionUtils.isRoleHigherOrEqual('admin', 'editor') // true
   * PermissionUtils.isRoleHigherOrEqual('editor', 'admin') // false
   * PermissionUtils.isRoleHigherOrEqual('admin', 'admin') // true
   * ```
   */
  isRoleHigherOrEqual: (roleA: ProjectRole, roleB: ProjectRole): boolean => {
    const roleHierarchy: Record<ProjectRole, number> = {
      owner: 4,
      admin: 3,
      editor: 2,
      viewer: 1,
    }
    return roleHierarchy[roleA] >= roleHierarchy[roleB]
  },
}

// Re-export core permission functions for convenience
export {
  checkProjectPermission,
  requireProjectPermission,
  getUserProjectRole,
  getUserProjects,
  checkAdminPermission,
  isSuperAdmin,
} from '@/lib/auth/permissions'
