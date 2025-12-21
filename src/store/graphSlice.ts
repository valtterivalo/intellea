/**
 * @fileoverview Zustand store slice.
 * Exports: createGraphSlice, interface
 */
import { StateCreator } from 'zustand';
import type { GraphModeV0 } from '@intellea/graph-schema';

export interface GraphSlice {
  selectedNodeId: string | null;
  pinnedNodes: Record<string, boolean>;
  completedNodeIds: Set<string>;
  clusters: Record<string, string>;
  /** When true, nodes are coloured by cluster instead of depth */
  colorByCluster: boolean;
  onboardingDismissed: boolean;
  nodeNotes: Record<string, string>;
  visitedNodeIds: string[];
  collapsedNodes: Record<string, boolean>;
  /**
   * Set of node IDs currently visible in the graph after applying
   * collapse/expand operations.
   */
  visibleNodeIds: Set<string>;
  /**
   * Cluster-level collapse state (manual mode).
   */
  collapsedClusterIds: Record<string, boolean>;
  /**
   * Cluster-level expansion state (auto mode).
   */
  expandedClusterIds: Record<string, boolean>;
  /**
   * Enables cluster collapse behavior.
   */
  isClusterCollapseEnabled: boolean;
  /**
   * Incrementing counter used to trigger a zoom-to-fit action
   * in graph components via store subscription.
   */
  zoomToFitCount: number;
  /**
   * Render phase used for progressive graph reveal.
   */
  graphRenderPhase: 'core' | 'full';
  /**
   * Enables performance-oriented rendering heuristics.
   */
  isPerfModeEnabled: boolean;
  /**
   * Overrides the graph mode in the renderer.
   */
  graphModeOverride: GraphModeV0 | null;

  setSelectedNodeId: (nodeId: string | null) => void;
  pinNode: (nodeId: string) => void;
  unpinNode: (nodeId: string) => void;
  markCompleted: (nodeId: string) => void;
  toggleCompleted: (nodeId: string) => void;
  setClusters: (clusters: Record<string, string>) => void;
  setOnboardingDismissed: (dismissed: boolean) => void;
  setNodeNote: (nodeId: string, note: string) => void;
  collapseNode: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  /** Replace the currently visible node ID set */
  setVisibleNodeIds: (ids: Set<string>) => void;
  /** Trigger the graph to zoom/pan so all nodes fit in view */
  zoomGraphToFit: () => void;
  setColorByCluster: (value: boolean) => void;
  setGraphRenderPhase: (phase: 'core' | 'full') => void;
  setPerfModeEnabled: (enabled: boolean) => void;
  setGraphModeOverride: (mode: GraphModeV0 | null) => void;
  collapseCluster: (clusterId: string) => void;
  expandCluster: (clusterId: string) => void;
  resetClusterCollapseState: () => void;
  setClusterCollapseEnabled: (enabled: boolean) => void;
}

/**
 * @description Create the graph interaction slice of the store.
 */
export const createGraphSlice: StateCreator<GraphSlice, [], [], GraphSlice> = (set) => ({
  selectedNodeId: null,
  pinnedNodes: {},
  completedNodeIds: new Set(),
  clusters: {},
  colorByCluster: false,
  onboardingDismissed: false,
  nodeNotes: {},
  visitedNodeIds: [],
  collapsedNodes: {},
  visibleNodeIds: new Set(),
  zoomToFitCount: 0,
  graphRenderPhase: 'full',
  isPerfModeEnabled: true,
  graphModeOverride: null,
  collapsedClusterIds: {},
  expandedClusterIds: {},
  isClusterCollapseEnabled: true,

  setSelectedNodeId: (nodeId) =>
    set((state) => {
      if (nodeId === null) {
        return { selectedNodeId: null };
      }
      const ids = state.visitedNodeIds.includes(nodeId)
        ? state.visitedNodeIds
        : [...state.visitedNodeIds, nodeId];
      return { selectedNodeId: nodeId, visitedNodeIds: ids };
    }),
  pinNode: (nodeId) =>
    set((state) => ({
      pinnedNodes: { ...state.pinnedNodes, [nodeId]: true },
    })),
  unpinNode: (nodeId) =>
    set((state) => {
      const updated = { ...state.pinnedNodes };
      delete updated[nodeId];
      return { pinnedNodes: updated };
    }),
  markCompleted: (nodeId) =>
    set((state) => {
      const updated = new Set(state.completedNodeIds);
      updated.add(nodeId);
      return { completedNodeIds: updated };
    }),
  toggleCompleted: (nodeId) =>
    set((state) => {
      const updated = new Set(state.completedNodeIds);
      if (updated.has(nodeId)) {
        updated.delete(nodeId);
      } else {
        updated.add(nodeId);
      }
      return { completedNodeIds: updated };
    }),
  setClusters: (clusters) => set({ clusters }),
  setOnboardingDismissed: (dismissed) => set({ onboardingDismissed: dismissed }),
  setNodeNote: (nodeId, note) =>
    set((state) => ({
      nodeNotes: { ...state.nodeNotes, [nodeId]: note },
    })),
  collapseNode: (nodeId) =>
    set((state) => ({
      collapsedNodes: { ...state.collapsedNodes, [nodeId]: true },
    })),
  expandNode: (nodeId) =>
    set((state) => {
      const updated = { ...state.collapsedNodes };
      delete updated[nodeId];
      return { collapsedNodes: updated };
    }),
  setVisibleNodeIds: (ids) => set({ visibleNodeIds: new Set(ids) }),
  setColorByCluster: (value) => set({ colorByCluster: value }),
  zoomGraphToFit: () =>
    set((state) => ({ zoomToFitCount: state.zoomToFitCount + 1 })),
  setGraphRenderPhase: (phase) => set({ graphRenderPhase: phase }),
  setPerfModeEnabled: (enabled) => set({ isPerfModeEnabled: enabled }),
  setGraphModeOverride: (mode) => set({ graphModeOverride: mode }),
  collapseCluster: (clusterId) =>
    set((state) => ({
      collapsedClusterIds: { ...state.collapsedClusterIds, [clusterId]: true },
      expandedClusterIds: Object.fromEntries(
        Object.entries(state.expandedClusterIds).filter(([id]) => id !== clusterId)
      ),
    })),
  expandCluster: (clusterId) =>
    set((state) => ({
      expandedClusterIds: { ...state.expandedClusterIds, [clusterId]: true },
      collapsedClusterIds: Object.fromEntries(
        Object.entries(state.collapsedClusterIds).filter(([id]) => id !== clusterId)
      ),
    })),
  resetClusterCollapseState: () =>
    set({ collapsedClusterIds: {}, expandedClusterIds: {} }),
  setClusterCollapseEnabled: (enabled) => set({ isClusterCollapseEnabled: enabled }),
});
