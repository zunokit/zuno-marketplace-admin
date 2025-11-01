'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { ProjectConfig, ProjectId } from '@/config/projects.config'
import { PROJECTS_REGISTRY, isValidProjectId } from '@/config/projects.config'

interface ProjectContextValue {
  activeProject: ProjectConfig | null
  setActiveProject: (projectId: string | null) => void
  projects: typeof PROJECTS_REGISTRY
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

const ACTIVE_PROJECT_KEY = 'zuno-active-project'

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const savedProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY)
      if (savedProjectId && isValidProjectId(savedProjectId)) {
        return savedProjectId
      }
    }
    return null
  })

  const activeProject = activeProjectId && isValidProjectId(activeProjectId)
    ? PROJECTS_REGISTRY[activeProjectId as ProjectId]
    : null

  const handleSetActiveProject = (projectId: string | null) => {
    setActiveProjectId(projectId)
    if (projectId) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
    }
  }

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        setActiveProject: handleSetActiveProject,
        projects: PROJECTS_REGISTRY,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useActiveProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useActiveProject must be used within ProjectProvider')
  }
  return context
}
