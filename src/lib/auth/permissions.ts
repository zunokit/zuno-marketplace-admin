import { auth } from './config'
import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { member as memberTable, user as userTable } from '@/lib/infrastructure/database/schemas'
import type { ProjectPermission, ProjectRole } from '@/types/projects'
import { ROLE_PERMISSIONS } from '@/types/projects'
import { tryServiceOperation } from '@/lib/utils/service-error-handler'

/**
 * Check if a user has a specific permission in a project
 */
export async function checkProjectPermission(
  userId: string,
  projectId: string,
  permission: ProjectPermission
): Promise<boolean> {
  const result = await tryServiceOperation(async () => {
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
  }, 'checkProjectPermission')

  return result.success ? result.data : false
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
  const result = await tryServiceOperation(async () => {
    const user = await db.query.user.findFirst({
      where: eq(userTable.id, userId),
    })

    return user?.role === 'super_admin' || false
  }, 'isSuperAdmin')

  return result.success ? result.data : false
}

/**
 * Get user's role in a project
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  const result = await tryServiceOperation(async () => {
    const membership = await db.query.member.findFirst({
      where: and(
        eq(memberTable.userId, userId),
        eq(memberTable.organizationId, projectId)
      ),
    })

    return membership?.role as ProjectRole | null
  }, 'getUserProjectRole')

  return result.success ? result.data : null
}

/**
 * Get all projects a user has access to
 */
export async function getUserProjects(userId: string) {
  const result = await tryServiceOperation(async () => {
    const memberships = await db.query.member.findMany({
      where: eq(memberTable.userId, userId),
    })

    return memberships.map((m) => ({
      organizationId: m.organizationId,
      role: m.role as ProjectRole,
    }))
  }, 'getUserProjects')

  return result.success ? result.data : []
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
  const result = await tryServiceOperation(async () => {
    const result = await auth.api.userHasPermission({
      body: {
        userId,
        permissions: {
          [resource]: [action],
        },
      },
    })

    return result?.success || false
  }, 'checkAdminPermission')

  return result.success ? result.data : false
}
