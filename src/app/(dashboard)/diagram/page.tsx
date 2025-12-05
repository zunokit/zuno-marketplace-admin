"use client";

/**
 * Visual Diagram Page
 * Interactive diagram editor using ProjectStorm
 */

import { useState, useCallback } from "react";
import { useActiveProject } from "@/components/providers/project-provider";
import { DiagramCanvasDynamic } from "@/components/diagram/diagram-canvas-dynamic";
import { NodePropertiesPanel } from "@/components/diagram/node-properties-panel";
import { CustomNodeModel } from "@/components/diagram/custom-node-model";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GitBranch,
  Save,
  Download,
  Upload,
  Undo,
  Redo,
  Info,
} from "lucide-react";

export default function DiagramPage() {
  const { activeProject } = useActiveProject();
  const [selectedNode, setSelectedNode] = useState<CustomNodeModel | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);

  const handleNodeSelect = useCallback((node: CustomNodeModel | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback(() => {
    setCanvasKey((k) => k + 1);
  }, []);

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Project Selected</CardTitle>
            <CardDescription>
              Please select a project from the dropdown to create diagrams
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitBranch className="h-8 w-8" />
            Visual Diagram
          </h1>
          <p className="text-muted-foreground">
            Create and edit visual diagrams for {activeProject.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Undo className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Redo className="h-4 w-4 mr-1" />
            Redo
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Canvas Panel */}
          <ResizablePanel defaultSize={75} minSize={50}>
            <div className="h-full rounded-lg border overflow-hidden">
              <DiagramCanvasDynamic
                key={canvasKey}
                className="h-full"
                onNodeSelect={handleNodeSelect}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Sidebar Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full rounded-lg border bg-card overflow-hidden">
              <Tabs defaultValue="properties" className="h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b px-2 h-11">
                  <TabsTrigger value="properties" className="text-sm">
                    Properties
                  </TabsTrigger>
                  <TabsTrigger value="help" className="text-sm">
                    Help
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="flex-1 m-0 overflow-hidden">
                  <NodePropertiesPanel
                    node={selectedNode}
                    onUpdate={handleNodeUpdate}
                  />
                </TabsContent>

                <TabsContent value="help" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4" />
                          Getting Started
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Use the toolbar to add nodes to your diagram. Drag nodes
                          to position them and connect ports to create relationships.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Node Types</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500">Entity</Badge>
                            <span className="text-muted-foreground">
                              Data entities with properties
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500">Process</Badge>
                            <span className="text-muted-foreground">
                              Actions or processes
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-500">Decision</Badge>
                            <span className="text-muted-foreground">
                              Decision points
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600">Start</Badge>
                            <span className="text-muted-foreground">
                              Flow start point
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-500">End</Badge>
                            <span className="text-muted-foreground">
                              Flow end point
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Interactions</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>- Click a node to select it</li>
                          <li>- Drag nodes to reposition</li>
                          <li>- Drag from ports to create links</li>
                          <li>- Use scroll to zoom in/out</li>
                          <li>- Drag canvas to pan</li>
                          <li>- Select 2 nodes then click Connect</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Keyboard Shortcuts</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>
                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Delete</kbd>
                            {" "}- Remove selected
                          </li>
                          <li>
                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+A</kbd>
                            {" "}- Select all
                          </li>
                        </ul>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
