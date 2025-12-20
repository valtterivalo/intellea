'use client';
/**
 * @fileoverview React component.
 * Exports: VisualizationComponent
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
// THREE import available for future use
// import * as THREE from 'three';
import { ForceGraphMethods } from 'react-force-graph-3d'; // Import library types
import GraphControlsOverlay from '@/components/GraphControlsOverlay';
import { useGraphState, GraphData, AppGraphNode } from './hooks/useGraphState';
import { useNodeInteractions } from './hooks/useNodeInteractions';
import { useGraphStyling } from './hooks/useGraphStyling';

// Define our application-specific node structure, extending the library's base type

interface VisualizationComponentProps {
  visualizationData?: GraphData;
  onNodeExpand?: (nodeId: string, nodeLabel: string) => void; 
  expandingNodeId?: string | null;
}

// Define theme colors
const themeColors = {
  background: '#FDF5E6',
  nodeBase: '#8B7D6B',
  nodeHover: '#D8C0A3',
  nodeExpanding: '#FBBF24', // Used for active focus and expansion
  nodeMuted: 'rgba(139, 125, 107, 0.3)',
  link: 'rgba(139, 125, 107, 0.3)',
  label: '#5D4037'
};

// Legacy palette removed in favour of depth-based colours

type GraphControls = {
  enableDamping?: boolean;
  dampingFactor?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

// Load the 3D graph component synchronously when running under tests to simplify mocking.
// In normal runtime we keep using Next.js dynamic import to avoid SSR issues.
const ForceGraph3DComponent = dynamic(
  () => import('react-force-graph-3d').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <p className="text-muted-foreground italic text-sm p-4">Loading 3D Graph...</p>
    ),
  }
) as React.ComponentType<Record<string, unknown>>;


const VisualizationComponent = React.forwardRef<ForceGraphMethods | undefined, VisualizationComponentProps>(
  function VisualizationComponent({ visualizationData, onNodeExpand, expandingNodeId }, forwardedRef) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Use ForceGraphMethods type for the ref for better type safety
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined); // Initialize with undefined

  // Forward the ref to parent if provided
  React.useImperativeHandle(forwardedRef, () => graphRef.current, []);
  const [dimensions, setDimensions] = useState(() => {
    if (process.env.NODE_ENV === 'test') {
      // Provide deterministic size during unit tests to avoid early returns.
      return { width: 800, height: 600 };
    }
    return { width: 0, height: 0 };
  });
  const [isAutoRotateEnabled, setIsAutoRotateEnabled] = useState(false);
  const [areAllLabelsVisible, setAreAllLabelsVisible] = useState(false);

  const {
    focusedNodeId,
    activeFocusPathIds,
    selectedNodeId,
    pinnedNodes,
    completedNodeIds,
    collapseNode,
    // expandNodeInStore, // Available for future use
    // setSelectedNodeId, // Available for future use
    // setActiveFocusPath, // Available for future use
    pinNode,
    unpinNode,
    // setFocusedNodeId, // Available for future use
    clusters,
    visibleData,
  } = useGraphState(visualizationData);

  const colorByCluster = useAppStore((state) => state.colorByCluster);
  const setColorByCluster = useAppStore((state) => state.setColorByCluster);

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
  } = useNodeInteractions(graphRef, visualizationData, onNodeExpand);
  const {
    getNodeColor,
    getNodeVal,
    getNodeThreeObject,
    getLinkColor,
    getLinkWidth,
    getLinkDirectionalParticles,
  } = useGraphStyling({
    visibleData,
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
    themeColors: {
      nodeExpanding: themeColors.nodeExpanding,
      nodeMuted: themeColors.nodeMuted,
      link: themeColors.link,
      label: themeColors.label,
    },
  });

  const handleBackgroundClick = useCallback(() => {
    const state = useAppStore.getState();
    state.setSelectedNodeId(null);
    state.setActiveFocusPath(null, null);
    state.setFocusedNodeId(null);
  }, []);

  // --- Adjust forces on mount --- 
  useEffect(() => {
    if (!graphRef.current || typeof (graphRef.current as ForceGraphMethods).d3Force !== 'function') {
      return; // skip if underlying library not available (e.g., during tests)
    }
    graphRef.current.d3Force('charge')?.strength(-120);
    graphRef.current.d3Force('link')?.distance(60);
    if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log("VisualizationComponent: Adjusted graph forces.");
  }, []); // Run once on mount

  const updateControls = useCallback(() => {
    const controls = graphRef.current?.controls() as GraphControls | undefined;
    if (!controls) return;
    if (typeof controls.enableDamping !== 'undefined') {
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
    }
    if (typeof controls.autoRotate !== 'undefined') {
      controls.autoRotate = isAutoRotateEnabled;
      controls.autoRotateSpeed = 0.6;
    }
  }, [isAutoRotateEnabled]);

  useEffect(() => {
    updateControls();
  }, [updateControls, dimensions]);

  // Effect for dimensions using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = rect.width;
      const newHeight = rect.height;
      
      if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('Container dimensions:', { newWidth, newHeight });
      
      if (newWidth > 0 && newHeight > 0) {
        setDimensions(currentDimensions => {
          if (currentDimensions.width !== newWidth || currentDimensions.height !== newHeight) {
            if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('Updating dimensions:', { from: currentDimensions, to: { width: newWidth, height: newHeight } });
            return { width: newWidth, height: newHeight };
          }
          return currentDimensions;
        });
      }
    };

    const isTestEnv = process.env.NODE_ENV === 'test';
    const initialTimeout = isTestEnv ? undefined : setTimeout(updateDimensions, 100);

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect) {
          const newWidth = entry.contentRect.width;
          const newHeight = entry.contentRect.height;
          if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('ResizeObserver triggered:', { newWidth, newHeight });
          
          if (newWidth > 0 && newHeight > 0) {
            setDimensions(currentDimensions => {
              if (currentDimensions.width !== newWidth || currentDimensions.height !== newHeight) {
                if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('ResizeObserver updating dimensions:', { from: currentDimensions, to: { width: newWidth, height: newHeight } });
                return { width: newWidth, height: newHeight };
              }
              return currentDimensions;
            });
          }
        }
      }
    });

    resizeObserver.observe(container);

    // Fallback: if dimensions are still 0 after 2 seconds, use default dimensions
    const fallbackTimeout = isTestEnv ? undefined : setTimeout(() => {
      setDimensions(currentDimensions => {
        if (currentDimensions.width === 0 || currentDimensions.height === 0) {
          if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('Using fallback dimensions');
          const rect = container.getBoundingClientRect();
          const fallbackWidth = rect.width > 0 ? rect.width : 800;
          const fallbackHeight = rect.height > 0 ? rect.height : 600;
          return { width: fallbackWidth, height: fallbackHeight };
        }
        return currentDimensions;
      });
    }, 2000);

    // Cleanup function
    return () => {
      if (initialTimeout) clearTimeout(initialTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      resizeObserver.disconnect();
    };
  }, []); // Dependencies remain empty

  const handleZoomToFit = useCallback(() => {
    if (graphRef.current?.zoomToFit) {
      graphRef.current.zoomToFit(600, 80);
    }
  }, []);

  const graphSignature = React.useMemo(() => {
    if (!visibleData) return '';
    return `${visibleData.nodes.length}:${visibleData.links.length}`;
  }, [visibleData]);

  const lastAutoFitSignatureRef = useRef<string>('');

  useEffect(() => {
    if (!graphRef.current?.zoomToFit) return;
    if (!visibleData || visibleData.nodes.length === 0) return;
    if (selectedNodeId || focusedNodeId) return;
    if (graphSignature === lastAutoFitSignatureRef.current) return;
    lastAutoFitSignatureRef.current = graphSignature;
    const timeout = setTimeout(() => {
      graphRef.current?.zoomToFit?.(600, 80);
    }, 150);
    return () => clearTimeout(timeout);
  }, [graphSignature, visibleData, selectedNodeId, focusedNodeId]);

  // Effect for Camera Focus (remains the same, but uses graphRef type)
  useEffect(() => {
    const currentOutput = useAppStore.getState().output;
    const nodes = (typeof currentOutput === 'object' && currentOutput?.visualizationData?.nodes) 
                  ? currentOutput.visualizationData.nodes as AppGraphNode[] // Assert type here
                  : [];

    if (focusedNodeId && graphRef.current && nodes.length > 0) {
        const node = nodes.find(n => n.id === focusedNodeId);
        if (node) {
            const focusX = node.fx ?? node.x ?? 0; // Default to 0 if undefined
            const focusY = node.fy ?? node.y ?? 0;
            const focusZ = node.fz ?? node.z ?? 0;

            // Check if positions are reasonably defined (not all zero)
            if (focusX !== 0 || focusY !== 0 || focusZ !== 0) {
                const distance = 200; // INCREASED FOCUS DISTANCE from 60
                const distRatio = 1 + distance / Math.hypot(focusX, focusY, focusZ);
                const newCameraPosition = {
                    x: focusX * distRatio,
                    y: focusY * distRatio,
                    z: focusZ * distRatio,
                };
                const lookAtPosition = { x: focusX, y: focusY, z: focusZ };
                // Use graphRef with type safety
                graphRef.current.cameraPosition(newCameraPosition, lookAtPosition, 1000);
            } else {
                console.warn(`VisComp: Could not focus on node ${focusedNodeId} - position is at origin or undefined.`);
            }
        } else {
            console.warn(`VisComp: Could not focus on node ${focusedNodeId} - not found.`);
        }
    }
  }, [focusedNodeId]);

  // Effect to handle graph resizing when dimensions change
  useEffect(() => {
    if (graphRef.current && dimensions.width > 0 && dimensions.height > 0) {
      // Use the library's built-in resize methods
      const graph = graphRef.current as ForceGraphMethods & { width: (w: number) => void; height: (h: number) => void };
      
      // Set width and height using the library's methods
      if (typeof graph.width === 'function') {
        graph.width(dimensions.width);
      }
      if (typeof graph.height === 'function') {
        graph.height(dimensions.height);
      }
      
      if (process.env.NEXT_PUBLIC_DEBUG === "true") {
        console.log('Graph resized using library methods to:', dimensions);
      }
    }
  }, [dimensions]);


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
        onContextMenu={handleContainerRightClick}
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
          <ForceGraph3DComponent
            ref={graphRef}
            graphData={visibleData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={themeColors.background}
            // --- Node Styling ---
            nodeRelSize={6}
            nodeVal={getNodeVal}
            nodeLabel="label" // Tooltip label
            nodeColor={getNodeColor}
            nodeOpacity={1}
            nodeThreeObjectExtend={true}
            nodeThreeObject={getNodeThreeObject}
            // --- Link Styling ---
            linkColor={getLinkColor}
            linkWidth={getLinkWidth}
            linkDirectionalParticles={getLinkDirectionalParticles}
            linkDirectionalParticleWidth={1.8}
            linkDirectionalParticleSpeed={0.007}
            // --- Interaction ---
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onNodeRightClick={handleNodeRightClick}
            onBackgroundClick={handleBackgroundClick}
            enableNodeDrag={false}
            // --- Forces & Camera ---
            controlType="orbit"
            // Node Configuration
            nodeResolution={16}
            // Performance / Simulation
            d3AlphaDecay={0.03}
            d3VelocityDecay={0.3}
            warmupTicks={40}
            cooldownTicks={120}
            cooldownTime={1200}
          />
        </div>
        <GraphControlsOverlay
          isAutoRotateEnabled={isAutoRotateEnabled}
          areAllLabelsVisible={areAllLabelsVisible}
          isClusterColorEnabled={colorByCluster}
          onToggleAutoRotate={() => setIsAutoRotateEnabled((prev) => !prev)}
          onToggleLabels={() => setAreAllLabelsVisible((prev) => !prev)}
          onToggleClusterColor={() => setColorByCluster(!colorByCluster)}
          onZoomToFit={handleZoomToFit}
        />
      </div>
      
      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <div
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              const appNode = (visualizationData?.nodes || []).find(n => n.id === contextMenu.nodeId);
              if (!appNode) return;
              if (pinnedNodes[appNode.id]) {
                unpinNode(appNode.id);
              } else {
                pinNode(appNode.id);
              }
              setContextMenu(null);
            }}
          >
            {pinnedNodes[contextMenu.nodeId] ? 'Unpin' : 'Pin'}
          </div>
          <div className="-mx-1 my-1 h-px bg-border" />
          <div
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              collapseNode(contextMenu.nodeId);
              setContextMenu(null);
            }}
          >
            Collapse Node
          </div>
          <div
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              handleExpandNode(contextMenu.nodeId);
              setContextMenu(null);
            }}
          >
            Expand Node
          </div>
        </div>
      )}
    </div>
  );
});

export default VisualizationComponent;
