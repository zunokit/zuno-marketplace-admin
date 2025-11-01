# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zuno Marketplace Admin is a Next.js 16 application designed as an admin dashboard for managing a marketplace. This is a fresh project built with modern tooling including:

- Next.js 16 (App Router with React Server Components)
- React 19.2
- TypeScript (strict mode enabled)
- Tailwind CSS v4
- shadcn/ui components (New York style)
- pnpm as package manager

## Development Commands

**Start development server:**

```bash
pnpm dev
# Server runs on http://localhost:3000
```

**Build for production:**

```bash
pnpm build
# Creates optimized production build in .next/
```

**Start production server:**

```bash
pnpm start
# Must run build first
```

**Lint code:**

```bash
pnpm lint
# Uses ESLint with Next.js config (core-web-vitals + TypeScript)
```

**Type check:**

```bash
pnpm typecheck
# Runs TypeScript compiler check without emitting files
```

## Architecture & Code Organization

### Key Architecture Patterns

**App Router (Next.js 16):**

- Uses the App Router architecture (not Pages Router)
- Components are React Server Components by default
- Client components must use 'use client' directive
- App directory structure defines routes

**TypeScript Configuration:**

- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Target: ES2017
- Use path aliases in imports: `@/components/...`, `@/lib/...`

**Styling:**

- Tailwind CSS v4 with PostCSS
- CSS variables for theming (defined in globals.css)
- Dark mode support via class strategy
- Use `cn()` utility from `@/lib/utils` for conditional class merging

**shadcn/ui Components:**

- Configured with "new-york" style
- Component aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`
- Icon library: Lucide React
- To add new components: `npx shadcn@latest add [component-name]`

### Component Patterns

**Server Components (default):**

- Can fetch data directly
- No client-side interactivity
- Can use async/await
- No useState, useEffect, or event handlers

**Client Components:**

- Add 'use client' at top of file
- Can use hooks and browser APIs
- Required for interactivity

**Styling Pattern:**

```tsx
<div className={cn(
  "base-classes",
  condition && "conditional-classes"
)}>
```

## Technical Decisions

**Font Loading:**

- Uses next/font for automatic font optimization
- Geist Sans and Geist Mono fonts loaded via Google Fonts
- Font variables applied to body element

**Image Optimization:**

- Use Next.js `<Image>` component from `next/image`
- Automatic optimization and lazy loading
- Set width, height, and alt attributes

**ESLint Configuration:**

- Uses flat config format (eslint.config.mjs)
- Extends Next.js core-web-vitals and TypeScript configs
- Ignores: .next/, out/, build/, next-env.d.ts

**Metadata & SEO:**

- Use Metadata API for page metadata (Server Components)
- Set dynamic metadata using `generateMetadata` function
- Provide proper title, description, and Open Graph tags
- Use metadata for better SEO and social sharing

## Project Context

This is an admin dashboard project for a marketplace platform. The current implementation is a starter template that needs to be built out with:

- Authentication and authorization
- Admin-specific UI components
- Data management interfaces
- API integrations

When building features, consider:

- Admin users need different permissions than regular users
- Data tables and forms will be common UI patterns
- Use shadcn/ui components for consistent design
- Implement proper error handling and loading states
- Follow Next.js best practices for data fetching and caching

## Development Standards

### Core Principles

- Write senior-level code that is maintainable, modifiable, and upgradeable
- Write code for production use, not just prototypes
- When fixing bugs, don't just make code work - find the root cause and fix it properly
- Install or use necessary libraries as needed
- Always review code before committing
- **Make decisions proactively**: Don't ask for approval on every decision - choose the best approach for the project based on best practices, existing patterns, and project context
- When multiple approaches exist, select the most maintainable, scalable, and consistent solution
- Research and apply industry best practices without asking for permission
- Only ask questions when absolutely necessary information is missing that would significantly impact the solution quality

### Code Architecture & Structure

- Define directory structure and code rules upfront - be smart and standard from the start
- Complex logic must follow the defined architecture rules
- Don't use built-in functions manually - create wrapper/reusable utilities instead

### Type Safety

- Never use `any` or `unknown` - define types explicitly or use types from libraries
- Always define proper types or extract types from library-provided types

### Reusable Utilities Pattern

**Error Handling:**

```
❌ Don't
try {
  // code
} catch (error) {
  // handle
}

✅ Do (create custom error handler wrapper)
customErrorHandler(() => {
  // code
})
```

**Logging:**

```
❌ Don't
console.log('message')

✅ Do (use logger utility)
logger.info('message')
```

**Error Response Standardization:**

- Create error handler utility wrapper for try-catch
- Use standardized error response format
- Log errors with full context
- Never expose internal errors to client (sanitize)

### Next.js App Router Conventions

- Follow Next.js App Router conventions (Server Components by default)
- Only use Client Components when interactivity is truly needed
- Prefer Server Actions for mutations over API routes when possible
- Implement `loading.tsx` and `error.tsx` for routes when needed
- Use route groups `(folder)` for organizing routes without affecting URL structure
- Use route handlers (`route.ts`) only when:
  - Integrating with external APIs that require specific headers
  - Creating webhooks endpoints
  - Need fine-grained control over HTTP methods and status codes
  - Working with streaming or custom responses

### API Design (Rails API Style)

**HTTP Methods & Resource Naming:**

- RESTful conventions: GET, POST, PUT, DELETE
- Resource naming: `/api/users`, `/api/products` (plural)

**Status Codes:**

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

**Response Format:**

- Consistent format: `{ data: {...}, message?: string, errors?: [...] }`
- URL parameters for filtering, pagination: `?page=1&limit=10&status=active`

### Testing Standards

- Always create test files for complex logic
- Use Jest for testing
- No need to test UI, components, etc.

### Environment & Configuration

- Always define environment variables in `.env.example` when using them

### Git & Version Control

**Commit Message Format:**

- Follow conventional commits format
- Header: `<type>(<scope>): <description>` (≤50 chars)
- Body: each line ≤100 chars, explain WHAT and WHY

**Pre-commit Checklist:**

- Always review code before committing
- Run lint before committing: `pnpm lint`
- Type check must pass: `pnpm typecheck`
- No `console.log` (use logger)
- Tests must pass (if applicable)

### File Management

- Never automatically create `*.md` files

### Data Fetching & Caching

**Server Components (Default):**

- Use native `fetch` API with Next.js caching (Server Components)
- Leverage Next.js built-in caching strategies: `cache`, `no-store`, `revalidate`
- Use `revalidatePath` and `revalidateTag` for cache invalidation
- Implement proper loading states with Suspense boundaries
- Handle errors gracefully with error boundaries

**Client Components (When Needed):**

- Use React Query (TanStack Query) for client-side data fetching when:
  - Real-time data updates are required
  - Optimistic updates needed
  - Complex caching and synchronization required
  - Background refetching needed
- Prefer Server Components for initial data loading
- Use React Query for client-side mutations and updates

### Component Organization

- Organize components by feature/domain when possible
- Keep components small and focused (Single Responsibility Principle)
- Extract reusable logic into custom hooks (`@/hooks`)
- Share types and interfaces in `@/types` or `@/lib/types`
- Use barrel exports (`index.ts`) for cleaner imports when appropriate

### Form Handling Patterns

- Use Server Actions for form submissions when possible
- Implement client-side validation for better UX using Zod schemas
- Use shadcn/ui form components with react-hook-form for complex forms
- Handle form errors with proper error states
- Provide loading states during form submission
- Validate data on both client and server side
- Use Zod for schema validation and type inference

### Validation Patterns

- Use Zod for schema validation and TypeScript type inference
- Share validation schemas between client and server
- Create reusable validation utilities in `@/lib/validations`
- Validate Server Actions inputs with Zod schemas
- Use Zod with react-hook-form for form validation

### Server Actions Patterns

- Use `'use server'` directive at top of Server Action files
- Validate all inputs with Zod schemas
- Use `revalidatePath` or `revalidateTag` after mutations
- Handle errors properly and return structured responses
- Keep Server Actions focused and single-purpose
- Organize Server Actions in `app/actions/` or co-located with routes

### Route Handlers Patterns

- Use `route.ts` file for API endpoints when Server Actions aren't suitable
- Export named functions: GET, POST, PUT, DELETE, PATCH
- Return proper Response objects with correct status codes
- Validate request data before processing
- Use NextResponse for advanced response handling
- Handle CORS if needed for external API access

### Performance Optimization

- Use dynamic imports (`next/dynamic`) for large client components
- Implement code splitting for routes and features
- Lazy load images below the fold
- Optimize fonts with `next/font`
- Minimize JavaScript bundle size (prefer Server Components)

### Accessibility (A11y)

- Use semantic HTML elements
- Provide proper ARIA labels and roles
- Ensure keyboard navigation works
- Maintain proper color contrast ratios
- Test with screen readers when building critical features

### Security Best Practices

- Validate and sanitize all user inputs
- Never expose sensitive data in client components
- Use Server Actions for mutations instead of exposing API endpoints when possible
- Implement proper authentication and authorization checks
- Sanitize error messages before exposing to clients

### Third-Party Libraries

**React Query (TanStack Query):**

- Use for client-side data fetching when real-time updates are needed
- Implement for complex data synchronization and caching
- Use for optimistic updates and background refetching
- Combine with Server Components: use Server Components for initial load, React Query for updates
- Install: `pnpm add @tanstack/react-query`
- Set up QueryClient provider in client components

**TanStack Table:**

- Use for complex data tables in admin dashboard (sorting, filtering, pagination, column visibility)
- Perfect for admin data management interfaces
- Works seamlessly with React Query for server-side data
- Install: `pnpm add @tanstack/react-table`
- Combine with shadcn/ui Table component for styling
- Use when table needs: server-side sorting, filtering, pagination, column resizing, row selection

**Zod (Validation):**

- Use for schema validation and TypeScript type inference
- Share schemas between client and server
- Works with react-hook-form for form validation
- Install: `pnpm add zod`
- Create validation utilities in `@/lib/validations`
- Use for validating Server Actions, API routes, and form inputs

**React Hook Form:**

- Use with shadcn/ui form components for complex forms
- Provides excellent performance and validation
- Works seamlessly with Zod for schema validation
- Install: `pnpm add react-hook-form @hookform/resolvers`
- Use resolver: `zodResolver` from `@hookform/resolvers/zod`
