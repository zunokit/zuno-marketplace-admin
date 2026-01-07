'use client'

/**
 * Global Error Boundary
 * Catches errors in the root layout and provides fallback UI
 * This wraps the entire application including layout.tsx
 */

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical error
    logger.error('Global error occurred', error, {
      digest: error.digest,
      component: 'GlobalError',
      critical: true,
    })
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#dc2626',
            }}>
              Something went wrong!
            </h1>
            <p style={{
              marginBottom: '2rem',
              color: '#6b7280',
            }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre style={{
                backgroundColor: '#f3f4f6',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                textAlign: 'left',
                overflow: 'auto',
                fontSize: '0.875rem',
              }}>
                {error.message}
              </pre>
            )}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
            }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
