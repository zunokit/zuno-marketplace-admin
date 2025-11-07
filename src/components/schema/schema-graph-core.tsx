"use client";

/**
 * SchemaGraph Component
 * Interactive ER diagram using React Flow
 */

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TableNode, type TableNodeData } from "./table-node";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import type { CompleteSchemaInfo } from "@/app/actions/schema/schema-actions";

const nodeTypes = {
  table: TableNode,
};

type SchemaGraphProps = {
  schema: CompleteSchemaInfo;
  onTableSelect?: (tableName: string | null) => void;
};

/**
 * Auto-layout algorithm using force-directed positioning
 */
function calculateAutoLayout(
  tables: CompleteSchemaInfo["tables"],
  relationships: CompleteSchemaInfo["relationships"]
): { x: number; y: number }[] {
  const tableCount = tables.length;
  const positions: { x: number; y: number }[] = [];

  if (tableCount === 0) return positions;

  // Simple grid layout as starting point
  const columns = Math.ceil(Math.sqrt(tableCount));
  const horizontalSpacing = 400;
  const verticalSpacing = 350;

  tables.forEach((_, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    positions.push({
      x: col * horizontalSpacing + 50,
      y: row * verticalSpacing + 50,
    });
  });

  return positions;
}

export function SchemaGraphCore({ schema, onTableSelect }: SchemaGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>>(
    []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Initialize nodes and edges from schema
  useEffect(() => {
    const positions = calculateAutoLayout(schema.tables, schema.relationships);

    // Create nodes for tables
    const tableNodes: Node<TableNodeData>[] = schema.tables.map(
      (table, index) => ({
        id: table.tableName,
        type: "table",
        position: positions[index] || { x: 0, y: 0 },
        data: {
          tableName: table.tableName,
          schemaName: table.schemaName,
          rowCount: table.rowCount,
          columns: table.columns.map((col) => ({
            columnName: col.columnName,
            dataType: col.dataType,
            isPrimaryKey: col.isPrimaryKey,
            isForeignKey: col.isForeignKey,
            isNullable: col.isNullable,
            enumValues: col.enumValues,
          })),
        },
      })
    );

    // Create edges for relationships
    const relationshipEdges: Edge[] = schema.relationships
      .filter((rel) => rel.relationshipType === "many-to-one") // Only show one direction
      .map((rel, index) => ({
        id: `${rel.sourceTable}-${rel.sourceColumn}-${rel.targetTable}-${index}`,
        source: rel.sourceTable,
        target: rel.targetTable,
        sourceHandle: Position.Right,
        targetHandle: Position.Left,
        type: "smoothstep",
        animated: false,
        label: rel.sourceColumn,
        labelStyle: { fontSize: 10, fill: "#64748b" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
        },
        style: {
          stroke: "#94a3b8",
          strokeWidth: 1.5,
        },
      }));

    setNodes(tableNodes);
    setEdges(relationshipEdges);
  }, [schema, setNodes, setEdges]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;

    const query = searchQuery.toLowerCase();
    return nodes.filter((node) => {
      const data = node.data as TableNodeData;
      return (
        data.tableName.toLowerCase().includes(query) ||
        data.columns.some((col) => col.columnName.toLowerCase().includes(query))
      );
    });
  }, [nodes, searchQuery]);

  // Filter edges to only show connections between filtered nodes
  const filteredEdges = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter(
      (edge) =>
        filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );
  }, [edges, filteredNodes]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedTable(node.id);
      onTableSelect?.(node.id);
    },
    [onTableSelect]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedTable(null);
    onTableSelect?.(null);
  }, [onTableSelect]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-background !border !border-border"
        />

        {/* Search Panel */}
        <Panel position="top-left" className="space-y-2">
          <div className="flex items-center gap-2 bg-background border rounded-lg p-2 shadow-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tables and columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                {filteredNodes.length}/{nodes.length}
              </Badge>
            )}
          </div>
        </Panel>

        {/* Stats Panel */}
        <Panel position="top-right" className="space-y-2">
          <div className="bg-background border rounded-lg p-3 shadow-md space-y-1">
            <div className="text-xs text-muted-foreground">Database Schema</div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-semibold">{schema.tables.length}</span>
                <span className="text-muted-foreground ml-1">tables</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">
                  {schema.relationships.length / 2}
                </span>
                <span className="text-muted-foreground ml-1">
                  relationships
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
