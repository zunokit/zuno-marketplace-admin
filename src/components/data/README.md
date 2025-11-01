# Data Components

This directory contains reusable components for working with database data.

## ForeignKeySelect

A searchable combobox component for selecting foreign key values with lazy loading and pagination.

### Features

- **Searchable**: Real-time search with debouncing (300ms)
- **Lazy Loading**: Loads first 50 items on open, with "Load More" for pagination
- **Smart Display**: Automatically detects the best display column (name, title, email, etc.)
- **Metadata Support**: Shows secondary information like email or description
- **Nullable Support**: Optional "None" option for nullable fields
- **Error Handling**: Retry mechanism for failed requests
- **Loading States**: Proper loading indicators
- **Performance Optimized**: Debounced search, cached options, minimal re-renders

### Usage

```tsx
import { ForeignKeySelect } from '@/components/data/foreign-key-select'

function MyForm() {
  const [userId, setUserId] = useState<string | number | null>(null)

  return (
    <ForeignKeySelect
      projectId="project_123"
      tableName="users"           // Referenced table
      columnName="id"             // Primary key column
      value={userId}
      onChange={setUserId}
      nullable={true}             // Allow null selection
      disabled={false}
      placeholder="Select a user..."
    />
  )
}
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `projectId` | `string` | Yes | - | The project ID containing the table |
| `tableName` | `string` | Yes | - | The referenced table name (e.g., 'users') |
| `columnName` | `string` | Yes | - | The primary key column name (e.g., 'id') |
| `value` | `string \| number \| null` | Yes | - | Currently selected value |
| `onChange` | `(value: string \| number \| null) => void` | Yes | - | Callback when selection changes |
| `nullable` | `boolean` | No | `false` | Whether to show "None (optional)" option |
| `disabled` | `boolean` | No | `false` | Disable the select |
| `placeholder` | `string` | No | `'Select...'` | Placeholder text when no value selected |

### Display Column Detection

The component automatically determines the best display column in this priority order:

1. Common display columns: `name`, `title`, `label`, `email`, `username`, `description`
2. First `varchar` or `text` column
3. Primary key column (fallback)

### Metadata Column

If available, the component will show a secondary metadata field as a badge:

- If display column is `name` or `title`, shows `email` as metadata
- If display column is `email`, shows `name` or `title` as metadata
- Otherwise, looks for `description` or `code` fields

### Examples

#### Basic Usage

```tsx
<ForeignKeySelect
  projectId={projectId}
  tableName="categories"
  columnName="id"
  value={categoryId}
  onChange={setCategoryId}
/>
```

#### Nullable Field

```tsx
<ForeignKeySelect
  projectId={projectId}
  tableName="assigned_to_users"
  columnName="user_id"
  value={assignedTo}
  onChange={setAssignedTo}
  nullable={true}
  placeholder="Unassigned"
/>
```

#### With Form Integration (react-hook-form)

```tsx
import { Controller, useForm } from 'react-hook-form'

function MyForm() {
  const { control } = useForm()

  return (
    <Controller
      control={control}
      name="user_id"
      render={({ field }) => (
        <ForeignKeySelect
          projectId={projectId}
          tableName="users"
          columnName="id"
          value={field.value}
          onChange={field.onChange}
        />
      )}
    />
  )
}
```

### Performance Considerations

- Search queries are debounced by 300ms to reduce server load
- Options are cached in component state to avoid re-fetching
- Only loads 50 items at a time with infinite scroll
- Uses React.useCallback and React.useMemo for optimal re-render performance

### Server Action

The component uses `getForeignKeyOptionsAction` from `@/actions/data/foreign-key-actions.ts`:

```ts
interface ForeignKeyOptionsData {
  options: ForeignKeyOption[]
  totalCount: number
  hasMore: boolean
  displayColumn: string
  metadataColumn?: string
}

getForeignKeyOptionsAction(
  projectId: string,
  tableName: string,
  columnName: string,
  options?: {
    search?: string
    limit?: number
    offset?: number
  }
): Promise<ServerActionResponse<ForeignKeyOptionsData>>
```

### Accessibility

- Full keyboard navigation support
- ARIA labels and roles
- Screen reader compatible
- Focus management
- Proper tab order

### Future Enhancements

- [ ] Virtual scrolling for very large datasets
- [ ] Multi-select support
- [ ] Custom display column override
- [ ] Custom metadata column override
- [ ] Option to open record in new tab
- [ ] Grouping by category
