'use server'

import { headers } from 'next/headers'
import { requireAuth } from '@/lib/auth/middleware'
import { ProjectService } from '@/lib/services/project.service'
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectQuerySchema,
  CreateProjectEnvironmentSchema,
  UpdateProjectEnvironmentSchema,
  ProjectEnvironmentQuerySchema,
  AuditLogQuerySchema
} from '@/lib/validations/project.validation'
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQueryInput,
  CreateProjectEnvironmentInput,
  UpdateProjectEnvironmentInput,
  ProjectEnvironmentQueryInput,
  AuditLogQueryInput
} from '@/lib/validations/project.validation'

/**
 * Get request information for audit logging
 */
async function getRequestInfo() {
  const headersList = await headers()
  return {
    ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined,
    userAgent: headersList.get('user-agent') || undefined,
  }
}

/**
 * Create a new project
 */
export async function createProjectAction(data: CreateProjectInput) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to create a project',
      }
    }

    // Validate input
    const validatedData = CreateProjectSchema.parse(data)

    // Get request info for audit
    const requestInfo = await getRequestInfo()

    // Create project
    const project = await ProjectService.createProject(validatedData, session.user.id, {
      ip: requestInfo.ip || undefined,
      userAgent: requestInfo.userAgent || undefined,
    })

    return {
      success: true,
      data: project,
      message: 'Project created successfully',
    }
  } catch (error) {
    console.error('Create project action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create project',
    }
  }
}

/**
 * Update an existing project
 */
export async function updateProjectAction(data: UpdateProjectInput) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to update a project',
      }
    }

    // Validate input
    const validatedData = UpdateProjectSchema.parse(data)

    // Get request info for audit
    const requestInfo = await getRequestInfo()

    // Update project
    const project = await ProjectService.updateProject(validatedData, session.user.id, requestInfo)

    return {
      success: true,
      data: project,
      message: 'Project updated successfully',
    }
  } catch (error) {
    console.error('Update project action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update project',
    }
  }
}

/**
 * Delete a project
 */
export async function deleteProjectAction(projectId: string) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to delete a project',
      }
    }

    // Validate input
    if (!projectId || typeof projectId !== 'string') {
      return {
        success: false,
        error: 'Invalid project ID',
        message: 'Project ID is required',
      }
    }

    // Get request info for audit
    const requestInfo = await getRequestInfo()

    // Delete project
    const project = await ProjectService.deleteProject(projectId, session.user.id, requestInfo)

    return {
      success: true,
      data: project,
      message: 'Project deleted successfully',
    }
  } catch (error) {
    console.error('Delete project action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete project',
    }
  }
}

/**
 * Get project by ID
 */
export async function getProjectByIdAction(projectId: string) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view project details',
      }
    }

    // Validate input
    if (!projectId || typeof projectId !== 'string') {
      return {
        success: false,
        error: 'Invalid project ID',
        message: 'Project ID is required',
      }
    }

    // Get project
    const project = await ProjectService.getProjectById(projectId)

    if (!project) {
      return {
        success: false,
        error: 'Not found',
        message: 'Project not found',
      }
    }

    return {
      success: true,
      data: project,
      message: 'Project retrieved successfully',
    }
  } catch (error) {
    console.error('Get project action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve project',
    }
  }
}

/**
 * Get project by slug
 */
export async function getProjectBySlugAction(slug: string) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view project details',
      }
    }

    // Validate input
    if (!slug || typeof slug !== 'string') {
      return {
        success: false,
        error: 'Invalid slug',
        message: 'Project slug is required',
      }
    }

    // Get project
    const project = await ProjectService.getProjectBySlug(slug)

    if (!project) {
      return {
        success: false,
        error: 'Not found',
        message: 'Project not found',
      }
    }

    return {
      success: true,
      data: project,
      message: 'Project retrieved successfully',
    }
  } catch (error) {
    console.error('Get project by slug action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve project',
    }
  }
}

/**
 * Get all projects with pagination and filtering
 */
export async function getProjectsAction(query: ProjectQueryInput) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view projects',
      }
    }

    // Validate input
    const validatedQuery = ProjectQuerySchema.parse(query)

    // Get projects
    const result = await ProjectService.getProjects(validatedQuery)

    return {
      success: true,
      data: result,
      message: 'Projects retrieved successfully',
    }
  } catch (error) {
    console.error('Get projects action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve projects',
    }
  }
}

/**
 * Create a new project environment
 */
export async function createProjectEnvironmentAction(data: CreateProjectEnvironmentInput) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to create a project environment',
      }
    }

    // Validate input
    const validatedData = CreateProjectEnvironmentSchema.parse(data)

    // Get request info for audit
    const requestInfo = await getRequestInfo()

    // Create environment
    const environment = await ProjectService.createProjectEnvironment(validatedData, session.user.id, requestInfo)

    return {
      success: true,
      data: environment,
      message: 'Project environment created successfully',
    }
  } catch (error) {
    console.error('Create project environment action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create project environment',
    }
  }
}

/**
 * Update a project environment
 */
export async function updateProjectEnvironmentAction(data: UpdateProjectEnvironmentInput) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to update a project environment',
      }
    }

    // Validate input
    const validatedData = UpdateProjectEnvironmentSchema.parse(data)

    // Get request info for audit
    const requestInfo = await getRequestInfo()

    // Update environment
    const environment = await ProjectService.updateProjectEnvironment(validatedData, session.user.id, requestInfo)

    return {
      success: true,
      data: environment,
      message: 'Project environment updated successfully',
    }
  } catch (error) {
    console.error('Update project environment action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update project environment',
    }
  }
}

/**
 * Delete a project environment
 */
export async function deleteProjectEnvironmentAction(environmentId: string) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to delete a project environment',
      }
    }

    // Validate input
    if (!environmentId || typeof environmentId !== 'string') {
      return {
        success: false,
        error: 'Invalid environment ID',
        message: 'Environment ID is required',
      }
    }

    // Get request info for audit
    const requestInfo = await getRequestInfo()

    // Delete environment
    const environment = await ProjectService.deleteProjectEnvironment(environmentId, session.user.id, requestInfo)

    return {
      success: true,
      data: environment,
      message: 'Project environment deleted successfully',
    }
  } catch (error) {
    console.error('Delete project environment action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete project environment',
    }
  }
}

/**
 * Get project environments
 */
export async function getProjectEnvironmentsAction(query: ProjectEnvironmentQueryInput) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view project environments',
      }
    }

    // Validate input
    const validatedQuery = ProjectEnvironmentQuerySchema.parse(query)

    // Get environments
    const result = await ProjectService.getProjectEnvironments(validatedQuery)

    return {
      success: true,
      data: result,
      message: 'Project environments retrieved successfully',
    }
  } catch (error) {
    console.error('Get project environments action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve project environments',
    }
  }
}

/**
 * Get audit logs for a project
 */
export async function getAuditLogsAction(query: AuditLogQueryInput) {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view audit logs',
      }
    }

    // Validate input
    const validatedQuery = AuditLogQuerySchema.parse(query)

    // Get audit logs
    const result = await ProjectService.getAuditLogs(validatedQuery)

    return {
      success: true,
      data: result,
      message: 'Audit logs retrieved successfully',
    }
  } catch (error) {
    console.error('Get audit logs action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve audit logs',
    }
  }
}

/**
 * Get projects registry (backward compatibility)
 */
export async function getProjectsRegistryAction() {
  try {
    // Get authenticated user
    const session = await requireAuth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view projects registry',
      }
    }

    // Get projects registry
    const registry = await ProjectService.getProjectsRegistry()

    return {
      success: true,
      data: registry,
      message: 'Projects registry retrieved successfully',
    }
  } catch (error) {
    console.error('Get projects registry action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve projects registry',
    }
  }
}