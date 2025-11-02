'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { ProjectConfig } from '@/config/projects.config'
import { getProjectsRegistry } from '@/config/projects.config'

interface ProjectContextValue {
  activeProject: ProjectConfig | null
  setActiveProject: (projectId: string | null) => Promise<void>
  projects: Record<string, ProjectConfig>
  isLoading: boolean
  error: string | null
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

const ACTIVE_PROJECT_KEY = 'zuno-active-project'

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const savedProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY)
      return savedProjectId
    }
    return null
  })

  const [projects, setProjects] = useState<Record<string, ProjectConfig>>({})
  const [activeProject, setActiveProject] = useState<ProjectConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load projects from database
  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const projectsRegistry = await getProjectsRegistry()
      setProjects(projectsRegistry)

      // Update active project if it exists
      if (activeProjectId && projectsRegistry[activeProjectId]) {
        setActiveProject(projectsRegistry[activeProjectId])
      } else if (activeProjectId) {
        // Active project no longer exists, clear it
        setActiveProjectId(null)
        setActiveProject(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ACTIVE_PROJECT_KEY)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
      console.error('Failed to load projects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Refresh projects function
  const refreshProjects = async () => {
    await loadProjects()
  }

  // Handle setting active project
  const handleSetActiveProject = async (projectId: string | null) => {
    setActiveProjectId(projectId)

    if (typeof window !== 'undefined') {
      if (projectId) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
        // Find and set the active project from current projects
        if (projects[projectId]) {
          setActiveProject(projects[projectId])
        }
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_KEY)
        setActiveProject(null)
      }
    }
  }

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        setActiveProject: handleSetActiveProject,
        projects,
        isLoading,
        error,
        refreshProjects,
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

// Export additional hook for easier access to projects
export function useProjects() {
  const { projects, isLoading, error, refreshProjects } = useActiveProject()
  return { projects, isLoading, error, refreshProjects }
}
