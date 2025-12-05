"use client";

/**
 * Custom Node Factory
 * Factory for creating custom node instances
 */

import * as React from "react";
import { AbstractReactFactory } from "@projectstorm/react-canvas-core";
import { DiagramEngine } from "@projectstorm/react-diagrams";
import { CustomNodeModel } from "./custom-node-model";
import { CustomNodeWidget } from "./custom-node-widget";

export class CustomNodeFactory extends AbstractReactFactory<
  CustomNodeModel,
  DiagramEngine
> {
  constructor() {
    super("custom-node");
  }

  generateReactWidget(event: { model: CustomNodeModel }): React.JSX.Element {
    return (
      <CustomNodeWidget node={event.model} engine={this.engine} />
    );
  }

  generateModel(): CustomNodeModel {
    return new CustomNodeModel({
      name: "New Node",
    });
  }
}
