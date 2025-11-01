'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteProjectAction } from '@/actions/projects/project-actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Project = {
  id: string
  name: string
  slug: string
}

type DeleteProjectDialogProps = {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    const result = await deleteProjectAction(project.id)

    if (result.success) {
      toast.success(result.message || 'Project deleted successfully')
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error(result.error || 'Failed to delete project')
    }

    setIsDeleting(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the project{' '}
            <strong className="font-semibold text-foreground">{project.name}</strong>
            {' '}(
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {project.slug}
            </code>
            ).
            <br />
            <br />
            <span className="text-destructive font-medium">
              This action cannot be undone.
            </span>
            {' '}
            The project configuration will be removed from the database, but the actual
            project database will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
