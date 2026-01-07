'use client'

/**
 * Dynamic Form Generator
 * Auto-generates forms from database table schemas
 * Supports create and edit operations with smart field rendering
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { ForeignKeySelect } from './foreign-key-select'

export type FieldSchema = {
  name: string
  type: string
  nullable: boolean
  defaultValue: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  foreignKeyTable: string | null
  foreignKeyColumn: string | null
  enumValues: string[] | null
}

type DynamicFormProps = {
  projectId: string
  schema: FieldSchema[]
  defaultValues?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  mode: 'create' | 'edit'
}

/**
 * Generate Zod schema from database field schema
 */
function generateZodSchema(fields: FieldSchema[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const schemaShape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    // Skip primary keys in create mode (auto-generated)
    if (field.isPrimaryKey) {
      schemaShape[field.name] = z.any().optional()
      continue
    }

    let fieldSchema: z.ZodTypeAny

    // Determine base type
    switch (field.type.toLowerCase()) {
      case 'integer':
      case 'bigint':
      case 'smallint':
      case 'int':
      case 'int4':
      case 'int8':
        fieldSchema = z.coerce.number().int()
        break

      case 'numeric':
      case 'decimal':
      case 'real':
      case 'double precision':
      case 'float':
      case 'float4':
      case 'float8':
        fieldSchema = z.coerce.number()
        break

      case 'boolean':
      case 'bool':
        fieldSchema = z.boolean()
        break

      case 'date':
        fieldSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: 'Invalid date format',
        })
        break

      case 'timestamp':
      case 'timestamp with time zone':
      case 'timestamp without time zone':
      case 'timestamptz':
        fieldSchema = z.string().datetime().or(z.string().refine((val) => !isNaN(Date.parse(val))))
        break

      case 'json':
      case 'jsonb':
        fieldSchema = z.string().refine(
          (val) => {
            try {
              JSON.parse(val)
              return true
            } catch {
              return false
            }
          },
          { message: 'Invalid JSON' }
        )
        break

      case 'uuid':
        fieldSchema = z.string().uuid()
        break

      case 'text':
      case 'varchar':
      case 'character varying':
      case 'char':
      case 'character':
      default:
        fieldSchema = z.string()
        break
    }

    // Handle nullable fields
    if (field.nullable) {
      fieldSchema = fieldSchema.nullable().optional()
    }

    schemaShape[field.name] = fieldSchema
  }

  return z.object(schemaShape)
}

/**
 * Render appropriate input field based on database type
 */
function renderField(field: FieldSchema, form: ReturnType<typeof useForm<Record<string, unknown>>>, mode: 'create' | 'edit', projectId: string) {
  const { name, type, isPrimaryKey, nullable, enumValues, isForeignKey, foreignKeyTable } = field
  const fieldType = type.toLowerCase()

  // Skip primary keys in create mode
  if (isPrimaryKey && mode === 'create') {
    return null
  }

  return (
    <FormField
      key={name}
      control={form.control}
      name={name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            {!nullable && !isPrimaryKey && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {/* Foreign key select */}
            {isForeignKey && foreignKeyTable ? (
              <ForeignKeySelect
                projectId={projectId}
                tableName={foreignKeyTable}
                columnName={name}
                value={formField.value as string | number | null}
                onChange={formField.onChange}
                nullable={nullable}
                disabled={isPrimaryKey && mode === 'edit'}
                placeholder={nullable ? 'Select (optional)' : 'Select value'}
              />
            ) : /* Enum select */
            enumValues && enumValues.length > 0 ? (
              <Select
                value={String(formField.value || '')}
                onValueChange={formField.onChange}
                disabled={isPrimaryKey && mode === 'edit'}
              >
                <SelectTrigger>
                  <SelectValue placeholder={nullable ? 'Select (optional)' : 'Select value'} />
                </SelectTrigger>
                <SelectContent>
                  {nullable && (
                    <SelectItem value="">
                      <span className="text-muted-foreground">None</span>
                    </SelectItem>
                  )}
                  {enumValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : /* Boolean checkbox */
            fieldType === 'boolean' || fieldType === 'bool' ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formField.value as boolean}
                  onCheckedChange={formField.onChange}
                  disabled={isPrimaryKey && mode === 'edit'}
                />
                <span className="text-sm text-muted-foreground">
                  {formField.value ? 'True' : 'False'}
                </span>
              </div>
            ) : /* Textarea for text fields */
            fieldType === 'text' ? (
              <Textarea
                {...formField}
                value={(formField.value as string) || ''}
                rows={4}
                placeholder={nullable ? 'Optional' : 'Required'}
                disabled={isPrimaryKey && mode === 'edit'}
              />
            ) : /* JSON textarea */
            fieldType === 'json' || fieldType === 'jsonb' ? (
              <Textarea
                {...formField}
                value={
                  typeof formField.value === 'string'
                    ? formField.value
                    : JSON.stringify(formField.value, null, 2)
                }
                rows={6}
                placeholder={nullable ? '{}' : 'Required JSON'}
                className="font-mono text-xs"
                disabled={isPrimaryKey && mode === 'edit'}
              />
            ) : /* Date input */
            fieldType === 'date' ? (
              <Input
                type="date"
                {...formField}
                value={(formField.value as string) || ''}
                disabled={isPrimaryKey && mode === 'edit'}
              />
            ) : /* Timestamp input */
            fieldType.includes('timestamp') ? (
              <Input
                type="datetime-local"
                {...formField}
                value={(formField.value as string) || ''}
                disabled={isPrimaryKey && mode === 'edit'}
              />
            ) : /* Default text/number input */
            (
              <Input
                type={
                  fieldType.includes('int') || fieldType.includes('numeric')
                    ? 'number'
                    : 'text'
                }
                {...formField}
                value={formField.value !== null && formField.value !== undefined ? String(formField.value) : ''}
                placeholder={nullable ? 'Optional' : 'Required'}
                disabled={isPrimaryKey && mode === 'edit'}
              />
            )}
          </FormControl>
          <FormDescription className="text-xs">
            {type}
            {isPrimaryKey && ' (Primary Key)'}
            {field.isForeignKey && ` → ${field.foreignKeyTable}.${field.foreignKeyColumn}`}
            {enumValues && enumValues.length > 0 && ` (Enum: ${enumValues.length} values)`}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function DynamicForm({
  projectId,
  schema,
  defaultValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode,
}: DynamicFormProps) {
  const zodSchema = generateZodSchema(schema)

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(zodSchema),
    defaultValues,
  })

  async function handleSubmit(data: Record<string, unknown>) {
    // Clean up data: remove undefined/empty optional fields
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      const fieldSchema = schema.find((f) => f.name === key)
      if (!fieldSchema) return acc

      // Skip primary keys in create mode
      if (fieldSchema.isPrimaryKey && mode === 'create') {
        return acc
      }

      // Handle null/empty values
      if (value === '' || value === undefined) {
        if (fieldSchema.nullable) {
          acc[key] = null
        }
        return acc
      }

      // Parse JSON fields
      if (fieldSchema.type.toLowerCase() === 'json' || fieldSchema.type.toLowerCase() === 'jsonb') {
        try {
          acc[key] = typeof value === 'string' ? JSON.parse(value) : value
        } catch {
          acc[key] = value
        }
        return acc
      }

      acc[key] = value
      return acc
    }, {} as Record<string, unknown>)

    await onSubmit(cleanedData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {schema.map((field) => renderField(field, form, mode, projectId))}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? mode === 'create'
                ? 'Creating...'
                : 'Updating...'
              : mode === 'create'
              ? 'Create Record'
              : 'Update Record'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
