/**
 * Normalize PostgreSQL Connection String
 * Utility functions for validating and normalizing PostgreSQL connection strings
 */

import { DATABASE_CONFIG } from "@/lib/constants";

/**
 * PostgreSQL connection string regex
 * Format: postgresql://[user[:password]@][host][:port][/database][?params]
 */
const PG_URL_REGEX = /^postgresql:\/\/([^:@]+)(?::([^@]+))?@([^:/]+)(?::(\d+))?\/([^?]+)(\?.*)?$/;

/**
 * Normalize a PostgreSQL connection string by trimming whitespace
 * @param connectionString - The connection string to normalize
 * @returns Normalized connection string
 */
export function normalizeConnectionString(connectionString: string): string {
  return connectionString.trim();
}

/**
 * Validate PostgreSQL connection string format
 * @param connectionString - The connection string to validate
 * @returns true if valid, false otherwise
 */
export function isValidPostgresUrl(connectionString: string): boolean {
  const normalized = normalizeConnectionString(connectionString);

  // Check protocol
  if (!normalized.startsWith(DATABASE_CONFIG.PROTOCOL)) {
    return false;
  }

  // Check format
  return PG_URL_REGEX.test(normalized);
}

/**
 * Parse PostgreSQL connection string components
 * @param connectionString - The connection string to parse
 * @returns Parsed components or null if invalid
 */
export function parsePostgresUrl(connectionString: string): {
  user: string;
  password: string | undefined;
  host: string;
  port: number;
  database: string;
  params: string | undefined;
} | null {
  const normalized = normalizeConnectionString(connectionString);
  const match = normalized.match(PG_URL_REGEX);

  if (!match) {
    return null;
  }

  const [, user, password, host, port, database, params] = match;

  return {
    user,
    password,
    host,
    port: port ? parseInt(port, 10) : 5432,
    database,
    params,
  };
}

/**
 * Get error message for invalid PostgreSQL connection string
 * @param connectionString - The connection string to validate
 * @returns Error message or null if valid
 */
export function getConnectionStringError(connectionString: string): string | null {
  const normalized = normalizeConnectionString(connectionString);

  if (!normalized) {
    return "Connection string cannot be empty";
  }

  if (!normalized.startsWith(DATABASE_CONFIG.PROTOCOL)) {
    return `Connection string must start with '${DATABASE_CONFIG.PROTOCOL}'`;
  }

  if (!PG_URL_REGEX.test(normalized)) {
    return "Invalid PostgreSQL connection string format. Expected: postgresql://user:password@host:port/database";
  }

  return null;
}
