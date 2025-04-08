'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from 'lucide-react'; // Icon for the button
import { useAppStore, CognitionResponse } from '@/store/useAppStore'; // Import the store and CognitionResponse type
import { useShallow } from 'zustand/react/shallow'; // Import useShallow for multiple state slices
import type { KnowledgeCardData, GraphData } from '@/store/useAppStore'; // Import types
import { cn } from '@/lib/utils';

// Helper type guard
function isCognitionResponse(output: any): output is CognitionResponse {
    return (
        typeof output === 'object' &&
        output !== null &&
        'visualizationData' in output && typeof output.visualizationData === 'object' && output.visualizationData !== null
    );
}

interface KnowledgeCardProps {
  card: KnowledgeCardData;
  variant?: 'default' | 'focused';
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ card, variant = 'default' }) => {
  // Get the necessary actions and data from the store
  const {
    setFocusedNodeId,
    setActiveFocusPath,
    visualizationData
  } = useAppStore(
    useShallow((state) => ({ // Use useShallow for multiple selections
      setFocusedNodeId: state.setFocusedNodeId,
      setActiveFocusPath: state.setActiveFocusPath,
      // Safely access visualizationData
      visualizationData: isCognitionResponse(state.output) ? state.output.visualizationData : null,
    }))
  );
  
  const handleFocusClick = () => {
    console.log(`Focus graph requested for node: ${card.nodeId}, setting active focus PATH.`);
    // Set transient camera focus trigger
    setFocusedNodeId(card.nodeId);
    // Set persistent focus path and clicked node ID, passing visualizationData
    setActiveFocusPath(card.nodeId, visualizationData);
  };

  return (
    <Card
      className={cn(
        "flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200",
        variant === 'focused'
          ? "min-w-[320px] max-w-[480px] w-full"
          : "min-w-[280px] max-w-[340px] flex-1"
      )}
    >
      <CardHeader className="pb-2 pt-3 px-4"> {/* Adjusted padding */}
        <CardTitle className="text-lg leading-tight">{card.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-grow px-4 pb-3"> {/* Adjusted padding */}
        <p>{card.description}</p>
      </CardContent>
      <div className="p-2 px-4 border-t"> {/* Button container with padding and border */}
         <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={handleFocusClick}
            // Disable button if vizData isn't available (should generally be available if cards are)
            disabled={!visualizationData} 
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" /> Focus on Graph
          </Button>
      </div>
    </Card>
  );
};

export default KnowledgeCard; 