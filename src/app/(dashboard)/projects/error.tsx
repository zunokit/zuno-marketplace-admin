'use client'

/**
 * Error Boundary for Projects Route
 */

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { ErrorBoundaryUI } from '@/components/error-boundary-ui'

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Projects page error occurred', error, {
      digest: error.digest,
      component: 'ProjectsError',
      route: '/projects',
    })
  }, [error])

  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Projects Error"
      description="Failed to load projects. Please try again."
      homeHref="/dashboard"
    />
  )
}
