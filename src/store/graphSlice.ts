import { StateCreator } from 'zustand';

export interface GraphSlice {
  selectedNodeId: string | null;
  pinnedNodes: Record<string, boolean>;
  completedNodeIds: Set<string>;
  clusters: Record<string, string>;
  onboardingDismissed: boolean;
  nodeNotes: Record<string, string>;
  visitedNodeIds: string[];
  collapsedNodes: Record<string, boolean>;

  setSelectedNodeId: (nodeId: string | null) => void;
  pinNode: (nodeId: string) => void;
  unpinNode: (nodeId: string) => void;
  markCompleted: (nodeId: string) => void;
  setClusters: (clusters: Record<string, string>) => void;
  setOnboardingDismissed: (dismissed: boolean) => void;
  setNodeNote: (nodeId: string, note: string) => void;
  collapseNode: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
}

export const createGraphSlice: StateCreator<GraphSlice, [], [], GraphSlice> = (set, get) => ({
  selectedNodeId: null,
  pinnedNodes: {},
  completedNodeIds: new Set(),
  clusters: {},
  onboardingDismissed: false,
  nodeNotes: {},
  visitedNodeIds: [],
  collapsedNodes: {},

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
});

