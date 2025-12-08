"use client";

/**
 * Diagram Canvas
 * Main canvas component for visual diagram editing
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { CanvasWidget } from "@projectstorm/react-canvas-core";
import { DiagramEngine, DiagramModel } from "@projectstorm/react-diagrams";
import {
  createDiagramEngine,
  addNodeToModel,
  connectNodes,
  autoLayoutNodes,
} from "./diagram-engine";
import { CustomNodeModel } from "./custom-node-model";
import type { DiagramNodeData } from "./types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutGrid,
  Trash2,
  Database,
  Settings,
  HelpCircle,
  Play,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagramCanvasProps {
  className?: string;
  onNodeSelect?: (node: CustomNodeModel | null) => void;
  initialModel?: DiagramModel;
}

export function DiagramCanvas({
  className,
  onNodeSelect,
  initialModel,
}: DiagramCanvasProps) {
  const [engine] = useState<DiagramEngine>(() => createDiagramEngine());
  const [model] = useState<DiagramModel>(() => {
    const diagramModel = initialModel ?? new DiagramModel();
    return diagramModel;
  });
  const [selectedNode, setSelectedNode] = useState<CustomNodeModel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    engine.setModel(model);

    const listener = model.registerListener({
      selectionChanged: () => {
        const selected = model
          .getSelectedEntities()
          .find((e) => e instanceof CustomNodeModel) as
          | CustomNodeModel
          | undefined;
        setSelectedNode(selected ?? null);
        onNodeSelect?.(selected ?? null);
      },
    });

    return () => {
      listener.deregister();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, model]);

  const handleAddNode = useCallback(
    (type: DiagramNodeData["type"]) => {
      if (!model) return;

      const canvas = containerRef.current;
      const centerX = canvas ? canvas.clientWidth / 2 : 400;
      const centerY = canvas ? canvas.clientHeight / 2 : 300;

      const nodeNames: Record<DiagramNodeData["type"], string> = {
        entity: "New Entity",
        process: "New Process",
        decision: "New Decision",
        start: "Start",
        end: "End",
      };

      addNodeToModel(
        model,
        {
          name: nodeNames[type],
          type,
          description: "",
          properties: type === "entity" ? [
            { name: "id", type: "uuid", isPrimary: true, isRequired: true },
          ] : [],
        },
        { x: centerX - 90, y: centerY - 50 }
      );

      engine.repaintCanvas();
    },
    [engine, model]
  );

  const handleZoomIn = useCallback(() => {
    if (!model) return;
    const zoom = model.getZoomLevel();
    model.setZoomLevel(Math.min(zoom + 10, 200));
    engine.repaintCanvas();
  }, [engine, model]);

  const handleZoomOut = useCallback(() => {
    if (!model) return;
    const zoom = model.getZoomLevel();
    model.setZoomLevel(Math.max(zoom - 10, 20));
    engine.repaintCanvas();
  }, [engine, model]);

  const handleFitView = useCallback(() => {
    if (!model) return;
    engine.zoomToFit();
  }, [engine, model]);

  const handleAutoLayout = useCallback(() => {
    if (!model) return;
    autoLayoutNodes(model);
    engine.repaintCanvas();
  }, [engine, model]);

  const handleDeleteSelected = useCallback(() => {
    if (!model) return;
    const selected = model.getSelectedEntities();
    selected.forEach((entity) => {
      entity.remove();
    });
    engine.repaintCanvas();
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [engine, model, onNodeSelect]);

  const handleConnectSelected = useCallback(() => {
    if (!model) return;
    const selected = model.getSelectedEntities().filter(
      (e) => e instanceof CustomNodeModel
    ) as CustomNodeModel[];

    if (selected.length === 2) {
      connectNodes(model, selected[0], selected[1]);
      engine.repaintCanvas();
    }
  }, [engine, model]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleAddNode("entity")}>
                <Database className="h-4 w-4 mr-2 text-blue-500" />
                Entity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddNode("process")}>
                <Settings className="h-4 w-4 mr-2 text-green-500" />
                Process
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddNode("decision")}>
                <HelpCircle className="h-4 w-4 mr-2 text-amber-500" />
                Decision
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddNode("start")}>
                <Play className="h-4 w-4 mr-2 text-green-600" />
                Start
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddNode("end")}>
                <Square className="h-4 w-4 mr-2 text-red-500" />
                End
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleConnectSelected}
            title="Connect selected nodes"
          >
            Connect
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={!selectedNode}
            title="Delete selected"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitView}
            title="Fit to view"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAutoLayout}
            title="Auto layout"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 bg-slate-50 dark:bg-slate-900 diagram-container"
      >
        <CanvasWidget engine={engine} className="w-full h-full" />
      </div>
    </div>
  );
}
