# Code Standards

**Project:** Zuno Marketplace Admin
**Last Updated:** 2026-01-07

This directory contains coding standards and conventions for the Zuno Marketplace Admin project.

## Quick Reference

| Document | Topic |
|----------|-------|
| [TypeScript Standards](./typescript-standards.md) | Type safety, configuration, Zod integration |
| [React & Next.js Patterns](./react-nextjs-patterns.md) | Server/Client components, Server Actions, naming |
| [File Organization](./file-organization.md) | Directory structure, naming conventions, barrel exports |
| [Data & Validation](./data-validation.md) | Data fetching, error handling, Zod schemas |
| [Styling & Performance](./styling-performance.md) | Tailwind, CVA, code splitting, optimization |
| [Database & Security](./database-security.md) | Repository pattern, multi-DB, security best practices |

## Core Principles

- **Type Safety First**: TypeScript strict mode, no `any`, explicit return types
- **Server Components by Default**: Only use Client Components when necessary
- **Clean Architecture**: Strict layer separation (Core → Infrastructure → Presentation)
- **Permission-Based Security**: Check permissions before mutations
- **Validation Everywhere**: Client-side and server-side with Zod
- **Performance-Conscious**: Code splitting, virtualization, memoization

## Enforcement

Standards are enforced through:
- TypeScript compiler (strict mode)
- ESLint configuration
- Pre-commit hooks
- Code reviews

## Exception Policy

Document any deviations from these standards with inline comments explaining the rationale.

---

See individual files for detailed standards and examples.
