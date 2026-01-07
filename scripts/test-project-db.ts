/**
 * Test Project Database Connection Script
 * Simulates admin dashboard connecting to managed project databases
 * Run: npx tsx scripts/test-project-db.ts
 */

import 'dotenv/config'
import postgres from 'postgres'

// Project database URLs (from actual projects)
const PROJECT_DATABASES = {
  'zuno-abis': 'postgresql://neondb_owner:npg_4jXb6CxEAIyv@ep-autumn-pine-adoverva-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
}

async function testProjectDatabase(projectName: string, dbUrl: string) {
  console.log(`\n📁 Testing: ${projectName}`)
  console.log('   URL:', dbUrl.replace(/:[^:@]+@/, ':***@'))

  try {
    const sql = postgres(dbUrl, { 
      max: 1,
      connect_timeout: 10,
      idle_timeout: 5,
    })

    // Test connection
    const [info] = await sql`SELECT NOW() as time, current_database() as db`
    console.log('   ✅ Connected! DB:', info.db)

    // Get tables
    const tables = await sql`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    console.log(`   📋 Tables (${tables.length}):`)
    for (const t of tables) {
      // Get row count
      const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM "${t.table_name}"`)
      console.log(`      - ${t.table_name} (${t.columns} cols, ${countResult[0].count} rows)`)
    }

    // Test schema introspection (like admin dashboard does)
    console.log('\n   🔍 Schema Introspection Test:')
    
    if (tables.length > 0) {
      const sampleTable = tables[0].table_name
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = ${sampleTable}
        ORDER BY ordinal_position
        LIMIT 5
      `
      
      console.log(`      Table "${sampleTable}" columns:`)
      columns.forEach(c => {
        console.log(`        - ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`)
      })
    }

    // Test foreign keys
    const fks = await sql`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      LIMIT 5
    `
    
    if (fks.length > 0) {
      console.log(`\n   🔗 Foreign Keys (${fks.length}):`)
      fks.forEach(fk => {
        console.log(`      - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table}.${fk.foreign_column}`)
      })
    }

    await sql.end()
    return true

  } catch (error) {
    console.log('   ❌ Failed:', (error as Error).message)
    return false
  }
}

async function main() {
  console.log('🔌 Testing Project Database Connections')
  console.log('=' .repeat(50))

  let passed = 0
  let failed = 0

  for (const [name, url] of Object.entries(PROJECT_DATABASES)) {
    const success = await testProjectDatabase(name, url)
    if (success) passed++
    else failed++
  }

  console.log('\n' + '='.repeat(50))
  console.log(`📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    process.exit(1)
  }
  console.log('✅ All project database tests passed!')
}

main()
