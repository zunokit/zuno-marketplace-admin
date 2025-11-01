# Setup Guide - Zuno Marketplace Admin

This guide will walk you through setting up the admin dashboard from scratch.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pnpm install
```

✅ **Status**: Already completed

### 2. Configure Environment Variables

The `.env.local` file has been created with your Supabase credentials.

**Next steps:**

1. Add your project database URLs to `.env.local`:
   ```env
   ABIS_DATABASE_URL="postgresql://..."
   METADATA_DATABASE_URL="postgresql://..."
   ```

2. These should point to your `@zuno-marketplace-abis` and `@zuno-marketplace-metadata` databases.

### 3. Database Initialization

Better-Auth will automatically create the necessary tables on first run. Here's what will happen:

**On first API call** (signup/login), Better-Auth will create:
- `user` - User accounts
- `session` - User sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens
- `organization` - Projects (represented as organizations)
- `member` - Project members
- `invitation` - Project invitations

**Important**: After Better-Auth creates these tables, you need to:

1. **Enable RLS** on all tables
2. **Apply RLS policies** for multi-tenant security

Run this SQL in Supabase SQL Editor after first signup:

```sql
-- See src/lib/db/rls-policies.sql for the complete SQL
```

### 4. Start Development Server

```bash
pnpm dev
```

Navigate to http://localhost:3000

### 5. Create Your First Account

1. Click "Sign up"
2. Enter your details
3. Create account

This will trigger Better-Auth to create all database tables automatically.

### 6. Apply RLS Policies (CRITICAL)

After signup, go to Supabase SQL Editor and run:

```bash
# Option 1: Copy/paste the SQL file contents into Supabase SQL Editor
# File: src/lib/db/rls-policies.sql

# Option 2: Run via psql (if you have psql installed)
psql $AUTH_DATABASE_URL < src/lib/db/rls-policies.sql
```

This enables Row Level Security for multi-tenant isolation.

### 7. Make Yourself a Super Admin

Run this SQL in Supabase to give yourself super admin access:

```sql
-- Replace 'your-email@example.com' with your email
UPDATE "user"
SET role = 'super_admin'
WHERE email = 'your-email@example.com';
```

Now you can create projects and manage users!

### 8. Verify Setup

1. **Check Tables**: Go to Supabase Dashboard → Table Editor
   - You should see: user, session, account, organization, member, invitation, verification

2. **Check RLS**: Each table should have RLS enabled and policies applied

3. **Test Login**: Sign in with your account

4. **Test Project Switcher**: The project switcher should show your configured projects

## Architecture Summary

### What's Implemented

✅ **Authentication System**
- Email/password signup and login
- Session management
- Better-Auth integration

✅ **Multi-Project Architecture**
- Project registry system (`config/projects.config.ts`)
- Project switcher in dashboard
- Dynamic database connections per project

✅ **RBAC (Role-Based Access Control)**
- Global roles: `super_admin`, `user`
- Project roles: `owner`, `admin`, `editor`, `viewer`
- Permission checking utilities

✅ **Security**
- Row Level Security (RLS) policies
- Multi-tenant data isolation
- Server-side permission validation

✅ **Dashboard UI**
- Sidebar navigation
- Project switcher
- User menu
- Dashboard home page

### What's Next (Optional Enhancements)

The core infrastructure is complete. You can now build:

1. **Project Management Pages**
   - Create/edit/delete projects (super admin only)
   - Project settings
   - Project analytics

2. **Member Management**
   - Invite users to projects
   - Manage roles and permissions
   - Remove members

3. **Project-Specific Data Views**
   - ABIs management interface
   - Metadata management interface
   - Custom dashboards per project

4. **Admin Features**
   - User management (super admin)
   - Audit logs
   - System settings

## Database Connection Strategy

### Auth Database (Supabase)
- Stores: users, sessions, organizations, members
- Uses: Better-Auth for management
- Security: RLS policies

### Project Databases
Each project has its own database:

```typescript
import { getProjectDb } from '@/lib/db/connections'

// In your Server Action or API route
const abisDb = getProjectDb('abis')
const data = await abisDb.query.yourTable.findMany()
```

### Connection Pooling

All database connections use connection pooling for serverless:
- Max connections: 10 per database
- Idle timeout: 20s
- Connect timeout: 10s

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] `BETTER_AUTH_URL` updated to production domain
- [ ] Database RLS policies applied to production database
- [ ] Super admin user created in production
- [ ] Project database URLs configured
- [ ] Test signup/login flow in production
- [ ] Verify RLS is working (users can only see their data)

## Troubleshooting

### "No database tables" error

**Solution**: Better-Auth creates tables on first use. Just sign up once, and tables will be created automatically.

### "Permission denied" errors

**Solution**: RLS policies not applied. Run `src/lib/db/rls-policies.sql` in Supabase.

### "Cannot connect to project database"

**Solution**: Verify project database URLs in `.env.local` and that databases are accessible.

### Type errors with Drizzle

**Solution**: Run `pnpm typecheck` to see specific errors. The schema is type-safe, so errors indicate missing or incorrect data.

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Apply RLS policies
3. ✅ Make yourself super admin
4. 🚀 Start building project-specific features
5. 🚀 Deploy to Vercel when ready

---

Need help? Check:
- [Main README](./README.md)
- [Database Setup Guide](./src/lib/db/README.md)
- [Better-Auth Docs](https://better-auth.com)
