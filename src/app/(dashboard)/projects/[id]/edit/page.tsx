import { getProjectByIdAction } from '@/actions/projects/project-actions'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params
  const result = await getProjectByIdAction(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const project = result.data as {
    id: string
    name: string
    slug: string
    projectType: string
    description: string | null
    metadata: Record<string, unknown> | null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground">
          Update the configuration for {project.name}
        </p>
      </div>

      <ProjectForm
        mode="edit"
        projectId={project.id}
        defaultValues={{
          name: project.name,
          slug: project.slug,
          projectType: project.projectType,
          description: project.description,
          metadata: project.metadata,
        }}
      />
    </div>
  )
}
