'use client'

/**
 * Error Boundary for Dashboard Routes
 * Catches and displays errors in a user-friendly way
 */

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { ErrorBoundaryUI } from '@/components/error-boundary-ui'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    logger.error('Dashboard error occurred', error, {
      digest: error.digest,
      component: 'DashboardError',
    })
  }, [error])

  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Dashboard Error"
      description="An error occurred while loading the dashboard"
      homeHref="/dashboard"
    />
  )
}
