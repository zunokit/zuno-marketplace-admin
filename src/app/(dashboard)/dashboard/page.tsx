'use client'

import { useActiveProject } from '@/components/providers/project-provider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FolderKanban, Users, Settings, Database } from 'lucide-react'

export default function DashboardPage() {
  const { activeProject, projects } = useActiveProject()

  const stats = [
    {
      title: 'Total Projects',
      value: Object.keys(projects).length,
      icon: FolderKanban,
      description: 'Active projects in the system',
    },
    {
      title: 'Team Members',
      value: 0,
      icon: Users,
      description: 'Across all projects',
    },
    {
      title: 'Databases',
      value: Object.keys(projects).length,
      icon: Database,
      description: 'Connected databases',
    },
    {
      title: 'Settings',
      value: 1,
      icon: Settings,
      description: 'Global configurations',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {activeProject
            ? `Managing: ${activeProject.name}`
            : 'Select a project to get started'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {activeProject && (
        <Card>
          <CardHeader>
            <CardTitle>Active Project</CardTitle>
            <CardDescription>
              Currently managing {activeProject.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-4xl">{activeProject.metadata?.icon}</span>
                <div>
                  <h3 className="font-semibold">{activeProject.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeProject.description}
                  </p>
                </div>
              </div>

              {activeProject.metadata?.features && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Features:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {activeProject.metadata.features.map((feature: string) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!activeProject && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Select a project from the dropdown above to begin managing your
              marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Available projects:
              </p>
              <ul className="space-y-2">
                {Object.values(projects).map((project) => (
                  <li key={project.id} className="flex items-center gap-2">
                    <span className="text-2xl">{project.metadata?.icon}</span>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
