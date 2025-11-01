'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          error: 'bg-destructive text-destructive-foreground',
          success: 'bg-green-600 text-white',
          warning: 'bg-yellow-600 text-white',
          info: 'bg-blue-600 text-white',
        },
      }}
    />
  )
}
