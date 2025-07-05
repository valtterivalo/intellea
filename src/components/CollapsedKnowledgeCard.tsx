'use client';
/**
 * @fileoverview React component.
 * Exports: CollapsedKnowledgeCard
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from 'lucide-react'; // Icon for the button

interface CollapsedKnowledgeCardProps {
  nodeId: string;
  title: string;
  onFocus: (nodeId: string) => void;
}

export const CollapsedKnowledgeCard: React.FC<CollapsedKnowledgeCardProps> = ({
  nodeId,
  title,
  onFocus,
}) => {
  const handleFocusClick = () => {
    onFocus(nodeId);
  };

  return (
    <Card className="flex-1 min-w-[200px] max-w-[240px] shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-1 pt-2 px-3">
        <CardTitle className="text-sm line-clamp-1">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 border-t mt-1">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs h-7"
          onClick={handleFocusClick}
        >
          <Camera className="mr-1 h-3 w-3" /> Focus
        </Button>
      </CardContent>
    </Card>
  );
}; 