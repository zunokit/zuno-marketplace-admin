import { auth } from './config'
import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { member as memberTable } from '@/lib/infrastructure/database/schemas/auth.schema'
import type { ProjectPermission, ProjectRole } from '@/types/projects'
import { ROLE_PERMISSIONS } from '@/types/projects'

/**
 * Check if a user has a specific permission in a project
 */
export async function checkProjectPermission(
  userId: string,
  projectId: string,
  permission: ProjectPermission
): Promise<boolean> {
  try {
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
  } catch (error) {
    console.error('Error checking project permission:', error)
    return false
  }
}

/**
 * Require a specific permission in a project (throws error if not authorized)
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
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const user = await db.query.user.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    })

    return user?.role?.includes('super_admin') || false
  } catch (error) {
    console.error('Error checking super admin status:', error)
    return false
  }
}

/**
 * Get user's role in a project
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  try {
    const membership = await db.query.member.findFirst({
      where: and(
        eq(memberTable.userId, userId),
        eq(memberTable.organizationId, projectId)
      ),
    })

    return membership?.role as ProjectRole | null
  } catch (error) {
    console.error('Error getting user project role:', error)
    return null
  }
}

/**
 * Get all projects a user has access to
 */
export async function getUserProjects(userId: string) {
  try {
    const memberships = await db.query.member.findMany({
      where: eq(memberTable.userId, userId),
    })

    return memberships.map((m) => ({
      organizationId: m.organizationId,
      role: m.role as ProjectRole,
    }))
  } catch (error) {
    console.error('Error getting user projects:', error)
    return []
  }
}

/**
 * Check if user can perform admin action
 * Uses better-auth's admin plugin
 */
export async function checkAdminPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const result = await auth.api.userHasPermission({
      body: {
        userId,
        permissions: {
          [resource]: [action],
        },
      },
    })

    return result?.success || false
  } catch (error) {
    console.error('Error checking admin permission:', error)
    return false
  }
}
