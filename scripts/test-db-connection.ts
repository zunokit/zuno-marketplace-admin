/**
 * Test Database Connection Script
 * Run: npx tsx scripts/test-db-connection.ts
 */

import 'dotenv/config'
import postgres from 'postgres'

async function testConnection() {
  console.log('🔌 Testing Database Connection...\n')

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment')
    process.exit(1)
  }

  console.log('📍 Connecting to:', dbUrl.replace(/:[^:@]+@/, ':***@'))

  try {
    const sql = postgres(dbUrl, { max: 1 })

    // Test basic query
    const result = await sql`SELECT NOW() as current_time, current_database() as db_name`
    console.log('✅ Connection successful!')
    console.log('   Time:', result[0].current_time)
    console.log('   Database:', result[0].db_name)

    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    console.log('\n📋 Tables in database:')
    tables.forEach((t, i) => console.log(`   ${i + 1}. ${t.table_name}`))

    // Check users count
    const users = await sql`SELECT COUNT(*) as count FROM "user"`
    console.log('\n👥 Users count:', users[0].count)

    // Check organizations/projects count
    const orgs = await sql`SELECT COUNT(*) as count FROM "organization"`
    console.log('📁 Projects count:', orgs[0].count)

    // Check members count
    const members = await sql`SELECT COUNT(*) as count FROM "member"`
    console.log('👤 Members count:', members[0].count)

    await sql.end()
    console.log('\n✅ All connection tests passed!')

  } catch (error) {
    console.error('❌ Connection failed:', error)
    process.exit(1)
  }
}

testConnection()
