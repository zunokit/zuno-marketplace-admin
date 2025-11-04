/**
 * RBAC (Role-Based Access Control) Utilities
 * Comprehensive utilities for role-based access control management
 */

import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { member as memberTable, user as userTable } from '@/lib/infrastructure/database/schemas'
import type { ProjectPermission, ProjectRole } from '@/types/domain.types'
import { ROLE_PERMISSIONS } from '@/types/domain.types'
import { checkProjectPermission, requireProjectPermission } from '@/lib/auth/permissions'
import { logger } from '@/lib/utils/logger'
import { ForbiddenError } from '@/lib/utils/error-handler'

/**
 * RBAC Context for access control decisions
 */
export interface RBACContext {
  userId: string
  resourceId?: string
  resourceType?: string
  action: string
}

/**
 * Resource-based permission checker
 */
class RBACService {
  constructor() {
    // Initialize any required dependencies
  }

  /**
   * Check if user has specific permission for resource
   */
  async canAccess(context: RBACContext): Promise<boolean> {
    const { userId, resourceId, resourceType, action } = context
    
    try {
      // Check super admin status first
      if (await this.isSuperAdmin(userId)) {
        return true
      }

      // Handle project-specific permissions
      if (resourceType === 'project' && resourceId) {
        return await checkProjectPermission(userId, resourceId, action as ProjectPermission)
      }

      // Add other resource types as needed
      switch (resourceType) {
        case 'project':
          return resourceId ? 
            await checkProjectPermission(userId, resourceId, action as ProjectPermission) : 
            false
        case 'user':
          return await this.checkUserPermission(userId, action)
        case 'data':
          return resourceId ?
            await checkProjectPermission(userId, resourceId, action as ProjectPermission) :
            false
        default:
          return false
      }
    } catch (error) {
      logger.error('RBAC permission check failed', error, {
        userId,
        resourceId,
        resourceType,
        action
      })
      return false
    }
  }

  /**
   * Require specific permission (throws if not authorized)
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
   * Check if user is super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const user = await db.query.user.findFirst({
        where: eq(userTable.id, userId),
      })

      return user?.role === 'super_admin'
    } catch (error) {
      logger.error('Error checking super admin status', error, { userId })
      return false
    }
  }

  /**
   * Check user permissions for specific resource type
   */
  async checkUserPermission(userId: string, action: string): Promise<boolean> {
    // Implementation based on user's account-level permissions
    try {
      // Get user details
      const user = await db.query.user.findFirst({
        where: eq(userTable.id, userId),
      })

      if (!user) return false

      // Define user-level permissions based on user role
      const userPermissions: Record<string, boolean> = {
        'user.read': true,
        'user.update': userId === user.id, // Users can only update themselves
        'user.delete': user.role === 'super_admin', // Only super admins can delete users
      }

      return userPermissions[action] || false
    } catch (error) {
      logger.error('Error checking user permission', error, { userId, action })
      return false
    }
  }

  /**
   * Get user's role in a specific project
   */
  async getUserRole(userId: string, projectId: string): Promise<ProjectRole | null> {
    try {
      const membership = await db.query.member.findFirst({
        where: and(
          eq(memberTable.userId, userId),
          eq(memberTable.organizationId, projectId)
        ),
      })

      return membership?.role as ProjectRole | null
    } catch (error) {
      logger.error('Error getting user role', error, { userId, projectId })
      return null
    }
  }

  /**
   * Check if user has any of the required permissions
   */
  async hasAnyPermission(userId: string, projectId: string, permissions: ProjectPermission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await checkProjectPermission(userId, projectId, permission)) {
        return true
      }
    }
    return false
  }

  /**
   * Check if user has all of the required permissions
   */
  async hasAllPermissions(userId: string, projectId: string, permissions: ProjectPermission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!await checkProjectPermission(userId, projectId, permission)) {
        return false
      }
    }
    return true
  }

  /**
   * Get all permissions for a user in a project
   */
  async getUserPermissions(userId: string, projectId: string): Promise<ProjectPermission[]> {
    try {
      const role = await this.getUserRole(userId, projectId)
      if (!role) return []

      return ROLE_PERMISSIONS[role] || []
    } catch (error) {
      logger.error('Error getting user permissions', error, { userId, projectId })
      return []
    }
  }

  /**
   * Check if a user can access a specific resource by ID
   */
  async canAccessResourceById(userId: string, resourceId: string, resourceType: 'project' | 'user' | 'data'): Promise<boolean> {
    switch (resourceType) {
      case 'project':
        // For projects, check if user is a member
        const membership = await db.query.member.findFirst({
          where: and(
            eq(memberTable.userId, userId),
            eq(memberTable.organizationId, resourceId)
          ),
        })
        return !!membership
      case 'user':
        // Users can access their own data
        return userId === resourceId
      case 'data':
        // For data access, check project permissions
        return await checkProjectPermission(userId, resourceId, 'data.read')
      default:
        return false
    }
  }
}

// Create a singleton instance
export const rbacService = new RBACService()

// Export for direct use
export const { 
  canAccess, 
  requireAccess, 
  isSuperAdmin, 
  getUserRole, 
  hasAnyPermission, 
  hasAllPermissions,
  getUserPermissions,
  canAccessResourceById 
} = rbacService

/**
 * Higher-order function to create permission-protected handlers
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
 * Resource guard for components
 */
export function createResourceGuard(resourceType: string) {
  return {
    canRead: async (userId: string, resourceId?: string) => 
      await rbacService.canAccess({ userId, resourceId, resourceType, action: `${resourceType}.read` }),
    
    canCreate: async (userId: string, resourceId?: string) => 
      await rbacService.canAccess({ userId, resourceId, resourceType, action: `${resourceType}.create` }),
    
    canUpdate: async (userId: string, resourceId?: string) => 
      await rbacService.canAccess({ userId, resourceId, resourceType, action: `${resourceType}.update` }),
    
    canDelete: async (userId: string, resourceId?: string) => 
      await rbacService.canAccess({ userId, resourceId, resourceType, action: `${resourceType}.delete` }),
    
    requireRead: async (userId: string, resourceId?: string) => 
      await rbacService.requireAccess({ userId, resourceId, resourceType, action: `${resourceType}.read` }),
    
    requireUpdate: async (userId: string, resourceId?: string) => 
      await rbacService.requireAccess({ userId, resourceId, resourceType, action: `${resourceType}.update` }),
    
    requireDelete: async (userId: string, resourceId?: string) => 
      await rbacService.requireAccess({ userId, resourceId, resourceType, action: `${resourceType}.delete` }),
  }
}

/**
 * Permission utility functions
 */
export const PermissionUtils = {
  /**
   * Check if role includes specific permission
   */
  roleHasPermission: (role: ProjectRole, permission: ProjectPermission): boolean => {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false
  },

  /**
   * Get all permissions for multiple roles
   */
  getCombinedPermissions: (roles: ProjectRole[]): ProjectPermission[] => {
    const permissions = new Set<ProjectPermission>()
    roles.forEach(role => {
      const rolePermissions = ROLE_PERMISSIONS[role] || []
      rolePermissions.forEach(permission => permissions.add(permission))
    })
    return Array.from(permissions)
  },

  /**
   * Check if role A has equal or higher privileges than role B
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

// Export the existing functions for backward compatibility
// These are from the original permissions.ts file
export { 
  checkProjectPermission,
  requireProjectPermission,
  getUserProjectRole,
  getUserProjects,
  checkAdminPermission,
} from '@/lib/auth/permissions'