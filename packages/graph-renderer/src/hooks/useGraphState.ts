/**
 * @fileoverview React component.
 * Exports: interface, useGraphState
 */
import React from 'react';
import { useLocalGraphController, type GraphController } from './graphController';
import type { GraphData, NodeObject } from '@intellea/graph-schema';

export interface AppGraphNode extends NodeObject {}

/**
 * @description Provide graph-related state and actions from the store.
 * @param visualizationData - Optional filtered graph data.
 * @returns State selectors and mutators for graph components.
 */
export function useGraphState(visualizationData?: GraphData, controller?: GraphController) {
  const localController = useLocalGraphController(controller ? undefined : visualizationData);
  const activeController = controller ?? localController;

  const {
    focusedNodeId,
    activeFocusPathIds,
    selectedNodeId,
    pinnedNodes,
    completedNodeIds,
    clusters,
    colorByCluster,
    collapsedClusterIds,
    expandedClusterIds,
    isClusterCollapseEnabled,
    graphRenderPhase,
    isPerfModeEnabled,
    collapsedNodes,
    setSelectedNodeId,
    setActiveFocusPath,
    pinNode,
    unpinNode,
    collapseNode,
    expandNodeInStore,
    setFocusedNodeId,
    setColorByCluster,
    setGraphRenderPhase,
    setPerfModeEnabled,
    collapseCluster,
    expandCluster,
    resetClusterCollapseState,
    setClusterCollapseEnabled,
    setVisibleNodeIds,
  } = activeController;

  const autoCollapseEnabled = React.useMemo(() => {
    const nodeCount = visualizationData?.nodes.length ?? 0;
    return isClusterCollapseEnabled && isPerfModeEnabled && nodeCount >= 1200;
  }, [visualizationData, isPerfModeEnabled, isClusterCollapseEnabled]);

  const hasManualClusterCollapse = React.useMemo(
    () => isClusterCollapseEnabled && Object.keys(collapsedClusterIds).length > 0,
    [collapsedClusterIds, isClusterCollapseEnabled]
  );

  const isClusterFilteringEnabled = autoCollapseEnabled || hasManualClusterCollapse;

  const clusterStats = React.useMemo(() => {
    const sizes: Record<string, number> = {};
    const degrees: Record<string, number> = {};
    const representatives: Record<string, string> = {};
    if (!visualizationData || !isClusterFilteringEnabled) {
      return { sizes, degrees, representatives };
    }
    visualizationData.nodes.forEach((node) => {
      degrees[node.id] = 0;
      const clusterId = clusters[node.id];
      if (!clusterId) return;
      sizes[clusterId] = (sizes[clusterId] ?? 0) + 1;
    });
    visualizationData.links.forEach((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      degrees[sourceId] = (degrees[sourceId] ?? 0) + 1;
      degrees[targetId] = (degrees[targetId] ?? 0) + 1;
    });
    visualizationData.nodes.forEach((node) => {
      const clusterId = clusters[node.id];
      if (!clusterId) return;
      const currentRep = representatives[clusterId];
      if (!currentRep) {
        representatives[clusterId] = node.id;
        return;
      }
      const currentDegree = degrees[currentRep] ?? 0;
      const nodeDegree = degrees[node.id] ?? 0;
      if (nodeDegree > currentDegree) {
        representatives[clusterId] = node.id;
      }
    });
    return { sizes, degrees, representatives };
  }, [visualizationData, clusters, isClusterFilteringEnabled]);

  const priorityNodeIds = React.useMemo(() => {
    const priority = new Set<string>();
    if (selectedNodeId) priority.add(selectedNodeId);
    if (focusedNodeId) priority.add(focusedNodeId);
    Object.keys(pinnedNodes).forEach((id) => priority.add(id));
    activeFocusPathIds?.forEach((id) => priority.add(id));
    visualizationData?.nodes.forEach((node) => {
      if (node.isRoot) priority.add(node.id);
    });
    return priority;
  }, [selectedNodeId, focusedNodeId, pinnedNodes, activeFocusPathIds, visualizationData]);

  const isClusterCollapsed = React.useCallback(
    (clusterId?: string) => {
      if (!clusterId) return false;
      if (!isClusterCollapseEnabled) return false;
      if (autoCollapseEnabled) {
        return !expandedClusterIds[clusterId];
      }
      return !!collapsedClusterIds[clusterId];
    },
    [autoCollapseEnabled, expandedClusterIds, collapsedClusterIds, isClusterCollapseEnabled]
  );

  const visibleData: GraphData | undefined = React.useMemo(() => {
    if (!visualizationData) return undefined;
    const hasCollapsedNodes = Object.keys(collapsedNodes).length > 0;
    if (!hasCollapsedNodes && !isClusterFilteringEnabled) {
      return visualizationData;
    }
    const filteredNodes = visualizationData.nodes.filter((node) => {
      if (collapsedNodes[node.id]) return false;
      const clusterId = clusters[node.id];
      if (!clusterId) return true;
      if (!isClusterCollapsed(clusterId)) return true;
      if (priorityNodeIds.has(node.id)) return true;
      const representativeId = clusterStats.representatives[clusterId];
      return representativeId === node.id;
    });
    const visibleIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = visualizationData.links.filter((l) => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      return visibleIds.has(s) && visibleIds.has(t);
    });
    return { nodes: filteredNodes, links: filteredLinks };
  }, [
    visualizationData,
    collapsedNodes,
    clusters,
    isClusterCollapsed,
    priorityNodeIds,
    clusterStats.representatives,
    isClusterFilteringEnabled,
  ]);

  React.useEffect(() => {
    if (!visibleData || !setVisibleNodeIds) return;
    setVisibleNodeIds(new Set(visibleData.nodes.map((n) => n.id)));
  }, [visibleData, setVisibleNodeIds]);

  return {
    focusedNodeId,
    activeFocusPathIds,
    selectedNodeId,
    pinnedNodes,
    completedNodeIds,
    clusters,
    colorByCluster,
    collapsedClusterIds,
    expandedClusterIds,
    clusterRepresentatives: clusterStats.representatives,
    clusterSizes: clusterStats.sizes,
    isClusterCollapsed,
    autoCollapseEnabled,
    isClusterCollapseEnabled,
    graphRenderPhase,
    isPerfModeEnabled,
    collapsedNodes,
    setSelectedNodeId,
    setActiveFocusPath,
    pinNode,
    unpinNode,
    collapseNode,
    expandNodeInStore,
    setFocusedNodeId,
    setColorByCluster,
    setGraphRenderPhase,
    setPerfModeEnabled,
    collapseCluster,
    expandCluster,
    resetClusterCollapseState,
    setClusterCollapseEnabled,
    visibleData,
  };
}
