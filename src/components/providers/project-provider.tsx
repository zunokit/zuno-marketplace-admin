"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { ProjectConfig } from "@/config/projects.config";
import { getProjectsRegistryAction } from "@/app/actions/projects/project-actions";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { logger } from "@/lib/utils/logger";

interface ProjectContextValue {
  activeProject: ProjectConfig | null;
  setActiveProject: (projectId: string | null) => Promise<void>;
  projects: Record<string, ProjectConfig>;
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(
  undefined
);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      const savedProjectId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT);
      return savedProjectId;
    }
    return null;
  });

  const [projects, setProjects] = useState<Record<string, ProjectConfig>>({});
  const [activeProject, setActiveProject] = useState<ProjectConfig | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from database using Server Action
  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use Server Action instead of direct import to avoid bundling database code
      const response = await getProjectsRegistryAction();

      if (!response.success || !response.data) {
        throw new Error("Failed to load projects");
      }

      const projectsRegistry = response.data as Record<string, ProjectConfig>;
      setProjects(projectsRegistry);

      // Update active project if it exists
      if (activeProjectId && projectsRegistry[activeProjectId]) {
        setActiveProject(projectsRegistry[activeProjectId]);
      } else if (activeProjectId) {
        // Active project no longer exists, clear it
        setActiveProjectId(null);
        setActiveProject(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load projects";
      setError(errorMessage);
      logger.error("Failed to load projects registry", err, {
        activeProjectId,
        context: 'ProjectProvider.loadProjects',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeProjectId]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Refresh projects function
  const refreshProjects = async () => {
    await loadProjects();
  };

  // Handle setting active project
  const handleSetActiveProject = async (projectId: string | null) => {
    setActiveProjectId(projectId);

    if (typeof window !== "undefined") {
      if (projectId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, projectId);
        // Find and set the active project from current projects
        if (projects[projectId]) {
          setActiveProject(projects[projectId]);
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT);
        setActiveProject(null);
      }
    }
  };

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
  );
}

export function useActiveProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useActiveProject must be used within ProjectProvider");
  }
  return context;
}

// Export additional hook for easier access to projects
export function useProjects() {
  const { projects, isLoading, error, refreshProjects } = useActiveProject();
  return { projects, isLoading, error, refreshProjects };
}
