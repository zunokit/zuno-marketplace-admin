import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { ProjectId } from '@/config/projects.config'

// Cache for database connections (singleton pattern for serverless)
const projectDbConnections = new Map<string, ReturnType<typeof drizzle>>()
const postgresClients = new Map<string, ReturnType<typeof postgres>>()

/**
 * Get or create a database connection for a specific project
 * This function implements connection pooling and caching for serverless environments
 */
export function getProjectDb(projectId: ProjectId) {
  // Check if connection already exists
  if (projectDbConnections.has(projectId)) {
    return projectDbConnections.get(projectId)!
  }

  // Import the config to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PROJECTS_REGISTRY } = require('@/config/projects.config')

  const projectConfig = PROJECTS_REGISTRY[projectId]

  if (!projectConfig) {
    throw new Error(`Unknown project: ${projectId}`)
  }

  if (!projectConfig.databaseUrl) {
    throw new Error(`Database URL not configured for project: ${projectId}`)
  }

  // Create new PostgreSQL client
  const client = postgres(projectConfig.databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  // Create Drizzle instance
  const drizzleDb = drizzle(client)

  // Cache the connections
  postgresClients.set(projectId, client)
  projectDbConnections.set(projectId, drizzleDb)

  return drizzleDb
}

/**
 * Close a specific project database connection
 */
export async function closeProjectDb(projectId: ProjectId) {
  const client = postgresClients.get(projectId)
  if (client) {
    await client.end()
    postgresClients.delete(projectId)
    projectDbConnections.delete(projectId)
  }
}

/**
 * Close all project database connections
 */
export async function closeAllProjectDbs() {
  const closePromises = Array.from(postgresClients.values()).map((client) =>
    client.end()
  )
  await Promise.all(closePromises)
  postgresClients.clear()
  projectDbConnections.clear()
}

// Cleanup on process exit (important for serverless)
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await closeAllProjectDbs()
  })
}
