# Database Setup Guide

## Overview

This directory contains the database configuration, schemas, and connection management for the Zuno Marketplace Admin dashboard.

## Architecture

- **Auth Database**: Main Supabase PostgreSQL database for authentication and user management
- **Project Databases**: Separate databases for each project (abis, metadata, etc.)
- **RLS (Row Level Security)**: Multi-tenant security at the database level

## Initial Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your database URLs:

```bash
cp .env.example .env.local
```

### 2. Generate and Push Schema

```bash
# Generate migration files
pnpm db:generate

# Push schema to database
pnpm db:push
```

### 3. Apply RLS Policies

After pushing the schema, apply RLS policies manually:

```bash
# Connect to your Supabase database and run:
psql $AUTH_DATABASE_URL < src/lib/db/rls-policies.sql
```

Or use Supabase SQL Editor to run the `rls-policies.sql` file.

### 4. Verify Setup

```bash
# Open Drizzle Studio to verify tables
pnpm db:studio
```

## Row Level Security (RLS)

### What is RLS?

RLS ensures that users can only access data they're authorized to see at the database level, providing:

- Multi-tenant data isolation
- Defense in depth security
- Automatic filtering of queries

### RLS Policies

The following policies are implemented:

1. **User Table**:
   - Users can read/update their own data
   - Super admins can manage all users

2. **Organization Table** (Projects):
   - Users can see organizations they're members of
   - Only owners/admins can update organization settings
   - Super admins have full access

3. **Member Table**:
   - Users can see members of their organizations
   - Only admins/owners can add/remove members
   - Only admins/owners can update member roles

4. **Invitation Table**:
   - Users can see invitations to their organizations
   - Users can see invitations sent to their email
   - Only admins/owners can create/delete invitations

### Testing RLS

To test RLS policies, use Supabase SQL Editor with different user contexts:

```sql
-- Set user context
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Test queries
SELECT * FROM organization;  -- Should only show organizations user is member of
SELECT * FROM member;        -- Should only show members of user's organizations
```

## Multi-Database Connection

The `connections.ts` module manages connections to multiple project databases:

```typescript
import { getProjectDb } from '@/lib/db/connections'

// Get database for a specific project
const db = getProjectDb('abis')

// Query project-specific data
const data = await db.query.yourTable.findMany()
```

### Adding New Project Databases

1. Add database URL to `.env.local`:
   ```bash
   NEW_PROJECT_DATABASE_URL="postgresql://..."
   ```

2. Add project to `config/projects.config.ts`:
   ```typescript
   export const PROJECTS_REGISTRY = {
     // ... existing projects
     newProject: {
       id: 'newProject',
       name: '@zuno-marketplace-new',
       slug: 'zuno-new',
       databaseUrl: process.env.NEW_PROJECT_DATABASE_URL,
       // ... metadata
     },
   }
   ```

3. Create project-specific schema if needed in `src/lib/db/projects/`

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify DATABASE_URL is correct
2. Check Supabase dashboard for connection limits
3. Ensure connection pooling is configured
4. Check firewall/network settings

### RLS Not Working

If RLS policies aren't working:

1. Verify RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Check if policies exist: `\dRp table_name` in psql
3. Verify `auth.uid()` function exists
4. Check user context is set correctly

### Migration Errors

If migrations fail:

1. Check schema syntax in `schemas/auth.schema.ts`
2. Verify database connection
3. Check for conflicting table names
4. Use `pnpm db:studio` to inspect current state

## Best Practices

1. **Always use RLS** for multi-tenant data
2. **Connection pooling** is critical for serverless
3. **Close connections** properly in serverless environments
4. **Test permissions** before deploying
5. **Use transactions** for data integrity
6. **Index properly** for performance
7. **Monitor connections** in production

## Security Checklist

- [ ] RLS enabled on all sensitive tables
- [ ] Policies tested for all roles
- [ ] Service role keys protected (server-side only)
- [ ] Connection strings in environment variables
- [ ] No hardcoded credentials
- [ ] Audit logs enabled (optional)
- [ ] Rate limiting configured
