'use client'

import { ReactNode } from 'react'
import { Sidebar } from './sidebar'

interface DashboardShellProps {
  children: ReactNode
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return <Sidebar user={user}>{children}</Sidebar>
}
