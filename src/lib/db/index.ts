import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/infrastructure/database/schemas/auth.schema";
import { DATABASE_CONFIG } from "@/lib/constants/database";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Create PostgreSQL connection
const connectionString = process.env.DATABASE_URL;

// For serverless environments, use connection pooling
const client = postgres(connectionString, {
  max: DATABASE_CONFIG.POOL.MAX_CONNECTIONS,
  idle_timeout: DATABASE_CONFIG.POOL.IDLE_TIMEOUT,
  connect_timeout: DATABASE_CONFIG.POOL.CONNECT_TIMEOUT,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in queries
export { schema };

// Export types
export type Database = typeof db;
