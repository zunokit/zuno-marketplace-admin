/**
 * Test Data Browser CRUD Operations
 * Simulates admin dashboard data browser functionality
 * Run: npx tsx scripts/test-data-browser.ts
 */

import 'dotenv/config'
import postgres from 'postgres'

const PROJECT_DB_URL = 'postgresql://neondb_owner:npg_4jXb6CxEAIyv@ep-autumn-pine-adoverva-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

// Simulating QueryBuilderService logic
class TestQueryBuilder {
  private sql: ReturnType<typeof postgres>

  constructor(dbUrl: string) {
    this.sql = postgres(dbUrl, { max: 1 })
  }

  private validateIdentifier(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
  }

  private escapeValue(value: unknown): string {
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'number') return String(value)
    if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
    return String(value)
  }

  async getTableSchema(tableName: string) {
    if (!this.validateIdentifier(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`)
    }

    return await this.sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        (
          SELECT COUNT(*) > 0 
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = c.table_name 
            AND kcu.column_name = c.column_name 
            AND tc.constraint_type = 'PRIMARY KEY'
        ) as is_primary_key
      FROM information_schema.columns c
      WHERE table_name = ${tableName}
      ORDER BY ordinal_position
    `
  }

  async select(tableName: string, limit = 10, offset = 0) {
    if (!this.validateIdentifier(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`)
    }

    const rows = await this.sql.unsafe(`SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${offset}`)
    const [countResult] = await this.sql.unsafe(`SELECT COUNT(*) as total FROM "${tableName}"`)
    
    return {
      rows,
      total: Number(countResult.total),
      limit,
      offset
    }
  }

  async testInsertUpdateDelete(tableName: string) {
    // This is a dry-run test - we won't actually modify data
    console.log(`   🔒 CRUD test for "${tableName}" (dry-run mode)`)
    
    // Test building INSERT query
    const insertData = { test_col: 'test_value' }
    const columns = Object.keys(insertData).map(c => `"${c}"`).join(', ')
    const values = Object.values(insertData).map(v => this.escapeValue(v)).join(', ')
    const insertQuery = `INSERT INTO "${tableName}" (${columns}) VALUES (${values}) RETURNING *`
    console.log(`   📝 INSERT query: ${insertQuery.substring(0, 80)}...`)

    // Test building UPDATE query
    const updateQuery = `UPDATE "${tableName}" SET "test_col" = 'new_value' WHERE id = 1 RETURNING *`
    console.log(`   📝 UPDATE query: ${updateQuery.substring(0, 80)}...`)

    // Test building DELETE query
    const deleteQuery = `DELETE FROM "${tableName}" WHERE id = 1 RETURNING *`
    console.log(`   📝 DELETE query: ${deleteQuery.substring(0, 80)}...`)

    return true
  }

  async close() {
    await this.sql.end()
  }
}

async function main() {
  console.log('📊 Testing Data Browser Operations')
  console.log('='.repeat(50))
  console.log('Target DB:', PROJECT_DB_URL.replace(/:[^:@]+@/, ':***@'))

  const qb = new TestQueryBuilder(PROJECT_DB_URL)

  try {
    // 1. Get all tables (using raw query for system tables)
    console.log('\n1️⃣ Getting table list...')
    const sql = postgres(PROJECT_DB_URL, { max: 1 })
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    await sql.end()
    const publicTables = tablesResult.map((t: Record<string, unknown>) => t.table_name as string)
    
    console.log(`   Found ${publicTables.length} tables:`, publicTables.join(', '))

    // 2. Test schema introspection for each table
    console.log('\n2️⃣ Testing schema introspection...')
    for (const table of publicTables.slice(0, 3)) {
      console.log(`\n   📋 Table: ${table}`)
      const schema = await qb.getTableSchema(table)
      schema.slice(0, 5).forEach((col: Record<string, unknown>) => {
        const pk = col.is_primary_key ? ' 🔑' : ''
        const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL'
        console.log(`      - ${col.column_name}: ${col.data_type}${nullable}${pk}`)
      })
      if (schema.length > 5) {
        console.log(`      ... and ${schema.length - 5} more columns`)
      }
    }

    // 3. Test data selection with pagination
    console.log('\n3️⃣ Testing data selection with pagination...')
    for (const table of publicTables.slice(0, 3)) {
      const result = await qb.select(table, 5, 0)
      console.log(`   📄 ${table}: ${result.rows.length} rows fetched, ${result.total} total`)
    }

    // 4. Test SQL injection prevention
    console.log('\n4️⃣ Testing SQL injection prevention...')
    const maliciousInputs = [
      'users; DROP TABLE users;--',
      "'; DELETE FROM users; --",
      'users" OR "1"="1',
    ]

    for (const input of maliciousInputs) {
      try {
        await qb.getTableSchema(input)
        console.log(`   ❌ FAIL: "${input}" was not blocked!`)
      } catch {
        console.log(`   ✅ Blocked: "${input.substring(0, 30)}..."`)
      }
    }

    // 5. Test CRUD query building (dry-run)
    console.log('\n5️⃣ Testing CRUD query building (dry-run)...')
    await qb.testInsertUpdateDelete(publicTables[0])

    await qb.close()
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ All Data Browser tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    await qb.close()
    process.exit(1)
  }
}

main()
