/**
 * Permission Management Utilities
 * Handles project-level permissions and role-based access control
 *
 * @module permissions
 * @description Provides functions for checking user permissions within projects,
 * validating roles, and managing access control at the project level.
 */

import { auth } from './config'
import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { member as memberTable, user as userTable } from '@/lib/infrastructure/database/schemas'
import type { ProjectPermission, ProjectRole } from '@/types/projects'
import { ROLE_PERMISSIONS } from '@/types/projects'
import { withErrorHandling } from '@/lib/utils/try-catch'

/**
 * Check if a user has a specific permission in a project
 *
 * @param userId - The ID of the user to check
 * @param projectId - The ID of the project
 * @param permission - The permission to check for
 * @returns true if user has the permission, false otherwise
 *
 * @example
 * ```typescript
 * const canEdit = await checkProjectPermission(userId, projectId, 'data.update')
 * if (canEdit) {
 *   // Allow editing
 * }
 * ```
 */
export async function checkProjectPermission(
  userId: string,
  projectId: string,
  permission: ProjectPermission
): Promise<boolean> {
  const result = await withErrorHandling(
    async () => {
      // Get user's role in the project
      const membership = await db.query.member.findFirst({
        where: and(
          eq(memberTable.userId, userId),
          eq(memberTable.organizationId, projectId)
        ),
      })

      if (!membership) {
        return false
      }

      const role = membership.role as ProjectRole
      const permissions = ROLE_PERMISSIONS[role]

      return permissions.includes(permission)
    },
    {
      context: 'checkProjectPermission',
      fallback: false, // Return false on error (permission denied by default)
      shouldLog: true,
    }
  )

  return result.data
}

/**
 * Require a specific permission in a project (throws error if not authorized)
 *
 * @param userId - The ID of the user to check
 * @param projectId - The ID of the project
 * @param permission - The permission to require
 * @throws Error if user lacks the required permission
 *
 * @example
 * ```typescript
 * await requireProjectPermission(userId, projectId, 'project.delete')
 * // If user lacks permission, error is thrown and execution stops
 * await deleteProject(projectId)
 * ```
 */
export async function requireProjectPermission(
  userId: string,
  projectId: string,
  permission: ProjectPermission
): Promise<void> {
  const hasPermission = await checkProjectPermission(userId, projectId, permission)

  if (!hasPermission) {
    throw new Error(`Unauthorized: Missing permission ${permission} for project ${projectId}`)
  }
}

/**
 * Check if a user is a super admin
 *
 * @param userId - The ID of the user to check
 * @returns true if user is a super admin, false otherwise
 *
 * @example
 * ```typescript
 * if (await isSuperAdmin(userId)) {
 *   // Grant access to admin features
 * }
 * ```
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const result = await withErrorHandling(
    async () => {
      const user = await db.query.user.findFirst({
        where: eq(userTable.id, userId),
      })

      return user?.role === 'super_admin' || false
    },
    {
      context: 'isSuperAdmin',
      fallback: false, // Deny admin access on error
      shouldLog: true,
    }
  )

  return result.data
}

/**
 * Get user's role in a project
 *
 * @param userId - The ID of the user
 * @param projectId - The ID of the project
 * @returns The user's role in the project, or null if not a member
 *
 * @example
 * ```typescript
 * const role = await getUserProjectRole(userId, projectId)
 * if (role === 'owner') {
 *   // Owner-specific logic
 * }
 * ```
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  const result = await withErrorHandling(
    async () => {
      const membership = await db.query.member.findFirst({
        where: and(
          eq(memberTable.userId, userId),
          eq(memberTable.organizationId, projectId)
        ),
      })

      return membership?.role as ProjectRole | null
    },
    {
      context: 'getUserProjectRole',
      fallback: null, // Return null if operation fails
      shouldLog: true,
    }
  )

  return result.data
}

/**
 * Get all projects a user has access to
 *
 * @param userId - The ID of the user
 * @returns Array of project memberships with organizationId and role
 *
 * @example
 * ```typescript
 * const projects = await getUserProjects(userId)
 * projects.forEach(({ organizationId, role }) => {
 *   console.log(`Project ${organizationId}: ${role}`)
 * })
 * ```
 */
export async function getUserProjects(userId: string) {
  const result = await withErrorHandling(
    async () => {
      const memberships = await db.query.member.findMany({
        where: eq(memberTable.userId, userId),
      })

      return memberships.map((m) => ({
        organizationId: m.organizationId,
        role: m.role as ProjectRole,
      }))
    },
    {
      context: 'getUserProjects',
      fallback: [], // Return empty array on error
      shouldLog: true,
    }
  )

  return result.data
}

/**
 * Check if user can perform admin action
 * Uses better-auth's admin plugin for account-level permissions
 *
 * @param userId - The ID of the user
 * @param resource - The resource type (e.g., 'users', 'settings')
 * @param action - The action to perform (e.g., 'read', 'write', 'delete')
 * @returns true if user has the admin permission, false otherwise
 *
 * @example
 * ```typescript
 * if (await checkAdminPermission(userId, 'users', 'delete')) {
 *   // Allow user deletion
 * }
 * ```
 */
export async function checkAdminPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const result = await withErrorHandling(
    async () => {
      const permissionCheck = await auth.api.userHasPermission({
        body: {
          userId,
          permissions: {
            [resource]: [action],
          },
        },
      })

      return permissionCheck?.success || false
    },
    {
      context: 'checkAdminPermission',
      fallback: false, // Deny permission on error
      shouldLog: true,
    }
  )

  return result.data
}
