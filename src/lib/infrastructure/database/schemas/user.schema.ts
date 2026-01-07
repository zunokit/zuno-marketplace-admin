import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { organization } from "./organization.schema";

/**
 * Core authentication tables managed by better-auth
 * User table with custom fields for role, metadata, and ban support
 */
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    role: text("role"),
    metadata: jsonb("metadata"),
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
).enableRLS();

/**
 * Session table for user sessions
 */
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
    activeOrganizationId: text("active_organization_id"),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => ({
    userIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
    }).onDelete("cascade"),
    impersonatedByFk: foreignKey({
      columns: [table.impersonatedBy],
      foreignColumns: [user.id],
    }).onDelete("set null"),
    activeOrganizationIdFk: foreignKey({
      columns: [table.activeOrganizationId],
      foreignColumns: [organization.id],
    }).onDelete("set null"),
    // Performance indexes for session lookups
    userIdIdx: index("session_user_id_idx").on(table.userId),
    tokenIdx: index("session_token_idx").on(table.token),
    expiresAtIdx: index("session_expires_at_idx").on(table.expiresAt),
    userExpiresIdx: index("session_user_expires_idx").on(table.userId, table.expiresAt),
    activeOrgIdx: index("session_active_org_idx").on(table.activeOrganizationId),
    createdAtIdx: index("session_created_at_idx").on(table.createdAt),
  })
).enableRLS();

/**
 * Account table for OAuth providers and password accounts
 */
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
    }).onDelete("cascade"),
    // Performance indexes for account lookups
    userIdIdx: index("account_user_id_idx").on(table.userId),
    providerIdIdx: index("account_provider_id_idx").on(table.providerId),
    accountIdIdx: index("account_account_id_idx").on(table.accountId),
    userProviderIdx: index("account_user_provider_idx").on(table.userId, table.providerId),
    accessTokenExpiresIdx: index("account_access_token_expires_idx").on(table.accessTokenExpiresAt),
    refreshTokenExpiresIdx: index("account_refresh_token_expires_idx").on(table.refreshTokenExpiresAt),
  })
).enableRLS();

/**
 * Verification table for email verification, password reset tokens, etc.
 */
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Performance indexes for verification lookups
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
    valueIdx: index("verification_value_idx").on(table.value),
    expiresAtIdx: index("verification_expires_at_idx").on(table.expiresAt),
    identifierExpiresIdx: index("verification_identifier_expires_idx").on(table.identifier, table.expiresAt),
    createdAtIdx: index("verification_created_at_idx").on(table.createdAt),
  })
).enableRLS();

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
