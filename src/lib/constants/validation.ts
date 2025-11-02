/**
 * Validation Constants
 * Centralized validation rules and messages for consistent validation across the application
 */

export const VALIDATION_RULES = {
  PROJECT: {
    NAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 100,
      PATTERN: /^[a-z0-9-@]+$/,
    },
    SLUG: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 50,
      PATTERN: /^[a-z0-9-]+$/,
    },
    TYPE: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
    },
    DESCRIPTION: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 500,
    },
    METADATA: {
      COLOR_PATTERN: /^#[0-9a-f]{6}$/i,
    },
  },
  ENVIRONMENT: {
    NAME: {
      MAX_LENGTH: 50,
    },
    SLUG: {
      MAX_LENGTH: 20,
      PATTERN: /^[a-z0-9-]+$/,
    },
  },
  QUERY: {
    PAGE: {
      MIN: 1,
      DEFAULT: 1,
    },
    LIMIT: {
      MIN: 1,
      MAX: 100,
      DEFAULT: 10,
      AUDIT_DEFAULT: 20,
    },
  },
} as const;

export const VALIDATION_MESSAGES = {
  PROJECT: {
    NAME: {
      REQUIRED: 'Project name is required',
      TOO_SHORT: 'Project name must be at least 3 characters',
      TOO_LONG: 'Project name must be less than 100 characters',
      INVALID_FORMAT:
        'Project name must contain only lowercase letters, numbers, @, and hyphens',
    },
    SLUG: {
      REQUIRED: 'Project slug is required',
      TOO_SHORT: 'Slug must be at least 3 characters',
      TOO_LONG: 'Slug must be less than 50 characters',
      INVALID_FORMAT: 'Slug must contain only lowercase letters, numbers, and hyphens',
    },
    TYPE: {
      REQUIRED: 'Project type is required',
      TOO_LONG: 'Project type must be less than 50 characters',
    },
    DESCRIPTION: {
      TOO_SHORT: 'Description must be at least 10 characters',
      TOO_LONG: 'Description must be less than 500 characters',
    },
    DATABASE_URL: {
      REQUIRED: 'Database URL is required',
      INVALID: 'Invalid database URL',
      INVALID_PROTOCOL: 'Must be a PostgreSQL connection string',
    },
    LOGO: {
      INVALID: 'Logo must be a valid URL',
    },
    METADATA: {
      COLOR_INVALID: 'Color must be a valid hex color',
    },
    ID: {
      REQUIRED: 'Project ID is required',
      INVALID: 'Invalid project ID',
    },
  },
  ENVIRONMENT: {
    ORGANIZATION_ID: {
      REQUIRED: 'Organization ID is required',
    },
    NAME: {
      REQUIRED: 'Environment name is required',
      TOO_LONG: 'Environment name must be less than 50 characters',
    },
    SLUG: {
      REQUIRED: 'Environment slug is required',
      TOO_LONG: 'Environment slug must be less than 20 characters',
      INVALID_FORMAT: 'Slug must contain only lowercase letters, numbers, and hyphens',
    },
    DATABASE_URL: {
      REQUIRED: 'Database URL is required',
    },
    ID: {
      REQUIRED: 'Environment ID is required',
    },
  },
  AUDIT: {
    ORGANIZATION_ID: {
      REQUIRED: 'Organization ID is required',
    },
    USER_ID: {
      REQUIRED: 'User ID is required',
    },
    ENTITY_ID: {
      REQUIRED: 'Entity ID is required',
    },
  },
} as const;
