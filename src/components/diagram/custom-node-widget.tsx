"use client";

/**
 * Custom Node Widget
 * Visual representation of diagram nodes
 */

import { DiagramEngine, PortWidget } from "@projectstorm/react-diagrams";
import { CustomNodeModel } from "./custom-node-model";
import { NODE_COLORS } from "./types";
import { cn } from "@/lib/utils";

interface CustomNodeWidgetProps {
  node: CustomNodeModel;
  engine: DiagramEngine;
}

export function CustomNodeWidget({ node, engine }: CustomNodeWidgetProps) {
  const colorScheme = NODE_COLORS[node.nodeType];

  return (
    <div
      className={cn(
        "relative rounded-lg shadow-lg border-2 min-w-[180px] max-w-[280px]",
        "transition-shadow duration-200",
        node.isSelected() && "ring-2 ring-offset-2 ring-blue-500"
      )}
      style={{
        backgroundColor: colorScheme.background,
        borderColor: colorScheme.border,
      }}
    >
      {/* Top Port */}
      <PortWidget
        port={node.getTopPort()}
        engine={engine}
        className="absolute -top-2 left-1/2 -translate-x-1/2"
      >
        <div className="w-4 h-4 rounded-full bg-slate-400 hover:bg-blue-500 cursor-pointer transition-colors border-2 border-white" />
      </PortWidget>

      {/* Header */}
      <div
        className="px-3 py-2 rounded-t-md font-semibold text-sm"
        style={{
          backgroundColor: colorScheme.headerBackground,
          color: "#ffffff",
        }}
      >
        <div className="flex items-center gap-2">
          {node.nodeType === "entity" && <EntityIcon />}
          {node.nodeType === "process" && <ProcessIcon />}
          {node.nodeType === "decision" && <DecisionIcon />}
          {node.nodeType === "start" && <StartIcon />}
          {node.nodeType === "end" && <EndIcon />}
          <span className="truncate">{node.name}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {node.description && (
          <p className="text-xs text-slate-600 mb-2">{node.description}</p>
        )}

        {node.properties.length > 0 && (
          <div className="space-y-1">
            {node.properties.map((prop, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs border-b border-slate-100 pb-1 last:border-0 last:pb-0"
              >
                <span className="flex items-center gap-1">
                  {prop.isPrimary && (
                    <KeyIcon className="w-3 h-3 text-amber-500" />
                  )}
                  <span
                    className={cn(
                      "font-mono",
                      prop.isRequired && "font-semibold"
                    )}
                  >
                    {prop.name}
                  </span>
                </span>
                <span className="text-slate-500 font-mono">{prop.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Left Port */}
      <PortWidget
        port={node.getInPort()}
        engine={engine}
        className="absolute top-1/2 -left-2 -translate-y-1/2"
      >
        <div className="w-4 h-4 rounded-full bg-slate-400 hover:bg-blue-500 cursor-pointer transition-colors border-2 border-white" />
      </PortWidget>

      {/* Right Port */}
      <PortWidget
        port={node.getOutPort()}
        engine={engine}
        className="absolute top-1/2 -right-2 -translate-y-1/2"
      >
        <div className="w-4 h-4 rounded-full bg-slate-400 hover:bg-blue-500 cursor-pointer transition-colors border-2 border-white" />
      </PortWidget>

      {/* Bottom Port */}
      <PortWidget
        port={node.getBottomPort()}
        engine={engine}
        className="absolute -bottom-2 left-1/2 -translate-x-1/2"
      >
        <div className="w-4 h-4 rounded-full bg-slate-400 hover:bg-blue-500 cursor-pointer transition-colors border-2 border-white" />
      </PortWidget>
    </div>
  );
}

function EntityIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
      />
    </svg>
  );
}

function ProcessIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function DecisionIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function StartIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function EndIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}
