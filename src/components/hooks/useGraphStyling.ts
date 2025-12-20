/**
 * @fileoverview Graph styling helpers for node and link rendering.
 * Exports: useGraphStyling
 */

import { useCallback, useMemo } from 'react';
import SpriteText from 'three-spritetext';
import { NodeObject } from 'react-force-graph-3d';
import { getNodeColor as depthColor, getClusterColor } from '@/lib/graphColors';
import type { AppGraphNode, GraphData } from './useGraphState';

export type GraphThemeColors = {
  nodeExpanding: string;
  nodeMuted: string;
  link: string;
  label: string;
};

interface GraphStylingInput {
  visibleData?: GraphData;
  activeFocusPathIds: Set<string> | null;
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  pinnedNodes: Record<string, boolean>;
  completedNodeIds: Set<string>;
  clusters: Record<string, string>;
  colorByCluster: boolean;
  expandingNodeId?: string | null;
  hoveredNodeId: string | null;
  areAllLabelsVisible: boolean;
  themeColors: GraphThemeColors;
}

const asAppNode = (node: NodeObject): AppGraphNode => node as AppGraphNode;

export const useGraphStyling = ({
  visibleData,
  activeFocusPathIds,
  selectedNodeId,
  focusedNodeId,
  pinnedNodes,
  completedNodeIds,
  clusters,
  colorByCluster,
  expandingNodeId,
  hoveredNodeId,
  areAllLabelsVisible,
  themeColors,
}: GraphStylingInput) => {
  const nodeDepths = useMemo(() => {
    if (!visibleData) return {} as Record<string, number>;
    const depths: Record<string, number> = {};
    const adjacency: Record<string, string[]> = {};
    visibleData.nodes.forEach((node) => {
      depths[node.id] = (node as AppGraphNode).depth ?? undefined;
      adjacency[node.id] = [];
    });
    visibleData.links.forEach((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      if (adjacency[sourceId]) adjacency[sourceId].push(targetId);
      if (adjacency[targetId]) adjacency[targetId].push(sourceId);
    });
    const root =
      visibleData.nodes.find((node) => (node as AppGraphNode).depth === 0) ||
      visibleData.nodes[0];
    if (!root) return depths;
    const queue = [root.id];
    if (depths[root.id] === undefined) depths[root.id] = 0;
    while (queue.length) {
      const id = queue.shift()!;
      const depth = depths[id] as number;
      for (const neighborId of adjacency[id] || []) {
        if (depths[neighborId] === undefined) {
          depths[neighborId] = depth + 1;
          queue.push(neighborId);
        }
      }
    }
    return depths;
  }, [visibleData]);

  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!visibleData) return map;
    visibleData.nodes.forEach((node) => {
      map.set(node.id, new Set());
    });
    visibleData.links.forEach((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      if (!map.has(sourceId)) map.set(sourceId, new Set());
      if (!map.has(targetId)) map.set(targetId, new Set());
      map.get(sourceId)?.add(targetId);
      map.get(targetId)?.add(sourceId);
    });
    return map;
  }, [visibleData]);

  const activeHighlightId = hoveredNodeId ?? selectedNodeId ?? focusedNodeId ?? null;

  const highlightedNodeIds = useMemo(() => {
    if (!activeHighlightId) return null;
    const neighbors = adjacencyMap.get(activeHighlightId);
    const result = new Set<string>();
    result.add(activeHighlightId);
    neighbors?.forEach((neighborId) => result.add(neighborId));
    return result;
  }, [activeHighlightId, adjacencyMap]);

  const getNodeColor = useCallback(
    (node: NodeObject) => {
      const appNode = asAppNode(node);
      const depth = nodeDepths[appNode.id] ?? (appNode as AppGraphNode).depth ?? 0;
      if (expandingNodeId && appNode.id === expandingNodeId) {
        return themeColors.nodeExpanding;
      }
      if (highlightedNodeIds && !highlightedNodeIds.has(appNode.id)) {
        return themeColors.nodeMuted;
      }
      if (selectedNodeId === appNode.id) {
        return '#eab308';
      }
      if (pinnedNodes[appNode.id]) {
        return '#22c55e';
      }
      if (completedNodeIds.has(appNode.id)) {
        return '#38bdf8';
      }
      if (colorByCluster) {
        const clusterIndex = clusters[appNode.id];
        if (clusterIndex !== undefined) {
          return getClusterColor(clusterIndex);
        }
      }
      return depthColor(depth);
    },
    [
      selectedNodeId,
      pinnedNodes,
      completedNodeIds,
      nodeDepths,
      colorByCluster,
      clusters,
      highlightedNodeIds,
      expandingNodeId,
      themeColors,
    ]
  );

  const getNodeVal = useCallback(
    (node: NodeObject) => {
      const appNode = asAppNode(node);
      if (expandingNodeId && appNode.id === expandingNodeId) {
        return 18;
      }
      if (highlightedNodeIds && !highlightedNodeIds.has(appNode.id)) {
        return 4;
      }
      if (activeFocusPathIds) {
        return activeFocusPathIds.has(appNode.id) ? 15 : 6;
      }
      return 8;
    },
    [activeFocusPathIds, highlightedNodeIds, expandingNodeId]
  );

  const getNodeThreeObject = useCallback(
    (node: NodeObject) => {
      const appNode = asAppNode(node);
      const shouldShowLabel =
        areAllLabelsVisible ||
        highlightedNodeIds?.has(appNode.id) ||
        activeFocusPathIds?.has(appNode.id) ||
        appNode.isRoot;
      const sprite = new SpriteText(shouldShowLabel ? appNode.label || '' : '');
      sprite.material.depthWrite = false;
      sprite.color = themeColors.label;
      sprite.visible = shouldShowLabel;
      const isInFocusPath = activeFocusPathIds?.has(appNode.id) ?? false;
      sprite.textHeight = isInFocusPath ? 6 : 4;
      const nodeVal = activeFocusPathIds ? (isInFocusPath ? 15 : 6) : 8;
      const yOffset = nodeVal * 1.0 + 8;
      sprite.position.set(0, yOffset, 0);
      return sprite;
    },
    [activeFocusPathIds, highlightedNodeIds, areAllLabelsVisible, themeColors]
  );

  const getLinkColor = useCallback(
    (link: { source: string | AppGraphNode; target: string | AppGraphNode }) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const isFocusLink =
        activeFocusPathIds?.has(sourceId) && activeFocusPathIds?.has(targetId);
      const isHighlighted =
        highlightedNodeIds?.has(sourceId) && highlightedNodeIds?.has(targetId);
      if (isFocusLink) {
        return 'rgba(139, 125, 107, 0.8)';
      }
      if (isHighlighted) {
        return 'rgba(139, 125, 107, 0.55)';
      }
      if (highlightedNodeIds) {
        return 'rgba(139, 125, 107, 0.1)';
      }
      return themeColors.link;
    },
    [activeFocusPathIds, highlightedNodeIds, themeColors]
  );

  const getLinkWidth = useCallback(
    (link: { source: string | AppGraphNode; target: string | AppGraphNode }) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const isFocusLink =
        activeFocusPathIds?.has(sourceId) && activeFocusPathIds?.has(targetId);
      const isHighlighted =
        highlightedNodeIds?.has(sourceId) && highlightedNodeIds?.has(targetId);
      if (isFocusLink) {
        return 1.1;
      }
      if (isHighlighted) {
        return 0.8;
      }
      if (highlightedNodeIds) {
        return 0.15;
      }
      return 0.5;
    },
    [activeFocusPathIds, highlightedNodeIds]
  );

  const getLinkDirectionalParticles = useCallback(
    (link: { source: string | AppGraphNode; target: string | AppGraphNode }) => {
      if (!activeFocusPathIds && !highlightedNodeIds) {
        return 0;
      }
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const isFocusLink =
        activeFocusPathIds?.has(sourceId) && activeFocusPathIds?.has(targetId);
      const isHighlighted =
        highlightedNodeIds?.has(sourceId) && highlightedNodeIds?.has(targetId);
      if (isFocusLink) {
        return 2;
      }
      if (isHighlighted) {
        return 1;
      }
      return 0;
    },
    [activeFocusPathIds, highlightedNodeIds]
  );

  return {
    getNodeColor,
    getNodeVal,
    getNodeThreeObject,
    getLinkColor,
    getLinkWidth,
    getLinkDirectionalParticles,
  };
};
