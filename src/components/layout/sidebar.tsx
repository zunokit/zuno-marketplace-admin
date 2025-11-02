'use client'

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Minimize2,
  Maximize2,
  Zap
} from 'lucide-react'
import { Navigation } from './navigation'
import { ProjectSwitcher } from './project-switcher'
import { UserMenu } from './user-menu'
import { useActiveProject } from '@/components/providers/project-provider'
import { useTheme } from 'next-themes'
import type { ProjectConfig } from '@/config/projects.config'

interface SidebarContentProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  isCollapsed: boolean
  projectsList: ProjectConfig[]
  activeProject?: ProjectConfig | null
  onProjectChange: (id: string) => void
  onThemeToggle: () => void
  className?: string
}

function SidebarContent({
  user,
  isCollapsed,
  projectsList,
  activeProject,
  onProjectChange,
  onThemeToggle,
  className
}: SidebarContentProps) {
  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-sidebar border-r border-sidebar-border",
      className
    )}>
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-sidebar-foreground">Zuno Admin</h1>
              <p className="text-xs text-muted-foreground">Marketplace Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Content */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="flex flex-col gap-6">
          {/* Project Switcher */}
          <ProjectSwitcher
            projects={projectsList}
            activeProjectId={activeProject?.id}
            onProjectChange={onProjectChange}
            collapsed={isCollapsed}
          />

          <Separator className="bg-sidebar-border" />

          {/* Main Navigation */}
          <Navigation collapsed={isCollapsed} />
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onThemeToggle}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          {/* Notifications */}
          {!isCollapsed && (
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Bell className="h-4 w-4" />
              <span className="flex-1 text-left">Notifications</span>
              <div className="h-2 w-2 rounded-full bg-destructive" />
            </Button>
          )}

          <Separator className="bg-sidebar-border" />

          {/* User Menu */}
          <UserMenu user={user} collapsed={isCollapsed} />
        </div>
      </div>
    </div>
  )
}

interface SidebarProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  children: ReactNode
}

export function Sidebar({ user, children }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { activeProject, setActiveProject, projects } = useActiveProject()
  const { theme, setTheme } = useTheme()

  const projectsList = Object.values(projects)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileOpen(false)
    }

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  if (!isMounted) {
    return null
  }

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          user={user}
          isCollapsed={isCollapsed}
          projectsList={projectsList}
          activeProject={activeProject}
          onProjectChange={setActiveProject}
          onThemeToggle={handleThemeToggle}
        />
        {/* Desktop collapse button */}
        <div className="absolute bottom-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-40 h-10 w-10"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-sidebar border-sidebar-border"
        >
          <SidebarContent
            user={user}
            isCollapsed={false}
            projectsList={projectsList}
            activeProject={activeProject}
            onProjectChange={setActiveProject}
            onThemeToggle={handleThemeToggle}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border bg-background px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Zuno Admin</h1>
              <p className="text-xs text-muted-foreground">Marketplace Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleThemeToggle}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div className="relative">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}