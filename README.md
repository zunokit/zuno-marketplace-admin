# Zuno Marketplace Admin

A scalable, multi-project admin dashboard built with Next.js 16, designed to manage multiple marketplace products from a single unified interface.

## Features

- ✅ **Multi-Project Architecture**: Manage multiple projects (ABIs, Metadata, etc.) from one dashboard
- ✅ **Role-Based Access Control (RBAC)**: Fine-grained permissions with owner, admin, editor, and viewer roles
- ✅ **Multi-Database Support**: Each project connects to its own database with connection pooling
- ✅ **Row Level Security (RLS)**: Database-level security for multi-tenant isolation
- ✅ **Authentication**: Powered by Better-Auth with organization and admin plugins
- ✅ **Modern Stack**: Next.js 16, React 19, TypeScript, Drizzle ORM, Tailwind CSS v4, shadcn/ui
- ✅ **Scalable Design**: Easy to add new projects and databases

## Prerequisites

- Node.js 18+ or higher
- pnpm (recommended) or npm/yarn
- PostgreSQL database (Supabase recommended)
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd zuno-marketplace-admin
pnpm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials. Get your Supabase credentials from [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/database).

### 3. Database Setup

```bash
# Push schema to database
pnpm db:push

# Apply RLS policies (run in Supabase SQL Editor or psql)
psql $DATABASE_URL < src/lib/db/rls-policies.sql
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up to create your first account.

## Project Structure

```
zuno-marketplace-admin/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Authentication routes (login, signup)
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   └── api/auth/            # Better-auth API endpoints
│   ├── components/
│   │   ├── layout/              # Navigation, sidebar, project switcher
│   │   ├── providers/           # React context providers
│   │   └── ui/                  # shadcn/ui components
│   ├── lib/
│   │   ├── auth/                # Authentication config and utilities
│   │   ├── db/                  # Database schemas and connections
│   │   ├── projects/            # Project-specific adapters
│   │   └── utils/               # Utility functions
│   ├── types/                   # TypeScript types
│   └── hooks/                   # Custom React hooks
├── config/
│   └── projects.config.ts       # Central project registry
└── drizzle/                     # Database migrations
```

## Architecture Overview

### Multi-Project System

Each project is:

1. Registered in `config/projects.config.ts`
2. Mapped to its own database
3. Represented as an "organization" in Better-Auth
4. Isolated with Row Level Security (RLS)

### RBAC System

**Global Roles:**

- `super_admin`: Full system access, can create projects
- `user`: Regular user with project-specific access

**Project Roles:**

- `owner`: Full project access
- `admin`: Manage members and settings
- `editor`: Create, read, update, delete data
- `viewer`: Read-only access

## Adding a New Project

### 1. Add Database URL

In `.env.local`:

```env
NEW_PROJECT_DATABASE_URL="postgresql://..."
```

### 2. Register Project

In `config/projects.config.ts`:

```typescript
export const PROJECTS_REGISTRY = {
  // ... existing projects
  newProject: {
    id: "newProject",
    name: "@zuno-marketplace-new",
    slug: "zuno-new",
    databaseUrl: process.env.NEW_PROJECT_DATABASE_URL,
    description: "Description of the new project",
    metadata: {
      icon: "🆕",
      color: "#10b981",
      features: ["Feature 1", "Feature 2"],
    },
  },
};
```

### 3. Restart Dev Server

The new project will appear in the project switcher automatically.

## Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm typecheck        # TypeScript type checking
```

## Deployment to Vercel

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "feat: Initial setup"
   git push origin main
   ```

2. **Import to Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Configure environment variables (copy from `.env.local`)

3. **Important**: Update `BETTER_AUTH_URL` to your production URL before deploying

4. **Apply RLS policies** to your production database after first deploy

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Auth**: Better-Auth
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **State Management**: React Query (TanStack Query)
- **Deployment**: Vercel

## Troubleshooting

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check Supabase connection pooler is enabled
3. Ensure RLS is enabled: Run `src/lib/db/rls-policies.sql`

### Authentication Issues

1. Check `BETTER_AUTH_SECRET` is >32 characters
2. Verify `BETTER_AUTH_URL` matches your domain
3. Clear browser cookies/localStorage

### Build Errors

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Clear build cache
rm -rf .next
pnpm build
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Better-Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Database Setup Guide](./src/lib/db/README.md)

## License

MIT

---

Built with ❤️ for Zuno Marketplace
