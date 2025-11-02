/**
 * Database Configuration Constants
 * Centralized database connection and pool configuration
 */

export const DATABASE_CONFIG = {
  PROTOCOL: 'postgresql://',
  ENCRYPTED_PLACEHOLDER: '[ENCRYPTED]',

  POOL: {
    MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT || '20', 10),
    CONNECT_TIMEOUT: parseInt(process.env.DB_CONNECT_TIMEOUT || '10', 10),
  },

  TEST_CONNECTION: {
    MAX_CONNECTIONS: 1,
    IDLE_TIMEOUT: 5,
    CONNECT_TIMEOUT: 5,
  },
} as const;
