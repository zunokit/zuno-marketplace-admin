import { db } from '@/lib/db'
import { organization, projectEnvironment } from '@/lib/db/schemas/auth.schema'
import { encrypt } from '@/lib/crypto/encryption'
import { eq } from 'drizzle-orm'

/**
 * Migration script to populate initial projects from hardcoded PROJECTS_REGISTRY
 * This script should be run once to migrate the hardcoded projects to the database
 */
async function migrateProjects() {
  try {
    console.log('Starting project migration...')

    // Define the hardcoded projects that need to be migrated
    const hardcodedProjects = [
      {
        id: 'abis',
        name: '@zuno-marketplace-abis',
        slug: 'zuno-abis',
        databaseUrl: process.env.ABIS_DATABASE_URL || null,
        description: 'Zuno Marketplace ABIs - Smart contract ABI management',
        metadata: {
          icon: '📋',
          color: '#3b82f6',
          features: ['ABI Management', 'Contract Registry', 'Version Control'],
          projectType: 'abis',
        },
        projectType: 'abis',
        icon: '📋',
        color: '#3b82f6',
        status: 'active' as const,
      },
      {
        id: 'metadata',
        name: '@zuno-marketplace-metadata',
        slug: 'zuno-metadata',
        databaseUrl: process.env.METADATA_DATABASE_URL || null,
        description: 'Zuno Marketplace Metadata - NFT and token metadata service',
        metadata: {
          icon: '🏷️',
          color: '#8b5cf6',
          features: ['Metadata Storage', 'IPFS Integration', 'Token Standards'],
          projectType: 'metadata',
        },
        projectType: 'metadata',
        icon: '🏷️',
        color: '#8b5cf6',
        status: 'active' as const,
      },
    ]

    // Default environments for each project
    const defaultEnvironments = [
      // ABIS Project Environments
      {
        organizationId: 'abis',
        name: 'Development',
        slug: 'dev',
        databaseUrl: process.env.ABIS_DEV_DATABASE_URL || process.env.ABIS_DATABASE_URL || '',
        description: 'Development environment for ABIS project',
        isActive: true,
      },
      {
        organizationId: 'abis',
        name: 'Staging',
        slug: 'staging',
        databaseUrl: process.env.ABIS_STAGING_DATABASE_URL || '',
        description: 'Staging environment for ABIS project',
        isActive: true,
      },
      {
        organizationId: 'abis',
        name: 'Production',
        slug: 'prod',
        databaseUrl: process.env.ABIS_PROD_DATABASE_URL || '',
        description: 'Production environment for ABIS project',
        isActive: false, // Default to false for production
      },
      // Metadata Project Environments
      {
        organizationId: 'metadata',
        name: 'Development',
        slug: 'dev',
        databaseUrl: process.env.METADATA_DEV_DATABASE_URL || process.env.METADATA_DATABASE_URL || '',
        description: 'Development environment for Metadata project',
        isActive: true,
      },
      {
        organizationId: 'metadata',
        name: 'Staging',
        slug: 'staging',
        databaseUrl: process.env.METADATA_STAGING_DATABASE_URL || '',
        description: 'Staging environment for Metadata project',
        isActive: true,
      },
      {
        organizationId: 'metadata',
        name: 'Production',
        slug: 'prod',
        databaseUrl: process.env.METADATA_PROD_DATABASE_URL || '',
        description: 'Production environment for Metadata project',
        isActive: false, // Default to false for production
      },
    ]

    console.log(`Found ${hardcodedProjects.length} projects to migrate`)

    // Migrate projects
    for (const project of hardcodedProjects) {
      console.log(`Migrating project: ${project.name} (${project.slug})`)

      // Check if project already exists
      const [existingProject] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, project.id))
        .limit(1)

      if (existingProject) {
        console.log(`  ✅ Project ${project.slug} already exists, skipping...`)
        continue
      }

      // Prepare project data
      const projectData = {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        projectType: project.projectType,
        databaseUrl: project.databaseUrl ? encrypt(project.databaseUrl) : null,
        status: project.status,
        icon: project.icon,
        color: project.color,
        metadataJson: project.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Insert project
      await db.insert(organization).values(projectData)
      console.log(`  ✅ Created project: ${project.slug}`)
    }

    // Migrate environments
    console.log('\nMigrating project environments...')
    for (const environment of defaultEnvironments) {
      if (!environment.databaseUrl) {
        console.log(`  ⚠️  Skipping ${environment.slug} environment for ${environment.organizationId} - no database URL provided`)
        continue
      }

      console.log(`Migrating environment: ${environment.name} for ${environment.organizationId}`)

      // Check if environment already exists
      const [existingEnvironment] = await db
        .select()
        .from(projectEnvironment)
        .where(eq(projectEnvironment.slug, environment.slug))
        .limit(1)

      if (existingEnvironment) {
        console.log(`  ✅ Environment ${environment.slug} already exists, skipping...`)
        continue
      }

      // Prepare environment data
      const environmentData = {
        id: `${environment.organizationId}-${environment.slug}`,
        organizationId: environment.organizationId,
        name: environment.name,
        slug: environment.slug,
        databaseUrl: encrypt(environment.databaseUrl),
        description: environment.description,
        isActive: environment.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Insert environment
      await db.insert(projectEnvironment).values(environmentData)
      console.log(`  ✅ Created environment: ${environment.slug} for ${environment.organizationId}`)
    }

    console.log('\n✅ Migration completed successfully!')

    // Summary
    const [projectCount] = await db.select({ count: 'count' }).from(organization)
    const [environmentCount] = await db.select({ count: 'count' }).from(projectEnvironment)

    console.log(`\n📊 Migration Summary:`)
    console.log(`  - Total projects: ${projectCount.count}`)
    console.log(`  - Total environments: ${environmentCount.count}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Rollback function to remove migrated projects
 * This should only be used in development/testing
 */
async function rollbackProjects() {
  try {
    console.log('Starting project rollback...')

    // Remove environments first (foreign key constraint)
    await db.delete(projectEnvironment)
    console.log('✅ Removed all project environments')

    // Remove projects
    await db.delete(organization)
    console.log('✅ Removed all projects')

    console.log('✅ Rollback completed successfully!')
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  }
}

// Export functions for use in scripts
export { migrateProjects, rollbackProjects }

// Run migration if this file is executed directly
if (require.main === module) {
  const command = process.argv[2]

  if (command === 'migrate') {
    migrateProjects()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error)
        process.exit(1)
      })
  } else if (command === 'rollback') {
    rollbackProjects()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error)
        process.exit(1)
      })
  } else {
    console.log('Usage: ts-node migrate-projects.ts [migrate|rollback]')
    process.exit(1)
  }
}