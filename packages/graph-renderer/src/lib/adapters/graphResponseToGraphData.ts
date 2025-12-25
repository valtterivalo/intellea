/**
 * @fileoverview Adapter from GraphResponseV0 to GraphData.
 * Exports: graphResponseToGraphData
 */

import type { GraphResponseV0, GraphData, NodeObject, LinkObject, GraphLayoutHintV0 } from '@intellea/graph-schema';

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

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const hashToUnit = (value: string): number => hashString(value) / 0xffffffff;

const defaultLayout: GraphLayoutHintV0 = {
  algorithm: 'force',
  dimensions: 3,
  nodeSpacing: 60,
  isDeterministic: true,
};

const buildFallbackPositions = (
  nodes: NodeObject[],
  layout: GraphLayoutHintV0
): Map<string, { x: number; y: number; z: number }> => {
  const spacing = layout.nodeSpacing ?? defaultLayout.nodeSpacing ?? 60;
  const dimensions = layout.dimensions ?? defaultLayout.dimensions ?? 3;
  const algorithm = layout.algorithm ?? defaultLayout.algorithm;
  const positions = new Map<string, { x: number; y: number; z: number }>();
  const rootNodes = nodes.filter((node) => node.isRoot);
  rootNodes.forEach((node) => {
    positions.set(node.id, { x: 0, y: 0, z: 0 });
  });

  const nonRootNodes = nodes.filter((node) => !node.isRoot);
  const total = nonRootNodes.length;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const gridSide = Math.ceil(Math.cbrt(Math.max(total, 1)));
  const gridLayerSize = gridSide * gridSide;
  const gridHalf = (gridSide - 1) / 2;
  const gridLayerHalf = Math.floor((Math.ceil(total / gridLayerSize) - 1) / 2);

  nonRootNodes.forEach((node, index) => {
    let x = 0;
    let y = 0;
    let z = 0;

    if (algorithm === 'grid') {
      const layer = Math.floor(index / gridLayerSize);
      const layerIndex = index % gridLayerSize;
      const row = Math.floor(layerIndex / gridSide);
      const col = layerIndex % gridSide;
      x = (col - gridHalf) * spacing;
      y = (row - gridHalf) * spacing;
      z = dimensions === 3 ? (layer - gridLayerHalf) * spacing : 0;
    } else {
      const angle = index * goldenAngle;
      const radius = spacing * Math.sqrt(index + 1);
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      if (dimensions === 3) {
        z = (hashToUnit(node.id) - 0.5) * spacing;
      }
    }

    positions.set(node.id, { x, y, z });
  });

  return positions;
};

const applyFallbackPositions = (
  nodes: NodeObject[],
  layout: GraphLayoutHintV0
): NodeObject[] => {
  const positions = buildFallbackPositions(nodes, layout);
  const dimensions = layout.dimensions ?? defaultLayout.dimensions ?? 3;
  return nodes.map((node) => {
    const hasX = typeof node.x === 'number';
    const hasY = typeof node.y === 'number';
    const hasZ = typeof node.z === 'number';
    const fallback = positions.get(node.id);

    if (hasX && hasY && hasZ) return node;

    if (hasX && hasY && !hasZ) {
      return { ...node, z: dimensions === 2 ? 0 : (fallback?.z ?? 0) };
    }

    if (!fallback) return node;
    return {
      ...node,
      x: fallback.x,
      y: fallback.y,
      z: dimensions === 2 ? 0 : fallback.z,
    };
  });
};

/**
 * @description Convert GraphResponseV0 into GraphData for rendering.
 * @param response - GraphResponseV0 payload.
 */
export const graphResponseToGraphData = (response: GraphResponseV0): GraphData => {
  const rootId = response.view?.defaultFocusNodeId;
  const nodes = response.nodes.map((node) => toNodeObject(node, rootId));
  const layout = { ...defaultLayout, ...(response.layout ?? {}) };
  const normalizedNodes = applyFallbackPositions(nodes, layout);
  const links = response.edges.map((edge) => toLinkObject(edge));
  return { nodes: normalizedNodes, links };
};
