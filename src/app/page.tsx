'use client'; // Required for hooks

import React from 'react';
import { useAppStore, CognitionResponse } from '@/store/useAppStore'; // Adjust import path if needed
import OutputRenderer from '@/components/OutputRenderer'; // Import the new component
import { Button } from "@/components/ui/button"; // Add Button import
import { Textarea } from "@/components/ui/textarea"; // Add Textarea import
import { Loader2 } from "lucide-react"; // Add Loader icon import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Add Card components

export default function Home() {
  const {
    prompt,
    setPrompt,
    output,
    setOutput,
    isLoading,
    setIsLoading,
    activePrompt,
    setActivePrompt,
    addGraphExpansion,
    expandingNodeId,
    setExpandingNodeId,
  } = useAppStore();

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;

    const currentPrompt = prompt;
    console.log(`Submitting prompt: "${currentPrompt}"`);
    setIsLoading(true);
    setOutput(null);
    setActivePrompt(null);
    let errorOccurred = false;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      });

      if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } catch { /* ignore */ }
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
          throw new Error(data.error);
      }

      setOutput(data.output as CognitionResponse);
      setActivePrompt(currentPrompt);

    } catch (error) {
      console.error("Failed to fetch or process AI response:", error);
      setOutput(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
      setActivePrompt(currentPrompt);
      errorOccurred = true;
    } finally {
      setIsLoading(false);
    }
  };

  const formatPromptAsTitle = (p: string | null): string => {
    if (!p) return "Response";
    let title = p
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    if (title.length > 50) { 
        title = title.substring(0, 47) + "...";
    }
    return title;
  }

  // --- Add Graph Node Expansion Handler ---
  const handleNodeExpand = async (nodeId: string, nodeLabel: string) => {
    if (isLoading || expandingNodeId) return; // Prevent concurrent requests

    console.log(`Expanding node: ID=${nodeId}, Label="${nodeLabel}"`);
    setExpandingNodeId(nodeId); // Set loading state for this node

    const currentOutput = useAppStore.getState().output; // Get latest state directly
    let currentGraphData = null;
    if (typeof currentOutput === 'object' && currentOutput !== null && currentOutput.visualizationData) {
      currentGraphData = currentOutput.visualizationData;
    } else {
      console.error("Cannot expand node: Current output is invalid or missing visualizationData.");
      setExpandingNodeId(null);
      return;
    }

    // --- CRITICAL: Sanitize graph data before sending to API --- 
    // We MUST send only essential info (ids, labels, source/target) to avoid exceeding context limits
    // and reduce token usage/cost. Sending full internal state (positions, ThreeJS objects) 
    // caused context length errors (e.g., 347k tokens vs 128k limit on 2024-04-02).
    let simplifiedGraphContext = null;
    if (currentGraphData && currentGraphData.nodes && currentGraphData.links) {
        simplifiedGraphContext = {
            nodes: currentGraphData.nodes.map(({ id, label }) => ({ id, label })),
            links: currentGraphData.links.map(({ source, target }) => ({
                // Ensure source/target are strings, as react-force-graph might populate them with node objects
                source: typeof source === 'object' && source !== null ? (source as any).id : source,
                target: typeof target === 'object' && target !== null ? (target as any).id : target,
            }))
        };
    } else {
        console.warn("handleNodeExpand: currentGraphData or its nodes/links are missing, sending null context.");
    }
    // --- End Sanitization ---

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send node details and the *simplified* graph state
        body: JSON.stringify({
          nodeId,
          nodeLabel,
          currentGraph: simplifiedGraphContext // Send sanitized { nodes, links }
        }),
      });

      if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } catch { /* ignore */ }
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Check if expansionData exists and has nodes/links
      if (data.expansionData && (data.expansionData.nodes?.length > 0 || data.expansionData.links?.length > 0)) {
        addGraphExpansion(data.expansionData);
        console.log("Expansion successful, data merged into store.");
      } else {
        console.log("Expansion API returned no new nodes or links.");
        // Optionally provide user feedback here (e.g., toast notification)
      }

    } catch (error) {
      console.error("Failed to fetch or process graph expansion:", error);
      // Optionally set an error message in the main output area?
      // setOutput(`Error expanding graph: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
      setExpandingNodeId(null); // Clear loading state regardless of success/failure
    }
  };
  // --- End Graph Node Expansion Handler ---

  return (
    <div className="flex flex-col h-screen p-4 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-center py-2">Cognition</h1>
      </header>

      {/* Main Content Area wrapped in Card */}
      <Card className="flex-grow flex flex-col mb-4 overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <CardTitle>{formatPromptAsTitle(activePrompt)}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
               <p className="text-muted-foreground animate-pulse">Processing...</p>
            </div>
          ) : (
            <OutputRenderer 
              onNodeExpand={handleNodeExpand}
              expandingNodeId={expandingNodeId}
            />
          )}
        </CardContent>
      </Card>

      {/* Input Area */}      
      <footer className="flex flex-col gap-3">
        {/* Prompt Input */}
        <div className="flex gap-2">
          <Textarea
            className="flex-grow resize-none shadow-sm"
            placeholder="Ask about a topic to learn and explore..."
            rows={3}
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            size="lg"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
