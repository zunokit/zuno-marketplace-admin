"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  FolderKanban,
  Database,
  FileCode,
  Network,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: string | number;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    title: "Main",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        description: "Overview and analytics",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        name: "Projects",
        href: "/projects",
        icon: FolderKanban,
        description: "Project management",
      },
      {
        name: "Members",
        href: "/members",
        icon: Users,
        description: "Team members and invitations",
      },
    ],
  },
  {
    title: "Database",
    items: [
      {
        name: "Data",
        href: "/data",
        icon: Database,
        description: "Browse and manage data tables",
      },
      {
        name: "Schema",
        href: "/schema",
        icon: Network,
        description: "Visual ER diagram",
      },
      {
        name: "Schema Explorer",
        href: "/schema/explorer",
        icon: Search,
        description: "Detailed schema browser",
      },
      {
        name: "Query",
        href: "/query",
        icon: FileCode,
        description: "SQL query runner",
      },
    ],
  },
];

interface NavigationProps {
  collapsed?: boolean;
}

export function Navigation({ collapsed = false }: NavigationProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter navigation items based on search
  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  const NavigationItem = ({ item }: { item: NavigationItem }) => {
    const isActive =
      pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;

    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive && "text-primary-foreground"
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.name}</span>
            {item.badge && (
              <Badge
                variant={isActive ? "secondary" : "destructive"}
                className="h-5 text-xs"
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}

        {/* Hover effect for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md shadow-md border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-xs text-muted-foreground">
              {item.description}
            </div>
            {item.badge && (
              <Badge variant="destructive" className="mt-1 h-4 text-xs">
                {item.badge}
              </Badge>
            )}
          </div>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-popover text-popover-foreground border shadow-lg"
            >
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.description}
              </div>
              {item.badge && (
                <div className="mt-1">
                  <Badge variant="destructive" className="h-4 text-xs">
                    {item.badge}
                  </Badge>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      <nav className="flex flex-col space-y-6">
        {/* Search */}
        {!collapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        )}

        {filteredGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            <div className="flex flex-col space-y-1">
              {group.items.map((item) => (
                <NavigationItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No items found matching &quot;{searchQuery}&quot;
          </div>
        )}
      </nav>
    </TooltipProvider>
  );
}
