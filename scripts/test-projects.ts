/**
 * Test Projects CRUD Script
 * Run: npx tsx scripts/test-projects.ts
 */

import 'dotenv/config'
import postgres from 'postgres'
import { encrypt, decrypt, generateSecureId } from '../src/lib/crypto'

async function testProjects() {
  console.log('📁 Testing Projects CRUD...\n')

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found')
    process.exit(1)
  }

  const sql = postgres(dbUrl, { max: 1 })

  try {
    // 1. List existing projects
    console.log('📋 Existing projects:')
    const existingProjects = await sql`
      SELECT id, name, slug, status, created_at 
      FROM organization 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    if (existingProjects.length === 0) {
      console.log('   (No projects found)')
    } else {
      existingProjects.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} (${p.slug}) - ${p.status}`)
      })
    }

    // 2. Test create project
    console.log('\n🆕 Creating test project...')
    const testProjectId = generateSecureId()
    const testSlug = `test-project-${Date.now()}`
    const testDbUrl = encrypt('postgresql://test:test@localhost:5432/testdb')

    await sql`
      INSERT INTO organization (id, name, slug, database_url, status, created_at, updated_at)
      VALUES (${testProjectId}, ${'Test Project'}, ${testSlug}, ${testDbUrl}, ${'active'}, NOW(), NOW())
    `
    console.log('   ✅ Project created:', testProjectId)

    // 3. Test read project
    console.log('\n📖 Reading project...')
    const [readProject] = await sql`
      SELECT * FROM organization WHERE id = ${testProjectId}
    `
    
    if (readProject) {
      console.log('   ✅ Project found:', readProject.name)
      
      // Decrypt database URL
      const decryptedUrl = decrypt(readProject.database_url)
      console.log('   ✅ Database URL decrypted:', decryptedUrl)
    } else {
      console.log('   ❌ Project not found')
    }

    // 4. Test update project
    console.log('\n✏️ Updating project...')
    await sql`
      UPDATE organization 
      SET name = ${'Test Project Updated'}, updated_at = NOW()
      WHERE id = ${testProjectId}
    `
    
    const [updatedProject] = await sql`
      SELECT name FROM organization WHERE id = ${testProjectId}
    `
    console.log('   ✅ Updated name:', updatedProject.name)

    // 5. Test slug uniqueness check
    console.log('\n🔍 Testing slug uniqueness...')
    const [slugCheck] = await sql`
      SELECT COUNT(*) as count 
      FROM organization 
      WHERE slug = ${testSlug} AND deleted_at IS NULL
    `
    console.log('   ✅ Slug exists check:', slugCheck.count > 0 ? 'Found' : 'Not found')

    // 6. Test soft delete
    console.log('\n🗑️ Soft deleting project...')
    await sql`
      UPDATE organization 
      SET deleted_at = NOW(), deleted_by = ${'test-script'}
      WHERE id = ${testProjectId}
    `
    
    const [deletedCheck] = await sql`
      SELECT deleted_at FROM organization WHERE id = ${testProjectId}
    `
    console.log('   ✅ Soft deleted at:', deletedCheck.deleted_at)

    // 7. Cleanup - hard delete test project
    console.log('\n🧹 Cleaning up test project...')
    await sql`DELETE FROM organization WHERE id = ${testProjectId}`
    console.log('   ✅ Test project removed')

    await sql.end()
    console.log('\n✅ All project tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    await sql.end()
    process.exit(1)
  }
}

testProjects()
