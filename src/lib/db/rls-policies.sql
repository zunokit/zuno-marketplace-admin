-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- This SQL script sets up RLS policies for multi-tenant security
-- Run this after initial database migration

-- Enable RLS on all tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitation" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- User Table Policies
-- ============================================

-- Users can read their own data
CREATE POLICY "user_select_policy" ON "user"
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "user_update_policy" ON "user"
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admins can see all users
CREATE POLICY "super_admin_user_all" ON "user"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "user" u
      WHERE u.id = auth.uid()
      AND u.role LIKE '%super_admin%'
    )
  );

-- ============================================
-- Session Table Policies
-- ============================================

-- Users can only see their own sessions
CREATE POLICY "session_select_policy" ON "session"
  FOR SELECT
  USING ("userId" = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "session_delete_policy" ON "session"
  FOR DELETE
  USING ("userId" = auth.uid());

-- ============================================
-- Account Table Policies
-- ============================================

-- Users can only see their own accounts
CREATE POLICY "account_select_policy" ON "account"
  FOR SELECT
  USING ("userId" = auth.uid());

-- Users can manage their own accounts
CREATE POLICY "account_all_policy" ON "account"
  FOR ALL
  USING ("userId" = auth.uid());

-- ============================================
-- Organization Table Policies
-- ============================================

-- Users can see organizations they are members of
CREATE POLICY "organization_select_policy" ON "organization"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = id
      AND m."userId" = auth.uid()
    )
  );

-- Only owners and admins can update organizations
CREATE POLICY "organization_update_policy" ON "organization"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = id
      AND m."userId" = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = id
      AND m."userId" = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- Super admins can manage all organizations
CREATE POLICY "super_admin_organization_all" ON "organization"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "user" u
      WHERE u.id = auth.uid()
      AND u.role LIKE '%super_admin%'
    )
  );

-- ============================================
-- Member Table Policies
-- ============================================

-- Users can see members of organizations they belong to
CREATE POLICY "member_select_policy" ON "member"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = "organizationId"
      AND m."userId" = auth.uid()
    )
  );

-- Only admins and owners can add members
CREATE POLICY "member_insert_policy" ON "member"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = "organizationId"
      AND m."userId" = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- Only admins and owners can update member roles
CREATE POLICY "member_update_policy" ON "member"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = "organizationId"
      AND m."userId" = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = "organizationId"
      AND m."userId" = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- Only admins and owners can remove members
CREATE POLICY "member_delete_policy" ON "member"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = "organizationId"
      AND m."userId" = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- Invitation Table Policies
-- ============================================

-- Users can see invitations to organizations they belong to
CREATE POLICY "invitation_select_policy" ON "invitation"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = "organizationId"
      AND m."userId" = auth.uid()
    )
    OR "email" = (SELECT email FROM "user" WHERE id = auth.uid())
  );

-- Only admins and owners can create invitations
CREATE POLICY "invitation_insert_policy" ON "invitation"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = "organizationId"
      AND m."userId" = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- Only admins and owners can delete invitations
CREATE POLICY "invitation_delete_policy" ON "invitation"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "member" m
      WHERE m."organizationId" = "organizationId"
      AND m."userId" = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- Helper Functions
-- ============================================

-- Create function to get current user ID (if using Supabase auth.uid())
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$ LANGUAGE SQL STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
