'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from 'lucide-react'; // Icon for the button
import { useAppStore } from '@/store/useAppStore'; // Import the store

// Define the structure for the props, expecting a single card object
// We might need to import the KnowledgeCard type from the store if it's exported,
// otherwise, redefine it here for clarity.
interface KnowledgeCardData {
  id: string;
  title: string;
  description: string;
}

interface KnowledgeCardProps {
  card: KnowledgeCardData;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ card }) => {
  // Get the setter function from the store
  const setFocusedNodeId = useAppStore((state) => state.setFocusedNodeId);
  
  const handleFocusClick = () => {
    console.log(`Focus graph requested for node: ${card.id}`);
    // Call the Zustand action to set the focused node ID
    setFocusedNodeId(card.id);
  };

  return (
    <Card className="h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
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
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" /> Focus on Graph
          </Button>
      </div>
    </Card>
  );
};

export default KnowledgeCard; 