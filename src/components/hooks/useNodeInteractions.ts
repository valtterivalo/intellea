import { useState, useRef, useCallback, useEffect } from 'react';
import { ForceGraphMethods, NodeObject } from 'react-force-graph-3d';
import { useGraphState, GraphData, AppGraphNode } from './useGraphState';
import { useAppStore } from '@/store/useAppStore';

export function useNodeInteractions(
  graphRef: React.RefObject<ForceGraphMethods | undefined>,
  visualizationData: GraphData | undefined,
  onNodeExpand?: (nodeId: string, nodeLabel: string) => void
) {
  const {
    selectedNodeId,
    pinnedNodes,
    setSelectedNodeId,
    setActiveFocusPath,
    pinNode,
    unpinNode,
    collapseNode,
    expandNodeInStore,
    setFocusedNodeId,
  } = useGraphState();

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);

  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickedNodeId = useRef<string | null>(null);

  const handleNodeClick = useCallback(
    (node: NodeObject) => {
      const appNode = node as AppGraphNode;
      if (!appNode.id) return;

      if (clickTimer.current && lastClickedNodeId.current === appNode.id) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        lastClickedNodeId.current = null;
        if (onNodeExpand) {
          onNodeExpand(appNode.id, appNode.label || '');
        }
        return;
      }

      lastClickedNodeId.current = appNode.id;
      clickTimer.current = setTimeout(() => {
        setSelectedNodeId(appNode.id);
        const currentOutput = useAppStore.getState().output;
        const vizData =
          typeof currentOutput === 'object' && currentOutput?.visualizationData
            ? currentOutput.visualizationData
            : null;
        setActiveFocusPath(appNode.id, vizData);

        if (graphRef.current) {
          const focusX = appNode.fx ?? appNode.x ?? 0;
          const focusY = appNode.fy ?? appNode.y ?? 0;
          const focusZ = appNode.fz ?? appNode.z ?? 0;
          const distance = 200;
          const distRatio = 1 + distance / Math.hypot(focusX, focusY, focusZ);
          const newCameraPosition = {
            x: focusX * distRatio,
            y: focusY * distRatio,
            z: focusZ * distRatio,
          };
          const lookAtPosition = { x: focusX, y: focusY, z: focusZ };
          graphRef.current.cameraPosition(
            newCameraPosition,
            lookAtPosition,
            1000
          );
        }
        clickTimer.current = null;
        lastClickedNodeId.current = null;
      }, 300);
    },
    [setSelectedNodeId, setActiveFocusPath, onNodeExpand, graphRef]
  );

  const handleNodeHover = useCallback((node: NodeObject | null) => {
    setHoveredNodeId(node ? (node as AppGraphNode).id : null);
  }, []);

  const handleNodeRightClick = useCallback(
    (node: NodeObject, event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const appNode = node as AppGraphNode;
      setContextMenu({
        nodeId: appNode.id,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const handleContainerRightClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedNodeId) return;
      const key = event.key.toLowerCase();
      if (key === 'p') {
        if (pinnedNodes[selectedNodeId]) {
          unpinNode(selectedNodeId);
        } else {
          pinNode(selectedNodeId);
        }
      } else if (key === 'f') {
        const currentOutput = useAppStore.getState().output;
        const vizData =
          typeof currentOutput === 'object' && currentOutput?.visualizationData
            ? currentOutput.visualizationData
            : null;
        setFocusedNodeId(selectedNodeId);
        setActiveFocusPath(selectedNodeId, vizData);
      } else if (key === 'e') {
        expandNodeInStore(selectedNodeId);
        const appNode = (visualizationData?.nodes || []).find(
          (n) => n.id === selectedNodeId
        );
        if (onNodeExpand && appNode) {
          onNodeExpand(selectedNodeId, appNode.label || '');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNodeId,
    pinnedNodes,
    pinNode,
    unpinNode,
    setActiveFocusPath,
    setFocusedNodeId,
    expandNodeInStore,
    onNodeExpand,
    visualizationData,
  ]);

  return {
    hoveredNodeId,
    contextMenu,
    setContextMenu,
    handleNodeClick,
    handleNodeHover,
    handleNodeRightClick,
    handleContainerRightClick,
    handleCloseContextMenu,
  };
}
