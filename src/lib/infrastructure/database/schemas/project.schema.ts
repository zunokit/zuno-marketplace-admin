import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  check,
  integer,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { user } from "./user.schema";
import { organization } from "./organization.schema";

/**
 * Project Environment table for different environments (dev, staging, prod)
 */
export const projectEnvironment = pgTable(
  "project_environment",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    databaseUrl: text("database_url").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by"),
  },
  (table) => ({
    organizationIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
    }).onDelete("cascade"),
    deletedByFk: foreignKey({
      columns: [table.deletedBy],
      foreignColumns: [user.id],
    }).onDelete("set null"),
    orgIdIdx: index("project_env_org_id_idx").on(table.organizationId),
    slugIdx: index("project_env_slug_idx").on(table.slug),
    isActiveIdx: index("project_env_is_active_idx").on(table.isActive),
    orgActiveIdx: index("project_env_org_active_idx").on(
      table.organizationId,
      table.isActive
    ),
    deletedAtIdx: index("project_env_deleted_at_idx").on(table.deletedAt),
    slugFormatCheck: check(
      "project_env_slug_format_check",
      sql`${table.slug} ~ '^[a-z0-9-]+$'`
    ),
  })
).enableRLS();

/**
 * Project Feature table for feature flags
 */
export const projectFeature = pgTable(
  "project_feature",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    key: text("key").notNull(),
    description: text("description"),
    isEnabled: boolean("is_enabled").default(false).notNull(),
    configuration: jsonb("configuration"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    organizationIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
    }).onDelete("cascade"),
    orgFeatureUnique: {
      unique: true,
      columns: [table.organizationId, table.key],
    },
    orgIdIdx: index("project_feature_org_id_idx").on(table.organizationId),
    keyIdx: index("project_feature_key_idx").on(table.key),
    isEnabledIdx: index("project_feature_is_enabled_idx").on(table.isEnabled),
    orgEnabledIdx: index("project_feature_org_enabled_idx").on(
      table.organizationId,
      table.isEnabled
    ),
  })
).enableRLS();

/**
 * Project Configuration table for project settings
 */
export const projectConfiguration = pgTable(
  "project_configuration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    isEncrypted: boolean("is_encrypted").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    organizationIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
    }).onDelete("cascade"),
    orgConfigUnique: {
      unique: true,
      columns: [table.organizationId, table.key],
    },
    orgIdIdx: index("project_config_org_id_idx").on(table.organizationId),
    keyIdx: index("project_config_key_idx").on(table.key),
    isEncryptedIdx: index("project_config_is_encrypted_idx").on(
      table.isEncrypted
    ),
  })
).enableRLS();

/**
 * Project Audit Log table for tracking changes
 */
export const projectAuditLog = pgTable(
  "project_audit_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
    }).onDelete("cascade"),
    userIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
    }).onDelete("cascade"),
    orgIdIdx: index("audit_log_org_id_idx").on(table.organizationId),
    userIdIdx: index("audit_log_user_id_idx").on(table.userId),
    actionIdx: index("audit_log_action_idx").on(table.action),
    entityTypeIdx: index("audit_log_entity_type_idx").on(table.entityType),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
    orgCreatedAtIdx: index("audit_log_org_created_at_idx").on(
      table.organizationId,
      table.createdAt
    ),
  })
).enableRLS();

/**
 * Project Template table for project templates
 */
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

    defaultProjectType: text("default_project_type"),
    defaultFeatures: jsonb("default_features").$type<string[]>(),
    defaultConfiguration: jsonb("default_configuration").$type<
      Record<string, unknown>
    >(),

    defaultEnvironments: jsonb("default_environments").$type<
      Array<{
        name: string;
        slug: string;
        description: string;
      }>
    >(),

    isPublic: boolean("is_public").default(true).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdBy: text("created_by"),
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
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
    }).onDelete("set null"),
    slugIdx: index("project_template_slug_idx").on(table.slug),
    categoryIdx: index("project_template_category_idx").on(table.category),
    isPublicIdx: index("project_template_is_public_idx").on(table.isPublic),
    usageCountIdx: index("project_template_usage_count_idx").on(
      table.usageCount
    ),
    deletedAtIdx: index("project_template_deleted_at_idx").on(table.deletedAt),
    categoryCheck: check(
      "template_category_check",
      sql`${table.category} IN ('marketplace', 'saas', 'content', 'analytics', 'custom')`
    ),
  })
).enableRLS();

/**
 * Project API Key table for API key management
 */
export const projectApiKey = pgTable(
  "project_api_key",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    organizationId: text("organization_id").notNull(),

    name: text("name").notNull(),
    description: text("description"),

    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),

    scopes: jsonb("scopes").$type<string[]>().notNull(),
    environmentId: text("environment_id"),

    lastUsedAt: timestamp("last_used_at"),
    lastUsedIp: text("last_used_ip"),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").default(true).notNull(),

    createdBy: text("created_by").notNull(),
    revokedAt: timestamp("revoked_at"),
    revokedBy: text("revoked_by"),
    revokedReason: text("revoked_reason"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    organizationIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
    }).onDelete("cascade"),
    environmentIdFk: foreignKey({
      columns: [table.environmentId],
      foreignColumns: [projectEnvironment.id],
    }).onDelete("cascade"),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
    }).onDelete("cascade"),
    revokedByFk: foreignKey({
      columns: [table.revokedBy],
      foreignColumns: [user.id],
    }).onDelete("set null"),
    orgIdIdx: index("project_api_key_org_id_idx").on(table.organizationId),
    keyHashIdx: index("project_api_key_hash_idx").on(table.keyHash),
    isActiveIdx: index("project_api_key_is_active_idx").on(table.isActive),
    expiresAtIdx: index("project_api_key_expires_at_idx").on(table.expiresAt),
    lastUsedAtIdx: index("project_api_key_last_used_at_idx").on(
      table.lastUsedAt
    ),
    orgActiveIdx: index("project_api_key_org_active_idx").on(
      table.organizationId,
      table.isActive
    ),
  })
).enableRLS();

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
