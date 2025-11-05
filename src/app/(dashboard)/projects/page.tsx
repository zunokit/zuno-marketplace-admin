'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllProjectsAction } from '@/app/actions/projects/project-actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Edit, Trash2, Database, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog'
import { TestConnectionDialog } from '@/components/projects/test-connection-dialog'
import type { UIProject } from '@/types/ui.types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<UIProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<UIProject | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testConnectionDialogOpen, setTestConnectionDialogOpen] = useState(false)

  async function loadProjects() {
    setIsLoading(true)
    const result = await getAllProjectsAction()

    if (result.success && result.data) {
      // Transform the ProjectEntity[] to UIProject[] by mapping metadataJson to metadata
      const transformedProjects = result.data.map(project => ({
        id: project.id,
        name: project.name,
        slug: project.slug,
        projectType: project.projectType,
        description: project.description,
        isActive: project.status === 'active', // Map status to isActive
        metadata: project.metadataJson, // Map metadataJson to metadata for UI
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        status: project.status,
        databaseUrl: project.databaseUrl,
        icon: project.icon,
        color: project.color,
        logo: project.logo,
      }))
      setProjects(transformedProjects)
    } else {
      toast.error('error' in result ? result.error : 'Failed to load projects')
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleDelete(project: UIProject) {
    setSelectedProject(project)
    setDeleteDialogOpen(true)
  }

  function handleTestConnection(project: UIProject) {
    setSelectedProject(project)
    setTestConnectionDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage all marketplace projects and their database connections
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''} total`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first project
              </p>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  // Type-safe access to metadata properties
                  const icon = (project.metadata && typeof project.metadata === 'object' && 'icon' in project.metadata) 
                    ? (project.metadata.icon as string | undefined) 
                    : undefined;
                  
                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {icon && (
                            <span className="text-2xl">{icon}</span>
                          )}
                          <div>
                            <div className="font-medium">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-muted-foreground">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {project.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{project.projectType}</Badge>
                      </TableCell>
                      <TableCell>
                        {project.isActive ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestConnection(project)}
                          >
                            <Database className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/projects/${project.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(project)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          <DeleteProjectDialog
            project={selectedProject}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={loadProjects}
          />
          <TestConnectionDialog
            project={selectedProject}
            open={testConnectionDialogOpen}
            onOpenChange={setTestConnectionDialogOpen}
          />
        </>
      )}
    </div>
  )
}
