# Codebase Summary

**Project:** Zuno Marketplace Admin
**Last Updated:** 2026-01-07

## 1. Directory Structure

```
E:\zuno-marketplace-admin/
├── src/
│   ├── app/                      # Next.js 16 App Router
│   │   ├── (auth)/               # Unauthenticated routes
│   │   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── invite/               # Public invitation acceptance
│   │   ├── api/                  # API routes
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home redirect
│   │   └── globals.css           # Global styles
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # 28 shadcn/ui primitives
│   │   ├── layout/               # Navigation, sidebar, shell
│   │   ├── providers/            # React context providers
│   │   ├── features/             # Feature-specific components
│   │   ├── data/                 # Data table components
│   │   ├── diagram/              # Diagram editor components
│   │   ├── schema/               # Schema visualization
│   │   ├── query/                # SQL query components
│   │   ├── members/              # Team management
│   │   └── projects/             # Project management
│   │
│   ├── lib/                      # Core business logic
│   │   ├── core/                 # Domain layer (Clean Architecture)
│   │   ├── infrastructure/       # External services, repositories
│   │   ├── auth/                 # Better-Auth configuration
│   │   ├── db/                   # Database schemas and connections
│   │   ├── validations/          # Zod validation schemas
│   │   ├── utils/                # Utilities (logger, errors, etc.)
│   │   └── crypto/               # AES-256-GCM encryption
│   │
│   ├── types/                    # TypeScript type definitions
│   ├── hooks/                    # Custom React hooks
│   └── styles/                   # Additional stylesheets
│
├── config/
│   └── projects.config.ts        # Project registry (legacy)
│
├── drizzle/                      # Database migrations
├── public/                       # Static assets
├── .claude/                      # Claude Code configuration
├── plans/                        # Planning and reports
├── docs/                         # Project documentation
└── [config files]                # Root config files
```

## 2. Key Modules & Responsibilities

### 2.1 App Directory (`src/app/`)

**Purpose**: Next.js 16 App Router with route-based file structure

#### Route Groups

**`(auth)/`** - Unauthenticated routes
- `login/page.tsx` - Email/password login form
- `signup/page.tsx` - Account creation form
- `layout.tsx` - Auth layout with QueryProvider + AuthProvider

**`(dashboard)/`** - Protected routes (requires session)
- `dashboard/page.tsx` - Overview with project statistics
- `projects/` - Project CRUD (list, new, edit)
- `members/page.tsx` - Team management (members + invitations)
- `data/page.tsx` - Data browser with TanStack Table
- `query/page.tsx` - SQL query runner with Monaco Editor
- `schema/` - ER diagram viewer + detailed explorer
- `diagram/page.tsx` - Visual diagram editor
- `layout.tsx` - Dashboard shell with ProjectProvider + Sidebar

**`invite/accept/`** - Public route
- `page.tsx` - Server component for invitation validation
- `accept-content.tsx` - Client component for acceptance flow

**`api/auth/[...all]/`** - API route
- `route.ts` - Better-Auth catch-all handler

#### Server Actions

All routes use Server Actions for mutations (co-located in `actions.ts` files):
- `projects/actions.ts` - CRUD operations for projects
- `members/actions.ts` - Team management operations
- `data/actions.ts` - Generic CRUD for any table
- `query/actions.ts` - SQL query execution
- `schema/actions.ts` - Schema introspection

### 2.2 Components (`src/components/`)

**UI Primitives** (`ui/`)
- 28 shadcn/ui components (New York style)
- Built on Radix UI primitives
- Styled with Tailwind CSS v4 + CVA (class-variance-authority)
- Examples: Button, Input, Dialog, Table, Card, etc.

**Layout Components** (`layout/`)
- `sidebar.tsx` - Collapsible sidebar (desktop) + sheet drawer (mobile)
- `navigation.tsx` - Route navigation with search and grouping
- `project-switcher.tsx` - Dropdown for project selection
- `user-menu.tsx` - User profile and sign out
- `dashboard-shell.tsx` - Main dashboard container

**Providers** (`providers/`)
- `AuthProvider.tsx` - Better-Auth client context
- `ProjectProvider.tsx` - Active project + registry context
- `QueryProvider.tsx` - TanStack Query client wrapper
- `ThemeProvider.tsx` - next-themes wrapper for dark mode
- `Toaster.tsx` - sonner toast notifications

**Data Components** (`data/`)
- `DataTable.tsx` - TanStack Table with sorting, filtering, pagination
- `VirtualizedDataTable.tsx` - TanStack Virtual for 1000+ rows
- `DynamicForm.tsx` - Auto-generate forms from DB schema
- `CreateRecordDialog.tsx` - Modal for creating records
- `EditRecordDialog.tsx` - Modal for editing records
- `DeleteRecordDialog.tsx` - Confirmation dialog for deletions
- `ForeignKeySelect.tsx` - Async select for foreign keys
- Supporting: Column headers, row actions, pagination controls

**Feature Components** (`features/`)
- `data/` - DataBrowserColumns factory, useDataTable hook
- `members/` - MembersTable, InvitationsTable, useMembers hook
- `query/` - useQueryRunner, useQueryHistory hooks

**Schema Components** (`schema/`)
- `schema-graph-core.tsx` - ER diagram with React Flow
- `schema-graph-dynamic.tsx` - Dynamic import wrapper
- `table-node.tsx` - Custom node component for tables
- `table-details-panel.tsx` - Sidebar with table information
- `schema-explorer-sidebar.tsx` - Tree view of schema
- `schema-statistics.tsx` - Metrics display

**Diagram Components** (`diagram/`)
- `diagram-canvas.tsx` - Main canvas component
- `diagram-engine.ts` - storm-react-diagrams engine configuration
- `custom-node-model.ts` - Node data model
- `custom-node-widget.tsx` - Node rendering component
- `custom-node-factory.tsx` - Node creation factory
- `node-properties-panel.tsx` - Node configuration panel
- `types.ts` - Type definitions for diagram entities

### 2.3 Core Library (`src/lib/core/`)

**Purpose**: Domain layer following Clean Architecture principles

**Entities** (`entities/`)
- `Project.ts` - Project domain entity
- `Member.ts` - Member domain entity
- `Invitation.ts` - Invitation domain entity
- `User.ts` - User domain entity

**Interfaces** (`interfaces/`)
- `IProjectRepository.ts` - Project data access interface
- `IMemberRepository.ts` - Member data access interface
- `IInvitationRepository.ts` - Invitation data access interface
- `IEmailService.ts` - Email sending interface

**Use Cases** (`use-cases/`)
- `CreateProjectUseCase.ts` - Create new project
- `UpdateProjectUseCase.ts` - Update existing project
- `DeleteProjectUseCase.ts` - Soft delete project
- `InviteUserUseCase.ts` - Send invitation email
- `AcceptInvitationUseCase.ts` - Process invitation acceptance
- `ExecuteQueryUseCase.ts` - Run SQL query with safety checks
- `SaveQueryUseCase.ts` - Save query to history

**DI Container** (`di-container.ts`)
- Singleton pattern for dependency injection
- Registers repositories and services
- Provides type-safe dependency resolution

### 2.4 Infrastructure (`src/lib/infrastructure/`)

**Repositories** (`repositories/`)
- `DrizzleProjectRepository.ts` - Drizzle ORM implementation for projects
- `DrizzleMemberRepository.ts` - Drizzle ORM implementation for members
- `DrizzleInvitationRepository.ts` - Drizzle ORM implementation for invitations
- Entity mapping, pagination, soft delete support

**Services** (`services/`)
- `EmailService.ts` - Email service factory (Mailpit dev / Resend prod)
- `EncryptionService.ts` - AES-256-GCM encryption/decryption
- `ProjectRegistryService.ts` - Dynamic project loading from database

**Email Templates** (`services/email/templates/`)
- `BaseEmailTemplate.ts` - HTML wrapper with styling
- `InvitationEmail.ts` - Team invitation email

### 2.5 Authentication (`src/lib/auth/`)

**Configuration**
- `auth.config.ts` - Better-Auth configuration with plugins
- `auth-client.ts` - Client-side auth instance
- Plugins: organization (multi-tenancy), admin (role management)

**Permissions**
- `permissions.ts` - Permission checking utilities
- `checkProjectPermission()` - Verify user has required permission
- `requireProjectPermission()` - Throw error if unauthorized
- `rbacService.canAccess()` - Resource-based access control

**Types**
- `GlobalRole` - `super_admin` | `user`
- `ProjectRole` - `owner` | `admin` | `editor` | `viewer`
- `Permission` - Fine-grained permission strings

### 2.6 Database (`src/lib/db/`)

**Schemas** (`schema/`)
- `user.schema.ts` - Better-Auth user table
- `session.schema.ts` - Better-Auth session table
- `account.schema.ts` - Better-Auth account table
- `verification.schema.ts` - Better-Auth verification table
- `organization.schema.ts` - Projects (organizations)
- `member.schema.ts` - Team members with RLS
- `invitation.schema.ts` - Pending invitations with RLS
- `project-*.schema.ts` - Project-specific tables

**Connection Management**
- `index.ts` - Main database connection (auth DB)
- `connections.ts` - Multi-database connection pooling
- `getProjectDb()` - Get Drizzle instance for specific project
- Encrypted URL storage, 5-minute config cache, auto-cleanup

**RLS Policies**
- `rls-policies.sql` - Row Level Security policies for multi-tenancy
- Enforces isolation at database level

### 2.7 Utilities (`src/lib/utils/`)

**Logger** (`logger.ts`)
- Environment-aware logging (dev: verbose, prod: errors only)
- Levels: debug, info, warn, error
- Prefixes: [Server] / [Client]
- Circular reference handling

**Error Handling** (`error-handler.ts`)
- Custom error classes: `ValidationError`, `ForbiddenError`, `NotFoundError`
- Error sanitization (never expose internals in prod)
- `withErrorHandling()` wrapper for try-catch

**Validation** (`validation-utils.ts`)
- Zod schema utilities
- Type inference helpers
- Runtime validation wrappers

**Response Wrapper** (`server-action-response.ts`)
```typescript
export type ServerActionResponse<T> = {
  data?: T;
  error?: string;
  success: boolean;
};
```

### 2.8 Validations (`src/lib/validations/`)

**Schema Definitions**
- `project.validation.ts` - Project CRUD validation
- `member.validation.ts` - Member management validation
- `invitation.validation.ts` - Invitation validation
- `query.validation.ts` - SQL query validation
- `auth.validation.ts` - Authentication validation

**Pattern**
```typescript
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  // ...
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

### 2.9 Hooks (`src/hooks/`)

**Custom Hooks**
- `useAuth.ts` - Access Better-Auth client
- `useActiveProject.ts` - Get current project
- `useProjects.ts` - Get project registry
- `useDebounce.ts` - Debounce values
- `useMediaQuery.ts` - Responsive breakpoints
- `useLocalStorage.ts` - Persistent state

## 3. File Organization Patterns

### 3.1 Route Co-location
```
app/(dashboard)/projects/
├── page.tsx                  # Server Component (UI)
├── actions.ts                # Server Actions (mutations)
├── new/
│   ├── page.tsx              # Create project page
│   └── project-form.tsx      # Client component
└── [id]/
    └── edit/
        ├── page.tsx          # Edit project page
        └── edit-form.tsx     # Client component
```

### 3.2 Feature Modules
```
components/features/data/
├── DataBrowserColumns.tsx    # Column factory
├── useDataTable.ts           # Custom hook
└── index.ts                  # Barrel export
```

### 3.3 Clean Architecture Layers
```
lib/
├── core/                     # Inner layer (no external deps)
│   ├── entities/
│   ├── interfaces/
│   └── use-cases/
├── infrastructure/           # Outer layer (implements interfaces)
│   ├── repositories/
│   └── services/
└── auth/                     # Cross-cutting concern
```

## 4. Entry Points & Main Flows

### 4.1 Application Entry Point
- `src/app/layout.tsx` - Root layout with providers
- `src/app/page.tsx` - Redirects to `/dashboard`

### 4.2 Authentication Flow
1. User visits `/login` or `/signup`
2. Form submission calls Server Action
3. Better-Auth validates credentials
4. Session cookie created
5. Redirect to `/dashboard`
6. Middleware validates session on protected routes

### 4.3 Project Switching Flow
1. User clicks project switcher
2. `ProjectProvider` updates active project in localStorage
3. Page re-renders with new project context
4. `getProjectDb()` retrieves connection for new project
5. Data refetches with new database connection

### 4.4 Data CRUD Flow
1. User navigates to `/data`
2. Server Component fetches schema from project DB
3. DataBrowserColumns generates TanStack Table columns
4. User interacts with table (sort, filter, paginate)
5. User clicks "Create" → DynamicForm renders
6. Form submission calls Server Action
7. Server Action validates input with Zod
8. Use Case executes business logic
9. Repository persists to database
10. Revalidation triggers UI update

### 4.5 Invitation Flow
1. Admin clicks "Invite Member"
2. Form submission calls `InviteUserUseCase`
3. Invitation record created with hashed token
4. Email sent via EmailService
5. Invitee clicks link → `/invite/accept?token=xxx`
6. Server Component validates token
7. Client Component renders acceptance form
8. User accepts → `AcceptInvitationUseCase` executes
9. Member record created, invitation marked used
10. Redirect to project dashboard

### 4.6 Permission Check Flow
1. User attempts action (e.g., delete record)
2. Server Action calls `checkProjectPermission()`
3. Permission service queries Better-Auth for user roles
4. RLS policies filter database queries
5. If unauthorized, throw `ForbiddenError`
6. UI shows error toast

## 5. Configuration Files

### Root Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript strict mode configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS v4 configuration
- `drizzle.config.ts` - Drizzle ORM configuration
- `eslint.config.mjs` - ESLint flat config
- `.env.local` - Environment variables (gitignored)
- `.env.example` - Environment variable template

### Build Artifacts
- `.next/` - Next.js build output
- `node_modules/` - Dependencies
- `drizzle/` - Generated migrations

## 6. Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. User Action
       ▼
┌─────────────────────┐
│  Server Component   │ (Next.js)
└──────┬──────────────┘
       │ 2. Server Action Call
       ▼
┌─────────────────────┐
│   Server Action     │ (app/*/actions.ts)
└──────┬──────────────┘
       │ 3. Permission Check
       ▼
┌─────────────────────┐
│   Permission Svc    │ (lib/auth/permissions.ts)
└──────┬──────────────┘
       │ 4. Execute Use Case
       ▼
┌─────────────────────┐
│     Use Case        │ (lib/core/use-cases/)
└──────┬──────────────┘
       │ 5. Repository Call
       ▼
┌─────────────────────┐
│    Repository       │ (lib/infrastructure/repositories/)
└──────┬──────────────┘
       │ 6. Drizzle ORM Query
       ▼
┌─────────────────────┐
│   PostgreSQL DB     │ (Project-specific)
└─────────────────────┘
```

## 7. Technology Decisions

### Why Next.js 16 App Router?
- React Server Components reduce client bundle size
- Built-in data fetching with caching
- Server Actions eliminate boilerplate API routes
- File-based routing simplifies navigation

### Why Clean Architecture?
- Testability (mock interfaces, not implementations)
- Flexibility (swap Drizzle for Prisma without changing core)
- Clear separation of concerns
- Domain logic isolated from frameworks

### Why Better-Auth?
- Multi-tenancy via organization plugin
- RBAC via admin plugin
- Type-safe, framework-agnostic
- Active development and community

### Why Drizzle ORM?
- Type-safe SQL with minimal overhead
- No runtime schema validation (compile-time only)
- Raw SQL access when needed
- Excellent TypeScript inference

### Why TanStack Table?
- Headless (full control over UI)
- Server-side operations support
- Virtualization for large datasets
- Excellent TypeScript support

## 8. Code Metrics

- **Total Files**: ~200+
- **Lines of Code**: ~15,000+
- **Components**: 75+
- **Routes**: 14 (11 protected, 2 auth, 1 public)
- **Server Actions**: 30+
- **Use Cases**: 15+
- **Repositories**: 3
- **Providers**: 5

## 9. External Dependencies

See `package.json` for complete list. Key dependencies:
- `next@16.x` - Framework
- `react@19.2` - UI library
- `typescript@5.x` - Language
- `drizzle-orm` - Database ORM
- `better-auth` - Authentication
- `@tanstack/react-table@8.x` - Tables
- `@tanstack/react-query` - Client state
- `react-hook-form` - Forms
- `zod` - Validation
- `tailwindcss@4.x` - Styling

## 10. Build & Deployment

### Development
```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm typecheck        # Check TypeScript errors
pnpm lint             # Run ESLint
```

### Production
```bash
pnpm build            # Build for production
pnpm start            # Start production server
```

### Database
```bash
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly
pnpm db:studio        # Open Drizzle Studio
```

## 11. Key Takeaways

1. **Multi-database architecture** enables project isolation
2. **Clean Architecture** separates domain logic from frameworks
3. **Server Actions** replace traditional API routes
4. **RBAC** enforced at multiple layers (UI, API, database)
5. **Type safety** end-to-end with TypeScript + Zod + Drizzle
6. **Dynamic project registry** allows runtime configuration
7. **Component co-location** improves maintainability
8. **TanStack ecosystem** powers data-heavy features
9. **Encryption** secures sensitive database credentials
10. **Row Level Security** provides database-level multi-tenancy

---

**Next Steps**: See [`docs/code-standards.md`](./code-standards.md) for coding conventions and [`docs/system-architecture.md`](./system-architecture.md) for detailed architecture diagrams.
