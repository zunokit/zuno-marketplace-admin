import { ProjectForm } from '@/components/projects/project-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Prevent static prerendering due to client component context usage
export const dynamic = 'force-dynamic'

export default function NewProjectPage() {
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
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground">
          Add a new project to the marketplace admin dashboard
        </p>
      </div>

      <ProjectForm mode="create" />
    </div>
  )
}
