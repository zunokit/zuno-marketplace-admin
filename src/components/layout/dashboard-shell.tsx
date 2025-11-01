'use client'

import { ReactNode } from 'react'
import { ProjectSwitcher } from './project-switcher'
import { Navigation } from './navigation'
import { UserMenu } from './user-menu'
import { useActiveProject } from '@/components/providers/project-provider'
import { Separator } from '@/components/ui/separator'

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
  const { activeProject, setActiveProject, projects } = useActiveProject()

  const projectsList = Object.values(projects)

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-gray-50/50">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <h1 className="text-lg font-bold">Zuno Admin</h1>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <ProjectSwitcher
            projects={projectsList}
            activeProjectId={activeProject?.id}
            onProjectChange={setActiveProject}
          />

          <Separator />

          <Navigation />
        </div>

        <div className="mt-auto border-t p-4">
          <UserMenu user={user} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
