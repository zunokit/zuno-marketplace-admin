import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organization as organizationTable } from "@/lib/infrastructure/database/schemas";
import { decrypt } from "@/lib/crypto";
import { logger } from "@/lib/utils/logger";
import { isProduction } from "@/lib/utils/environment";
import { errorHandler, NotFoundError } from "@/lib/utils/error-handler";
import { DATABASE_CONFIG } from "@/lib/constants/database";

// Cache for database connections (singleton pattern for serverless)
const projectDbConnections = new Map<string, ReturnType<typeof drizzle>>();
const postgresClients = new Map<string, ReturnType<typeof postgres>>();

// Cache for project configurations (5 minutes TTL)
interface ProjectConfigCache {
  databaseUrl: string;
  timestamp: number;
}
const projectConfigCache = new Map<string, ProjectConfigCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get project configuration from database
 */
async function getProjectConfig(projectId: string): Promise<string> {
  return errorHandler(async () => {
    // Check cache first
    const cached = projectConfigCache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug("Using cached project config", { projectId });
      return cached.databaseUrl;
    }

    // Fetch from database
    logger.debug("Fetching project config from database", { projectId });

    const project = await db.query.organization.findFirst({
      where: eq(organizationTable.id, projectId),
      columns: {
        databaseUrl: true,
      },
    });

    if (!project) {
      throw new NotFoundError(`Project not found: ${projectId}`);
    }

    if (!project.databaseUrl) {
      throw new Error(`Database URL not configured for project: ${projectId}`);
    }

    // Decrypt database URL
    const decryptedUrl = decrypt(project.databaseUrl);

    // Cache for future use
    projectConfigCache.set(projectId, {
      databaseUrl: decryptedUrl,
      timestamp: Date.now(),
    });

    return decryptedUrl;
  }, "getProjectConfig");
}

/**
 * Get or create a database connection for a specific project
 * Now fetches project configuration from database (fully dynamic!)
 */
export async function getProjectDb(projectId: string) {
  // Check if connection already exists
  if (projectDbConnections.has(projectId)) {
    logger.debug("Reusing existing database connection", { projectId });
    return projectDbConnections.get(projectId)!;
  }

  logger.info("Creating new database connection", { projectId });

  // Get project configuration from database
  const databaseUrl = await getProjectConfig(projectId);

  // Create new PostgreSQL client
  const connection = postgres(databaseUrl, {
    max: DATABASE_CONFIG.POOL.MAX_CONNECTIONS,
    idle_timeout: DATABASE_CONFIG.POOL.IDLE_TIMEOUT,
    connect_timeout: DATABASE_CONFIG.POOL.CONNECT_TIMEOUT,
    debug: !isProduction(),
  });

  // Create Drizzle instance
  const drizzleDb = drizzle(connection);

  // Cache the connections
  postgresClients.set(projectId, connection);
  projectDbConnections.set(projectId, drizzleDb);

  logger.info("Database connection established", { projectId });

  return drizzleDb;
}

/**
 * Clear project config cache (call after updating project)
 */
export function clearProjectConfigCache(projectId?: string) {
  if (projectId) {
    projectConfigCache.delete(projectId);
    logger.debug("Cleared project config cache", { projectId });
  } else {
    projectConfigCache.clear();
    logger.debug("Cleared all project config cache");
  }
}

/**
 * Close a specific project database connection
 */
export async function closeProjectDb(projectId: string) {
  const client = postgresClients.get(projectId);
  if (client) {
    await client.end();
    postgresClients.delete(projectId);
    projectDbConnections.delete(projectId);
    projectConfigCache.delete(projectId);
    logger.info("Closed database connection", { projectId });
  }
}

/**
 * Close all project database connections
 */
export async function closeAllProjectDbs() {
  logger.info("Closing all database connections", {
    count: postgresClients.size,
  });

  const closePromises = Array.from(postgresClients.values()).map((client) =>
    client.end()
  );
  await Promise.all(closePromises);

  postgresClients.clear();
  projectDbConnections.clear();
  projectConfigCache.clear();

  logger.info("All database connections closed");
}

// Cleanup on process exit (important for serverless)
if (typeof window === "undefined") {
  process.on("beforeExit", async () => {
    await closeAllProjectDbs();
  });
}
