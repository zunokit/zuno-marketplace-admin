'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ProjectConfig } from '@/config/projects.config'

interface ProjectSwitcherProps {
  projects: ProjectConfig[]
  activeProjectId?: string
  onProjectChange: (projectId: string) => void
}

export function ProjectSwitcher({
  projects,
  activeProjectId,
  onProjectChange,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false)

  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a project"
          className="w-[200px] justify-between"
        >
          {activeProject ? (
            <div className="flex items-center gap-2">
              <span>{activeProject.metadata?.icon}</span>
              <span className="truncate">{activeProject.name}</span>
            </div>
          ) : (
            'Select project...'
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => {
              onProjectChange(project.id)
              setOpen(false)
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1">
              <span>{project.metadata?.icon}</span>
              <span className="truncate">{project.name}</span>
            </div>
            {activeProjectId === project.id && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
