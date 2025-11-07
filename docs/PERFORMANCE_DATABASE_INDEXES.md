# Database Indexes Optimization

## Overview

This document describes the database indexes added to improve query performance across the Zuno Marketplace Admin application.

## Changes Summary

Added comprehensive indexes to authentication and verification tables that were previously missing critical performance indexes.

## New Indexes

### Session Table

**Purpose**: Optimize authentication session lookups and cleanup operations

- `session_user_id_idx` - Index on `user_id` for fast user session lookups
- `session_token_idx` - Index on `token` for session authentication
- `session_expires_at_idx` - Index on `expires_at` for expired session cleanup
- `session_user_expires_idx` - Composite index on `(user_id, expires_at)` for user-specific session management
- `session_active_org_idx` - Index on `active_organization_id` for organization switching
- `session_created_at_idx` - Index on `created_at` for session history queries

**Impact**: Significantly faster authentication checks, session lookups, and cleanup operations

### Account Table

**Purpose**: Optimize OAuth provider and account credential lookups

- `account_user_id_idx` - Index on `user_id` for user account lookups
- `account_provider_id_idx` - Index on `provider_id` for provider-specific queries
- `account_account_id_idx` - Index on `account_id` for account identification
- `account_user_provider_idx` - Composite index on `(user_id, provider_id)` for user-provider lookups
- `account_access_token_expires_idx` - Index on `access_token_expires_at` for token refresh
- `account_refresh_token_expires_idx` - Index on `refresh_token_expires_at` for token cleanup

**Impact**: Faster OAuth authentication, account lookups, and token refresh operations

### Verification Table

**Purpose**: Optimize email verification and password reset token lookups

- `verification_identifier_idx` - Index on `identifier` for verification lookups
- `verification_value_idx` - Index on `value` for token validation
- `verification_expires_at_idx` - Index on `expires_at` for expired verification cleanup
- `verification_identifier_expires_idx` - Composite index on `(identifier, expires_at)` for active verification lookups
- `verification_created_at_idx` - Index on `created_at` for verification history

**Impact**: Faster email verification, password reset, and verification token cleanup

## Performance Benefits

### Before

- Session lookups: Full table scan on user_id
- Token validation: Full table scan on token column
- Account queries: Full table scan on provider_id
- Verification lookups: Full table scan on identifier

### After

- Session lookups: O(log n) index lookup
- Token validation: O(log n) index lookup
- Account queries: O(log n) index lookup
- Verification lookups: O(log n) index lookup

### Expected Improvements

- **Authentication Speed**: 10-100x faster depending on table size
- **Session Management**: 50-500x faster for cleanup operations
- **Token Validation**: 10-100x faster for email verification and password reset
- **Multi-tenant Operations**: Composite indexes enable efficient filtered queries

## Migration

The migration file `0001_grey_ogun.sql` contains all index creation statements.

To apply the migration:

```bash
pnpm db:push
```

Or manually run the migration:

```bash
pnpm db:migrate
```

## Index Strategy

### Single Column Indexes

Used when queries filter or sort by a single column:
- Fast lookups by ID or unique identifier
- Efficient sorting operations
- Good for simple WHERE clauses

### Composite Indexes

Used when queries filter by multiple columns together:
- Optimizes multi-column WHERE clauses
- Enables index-only scans
- Critical for multi-tenant queries (org_id + other_column)

### Index Order

For composite indexes, column order matters:
- Most selective column first (usually foreign keys)
- Columns used in equality checks before range checks
- Enables partial index usage for left-most columns

## Monitoring

### Query Performance

Monitor these queries for performance improvements:

```sql
-- Session lookup by user
SELECT * FROM session WHERE user_id = $1 AND expires_at > NOW();

-- Token validation
SELECT * FROM verification WHERE identifier = $1 AND expires_at > NOW();

-- Account provider lookup
SELECT * FROM account WHERE user_id = $1 AND provider_id = $2;

-- Active session count
SELECT COUNT(*) FROM session WHERE user_id = $1 AND expires_at > NOW();
```

### Index Usage

Check index usage with:

```sql
-- PostgreSQL index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('session', 'account', 'verification')
ORDER BY idx_scan DESC;
```

## Maintenance

### Index Size

Monitor index sizes to ensure they don't grow excessively:

```sql
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename IN ('session', 'account', 'verification')
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Unused Indexes

Periodically check for unused indexes:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
  AND tablename IN ('session', 'account', 'verification');
```

## Future Considerations

### Additional Optimizations

1. **Partial Indexes**: Consider partial indexes for frequently queried subsets
   ```sql
   CREATE INDEX active_sessions_idx ON session (user_id) WHERE expires_at > NOW();
   ```

2. **Index-Only Scans**: Add INCLUDE columns for covering indexes
   ```sql
   CREATE INDEX session_lookup_idx ON session (user_id, expires_at) INCLUDE (token);
   ```

3. **Database Connection Pooling**: Combine indexes with connection pooling (PgBouncer)

4. **Query Optimization**: Use EXPLAIN ANALYZE to identify slow queries

## Related Files

- Schema definitions: `src/lib/infrastructure/database/schemas/user.schema.ts`
- Migration file: `src/lib/db/migrations/0001_grey_ogun.sql`
- Database configuration: `src/lib/db/index.ts`

## References

- [PostgreSQL Indexes Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Drizzle ORM Indexes](https://orm.drizzle.team/docs/indexes-constraints)
- [Index Tuning Best Practices](https://www.postgresql.org/docs/current/indexes-examine.html)
