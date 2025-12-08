/**
 * Custom Node Model
 * Extended node model for diagram entities
 */

import {
  NodeModel,
  NodeModelGenerics,
  PortModelAlignment,
  type DeserializeEvent,
} from "@projectstorm/react-diagrams";
import { CustomPortModel } from "./custom-port-model";
import type { DiagramNodeData, DiagramNodeProperty } from "./types";

export interface CustomNodeModelGenerics extends NodeModelGenerics {
  PORT: CustomPortModel;
}

export class CustomNodeModel extends NodeModel<CustomNodeModelGenerics> {
  name: string;
  nodeType: DiagramNodeData["type"];
  description: string;
  properties: DiagramNodeProperty[];
  color: string;

  constructor(options: {
    name: string;
    nodeType?: DiagramNodeData["type"];
    description?: string;
    properties?: DiagramNodeProperty[];
    color?: string;
  }) {
    super({
      type: "custom-node",
    });

    this.name = options.name;
    this.nodeType = options.nodeType ?? "entity";
    this.description = options.description ?? "";
    this.properties = options.properties ?? [];
    this.color = options.color ?? "#3b82f6";

    this.addPort(new CustomPortModel(PortModelAlignment.LEFT, "in"));
    this.addPort(new CustomPortModel(PortModelAlignment.RIGHT, "out"));
    this.addPort(new CustomPortModel(PortModelAlignment.TOP, "top"));
    this.addPort(new CustomPortModel(PortModelAlignment.BOTTOM, "bottom"));
  }

  serialize() {
    return {
      ...super.serialize(),
      name: this.name,
      nodeType: this.nodeType,
      description: this.description,
      properties: this.properties,
      color: this.color,
    };
  }

  deserialize(event: DeserializeEvent<this>): void {
    super.deserialize(event);
    this.name = (event.data as Record<string, unknown>)["name"] as string;
    this.nodeType = (event.data as Record<string, unknown>)["nodeType"] as DiagramNodeData["type"];
    this.description = (event.data as Record<string, unknown>)["description"] as string;
    this.properties = (event.data as Record<string, unknown>)["properties"] as DiagramNodeProperty[];
    this.color = (event.data as Record<string, unknown>)["color"] as string;
  }

  getInPort(): CustomPortModel {
    return this.getPort("in") as CustomPortModel;
  }

  getOutPort(): CustomPortModel {
    return this.getPort("out") as CustomPortModel;
  }

  getTopPort(): CustomPortModel {
    return this.getPort("top") as CustomPortModel;
  }

  getBottomPort(): CustomPortModel {
    return this.getPort("bottom") as CustomPortModel;
  }

  updateProperties(updates: {
    name?: string;
    nodeType?: DiagramNodeData["type"];
    description?: string;
    properties?: DiagramNodeProperty[];
    color?: string;
  }): void {
    if (updates.name !== undefined) this.name = updates.name;
    if (updates.nodeType !== undefined) this.nodeType = updates.nodeType;
    if (updates.description !== undefined) this.description = updates.description;
    if (updates.properties !== undefined) this.properties = updates.properties;
    if (updates.color !== undefined) this.color = updates.color;
  }
}
