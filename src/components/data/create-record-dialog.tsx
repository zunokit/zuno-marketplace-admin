'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DynamicForm, type FieldSchema } from './dynamic-form'
import { createRecordAction } from '@/app/actions/data/table-actions'
import { toast } from 'sonner'

type CreateRecordDialogProps = {
  projectId: string
  tableName: string
  schema: FieldSchema[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateRecordDialog({
  projectId,
  tableName,
  schema,
  open,
  onOpenChange,
  onSuccess,
}: CreateRecordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(data: Record<string, unknown>) {
    setIsSubmitting(true)

    const result = await createRecordAction(projectId, tableName, data)

    if (result.success) {
      toast.success('Record created successfully')
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('error' in result ? result.error : 'Failed to create record')
    }

    setIsSubmitting(false)
  }

  function handleCancel() {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Record</DialogTitle>
          <DialogDescription>
            Add a new record to the <code className="text-sm bg-muted px-1 py-0.5 rounded">{tableName}</code> table
          </DialogDescription>
        </DialogHeader>

        <DynamicForm
          projectId={projectId}
          schema={schema}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          mode="create"
        />
      </DialogContent>
    </Dialog>
  )
}
