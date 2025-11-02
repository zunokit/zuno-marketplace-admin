#!/usr/bin/env tsx

/**
 * Project Migration Script
 * Migrates hardcoded projects from PROJECTS_REGISTRY to the database
 * This should be run once during the migration from hardcoded to dynamic configuration
 */

import { db } from '../src/lib/db'
import { organization, projectEnvironment } from '../src/lib/db/schemas/auth.schema'
import { ProjectRegistryService } from '../src/lib/services/project-registry.service'
import { encrypt, generateSecureId } from '../src/lib/crypto/encryption'
// Legacy project registry for migration (hardcoded since we removed it from config)
const LEGACY_PROJECTS = {
  abis: {
    id: 'abis',
    name: '@zuno-marketplace-abis',
    slug: 'zuno-abis',
    databaseUrl: process.env.ABIS_DATABASE_URL,
    description: 'Zuno Marketplace ABIs - Smart contract ABI management',
    metadata: {
      icon: '📋',
      color: '#3b82f6',
      features: ['ABI Management', 'Contract Registry', 'Version Control'],
    },
  },
  metadata: {
    id: 'metadata',
    name: '@zuno-marketplace-metadata',
    slug: 'zuno-metadata',
    databaseUrl: process.env.METADATA_DATABASE_URL,
    description: 'Zuno Marketplace Metadata - NFT and token metadata service',
    metadata: {
      icon: '🏷️',
      color: '#8b5cf6',
      features: ['Metadata Storage', 'IPFS Integration', 'Token Standards'],
    },
  },
} as const

interface MigrationResult {
  success: boolean
  migratedProjects: string[]
  errors: string[]
  summary: {
    totalProjects: number
    migratedCount: number
    errorCount: number
  }
}

/**
 * Main migration function
 */
async function migrateProjects(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedProjects: [],
    errors: [],
    summary: {
      totalProjects: Object.keys(LEGACY_PROJECTS).length,
      migratedCount: 0,
      errorCount: 0,
    },
  }

  console.log('🚀 Starting project migration...')
  console.log(`Found ${result.summary.totalProjects} projects to migrate`)

  try {
    // Check if projects already exist in database
    const existingProjects = await db.select().from(organization)
    const existingSlugs = new Set(existingProjects.map(p => p.slug))

    console.log(`Found ${existingProjects.length} existing projects in database`)

    // Migrate each project
    for (const [key, project] of Object.entries(LEGACY_PROJECTS)) {
      try {
        console.log(`\n📦 Migrating project: ${project.name} (${project.slug})`)

        // Check if project already exists
        if (existingSlugs.has(project.slug)) {
          console.log(`⚠️  Project with slug '${project.slug}' already exists, skipping...`)
          continue
        }

        const projectId = generateSecureId()

        // Prepare project data
        const projectData = {
          id: projectId,
          name: project.name,
          slug: project.slug,
          description: project.description,
          projectType: key, // Use the registry key as project type
          databaseUrl: project.databaseUrl ? encrypt(project.databaseUrl) : null,
          status: 'active' as const,
          icon: project.metadata?.icon,
          color: project.metadata?.color,
          metadataJson: project.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Insert project
        await db.insert(organization).values(projectData)

        // Create default environments if database URL is provided
        if (project.databaseUrl) {
          console.log(`  🌍 Creating default environment for ${project.name}`)

          const encryptedDbUrl = encrypt(project.databaseUrl)
          const environmentId = generateSecureId()

          const environmentData = {
            id: environmentId,
            organizationId: projectId,
            name: 'Production',
            slug: 'prod',
            databaseUrl: encryptedDbUrl,
            description: 'Production environment',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          await db.insert(projectEnvironment).values(environmentData)
        }

        result.migratedProjects.push(project.slug)
        result.summary.migratedCount++
        console.log(`✅ Successfully migrated project: ${project.name}`)

      } catch (error) {
        const errorMessage = `Failed to migrate project ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`❌ ${errorMessage}`)
        result.errors.push(errorMessage)
        result.summary.errorCount++
        result.success = false
      }
    }

    // Revalidate cache after migration
    ProjectRegistryService.revalidateRegistry()

    console.log('\n🎉 Migration completed!')
    console.log(`Summary:`)
    console.log(`  Total projects: ${result.summary.totalProjects}`)
    console.log(`  Migrated: ${result.summary.migratedCount}`)
    console.log(`  Errors: ${result.summary.errorCount}`)

    if (result.migratedProjects.length > 0) {
      console.log(`\n✅ Migrated projects: ${result.migratedProjects.join(', ')}`)
    }

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      result.errors.forEach(error => console.log(`  - ${error}`))
    }

  } catch (error) {
    const errorMessage = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error(`💥 ${errorMessage}`)
    result.errors.push(errorMessage)
    result.success = false
  }

  return result
}

/**
 * Verify migration by checking database
 */
async function verifyMigration(): Promise<void> {
  console.log('\n🔍 Verifying migration...')

  try {
    const projects = await db.select().from(organization)
    const environments = await db.select().from(projectEnvironment)

    console.log(`✅ Found ${projects.length} projects in database`)
    console.log(`✅ Found ${environments.length} environments in database`)

    // Check if all legacy projects exist in database
    const dbSlugs = new Set(projects.map(p => p.slug))
    const legacySlugs = Object.values(LEGACY_PROJECTS).map(p => p.slug)
    const missingProjects = legacySlugs.filter(slug => !dbSlugs.has(slug))

    if (missingProjects.length > 0) {
      console.log(`⚠️  Missing projects in database: ${missingProjects.join(', ')}`)
    } else {
      console.log('✅ All legacy projects found in database')
    }

    // Display project summary
    console.log('\n📊 Project Summary:')
    projects.forEach(project => {
      const envCount = environments.filter(env => env.organizationId === project.id).length
      console.log(`  - ${project.name} (${project.slug}): ${envCount} environments`)
    })

  } catch (error) {
    console.error(`❌ Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🗂️  Project Migration Script')
  console.log('==============================\n')

  try {
    // Run migration
    const result = await migrateProjects()

    // Verify migration
    await verifyMigration()

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1)

  } catch (error) {
    console.error(`💥 Script execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }
}

// Run script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}

export { migrateProjects, verifyMigration }