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
import { deleteRecordAction } from '@/app/actions/data/table-actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type DeleteRecordDialogProps = {
  projectId: string
  tableName: string
  primaryKey: string
  primaryKeyValue: string | number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteRecordDialog({
  projectId,
  tableName,
  primaryKey,
  primaryKeyValue,
  open,
  onOpenChange,
  onSuccess,
}: DeleteRecordDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    const result = await deleteRecordAction(projectId, tableName, primaryKey, primaryKeyValue)

    if (result.success) {
      toast.success('Record deleted successfully')
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('error' in result ? result.error : 'Failed to delete record')
    }

    setIsDeleting(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the record with{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {primaryKey} = {primaryKeyValue}
            </code>{' '}
            from the{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{tableName}</code>{' '}
            table.
            <br />
            <br />
            <span className="text-destructive font-medium">
              This action cannot be undone.
            </span>
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
            {isDeleting ? 'Deleting...' : 'Delete Record'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
