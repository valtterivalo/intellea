'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SpriteText from 'three-spritetext';
import { useAppStore } from '@/store/useAppStore';
import * as THREE from 'three'; // Keep THREE import for now, might be needed by dependencies
import { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-3d'; // Import library types

// Define our application-specific node structure, extending the library's base type
interface AppGraphNode extends NodeObject {
  id: string; // Ensure id is a string
  label?: string; // Make label optional
  // Add our specific optional properties
  x?: number; // Use x, y, z for calculated positions
  y?: number;
  z?: number;
  fx?: number; // Keep fx, fy, fz for potential future use (e.g., manual pinning)
  fy?: number;
  fz?: number;
}

// Define our application-specific link structure
interface AppGraphLink extends LinkObject {
  source: string | AppGraphNode; // Use string IDs or node objects
  target: string | AppGraphNode;
}

// Define the graph data structure using our types
interface GraphData {
  nodes: Array<AppGraphNode>;
  links: Array<AppGraphLink>;
}

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

const clusterPalette = [
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#22d3ee'
];

const ForceGraph3DComponent = dynamic(() => import('react-force-graph-3d').then(mod => mod.default),
    { ssr: false, loading: () => <p className="text-muted-foreground italic text-sm p-4">Loading 3D Graph...</p> }
);

// Type assertion helper (not memoized)
const asAppNode = (node: NodeObject): AppGraphNode => node as AppGraphNode;

const VisualizationComponent = React.forwardRef<ForceGraphMethods | undefined, VisualizationComponentProps>(
  ({ visualizationData, onNodeExpand, expandingNodeId }, forwardedRef) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Use ForceGraphMethods type for the ref for better type safety
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined); // Initialize with undefined

  // Forward the ref to parent if provided
  React.useImperativeHandle(forwardedRef, () => graphRef.current, []);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [collapsedClusters, setCollapsedClusters] = useState<Record<string, boolean>>({});

  // --- Store State Selectors ---
  const focusedNodeId = useAppStore((state) => state.focusedNodeId); // For camera focus (transient)
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
  // --- End State Selectors ---

  // --- Node Color Logic (using depth helper) ---
  const getNodeColor = useCallback((node: NodeObject) => {
    const appNode = asAppNode(node);
    const clusterId = clusters[appNode.id];
    const paletteIndex = parseInt(clusterId || '0', 10) % clusterPalette.length;
    const clusterColor = clusterPalette[paletteIndex];
    if (selectedNodeId === appNode.id) {
      return '#eab308';
    }
    if (pinnedNodes[appNode.id]) {
      return '#22c55e';
    }
    return clusterColor;
  }, [selectedNodeId, pinnedNodes, clusters]);
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
    if (graphRef.current) {
      // Increase repulsion
      graphRef.current.d3Force('charge')?.strength(-120); // Default is often -30
      // Increase default link distance
      graphRef.current.d3Force('link')?.distance(60); // Default is often 30
      console.log("VisualizationComponent: Adjusted graph forces.");
    }
  }, []); // Run once on mount

  // Effect for dimensions using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = rect.width;
      const newHeight = rect.height;
      
      console.log('Container dimensions:', { newWidth, newHeight });
      
      if (newWidth > 0 && newHeight > 0) {
        setDimensions(currentDimensions => {
          if (currentDimensions.width !== newWidth || currentDimensions.height !== newHeight) {
            console.log('Updating dimensions:', { from: currentDimensions, to: { width: newWidth, height: newHeight } });
            return { width: newWidth, height: newHeight };
          }
          return currentDimensions;
        });
      }
    };

    // Initial size detection with a small delay to ensure CSS is applied
    const initialTimeout = setTimeout(updateDimensions, 100);

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect) {
          const newWidth = entry.contentRect.width;
          const newHeight = entry.contentRect.height;
          console.log('ResizeObserver triggered:', { newWidth, newHeight });
          
          if (newWidth > 0 && newHeight > 0) {
            setDimensions(currentDimensions => {
              if (currentDimensions.width !== newWidth || currentDimensions.height !== newHeight) {
                console.log('ResizeObserver updating dimensions:', { from: currentDimensions, to: { width: newWidth, height: newHeight } });
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
    const fallbackTimeout = setTimeout(() => {
      setDimensions(currentDimensions => {
        if (currentDimensions.width === 0 || currentDimensions.height === 0) {
          console.log('Using fallback dimensions');
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
      clearTimeout(initialTimeout);
      clearTimeout(fallbackTimeout);
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

  // Double-click and single-click logic
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const lastClickedNodeId = useRef<string | null>(null);

  // Left-click: select & center, and set activeClickedNodeId for card focus
  const handleNodeClick = useCallback((node: NodeObject) => {
    const appNode = asAppNode(node);
    if (!appNode.id) return;

    // If the same node is clicked twice within 300ms, treat as double-click
    if (clickTimer.current && lastClickedNodeId.current === appNode.id) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      lastClickedNodeId.current = null;
      // Double-click: expand concept
      if (onNodeExpand) {
        onNodeExpand(appNode.id, appNode.label || '');
      }
      return;
    }

    // Otherwise, treat as single click (with delay to allow for double-click)
    lastClickedNodeId.current = appNode.id;
    clickTimer.current = setTimeout(() => {
      setSelectedNodeId(appNode.id);
      // Set activeClickedNodeId for card focus (and focus path)
      const currentOutput = useAppStore.getState().output;
      const vizData =
        typeof currentOutput === 'object' && currentOutput?.visualizationData
          ? currentOutput.visualizationData
          : null;
      setActiveFocusPath(appNode.id, vizData);

      // Center camera on node
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
      clickTimer.current = null;
      lastClickedNodeId.current = null;
    }, 300);
  }, [setSelectedNodeId, setActiveFocusPath, onNodeExpand]);

  // Node hover handler - Use correct type
  const handleNodeHover = useCallback((node: NodeObject | null) => {
      setHoveredNodeId(node ? asAppNode(node).id : null);
  }, []);

  // Node right-click handler for context menu
  const handleNodeRightClick = useCallback((node: NodeObject, event: MouseEvent) => {
    console.log('Right-click detected on node:', node, event);
    event.preventDefault(); // Prevent default browser context menu
    event.stopPropagation(); // Stop event bubbling
    const appNode = asAppNode(node);
    console.log('Setting context menu for node:', appNode.id);
    
    // Set context menu with position
    setContextMenu({
      nodeId: appNode.id,
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  // Container right-click handler as fallback
  const handleContainerRightClick = useCallback((event: React.MouseEvent) => {
    console.log('Container right-click detected:', event);
    // Close context menu if clicking on background
    setContextMenu(null);
  }, []);

  // Close context menu on any click
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Debug effect for hoveredNodeId changes
  useEffect(() => {
    console.log('hoveredNodeId changed to:', hoveredNodeId);
  }, [hoveredNodeId]);

  // Keyboard shortcuts for selected node
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
  const visibleData: GraphData | undefined = React.useMemo(() => {
    if (!visualizationData) return undefined;
    const filteredNodes = visualizationData.nodes.filter(n => !collapsedClusters[clusters[n.id]]);
    const visibleIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = visualizationData.links.filter(l => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      return visibleIds.has(s) && visibleIds.has(t);
    });
    return { nodes: filteredNodes, links: filteredLinks };
  }, [visualizationData, collapsedClusters, clusters]);

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
              expandNodeInStore(contextMenu.nodeId);
              const appNode = (visualizationData?.nodes || []).find(n => n.id === contextMenu.nodeId);
              if (onNodeExpand && appNode) {
                onNodeExpand(contextMenu.nodeId, appNode.label || '');
              }
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
