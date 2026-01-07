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
import { updateRecordAction } from '@/app/actions/data/table-actions'
import { toast } from 'sonner'

type EditRecordDialogProps = {
  projectId: string
  tableName: string
  schema: FieldSchema[]
  record: Record<string, unknown>
  primaryKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditRecordDialog({
  projectId,
  tableName,
  schema,
  record,
  primaryKey,
  open,
  onOpenChange,
  onSuccess,
}: EditRecordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(data: Record<string, unknown>) {
    setIsSubmitting(true)

    const primaryKeyValue = record[primaryKey]
    const result = await updateRecordAction(
      projectId,
      tableName,
      primaryKey,
      primaryKeyValue as string | number,
      data
    )

    if (result.success) {
      toast.success('Record updated successfully')
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('error' in result ? result.error : 'Failed to update record')
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
          <DialogTitle>Edit Record</DialogTitle>
          <DialogDescription>
            Update record in <code className="text-sm bg-muted px-1 py-0.5 rounded">{tableName}</code> table
          </DialogDescription>
        </DialogHeader>

        <DynamicForm
          projectId={projectId}
          schema={schema}
          defaultValues={record}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          mode="edit"
        />
      </DialogContent>
    </Dialog>
  )
}
