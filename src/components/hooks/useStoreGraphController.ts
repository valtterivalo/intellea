/**
 * @fileoverview App-specific graph controller backed by the store.
 * Exports: useStoreGraphController
 */

import { useAppStore } from '@/store/useAppStore';
import type { GraphController } from '@intellea/graph-renderer';

export const useStoreGraphController = (): GraphController => ({
  selectedNodeId: useAppStore((state) => state.selectedNodeId),
  focusedNodeId: useAppStore((state) => state.focusedNodeId),
  activeFocusPathIds: useAppStore((state) => state.activeFocusPathIds),
  pinnedNodes: useAppStore((state) => state.pinnedNodes),
  completedNodeIds: useAppStore((state) => state.completedNodeIds),
  collapsedNodes: useAppStore((state) => state.collapsedNodes),
  clusters: useAppStore((state) => state.clusters),
  colorByCluster: useAppStore((state) => state.colorByCluster),
  collapsedClusterIds: useAppStore((state) => state.collapsedClusterIds),
  expandedClusterIds: useAppStore((state) => state.expandedClusterIds),
  isClusterCollapseEnabled: useAppStore((state) => state.isClusterCollapseEnabled),
  graphRenderPhase: useAppStore((state) => state.graphRenderPhase),
  isPerfModeEnabled: useAppStore((state) => state.isPerfModeEnabled),
  setSelectedNodeId: useAppStore((state) => state.setSelectedNodeId),
  setFocusedNodeId: useAppStore((state) => state.setFocusedNodeId),
  setActiveFocusPath: useAppStore((state) => state.setActiveFocusPath),
  pinNode: useAppStore((state) => state.pinNode),
  unpinNode: useAppStore((state) => state.unpinNode),
  collapseNode: useAppStore((state) => state.collapseNode),
  expandNodeInStore: useAppStore((state) => state.expandNode),
  toggleCompleted: useAppStore((state) => state.toggleCompleted),
  setColorByCluster: useAppStore((state) => state.setColorByCluster),
  setGraphRenderPhase: useAppStore((state) => state.setGraphRenderPhase),
  setPerfModeEnabled: useAppStore((state) => state.setPerfModeEnabled),
  collapseCluster: useAppStore((state) => state.collapseCluster),
  expandCluster: useAppStore((state) => state.expandCluster),
  resetClusterCollapseState: useAppStore((state) => state.resetClusterCollapseState),
  setClusterCollapseEnabled: useAppStore((state) => state.setClusterCollapseEnabled),
  setVisibleNodeIds: useAppStore((state) => state.setVisibleNodeIds),
});
