# Zuno Marketplace Admin

A scalable, multi-project admin dashboard built with Next.js 16, designed to manage multiple marketplace products from a single unified interface.

## ✨ Features

- **Multi-Project Architecture**: Manage multiple projects from one dashboard
- **Role-Based Access Control (RBAC)**: Global + project-level permissions
- **Multi-Database Support**: Each project connects to its own PostgreSQL database
- **Row Level Security (RLS)**: Database-level multi-tenant isolation
- **Authentication**: Better-Auth with organization and admin plugins
- **Modern Stack**: Next.js 16, React 19, TypeScript, Drizzle ORM, Tailwind CSS v4, shadcn/ui
- **Data Management**: Browse, query, and modify project data with intuitive UI
- **Schema Visualization**: Interactive ER diagrams and schema explorer
- **SQL Query Runner**: Execute queries with safety checks and history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- PostgreSQL database (Supabase recommended)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd zuno-marketplace-admin

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database
pnpm db:push
psql $DATABASE_URL < src/lib/db/rls-policies.sql

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up to create your first account.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Project Overview & PDR](./docs/project-overview-pdr.md) | Project goals, features, requirements, and roadmap |
| [Codebase Summary](./docs/codebase-summary.md) | Directory structure, key modules, and data flows |
| [Code Standards](./docs/code-standards.md) | TypeScript, React, and architectural conventions |
| [System Architecture](./docs/system-architecture.md) | Clean Architecture, multi-database design, security |

## 🛠️ Technology Stack

**Frontend**
- Next.js 16 (App Router, React Server Components)
- React 19.2
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui (New York style)
- TanStack Table/Query/Virtual
- react-hook-form + Zod

**Backend**
- Next.js Server Actions
- Better-Auth (authentication)
- PostgreSQL (multi-database)
- Drizzle ORM
- AES-256-GCM encryption

**DevOps**
- Vercel (deployment)
- GitHub (version control)
- pnpm (package manager)

## 📦 Project Structure

```
zuno-marketplace-admin/
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── (auth)/             # Login, signup
│   │   ├── (dashboard)/        # Protected routes (dashboard, projects, data, etc.)
│   │   ├── invite/             # Public invitation acceptance
│   │   └── api/                # API routes (Better-Auth)
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives (28 components)
│   │   ├── layout/             # Sidebar, navigation, shell
│   │   ├── providers/          # Context providers (auth, project, query)
│   │   └── features/           # Feature-specific components
│   ├── lib/                    # Core business logic
│   │   ├── core/               # Domain layer (entities, use cases, interfaces)
│   │   ├── infrastructure/     # Repositories, services
│   │   ├── auth/               # Better-Auth config, permissions
│   │   ├── db/                 # Database schemas, connections
│   │   ├── validations/        # Zod schemas
│   │   └── utils/              # Logger, error handling, utilities
│   ├── types/                  # TypeScript types
│   └── hooks/                  # Custom React hooks
├── config/                     # Configuration files
├── docs/                       # Documentation
├── drizzle/                    # Database migrations
└── [config files]              # Root configuration
```

See [Codebase Summary](./docs/codebase-summary.md) for detailed structure.

## 🔧 Available Commands

### Development
```bash
pnpm dev              # Start development server (localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm typecheck        # TypeScript type checking
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
```

### Database
```bash
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
```

## 🏗️ Architecture Overview

### Clean Architecture Layers
```
┌─────────────────────────────────────────────────────┐
│  Presentation Layer (Next.js App Router)            │
│  • Server Components  • Client Components           │
│  • Server Actions     • Middleware                  │
├─────────────────────────────────────────────────────┤
│  Application Layer (Use Cases)                      │
│  • CreateProjectUseCase  • InviteUserUseCase       │
│  • Permission Checks     • Business Logic           │
├─────────────────────────────────────────────────────┤
│  Infrastructure Layer (Repositories & Services)     │
│  • Drizzle ORM  • Better-Auth  • Email  • Encryption│
├─────────────────────────────────────────────────────┤
│  Core Layer (Domain Logic)                          │
│  • Entities  • Interfaces  • DI Container           │
└─────────────────────────────────────────────────────┘
```

### Multi-Database Architecture
- **Auth Database**: Central database for users, sessions, organizations, members
- **Project Databases**: Each project connects to its own PostgreSQL database
- **Dynamic Connections**: `getProjectDb(projectId)` with connection pooling
- **Security**: Encrypted database URLs, RLS policies, permission checks

See [System Architecture](./docs/system-architecture.md) for details.

## 🔐 RBAC System

### Global Roles
- **super_admin**: Full system access, can create projects
- **user**: Regular user with project-specific access

### Project Roles
- **owner**: Full project access
- **admin**: Manage members and settings
- **editor**: Create, read, update, delete data
- **viewer**: Read-only access

See [System Architecture](./docs/system-architecture.md) for permission matrix.

## 🌟 Key Features

### Dashboard Routes
- `/dashboard` - Overview with project statistics
- `/projects` - Project management (CRUD)
- `/members` - Team management (members + invitations)
- `/data` - Data browser with TanStack Table (sorting, filtering, pagination)
- `/query` - SQL query runner with history
- `/schema` - Interactive ER diagram + schema explorer
- `/diagram` - Visual diagram editor

### Data Management
- Browse all tables in project database
- Dynamic form generation from database schema
- Foreign key relationship handling
- Bulk operations (delete, export)
- CSV/JSON export
- Virtualized rendering for 1000+ rows

### Schema Tools
- Interactive ER diagram (React Flow)
- Table relationships visualization
- Column details with types and constraints
- Schema statistics and search

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub:
   ```bash
   git push origin main
   ```

2. Import to [Vercel](https://vercel.com):
   - Import your repository
   - Configure environment variables (from `.env.local`)
   - Set `BETTER_AUTH_URL` to production URL

3. Apply RLS policies to production database:
   ```bash
   psql $PRODUCTION_DATABASE_URL < src/lib/db/rls-policies.sql
   ```

## 🐛 Troubleshooting

### Database Connection Issues
1. Verify `DATABASE_URL` is correct
2. Check Supabase connection pooler is enabled
3. Ensure RLS policies are applied: `psql $DATABASE_URL < src/lib/db/rls-policies.sql`

### Authentication Issues
1. Check `BETTER_AUTH_SECRET` is >32 characters
2. Verify `BETTER_AUTH_URL` matches your domain
3. Clear browser cookies/localStorage

### Build Errors
```bash
pnpm typecheck        # Check TypeScript errors
pnpm lint             # Check ESLint errors
rm -rf .next          # Clear build cache
pnpm build            # Rebuild
```

## 📖 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Better-Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TanStack Table Documentation](https://tanstack.com/table)

## 🤝 Contributing

See [Code Standards](./docs/code-standards.md) for coding conventions and best practices.

## 📄 License

MIT

---

**Built with ❤️ for Zuno Marketplace**

For detailed documentation, see the [`docs/`](./docs/) directory.
