# Project Overview & Product Development Requirements (PDR)

**Project:** Zuno Marketplace Admin
**Version:** 1.0.0
**Last Updated:** 2026-01-07
**Status:** Active Development

## 1. Project Purpose

Zuno Marketplace Admin is a scalable, multi-project admin dashboard built to manage multiple marketplace products from a single unified interface. It provides centralized management for various marketplace microservices, each with their own database and business logic, while maintaining strong security boundaries and role-based access control.

## 2. Goals & Objectives

### Primary Goals
- **Multi-tenancy**: Support multiple independent projects (organizations) in a single application
- **Security**: Enforce strict RBAC at both global and project levels with database-level isolation
- **Scalability**: Handle dynamic project registration without code redeployment
- **Developer Experience**: Provide intuitive tools for data management, schema exploration, and SQL querying
- **Type Safety**: Ensure end-to-end type safety from database to UI

### Secondary Goals
- Reduce operational overhead through unified admin interface
- Enable rapid onboarding of new marketplace projects
- Provide self-service capabilities for project administrators
- Maintain audit trails for compliance and debugging

## 3. Target Users

### Super Administrators
- **Role**: Platform-level access across all projects
- **Use Cases**: Create projects, manage global settings, monitor system health
- **Technical Level**: High

### Project Owners
- **Role**: Full control over specific projects
- **Use Cases**: Manage project settings, invite team members, configure integrations
- **Technical Level**: Medium to High

### Project Administrators
- **Role**: Team and member management within projects
- **Use Cases**: Invite users, assign roles, manage permissions
- **Technical Level**: Medium

### Editors
- **Role**: Data management and CRUD operations
- **Use Cases**: Manage marketplace data, run queries, view schemas
- **Technical Level**: Medium

### Viewers
- **Role**: Read-only access for reporting and monitoring
- **Use Cases**: View data, export reports, monitor metrics
- **Technical Level**: Low to Medium

## 4. Key Features

### 4.1 Multi-Project Management
- Dynamic project registry loaded from database
- Each project represented as Better-Auth organization
- Project-specific database connections with encrypted URLs
- Visual project switcher with icons and colors
- Automatic connection pooling and cleanup

### 4.2 Role-Based Access Control (RBAC)
- **Global Roles**: `super_admin`, `user`
- **Project Roles**: `owner`, `admin`, `editor`, `viewer`
- Permission checking at API and UI levels
- Invitation-based team onboarding
- Role-based UI rendering

### 4.3 Authentication & Security
- Email/password authentication via Better-Auth
- Session management with secure cookies
- Row Level Security (RLS) at database layer
- AES-256-GCM encryption for sensitive data
- SQL injection prevention with parameterized queries

### 4.4 Data Management
- Browse all tables in project database
- TanStack Table with sorting, filtering, pagination
- Virtualized rendering for large datasets (1000+ rows)
- Dynamic form generation from database schema
- Foreign key relationship handling
- Bulk operations (delete, export)
- CSV/JSON export

### 4.5 Schema Exploration
- Interactive ER diagram with React Flow
- Table relationships visualization
- Column details with types and constraints
- Schema statistics (table count, relationship count)
- Search and filter capabilities

### 4.6 SQL Query Interface
- Interactive SQL editor (Monaco Editor planned)
- Query execution against project databases
- Result preview with data table
- Query history persistence (localStorage)
- Error handling and sanitization

### 4.7 Visual Diagram Editor
- Custom node-based diagram builder
- Node types: entity, process, decision, start, end
- Properties panel for node configuration
- Export/import diagram state
- Built with storm-react-diagrams

### 4.8 Team Management
- Member invitation via email
- Pending invitation tracking
- Role assignment and modification
- Member removal with soft delete
- Invitation token security (hashed)

## 5. Technical Requirements

### 5.1 Functional Requirements

**FR-1: Multi-Database Support**
- System must support connecting to multiple PostgreSQL databases
- Each project must maintain isolated data
- Connection pooling must be optimized for serverless
- Encrypted storage of database credentials

**FR-2: Dynamic Project Registration**
- Projects must be loadable from database without code changes
- Project metadata must include: name, slug, icon, color, description
- Project switcher must reflect real-time project list

**FR-3: Permission Enforcement**
- All mutations must check user permissions
- UI must hide unauthorized actions
- API must reject unauthorized requests with 403 status
- Audit logs must track all permission-based actions

**FR-4: Data Integrity**
- Form validation must occur client-side and server-side
- Database constraints must be respected
- Foreign key relationships must be enforced
- Soft deletes must be supported for auditing

**FR-5: Type Safety**
- TypeScript strict mode must be enabled
- Database schema types must be auto-generated
- Zod schemas must validate runtime data
- API responses must use typed wrappers

### 5.2 Non-Functional Requirements

**NFR-1: Performance**
- Initial page load: <3 seconds
- Table rendering (1000 rows): <2 seconds with virtualization
- Server Action response: <500ms for CRUD operations
- Database query timeout: 30 seconds

**NFR-2: Scalability**
- Support 100+ concurrent users per project
- Handle 50+ projects in registry
- Database connection pool: 10-20 connections per project
- Serverless-friendly (stateless, auto-cleanup)

**NFR-3: Security**
- OWASP Top 10 compliance
- AES-256-GCM encryption for sensitive data
- PBKDF2 key derivation for encryption keys
- RLS policies on all multi-tenant tables
- CSRF protection via Better-Auth

**NFR-4: Maintainability**
- Clean Architecture with strict layer separation
- Maximum file size: 500 LOC (refactor if exceeded)
- Test coverage: 80%+ for business logic
- Documentation for all public APIs

**NFR-5: Usability**
- Responsive design (mobile-first)
- Dark mode support
- Loading states for all async operations
- Error messages with actionable guidance
- Keyboard shortcuts for power users

## 6. Architecture Overview

### 6.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                    │
│  Next.js 16 App Router | React Server Components | shadcn/ui│
├─────────────────────────────────────────────────────────────┤
│                      Application Layer                       │
│        Use Cases | Server Actions | Permission Checks        │
├─────────────────────────────────────────────────────────────┤
│                      Infrastructure Layer                    │
│  Repositories | Better-Auth | Email Service | Encryption     │
├─────────────────────────────────────────────────────────────┤
│                         Core Layer                           │
│         Entities | Interfaces | Domain Logic                 │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Technology Stack

**Frontend**
- Next.js 16 (App Router, React Server Components)
- React 19.2
- TypeScript 5.x (strict mode)
- Tailwind CSS v4
- shadcn/ui (New York style)
- TanStack Table v8
- TanStack Query
- TanStack Virtual
- react-hook-form + Zod

**Backend**
- Next.js Server Actions
- Better-Auth (authentication)
- PostgreSQL (multi-database)
- Drizzle ORM
- Node.js 18+

**DevOps**
- Vercel (deployment)
- GitHub (version control)
- pnpm (package manager)

**Libraries**
- Lucide React (icons)
- date-fns (date utilities)
- sonner (toast notifications)
- next-themes (theme switching)
- storm-react-diagrams (diagram editor)

### 6.3 Clean Architecture Layers

**Core Layer** (`src/lib/core/`)
- Domain entities (Project, Member, Invitation)
- Repository interfaces (IProjectRepository, etc.)
- Use cases (CreateProjectUseCase, InviteUserUseCase)
- DI Container (dependency injection)

**Infrastructure Layer** (`src/lib/infrastructure/`)
- Repository implementations (Drizzle ORM)
- External services (email, encryption)
- Database connection management

**Presentation Layer** (`src/app/`, `src/components/`)
- Route handlers (Server Components)
- Client components (forms, tables, dialogs)
- Server Actions (mutations)

## 7. Dependencies & Integrations

### 7.1 Core Dependencies
- `next@16.x` - Framework
- `react@19.2` - UI library
- `typescript@5.x` - Type safety
- `drizzle-orm` - Database ORM
- `better-auth` - Authentication
- `zod` - Validation
- `@tanstack/react-table@8.x` - Data tables
- `@tanstack/react-query` - Client state
- `react-hook-form` - Form management

### 7.2 External Services
- **PostgreSQL**: Multi-database backend (Supabase recommended)
- **Email Service**: Mailpit (dev) / Resend (prod)
- **Vercel**: Hosting and serverless functions

### 7.3 Environment Variables
See `.env.example` for complete list. Critical variables:
- `DATABASE_URL`: Main auth database
- `BETTER_AUTH_SECRET`: Session encryption key
- `BETTER_AUTH_URL`: Application base URL
- `ENCRYPTION_KEY`: Data encryption key
- `{PROJECT}_DATABASE_URL`: Per-project database URLs

## 8. Development Roadmap

### Phase 1: Foundation (Complete)
- ✅ Multi-project architecture
- ✅ Better-Auth integration
- ✅ RBAC implementation
- ✅ Data browser with CRUD
- ✅ Schema visualization
- ✅ SQL query runner

### Phase 2: Enhancement (In Progress)
- 🔄 Advanced query builder UI
- 🔄 Real-time collaboration
- 🔄 API documentation generator
- 🔄 Audit log viewer
- 🔄 Performance monitoring

### Phase 3: Advanced Features (Planned)
- ⏳ GraphQL API integration
- ⏳ Webhooks management
- ⏳ Custom dashboard widgets
- ⏳ Data import/export pipelines
- ⏳ Automated testing suite

### Phase 4: Enterprise (Future)
- 📋 SSO integration (SAML, OAuth)
- 📋 Advanced analytics
- 📋 White-labeling support
- 📋 Multi-region deployment
- 📋 Compliance certifications

## 9. Success Metrics

### Technical Metrics
- **Uptime**: 99.9% availability
- **Response Time**: P95 < 1 second
- **Error Rate**: < 0.1% of requests
- **Test Coverage**: > 80%

### Business Metrics
- **User Adoption**: 100+ active users per month
- **Project Growth**: 10+ new projects per quarter
- **User Satisfaction**: NPS > 40
- **Time to Onboard**: < 15 minutes for new projects

## 10. Constraints & Assumptions

### Constraints
- Must use PostgreSQL (no NoSQL support)
- Serverless deployment (stateless architecture)
- Maximum 800 LOC per documentation file
- TypeScript strict mode required
- Must support latest 2 major browser versions

### Assumptions
- Users have basic SQL knowledge
- Projects use relational data models
- PostgreSQL version 13+ available
- Stable internet connection required
- English-only interface (i18n planned)

## 11. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database connection pool exhaustion | High | Medium | Implement connection limits, monitoring, auto-scaling |
| Permission bypass vulnerability | Critical | Low | Comprehensive permission tests, security audits |
| Data encryption key compromise | Critical | Low | Key rotation, secure storage, access logging |
| Multi-database query performance | Medium | High | Query optimization, caching, pagination |
| Better-Auth breaking changes | Medium | Low | Version pinning, migration guides, testing |

## 12. Compliance & Security

### Data Protection
- GDPR-ready (data export, deletion, consent)
- User data encrypted at rest and in transit
- PII handling with strict access controls

### Security Practices
- Regular dependency updates (Dependabot)
- Security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting on authentication endpoints
- Audit logging for sensitive operations

## 13. References

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Better-Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [OWASP Top 10](https://owasp.org/Top10/)

---

**Document Owner**: Development Team
**Review Cycle**: Monthly
**Next Review**: 2026-02-07
