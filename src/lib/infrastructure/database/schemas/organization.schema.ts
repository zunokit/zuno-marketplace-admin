import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./user.schema";
import { projectTemplate } from "./project.schema";

/**
 * Organization table for multi-tenant support
 */
export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    metadataJson: jsonb("metadata_json"),
    projectType: text("project_type"),
    databaseUrl: text("database_url"),
    description: text("description"),
    status: text("status").default("active").notNull(),
    icon: text("icon"),
    color: text("color"),
    templateId: text("template_id"),
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by"),
  },
  (table) => ({
    deletedByFk: foreignKey({
      columns: [table.deletedBy],
      foreignColumns: [user.id],
    }).onDelete("set null"),
    slugIdx: index("organization_slug_idx").on(table.slug),
    statusIdx: index("organization_status_idx").on(table.status),
    projectTypeIdx: index("organization_project_type_idx").on(
      table.projectType
    ),
    createdAtIdx: index("organization_created_at_idx").on(table.createdAt),
    statusTypeIdx: index("organization_status_type_idx").on(
      table.status,
      table.projectType
    ),
    deletedAtIdx: index("organization_deleted_at_idx").on(table.deletedAt),
    templateIdIdx: index("organization_template_id_idx").on(table.templateId),
    templateIdFk: foreignKey({
      columns: [table.templateId],
      foreignColumns: [projectTemplate.id],
    }).onDelete("set null"),
    statusCheck: check(
      "organization_status_check",
      sql`${table.status} IN ('active', 'inactive', 'archived', 'draft')`
    ),
  })
).enableRLS();

/**
 * Member table for organization membership
 */
export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by"),
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
    deletedByFk: foreignKey({
      columns: [table.deletedBy],
      foreignColumns: [user.id],
    }).onDelete("set null"),
    orgIdIdx: index("member_org_id_idx").on(table.organizationId),
    userIdIdx: index("member_user_id_idx").on(table.userId),
    roleIdx: index("member_role_idx").on(table.role),
    orgUserIdx: index("member_org_user_idx").on(
      table.organizationId,
      table.userId
    ),
    deletedAtIdx: index("member_deleted_at_idx").on(table.deletedAt),
    roleCheck: check(
      "member_role_check",
      sql`${table.role} IN ('owner', 'admin', 'member', 'viewer')`
    ),
  })
).enableRLS();

/**
 * Invitation table for organization invitations
 */
export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    inviterId: text("inviter_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    organizationIdFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
    }).onDelete("cascade"),
    inviterIdFk: foreignKey({
      columns: [table.inviterId],
      foreignColumns: [user.id],
    }).onDelete("cascade"),
    orgIdIdx: index("invitation_org_id_idx").on(table.organizationId),
    emailIdx: index("invitation_email_idx").on(table.email),
    statusIdx: index("invitation_status_idx").on(table.status),
    expiresAtIdx: index("invitation_expires_at_idx").on(table.expiresAt),
    statusExpiresIdx: index("invitation_status_expires_idx").on(
      table.status,
      table.expiresAt
    ),
    statusCheck: check(
      "invitation_status_check",
      sql`${table.status} IN ('pending', 'accepted', 'rejected', 'expired')`
    ),
  })
).enableRLS();

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;

export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
