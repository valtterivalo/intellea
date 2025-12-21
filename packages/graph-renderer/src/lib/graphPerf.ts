/**
 * @fileoverview Performance helpers for large graph rendering.
 * Exports: getGraphPerfProfile, selectCoreNodeIds, type GraphPerfProfile
 */

type GraphLike = {
  nodes: Array<{ id: string }>;
  links: Array<{ source: string | { id: string }; target: string | { id: string } }>;
};

export type GraphPerfProfile = {
  maxLabelCount: number | null;
  nodeRelSize: number;
  nodeResolution: number;
  linkWidthScale: number;
  linkParticleScale: number;
  progressiveEnabled: boolean;
  progressiveNodeCap: number;
  d3AlphaDecay: number;
  d3VelocityDecay: number;
  warmupTicks: number;
  cooldownTicks: number;
  cooldownTime: number;
};

const asId = (value: string | { id: string }): string =>
  typeof value === 'string' ? value : value.id;

export const getGraphPerfProfile = (
  nodeCount: number,
  isPerfModeEnabled: boolean
): GraphPerfProfile => {
  if (!isPerfModeEnabled) {
    return {
      maxLabelCount: null,
      nodeRelSize: 6,
      nodeResolution: 16,
      linkWidthScale: 1,
      linkParticleScale: 1,
      progressiveEnabled: false,
      progressiveNodeCap: nodeCount,
      d3AlphaDecay: 0.03,
      d3VelocityDecay: 0.3,
      warmupTicks: 40,
      cooldownTicks: 120,
      cooldownTime: 1200,
    };
  }

  if (nodeCount <= 600) {
    return {
      maxLabelCount: null,
      nodeRelSize: 6,
      nodeResolution: 16,
      linkWidthScale: 1,
      linkParticleScale: 1,
      progressiveEnabled: false,
      progressiveNodeCap: nodeCount,
      d3AlphaDecay: 0.03,
      d3VelocityDecay: 0.3,
      warmupTicks: 40,
      cooldownTicks: 120,
      cooldownTime: 1200,
    };
  }

  if (nodeCount <= 1500) {
    return {
      maxLabelCount: 200,
      nodeRelSize: 5.2,
      nodeResolution: 10,
      linkWidthScale: 0.8,
      linkParticleScale: 0.9,
      progressiveEnabled: false,
      progressiveNodeCap: nodeCount,
      d3AlphaDecay: 0.04,
      d3VelocityDecay: 0.38,
      warmupTicks: 25,
      cooldownTicks: 70,
      cooldownTime: 700,
    };
  }

  if (nodeCount <= 3000) {
    return {
      maxLabelCount: 120,
      nodeRelSize: 4.2,
      nodeResolution: 8,
      linkWidthScale: 0.6,
      linkParticleScale: 0.5,
      progressiveEnabled: true,
      progressiveNodeCap: 700,
      d3AlphaDecay: 0.05,
      d3VelocityDecay: 0.42,
      warmupTicks: 18,
      cooldownTicks: 55,
      cooldownTime: 550,
    };
  }

  return {
    maxLabelCount: 80,
    nodeRelSize: 3.6,
    nodeResolution: 6,
    linkWidthScale: 0.45,
    linkParticleScale: 0.3,
    progressiveEnabled: true,
    progressiveNodeCap: 550,
    d3AlphaDecay: 0.06,
    d3VelocityDecay: 0.48,
    warmupTicks: 12,
    cooldownTicks: 40,
    cooldownTime: 400,
  };
};

export const selectCoreNodeIds = (
  data: GraphLike,
  maxNodes: number,
  priorityNodeIds: Set<string>
): Set<string> => {
  if (maxNodes <= 0) return new Set(priorityNodeIds);

  const degreeMap = new Map<string, number>();
  data.nodes.forEach((node) => {
    degreeMap.set(node.id, 0);
  });

  data.links.forEach((link) => {
    const sourceId = asId(link.source);
    const targetId = asId(link.target);
    degreeMap.set(sourceId, (degreeMap.get(sourceId) ?? 0) + 1);
    degreeMap.set(targetId, (degreeMap.get(targetId) ?? 0) + 1);
  });

  const sortedIds = Array.from(degreeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  const selected = new Set(priorityNodeIds);
  for (const id of sortedIds) {
    if (selected.size >= maxNodes) break;
    selected.add(id);
  }
  return selected;
};
