'use client';

import React, { useState } from 'react';
import VisualizationComponent from '@/components/VisualizationComponent';
import { Button } from "@/components/ui/button";

// Mock data for testing the minimap
const mockGraphData = {
  nodes: [
    { id: "1", label: "Artificial Intelligence", x: 0, y: 0, z: 0 },
    { id: "2", label: "Machine Learning", x: 100, y: 50, z: 0 },
    { id: "3", label: "Deep Learning", x: 200, y: 100, z: 0 },
    { id: "4", label: "Neural Networks", x: 150, y: 200, z: 0 },
    { id: "5", label: "Computer Vision", x: 50, y: 150, z: 0 },
    { id: "6", label: "Natural Language Processing", x: -50, y: 100, z: 0 },
    { id: "7", label: "Reinforcement Learning", x: 250, y: 50, z: 0 },
    { id: "8", label: "Data Science", x: -100, y: 50, z: 0 },
  ],
  links: [
    { source: "1", target: "2" },
    { source: "2", target: "3" },
    { source: "3", target: "4" },
    { source: "2", target: "5" },
    { source: "1", target: "6" },
    { source: "2", target: "7" },
    { source: "1", target: "8" },
  ]
};

// Test page that bypasses authentication for development/testing
export default function TestPage() {
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);

  const handleNodeExpand = (nodeId: string, nodeLabel: string) => {
    console.log(`Expanding node: ${nodeId} - ${nodeLabel}`);
    setExpandingNodeId(nodeId);
    // Simulate expansion delay
    setTimeout(() => {
      setExpandingNodeId(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">Minimap Test Page</h1>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </header>
      
      <main className="flex-1 p-4">
        <div className="h-full">
          <VisualizationComponent
            visualizationData={mockGraphData}
            onNodeExpand={handleNodeExpand}
            expandingNodeId={expandingNodeId}
          />
        </div>
      </main>
    </div>
  );
} 