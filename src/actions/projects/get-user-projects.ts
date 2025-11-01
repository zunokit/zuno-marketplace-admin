'use server'

/**
 * Get projects for current user (based on their memberships)
 */

import { requireAuth } from '@/lib/auth/middleware'
import { getUserProjects } from '@/lib/auth/permissions'
import { db } from '@/lib/db'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from '@/lib/utils/api-response'
import { errorHandler } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

export async function getUserProjectsAction(): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth()

    const projects = await errorHandler(async () => {
      // Get user's project memberships
      const memberships = await getUserProjects(session.user.id)

      // Fetch full project details for each membership
      const projectDetails = await Promise.all(
        memberships.map(async (membership) => {
          const org = await db.query.organization.findFirst({
            where: (orgs, { eq }) => eq(orgs.id, membership.organizationId),
          })

          if (!org) return null

          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo: org.logo,
            projectType: org.projectType,
            metadata: org.metadata,
            role: membership.role,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt,
          }
        })
      )

      // Filter out nulls
      return projectDetails.filter((p) => p !== null)
    }, 'getUserProjects')

    logger.info('Retrieved user projects', {
      userId: session.user.id,
      projectCount: projects.length,
    })

    return serverActionSuccess(projects)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}
