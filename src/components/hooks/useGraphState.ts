import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { NodeObject, LinkObject } from 'react-force-graph-3d';

export interface AppGraphNode extends NodeObject {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

export interface AppGraphLink extends LinkObject {
  source: string | AppGraphNode;
  target: string | AppGraphNode;
}

export interface GraphData {
  nodes: Array<AppGraphNode>;
  links: Array<AppGraphLink>;
}

export function useGraphState(visualizationData?: GraphData) {
  const focusedNodeId = useAppStore((state) => state.focusedNodeId);
  const activeFocusPathIds = useAppStore((state) => state.activeFocusPathIds);
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const pinnedNodes = useAppStore((state) => state.pinnedNodes);
  const clusters = useAppStore((state) => state.clusters);
  const collapsedNodes = useAppStore((state) => state.collapsedNodes);
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId);
  const setActiveFocusPath = useAppStore((state) => state.setActiveFocusPath);
  const pinNode = useAppStore((state) => state.pinNode);
  const unpinNode = useAppStore((state) => state.unpinNode);
  const collapseNode = useAppStore((state) => state.collapseNode);
  const expandNodeInStore = useAppStore((state) => state.expandNode);
  const setFocusedNodeId = useAppStore((state) => state.setFocusedNodeId);

  const visibleData: GraphData | undefined = React.useMemo(() => {
    if (!visualizationData) return undefined;
    const filteredNodes = visualizationData.nodes.filter(
      (n) => !collapsedNodes[n.id]
    );
    const visibleIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = visualizationData.links.filter((l) => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      return visibleIds.has(s) && visibleIds.has(t);
    });
    return { nodes: filteredNodes, links: filteredLinks };
  }, [visualizationData, collapsedNodes]);

  return {
    focusedNodeId,
    activeFocusPathIds,
    selectedNodeId,
    pinnedNodes,
    clusters,
    collapsedNodes,
    setSelectedNodeId,
    setActiveFocusPath,
    pinNode,
    unpinNode,
    collapseNode,
    expandNodeInStore,
    setFocusedNodeId,
    visibleData,
  };
}
