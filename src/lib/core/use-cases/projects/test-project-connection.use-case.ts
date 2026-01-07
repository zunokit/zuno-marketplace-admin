import { ValidationError, NotFoundError } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
import { DATABASE_CONFIG } from "@/lib/constants";
import {
  normalizeConnectionString,
  getConnectionStringError,
} from "@/lib/utils/normalize-connection-string";
import { db } from "@/lib/db";
import { organization as organizationTable } from "@/lib/infrastructure/database/schemas";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import postgres from "postgres";

export class TestProjectConnectionUseCase {
  async execute(
    projectId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
    details?: {
      host?: string;
      database?: string;
      port?: number;
      responseTime?: number;
    };
  }> {
    // Fetch project from database
    const project = await db.query.organization.findFirst({
      where: eq(organizationTable.id, projectId),
      columns: {
        id: true,
        name: true,
        databaseUrl: true,
      },
    });

    if (!project) {
      throw new NotFoundError(`Project not found: ${projectId}`);
    }

    if (!project.databaseUrl) {
      throw new ValidationError("Database URL not configured for this project");
    }

    // Decrypt the database URL
    let decryptedUrl: string;
    try {
      decryptedUrl = decrypt(project.databaseUrl);
    } catch (error) {
      logger.error("Failed to decrypt database URL", { projectId, error });
      throw new ValidationError("Failed to decrypt database URL");
    }

    // Normalize and validate connection string
    const normalizedUrl = normalizeConnectionString(decryptedUrl);
    const validationError = getConnectionStringError(normalizedUrl);

    if (validationError) {
      throw new ValidationError(validationError);
    }

    // Parse URL to extract host, database, port information
    const url = new URL(normalizedUrl);
    const host = url.hostname;
    const port = parseInt(url.port) || 5432;
    const database = url.pathname.substring(1); // Remove leading '/'

    // Test the connection
    const sql = postgres(normalizedUrl, {
      max: DATABASE_CONFIG.TEST_CONNECTION.MAX_CONNECTIONS,
      connect_timeout: DATABASE_CONFIG.TEST_CONNECTION.CONNECT_TIMEOUT,
      idle_timeout: DATABASE_CONFIG.TEST_CONNECTION.IDLE_TIMEOUT,
    });

    try {
      const startTime = Date.now();
      await sql`SELECT 1 as test`;
      const responseTime = Date.now() - startTime;
      await sql.end();

      logger.info("Database connection test successful", {
        userId,
        projectId,
        responseTime,
      });

      return {
        success: true,
        message: "Connection successful",
        details: {
          host,
          database,
          port,
          responseTime,
        },
      };
    } catch (error) {
      await sql.end();
      logger.error("Database connection test failed", {
        userId,
        projectId,
        error,
      });
      throw new ValidationError(
        "Failed to connect to database: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }
}
