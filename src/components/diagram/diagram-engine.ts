/**
 * Diagram Engine Setup
 * Initialize and configure the ProjectStorm diagram engine
 */

import createEngine, {
  DiagramModel,
  DefaultLinkModel,
  DiagramEngine,
} from "@projectstorm/react-diagrams";
import { CustomNodeFactory } from "./custom-node-factory";
import { CustomNodeModel } from "./custom-node-model";
import type { DiagramData, DiagramNodeData } from "./types";

export function createDiagramEngine(): DiagramEngine {
  const engine = createEngine();

  engine.getNodeFactories().registerFactory(new CustomNodeFactory());

  return engine;
}

export function createDiagramModel(data?: DiagramData): DiagramModel {
  const model = new DiagramModel();

  if (data) {
    const nodeMap = new Map<string, CustomNodeModel>();

    data.nodes.forEach((nodeData) => {
      const node = createNodeFromData(nodeData);
      nodeMap.set(nodeData.id, node);
      model.addNode(node);
    });

    data.links.forEach((linkData) => {
      const sourceNode = nodeMap.get(linkData.sourceNodeId);
      const targetNode = nodeMap.get(linkData.targetNodeId);

      if (sourceNode && targetNode) {
        const link = new DefaultLinkModel();
        link.setSourcePort(sourceNode.getOutPort());
        link.setTargetPort(targetNode.getInPort());

        if (linkData.label) {
          link.addLabel(linkData.label);
        }

        model.addLink(link);
      }
    });
  }

  return model;
}

function createNodeFromData(data: DiagramNodeData): CustomNodeModel {
  const node = new CustomNodeModel({
    name: data.name,
    nodeType: data.type,
    description: data.description,
    properties: data.properties,
    color: data.color,
  });

  return node;
}

export function addNodeToModel(
  model: DiagramModel,
  data: Omit<DiagramNodeData, "id">,
  position: { x: number; y: number }
): CustomNodeModel {
  const node = new CustomNodeModel({
    name: data.name,
    nodeType: data.type,
    description: data.description,
    properties: data.properties,
    color: data.color,
  });

  node.setPosition(position.x, position.y);
  model.addNode(node);

  return node;
}

export function connectNodes(
  model: DiagramModel,
  sourceNode: CustomNodeModel,
  targetNode: CustomNodeModel,
  label?: string,
  sourcePortName: "out" | "bottom" = "out",
  targetPortName: "in" | "top" = "in"
): DefaultLinkModel {
  const link = new DefaultLinkModel();

  const sourcePort =
    sourcePortName === "out"
      ? sourceNode.getOutPort()
      : sourceNode.getBottomPort();
  const targetPort =
    targetPortName === "in" ? targetNode.getInPort() : targetNode.getTopPort();

  link.setSourcePort(sourcePort);
  link.setTargetPort(targetPort);

  if (label) {
    link.addLabel(label);
  }

  model.addLink(link);

  return link;
}

export function autoLayoutNodes(model: DiagramModel): void {
  const nodes = model.getNodes();
  const nodeArray = Object.values(nodes);

  const columns = Math.ceil(Math.sqrt(nodeArray.length));
  const horizontalSpacing = 350;
  const verticalSpacing = 300;

  nodeArray.forEach((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    node.setPosition(col * horizontalSpacing + 100, row * verticalSpacing + 100);
  });
}

export { DiagramModel, DefaultLinkModel };
