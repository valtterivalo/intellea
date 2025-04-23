'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore, NodeObject, LinkObject, GraphData } from '@/store/useAppStore';
import VisualizationComponent from './VisualizationComponent';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import { ForceGraphMethods } from 'react-force-graph-3d';

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
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);

    // Toolbar handlers
    const handleZoomIn = () => {
        if (graphRef.current) {
            const cam = graphRef.current.camera();
            if (cam) cam.zoom *= 1.2;
            if (graphRef.current.cameraPosition) graphRef.current.cameraPosition();
        }
    };
    const handleZoomOut = () => {
        if (graphRef.current) {
            const cam = graphRef.current.camera();
            if (cam) cam.zoom /= 1.2;
            if (graphRef.current.cameraPosition) graphRef.current.cameraPosition();
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

    // Extract visualization data, ensuring it conforms to GraphData
    let vizData: GraphData | null = null;
    if (typeof output === 'object' && output !== null && 'visualizationData' in output && output.visualizationData) {
        // Basic structural check
        if (output.visualizationData.nodes && output.visualizationData.links) {
            vizData = output.visualizationData as GraphData;
        }
    }

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
                <div className="relative h-[95vh] w-[95vw] rounded-lg border bg-card shadow-xl overflow-hidden">
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
                    </div>
                    <VisualizationComponent 
                        ref={graphRef}
                        visualizationData={vizData} 
                        onNodeExpand={onNodeExpand}
                        expandingNodeId={expandingNodeId}
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
