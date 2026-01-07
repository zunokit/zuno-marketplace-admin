/**
 * Diagram Types
 * Type definitions for the visual diagram feature
 */

export interface DiagramNodeData {
  id: string;
  name: string;
  type: "entity" | "process" | "decision" | "start" | "end";
  description?: string;
  properties?: DiagramNodeProperty[];
  color?: string;
}

export interface DiagramNodeProperty {
  name: string;
  type: string;
  isPrimary?: boolean;
  isRequired?: boolean;
}

export interface DiagramLinkData {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  type: "default" | "dashed" | "arrow";
}

export interface DiagramData {
  nodes: DiagramNodeData[];
  links: DiagramLinkData[];
}

export type NodeColorScheme = {
  background: string;
  border: string;
  text: string;
  headerBackground: string;
};

export const NODE_COLORS: Record<DiagramNodeData["type"], NodeColorScheme> = {
  entity: {
    background: "#ffffff",
    border: "#3b82f6",
    text: "#1e293b",
    headerBackground: "#3b82f6",
  },
  process: {
    background: "#ffffff",
    border: "#10b981",
    text: "#1e293b",
    headerBackground: "#10b981",
  },
  decision: {
    background: "#ffffff",
    border: "#f59e0b",
    text: "#1e293b",
    headerBackground: "#f59e0b",
  },
  start: {
    background: "#22c55e",
    border: "#16a34a",
    text: "#ffffff",
    headerBackground: "#16a34a",
  },
  end: {
    background: "#ef4444",
    border: "#dc2626",
    text: "#ffffff",
    headerBackground: "#dc2626",
  },
};
