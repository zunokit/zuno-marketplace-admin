/**
 * Dynamic Schema Graph
 * Lazy-loaded React Flow wrapper with code splitting
 */

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { CompleteSchemaInfo } from '@/app/actions/schema/schema-actions'

type SchemaGraphProps = {
  schema: CompleteSchemaInfo
  onTableSelect?: (tableName: string | null) => void
}

// Loading component shown while React Flow is loading
function SchemaGraphLoader() {
  return (
    <div className="w-full h-full min-h-[600px] border rounded-lg bg-background">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  )
}

// Dynamically import the actual SchemaGraph component
// This splits React Flow into a separate chunk loaded only when needed
const SchemaGraph = dynamic<SchemaGraphProps>(
  () => import('./schema-graph-core').then((mod) => mod.SchemaGraphCore),
  {
    loading: () => <SchemaGraphLoader />,
    ssr: false, // React Flow doesn't work well with SSR
  }
)

export { SchemaGraph }
export type { SchemaGraphProps }
