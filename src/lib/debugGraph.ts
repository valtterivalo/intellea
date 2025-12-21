/**
 * @fileoverview Debug graph generator for performance testing.
 * Exports: buildDebugIntelleaResponse
 */

import type { IntelleaResponse, NodeObject, LinkObject, KnowledgeCard } from '@intellea/graph-schema';

const buildNodes = (nodeCount: number): NodeObject[] => {
  const increment = Math.PI * (3 - Math.sqrt(5));
  const offset = 2 / Math.max(nodeCount, 1);
  const radiusScale = 140;

  return Array.from({ length: nodeCount }, (_, index) => {
    const y = index * offset - 1 + offset / 2;
    const r = Math.sqrt(1 - y * y);
    const phi = index * increment;
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;
    const fx = x * radiusScale;
    const fy = y * radiusScale;
    const fz = z * radiusScale;
    return {
      id: `debug-node-${index}`,
      label: `node ${index}`,
      isRoot: index === 0,
      fx,
      fy,
      fz,
      x: fx,
      y: fy,
      z: fz,
    };
  });
};

const buildLinks = (nodeCount: number, linkCount: number): LinkObject[] => {
  if (nodeCount <= 1) return [];
  const links: LinkObject[] = [];
  const offsets = [1, 3, 7, 19];
  let index = 0;
  while (links.length < linkCount && index < nodeCount) {
    for (const offset of offsets) {
      if (links.length >= linkCount) break;
      const target = (index + offset) % nodeCount;
      links.push({
        source: `debug-node-${index}`,
        target: `debug-node-${target}`,
      });
    }
    index += 1;
  }
  return links;
};

export const buildDebugIntelleaResponse = (
  nodeCount: number,
  linkMultiplier = 3
): IntelleaResponse => {
  const safeCount = Math.max(1, Math.floor(nodeCount));
  const nodes = buildNodes(safeCount);
  const linkCount = Math.max(safeCount - 1, Math.floor(safeCount * linkMultiplier));
  const links = buildLinks(safeCount, linkCount);
  const knowledgeCards: KnowledgeCard[] = [];

  return {
    sessionTitle: `Debug Graph (${safeCount} nodes)`,
    explanationMarkdown: `Debug graph with ${safeCount} nodes and ${links.length} links.`,
    knowledgeCards,
    visualizationData: {
      nodes,
      links,
    },
  };
};
