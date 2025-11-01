import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  pgPolicy,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Better-auth will create these tables automatically, but we define them here
 * for type safety and to add custom fields/RLS policies
 */

// User table (managed by better-auth with custom fields)
export const user = pgTable(
  'user',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    // Custom fields for RBAC
    role: text('role').notNull().default('user'), // Global role: super_admin, user
    metadata: jsonb('metadata'),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (table) => [
    // RLS: Users can read their own data
    pgPolicy('user_select_policy', {
      as: 'permissive',
      for: 'select',
      to: 'authenticated',
      using: sql`auth.uid() = id`,
    }),
    // RLS: Users can update their own data
    pgPolicy('user_update_policy', {
      as: 'permissive',
      for: 'update',
      to: 'authenticated',
      using: sql`auth.uid() = id`,
      withCheck: sql`auth.uid() = id`,
    }),
  ]
).enableRLS()

// Session table (managed by better-auth)
export const session = pgTable(
  'session',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expiresAt').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (table) => [
    // RLS: Users can only see their own sessions
    pgPolicy('session_select_policy', {
      as: 'permissive',
      for: 'select',
      to: 'authenticated',
      using: sql`user_id = auth.uid()`,
    }),
    // RLS: Users can delete their own sessions
    pgPolicy('session_delete_policy', {
      as: 'permissive',
      for: 'delete',
      to: 'authenticated',
      using: sql`user_id = auth.uid()`,
    }),
  ]
).enableRLS()

// Account table (for OAuth providers, managed by better-auth)
export const account = pgTable(
  'account',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    expiresAt: timestamp('expiresAt'),
    password: text('password'), // For email/password auth
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (table) => [
    // RLS: Users can only see their own accounts
    pgPolicy('account_select_policy', {
      as: 'permissive',
      for: 'select',
      to: 'authenticated',
      using: sql`user_id = auth.uid()`,
    }),
  ]
).enableRLS()

// Verification table (for email verification, managed by better-auth)
export const verification = pgTable('verification', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Organization table (represents projects in our system)
export const organization = pgTable(
  'organization',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    metadata: jsonb('metadata'),
    // Project-specific fields
    projectType: text('projectType').notNull(), // 'abis', 'metadata', etc.
    databaseUrl: text('databaseUrl'), // Encrypted database connection string
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (table) => [
    // RLS: Users can see organizations they are members of
    pgPolicy('organization_select_policy', {
      as: 'permissive',
      for: 'select',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1 FROM member
          WHERE member.organization_id = id
          AND member.user_id = auth.uid()
        )
      `,
    }),
  ]
).enableRLS()

// Member table (users within organizations/projects)
export const member = pgTable(
  'member',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('viewer'), // owner, admin, editor, viewer
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (table) => [
    // RLS: Users can see members of organizations they belong to
    pgPolicy('member_select_policy', {
      as: 'permissive',
      for: 'select',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1 FROM member m
          WHERE m.organization_id = organization_id
          AND m.user_id = auth.uid()
        )
      `,
    }),
    // RLS: Only admins and owners can update member roles
    pgPolicy('member_update_policy', {
      as: 'permissive',
      for: 'update',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1 FROM member m
          WHERE m.organization_id = organization_id
          AND m.user_id = auth.uid()
          AND m.role IN ('owner', 'admin')
        )
      `,
      withCheck: sql`
        EXISTS (
          SELECT 1 FROM member m
          WHERE m.organization_id = organization_id
          AND m.user_id = auth.uid()
          AND m.role IN ('owner', 'admin')
        )
      `,
    }),
  ]
).enableRLS()

// Invitation table (for inviting users to organizations/projects)
export const invitation = pgTable(
  'invitation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull().default('viewer'),
    inviterId: uuid('inviterId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expiresAt').notNull(),
    status: text('status').notNull().default('pending'), // pending, accepted, expired
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (table) => [
    // RLS: Users can see invitations to organizations they belong to
    pgPolicy('invitation_select_policy', {
      as: 'permissive',
      for: 'select',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1 FROM member m
          WHERE m.organization_id = organization_id
          AND m.user_id = auth.uid()
        )
      `,
    }),
  ]
).enableRLS()

// Export types
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert

export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert

export type Organization = typeof organization.$inferSelect
export type NewOrganization = typeof organization.$inferInsert

export type Member = typeof member.$inferSelect
export type NewMember = typeof member.$inferInsert

export type Invitation = typeof invitation.$inferSelect
export type NewInvitation = typeof invitation.$inferInsert
