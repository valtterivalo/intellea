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
  fx?: number;
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

const ForceGraph3DComponent = dynamic(() => import('react-force-graph-3d').then(mod => mod.default),
    { ssr: false, loading: () => <p className="text-muted-foreground italic text-sm p-4">Loading 3D Graph...</p> }
);

// Type assertion helper (not memoized)
const asAppNode = (node: NodeObject): AppGraphNode => node as AppGraphNode;

const VisualizationComponent = ({ 
    visualizationData, 
    onNodeExpand, 
    expandingNodeId
}: VisualizationComponentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Use ForceGraphMethods type for the ref for better type safety
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined); // Initialize with undefined
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // --- Store State Selectors ---
  const focusedNodeId = useAppStore((state) => state.focusedNodeId); // For camera focus (transient)
  const activeFocusPathIds = useAppStore((state) => state.activeFocusPathIds); // Revert to implicit state type
  // --- End State Selectors ---

  // --- Node Color Logic ---
  const getNodeColor = useCallback((node: NodeObject) => {
    const appNode = asAppNode(node);
    // Highest priority: Expanding node
    if (expandingNodeId === appNode.id) {
      return themeColors.nodeExpanding;
    }
    // Next priority: Hovered node
    if (hoveredNodeId === appNode.id) {
      return themeColors.nodeHover;
    }
    // Next priority: Path focus
    if (activeFocusPathIds) {
      return activeFocusPathIds.has(appNode.id)
          ? themeColors.nodeExpanding // Highlight nodes in the path
          : themeColors.nodeMuted;     // Dim nodes outside the path
    }
    // Default color if no other state applies
    return themeColors.nodeBase;
  }, [activeFocusPathIds, hoveredNodeId, expandingNodeId]);
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

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect) {
          const newWidth = entry.contentRect.width;
          const newHeight = entry.contentRect.height;
          // Only update state if dimensions actually changed
          setDimensions(currentDimensions => {
              if (currentDimensions.width !== newWidth || currentDimensions.height !== newHeight) {
                  return { width: newWidth, height: newHeight };
              }
              return currentDimensions; // Return current state if no change
          });
        }
      }
    });

    resizeObserver.observe(container);
    const initialWidth = container.offsetWidth;
    const initialHeight = container.offsetHeight;
    if (initialWidth > 0 && initialHeight > 0) {
        setDimensions({ width: initialWidth, height: initialHeight });
    }

    // Cleanup function
    return () => {
      resizeObserver.disconnect();
      // Renderer disposal removed
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
                const distance = 60; // Increase focus distance slightly
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

  // Node click handler - Use prop and correct type
  const handleNodeClick = useCallback((node: NodeObject) => {
      const appNode = asAppNode(node);
      if (onNodeExpand && appNode.id) { 
          console.log(`VisualizationComponent: Node clicked, calling onNodeExpand for ${appNode.id}`);
          onNodeExpand(appNode.id, appNode.label || ''); // Use empty string if label is undefined
      } else {
          console.log("VisualizationComponent: Node clicked, but onNodeExpand not available or node.id missing.", appNode);
      }
  }, [onNodeExpand]);

  // Node hover handler - Use correct type
  const handleNodeHover = useCallback((node: NodeObject | null) => {
      setHoveredNodeId(node ? asAppNode(node).id : null);
  }, []);

  // --- Render --- 
  if (!visualizationData) {
    return <div ref={containerRef} className="w-full h-64 bg-muted flex items-center justify-center"><p className="text-muted-foreground italic text-sm">No visualization data available.</p></div>;
  }

  if (dimensions.width === 0 || dimensions.height === 0) {
      return (
          <div 
              ref={containerRef} 
              className="w-full aspect-video bg-card rounded-md border border-border shadow-sm min-h-[300px] flex items-center justify-center"
          >
              <p className="text-muted-foreground italic text-sm p-4">Measuring container...</p>
          </div>
      );
  }
  
  // console.log("[Render] Rendering ForceGraph3DComponent with dimensions:", dimensions);
  // console.log("[Render] Graph Data Nodes:", visualizationData.nodes.length, "Links:", visualizationData.links.length);

  return (
    <div 
        ref={containerRef} 
        className="w-full aspect-video bg-card rounded-md border border-border shadow-sm overflow-hidden relative min-h-[300px]"
    >
      <ForceGraph3DComponent
        ref={graphRef}
        graphData={visualizationData}
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
        nodeThreeObject={getNodeThreeObject} // Persistent label object
        // --- Link Styling ---
        linkColor={() => themeColors.link}
        linkWidth={0.5}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={() => themeColors.nodeHover}
        // --- Interaction ---
        onNodeClick={handleNodeClick} 
        onNodeHover={handleNodeHover} // Use the correctly typed hover handler
        enableNodeDrag={false}
        // --- Forces & Camera ---
        controlType="orbit"
      />
    </div>
  );
};

export default VisualizationComponent; 