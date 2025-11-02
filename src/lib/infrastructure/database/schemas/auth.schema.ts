import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  check,
  integer,
  // pgPolicy, // TEMPORARY: Disabled to allow db:push
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Better-auth will create these tables automatically, but we define them here
 * for type safety and to add custom fields/RLS policies
 */

// User table (managed by better-auth with custom fields)
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(), // Better Auth uses text for IDs
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    // Custom fields for RBAC
    role: text("role"), // Global role: super_admin, user (nullable as per Better Auth)
    metadata: jsonb("metadata"), // Custom field kept as jsonb
    // Admin plugin fields
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
  },
  (table) => ({
    emailIdx: index("user_email_idx").on(table.email),
    roleIdx: index("user_role_idx").on(table.role),
    createdAtIdx: index("user_created_at_idx").on(table.createdAt),
    bannedIdx: index("user_banned_idx").on(table.banned),
  })
);

// Session table (managed by better-auth)
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(), // Better Auth uses text for IDs
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(), // Better Auth session token
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"), // Better Auth multi-org support
    // Admin plugin field for impersonation
    impersonatedBy: text("impersonated_by"),
  }
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Account table (for OAuth providers, managed by better-auth)
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(), // Better Auth uses text for IDs
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"), // Better Auth OAuth scope
    password: text("password"), // For email/password auth
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Verification table (for email verification, managed by better-auth)
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(), // Better Auth uses text for IDs
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Organization table (represents projects in our system)
export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(), // Better Auth uses text for IDs
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"), // Better Auth uses text, but we can keep jsonb if needed
    // Project-specific custom fields
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    metadataJson: jsonb("metadata_json"), // Custom field for structured metadata
    projectType: text("project_type"), // 'abis', 'metadata', etc. (optional)
    databaseUrl: text("database_url"), // Encrypted database connection string (optional)
    description: text("description"), // Project description
    status: text("status").default("active").notNull(), // active, inactive, archived
    icon: text("icon"), // Project icon/emoji
    color: text("color"), // Project theme color
    // Template support
    templateId: text("template_id"),
    // Soft delete support
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by").references(() => user.id),
  },
  (table) => ({
    slugIdx: index("organization_slug_idx").on(table.slug),
    statusIdx: index("organization_status_idx").on(table.status),
    projectTypeIdx: index("organization_project_type_idx").on(table.projectType),
    createdAtIdx: index("organization_created_at_idx").on(table.createdAt),
    statusTypeIdx: index("organization_status_type_idx").on(table.status, table.projectType),
    deletedAtIdx: index("organization_deleted_at_idx").on(table.deletedAt),
    templateIdIdx: index("organization_template_id_idx").on(table.templateId),
    statusCheck: check(
      "organization_status_check",
      sql`${table.status} IN ('active', 'inactive', 'archived', 'draft')`
    ),
  })
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Member table (users within organizations/projects)
export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(), // Better Auth uses text for IDs
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(), // Better Auth default is 'member'
    createdAt: timestamp("created_at").notNull(),
    // Custom field
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    // Soft delete support
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by").references(() => user.id),
  },
  (table) => ({
    orgIdIdx: index("member_org_id_idx").on(table.organizationId),
    userIdIdx: index("member_user_id_idx").on(table.userId),
    roleIdx: index("member_role_idx").on(table.role),
    orgUserIdx: index("member_org_user_idx").on(table.organizationId, table.userId),
    deletedAtIdx: index("member_deleted_at_idx").on(table.deletedAt),
    roleCheck: check(
      "member_role_check",
      sql`${table.role} IN ('owner', 'admin', 'member', 'viewer')`
    ),
  })
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Invitation table (for inviting users to organizations/projects)
export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(), // Better Auth uses text for IDs
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"), // Better Auth: nullable
    status: text("status").default("pending").notNull(), // pending, accepted, expired
    expiresAt: timestamp("expires_at").notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Custom fields
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    orgIdIdx: index("invitation_org_id_idx").on(table.organizationId),
    emailIdx: index("invitation_email_idx").on(table.email),
    statusIdx: index("invitation_status_idx").on(table.status),
    expiresAtIdx: index("invitation_expires_at_idx").on(table.expiresAt),
    statusExpiresIdx: index("invitation_status_expires_idx").on(table.status, table.expiresAt),
    statusCheck: check(
      "invitation_status_check",
      sql`${table.status} IN ('pending', 'accepted', 'rejected', 'expired')`
    ),
  })
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Project environments table (for different deployment environments)
export const projectEnvironment = pgTable(
  "project_environment",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // development, staging, production
    slug: text("slug").notNull(), // dev, staging, prod
    databaseUrl: text("database_url").notNull(), // Encrypted database URL for this environment
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    // Soft delete support
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by").references(() => user.id),
  },
  (table) => ({
    orgIdIdx: index("project_env_org_id_idx").on(table.organizationId),
    slugIdx: index("project_env_slug_idx").on(table.slug),
    isActiveIdx: index("project_env_is_active_idx").on(table.isActive),
    orgActiveIdx: index("project_env_org_active_idx").on(table.organizationId, table.isActive),
    deletedAtIdx: index("project_env_deleted_at_idx").on(table.deletedAt),
    slugFormatCheck: check(
      "project_env_slug_format_check",
      sql`${table.slug} ~ '^[a-z0-9-]+$'`
    ),
  })
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Project features table (for dynamic feature flags)
export const projectFeature = pgTable(
  "project_feature",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // Feature name: analytics, multi_tenancy, custom_domains, etc.
    key: text("key").notNull(), // Feature key for programmatic access
    description: text("description"),
    isEnabled: boolean("is_enabled").default(false).notNull(),
    configuration: jsonb("configuration"), // Feature-specific configuration
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    orgFeatureUnique: { unique: true, columns: [table.organizationId, table.key] },
    orgIdIdx: index("project_feature_org_id_idx").on(table.organizationId),
    keyIdx: index("project_feature_key_idx").on(table.key),
    isEnabledIdx: index("project_feature_is_enabled_idx").on(table.isEnabled),
    orgEnabledIdx: index("project_feature_org_enabled_idx").on(table.organizationId, table.isEnabled),
  })
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Project configuration table (extensible config storage)
export const projectConfiguration = pgTable(
  "project_configuration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // Configuration key: theme, integrations, settings, etc.
    value: jsonb("value").notNull(), // Configuration value (JSON)
    description: text("description"),
    isEncrypted: boolean("is_encrypted").default(false).notNull(), // For sensitive data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    orgConfigUnique: { unique: true, columns: [table.organizationId, table.key] },
    orgIdIdx: index("project_config_org_id_idx").on(table.organizationId),
    keyIdx: index("project_config_key_idx").on(table.key),
    isEncryptedIdx: index("project_config_is_encrypted_idx").on(table.isEncrypted),
  })
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Project audit logs table
export const projectAuditLog = pgTable(
  "project_audit_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // created, updated, deleted, environment_added, etc.
    entityType: text("entity_type").notNull(), // project, environment, member
    entityId: text("entity_id").notNull(), // ID of the affected entity
    oldValues: jsonb("old_values"), // Previous values (for updates)
    newValues: jsonb("new_values"), // New values
    metadata: jsonb("metadata"), // Additional context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("audit_log_org_id_idx").on(table.organizationId),
    userIdIdx: index("audit_log_user_id_idx").on(table.userId),
    actionIdx: index("audit_log_action_idx").on(table.action),
    entityTypeIdx: index("audit_log_entity_type_idx").on(table.entityType),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
    orgCreatedAtIdx: index("audit_log_org_created_at_idx").on(table.organizationId, table.createdAt),
  })
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

// Project Template table (for creating projects from predefined templates)
export const projectTemplate = pgTable(
  "project_template",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),
    category: text("category").default("custom").notNull(),

    // Template configuration
    defaultProjectType: text("default_project_type"),
    defaultFeatures: jsonb("default_features").$type<string[]>(),
    defaultConfiguration: jsonb("default_configuration").$type<Record<string, unknown>>(),

    // Environment templates
    defaultEnvironments: jsonb("default_environments").$type<
      Array<{
        name: string;
        slug: string;
        description: string;
      }>
    >(),

    // Metadata
    isPublic: boolean("is_public").default(true).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdBy: text("created_by").references(() => user.id),
    usageCount: integer("usage_count").default(0).notNull(),

    version: text("version").default("1.0.0").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    slugIdx: index("project_template_slug_idx").on(table.slug),
    categoryIdx: index("project_template_category_idx").on(table.category),
    isPublicIdx: index("project_template_is_public_idx").on(table.isPublic),
    usageCountIdx: index("project_template_usage_count_idx").on(table.usageCount),
    deletedAtIdx: index("project_template_deleted_at_idx").on(table.deletedAt),
    categoryCheck: check(
      "template_category_check",
      sql`${table.category} IN ('marketplace', 'saas', 'content', 'analytics', 'custom')`
    ),
  })
);

// Project API Key table (for secure API access to projects)
export const projectApiKey = pgTable(
  "project_api_key",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),

    // Key management (NEVER store plaintext!)
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),

    // Permissions
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    environmentId: text("environment_id").references(() => projectEnvironment.id, {
      onDelete: "cascade",
    }),

    // Security
    lastUsedAt: timestamp("last_used_at"),
    lastUsedIp: text("last_used_ip"),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").default(true).notNull(),

    // Metadata
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    revokedAt: timestamp("revoked_at"),
    revokedBy: text("revoked_by").references(() => user.id),
    revokedReason: text("revoked_reason"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    orgIdIdx: index("project_api_key_org_id_idx").on(table.organizationId),
    keyHashIdx: index("project_api_key_hash_idx").on(table.keyHash),
    isActiveIdx: index("project_api_key_is_active_idx").on(table.isActive),
    expiresAtIdx: index("project_api_key_expires_at_idx").on(table.expiresAt),
    lastUsedAtIdx: index("project_api_key_last_used_at_idx").on(table.lastUsedAt),
    orgActiveIdx: index("project_api_key_org_active_idx").on(table.organizationId, table.isActive),
  })
);

// Export types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;

export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;

export type ProjectEnvironment = typeof projectEnvironment.$inferSelect;
export type NewProjectEnvironment = typeof projectEnvironment.$inferInsert;

export type ProjectFeature = typeof projectFeature.$inferSelect;
export type NewProjectFeature = typeof projectFeature.$inferInsert;

export type ProjectConfiguration = typeof projectConfiguration.$inferSelect;
export type NewProjectConfiguration = typeof projectConfiguration.$inferInsert;

export type ProjectAuditLog = typeof projectAuditLog.$inferSelect;
export type NewProjectAuditLog = typeof projectAuditLog.$inferInsert;

export type ProjectTemplate = typeof projectTemplate.$inferSelect;
export type NewProjectTemplate = typeof projectTemplate.$inferInsert;

export type ProjectApiKey = typeof projectApiKey.$inferSelect;
export type NewProjectApiKey = typeof projectApiKey.$inferInsert;
