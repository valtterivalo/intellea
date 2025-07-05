'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore, GraphData } from '@/store/useAppStore';
import VisualizationComponent from './VisualizationComponent';
import { Button } from '@/components/ui/button';
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
    const zoomToFitCount = useAppStore((state) => state.zoomToFitCount);
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
    const graphContainerRef = useRef<HTMLDivElement>(null);


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
