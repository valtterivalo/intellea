'use client';
/**
 * @fileoverview Animates and displays model outputs.
 * Exports OutputRenderer.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';
import VisualizationComponent from './VisualizationComponent';
import { Button } from '@/components/ui/button';
import { Maximize } from 'lucide-react';

// Import the new section components
import ExplanationSection from './ExplanationSection';
import KnowledgeCardsSection from './KnowledgeCardsSection';

// Define props for OutputRenderer
interface OutputRendererProps {
  onNodeExpand: (nodeId: string, nodeLabel: string) => void;
  expandingNodeId: string | null;
  knowledgeCardsRef?: (instance: HTMLDivElement | null) => void;
  graphRef?: (instance: HTMLDivElement | null) => void;
}



// Update OutputRenderer to accept props
const OutputRenderer: React.FC<OutputRendererProps> = ({
  onNodeExpand,
  expandingNodeId,
  knowledgeCardsRef,
  graphRef,
}) => {
  // Select the output state to determine rendering mode
  const output = useAppStore((state) => state.output);
  const toggleGraphFullscreen = useAppStore((state) => state.toggleGraphFullscreen);
  const isGraphFullscreen = useAppStore((state) => state.isGraphFullscreen);

  // Initial state
  if (!output) {
    return <p className="text-gray-400 text-center">Enter a topic to learn and explore...</p>;
  }

  // Error state
  if (typeof output === 'string' && output.startsWith('Error:')) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-red-400 whitespace-pre-wrap w-full text-left p-4 bg-red-900/20 rounded-md"
      >
        {output}
      </motion.div>
    );
  }

  // Valid response state: Render the section components
  // Each section component will fetch its own data from the store and render conditionally
  if (isIntelleaResponse(output)) {
    // Define variants for visibility
    const graphContainerVariants = {
      visible: { opacity: 1, transition: { duration: 0.2 }, pointerEvents: 'auto' as const },
      hidden: { opacity: 0, transition: { duration: 0.2 }, pointerEvents: 'none' as const }
    };

    return (
      <div className="space-y-6">
        <ExplanationSection />
        <div ref={knowledgeCardsRef}>
          <KnowledgeCardsSection />
        </div>

        {/* Use motion.div to control visibility of the non-fullscreen graph */}
        <motion.div
          variants={graphContainerVariants}
          animate={isGraphFullscreen ? 'hidden' : 'visible'}
          initial={false} // Avoid initial animation unless isGraphFullscreen starts true
          ref={graphRef}
        >
          {output.visualizationData && (
            <section aria-labelledby="visualization-heading">
              <h2 id="visualization-heading" className="text-xl font-semibold mb-3 text-center">Knowledge Graph</h2>
              <div className="relative w-4/5 mx-auto">
                <VisualizationComponent
                  visualizationData={output.visualizationData}
                  onNodeExpand={onNodeExpand}
                  expandingNodeId={expandingNodeId}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-card/50 hover:bg-card/80 backdrop-blur-sm rounded-full p-1.5 text-foreground/70 hover:text-foreground"
                  onClick={toggleGraphFullscreen}
                  aria-label="Enter fullscreen graph view"
                  tabIndex={isGraphFullscreen ? -1 : 0} // Prevent tabbing when hidden
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </section>
          )}
        </motion.div>
      </div>
    );
  }
  
  // Fallback for unexpected string output (not an error)
  // Could potentially render ExplanationSection if we want basic markdown display
  if (typeof output === 'string') {
     // Decide how to handle generic string output - maybe just show explanation?
     // For now, treating as unexpected format
     console.warn("OutputRenderer received unexpected string format (not an error):", output);
  }
  
  // Fallback for completely unexpected format
  return <p className="text-yellow-500">Could not render output. Unexpected format received.</p>;
};

export default OutputRenderer; // No need for React.memo here as it has no props 
