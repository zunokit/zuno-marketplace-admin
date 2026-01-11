# Phase 01: Implement Health Check Endpoint

**Context Links:**
- [Plan Overview](./plan.md)
- [keepalive.yml](../../../.github/workflows/keepalive.yml)
- [API Response Utilities](../../../src/lib/utils/api-response.ts)
- [Database Connection](../../../src/lib/db/index.ts)

## Overview

**Priority:** P2
**Status:** Pending
**Effort:** 1h

Create `/api/health` route handler that checks database connectivity and returns health status for GitHub Actions keepalive workflow.

## Key Insights

**From keepalive.yml analysis:**
- Line 24-47: Health check expects HTTP 200 + JSON with `status` field
- Line 33: Uses `jq -r '.status // "unknown"'` to extract status
- Line 36: Success = HTTP 200 AND status != "unhealthy"
- Line 25: 30s max timeout for entire curl request

**From codebase analysis:**
- `src/lib/db/index.ts` exports `db` instance (Drizzle ORM)
- `src/lib/utils/api-response.ts` provides response helpers
- Existing API pattern: `src/app/api/auth/[...all]/route.ts` uses named exports

## Requirements

### Functional Requirements

1. **HTTP Endpoint:** GET `/api/health`
2. **Database Check:** Verify admin database connectivity
3. **Response Format:** `{ status: "healthy" }` or `{ status: "unhealthy" }`
4. **Error Handling:** Never crash, return unhealthy on errors
5. **Performance:** Complete in < 5s (well within 30s workflow timeout)

### Non-Functional Requirements

- No authentication required (public endpoint)
- No logging (minimal output for workflow)
- Type-safe (TypeScript strict mode)
- Follow existing codebase patterns

## Architecture

```
GitHub Actions (keepalive.yml)
    ↓
HTTP GET /api/health (30s timeout)
    ↓
Next.js Route Handler (route.ts)
    ↓
Database Check (db.select().execute())
    ↓
JSON Response: { status: "healthy" | "unhealthy" }
```

## Related Code Files

**Create:**
- `src/app/api/health/route.ts` - Health check route handler

**Use (existing, no changes):**
- `src/lib/db/index.ts` - Database connection (exports `db`)
- `src/lib/utils/api-response.ts` - Response utilities

## Implementation Steps

### Step 1: Create Route Handler

**File:** `src/app/api/health/route.ts`

**Requirements:**
1. Export named `GET` function (Next.js App Router pattern)
2. Import `db` from `@/lib/db`
3. Execute simple database query (`SELECT 1`)
4. Set 5s timeout on database query
5. Return JSON response with `status` field

**Implementation:**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Simple database connectivity check with timeout
    const result = await Promise.race([
      db.execute('SELECT 1'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]) as { rows: unknown[] }

    // If we get here, database is responsive
    return NextResponse.json({ status: 'healthy' }, { status: 200 })
  } catch (error) {
    // Any error = unhealthy (never crash)
    return NextResponse.json({ status: 'unhealthy' }, { status: 200 })
  }
}
```

**Design Rationale:**
- **Promise.race with timeout:** Ensures 5s max execution time
- **Return HTTP 200 for both healthy/unhealthy:** Workflow checks status field, not HTTP code
- **Try-catch entire function:** Never throws, always returns response
- **Simple SELECT 1:** Minimal database load
- **Type assertion:** `as { rows: unknown[] }` satisfies TypeScript

**Alternative Approaches Considered:**

1. **Use api-response utilities (successResponse/errorResponse)**
   - ❌ Rejected: Returns standard `{ data, message }` format
   - ❌ keepalive.yml expects `{ status }` field specifically
   - ❌ errorResponse returns 500 status, workflow expects 200

2. **Return 503 for unhealthy**
   - ❌ Rejected: Line 36 checks `http_code = "200"` explicitly
   - ❌ Would cause workflow to fail even if service is degraded but functional

3. **Add more health checks (disk, memory, etc.)**
   - ❌ Rejected: YAGNI principle
   - ❌ Workflow only cares if service is alive, not detailed metrics

## Todo List

- [ ] Create `src/app/api/health/route.ts`
- [ ] Implement GET handler with database check
- [ ] Add 5s timeout to database query
- [ ] Test endpoint locally: `curl http://localhost:3000/api/health`
- [ ] Run `pnpm typecheck` and fix any errors
- [ ] Run `pnpm lint` and fix any issues
- [ ] Run `pnpm build` and verify success
- [ ] Test with database down (unhealthy response)
- [ ] Commit changes

## Success Criteria

**Definition of Done:**
- ✅ `GET /api/health` returns `{ status: "healthy" }` when DB is up
- ✅ `GET /api/health` returns `{ status: "unhealthy" }` when DB is down
- ✅ Response time < 5s
- ✅ TypeScript strict mode passes
- ✅ ESLint passes
- ✅ Production build succeeds
- ✅ No uncaught errors

**Validation Methods:**
- Manual testing with curl
- Check workflow logs after next scheduled run (6 AM/PM UTC)
- Monitor for workflow failures

## Risk Assessment

**Potential Issues:**

1. **Database connection pool exhaustion**
   - **Risk:** Low (keepalive runs 2x daily, minimal query)
   - **Mitigation:** Simple SELECT 1, no complex queries

2. **Timeout too aggressive (5s)**
   - **Risk:** Low (workflow allows 30s, 5s is generous for local DB)
   - **Mitigation:** Can increase timeout if needed in production

3. **Response format mismatch with workflow**
   - **Risk:** None (verified against keepalive.yml requirements)
   - **Mitigation:** Tested against workflow's jq parsing

## Security Considerations

**Authentication:**
- ❌ None required (public endpoint)
- ✅ Only returns "healthy"/"unhealthy" (no sensitive data)
- ✅ No database schema exposure (SELECT 1 only)

**Rate Limiting:**
- Not required (minimal endpoint, low overhead)
- Can add later if abused (IP-based rate limit)

**Input Validation:**
- Not applicable (GET endpoint, no input parameters)

## Next Steps

**Immediate:**
1. Create route handler
2. Test locally
3. Run typecheck/lint/build
4. Commit and deploy

**Future Enhancements (if needed):**
1. Add project database checks (multi-project health)
2. Add more health metrics (disk, memory, uptime)
3. Add rate limiting if endpoint is abused
4. Create monitoring dashboard

**Dependencies:**
- None (self-contained endpoint)

**Unresolved Questions:**
- None (requirements clear from workflow)
