/**
 * Custom Port Model
 * Extended port model for diagram connections
 */

import {
  LinkModel,
  PortModel,
  PortModelAlignment,
  PortModelGenerics,
  PortModelOptions,
} from "@projectstorm/react-diagrams";
import { DefaultLinkModel } from "@projectstorm/react-diagrams";

export interface CustomPortModelOptions extends PortModelOptions {
  label?: string;
  in?: boolean;
}

export class CustomPortModel extends PortModel<PortModelGenerics> {
  constructor(
    alignment: PortModelAlignment,
    name: string,
    label?: string
  ) {
    super({
      type: "custom-port",
      name: name,
      alignment: alignment,
    });
    if (label) {
      this.options.extras = { label };
    }
  }

  canLinkToPort(port: PortModel): boolean {
    if (port instanceof CustomPortModel) {
      return this.options.name !== port.options.name;
    }
    return true;
  }

  createLinkModel(): LinkModel {
    return new DefaultLinkModel();
  }
}
