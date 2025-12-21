'use client';
/**
 * @fileoverview React component.
 * Exports: FullscreenGraphContainer
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GraphResponseRenderer } from '@intellea/graph-renderer';
import { Button } from '@/components/ui/button';
import type { GraphRendererHandle } from '@intellea/graph-renderer';
import { intelleaToGraphResponse } from '@/lib/adapters/intelleaToGraphResponse';
import { applyGraphModeOverride } from '@/lib/graphModes';
import { isIntelleaResponse } from '@/store/utils';
import { useStoreGraphController } from '@/components/hooks/useStoreGraphController';

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
    const graphModeOverride = useAppStore((state) => state.graphModeOverride);
    const graphController = useStoreGraphController();
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<GraphRendererHandle | null>(null);
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
    const graphResponse = useMemo(() => {
        if (!isIntelleaResponse(output)) return null;
        return intelleaToGraphResponse(output);
    }, [output]);
    const graphResponseForMode = useMemo(
        () => (graphResponse ? applyGraphModeOverride(graphResponse, graphModeOverride) : null),
        [graphResponse, graphModeOverride]
    );



    const variants = {
        hidden: { opacity: 0, scale: 0.95, pointerEvents: 'none' as const },
        visible: { opacity: 1, scale: 1, pointerEvents: 'auto' as const },
    };

    return (
        <motion.div
            ref={containerRef}
            variants={variants}
            initial="hidden"
            animate={isGraphFullscreen && graphResponse ? "visible" : "hidden"}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            aria-modal={isGraphFullscreen}
            role="dialog"
            aria-hidden={!isGraphFullscreen}
        >
            {graphResponseForMode && (
                <div ref={graphContainerRef} className="relative h-[95vh] w-[95vw] rounded-lg border bg-card shadow-xl overflow-hidden">
                    
                    <GraphResponseRenderer
                        graphResponse={graphResponseForMode}
                        onNodeExpand={onNodeExpand}
                        expandingNodeId={expandingNodeId}
                        controller={graphController}
                        graphRef={graphRef}
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
