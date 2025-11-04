# Architecture & Design Patterns

This document defines the senior-level architecture patterns and conventions for the Zuno Marketplace Admin project.

## Core Principles

1. **Separation of Concerns**: Clear boundaries between layers (presentation, business logic, data access)
2. **Type Safety**: Zero tolerance for `any` and `unknown` - all types must be explicit
3. **DRY (Don't Repeat Yourself)**: All reusable logic must be abstracted
4. **Security First**: No direct SQL queries, proper sanitization, validation at all layers
5. **Maintainability**: Code should be easy to read, test, and modify

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth route group
│   ├── (dashboard)/         # Dashboard route group
│   └── actions/             # Server Actions (thin layer, delegates to services)
├── components/              # UI Components (feature-based)
│   ├── features/            # Feature-specific components
│   │   ├── data/           # Data management feature
│   │   ├── projects/       # Project management feature
│   │   ├── members/        # Member management feature
│   │   └── schema/         # Schema visualization feature
│   ├── layout/             # Layout components
│   └── ui/                 # Shared UI components (shadcn/ui)
├── lib/                     # Core business logic
│   ├── core/               # Domain layer (DDD patterns)
│   │   ├── domain/         # Entities, interfaces, value objects
│   │   ├── services/       # Domain services
│   │   └── use-cases/      # Application use cases
│   ├── infrastructure/     # Infrastructure layer
│   │   ├── database/       # Database connections, repositories, schemas
│   │   └── external/       # External services (email, encryption)
│   ├── constants/          # Application constants
│   ├── utils/              # Shared utilities
│   └── validations/        # Zod validation schemas
├── types/                   # Centralized TypeScript types
│   ├── api.types.ts        # API request/response types
│   ├── database.types.ts   # Database-related types
│   ├── domain.types.ts     # Domain entity types
│   └── ui.types.ts         # UI component prop types
└── config/                  # Configuration files
```

## Layer Architecture

### 1. Presentation Layer (Components)

**Responsibilities:**
- Render UI
- Handle user interactions
- Manage local UI state only
- Call Server Actions (never call services or repositories directly)

**Rules:**
- Client Components: Must use `'use client'` directive
- Server Components: Default, can use `async/await` for data fetching
- No business logic in components
- No direct database access
- Props must have explicit types (no inline types)

### 2. Application Layer (Server Actions)

**Responsibilities:**
- Thin orchestration layer
- Authentication/authorization checks
- Input validation (Zod schemas)
- Delegate to use cases or services
- Cache invalidation
- Return standardized responses

**Rules:**
- Always use `'use server'` directive
- First line: auth check via `requireAuth()` or `requireProjectPermission()`
- Second: input validation via Zod schema
- Third: delegate to use case/service
- Always wrap in try-catch using standard response utilities
- No direct database access
- No business logic

**Pattern:**
```typescript
'use server'

export async function someAction(input: SomeInput): Promise<ServerActionResponse<SomeOutput>> {
  try {
    // 1. Auth check
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'permission.name')

    // 2. Validation
    const validated = someSchema.parse(input)

    // 3. Delegate to use case/service
    const useCase = container.someUseCase()
    const result = await useCase.execute(validated, { userId: session.user.id })

    // 4. Cache invalidation
    revalidatePath('/some/path')

    // 5. Return standardized response
    return serverActionSuccess(result, 'Success message')
  } catch (error) {
    return serverActionError(error)
  }
}
```

### 3. Domain Layer (Use Cases & Services)

**Responsibilities:**
- Business logic
- Domain rules enforcement
- Orchestration of repositories
- Transaction management

**Rules:**
- Pure business logic
- No HTTP/request/response concerns
- No auth checks (handled in Server Actions)
- Use repositories for data access
- Throw domain errors (AppError, ValidationError, etc.)

### 4. Infrastructure Layer (Repositories, External Services)

**Responsibilities:**
- Data access (repositories)
- External service integration
- Query building (using query builders, not raw SQL)

**Rules:**
- Repositories implement domain interfaces
- Use Drizzle ORM query builder (never raw SQL)
- Handle database-specific errors
- Map database models to domain entities

## Type Organization

### Type File Structure

```typescript
// types/domain.types.ts - Domain entities
export interface User {
  id: string
  email: string
  name: string
  role: GlobalRole
}

// types/database.types.ts - Database schemas
export interface ProjectRecord {
  id: string
  name: string
  database_url: string | null
  created_at: Date
}

// types/api.types.ts - API contracts
export interface CreateProjectRequest {
  name: string
  description?: string
  databaseUrl?: string
}

export interface CreateProjectResponse {
  project: Project
}

// types/ui.types.ts - Component props
export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
}
```

### Type Naming Conventions

- **Entities**: PascalCase, descriptive names (e.g., `User`, `Project`, `ProjectMember`)
- **DTOs**: Suffix with `Request`, `Response`, `Input`, `Output` (e.g., `CreateProjectRequest`)
- **Props**: Suffix with `Props` (e.g., `DataTableProps`)
- **Database records**: Suffix with `Record` (e.g., `ProjectRecord`)
- **Enums**: PascalCase for type, UPPER_CASE for values

**Never:**
- Use inline type definitions
- Use `as` for type assertions (use proper types instead)
- Use `any` or `unknown`
- Define types in component files

## Environment Utilities

Instead of checking `process.env.NODE_ENV` directly, use utility functions:

```typescript
// lib/utils/environment.ts
export const isDevelopment = () => process.env.NODE_ENV === 'development'
export const isProduction = () => process.env.NODE_ENV === 'production'
export const isTest = () => process.env.NODE_ENV === 'test'
```

## Database Query Patterns

### Using Query Builder Service

**Never:**
```typescript
// ❌ Direct SQL with manual escaping
const query = sql.raw(`INSERT INTO "${tableName}" (${columnsList}) VALUES (${valuesList})`)
```

**Always:**
```typescript
// ✅ Use query builder service
const queryBuilder = container.queryBuilderService()
const result = await queryBuilder.insert(projectId, tableName, data)
```

### Query Builder Service

Create a centralized service for all dynamic queries:

```typescript
// lib/core/services/query-builder.service.ts
export class QueryBuilderService {
  async insert(projectId: string, tableName: string, data: Record<string, unknown>): Promise<Record<string, unknown>>
  async update(projectId: string, tableName: string, pk: PrimaryKey, data: Record<string, unknown>): Promise<Record<string, unknown>>
  async delete(projectId: string, tableName: string, pk: PrimaryKey): Promise<void>
  async select(projectId: string, tableName: string, options: QueryOptions): Promise<QueryResult>
}
```

## Error Handling

### Error Classes

Use custom error classes for domain errors:

```typescript
// ✅ Throw domain errors
throw new ValidationError('Invalid input', { field: 'email' })
throw new NotFoundError('Project not found', { projectId })
throw new ForbiddenError('Insufficient permissions')
```

### Error Handler Wrapper

Use error handler wrapper for complex operations:

```typescript
// ✅ Use error handler
const result = await errorHandler(async () => {
  // Complex operation
  return await someOperation()
}, 'operationContext')
```

## Validation Patterns

### Schema Organization

```typescript
// lib/validations/[feature].validation.ts
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  databaseUrl: z.string().url().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
```

### Validation in Actions

```typescript
// Always validate inputs
const validated = createProjectSchema.parse(input) // Throws on invalid
```

## Component Patterns

### Feature-Based Components

Organize components by feature, not by type:

```
components/features/data/
├── components/
│   ├── DataTable.tsx
│   ├── DataTableToolbar.tsx
│   ├── DataTableFilters.tsx
│   └── columns/
│       └── data-columns.tsx
├── hooks/
│   ├── useDataTable.ts
│   └── useTableFilters.ts
├── types.ts
└── index.ts
```

### Component Size

- Keep components under 300 lines
- Extract complex logic to custom hooks
- Break down large components into smaller, focused components

### Loading and Error States

Use layout-level `loading.tsx` and `error.tsx`:

```
app/(dashboard)/
├── layout.tsx
├── loading.tsx    # ← Layout level only
├── error.tsx      # ← Layout level only
└── [routes]/
```

## Testing Patterns

### Unit Tests

- Test complex business logic
- Test utilities and services
- Use Jest with `*.test.ts` naming

### File Organization

```
lib/
├── utils/
│   ├── error-handler.ts
│   └── __tests__/
│       └── error-handler.test.ts
```

## Commit Conventions

Follow Conventional Commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Examples:**
```
feat(data): add query builder service for dynamic SQL
fix(auth): correct permission check for project actions
refactor(types): centralize type definitions
```

## Performance Guidelines

1. Use Server Components by default
2. Only use Client Components when needed (interactivity)
3. Use React Query for client-side data fetching when real-time updates needed
4. Implement pagination for large datasets
5. Use proper caching strategies (Next.js cache, React Query)

## Security Guidelines

1. **Input Validation**: Validate ALL inputs with Zod schemas
2. **SQL Injection**: Never use raw SQL, always use query builders
3. **XSS**: Sanitize user inputs before rendering
4. **Authentication**: Check auth in every Server Action
5. **Authorization**: Use RBAC permissions
6. **Sensitive Data**: Never expose database URLs, API keys, etc. to client
7. **Error Messages**: Sanitize errors before sending to client

## Code Review Checklist

Before committing:

- [ ] No `any` or `unknown` types
- [ ] No inline type definitions
- [ ] No direct SQL queries
- [ ] No `console.log` (use logger)
- [ ] All inputs validated with Zod
- [ ] Proper error handling
- [ ] Auth/permissions checked
- [ ] Types properly organized
- [ ] Components under 300 lines
- [ ] Tests pass
- [ ] Type check passes
- [ ] Lint passes
- [ ] Build succeeds
