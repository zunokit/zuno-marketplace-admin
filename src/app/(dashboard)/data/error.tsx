'use client'

/**
 * Error Boundary for Data Browser Route
 */

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { ErrorBoundaryUI } from '@/components/error-boundary-ui'

export default function DataError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Data browser error occurred', error, {
      digest: error.digest,
      component: 'DataError',
      route: '/data',
    })
  }, [error])

  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Data Browser Error"
      description="Failed to load the data browser. Please try again."
      homeHref="/dashboard"
    />
  )
}
