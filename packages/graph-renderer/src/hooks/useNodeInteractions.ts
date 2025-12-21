/**
 * @fileoverview React component.
 * Exports: useNodeInteractions
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { NodeObject, GraphData } from '@intellea/graph-schema';
import { useGraphState, AppGraphNode } from './useGraphState';
import type { GraphRendererHandle } from '../components/graph/GraphRendererHandle';
import type { GraphController } from './graphController';

/**
 * @description Provide event handlers and state for graph node interactions.
 * @param graphRef - Ref to the force-graph instance.
 * @param visualizationData - Graph data currently displayed.
 * @param onNodeExpand - Optional callback when a node should expand.
 */
export function useNodeInteractions(
  graphRef: React.RefObject<GraphRendererHandle | null>,
  visualizationData: GraphData | undefined,
  onNodeExpand?: (nodeId: string, nodeLabel: string) => void,
  controller?: GraphController
) {
  const {
    selectedNodeId,
    pinnedNodes,
    setSelectedNodeId,
    setActiveFocusPath,
    pinNode,
    unpinNode,
    expandNodeInStore,
    setFocusedNodeId,
    collapsedNodes,
    isPerfModeEnabled,
  } = useGraphState(visualizationData, controller);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);
  const hoverRafRef = useRef<number | null>(null);
  const lastHoverTimeRef = useRef(0);
  const pendingHoverIdRef = useRef<string | null>(null);
  const nodeCount = visualizationData?.nodes.length ?? 0;
  const shouldThrottleHover = isPerfModeEnabled && nodeCount >= 1200;
  const hoverThrottleMs = useMemo(() => (nodeCount >= 4000 ? 90 : 60), [nodeCount]);

  const handleExpandNode = useCallback(
    (nodeId: string) => {
      const fullVisualizationData = visualizationData ?? null;

      if (!fullVisualizationData) {
        console.warn('handleExpandNode: No full visualization data available.');
        return;
      }

      if (collapsedNodes[nodeId]) {
        expandNodeInStore(nodeId);
        return;
      }

      const childrenIds = fullVisualizationData.links
        .filter((link) => {
          const sourceId =
            typeof link.source === 'object' && link.source !== null
              ? (link.source as AppGraphNode).id
              : link.source;
          return sourceId === nodeId;
        })
        .map((link) => {
          const targetId =
            typeof link.target === 'object' && link.target !== null
              ? (link.target as AppGraphNode).id
              : (link.target as string);
          return targetId;
        });

      const collapsedChildrenIds = childrenIds.filter((id) => id && collapsedNodes[id]);

      if (collapsedChildrenIds.length > 0) {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true')
          console.log(
            `Expanding ${collapsedChildrenIds.length} collapsed child nodes for ${nodeId}`
          );
        collapsedChildrenIds.forEach((childId) => {
          if (childId) expandNodeInStore(childId);
        });
        return;
      }
      
      const hasVisibleChildren = childrenIds.some((id) => id && !collapsedNodes[id]);

      if (hasVisibleChildren) {
        const node = fullVisualizationData.nodes.find((n) => n.id === nodeId);
        if (onNodeExpand && node) {
          onNodeExpand(nodeId, node.label || '');
        }
        return;
      }

      if (process.env.NEXT_PUBLIC_DEBUG === 'true')
        console.log(
          `No collapsed children for ${nodeId}, proceeding with API expansion.`
        );
      const node = fullVisualizationData.nodes.find((n) => n.id === nodeId);
      if (onNodeExpand && node) {
        onNodeExpand(nodeId, node.label || '');
      }
    },
    [onNodeExpand, expandNodeInStore, collapsedNodes, visualizationData]
  );

  const handleNodeClick = useCallback(
    (node: NodeObject, event: MouseEvent) => {
      const appNode = node as AppGraphNode;
      if (!appNode.id) return;

      setSelectedNodeId(appNode.id);

      const vizData = visualizationData ?? null;

      const isRootNode = vizData?.nodes.find((n) => n.id === appNode.id && n.isRoot);
      if (!isRootNode) {
        setActiveFocusPath(appNode.id, vizData);
      }

      const shouldExpand = event.detail > 1 || event.shiftKey;
      if (shouldExpand) {
        handleExpandNode(appNode.id);
        return;
      }

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
        graphRef.current.cameraPosition(newCameraPosition, lookAtPosition, 1000);
      }
    },
    [setSelectedNodeId, setActiveFocusPath, handleExpandNode, graphRef, visualizationData]
  );

  const handleNodeHover = useCallback(
    (node: NodeObject | null) => {
      const nextId = node ? (node as AppGraphNode).id : null;
      if (!shouldThrottleHover) {
        setHoveredNodeId(nextId);
        return;
      }
      pendingHoverIdRef.current = nextId;
      const now = performance.now();
      if (now - lastHoverTimeRef.current >= hoverThrottleMs && hoverRafRef.current === null) {
        lastHoverTimeRef.current = now;
        const pending = pendingHoverIdRef.current;
        pendingHoverIdRef.current = null;
        setHoveredNodeId(pending ?? null);
        return;
      }
      if (hoverRafRef.current !== null) return;
      hoverRafRef.current = window.requestAnimationFrame(() => {
        hoverRafRef.current = null;
        lastHoverTimeRef.current = performance.now();
        const pending = pendingHoverIdRef.current;
        pendingHoverIdRef.current = null;
        setHoveredNodeId(pending ?? null);
      });
    },
    [shouldThrottleHover, hoverThrottleMs]
  );

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
    return () => {
      if (hoverRafRef.current !== null) {
        window.cancelAnimationFrame(hoverRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedNodeId) return;
      const vizData = visualizationData ?? null;
      const key = event.key.toLowerCase();
      if (key === 'p') {
        if (pinnedNodes[selectedNodeId]) {
          unpinNode(selectedNodeId);
        } else {
          pinNode(selectedNodeId);
        }
      } else if (key === 'f') {
        setFocusedNodeId(selectedNodeId);
        setActiveFocusPath(selectedNodeId, vizData);
      } else if (key === 'e') {
        handleExpandNode(selectedNodeId);
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
    handleExpandNode,
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
    handleExpandNode,
  };
}
