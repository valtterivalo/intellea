'use client';
/**
 * @fileoverview React component.
 * Exports: VisualizationComponent
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import GraphControlsOverlay from './GraphControlsOverlay';
import GraphPerfOverlay from './graph/GraphPerfOverlay';
import GraphContextMenu from './graph/GraphContextMenu';
import GraphCanvasRenderer from './graph/GraphCanvasRenderer';
import type { GraphRendererHandle } from './graph/GraphRendererHandle';
import { useGraphState, AppGraphNode } from '../hooks/useGraphState';
import type { GraphData } from '@intellea/graph-schema';
import { useNodeInteractions } from '../hooks/useNodeInteractions';
import { useGraphStyling } from '../hooks/useGraphStyling';
import { useGraphDimensions } from '../hooks/useGraphDimensions';
import { useGraphRenderFps } from '../hooks/useGraphRenderFps';
import { useGraphViewControls } from '../hooks/useGraphViewControls';
import type { GraphController } from '../hooks/graphController';
import type { GraphEdgeTypeV0, GraphLabelDensityV0 } from '@intellea/graph-schema';
import { getGraphPerfProfile, selectCoreNodeIds } from '../lib/graphPerf';

interface VisualizationComponentProps {
  visualizationData?: GraphData;
  onNodeExpand?: (nodeId: string, nodeLabel: string) => void; 
  expandingNodeId?: string | null;
  labelDensity?: GraphLabelDensityV0;
  emphasisNodeIds?: string[];
  emphasisEdgeTypes?: GraphEdgeTypeV0[];
  controller?: GraphController;
  showControls?: boolean;
  showPerfOverlay?: boolean;
}

// Define theme colors — dark background matching the site theme
const themeColors = {
  background: '#0D1118',
  nodeBase: '#8B9DB5',
  nodeHover: '#B8CAE0',
  nodeExpanding: '#0AFFD9',
  nodeMuted: 'rgba(140, 165, 200, 0.12)',
  link: 'rgba(140, 165, 200, 0.22)',
  label: '#C8D3E4',
};

// Legacy palette removed in favour of depth-based colours

const VisualizationComponent = React.forwardRef<GraphRendererHandle, VisualizationComponentProps>(
  function VisualizationComponent(
    {
      visualizationData,
      onNodeExpand,
      expandingNodeId,
      labelDensity,
      emphasisNodeIds,
      emphasisEdgeTypes,
      controller,
      showControls = true,
      showPerfOverlay = true,
    },
    forwardedRef
  ) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<GraphRendererHandle | null>(null);

  // Forward the ref to parent if provided
  React.useImperativeHandle(
    forwardedRef,
    () => ({
      cameraPosition: (...args) => {
        if (!graphRef.current) throw new Error('Graph renderer is not ready');
        return graphRef.current.cameraPosition(...args);
      },
      zoomToFit: (...args) => {
        if (!graphRef.current) throw new Error('Graph renderer is not ready');
        return graphRef.current.zoomToFit(...args);
      },
      pauseAnimation: () => {
        if (!graphRef.current) throw new Error('Graph renderer is not ready');
        return graphRef.current.pauseAnimation();
      },
      resumeAnimation: () => {
        if (!graphRef.current) throw new Error('Graph renderer is not ready');
        return graphRef.current.resumeAnimation();
      },
      controls: () => {
        if (!graphRef.current) throw new Error('Graph renderer is not ready');
        return graphRef.current.controls();
      },
      renderer: () => {
        if (!graphRef.current) throw new Error('Graph renderer is not ready');
        return graphRef.current.renderer();
      },
    }),
    []
  );
  const dimensions = useGraphDimensions(containerRef);
  const [isAutoRotateEnabled, setIsAutoRotateEnabled] = useState(false);
  const [labelVisibilityOverride, setLabelVisibilityOverride] = useState<boolean | null>(null);
  const areAllLabelsVisible =
    labelVisibilityOverride ?? (labelDensity ? labelDensity === 'high' : false);
  const simFps: number | null = null;
  const shouldShowPerfStats = showPerfOverlay && process.env.NEXT_PUBLIC_DEBUG === 'true';
  const renderFps = useGraphRenderFps(shouldShowPerfStats);

  const {
    focusedNodeId,
    activeFocusPathIds,
    selectedNodeId,
    pinnedNodes,
    completedNodeIds,
    collapseNode,
    setSelectedNodeId,
    setActiveFocusPath,
    pinNode,
    unpinNode,
    setFocusedNodeId,
    clusters,
    visibleData,
    colorByCluster,
    setColorByCluster,
    isClusterCollapsed,
    collapseCluster,
    expandCluster,
    isClusterCollapseEnabled,
    setClusterCollapseEnabled,
    graphRenderPhase,
    setGraphRenderPhase,
    isPerfModeEnabled,
    setPerfModeEnabled,
  } = useGraphState(visualizationData, controller);

  const fullNodeCount = visualizationData?.nodes.length ?? 0;

  const perfProfile = React.useMemo(() => {
    return getGraphPerfProfile(fullNodeCount, isPerfModeEnabled);
  }, [fullNodeCount, isPerfModeEnabled]);

  const priorityNodeIds = React.useMemo(() => {
    const ids = new Set<string>();
    visibleData?.nodes.forEach((node) => {
      if ((node as AppGraphNode).isRoot) {
        ids.add(node.id);
      }
    });
    if (selectedNodeId) ids.add(selectedNodeId);
    if (focusedNodeId) ids.add(focusedNodeId);
    activeFocusPathIds?.forEach((id) => ids.add(id));
    emphasisNodeIds?.forEach((id) => ids.add(id));
    Object.keys(pinnedNodes).forEach((id) => ids.add(id));
    return ids;
  }, [
    visibleData,
    selectedNodeId,
    focusedNodeId,
    activeFocusPathIds,
    emphasisNodeIds,
    pinnedNodes,
  ]);

  const renderData = React.useMemo(() => {
    if (!visibleData) return undefined;
    if (!perfProfile.progressiveEnabled || graphRenderPhase === 'full') {
      return visibleData;
    }
    const coreIds = selectCoreNodeIds(
      visibleData,
      perfProfile.progressiveNodeCap,
      priorityNodeIds
    );
    const nodes = visibleData.nodes.filter((node) => coreIds.has(node.id));
    const links = visibleData.links.filter((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return coreIds.has(sourceId) && coreIds.has(targetId);
    });
    return { nodes, links };
  }, [visibleData, perfProfile, graphRenderPhase, priorityNodeIds]);

  const renderNodeCount = renderData?.nodes.length ?? 0;
  const shouldEnablePointerInteraction = !isPerfModeEnabled || renderNodeCount < 900;

  const fixedNodeRatio = React.useMemo(() => {
    if (!renderData || renderData.nodes.length === 0) return 0;
    const sampleSize = Math.min(renderData.nodes.length, 800);
    let fixedCount = 0;
    for (let index = 0; index < sampleSize; index += 1) {
      const node = renderData.nodes[index];
      if (
        typeof node.fx === 'number' ||
        typeof node.fy === 'number' ||
        typeof node.fz === 'number'
      ) {
        fixedCount += 1;
      }
    }
    return fixedCount / sampleSize;
  }, [renderData]);

  const shouldDisableSimulation =
    isPerfModeEnabled &&
    fixedNodeRatio > 0.9 &&
    (renderData?.nodes.length ?? 0) > 400;

  const pixelRatioCap = React.useMemo(() => {
    if (!isPerfModeEnabled) return 2;
    if (fullNodeCount >= 7000 || renderNodeCount >= 1800) return 0.85;
    if (fullNodeCount >= 5000 || renderNodeCount >= 1500) return 0.95;
    if (fullNodeCount >= 3000 || renderNodeCount >= 1200) return 1.05;
    if (fullNodeCount >= 1500 || renderNodeCount >= 900) return 1.2;
    return 1.5;
  }, [isPerfModeEnabled, fullNodeCount, renderNodeCount]);

  const antialiasEnabled = !isPerfModeEnabled || fullNodeCount < 1500;
  // decouple lighting from perf toggle to avoid full scene recreation on toggle
  const useLighting = fullNodeCount < 1200;

  useEffect(() => {
    const renderer = graphRef.current?.renderer?.();
    if (!renderer) return;
    const deviceRatio =
      typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    const nextRatio = Math.min(deviceRatio, pixelRatioCap);
    renderer.setPixelRatio(nextRatio);
  }, [graphRef, pixelRatioCap, dimensions.width, dimensions.height]);

  const {
    hoveredNodeId,
    contextMenu,
    setContextMenu,
    handleNodeClick,
    handleNodeHover,
    handleNodeRightClick,
    handleContainerRightClick,
    handleCloseContextMenu,
    handleExpandNode,
  } = useNodeInteractions(graphRef, visualizationData, onNodeExpand, controller);
  const {
    getNodeColor,
    getNodeVal,
    getNodeThreeObject,
    getLinkColor,
  } = useGraphStyling({
    visibleData: renderData,
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
    labelCulling: {
      maxLabelCount: perfProfile.maxLabelCount,
      priorityNodeIds,
    },
    linkWidthScale: perfProfile.linkWidthScale,
    linkParticleScale: perfProfile.linkParticleScale,
    themeColors: {
      nodeHover: themeColors.nodeHover,
      nodeExpanding: themeColors.nodeExpanding,
      nodeMuted: themeColors.nodeMuted,
      link: themeColors.link,
      label: themeColors.label,
    },
  });

  const handleBackgroundClick = useCallback(() => {
    setSelectedNodeId(null);
    setActiveFocusPath(null, null);
    setFocusedNodeId(null);
  }, [setActiveFocusPath, setFocusedNodeId, setSelectedNodeId]);

  const handleToggleLabels = useCallback(() => {
    setLabelVisibilityOverride((current) => {
      const base = current ?? (labelDensity ? labelDensity === 'high' : false);
      return !base;
    });
  }, [labelDensity]);

  const { handleZoomToFit } = useGraphViewControls({
    graphRef,
    dimensions,
    isAutoRotateEnabled,
    selectedNodeId,
    focusedNodeId,
    visualizationData,
    renderData,
  });
  useEffect(() => {
    if (!perfProfile.progressiveEnabled) return;
    if (graphRenderPhase === 'full') return;
    const maxAutoPromoteNodes = 2200;
    if ((visibleData?.nodes.length ?? 0) > maxAutoPromoteNodes) return;
    const timeout = setTimeout(() => {
      setGraphRenderPhase('full');
    }, 500);
    return () => clearTimeout(timeout);
  }, [perfProfile.progressiveEnabled, graphRenderPhase, visibleData, setGraphRenderPhase]);

  const handleTogglePerfMode = () => {
    const nextEnabled = !isPerfModeEnabled;
    setPerfModeEnabled(nextEnabled);
    setGraphRenderPhase(nextEnabled ? 'core' : 'full');
  };

  // --- Render --- 
  if (!visualizationData) {
    return <div ref={containerRef} className="w-full h-64 bg-muted flex items-center justify-center"><p className="text-muted-foreground italic text-sm">No visualization data available.</p></div>;
  }

  if (dimensions.width === 0 || dimensions.height === 0) {
      return (
          <div 
              ref={containerRef} 
              className="w-full aspect-video bg-card rounded-md border border-border shadow-sm min-h-[300px] flex items-center justify-center"
              style={{ minHeight: '300px', position: 'relative' }}
          >
              <p className="text-muted-foreground italic text-sm p-4">Measuring container...</p>
          </div>
      );
  }
  
  // console.log("[Render] Rendering ForceGraph3DComponent with dimensions:", dimensions);
  // console.log("[Render] Graph Data Nodes:", visualizationData.nodes.length, "Links:", visualizationData.links.length);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full aspect-video bg-card rounded-md border border-border shadow-sm overflow-hidden relative min-h-[300px]"
        style={{ minHeight: '300px', position: 'relative' }}
        onClick={handleCloseContextMenu}
      >
        <div style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <GraphCanvasRenderer
            ref={graphRef}
            data={renderData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={themeColors.background}
            antialias={antialiasEnabled}
            useLighting={useLighting}
            getNodeColor={getNodeColor}
            getNodeVal={getNodeVal}
            getLinkColor={getLinkColor}
            getNodeSprite={getNodeThreeObject}
            enablePointerInteraction={shouldEnablePointerInteraction}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onNodeRightClick={handleNodeRightClick}
            onBackgroundClick={handleBackgroundClick}
            onBackgroundRightClick={handleContainerRightClick}
          />
        </div>
        {shouldShowPerfStats && (
          <GraphPerfOverlay
            renderFps={renderFps}
            simFps={simFps}
            fullCounts={{
              nodes: visualizationData.nodes.length,
              links: visualizationData.links.length,
            }}
            visibleCounts={{
              nodes: visibleData?.nodes.length ?? 0,
              links: visibleData?.links.length ?? 0,
            }}
            renderCounts={{
              nodes: renderData?.nodes.length ?? 0,
              links: renderData?.links.length ?? 0,
            }}
            phase={graphRenderPhase}
            labelCount={perfProfile.maxLabelCount}
            isSimDisabled={shouldDisableSimulation}
            isPointerEnabled={shouldEnablePointerInteraction}
          />
        )}
        {showControls && (
          <GraphControlsOverlay
            isAutoRotateEnabled={isAutoRotateEnabled}
            areAllLabelsVisible={areAllLabelsVisible}
            isClusterColorEnabled={colorByCluster}
            isPerfModeEnabled={isPerfModeEnabled}
            isClusterCollapseEnabled={isClusterCollapseEnabled}
            onToggleAutoRotate={() => setIsAutoRotateEnabled((prev) => !prev)}
            onToggleLabels={handleToggleLabels}
            onToggleClusterColor={() => setColorByCluster(!colorByCluster)}
            onToggleClusterCollapse={() => setClusterCollapseEnabled(!isClusterCollapseEnabled)}
            onTogglePerfMode={handleTogglePerfMode}
            onZoomToFit={handleZoomToFit}
          />
        )}
      </div>
      
      <GraphContextMenu
        contextMenu={contextMenu}
        pinnedNodes={pinnedNodes}
        clusters={clusters}
        isClusterCollapsed={isClusterCollapsed}
        onTogglePin={(nodeId) => {
          if (pinnedNodes[nodeId]) {
            unpinNode(nodeId);
          } else {
            pinNode(nodeId);
          }
        }}
        onToggleCluster={(clusterId) => {
          if (isClusterCollapsed(clusterId)) {
            expandCluster(clusterId);
          } else {
            collapseCluster(clusterId);
          }
        }}
        onCollapseNode={collapseNode}
        onExpandNode={handleExpandNode}
        onClose={handleCloseContextMenu}
      />
    </div>
  );
});

export default VisualizationComponent;
