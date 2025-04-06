'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import SpriteText from 'three-spritetext';
import { CognitionResponse } from '../app/api/generate/route';
import { useAppStore } from '@/store/useAppStore';
import { debounce } from '@/lib/utils';

// Define the expected structure for nodes and links
// Ensure GraphDataNode includes optional x, y, z
interface GraphDataNode {
  id: string;
  label: string;
  x?: number; // Add optional position props
  y?: number;
  z?: number;
  fx?: number; // Also include fixed positions for lookup
  fy?: number;
  fz?: number;
  [key: string]: any;
}
interface GraphData {
  nodes: Array<GraphDataNode>;
  links: Array<{ source: string; target: string; [key: string]: any }>;
}

interface VisualizationComponentProps {
  visualizationData?: GraphData; // Use the GraphData interface directly
  onNodeExpand?: (nodeId: string, nodeLabel: string) => void;
  expandingNodeId?: string | null;
}

// Define theme colors (visually sampled from screenshot - warm beige theme)
const themeColors = {
  background: '#FDF5E6',        // Warm beige (Old Lace - visually match cards)
  nodeBase: '#8B7D6B',          // Muted dark khaki/brown (visually match theme)
  nodeHover: '#D8C0A3',         // Lighter beige/tan (visually match highlight)
  nodeExpanding: '#FBBF24',    // Keep Amber for distinction
  link: 'rgba(139, 125, 107, 0.3)', // Faint dark khaki/brown (based on nodeBase)
  label: '#5D4037'             // Dark brown text (visually match theme text)
};

const ForceGraph3DComponent = dynamic(() => import('react-force-graph-3d').then(mod => mod.default),
    { ssr: false, loading: () => <p className="text-muted-foreground italic text-sm p-4">Loading 3D Graph...</p> }
);

const VisualizationComponent: React.FC<VisualizationComponentProps> = ({ 
    visualizationData, 
    onNodeExpand, 
    expandingNodeId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [lastSavedNodeCount, setLastSavedNodeCount] = useState<number | null>(null);
  const updateNodePositions = useAppStore((state) => state.updateNodePositions);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null); // State for hovered node

  // --- Add state selectors for focus logic ---
  const focusedNodeId = useAppStore((state) => state.focusedNodeId);
  /* Remove direct node selection here
  const nodes = useAppStore((state) => {
    if (typeof state.output === 'object' && state.output !== null && state.output.visualizationData) {
      return state.output.visualizationData.nodes || [];
    }
    return [];
  });
  */
  // --- End state selectors ---

  // Debounced function to actually update the store
  const debouncedUpdateStore = useMemo(() => {
      const updateFunc = (nodesToSave: GraphDataNode[]) => {
          console.log("VisualizationComponent: Debounced save executing.", nodesToSave[0]);
          updateNodePositions(nodesToSave);
          setLastSavedNodeCount(nodesToSave.length); // Update count after successful save
      };
      return debounce(updateFunc, 500);
  }, [updateNodePositions]);

  // Effect for dimensions using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect) {
          // Log the dimensions reported by the observer
          console.log("[ResizeObserver Callback] Observed dimensions:", {
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
          // Update dimensions state
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      }
    });

    resizeObserver.observe(container);

    // Initial measure in case observer doesn't fire immediately
    const initialWidth = container.offsetWidth;
    const initialHeight = container.offsetHeight;

    // Log initial measure
    console.log("[Effect Init] Initial container dimensions:", { initialWidth, initialHeight });
    if (initialWidth > 0 && initialHeight > 0) {
        setDimensions({ width: initialWidth, height: initialHeight });
    }

    // Cleanup function to disconnect observer
    return () => {
      console.log("[Effect Cleanup] Disconnecting ResizeObserver");
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array, observer handles updates

  // Reset last saved count if the underlying node/link count changes
  useEffect(() => {
      setLastSavedNodeCount(null); // Force position save on next engine stop
      console.log("VisualizationComponent: Node/link count changed, resetting lastSavedNodeCount.");
  // Depend on node and link counts instead of the whole object reference
  }, [visualizationData?.nodes.length, visualizationData?.links.length]); 

  // --- Add Effect for Camera Focus ---
  useEffect(() => {
    // Get nodes directly from store state inside the effect
    const currentOutput = useAppStore.getState().output;
    const nodes = (typeof currentOutput === 'object' && currentOutput?.visualizationData?.nodes) 
                  ? currentOutput.visualizationData.nodes 
                  : [];

    if (focusedNodeId && graphRef.current && nodes.length > 0) {
      const node = nodes.find(n => n.id === focusedNodeId);
      if (node) {
        // Use fx/fy/fz if available (more stable), fallback to x/y/z
        const focusX = node.fx ?? node.x;
        const focusY = node.fy ?? node.y;
        const focusZ = node.fz ?? node.z;

        if (focusX !== undefined && focusY !== undefined && focusZ !== undefined) {
          // Aim at node from outside it (calculation from example)
          const distance = 40;
          const distRatio = 1 + distance / Math.hypot(focusX, focusY, focusZ);
          
          const newCameraPosition = {
            x: focusX * distRatio,
            y: focusY * distRatio,
            z: focusZ * distRatio,
          };
          
          const lookAtPosition = { x: focusX, y: focusY, z: focusZ };
          
          console.log(`VisualizationComponent: Focusing camera on node ${focusedNodeId}`, { newCameraPosition, lookAtPosition });
          
          graphRef.current.cameraPosition(
            newCameraPosition, // new position
            lookAtPosition, // lookAt ({ x, y, z })
            1000 // transition duration ms
          );
        } else {
          console.warn(`VisualizationComponent: Could not focus on node ${focusedNodeId} - position data missing.`);
        }
      } else {
        console.warn(`VisualizationComponent: Could not focus on node ${focusedNodeId} - node not found.`);
      }
    }
  // Depend ONLY on focusedNodeId
  }, [focusedNodeId]); 
  // --- End Effect for Camera Focus ---

  // Callback when the force engine stops
  const handleEngineStop = useCallback(() => {
    const currentNodes = visualizationData?.nodes;
    const currentNodeCount = currentNodes?.length ?? 0;

    if (!currentNodes || currentNodeCount === 0) {
        console.warn("VisualizationComponent: Engine stopped event, but no nodes available.");
        return;
    }

    const firstNode = currentNodes[0];
    if (firstNode.x === undefined || firstNode.y === undefined || firstNode.z === undefined) {
        console.warn("VisualizationComponent: Engine stopped event, but nodes lack position data (engine might be starting?).", firstNode);
        return; 
    }
    
    // Only save positions if the node count has changed since the last save,
    // or if we haven't saved before (lastSavedNodeCount is null).
    if (lastSavedNodeCount === null || currentNodeCount !== lastSavedNodeCount) {
        console.log(`VisualizationComponent: Engine stopped. Node count changed (${lastSavedNodeCount} -> ${currentNodeCount}) or first save. Debouncing position save.`, firstNode);
        // Map nodes to ensure only intended properties (id, label, x, y, z) are passed for saving
        // This prevents sending internal graph state (like vx, __threeObj) to the store.
        const nodesToSave = currentNodes.map(({ id, label, x, y, z }) => ({ 
            id, 
            label, // Include label if potentially needed later, though store only uses id/pos
            x, 
            y, 
            z 
        }));
        debouncedUpdateStore(nodesToSave);
    } else {
        console.log(`VisualizationComponent: Engine stopped. Node count (${currentNodeCount}) same as last save (${lastSavedNodeCount}). Skipping save.`);
    }

  }, [visualizationData, debouncedUpdateStore, lastSavedNodeCount]); // Add lastSavedNodeCount

  // Node styling and labels
  const getNodeLabel = useCallback((node: GraphDataNode) => node.label || '', []);
  
  // Update getNodeColor to use expandingNodeId and hoveredNodeId with theme colors
  const getNodeColor = useCallback((node: GraphDataNode) => {
    if (node.id === expandingNodeId) {
      return themeColors.nodeExpanding; // Expanding takes priority
    }
    if (node.id === hoveredNodeId) {
      return themeColors.nodeHover;
    }
    return themeColors.nodeBase; // Use theme base color
  }, [expandingNodeId, hoveredNodeId]); // Add hoveredNodeId dependency

  // Link styling
  const getLinkColor = useCallback(() => themeColors.link, []); // Use theme link color
  const getLinkWidth = useCallback(() => 1, []); // Thin links

  // Handle node click for expansion
  const handleNodeClick = useCallback((node: GraphDataNode) => {
    if (onNodeExpand && node.id) {
      console.log(`VisualizationComponent: Node clicked - ID: ${node.id}, Label: ${node.label}`);
      onNodeExpand(node.id, node.label || '');
    }
  }, [onNodeExpand]);

  // Check for valid data before rendering
  const finalGraphData = visualizationData && visualizationData.nodes && visualizationData.links ? visualizationData : { nodes: [], links: [] };

  if (finalGraphData.nodes.length === 0) {
    return <p className="text-muted-foreground italic text-sm p-4">No valid visualization data provided.</p>;
  }

  const ForceGraph3D = ForceGraph3DComponent as any;

  return (
    <div ref={containerRef} className="aspect-video w-full bg-card rounded-md overflow-hidden border border-border relative min-h-0">
      {/* Log dimensions passed to the graph component - Wrapped log to return null */}
      {(() => {
        console.log("[Render] Passing dimensions to ForceGraph3D:", dimensions);
        return null; // Return null to satisfy ReactNode type
      })()}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph3D
          ref={graphRef}
          // Pass the validated prop directly
          graphData={finalGraphData} 
          // Node configuration
          nodeLabel={getNodeLabel} // Show label on hover
          nodeColor={getNodeColor}
          nodeVal={5} // Fixed node size for now
          // Use three-spritetext for persistent labels
          nodeThreeObject={(node: GraphDataNode) => {
              const sprite = new SpriteText(node.label || '');
              (sprite as any).material.depthWrite = false; // Ensure labels are drawn on top
              sprite.color = themeColors.label; // Use theme label color
              sprite.textHeight = 4; // Keep text height reasonable
              return sprite;
          }}
          nodeThreeObjectExtend={true}

          // Link configuration
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.006}

          // Interaction and camera
          enableNodeDrag={false} // Keep node dragging disabled intentionally
          onNodeClick={handleNodeClick} // Add the node click handler

          // Performance
          numDimensions={3}

          // Styling to fill container - Use measured dimensions
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={themeColors.background} // Use theme background color

          // Interaction Callbacks
          onNodeHover={(node: GraphDataNode | null) => setHoveredNodeId(node ? node.id : null)} // Set hovered node ID

          // Controls
          controlType="orbit" // Change control type

          onEngineStop={handleEngineStop} // Add the engine stop handler
        />
      )}
      {!(dimensions.width > 0 && dimensions.height > 0) && (
          <p className="text-muted-foreground italic text-sm p-4">Container dimensions not ready...</p>
      )}
    </div>
  );
};

export default React.memo(VisualizationComponent); 