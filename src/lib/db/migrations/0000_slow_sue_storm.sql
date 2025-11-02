CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_status_check" CHECK ("invitation"."status" IN ('pending', 'accepted', 'rejected', 'expired'))
);
--> statement-breakpoint
ALTER TABLE "invitation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text,
	CONSTRAINT "member_role_check" CHECK ("member"."role" IN ('owner', 'admin', 'member', 'viewer'))
);
--> statement-breakpoint
ALTER TABLE "member" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata_json" jsonb,
	"project_type" text,
	"database_url" text,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"icon" text,
	"color" text,
	"template_id" text,
	"deleted_at" timestamp,
	"deleted_by" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organization_status_check" CHECK ("organization"."status" IN ('active', 'inactive', 'archived', 'draft'))
);
--> statement-breakpoint
ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"environment_id" text,
	"last_used_at" timestamp,
	"last_used_ip" text,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"revoked_at" timestamp,
	"revoked_by" text,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_api_key_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
ALTER TABLE "project_api_key" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_configuration" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_configuration" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_environment" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"database_url" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text,
	CONSTRAINT "project_env_slug_format_check" CHECK ("project_environment"."slug" ~ '^[a-z0-9-]+$')
);
--> statement-breakpoint
ALTER TABLE "project_environment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_feature" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"configuration" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_feature" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_template" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"category" text DEFAULT 'custom' NOT NULL,
	"default_project_type" text,
	"default_features" jsonb,
	"default_configuration" jsonb,
	"default_environments" jsonb,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "project_template_slug_unique" UNIQUE("slug"),
	CONSTRAINT "template_category_check" CHECK ("project_template"."category" IN ('marketplace', 'saas', 'content', 'analytics', 'custom'))
);
--> statement-breakpoint
ALTER TABLE "project_template" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"metadata" jsonb,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_template_id_project_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."project_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_api_key" ADD CONSTRAINT "project_api_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_api_key" ADD CONSTRAINT "project_api_key_environment_id_project_environment_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."project_environment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_api_key" ADD CONSTRAINT "project_api_key_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_api_key" ADD CONSTRAINT "project_api_key_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_audit_log" ADD CONSTRAINT "project_audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_audit_log" ADD CONSTRAINT "project_audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_configuration" ADD CONSTRAINT "project_configuration_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_environment" ADD CONSTRAINT "project_environment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_environment" ADD CONSTRAINT "project_environment_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_feature" ADD CONSTRAINT "project_feature_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_template" ADD CONSTRAINT "project_template_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_impersonated_by_user_id_fk" FOREIGN KEY ("impersonated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_active_organization_id_organization_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitation_org_id_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitation_status_idx" ON "invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invitation_expires_at_idx" ON "invitation" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "invitation_status_expires_idx" ON "invitation" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "member_org_id_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "member_role_idx" ON "member" USING btree ("role");--> statement-breakpoint
CREATE INDEX "member_org_user_idx" ON "member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "member_deleted_at_idx" ON "member" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "organization_slug_idx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organization_status_idx" ON "organization" USING btree ("status");--> statement-breakpoint
CREATE INDEX "organization_project_type_idx" ON "organization" USING btree ("project_type");--> statement-breakpoint
CREATE INDEX "organization_created_at_idx" ON "organization" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "organization_status_type_idx" ON "organization" USING btree ("status","project_type");--> statement-breakpoint
CREATE INDEX "organization_deleted_at_idx" ON "organization" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "organization_template_id_idx" ON "organization" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "project_api_key_org_id_idx" ON "project_api_key" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_api_key_hash_idx" ON "project_api_key" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "project_api_key_is_active_idx" ON "project_api_key" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "project_api_key_expires_at_idx" ON "project_api_key" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "project_api_key_last_used_at_idx" ON "project_api_key" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "project_api_key_org_active_idx" ON "project_api_key" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "audit_log_org_id_idx" ON "project_audit_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "project_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "project_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_entity_type_idx" ON "project_audit_log" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "project_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_org_created_at_idx" ON "project_audit_log" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "project_config_org_id_idx" ON "project_configuration" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_config_key_idx" ON "project_configuration" USING btree ("key");--> statement-breakpoint
CREATE INDEX "project_config_is_encrypted_idx" ON "project_configuration" USING btree ("is_encrypted");--> statement-breakpoint
CREATE INDEX "project_env_org_id_idx" ON "project_environment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_env_slug_idx" ON "project_environment" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "project_env_is_active_idx" ON "project_environment" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "project_env_org_active_idx" ON "project_environment" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "project_env_deleted_at_idx" ON "project_environment" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "project_feature_org_id_idx" ON "project_feature" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_feature_key_idx" ON "project_feature" USING btree ("key");--> statement-breakpoint
CREATE INDEX "project_feature_is_enabled_idx" ON "project_feature" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "project_feature_org_enabled_idx" ON "project_feature" USING btree ("organization_id","is_enabled");--> statement-breakpoint
CREATE INDEX "project_template_slug_idx" ON "project_template" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "project_template_category_idx" ON "project_template" USING btree ("category");--> statement-breakpoint
CREATE INDEX "project_template_is_public_idx" ON "project_template" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "project_template_usage_count_idx" ON "project_template" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "project_template_deleted_at_idx" ON "project_template" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_created_at_idx" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_banned_idx" ON "user" USING btree ("banned");