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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProjectConfig } from '@/config/projects.config'

interface ProjectSwitcherProps {
  projects: ProjectConfig[]
  activeProjectId?: string
  onProjectChange: (projectId: string) => void
  collapsed?: boolean
}

export function ProjectSwitcher({
  projects,
  activeProjectId,
  onProjectChange,
  collapsed = false,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false)

  const activeProject = projects.find((p) => p.id === activeProjectId)

  if (collapsed) {
    return (
      <div className="flex justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(!open)}
              >
                <span className="text-lg">
                  {activeProject?.metadata?.icon || '📁'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-sm font-medium">Projects</div>
              <div className="text-xs text-muted-foreground">
                {activeProject?.name || 'No project selected'}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a project"
          className="w-full justify-between bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border hover:bg-sidebar-accent/80"
        >
          {activeProject ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeProject.metadata?.icon}</span>
              <span className="truncate">{activeProject.name}</span>
            </div>
          ) : (
            'Select project...'
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-full min-w-[200px]">
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
              <span className="text-lg">{project.metadata?.icon}</span>
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
