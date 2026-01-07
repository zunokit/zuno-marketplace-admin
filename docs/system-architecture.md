# System Architecture

**Project:** Zuno Marketplace Admin
**Last Updated:** 2026-01-07

This directory contains detailed system architecture documentation for the Zuno Marketplace Admin project.

## Architecture Documentation

| Document | Topic |
|----------|-------|
| [Clean Architecture Overview](./architecture/clean-architecture.md) | Layers, dependencies, patterns |
| [Authentication & Authorization](./architecture/auth-rbac.md) | Better-Auth, RBAC, RLS, permissions |
| [Multi-Database Architecture](./architecture/multi-database.md) | Connection pooling, project registry, encryption |
| [Data Flow Patterns](./architecture/data-flows.md) | Read/write flows, Server Actions, repositories |
| [Security Architecture](./architecture/security.md) | Security layers, encryption, SQL injection prevention |
| [Performance & Deployment](./architecture/performance-deployment.md) | Caching, optimization, Vercel deployment |

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                             │
│  React Components (Server + Client)                                  │
└──────────────────────────────────────────────────────────────────────┘
                                ↕ HTTPS
┌──────────────────────────────────────────────────────────────────────┐
│                    Next.js 16 Application Server                      │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │  Presentation Layer → Application Layer → Infrastructure    │      │
│  │  → Core Layer                                              │      │
│  └────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
                                ↕ SQL
┌──────────────────────────────────────────────────────────────────────┐
│                   Database Layer (PostgreSQL)                         │
│  Auth DB | Project 1 DB | Project 2 DB | ... | Project N DB         │
└──────────────────────────────────────────────────────────────────────┘
```

## Key Architectural Patterns

**Clean Architecture**
- Independence from frameworks
- Testability through interfaces
- Flexibility to swap implementations
- Dependency Rule: Core ← Infrastructure ← Presentation

**Multi-Database Architecture**
- Each project = separate PostgreSQL database
- Dynamic connection pooling
- Encrypted database URLs
- Automatic connection cleanup

**Repository Pattern**
- Abstract data access
- Drizzle ORM implementations
- Entity mapping

**Use Case Pattern**
- Single responsibility
- Dependency injection
- Clear input/output contracts

## Technology Stack

**Frontend**: Next.js 16, React 19.2, TypeScript, Tailwind CSS v4, shadcn/ui
**Backend**: Next.js Server Actions, Better-Auth, PostgreSQL, Drizzle ORM
**Security**: AES-256-GCM encryption, Row Level Security, RBAC
**Deployment**: Vercel (serverless)

---

See individual architecture documents for detailed information.
