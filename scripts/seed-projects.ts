#!/usr/bin/env tsx

/**
 * Seed script to migrate hardcoded projects from the old PROJECTS_REGISTRY
 * into the database using Drizzle ORM
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import {
  organization,
  projectEnvironment,
  projectFeature,
  projectConfiguration,
  type NewOrganization,
  type NewProjectEnvironment,
  type NewProjectFeature,
  type NewProjectConfiguration,
} from "../src/lib/infrastructure/database/schemas";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Database connection
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client, {
  schema: {
    organization,
    projectEnvironment,
    projectFeature,
    projectConfiguration,
  },
});

/**
 * Hardcoded projects from the old PROJECTS_REGISTRY
 * These will be migrated to the database
 */
const LEGACY_PROJECTS = [
  {
    id: "abis",
    name: "@zuno-marketplace-abis",
    slug: "zuno-abis",
    databaseUrl: process.env.ABIS_DATABASE_URL,
    description: "Zuno Marketplace ABIs - Smart contract ABI management",
    icon: "📋",
    color: "#3b82f6",
    features: ["ABI Management", "Contract Registry", "Version Control"],
    projectType: "abis",
  },
  {
    id: "metadata",
    name: "@zuno-marketplace-metadata",
    slug: "zuno-metadata",
    databaseUrl: process.env.METADATA_DATABASE_URL,
    description: "Zuno Marketplace Metadata - NFT and token metadata service",
    icon: "🏷️",
    color: "#8b5cf6",
    features: ["Metadata Storage", "IPFS Integration", "Token Standards"],
    projectType: "metadata",
  },
] as const;

/**
 * Create a default environment for a project
 */
function createDefaultEnvironment(
  projectId: string,
  databaseUrl?: string
): NewProjectEnvironment {
  return {
    id: nanoid(),
    organizationId: projectId,
    name: "production",
    slug: "prod",
    databaseUrl: databaseUrl || "",
    description: "Production environment",
    isActive: true,
  };
}

/**
 * Create features for a project
 */
function createProjectFeatures(
  projectId: string,
  features: string[]
): NewProjectFeature[] {
  const featureMap: Record<string, { name: string; description: string }> = {
    "ABI Management": {
      name: "ABI Management",
      description: "Smart contract ABI management and versioning",
    },
    "Contract Registry": {
      name: "Contract Registry",
      description: "Registry of smart contracts with metadata",
    },
    "Version Control": {
      name: "Version Control",
      description: "Version control for contract artifacts",
    },
    "Metadata Storage": {
      name: "Metadata Storage",
      description: "NFT and token metadata storage",
    },
    "IPFS Integration": {
      name: "IPFS Integration",
      description: "IPFS integration for decentralized storage",
    },
    "Token Standards": {
      name: "Token Standards",
      description:
        "Support for various token standards (ERC-721, ERC-1155, etc.)",
    },
  };

  return features.map((feature) => {
    const featureData = featureMap[feature] || {
      name: feature,
      description: `Feature: ${feature}`,
    };
    return {
      id: nanoid(),
      organizationId: projectId,
      name: featureData.name,
      key: feature.toLowerCase().replace(/\s+/g, "_"),
      description: featureData.description,
      isEnabled: true,
      configuration: {},
    };
  });
}

/**
 * Create default configurations for a project
 */
function createProjectConfigurations(
  projectId: string,
  icon: string,
  color: string
): NewProjectConfiguration[] {
  return [
    {
      id: nanoid(),
      organizationId: projectId,
      key: "theme",
      value: {
        icon,
        color,
        primaryColor: color,
      },
      description: "Project theme configuration",
      isEncrypted: false,
    },
    {
      id: nanoid(),
      organizationId: projectId,
      key: "settings",
      value: {
        timezone: "UTC",
        language: "en",
        dateFormat: "YYYY-MM-DD",
      },
      description: "Project general settings",
      isEncrypted: false,
    },
    {
      id: nanoid(),
      organizationId: projectId,
      key: "integrations",
      value: {
        webhooks: [],
        apiKeys: [],
        externalServices: [],
      },
      description: "Third-party integrations configuration",
      isEncrypted: true,
    },
  ];
}

/**
 * Main seeding function
 */
async function seedProjects() {
  console.log(
    "🚀 Starting project migration from hardcoded registry to database..."
  );

  try {
    for (const project of LEGACY_PROJECTS) {
      console.log(`\n📦 Migrating project: ${project.name} (${project.slug})`);

      // Check if project already exists
      const existingProject = await db
        .select()
        .from(organization)
        .where(eq(organization.id, project.id))
        .limit(1);

      if (existingProject.length > 0) {
        console.log(`⚠️  Project ${project.id} already exists, skipping...`);
        continue;
      }

      // Create organization (project)
      const newOrganization: NewOrganization = {
        id: project.id,
        name: project.name,
        slug: project.slug,
        logo: project.icon,
        metadata: JSON.stringify({
          icon: project.icon,
          color: project.color,
          features: project.features,
        }),
        metadataJson: {
          icon: project.icon,
          color: project.color,
          features: project.features,
        },
        projectType: project.projectType,
        databaseUrl: project.databaseUrl,
        description: project.description,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [createdProject] = await db
        .insert(organization)
        .values(newOrganization)
        .returning();

      console.log(`✅ Created project: ${createdProject.name}`);

      // Create default environment if database URL is available
      if (project.databaseUrl) {
        const defaultEnv = createDefaultEnvironment(
          project.id,
          project.databaseUrl
        );
        await db.insert(projectEnvironment).values(defaultEnv);
        console.log(`✅ Created default production environment`);
      }

      // Create project features
      const features = createProjectFeatures(project.id, [...project.features]);
      if (features.length > 0) {
        await db.insert(projectFeature).values(features);
        console.log(`✅ Created ${features.length} project features`);
      }

      // Create project configurations
      const configurations = createProjectConfigurations(
        project.id,
        project.icon,
        project.color
      );
      if (configurations.length > 0) {
        await db.insert(projectConfiguration).values(configurations);
        console.log(
          `✅ Created ${configurations.length} project configurations`
        );
      }
    }

    console.log("\n🎉 Project migration completed successfully!");
    console.log("\n📋 Migration Summary:");
    console.log(`- Projects migrated: ${LEGACY_PROJECTS.length}`);
    console.log(
      "- Features: ABI Management, Contract Registry, Version Control"
    );
    console.log(
      "- Features: Metadata Storage, IPFS Integration, Token Standards"
    );
    console.log(
      "- Default environments created for projects with database URLs"
    );
    console.log("- Theme and settings configurations applied");
  } catch (error) {
    console.error("❌ Error during project migration:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Run the seed script
 */
if (require.main === module) {
  seedProjects()
    .then(() => {
      console.log("\n✨ Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}

export { seedProjects };
