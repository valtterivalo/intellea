'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Expand, StickyNote } from 'lucide-react';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore'; // Import the store and IntelleaResponse type
import { useShallow } from 'zustand/react/shallow'; // Import useShallow for multiple state slices
import type { KnowledgeCard as KnowledgeCardType, GraphData } from '@/store/useAppStore'; // Import types
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client'; // Import our client creator

// Helper type guard
function isIntelleaResponse(output: any): output is IntelleaResponse {
    return (
        typeof output === 'object' &&
        output !== null &&
        'visualizationData' in output && typeof output.visualizationData === 'object' && output.visualizationData !== null
    );
}

interface KnowledgeCardProps {
  card: KnowledgeCardType;
  variant?: 'default' | 'focused';
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ card, variant = 'default' }) => {
  // Get the necessary actions and data from the store
  const {
    setFocusedNodeId,
    setActiveFocusPath,
    expandConcept,
    isExpandingConcept,
    subscriptionStatus,
    visualizationData,
    markCompleted,
    completedNodeIds,
    nodeNotes
  } = useAppStore(
    useShallow((state) => ({ // Use useShallow for multiple selections
      setFocusedNodeId: state.setFocusedNodeId,
      setActiveFocusPath: state.setActiveFocusPath,
      expandConcept: state.expandConcept,
      isExpandingConcept: state.isExpandingConcept,
      subscriptionStatus: state.subscriptionStatus,
      // Safely access visualizationData
      visualizationData: isIntelleaResponse(state.output) ? state.output.visualizationData : null,
      markCompleted: state.markCompleted,
      completedNodeIds: state.completedNodeIds,
      nodeNotes: state.nodeNotes,
    }))
  );

  // Create a stable supabase client
  const supabase = createClient();
  
  const handleFocusClick = () => {
    console.log(`Focus graph requested for node: ${card.nodeId}, setting active focus PATH.`);
    // Set transient camera focus trigger
    setFocusedNodeId(card.nodeId);
    // Set persistent focus path and clicked node ID, passing visualizationData
    setActiveFocusPath(card.nodeId, visualizationData);
  };

  const handleExpandClick = () => {
    console.log(`Expand concept requested for node: ${card.nodeId}, ${card.title}`);
    expandConcept(card.nodeId, card.title, supabase);
  };

  const handleCompleteClick = () => {
    markCompleted(card.nodeId);
  };

  const isCompleted = completedNodeIds.has(card.nodeId);

  const isSubscriptionActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  const hasNote = !!nodeNotes[card.nodeId];

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
        <CardTitle className="text-lg leading-tight flex items-center gap-1">
          {card.title}
          {hasNote && <StickyNote className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-grow px-4 pb-3"> {/* Adjusted padding */}
        <p>{card.description}</p>
      </CardContent>
      <div className="p-2 px-4 border-t flex gap-2"> {/* Button container with padding and border */}
         <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={handleFocusClick}
            // Disable button if vizData isn't available (should generally be available if cards are)
            disabled={!visualizationData} 
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" /> Focus
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleExpandClick}
            disabled={isExpandingConcept || !isSubscriptionActive}
          >
            <Expand className="mr-1.5 h-3.5 w-3.5" /> Expand
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleCompleteClick}
            disabled={isCompleted}
          >
            {isCompleted ? 'Learned' : 'Mark Learned'}
          </Button>
      </div>
    </Card>
  );
};

export default KnowledgeCard; 