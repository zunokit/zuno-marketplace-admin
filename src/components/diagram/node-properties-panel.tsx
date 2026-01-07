"use client";

/**
 * Node Properties Panel
 * Edit panel for selected diagram nodes
 */

import { useState, useRef } from "react";
import { CustomNodeModel } from "./custom-node-model";
import type { DiagramNodeData, DiagramNodeProperty } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodePropertiesPanelProps {
  node: CustomNodeModel | null;
  onUpdate?: () => void;
  onClose?: () => void;
}

export function NodePropertiesPanel({
  node,
  onUpdate,
  onClose,
}: NodePropertiesPanelProps) {
  const nodeId = node?.getID() ?? "";
  const [name, setName] = useState(() => node?.name ?? "");
  const [nodeType, setNodeType] = useState<DiagramNodeData["type"]>(() => node?.nodeType ?? "entity");
  const [description, setDescription] = useState(() => node?.description ?? "");
  const [properties, setProperties] = useState<DiagramNodeProperty[]>(() => node?.properties ? [...node.properties] : []);

  const prevNodeIdRef = useRef(nodeId);
  if (prevNodeIdRef.current !== nodeId) {
    prevNodeIdRef.current = nodeId;
    if (node) {
      setName(node.name);
      setNodeType(node.nodeType);
      setDescription(node.description);
      setProperties([...node.properties]);
    }
  }

  const handleSave = () => {
    if (!node) return;

    node.updateProperties({
      name,
      nodeType,
      description,
      properties,
    });

    onUpdate?.();
  };

  const handleAddProperty = () => {
    setProperties([
      ...properties,
      { name: "", type: "string", isPrimary: false, isRequired: false },
    ]);
  };

  const handleRemoveProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const handleUpdateProperty = (
    index: number,
    field: keyof DiagramNodeProperty,
    value: string | boolean
  ) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
  };

  if (!node) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Select a node to edit its properties
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Node Properties</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Node name"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={nodeType}
              onValueChange={(v) => setNodeType(v as DiagramNodeData["type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entity">Entity</SelectItem>
                <SelectItem value="process">Process</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="end">End</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          {/* Properties (only for entity type) */}
          {nodeType === "entity" && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Properties</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddProperty}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>

                {properties.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No properties defined
                  </p>
                ) : (
                  <div className="space-y-3">
                    {properties.map((prop, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-lg border space-y-2",
                          prop.isPrimary && "bg-amber-50 dark:bg-amber-950/20"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            value={prop.name}
                            onChange={(e) =>
                              handleUpdateProperty(index, "name", e.target.value)
                            }
                            placeholder="Property name"
                            className="flex-1 h-8 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveProperty(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <Select
                          value={prop.type}
                          onValueChange={(v) =>
                            handleUpdateProperty(index, "type", v)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">string</SelectItem>
                            <SelectItem value="number">number</SelectItem>
                            <SelectItem value="boolean">boolean</SelectItem>
                            <SelectItem value="uuid">uuid</SelectItem>
                            <SelectItem value="date">date</SelectItem>
                            <SelectItem value="timestamp">timestamp</SelectItem>
                            <SelectItem value="json">json</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`primary-${index}`}
                              checked={prop.isPrimary}
                              onCheckedChange={(checked) =>
                                handleUpdateProperty(
                                  index,
                                  "isPrimary",
                                  !!checked
                                )
                              }
                            />
                            <Label
                              htmlFor={`primary-${index}`}
                              className="text-xs"
                            >
                              Primary
                            </Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`required-${index}`}
                              checked={prop.isRequired}
                              onCheckedChange={(checked) =>
                                handleUpdateProperty(
                                  index,
                                  "isRequired",
                                  !!checked
                                )
                              }
                            />
                            <Label
                              htmlFor={`required-${index}`}
                              className="text-xs"
                            >
                              Required
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
