/**
 * @fileoverview Adapter from IntelleaResponse to GraphResponseV0.
 * Exports: intelleaToGraphResponse
 */

import type { IntelleaResponse, NodeObject, KnowledgeCard, LinkObject } from '@intellea/graph-schema';
import type {
  GraphResponseV0,
  GraphNodeV0,
  GraphEdgeV0,
  GraphLayoutHintV0,
  GraphPositionV0,
} from '@intellea/graph-schema';

const getNodePosition = (node: NodeObject): GraphPositionV0 | undefined => {
  const hasFixed =
    typeof node.fx === 'number' ||
    typeof node.fy === 'number' ||
    typeof node.fz === 'number';
  const x = typeof node.fx === 'number' ? node.fx : node.x;
  const y = typeof node.fy === 'number' ? node.fy : node.y;
  const z = typeof node.fz === 'number' ? node.fz : node.z;
  if (typeof x !== 'number' || typeof y !== 'number') {
    return undefined;
  }
  return {
    x,
    y,
    z: typeof z === 'number' ? z : undefined,
    isFixed: hasFixed || undefined,
  };
};

const getNodeSummary = (node: NodeObject, cards: KnowledgeCard[]): string | undefined => {
  const card = cards.find((item) => item.nodeId === node.id);
  return card?.description;
};

const linkId = (link: LinkObject): string => {
  const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
  const targetId = typeof link.target === 'string' ? link.target : link.target.id;
  return `${sourceId}::${targetId}`;
};

/**
 * @description Convert an IntelleaResponse payload to GraphResponseV0.
 * @param response - Intellea response from generation endpoints.
 */
export const intelleaToGraphResponse = (response: IntelleaResponse): GraphResponseV0 => {
  const cards = response.knowledgeCards ?? [];
  const nodes: GraphNodeV0[] = response.visualizationData.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.isRoot ? 'claim' : 'entity',
    summary: getNodeSummary(node, cards),
    position: getNodePosition(node),
    meta: {
      isRoot: node.isRoot,
      depth: node.depth,
      parentIds: node.parentIds,
    },
  }));

  const edges: GraphEdgeV0[] = response.visualizationData.links.map((link) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    return {
      id: linkId(link),
      source: sourceId,
      target: targetId,
      type: 'relates_to',
    };
  });

  const rootNode = response.visualizationData.nodes.find((node) => node.isRoot);
  const hasPositions = nodes.some((node) => node.position);
  const hasZ = nodes.some((node) => typeof node.position?.z === 'number');
  const layout: GraphLayoutHintV0 | undefined = hasPositions
    ? {
        algorithm: 'umap',
        dimensions: hasZ ? 3 : 2,
        isDeterministic: true,
      }
    : {
        algorithm: 'force',
        dimensions: 3,
      };

  const meta: Record<string, unknown> = { source: 'intellea' };
  if (response.sessionTitle) {
    meta.sessionTitle = response.sessionTitle;
  }
  if (response.explanationMarkdown) {
    meta.explanationMarkdown = response.explanationMarkdown;
  }
  if (cards.length > 0) {
    meta.knowledgeCardCount = cards.length;
  }

  return {
    version: 'v0',
    mode: 'map',
    nodes,
    edges,
    layout,
    view: {
      labelDensity: nodes.length > 120 ? 'low' : nodes.length > 40 ? 'medium' : 'high',
      defaultFocusNodeId: rootNode?.id,
      emphasisNodeIds: rootNode ? [rootNode.id] : undefined,
    },
    meta,
  };
};
