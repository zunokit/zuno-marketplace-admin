import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  // pgPolicy, // TEMPORARY: Disabled to allow db:push
} from "drizzle-orm/pg-core";
// import { sql } from "drizzle-orm"; // TEMPORARY: Disabled to allow db:push

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
  }
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
  }
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
  }
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
  }
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
  }
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
  }
); // .enableRLS() - TEMPORARY: Disabled to allow db:push

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
