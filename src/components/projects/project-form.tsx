'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProjectAction, updateProjectAction } from '@/app/actions/projects/project-actions'
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@/lib/validations/project'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type ProjectFormProps = {
  mode: 'create'
  defaultValues?: undefined
} | {
  mode: 'edit'
  projectId: string
  defaultValues: {
    name: string
    slug: string
    projectType: string
    description: string | null
    databaseUrl?: string
    metadata?: Record<string, unknown> | null
  }
}

export function ProjectForm(props: ProjectFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateProjectInput | UpdateProjectInput>({
    resolver: zodResolver(
      props.mode === 'create' ? createProjectSchema : updateProjectSchema
    ),
    defaultValues: props.mode === 'create'
      ? {
          name: '',
          slug: '',
          projectType: '',
          description: '',
          databaseUrl: '',
          metadata: {},
        }
      : {
          name: props.defaultValues.name,
          slug: props.defaultValues.slug,
          projectType: props.defaultValues.projectType,
          description: props.defaultValues.description || '',
          databaseUrl: '',
          metadata: props.defaultValues.metadata || {},
        },
  })

  async function onSubmit(values: CreateProjectInput | UpdateProjectInput) {
    setIsSubmitting(true)

    const result = props.mode === 'create'
      ? await createProjectAction(values as CreateProjectInput)
      : await updateProjectAction({ ...values, id: props.projectId } as UpdateProjectInput)

    if (result.success) {
      toast.success(result.message || `Project ${props.mode === 'create' ? 'created' : 'updated'} successfully`)
      router.push('/projects')
      router.refresh()
    } else {
      toast.error(result.error || `Failed to ${props.mode} project`)
    }

    setIsSubmitting(false)
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    form.setValue('name', name)
    if (props.mode === 'create') {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      form.setValue('slug', slug)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              {props.mode === 'create'
                ? 'Enter the basic details for the new project'
                : 'Update the project details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="@zuno-marketplace-metadata"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    The display name of the project (e.g., @zuno-marketplace-metadata)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="zuno-metadata"
                      {...field}
                      disabled={props.mode === 'edit'}
                    />
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier (auto-generated from name, cannot be changed after creation)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="metadata"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The type or category of the project (e.g., metadata, indexer, api)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a description for this project..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of what this project does
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
            <CardDescription>
              {props.mode === 'create'
                ? 'Configure the database connection for this project'
                : 'Update the database connection (leave empty to keep current connection)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="databaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database URL</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="postgresql://user:password@host:port/database"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    PostgreSQL connection string. Will be encrypted before storage.
                    {props.mode === 'edit' && ' Leave empty to keep the existing connection.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata (Optional)</CardTitle>
            <CardDescription>
              Additional metadata for the project UI (icon, color, features)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="metadata.icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Emoji)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="📦"
                        maxLength={4}
                        {...field}
                        value={(field.value as string) || ''}
                        onChange={(e) => {
                          const metadata = form.getValues('metadata') || {}
                          form.setValue('metadata', { ...metadata, icon: e.target.value })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metadata.color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (Hex)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="#3b82f6"
                        {...field}
                        value={(field.value as string) || ''}
                        onChange={(e) => {
                          const metadata = form.getValues('metadata') || {}
                          form.setValue('metadata', { ...metadata, color: e.target.value })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="metadata.features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Features (comma-separated)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="User Management, Data Analytics, Reporting"
                      className="resize-none"
                      rows={2}
                      {...field}
                      value={
                        Array.isArray(field.value)
                          ? (field.value as string[]).join(', ')
                          : ''
                      }
                      onChange={(e) => {
                        const metadata = form.getValues('metadata') || {}
                        const features = e.target.value
                          .split(',')
                          .map((f) => f.trim())
                          .filter(Boolean)
                        form.setValue('metadata', { ...metadata, features })
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    List of key features for this project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? props.mode === 'create' ? 'Creating...' : 'Updating...'
              : props.mode === 'create' ? 'Create Project' : 'Update Project'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
