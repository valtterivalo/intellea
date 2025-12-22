/**
 * @fileoverview Graph styling helpers for node and link rendering.
 * Exports: useGraphStyling
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import SpriteText from 'three-spritetext';
import type { NodeObject, GraphData } from '@intellea/graph-schema';
import { getNodeColor as depthColor, getClusterColor } from '../lib/graphColors';
import type { AppGraphNode } from './useGraphState';
import type { GraphEdgeTypeV0 } from '@intellea/graph-schema';

export type GraphThemeColors = {
  nodeHover: string;
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
  emphasisNodeIds?: string[];
  emphasisEdgeTypes?: GraphEdgeTypeV0[];
  labelCulling?: {
    maxLabelCount: number | null;
    priorityNodeIds: Set<string>;
  };
  linkWidthScale?: number;
  linkParticleScale?: number;
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
  emphasisNodeIds,
  emphasisEdgeTypes,
  labelCulling,
  linkWidthScale = 1,
  linkParticleScale = 1,
  themeColors,
}: GraphStylingInput) => {
  const nodeDepths = useMemo(() => {
    if (!visibleData) return {} as Record<string, number | undefined>;
    const depths: Record<string, number | undefined> = {};
    const adjacency: Record<string, string[]> = {};
    visibleData.nodes.forEach((node) => {
      const rawDepth = (node as AppGraphNode).depth;
      depths[node.id] = typeof rawDepth === 'number' ? rawDepth : undefined;
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

  const emphasisNodeSet = useMemo(
    () => new Set(emphasisNodeIds ?? []),
    [emphasisNodeIds]
  );

  const emphasisEdgeTypeSet = useMemo(
    () => new Set<GraphEdgeTypeV0>(emphasisEdgeTypes ?? []),
    [emphasisEdgeTypes]
  );

  const spriteCacheRef = useRef<Map<string, SpriteText>>(new Map());

  useEffect(() => {
    if (!visibleData) return;
    const visibleIds = new Set(visibleData.nodes.map((node) => node.id));
    spriteCacheRef.current.forEach((_, nodeId) => {
      if (!visibleIds.has(nodeId)) {
        spriteCacheRef.current.delete(nodeId);
      }
    });
  }, [visibleData]);

  const labelAllowSet = useMemo(() => {
    if (!visibleData || !labelCulling || labelCulling.maxLabelCount === null) {
      return null;
    }
    const maxLabels = Math.max(labelCulling.maxLabelCount, labelCulling.priorityNodeIds.size);
    const degrees = new Map<string, number>();
    adjacencyMap.forEach((neighbors, id) => {
      degrees.set(id, neighbors.size);
    });
    const sorted = Array.from(degrees.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    const selected = new Set(labelCulling.priorityNodeIds);
    for (const id of sorted) {
      if (selected.size >= maxLabels) break;
      selected.add(id);
    }
    return selected;
  }, [visibleData, labelCulling, adjacencyMap]);

  const combinedHighlightIds = useMemo(() => {
    if (!highlightedNodeIds && emphasisNodeSet.size === 0) return null;
    const combined = new Set<string>();
    highlightedNodeIds?.forEach((id) => combined.add(id));
    emphasisNodeSet.forEach((id) => combined.add(id));
    return combined;
  }, [highlightedNodeIds, emphasisNodeSet]);

  const getNodeColor = useCallback(
    (node: NodeObject) => {
      const appNode = asAppNode(node);
      const cachedDepth = nodeDepths[appNode.id];
      const nodeDepth = (appNode as AppGraphNode).depth;
      const depth =
        typeof cachedDepth === 'number'
          ? cachedDepth
          : typeof nodeDepth === 'number'
            ? nodeDepth
            : 0;
      if (expandingNodeId && appNode.id === expandingNodeId) {
        return themeColors.nodeExpanding;
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
      if (hoveredNodeId === appNode.id) {
        return themeColors.nodeHover;
      }
      if (combinedHighlightIds && !combinedHighlightIds.has(appNode.id)) {
        return themeColors.nodeMuted;
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
      hoveredNodeId,
      nodeDepths,
      colorByCluster,
      clusters,
      combinedHighlightIds,
      expandingNodeId,
      themeColors,
    ]
  );

  const getNodeVal = useCallback(
    (node: NodeObject) => {
      const appNode = asAppNode(node);
      let base = 8;
      if (expandingNodeId && appNode.id === expandingNodeId) {
        base = 18;
      } else if (activeFocusPathIds) {
        base = activeFocusPathIds.has(appNode.id) ? 15 : 6;
      } else if (combinedHighlightIds && !combinedHighlightIds.has(appNode.id)) {
        base = 4;
      }
      if (hoveredNodeId === appNode.id) {
        return Math.max(base, 12);
      }
      return base;
    },
    [activeFocusPathIds, combinedHighlightIds, expandingNodeId, hoveredNodeId]
  );

  const getNodeThreeObject = useCallback(
    (node: NodeObject) => {
      const appNode = asAppNode(node);
      const isPriority =
        combinedHighlightIds?.has(appNode.id) ||
        activeFocusPathIds?.has(appNode.id) ||
        emphasisNodeSet.has(appNode.id) ||
        appNode.isRoot;
      const isCulledIn = labelAllowSet ? labelAllowSet.has(appNode.id) : false;
      const shouldShowLabel = areAllLabelsVisible
        ? !labelAllowSet || isCulledIn
        : isPriority || isCulledIn;
      const cached = spriteCacheRef.current.get(appNode.id);
      if (!shouldShowLabel) {
        if (cached) {
          cached.visible = false;
        }
        return null;
      }
      const label = appNode.label || '';
      const sprite = cached ?? new SpriteText(label);
      if (!cached) {
        sprite.material.depthWrite = false;
        spriteCacheRef.current.set(appNode.id, sprite);
      }
      if (sprite.text !== label) {
        sprite.text = label;
      }
      sprite.color = themeColors.label;
      sprite.visible = true;
      const isInFocusPath = activeFocusPathIds?.has(appNode.id) ?? false;
      sprite.textHeight = isInFocusPath ? 6 : 4;
      const nodeVal = activeFocusPathIds ? (isInFocusPath ? 15 : 6) : 8;
      const yOffset = nodeVal * 1.0 + 8;
      sprite.position.set(0, yOffset, 0);
      return sprite;
    },
    [
      activeFocusPathIds,
      combinedHighlightIds,
      areAllLabelsVisible,
      themeColors,
      emphasisNodeSet,
      labelAllowSet,
    ]
  );

  const getLinkColor = useCallback(
    (link: {
      source: string | AppGraphNode;
      target: string | AppGraphNode;
      edgeType?: GraphEdgeTypeV0;
      type?: GraphEdgeTypeV0;
    }) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const edgeType = link.edgeType ?? link.type;
      const isFocusLink =
        activeFocusPathIds?.has(sourceId) && activeFocusPathIds?.has(targetId);
      const isHighlighted =
        combinedHighlightIds?.has(sourceId) && combinedHighlightIds?.has(targetId);
      const isEmphasisEdge = edgeType ? emphasisEdgeTypeSet.has(edgeType) : false;
      if (isFocusLink) {
        return 'rgba(139, 125, 107, 0.8)';
      }
      if (isEmphasisEdge) {
        return 'rgba(139, 125, 107, 0.7)';
      }
      if (isHighlighted) {
        return 'rgba(139, 125, 107, 0.55)';
      }
      if (combinedHighlightIds) {
        return 'rgba(139, 125, 107, 0.1)';
      }
      return themeColors.link;
    },
    [activeFocusPathIds, combinedHighlightIds, emphasisEdgeTypeSet, themeColors]
  );

  const getLinkWidth = useCallback(
    (link: {
      source: string | AppGraphNode;
      target: string | AppGraphNode;
      edgeType?: GraphEdgeTypeV0;
      type?: GraphEdgeTypeV0;
    }) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const edgeType = link.edgeType ?? link.type;
      const isFocusLink =
        activeFocusPathIds?.has(sourceId) && activeFocusPathIds?.has(targetId);
      const isHighlighted =
        combinedHighlightIds?.has(sourceId) && combinedHighlightIds?.has(targetId);
      const isEmphasisEdge = edgeType ? emphasisEdgeTypeSet.has(edgeType) : false;
      if (isFocusLink) {
        return 1.1 * linkWidthScale;
      }
      if (isEmphasisEdge) {
        return 0.9 * linkWidthScale;
      }
      if (isHighlighted) {
        return 0.8 * linkWidthScale;
      }
      if (combinedHighlightIds) {
        return 0.15 * linkWidthScale;
      }
      return 0.5 * linkWidthScale;
    },
    [activeFocusPathIds, combinedHighlightIds, emphasisEdgeTypeSet, linkWidthScale]
  );

  const getLinkDirectionalParticles = useCallback(
    (link: {
      source: string | AppGraphNode;
      target: string | AppGraphNode;
      edgeType?: GraphEdgeTypeV0;
      type?: GraphEdgeTypeV0;
    }) => {
      if (!activeFocusPathIds && !combinedHighlightIds && emphasisEdgeTypeSet.size === 0) {
        return 0;
      }
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const edgeType = link.edgeType ?? link.type;
      const isFocusLink =
        activeFocusPathIds?.has(sourceId) && activeFocusPathIds?.has(targetId);
      const isHighlighted =
        combinedHighlightIds?.has(sourceId) && combinedHighlightIds?.has(targetId);
      const isEmphasisEdge = edgeType ? emphasisEdgeTypeSet.has(edgeType) : false;
      let base = 0;
      if (isFocusLink) {
        base = 2;
      } else if (isEmphasisEdge) {
        base = 1;
      } else if (isHighlighted) {
        base = 1;
      }
      if (base === 0) return 0;
      return Math.floor(base * linkParticleScale);
    },
    [activeFocusPathIds, combinedHighlightIds, emphasisEdgeTypeSet, linkParticleScale]
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
