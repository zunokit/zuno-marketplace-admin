import { ValidationError } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
import { DATABASE_CONFIG } from "@/lib/constants";
import postgres from "postgres";

export class TestProjectConnectionUseCase {
  async execute(databaseUrl: string, userId: string): Promise<{ success: boolean; message: string }> {
    if (!databaseUrl.startsWith(DATABASE_CONFIG.PROTOCOL)) {
      throw new ValidationError("Invalid PostgreSQL connection string");
    }

    const sql = postgres(databaseUrl, {
      max: DATABASE_CONFIG.TEST_CONNECTION.MAX_CONNECTIONS,
      connect_timeout: DATABASE_CONFIG.TEST_CONNECTION.CONNECT_TIMEOUT,
      idle_timeout: DATABASE_CONFIG.TEST_CONNECTION.IDLE_TIMEOUT,
    });

    try {
      await sql`SELECT 1 as test`;
      await sql.end();

      logger.info("Database connection test successful", { userId });

      return { success: true, message: "Connection successful" };
    } catch (error) {
      await sql.end();
      throw new ValidationError(
        "Failed to connect to database: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }
}
