'use client'

/**
 * Error Boundary for Members Route
 */

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { ErrorBoundaryUI } from '@/components/error-boundary-ui'

export default function MembersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Members page error occurred', error, {
      digest: error.digest,
      component: 'MembersError',
      route: '/members',
    })
  }, [error])

  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Members Error"
      description="Failed to load members. Please try again."
      homeHref="/dashboard"
    />
  )
}
