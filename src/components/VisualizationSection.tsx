'use client';

import React from 'react';
import { useAppStore, CognitionResponse } from '@/store/useAppStore';
import VisualizationComponent from './VisualizationComponent';
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// Helper type guard from useAppStore (might need to be exported from store)
function isCognitionResponse(output: any): output is CognitionResponse {
    return typeof output === 'object' && output !== null;
}

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
        if (isCognitionResponse(state.output)) {
            return state.output.visualizationData;
        }
        return undefined;
    });

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
            </section>
        </>
    );
};

export default VisualizationSection; 