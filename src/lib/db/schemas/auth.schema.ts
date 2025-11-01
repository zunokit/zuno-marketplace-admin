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
