ALTER TABLE "invitation" ADD COLUMN "token" text NOT NULL;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_provider_id_idx" ON "account" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "account_account_id_idx" ON "account" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_user_provider_idx" ON "account" USING btree ("user_id","provider_id");--> statement-breakpoint
CREATE INDEX "account_access_token_expires_idx" ON "account" USING btree ("access_token_expires_at");--> statement-breakpoint
CREATE INDEX "account_refresh_token_expires_idx" ON "account" USING btree ("refresh_token_expires_at");--> statement-breakpoint
CREATE INDEX "invitation_token_idx" ON "invitation" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "session_user_expires_idx" ON "session" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "session_active_org_idx" ON "session" USING btree ("active_organization_id");--> statement-breakpoint
CREATE INDEX "session_created_at_idx" ON "session" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_value_idx" ON "verification" USING btree ("value");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_expires_idx" ON "verification" USING btree ("identifier","expires_at");--> statement-breakpoint
CREATE INDEX "verification_created_at_idx" ON "verification" USING btree ("created_at");