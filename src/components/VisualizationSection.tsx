'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';
import VisualizationComponent from './VisualizationComponent';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";


// --- Define Props for VisualizationSection ---
interface VisualizationSectionProps {
  onNodeExpand: (nodeId: string, nodeLabel: string) => void; // Function from page.tsx
  expandingNodeId: string | null; // State from store/page.tsx
}
// --- End Props Definition ---

// Update component signature to accept props
const VisualizationSection: React.FC<VisualizationSectionProps> = ({ 
    onNodeExpand,
    expandingNodeId
}) => {
    // Select necessary data from the store
    const visualizationData = useAppStore((state) => {
        if (isIntelleaResponse(state.output)) {
            return state.output.visualizationData;
        }
        return undefined;
    });
    const colorByCluster = useAppStore(state => state.colorByCluster);
    const setColorByCluster = useAppStore(state => state.setColorByCluster);

    if (!visualizationData) {
        return null;
    }

    return (
        <>
            <Separator />
            <section className="min-h-0">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Visualization</h2>
                    {expandingNodeId && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>
                
                <VisualizationComponent 
                    visualizationData={visualizationData} 
                    onNodeExpand={onNodeExpand}
                    expandingNodeId={expandingNodeId}
                />
                {/* Legend Bar */}
                <div className="flex flex-row gap-4 mt-4 items-center text-sm">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 rounded-full bg-accent-500 border border-accent-600" />
                    Root
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 rounded-full bg-primary-500 border border-primary-600" />
                    Depth 1
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 rounded-full bg-slate-500 border border-slate-600" />
                    Depth ≥2
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 rounded-full bg-yellow-500 border border-yellow-600" />
                    Selected
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 rounded-full bg-green-500 border border-green-600" />
                    Pinned
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setColorByCluster(!colorByCluster)}
                  >
                    {colorByCluster ? 'Depth Colors' : 'Cluster Colors'}
                  </Button>
                </div>
            </section>
        </>
    );
};

export default VisualizationSection;
