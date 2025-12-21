/**
 * @fileoverview Headless graph controller state and helpers.
 * Exports: GraphController, useLocalGraphController
 */

import { useCallback, useMemo, useState } from 'react';
import { computeClusters } from '../lib/graphCluster';
import { calculateFocusPath } from '../lib/focusPath';
import type { GraphData } from '@intellea/graph-schema';

export interface GraphController {
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  activeFocusPathIds: Set<string> | null;
  pinnedNodes: Record<string, boolean>;
  completedNodeIds: Set<string>;
  collapsedNodes: Record<string, boolean>;
  clusters: Record<string, string>;
  colorByCluster: boolean;
  collapsedClusterIds: Record<string, boolean>;
  expandedClusterIds: Record<string, boolean>;
  isClusterCollapseEnabled: boolean;
  graphRenderPhase: 'core' | 'full';
  isPerfModeEnabled: boolean;
  setSelectedNodeId: (nodeId: string | null) => void;
  setFocusedNodeId: (nodeId: string | null) => void;
  setActiveFocusPath: (nodeId: string | null, vizData: GraphData | null) => void;
  pinNode: (nodeId: string) => void;
  unpinNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  expandNodeInStore: (nodeId: string) => void;
  toggleCompleted: (nodeId: string) => void;
  setColorByCluster: (value: boolean) => void;
  setGraphRenderPhase: (phase: 'core' | 'full') => void;
  setPerfModeEnabled: (enabled: boolean) => void;
  collapseCluster: (clusterId: string) => void;
  expandCluster: (clusterId: string) => void;
  resetClusterCollapseState: () => void;
  setClusterCollapseEnabled: (enabled: boolean) => void;
  setVisibleNodeIds?: (ids: Set<string>) => void;
}

export const useLocalGraphController = (graphData?: GraphData): GraphController => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [activeFocusPathIds, setActiveFocusPathIds] = useState<Set<string> | null>(null);
  const [pinnedNodes, setPinnedNodes] = useState<Record<string, boolean>>({});
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(new Set());
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [graphRenderPhase, setGraphRenderPhase] = useState<'core' | 'full'>('full');
  const [isPerfModeEnabled, setPerfModeEnabled] = useState(true);
  const [collapsedClusterIds, setCollapsedClusterIds] = useState<Record<string, boolean>>({});
  const [expandedClusterIds, setExpandedClusterIds] = useState<Record<string, boolean>>({});
  const [isClusterCollapseEnabled, setClusterCollapseEnabled] = useState(true);
  const clusters = useMemo(
    () => (graphData ? computeClusters(graphData) : {}),
    [graphData]
  );
  const [colorByCluster, setColorByCluster] = useState(false);

  const setActiveFocusPath = useCallback((nodeId: string | null, vizData: GraphData | null) => {
    if (!nodeId || !vizData) {
      setActiveFocusPathIds(null);
      return;
    }
    const { focusPathIds } = calculateFocusPath(nodeId, vizData);
    setActiveFocusPathIds(focusPathIds);
  }, []);

  const pinNode = useCallback((nodeId: string) => {
    setPinnedNodes((state) => ({ ...state, [nodeId]: true }));
  }, []);

  const unpinNode = useCallback((nodeId: string) => {
    setPinnedNodes((state) => {
      const updated = { ...state };
      delete updated[nodeId];
      return updated;
    });
  }, []);

  const collapseNode = useCallback((nodeId: string) => {
    setCollapsedNodes((state) => ({ ...state, [nodeId]: true }));
  }, []);

  const expandNodeInStore = useCallback((nodeId: string) => {
    setCollapsedNodes((state) => {
      const updated = { ...state };
      delete updated[nodeId];
      return updated;
    });
  }, []);

  const toggleCompleted = useCallback((nodeId: string) => {
    setCompletedNodeIds((state) => {
      const updated = new Set(state);
      if (updated.has(nodeId)) {
        updated.delete(nodeId);
      } else {
        updated.add(nodeId);
      }
      return updated;
    });
  }, []);

  const collapseCluster = useCallback((clusterId: string) => {
    setCollapsedClusterIds((state) => ({ ...state, [clusterId]: true }));
    setExpandedClusterIds((state) => {
      const updated = { ...state };
      delete updated[clusterId];
      return updated;
    });
  }, []);

  const expandCluster = useCallback((clusterId: string) => {
    setExpandedClusterIds((state) => ({ ...state, [clusterId]: true }));
    setCollapsedClusterIds((state) => {
      const updated = { ...state };
      delete updated[clusterId];
      return updated;
    });
  }, []);

  const resetClusterCollapseState = useCallback(() => {
    setCollapsedClusterIds({});
    setExpandedClusterIds({});
  }, []);

  return useMemo(
    () => ({
      selectedNodeId,
      focusedNodeId,
      activeFocusPathIds,
      pinnedNodes,
      completedNodeIds,
      collapsedNodes,
      clusters,
      colorByCluster,
      collapsedClusterIds,
      expandedClusterIds,
      isClusterCollapseEnabled,
      graphRenderPhase,
      isPerfModeEnabled,
      setSelectedNodeId,
      setFocusedNodeId,
      setActiveFocusPath,
      pinNode,
      unpinNode,
      collapseNode,
      expandNodeInStore,
      toggleCompleted,
      setColorByCluster,
      setGraphRenderPhase,
      setPerfModeEnabled,
      collapseCluster,
      expandCluster,
      resetClusterCollapseState,
      setClusterCollapseEnabled,
    }),
    [
      selectedNodeId,
      focusedNodeId,
      activeFocusPathIds,
      pinnedNodes,
      completedNodeIds,
      collapsedNodes,
      clusters,
      colorByCluster,
      collapsedClusterIds,
      expandedClusterIds,
      isClusterCollapseEnabled,
      graphRenderPhase,
      isPerfModeEnabled,
      setActiveFocusPath,
      pinNode,
      unpinNode,
      collapseNode,
      expandNodeInStore,
      toggleCompleted,
      setColorByCluster,
      setGraphRenderPhase,
      setPerfModeEnabled,
      collapseCluster,
      expandCluster,
      resetClusterCollapseState,
      setClusterCollapseEnabled,
    ]
  );
};
