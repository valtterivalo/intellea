/**
 * @fileoverview Adapter from GraphResponseV0 to GraphData.
 * Exports: graphResponseToGraphData
 */

import type { GraphResponseV0, GraphData, NodeObject, LinkObject } from '@intellea/graph-schema';

const toNodeObject = (
  node: GraphResponseV0['nodes'][number],
  rootId?: string
): NodeObject => {
  const position = node.position;
  const isFixed = position?.isFixed === true;
  return {
    id: node.id,
    label: node.label,
    isRoot: node.meta?.isRoot === true || node.id === rootId,
    fx: isFixed ? position?.x : undefined,
    fy: isFixed ? position?.y : undefined,
    fz: isFixed ? position?.z : undefined,
    x: position?.x,
    y: position?.y,
    z: position?.z,
    nodeType: node.type,
    summary: node.summary,
    meta: node.meta,
  };
};

const toLinkObject = (edge: GraphResponseV0['edges'][number]): LinkObject => ({
  source: edge.source,
  target: edge.target,
  edgeType: edge.type,
  label: edge.label,
  weight: edge.weight,
  meta: edge.meta,
});

/**
 * @description Convert GraphResponseV0 into GraphData for rendering.
 * @param response - GraphResponseV0 payload.
 */
export const graphResponseToGraphData = (response: GraphResponseV0): GraphData => {
  const rootId = response.view?.defaultFocusNodeId;
  const nodes = response.nodes.map((node) => toNodeObject(node, rootId));
  const links = response.edges.map((edge) => toLinkObject(edge));
  return { nodes, links };
};
