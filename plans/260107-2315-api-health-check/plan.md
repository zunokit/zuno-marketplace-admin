---
title: "API Health Check Endpoint"
description: "Create /api/health endpoint for GitHub Actions keepalive workflow"
status: pending
priority: P2
effort: 1h
issue: null
branch: develop-claude
tags: [api, infra, monitoring]
created: 2026-01-07
---

# API Health Check Endpoint

## Overview

Create `/api/health` route handler to support GitHub Actions keepalive workflow (`.github/workflows/keepalive.yml`). Endpoint must return HTTP 200 with JSON `{ status: "healthy" }` and verify database connectivity.

## Requirements

**From keepalive.yml:**
- HTTP 200 status code required
- JSON response with `status` field
- Status must NOT be "unhealthy" for success
- Response parsed via `jq -r '.status // "unknown"'`
- 30s timeout, 3 retries with 30s delay

**Functional:**
- Check admin database connectivity
- Return minimal response: `{ status: "healthy" | "unhealthy" }`
- Handle all errors gracefully (never crash)
- Fast execution (< 5s target)

**Non-Functional:**
- Public endpoint (no auth)
- No logging overhead
- Production-ready error handling
- Follow existing API patterns

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Implement Health Check | Pending | 1h | [phase-01](./phase-01-implementation.md) |

## Dependencies

- **Existing:**
  - `src/lib/db/index.ts` - Database connection
  - `src/lib/utils/api-response.ts` - Response utilities

- **Environment:**
  - `DATABASE_URL` - Admin database connection string

## Key Design Decisions

**Response Format:**
- Minimal JSON: `{ status: "healthy" }` or `{ status: "unhealthy" }`
- HTTP 200 for both healthy/unhealthy (workflow checks status field)
- No extra fields (YAGNI principle)

**Database Check:**
- Simple `SELECT 1` query
- 5s timeout to stay within workflow 30s limit
- Any error = unhealthy status

**Error Handling:**
- Never throw - catch all errors
- Return unhealthy on any failure
- No console.log (minimal output)

## Related Files

**Create:**
- `src/app/api/health/route.ts` - Health check GET handler

**Use (no changes):**
- `src/lib/db/index.ts` - Database connection
- `src/lib/utils/api-response.ts` - Response helpers

## Success Criteria

- ✅ Endpoint returns HTTP 200 with valid JSON
- ✅ Database check executes successfully when DB is available
- ✅ Returns "unhealthy" when DB is unavailable
- ✅ No uncaught errors or crashes
- ✅ Response time < 5s
- ✅ `pnpm typecheck` passes
- ✅ `pnpm lint` passes
- ✅ `pnpm build` passes
