/**
 * Project Validation Schema Tests
 * Tests for Zod schemas used in project management
 */

import {
  createProjectSchema,
  updateProjectSchema,
  projectMetadataSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectMetadata,
} from '../project'

describe('Project Validation Schemas', () => {
  describe('createProjectSchema', () => {
    const validInput: CreateProjectInput = {
      name: '@zuno-marketplace-test',
      slug: 'zuno-test',
      projectType: 'metadata',
      description: 'Test project description',
      databaseUrl: 'postgresql://user:pass@localhost:5432/db',
      metadata: {
        icon: '📦',
        color: '#3b82f6',
        features: ['Feature 1', 'Feature 2'],
      },
    }

    it('should validate correct project data', () => {
      const result = createProjectSchema.safeParse(validInput)

      expect(result.success).toBe(true)
      if (result.success) {
        // Schema adds default status, so compare key fields
        expect(result.data.name).toEqual(validInput.name)
        expect(result.data.slug).toEqual(validInput.slug)
        expect(result.data.projectType).toEqual(validInput.projectType)
        expect(result.data.description).toEqual(validInput.description)
        expect(result.data.databaseUrl).toEqual(validInput.databaseUrl)
        expect(result.data.status).toBe('active') // Default value
      }
    })

    describe('name validation', () => {
      it('should accept valid names', () => {
        const validNames = [
          '@zuno-marketplace',
          'project-name',
          'project123',
          '@test-123',
        ]

        validNames.forEach((name) => {
          const result = createProjectSchema.safeParse({ ...validInput, name })
          expect(result.success).toBe(true)
        })
      })

      it('should reject names with uppercase letters', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          name: 'ProjectName',
        })

        expect(result.success).toBe(false)
      })

      it('should reject names with spaces', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          name: 'project name',
        })

        expect(result.success).toBe(false)
      })

      it('should reject names that are too short', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          name: 'ab',
        })

        expect(result.success).toBe(false)
      })

      it('should reject names that are too long', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          name: 'a'.repeat(101),
        })

        expect(result.success).toBe(false)
      })

      it('should reject names with special characters', () => {
        const invalidNames = ['project!', 'project#name', 'project.name']

        invalidNames.forEach((name) => {
          const result = createProjectSchema.safeParse({ ...validInput, name })
          expect(result.success).toBe(false)
        })
      })
    })

    describe('slug validation', () => {
      it('should accept valid slugs', () => {
        const validSlugs = ['project-slug', 'test-123', 'simple']

        validSlugs.forEach((slug) => {
          const result = createProjectSchema.safeParse({ ...validInput, slug })
          expect(result.success).toBe(true)
        })
      })

      it('should reject slugs with @ symbol', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          slug: '@invalid-slug',
        })

        expect(result.success).toBe(false)
      })

      it('should reject slugs with uppercase', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          slug: 'InvalidSlug',
        })

        expect(result.success).toBe(false)
      })

      it('should reject slugs that are too short', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          slug: 'ab',
        })

        expect(result.success).toBe(false)
      })

      it('should reject slugs that are too long', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          slug: 'a'.repeat(51),
        })

        expect(result.success).toBe(false)
      })
    })

    describe('databaseUrl validation', () => {
      it('should accept valid PostgreSQL URLs', () => {
        // URLs must match format: postgresql://[user[:password]@]host[:port]/database
        const validUrls = [
          'postgresql://user:pass@localhost:5432/db',
          'postgresql://user:pass@host:5432/database',
          'postgresql://user@localhost:5432/db',
          'postgresql://admin:secret@db.example.com:5432/mydb',
        ]

        validUrls.forEach((databaseUrl) => {
          const result = createProjectSchema.safeParse({ ...validInput, databaseUrl })
          expect(result.success).toBe(true)
        })
      })

      it('should reject non-PostgreSQL URLs', () => {
        const invalidUrls = [
          'mysql://localhost:3306/db',
          'mongodb://localhost:27017/db',
          'http://localhost:5432/db',
        ]

        invalidUrls.forEach((databaseUrl) => {
          const result = createProjectSchema.safeParse({ ...validInput, databaseUrl })
          expect(result.success).toBe(false)
        })
      })

      it('should reject invalid URLs', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          databaseUrl: 'not-a-url',
        })

        expect(result.success).toBe(false)
      })
    })

    describe('description validation', () => {
      it('should accept valid descriptions', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          description: 'This is a valid project description',
        })

        expect(result.success).toBe(true)
      })

      it('should accept optional description', () => {
        const { description, ...inputWithoutDescription } = validInput
        const result = createProjectSchema.safeParse(inputWithoutDescription)

        expect(result.success).toBe(true)
      })

      it('should reject descriptions that are too short', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          description: 'Short',
        })

        expect(result.success).toBe(false)
      })

      it('should reject descriptions that are too long', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          description: 'a'.repeat(501),
        })

        expect(result.success).toBe(false)
      })
    })

    describe('projectType validation', () => {
      it('should accept any non-empty string', () => {
        const validTypes = ['metadata', 'indexer', 'api', 'custom-type']

        validTypes.forEach((projectType) => {
          const result = createProjectSchema.safeParse({ ...validInput, projectType })
          expect(result.success).toBe(true)
        })
      })

      it('should reject empty projectType', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          projectType: '',
        })

        expect(result.success).toBe(false)
      })

      it('should reject very long projectType', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          projectType: 'a'.repeat(51),
        })

        expect(result.success).toBe(false)
      })
    })

    describe('metadata validation', () => {
      it('should accept valid metadata', () => {
        const result = createProjectSchema.safeParse(validInput)

        expect(result.success).toBe(true)
      })

      it('should accept metadata without optional fields', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          metadata: {},
        })

        expect(result.success).toBe(true)
      })

      it('should accept optional metadata', () => {
        const { metadata, ...inputWithoutMetadata } = validInput
        const result = createProjectSchema.safeParse(inputWithoutMetadata)

        expect(result.success).toBe(true)
      })

      it('should validate color format', () => {
        const validColors = ['#ffffff', '#000000', '#FF5733', '#3b82f6']

        validColors.forEach((color) => {
          const result = createProjectSchema.safeParse({
            ...validInput,
            metadata: { color },
          })
          expect(result.success).toBe(true)
        })
      })

      it('should reject invalid color formats', () => {
        const invalidColors = ['#fff', '#gggggg', 'red', '123456', '#12345']

        invalidColors.forEach((color) => {
          const result = createProjectSchema.safeParse({
            ...validInput,
            metadata: { color },
          })
          expect(result.success).toBe(false)
        })
      })

      it('should accept features array', () => {
        const result = createProjectSchema.safeParse({
          ...validInput,
          metadata: { features: ['Feature 1', 'Feature 2', 'Feature 3'] },
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateProjectSchema', () => {
    const validUpdate: UpdateProjectInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: '@updated-project',
      slug: 'updated-slug',
      projectType: 'updated-type',
      description: 'Updated description for the project',
      databaseUrl: 'postgresql://user:newpass@localhost:5432/newdb',
    }

    it('should validate correct update data', () => {
      const result = updateProjectSchema.safeParse(validUpdate)

      expect(result.success).toBe(true)
    })

    it('should require valid UUID for id', () => {
      const result = updateProjectSchema.safeParse({
        ...validUpdate,
        id: 'invalid-uuid',
      })

      expect(result.success).toBe(false)
    })

    it('should allow partial updates', () => {
      const partialUpdates = [
        { id: validUpdate.id, name: '@new-name' },
        { id: validUpdate.id, projectType: 'new-type' },
        { id: validUpdate.id, description: 'New description text' },
      ]

      partialUpdates.forEach((update) => {
        const result = updateProjectSchema.safeParse(update)
        expect(result.success).toBe(true)
      })
    })

    it('should allow null description', () => {
      const result = updateProjectSchema.safeParse({
        id: validUpdate.id,
        description: null,
      })

      expect(result.success).toBe(true)
    })

    it('should validate name format in updates', () => {
      const result = updateProjectSchema.safeParse({
        id: validUpdate.id,
        name: 'Invalid Name',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('projectMetadataSchema', () => {
    it('should validate correct metadata', () => {
      const validMetadata: ProjectMetadata = {
        icon: '🚀',
        color: '#3b82f6',
        features: ['Analytics', 'Reporting'],
      }

      const result = projectMetadataSchema.safeParse(validMetadata)

      expect(result.success).toBe(true)
    })

    it('should accept empty metadata', () => {
      const result = projectMetadataSchema.safeParse({})

      expect(result.success).toBe(true)
    })

    it('should validate color format', () => {
      const result = projectMetadataSchema.safeParse({
        color: 'invalid-color',
      })

      expect(result.success).toBe(false)
    })

    it('should accept features array', () => {
      const result = projectMetadataSchema.safeParse({
        features: ['Feature 1', 'Feature 2'],
      })

      expect(result.success).toBe(true)
    })
  })
})
