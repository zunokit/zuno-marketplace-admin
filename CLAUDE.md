# CLAUDE.md - AI Assistant Guide for Zuno Marketplace Admin

## Project Overview

**Repository:** `zuno-marketplace-admin`
**License:** MIT License (Copyright 2025 Zuno)
**Project Type:** Administrative Dashboard for Marketplace Platform
**Current State:** Initial/Empty Repository - Ready for Project Setup

### Purpose

This is an administrative dashboard application for the Zuno marketplace platform. The admin panel will provide tools for managing marketplace operations, including user management, product listings, order processing, analytics, and system configuration.

---

## Current Repository State

**Status:** Newly initialized repository
**Contents:** LICENSE file only
**Branch Strategy:** Feature branches prefixed with `claude/`

The codebase is in its initial state. AI assistants should follow the guidelines below when building out this application.

---

## Recommended Technology Stack

### Core Framework (To Be Decided)
When initializing this project, prefer modern, well-supported frameworks:

- **Next.js 14+** (Recommended) - React framework with App Router, SSR, and API routes
- **React 18+** with Vite - Fast development with modern build tooling
- **TypeScript** (Required) - All code should be written in TypeScript for type safety

### UI/Styling Libraries (To Be Decided)
Choose based on project requirements:

- **Tailwind CSS** + **shadcn/ui** - Modern, customizable component library
- **Material-UI (MUI)** - Comprehensive component library with admin templates
- **Ant Design** - Enterprise-grade UI library popular for admin dashboards
- **Chakra UI** - Accessible, modular component library

### State Management
- **React Query/TanStack Query** - Server state management (Recommended)
- **Zustand** - Lightweight client state management
- **Redux Toolkit** - For complex state requirements

### Data Fetching & API
- **Axios** or **Fetch API** - HTTP client
- **GraphQL** (if applicable) - With Apollo Client or urql
- **tRPC** (if Next.js full-stack) - Type-safe API layer

### Form Management
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation with TypeScript inference

### Authentication
- **NextAuth.js** - If using Next.js
- **Clerk** - Modern auth solution
- **Auth0** or **Supabase Auth** - Third-party providers

### Testing
- **Vitest** - Fast unit testing
- **React Testing Library** - Component testing
- **Playwright** or **Cypress** - E2E testing

### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files

---

## Project Structure (Recommended)

When creating the project structure, organize code as follows:

```
zuno-marketplace-admin/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── public/                 # Static assets
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/               # Next.js App Router pages (if Next.js)
│   │   ├── (auth)/        # Authentication routes
│   │   ├── (dashboard)/   # Dashboard routes
│   │   └── api/           # API routes (if Next.js)
│   ├── components/        # React components
│   │   ├── ui/            # Base UI components
│   │   ├── forms/         # Form components
│   │   ├── layouts/       # Layout components
│   │   └── features/      # Feature-specific components
│   ├── lib/               # Utility libraries
│   │   ├── api/           # API clients and configs
│   │   ├── auth/          # Authentication utilities
│   │   └── utils/         # Helper functions
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── stores/            # State management stores
│   ├── constants/         # Application constants
│   ├── styles/            # Global styles
│   └── config/            # Configuration files
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── .env.example           # Environment variables template
├── .eslintrc.js           # ESLint configuration
├── .prettierrc            # Prettier configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js config (if applicable)
├── vite.config.ts         # Vite config (if applicable)
├── tailwind.config.js     # Tailwind config (if applicable)
├── CLAUDE.md              # This file
├── README.md              # Project documentation
└── LICENSE                # MIT License
```

---

## Development Conventions

### TypeScript Standards

1. **Strict Mode:** Enable strict TypeScript checking
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitAny": true
     }
   }
   ```

2. **Type Definitions:**
   - Define interfaces for all data structures
   - Use `type` for unions and primitives
   - Prefer `interface` for object shapes
   - Export types from dedicated type files

3. **Avoid `any`:** Always provide proper types, use `unknown` if type is truly unknown

### Component Conventions

1. **Functional Components:** Use functional components with hooks (no class components)

2. **Component Structure:**
   ```typescript
   // Import order: React -> Third-party -> Local
   import { useState, useEffect } from 'react'
   import { Button } from '@/components/ui/button'
   import { useAuth } from '@/hooks/useAuth'

   interface ComponentProps {
     prop1: string
     prop2?: number
   }

   export function ComponentName({ prop1, prop2 }: ComponentProps) {
     // Hooks first
     const [state, setState] = useState()

     // Event handlers
     const handleClick = () => {}

     // Effects
     useEffect(() => {}, [])

     // Render
     return <div>{/* JSX */}</div>
   }
   ```

3. **File Naming:**
   - Components: `PascalCase.tsx` (e.g., `UserTable.tsx`)
   - Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
   - Hooks: `use*.ts` (e.g., `useAuth.ts`)
   - Constants: `UPPER_SNAKE_CASE.ts` or `camelCase.ts`

4. **Component Organization:**
   - One component per file
   - Co-locate related components in feature folders
   - Separate UI components from business logic components

### Code Quality Standards

1. **Error Handling:**
   - Always handle errors in async operations
   - Use try-catch blocks appropriately
   - Display user-friendly error messages
   - Log errors for debugging

2. **Security:**
   - NEVER commit secrets or API keys
   - Use environment variables for sensitive data
   - Sanitize user inputs to prevent XSS
   - Validate all data from APIs
   - Implement proper authentication checks
   - Use HTTPS for API calls
   - Implement CSRF protection

3. **Performance:**
   - Use React.memo() for expensive components
   - Implement proper loading states
   - Use pagination for large data sets
   - Optimize images and assets
   - Lazy load routes and components
   - Debounce search inputs

4. **Accessibility:**
   - Use semantic HTML elements
   - Provide proper ARIA labels
   - Ensure keyboard navigation works
   - Maintain sufficient color contrast
   - Test with screen readers

### API Integration

1. **API Client Setup:**
   ```typescript
   // lib/api/client.ts
   import axios from 'axios'

   export const apiClient = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_URL,
     headers: {
       'Content-Type': 'application/json',
     },
   })

   // Add auth interceptor
   apiClient.interceptors.request.use((config) => {
     const token = getAuthToken()
     if (token) {
       config.headers.Authorization = `Bearer ${token}`
     }
     return config
   })
   ```

2. **API Response Handling:**
   - Define response types for all endpoints
   - Handle loading, error, and success states
   - Use React Query for caching and refetching

3. **Environment Variables:**
   - Prefix public vars with `NEXT_PUBLIC_` (Next.js) or `VITE_` (Vite)
   - Never expose sensitive keys client-side
   - Provide `.env.example` with all required variables

### State Management

1. **Server State:** Use React Query for API data
   ```typescript
   const { data, isLoading, error } = useQuery({
     queryKey: ['users'],
     queryFn: fetchUsers,
   })
   ```

2. **Client State:** Use Zustand or Context API for UI state
   ```typescript
   import { create } from 'zustand'

   interface AppState {
     sidebarOpen: boolean
     toggleSidebar: () => void
   }

   export const useAppStore = create<AppState>((set) => ({
     sidebarOpen: true,
     toggleSidebar: () => set((state) => ({
       sidebarOpen: !state.sidebarOpen
     })),
   }))
   ```

3. **Form State:** Use React Hook Form
   ```typescript
   const { register, handleSubmit, formState: { errors } } = useForm()
   ```

### Styling Conventions

1. **CSS Methodology:**
   - Use Tailwind utility classes (if using Tailwind)
   - Create component variants for reusability
   - Avoid inline styles except for dynamic values

2. **Responsive Design:**
   - Mobile-first approach
   - Test on common breakpoints: sm, md, lg, xl, 2xl
   - Use responsive Tailwind classes: `md:flex`, `lg:grid-cols-3`

3. **Theme:**
   - Define color palette in theme config
   - Support light/dark mode if required
   - Use CSS variables for theme values

### Testing Standards

1. **Unit Tests:**
   - Test utility functions thoroughly
   - Test custom hooks in isolation
   - Mock external dependencies

2. **Component Tests:**
   - Test user interactions
   - Test different component states
   - Test accessibility features
   - Mock API calls

3. **E2E Tests:**
   - Test critical user flows
   - Test authentication flows
   - Test CRUD operations

4. **Coverage:**
   - Aim for >80% coverage on utilities
   - Focus on critical business logic
   - Don't chase 100% coverage blindly

### Git Workflow

1. **Branch Naming:**
   - Feature: `claude/feature-name-[sessionId]`
   - Bugfix: `claude/fix-issue-[sessionId]`
   - All branches must start with `claude/`

2. **Commit Messages:**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
   - Write clear, descriptive messages
   - Reference issues when applicable
   - Examples:
     - `feat: add user management table component`
     - `fix: resolve pagination issue in orders list`
     - `docs: update API integration guide`

3. **Before Committing:**
   - Run linter: `npm run lint`
   - Run tests: `npm test`
   - Check TypeScript: `npm run type-check`
   - Verify build: `npm run build`

4. **Pull Requests:**
   - Provide clear description of changes
   - Include testing steps
   - Reference related issues
   - Ensure CI/CD passes

---

## AI Assistant Guidelines

### When Setting Up the Project

1. **Initial Setup Checklist:**
   - [ ] Initialize package.json with project metadata
   - [ ] Install core dependencies (React, Next.js/Vite, TypeScript)
   - [ ] Set up TypeScript configuration with strict mode
   - [ ] Configure ESLint and Prettier
   - [ ] Set up Tailwind CSS (or chosen UI framework)
   - [ ] Create basic folder structure
   - [ ] Set up environment variables template (.env.example)
   - [ ] Configure Git hooks with Husky
   - [ ] Create basic README.md with setup instructions
   - [ ] Set up testing framework (Vitest, React Testing Library)
   - [ ] Configure CI/CD pipeline (GitHub Actions)

2. **Ask Before Deciding:**
   - Choice of UI framework (Tailwind + shadcn, MUI, Ant Design)
   - State management approach (Zustand, Redux, Context)
   - Authentication strategy (NextAuth, Clerk, custom)
   - API architecture (REST, GraphQL, tRPC)
   - Deployment platform (Vercel, Netlify, AWS, custom)

### When Adding Features

1. **Planning:**
   - Use TodoWrite to break down tasks
   - Review existing code patterns before implementing
   - Consider security implications
   - Plan for error handling and loading states

2. **Implementation:**
   - Follow established patterns in the codebase
   - Create reusable components when possible
   - Add proper TypeScript types
   - Include error boundaries
   - Implement loading and empty states
   - Add proper validation

3. **Testing:**
   - Write unit tests for new utilities
   - Add component tests for UI components
   - Update E2E tests for new user flows
   - Manual testing in development

4. **Documentation:**
   - Update README if adding setup steps
   - Add JSDoc comments for complex functions
   - Update this CLAUDE.md if conventions change
   - Document API endpoints and types

### When Debugging Issues

1. **Investigation:**
   - Check browser console for errors
   - Review network requests in DevTools
   - Check TypeScript errors
   - Review relevant test failures

2. **Security Checks:**
   - Never log sensitive data
   - Ensure proper input validation
   - Check authentication/authorization
   - Review CORS and CSP policies

3. **Performance:**
   - Check for unnecessary re-renders
   - Review bundle size if adding dependencies
   - Optimize images and assets
   - Consider lazy loading

### When Reviewing Code

1. **Code Quality:**
   - TypeScript types are properly defined
   - No use of `any` without justification
   - Proper error handling
   - No hardcoded values (use constants/env vars)

2. **Security:**
   - No exposed secrets or API keys
   - Input validation is present
   - XSS prevention measures in place
   - Authentication checks are implemented

3. **Performance:**
   - No obvious performance bottlenecks
   - Proper use of memoization
   - Efficient data fetching
   - Optimized images and assets

4. **User Experience:**
   - Loading states are implemented
   - Error messages are user-friendly
   - Responsive design works
   - Accessibility is considered

### Common Marketplace Admin Features

When implementing features, consider these common admin dashboard requirements:

1. **Dashboard Overview:**
   - Key metrics and KPIs
   - Recent activity feed
   - Quick action buttons
   - Charts and graphs

2. **User Management:**
   - User list with search/filter
   - User details and edit
   - Role and permission management
   - User activity logs

3. **Product Management:**
   - Product catalog with CRUD operations
   - Category management
   - Inventory tracking
   - Bulk operations

4. **Order Management:**
   - Order list with filters
   - Order details and status updates
   - Refund processing
   - Order analytics

5. **Analytics & Reports:**
   - Sales reports
   - User analytics
   - Product performance
   - Export functionality (CSV, PDF)

6. **Settings:**
   - System configuration
   - API key management
   - Email templates
   - Payment gateway settings

7. **Content Management:**
   - Page editor
   - Media library
   - SEO settings
   - Blog management

---

## Environment Setup

### Required Environment Variables

Create a `.env.local` file with these variables (update as needed):

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
API_SECRET_KEY=your-secret-key-here

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
JWT_SECRET=your-jwt-secret

# Database (if applicable)
DATABASE_URL=postgresql://user:password@localhost:5432/zuno_admin

# Third-party Services
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# File Upload
UPLOAD_MAX_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Feature Flags
ENABLE_DARK_MODE=true
ENABLE_ANALYTICS=true
```

### Development Scripts

Standard npm scripts to include in package.json:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "prepare": "husky install"
  }
}
```

---

## Performance Best Practices

1. **Code Splitting:**
   - Use dynamic imports for routes
   - Lazy load heavy components
   - Split vendor bundles

2. **Caching:**
   - Implement React Query caching
   - Use browser caching for static assets
   - Consider service workers for offline support

3. **Optimization:**
   - Use Next.js Image component for images
   - Implement virtual scrolling for long lists
   - Debounce search inputs
   - Optimize re-renders with React.memo

4. **Monitoring:**
   - Set up error tracking (Sentry, Rollbar)
   - Monitor performance metrics
   - Track API response times
   - Monitor bundle size

---

## Deployment Guidelines

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] No console errors or warnings
- [ ] Environment variables configured
- [ ] Build succeeds locally
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Accessibility checked
- [ ] SEO optimized (if applicable)
- [ ] Documentation updated

### Deployment Platforms

**Recommended Platforms:**
- **Vercel** - Best for Next.js applications
- **Netlify** - Good for static sites and SSR
- **AWS Amplify** - Full AWS integration
- **Docker** - For containerized deployments

### Environment-Specific Configs

- **Development:** Verbose logging, hot reload, dev tools
- **Staging:** Production-like, with test data
- **Production:** Optimized builds, error tracking, analytics

---

## Troubleshooting Common Issues

### TypeScript Errors
- Run `npm run type-check` to see all errors
- Ensure `tsconfig.json` is properly configured
- Check for missing type definitions

### Build Failures
- Clear cache: `rm -rf .next` or `rm -rf dist`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for circular dependencies

### API Issues
- Verify environment variables are set
- Check network tab in DevTools
- Ensure CORS is configured
- Verify authentication tokens

### Performance Issues
- Use React DevTools Profiler
- Check bundle size with `npm run build`
- Review network waterfall
- Implement proper code splitting

---

## Resources & References

### Documentation
- [React Documentation](https://react.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Can I Use](https://caniuse.com) - Browser compatibility

### Best Practices
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Security
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Maintenance & Updates

### Regular Updates
- Update dependencies monthly
- Review security advisories
- Update this CLAUDE.md as project evolves
- Review and refactor technical debt

### Version Control
- Tag releases with semantic versioning
- Maintain CHANGELOG.md
- Document breaking changes

---

## Contact & Support

For questions about this codebase or conventions:
1. Review this CLAUDE.md file
2. Check existing code for patterns
3. Review project README.md
4. Consult team documentation (when available)

---

**Last Updated:** 2025-11-15
**Repository State:** Initial/Empty - Awaiting Project Setup
**AI Assistant Version:** Claude Sonnet 4.5

---

## Notes for AI Assistants

- This repository is in its initial state with no code yet
- Follow the conventions above when building out features
- Always prioritize security, performance, and accessibility
- Use TypeScript strictly with proper typing
- Test thoroughly before committing
- Keep this document updated as the project evolves
- When in doubt, ask the user for clarification on technical decisions
