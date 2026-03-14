/**
 * @fileoverview Graph view controls for camera, sizing, and auto-fit.
 * Exports: useGraphViewControls
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { GraphRendererHandle } from '../components/graph/GraphRendererHandle';
import type { AppGraphNode } from './useGraphState';
import type { GraphData } from '@intellea/graph-schema';
import type { GraphDimensions } from './useGraphDimensions';

interface GraphViewControlsInput {
  graphRef: React.RefObject<GraphRendererHandle | null>;
  dimensions: GraphDimensions;
  isAutoRotateEnabled: boolean;
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  visualizationData?: GraphData;
  renderData?: GraphData;
}

export const useGraphViewControls = ({
  graphRef,
  dimensions,
  isAutoRotateEnabled,
  selectedNodeId,
  focusedNodeId,
  visualizationData,
  renderData,
}: GraphViewControlsInput) => {
  useEffect(() => {
    const controls = graphRef.current?.controls();
    if (!controls) return;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = isAutoRotateEnabled;
    controls.autoRotateSpeed = 2.0;
  }, [graphRef, isAutoRotateEnabled, dimensions]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    if (isAutoRotateEnabled) {
      graph.resumeAnimation();
      return;
    }
    graph.pauseAnimation();
  }, [graphRef, isAutoRotateEnabled]);

  const handleZoomToFit = useCallback(() => {
    if (graphRef.current?.zoomToFit) {
      graphRef.current.zoomToFit(600, 80);
    }
  }, [graphRef]);

  const graphSignature = useMemo(() => {
    if (!renderData) return '';
    return `${renderData.nodes.length}:${renderData.links.length}`;
  }, [renderData]);

  const lastAutoFitSignatureRef = useRef<string>('');

  useEffect(() => {
    if (!graphRef.current?.zoomToFit) return;
    if (!renderData || renderData.nodes.length === 0) return;
    if (selectedNodeId || focusedNodeId) return;
    if (graphSignature === lastAutoFitSignatureRef.current) return;
    lastAutoFitSignatureRef.current = graphSignature;
    const timeout = setTimeout(() => {
      graphRef.current?.zoomToFit?.(600, 80);
    }, 150);
    return () => clearTimeout(timeout);
  }, [graphSignature, renderData, selectedNodeId, focusedNodeId, graphRef]);

  useEffect(() => {
    const nodes = (visualizationData?.nodes ?? []) as AppGraphNode[];

    if (focusedNodeId && graphRef.current && nodes.length > 0) {
      const node = nodes.find((n) => n.id === focusedNodeId);
      if (node) {
        const focusX = node.fx ?? node.x ?? 0;
        const focusY = node.fy ?? node.y ?? 0;
        const focusZ = node.fz ?? node.z ?? 0;

        if (focusX !== 0 || focusY !== 0 || focusZ !== 0) {
          const distance = 200;
          const distRatio = 1 + distance / Math.hypot(focusX, focusY, focusZ);
          const newCameraPosition = {
            x: focusX * distRatio,
            y: focusY * distRatio,
            z: focusZ * distRatio,
          };
          const lookAtPosition = { x: focusX, y: focusY, z: focusZ };
          graphRef.current.cameraPosition(newCameraPosition, lookAtPosition, 1000);
        } else if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.warn(
            `VisComp: Could not focus on node ${focusedNodeId} - position is at origin or undefined.`
          );
        }
      } else if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.warn(
          `VisComp: Could not focus on node ${focusedNodeId} - not found.`
        );
      }
    }
  }, [focusedNodeId, visualizationData, graphRef]);

  return { handleZoomToFit };
};
