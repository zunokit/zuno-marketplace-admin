/**
 * Dynamic SQL Editor
 * Lazy-loaded Monaco Editor wrapper with code splitting
 */

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

type SqlEditorProps = {
  value: string
  onChange: (value: string) => void
  height?: string
  readOnly?: boolean
}

// Loading component shown while Monaco Editor is loading
function SqlEditorLoader() {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ height: '300px' }}>
      <div className="p-4 space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-5/6" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    </div>
  )
}

// Dynamically import the actual SqlEditor component
// This splits Monaco Editor into a separate chunk loaded only when needed
const SqlEditor = dynamic<SqlEditorProps>(
  () => import('./sql-editor-core').then((mod) => mod.SqlEditorCore),
  {
    loading: () => <SqlEditorLoader />,
    ssr: false, // Monaco Editor doesn't work with SSR
  }
)

export { SqlEditor }
export type { SqlEditorProps }
