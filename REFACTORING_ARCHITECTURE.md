# Refactoring Architecture & Implementation Plan

## Executive Summary

This document outlines the comprehensive refactoring plan to elevate the codebase to senior-level, production-ready standards. The refactoring focuses on establishing consistent patterns, eliminating code smells, and creating a maintainable, scalable architecture.

## Current State Analysis

### ✅ Good Patterns Already in Place

1. **Clean Architecture Structure**
   - `/lib/core` with use-cases, domain entities, and interfaces
   - `/lib/infrastructure` for external services
   - Dependency Injection container

2. **Utility Functions**
   - ✅ `withServerAction` - standardized Server Action wrapper
   - ✅ `api-response.ts` - generic response utilities
   - ✅ `try-catch.ts` - reusable error handling
   - ✅ `environment.ts` - environment checks abstraction
   - ✅ `logger.ts` - structured logging
   - ✅ `error-handler.ts` - error sanitization

3. **Well-Implemented Actions**
   - ✅ `project-actions.ts` - uses use cases, no direct DB access
   - ✅ `query-actions.ts` - uses utilities, withServerAction
   - ✅ `schema-actions.ts` - uses introspection utilities
   - ✅ `table-actions.ts` - uses query builder service

### ❌ Issues to Address

1. **Direct Database Access in Actions**
   - `member-actions.ts` - direct DB queries, manual SQL
   - Violates clean architecture principles
   - Should use repository/service layer

2. **Type Safety Issues**
   - Inline type definitions instead of centralized
   - Type casting with `as` (anti-pattern)
   - Usage of `any` and `unknown` types
   - Inconsistent type organization

3. **Inconsistent Patterns**
   - Some actions use `errorHandler` + try-catch
   - Others use `withServerAction` (correct pattern)
   - Need standardization

4. **Missing Abstractions**
   - No Members repository
   - No Members service layer
   - No Members use cases

## Refactoring Architecture

### Layer Structure (Clean Architecture)

```
┌─────────────────────────────────────────────────────┐
│         Presentation Layer (App Router)              │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐   │
│  │  Pages    │  │  Actions   │  │  Components  │   │
│  └───────────┘  └────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           Application Layer (Use Cases)              │
│  ┌────────────────────────────────────────────┐     │
│  │  Use Cases (Business Logic)                │     │
│  │  - create-member.use-case.ts               │     │
│  │  - invite-user.use-case.ts                 │     │
│  │  - update-member-role.use-case.ts          │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│            Domain Layer (Entities)                   │
│  ┌────────────────────────────────────────────┐     │
│  │  Domain Entities & Interfaces              │     │
│  │  - member.entity.ts                        │     │
│  │  - invitation.entity.ts                    │     │
│  │  - member.repository.interface.ts          │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│        Infrastructure Layer (Repositories)           │
│  ┌────────────────────────────────────────────┐     │
│  │  Repository Implementations                │     │
│  │  - member.repository.ts                    │     │
│  │  - invitation.repository.ts                │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              Database Layer                          │
│  ┌────────────────────────────────────────────┐     │
│  │  Drizzle ORM / PostgreSQL                  │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### File Organization Pattern

```
src/
├── app/
│   ├── actions/
│   │   ├── auth/
│   │   │   └── auth.ts                    # ✅ Already clean
│   │   ├── data/
│   │   │   └── table-actions.ts           # ✅ Already clean
│   │   ├── members/
│   │   │   ├── member-actions.ts          # ❌ Needs refactoring
│   │   │   └── invitation-actions.ts      # TODO: Split from member-actions
│   │   ├── projects/
│   │   │   └── project-actions.ts         # ✅ Reference pattern
│   │   ├── query/
│   │   │   └── query-actions.ts           # ✅ Already clean
│   │   └── schema/
│   │       └── schema-actions.ts          # ✅ Already clean
│   └── (dashboard)/
│       └── ...pages
│
├── lib/
│   ├── core/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── project.entity.ts      # ✅ Exists
│   │   │   │   ├── member.entity.ts       # TODO: Create
│   │   │   │   └── invitation.entity.ts   # TODO: Create
│   │   │   └── interfaces/
│   │   │       ├── member.repository.interface.ts     # TODO: Create
│   │   │       └── invitation.repository.interface.ts # TODO: Create
│   │   ├── services/
│   │   │   ├── query-builder.service.ts   # ✅ Exists
│   │   │   └── member.service.ts          # TODO: Create
│   │   └── use-cases/
│   │       ├── projects/                  # ✅ Reference pattern
│   │       └── members/                   # TODO: Create
│   │           ├── create-member.use-case.ts
│   │           ├── invite-user.use-case.ts
│   │           ├── update-member-role.use-case.ts
│   │           ├── remove-member.use-case.ts
│   │           └── get-members.use-case.ts
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── repositories/
│   │   │       ├── project.repository.ts  # ✅ Exists
│   │   │       ├── member.repository.ts   # TODO: Create
│   │   │       └── invitation.repository.ts # TODO: Create
│   │   └── external/
│   │       └── email/                     # ✅ Exists
│   │
│   ├── utils/
│   │   ├── api-response.ts                # ✅ Exists
│   │   ├── try-catch.ts                   # ✅ Exists
│   │   ├── error-handler.ts               # ✅ Exists
│   │   ├── environment.ts                 # ✅ Exists
│   │   └── logger.ts                      # ✅ Exists
│   │
│   └── validations/
│       ├── project.ts                     # ✅ Exists
│       └── member.ts                      # TODO: Create
│
└── types/
    ├── api.types.ts                       # ✅ Exists
    ├── database.types.ts                  # ✅ Exists
    ├── domain.types.ts                    # ✅ Exists - needs cleanup
    └── members.types.ts                   # TODO: Consolidate from inline definitions
```

## Coding Standards & Patterns

### 1. Server Actions Pattern (MANDATORY)

**✅ Correct Pattern (from project-actions.ts):**

```typescript
export async function someAction(input: InputType): Promise<ServerActionResponse<OutputType>> {
  return withServerAction(async () => {
    // 1. Authentication
    const session = await requireAuth()

    // 2. Authorization
    await requireProjectPermission(session.user.id, projectId, 'permission')

    // 3. Validation
    const validatedInput = inputSchema.parse(input)

    // 4. Use Case Execution
    const useCase = container.someUseCase()
    const result = await useCase.execute(validatedInput, { userId: session.user.id })

    // 5. Cache Revalidation
    revalidatePath('/some/path')

    // 6. Return
    return result
  }, 'someAction')
}
```

**❌ Anti-Pattern (from member-actions.ts):**

```typescript
export async function someAction() {
  try {
    const session = await requireAuth()

    const result = await errorHandler(async () => {
      // Direct DB access - WRONG!
      const data = await db.query.table.findFirst({ ... })

      // Inline SQL - WRONG!
      const results = await db.select({ ... }).from(table).where(...)

      // Type casting - WRONG!
      return results.map(r => ({ ...r, role: r.role as ProjectRole }))
    }, 'context')

    return serverActionSuccess(result)
  } catch (error) {
    return serverActionError(error)
  }
}
```

### 2. Type Definitions Pattern

**✅ Correct:**

```typescript
// In types/members.types.ts
export interface Member {
  id: string
  role: ProjectRole
  userId: string
  userName: string
  userEmail: string
  createdAt: Date
}

// In action
import type { Member } from '@/types/members.types'
export async function getMembersAction(): Promise<ServerActionResponse<Member[]>>
```

**❌ Anti-Pattern:**

```typescript
// Inline type definition - WRONG!
export async function getMembersAction(): Promise<ServerActionResponse<{
  id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  userId: string
}[]>>

// Type casting - WRONG!
const members = results.map(r => ({
  ...r,
  role: r.role as ProjectRole  // Use proper typing instead!
}))
```

### 3. Repository Pattern

```typescript
// lib/core/domain/interfaces/member.repository.interface.ts
export interface IMemberRepository {
  findById(id: string): Promise<Member | null>
  findByOrganization(organizationId: string): Promise<Member[]>
  create(data: CreateMemberData): Promise<Member>
  update(id: string, data: UpdateMemberData): Promise<Member>
  delete(id: string): Promise<void>
}

// lib/infrastructure/database/repositories/member.repository.ts
export class MemberRepository implements IMemberRepository {
  async findByOrganization(organizationId: string): Promise<Member[]> {
    // All SQL queries here - isolated from business logic
    const results = await db
      .select({ ... })
      .from(memberTable)
      .where(eq(memberTable.organizationId, organizationId))

    return results.map(toMemberEntity)
  }
}
```

### 4. Use Case Pattern

```typescript
// lib/core/use-cases/members/get-organization-members.use-case.ts
export class GetOrganizationMembersUseCase {
  constructor(
    private memberRepository: IMemberRepository,
    private permissionService: IPermissionService
  ) {}

  async execute(organizationId: string, userId: string): Promise<Member[]> {
    // 1. Authorization check
    await this.permissionService.checkOrganizationAccess(userId, organizationId)

    // 2. Business logic
    const members = await this.memberRepository.findByOrganization(organizationId)

    // 3. Return domain entities
    return members
  }
}
```

## Implementation Steps

### Phase 1: Type System Refactoring

1. Create centralized type definitions
2. Remove all inline type definitions
3. Eliminate `any` and `unknown` types
4. Remove type casting with `as`

### Phase 2: Members Feature Refactoring

1. Create domain entities (Member, Invitation)
2. Create repository interfaces
3. Create repository implementations
4. Create use cases
5. Create validation schemas
6. Refactor actions to use use cases

### Phase 3: Middleware Configuration

1. Review Next.js 16 middleware pattern
2. Update middleware configuration
3. Remove duplicated middleware from lib/auth

### Phase 4: Verification

1. Run typecheck - fix all errors
2. Run lint - fix all issues
3. Run build - ensure successful build
4. Test critical flows
5. Commit changes

## Key Principles

1. **No Direct Database Access in Actions** - Always use repositories/services
2. **No Inline Types** - Centralized type definitions only
3. **No Type Casting** - Proper typing from the source
4. **Consistent Error Handling** - Always use `withServerAction`
5. **Single Responsibility** - Each file/function has one clear purpose
6. **Dependency Injection** - Use DI container for all services
7. **Validation at Boundaries** - Validate at action level with Zod

## Success Criteria

- ✅ Zero direct database access in actions
- ✅ Zero `any` or `unknown` types
- ✅ Zero inline type definitions
- ✅ Zero type casting with `as`
- ✅ All actions follow `withServerAction` pattern
- ✅ Typecheck passes with zero errors
- ✅ Lint passes with zero warnings
- ✅ Build succeeds
- ✅ Consistent architecture across all features
