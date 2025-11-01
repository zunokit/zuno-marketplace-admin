import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/middleware'
import { AuthProvider } from '@/components/providers/auth-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { ProjectProvider } from '@/components/providers/project-provider'
import { Toaster } from '@/components/providers/toaster'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <ProjectProvider>
          <DashboardShell user={session.user}>{children}</DashboardShell>
          <Toaster />
        </ProjectProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
