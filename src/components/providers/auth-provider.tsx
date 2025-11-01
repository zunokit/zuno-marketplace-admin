'use client'

import { createContext, useContext, ReactNode } from 'react'
import { authClient } from '@/lib/auth/client'
import type { AuthClient } from '@/lib/auth/client'

interface AuthContextValue {
  auth: AuthClient
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ auth: authClient }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context.auth
}
