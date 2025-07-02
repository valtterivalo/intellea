'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SpriteText from 'three-spritetext';
import { useAppStore } from '@/store/useAppStore';
// THREE import available for future use
// import * as THREE from 'three';
import { ForceGraphMethods, NodeObject } from 'react-force-graph-3d'; // Import library types
import { useGraphState, GraphData, AppGraphNode } from './hooks/useGraphState';
import { useNodeInteractions } from './hooks/useNodeInteractions';
import { getNodeColor as depthColor, getClusterColor } from '@/lib/graphColors';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) as any;

// Type assertion helper (not memoized)
const asAppNode = (node: NodeObject): AppGraphNode => node as AppGraphNode;

const VisualizationComponent = React.forwardRef<ForceGraphMethods | undefined, VisualizationComponentProps>(
  function VisualizationComponent({ visualizationData, onNodeExpand }, forwardedRef) {
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

  const {
    focusedNodeId,
    activeFocusPathIds,
    selectedNodeId,
    pinnedNodes,
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

  const {
    // hoveredNodeId, // Available for future use
    contextMenu,
    setContextMenu,
    handleNodeClick,
    handleNodeHover,
    handleNodeRightClick,
    handleContainerRightClick,
    handleCloseContextMenu,
    handleExpandNode,
  } = useNodeInteractions(graphRef, visualizationData, onNodeExpand);

  const nodeDepths = React.useMemo(() => {
    if (!visibleData) return {} as Record<string, number>;
    const depths: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    visibleData.nodes.forEach((n) => {
      depths[n.id] = (n as AppGraphNode).depth ?? undefined;
      adj[n.id] = [];
    });
    visibleData.links.forEach((l) => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      if (adj[s]) adj[s].push(t);
      if (adj[t]) adj[t].push(s);
    });
    const root = visibleData.nodes.find((n) => (n as AppGraphNode).depth === 0) || visibleData.nodes[0];
    if (!root) return depths;
    const queue = [root.id];
    if (depths[root.id] === undefined) depths[root.id] = 0;
    while (queue.length) {
      const id = queue.shift()!;
      const d = depths[id] as number;
      for (const nb of adj[id] || []) {
        if (depths[nb] === undefined) {
          depths[nb] = d + 1;
          queue.push(nb);
        }
      }
    }
    return depths;
  }, [visibleData]);

  // --- Node Color Logic (using depth helper) ---
  const getNodeColor = useCallback(
    (node: NodeObject) => {
      const appNode = asAppNode(node);
      const depth = nodeDepths[appNode.id] ?? (appNode as AppGraphNode).depth ?? 0;
      if (selectedNodeId === appNode.id) {
        return '#eab308';
      }
      if (pinnedNodes[appNode.id]) {
        return '#22c55e';
      }
      if (colorByCluster) {
        const cid = clusters[appNode.id];
        if (cid !== undefined) {
          return getClusterColor(cid);
        }
      }
      return depthColor(depth);
    },
    [selectedNodeId, pinnedNodes, nodeDepths, colorByCluster, clusters]
  );
  // --- End Node Color Logic ---

  // --- Node Size Logic ---
  const getNodeVal = useCallback((node: NodeObject) => {
      const appNode = asAppNode(node);
      // Use path focus for size
      if (activeFocusPathIds) {
          return activeFocusPathIds.has(appNode.id) ? 15 : 5; // Larger for path nodes, smaller for others
      }
      // Default size if no path focus
      return 8;
  }, [activeFocusPathIds]);
  // --- End Node Size Logic ---

  // --- Node Label Object Logic ---
  const getNodeThreeObject = useCallback((node: NodeObject) => {
    const appNode = asAppNode(node);
    const sprite = new SpriteText(appNode.label || ''); // Use empty string if label is undefined
    sprite.material.depthWrite = false; // prevent sprite from occluding other objects
    sprite.color = themeColors.label;

    // Check if the node is part of the active focus path
    const isInFocusPath = activeFocusPathIds?.has(appNode.id) ?? false;

    sprite.textHeight = isInFocusPath ? 6 : 4; // Larger label for focused path nodes

    // Calculate node value based on focus path for offset
    const nodeVal = activeFocusPathIds 
        ? (isInFocusPath ? 15 : 5)
        : 8;
        
    // Increase multiplier and base offset for more clearance
    const yOffset = nodeVal * 1.0 + 8; // Increased from 0.8 and 5
    sprite.position.set(0, yOffset, 0); 

    return sprite;
  }, [activeFocusPathIds]);
  // --- End Node Label Object Logic ---

  // --- Adjust forces on mount --- 
  useEffect(() => {
    if (!graphRef.current || typeof (graphRef.current as ForceGraphMethods).d3Force !== 'function') {
      return; // skip if underlying library not available (e.g., during tests)
    }
    graphRef.current.d3Force('charge')?.strength(-120);
    graphRef.current.d3Force('link')?.distance(60);
    if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log("VisualizationComponent: Adjusted graph forces.");
  }, []); // Run once on mount

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


  // --- Render --- 
  if (!visualizationData) {
    return <div ref={containerRef} className="w-full h-64 bg-muted flex items-center justify-center"><p className="text-muted-foreground italic text-sm">No visualization data available.</p></div>;
  }

  if (dimensions.width === 0 || dimensions.height === 0) {
      return (
          <div 
              ref={containerRef} 
              className="w-full aspect-video bg-card rounded-md border border-border shadow-sm min-h-[300px] flex items-center justify-center"
              style={{ minWidth: '100%', minHeight: '300px' }}
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
        style={{ minWidth: '100%', minHeight: '300px' }}
        onClick={handleCloseContextMenu}
        onContextMenu={handleContainerRightClick}
      >
        <ForceGraph3DComponent
          ref={graphRef}
          graphData={visibleData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={themeColors.background}
          cooldownTime={1000}
          // --- Node Styling ---
          nodeRelSize={6}
          nodeVal={getNodeVal}
          nodeLabel="label" // Tooltip label
          nodeColor={getNodeColor}
          nodeOpacity={1}
          nodeThreeObjectExtend={true}
          nodeThreeObject={getNodeThreeObject}
          // --- Link Styling ---
          linkColor={() => themeColors.link}
          linkWidth={0.5}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.006}
          // --- Interaction ---
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onNodeRightClick={handleNodeRightClick}
          enableNodeDrag={false}
          // --- Forces & Camera ---
          controlType="orbit"
          // Node Configuration
          nodeResolution={16}
          // Performance / Simulation
          d3AlphaDecay={0.02}
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
