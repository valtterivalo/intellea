'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Map } from 'lucide-react';
import { useAppStore, NodeObject, LinkObject, GraphData } from '@/store/useAppStore';
import VisualizationComponent from './VisualizationComponent';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import { ForceGraphMethods } from 'react-force-graph-3d';
import MiniMap from './MiniMap';

// Define props for the container
interface FullscreenGraphContainerProps {
    onNodeExpand: (nodeId: string, nodeLabel: string) => void;
    expandingNodeId: string | null;
}

const FullscreenGraphContainer: React.FC<FullscreenGraphContainerProps> = ({ 
    onNodeExpand, 
    expandingNodeId 
}) => {
    const isGraphFullscreen = useAppStore((state) => state.isGraphFullscreen);
    const toggleGraphFullscreen = useAppStore((state) => state.toggleGraphFullscreen);
    const output = useAppStore((state) => state.output);
    const zoomToFitCount = useAppStore((state) => state.zoomToFitCount);
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
    const graphContainerRef = useRef<HTMLDivElement>(null);
    const [graphDims, setGraphDims] = useState({ width: 0, height: 0 });
    const [cameraState, setCameraState] = useState({ position: { x: 0, y: 0, z: 0 }, zoom: 1 });
    const [showMiniMap, setShowMiniMap] = useState(true);
    const toggleMiniMap = () => setShowMiniMap((v) => !v);

    // Toolbar handlers
    const handleZoomIn = () => {
        if (graphRef.current && graphRef.current.cameraPosition) {
            // Use cameraPosition to zoom in by moving camera closer
            const cam = graphRef.current.camera();
            const currentPos = cam.position;
            const newZ = currentPos.z * 0.8; // Move closer
            graphRef.current.cameraPosition({ x: currentPos.x, y: currentPos.y, z: newZ });
        }
    };
    const handleZoomOut = () => {
        if (graphRef.current && graphRef.current.cameraPosition) {
            // Use cameraPosition to zoom out by moving camera further
            const cam = graphRef.current.camera();
            const currentPos = cam.position;
            const newZ = currentPos.z * 1.2; // Move further
            graphRef.current.cameraPosition({ x: currentPos.x, y: currentPos.y, z: newZ });
        }
    };
    const handleFit = () => {
        if (graphRef.current && graphRef.current.zoomToFit) {
            graphRef.current.zoomToFit(400, 50);
        }
    };
    const handleReset = () => {
        if (graphRef.current && graphRef.current.cameraPosition) {
            graphRef.current.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1000);
        }
    };

    const handleMiniMapCenter = (x: number, y: number) => {
        if (!graphRef.current || !graphRef.current.cameraPosition) return;
        const cam = graphRef.current.camera();
        graphRef.current.cameraPosition({ x, y, z: cam.position.z }, { x, y, z: 0 }, 1000);
    };

    // Respond to zoom-to-fit requests from the store
    useEffect(() => {
        if (zoomToFitCount > 0 && graphRef.current?.zoomToFit) {
            graphRef.current.zoomToFit(400, 50);
        }
    }, [zoomToFitCount]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                toggleGraphFullscreen();
            }
        };

        if (isGraphFullscreen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isGraphFullscreen, toggleGraphFullscreen]);

    // Track graph container dimensions
    useEffect(() => {
        const el = graphContainerRef.current;
        if (!el) return;
        const update = () => {
            setGraphDims({ width: el.offsetWidth, height: el.offsetHeight });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Extract visualization data, ensuring it conforms to GraphData
    let vizData: GraphData | null = null;
    if (typeof output === 'object' && output !== null && 'visualizationData' in output && output.visualizationData) {
        // Basic structural check
        if (output.visualizationData.nodes && output.visualizationData.links) {
            vizData = output.visualizationData as GraphData;
            if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('FullscreenGraphContainer: Extracted vizData', {
                nodes: vizData.nodes.length,
                links: vizData.links.length,
                sampleNode: vizData.nodes[0]
            });
        }
    }

    // Sync camera movements to mini map
    useEffect(() => {
        if (!graphRef.current) return;
        
        const updateCameraState = () => {
            if (!graphRef.current) return;
            const cam = graphRef.current.camera();
            const controls = graphRef.current.controls() as any;
            
            // Calculate zoom based on camera distance from origin
            const distance = Math.sqrt(cam.position.x ** 2 + cam.position.y ** 2 + cam.position.z ** 2);
            const zoom = Math.max(0.1, Math.min(10, 800 / distance)); // Normalize zoom
            
            if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('FullscreenGraphContainer: Camera state updated', {
                position: cam.position,
                distance,
                zoom
            });
            
            setCameraState({ 
                position: { x: cam.position.x, y: cam.position.y, z: cam.position.z }, 
                zoom
            });
        };
        
        // Initial update
        updateCameraState();
        
        // Set up event listeners for camera changes
        const controls = graphRef.current.controls() as any;
        if (controls && controls.addEventListener) {
            controls.addEventListener('change', updateCameraState);
            return () => controls.removeEventListener('change', updateCameraState);
        }
        
        // Fallback: periodic updates
        const interval = setInterval(updateCameraState, 100);
        return () => clearInterval(interval);
    }, [graphRef.current, vizData]);

    const variants = {
        hidden: { opacity: 0, scale: 0.95, pointerEvents: 'none' as const },
        visible: { opacity: 1, scale: 1, pointerEvents: 'auto' as const },
    };

    return (
        <motion.div
            ref={containerRef}
            variants={variants}
            initial="hidden"
            animate={isGraphFullscreen && vizData ? "visible" : "hidden"}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            aria-modal={isGraphFullscreen}
            role="dialog"
            aria-hidden={!isGraphFullscreen}
        >
            {vizData && (
                <div ref={graphContainerRef} className="relative h-[95vh] w-[95vw] rounded-lg border bg-card shadow-xl overflow-hidden">
                    {/* Floating Toolbar */}
                    <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 bg-card/80 rounded-md shadow p-2">
                        <Button variant="ghost" size="icon" onClick={handleZoomIn} aria-label="Zoom in">
                            <ZoomIn className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleZoomOut} aria-label="Zoom out">
                            <ZoomOut className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleFit} aria-label="Fit graph">
                            <Maximize2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleReset} aria-label="Reset camera">
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleMiniMap} aria-label="Toggle mini map">
                            <Map className="h-5 w-5" />
                        </Button>
                    </div>
                    <VisualizationComponent
                        ref={graphRef}
                        visualizationData={vizData}
                        onNodeExpand={onNodeExpand}
                        expandingNodeId={expandingNodeId}
                    />
                    <MiniMap
                        graphData={vizData}
                        cameraState={cameraState}
                        mainGraphDims={graphDims}
                        onCenter={handleMiniMapCenter}
                        visible={showMiniMap}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 text-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-full"
                        onClick={toggleGraphFullscreen}
                        aria-label="Close fullscreen graph view"
                        tabIndex={isGraphFullscreen ? 0 : -1}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </motion.div>
    );
};

export default FullscreenGraphContainer;
