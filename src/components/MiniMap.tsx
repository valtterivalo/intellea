'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GraphData } from '@/store/useAppStore';

// Use dynamic import with better error handling
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-xs">Loading...</div>
});

// Define the methods interface for the 2D graph based on documentation
interface ForceGraph2DMethods {
  zoomToFit: (duration?: number, padding?: number) => void;
  graph2ScreenCoords: (x: number, y: number) => { x: number; y: number };
  screen2GraphCoords: (x: number, y: number) => { x: number; y: number };
  zoom: (k?: number, duration?: number) => number | void;
  centerAt: (x?: number, y?: number, duration?: number) => void;
  d3Force: (forceName: string, force?: any) => any;
  d3ReheatSimulation: () => void;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  getGraphBbox: () => { x: [number, number]; y: [number, number] };
}

interface CameraState {
  position: { x: number; y: number; z: number };
  zoom: number;
}

interface MiniMapProps {
  graphData: GraphData;
  cameraState: CameraState;
  mainGraphDims: { width: number; height: number };
  onCenter: (x: number, y: number) => void;
  visible: boolean;
}

const MiniMap: React.FC<MiniMapProps> = ({ graphData, cameraState, mainGraphDims, onCenter, visible }) => {
  const fgRef = useRef<any>(null); // Use any for now to avoid complex type issues
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewRect, setViewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [minimapDimensions] = useState({ width: 240, height: 180 }); // Increased size

  // Transform data to ensure compatibility with ForceGraph2D
  const transformedData = React.useMemo(() => {
    if (!graphData || !graphData.nodes || !graphData.links) {
      if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('MiniMap: No graph data available', { graphData });
      return { nodes: [], links: [] };
    }

    // Transform nodes to include 'name' property for ForceGraph2D
    const transformedNodes = graphData.nodes.map(node => ({
      ...node,
      name: node.label || node.id, // ForceGraph2D uses 'name' for labels
      val: 1, // Add a default value for node size
    }));

    if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('MiniMap: Transformed data', {
      originalNodes: graphData.nodes.length, 
      originalLinks: graphData.links.length,
      transformedNodes: transformedNodes.length 
    });

    return {
      nodes: transformedNodes,
      links: graphData.links
    };
  }, [graphData]);

  // Initialize the minimap when data is ready
  useEffect(() => {
    if (fgRef.current && transformedData.nodes.length > 0 && !isReady) {
      if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('MiniMap: Initializing with zoomToFit');
      // Small delay to ensure the graph is rendered
      setTimeout(() => {
        if (fgRef.current?.zoomToFit) {
          fgRef.current.zoomToFit(0, 20); // No animation, 20px padding
          setIsReady(true);
        }
      }, 100);
    }
  }, [transformedData, isReady]);

  // Update viewport rectangle based on 3D camera state
  useEffect(() => {
    if (!fgRef.current?.graph2ScreenCoords || !isReady) return;
    
    try {
      const { position } = cameraState;
      // Project 3D position to 2D for minimap
      const center = fgRef.current.graph2ScreenCoords(position.x, position.y);
      
      // Calculate viewport size based on zoom and main graph dimensions
      const scale = Math.max(0.1, Math.min(10, 1 / cameraState.zoom)); // Clamp scale
      const rectW = (mainGraphDims.width * scale) / 4; // Scale down for minimap
      const rectH = (mainGraphDims.height * scale) / 4;
      
      setViewRect({ 
        x: center.x - rectW / 2, 
        y: center.y - rectH / 2, 
        w: rectW, 
        h: rectH 
      });
    } catch (error) {
      console.warn('MiniMap: Error updating viewport rectangle:', error);
    }
  }, [cameraState, mainGraphDims, isReady]);

  // Handle click on minimap to center main graph
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!fgRef.current?.screen2GraphCoords) return;
    
    try {
      const bounds = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      const coords = fgRef.current.screen2GraphCoords(x, y);
      
      if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('MiniMap: Click at screen coords:', { x, y }, 'graph coords:', coords);
      onCenter(coords.x, coords.y);
    } catch (error) {
      console.warn('MiniMap: Error handling click:', error);
    }
  }, [onCenter]);

  // Handle engine stop to mark as ready
  const handleEngineStop = useCallback(() => {
    if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('MiniMap: Force simulation stopped');
    if (!isReady) {
      setIsReady(true);
    }
  }, [isReady]);

  if (!visible) return null;

  // Show a placeholder if no data is available
  if (!transformedData.nodes.length) {
    return (
      <div
        ref={containerRef}
        className="absolute bottom-4 right-4 z-20 bg-card/95 border rounded-lg shadow-lg flex items-center justify-center"
        style={{ width: minimapDimensions.width, height: minimapDimensions.height }}
        data-testid="mini-map"
      >
        <p className="text-xs text-muted-foreground">No data</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute bottom-4 right-4 z-20 bg-card/95 border rounded-lg shadow-lg cursor-pointer overflow-hidden"
      style={{ width: minimapDimensions.width, height: minimapDimensions.height }}
      onClick={handleClick}
      data-testid="mini-map"
    >
      <div className="absolute top-2 left-2 z-30 text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">
        Overview
      </div>
      
      <ForceGraph2D
        ref={fgRef}
        width={minimapDimensions.width}
        height={minimapDimensions.height}
        graphData={transformedData}
        enableZoomInteraction={false}
        enablePanInteraction={false}
        enablePointerInteraction={true}
        enableNodeDrag={false}
        backgroundColor="#FDF5E6"
        nodeColor="#8B7D6B"
        nodeVal={3}
        nodeLabel="name"
        linkColor="rgba(139, 125, 107, 0.6)"
        linkWidth={1}
        cooldownTime={1000}
        d3AlphaDecay={0.05}
        onEngineStop={handleEngineStop}
        // Disable all interactions except what we need
        onNodeClick={() => {}} // Prevent node clicks
        onNodeHover={() => {}} // Prevent node hovers
        onLinkClick={() => {}} // Prevent link clicks
        onLinkHover={() => {}} // Prevent link hovers
      />
      
      {/* Viewport indicator */}
      {viewRect && isReady && (
        <div
          data-testid="mini-viewport"
          className="absolute pointer-events-none border-2 border-red-500 bg-red-500/10"
          style={{
            left: Math.max(0, Math.min(minimapDimensions.width - viewRect.w, viewRect.x)),
            top: Math.max(0, Math.min(minimapDimensions.height - viewRect.h, viewRect.y)),
            width: Math.max(10, Math.min(minimapDimensions.width, viewRect.w)),
            height: Math.max(10, Math.min(minimapDimensions.height, viewRect.h)),
          }}
        />
      )}
    </div>
  );
};

export default MiniMap;
