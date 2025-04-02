'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore, CognitionResponse } from '@/store/useAppStore';
// Import the interactive quiz component
import QuizComponent from './QuizComponent';
import VisualizationComponent from './VisualizationComponent';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Import the new section components
import ExplanationSection from './ExplanationSection';
import KnowledgeCardsSection from './KnowledgeCardsSection';
import VisualizationSection from './VisualizationSection';
import QuizSection from './QuizSection';

// Define props for OutputRenderer
interface OutputRendererProps {
  onNodeExpand: (nodeId: string, nodeLabel: string) => void;
  expandingNodeId: string | null;
}

// Helper type guard (might need to be exported from store/utils)
function isCognitionResponse(output: any): output is CognitionResponse {
  return typeof output === 'object' && output !== null && ('explanationMarkdown' in output || 'visualizationData' in output || 'knowledgeCards' in output || 'quiz' in output);
}

// --- Custom Markdown Components (Adjusted for theme) --- 
const CustomParagraph = ({ children }: { children?: React.ReactNode }) => {
    return <p className="leading-relaxed">{children}</p>; 
};

const CustomH1 = ({ children }: { children?: React.ReactNode }) => {
    return <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>;
};

const CustomH2 = ({ children }: { children?: React.ReactNode }) => {
    return <h2 className="text-2xl font-semibold mt-5 mb-3">{children}</h2>;
};

const CustomH3 = ({ children }: { children?: React.ReactNode }) => {
    return <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>;
};

// Combine custom components for ReactMarkdown
const markdownComponents: Components = {
    p: CustomParagraph,
    h1: CustomH1,
    h2: CustomH2,
    h3: CustomH3,
    // We can add more custom components here for lists, code blocks, etc. if needed later
};
// --- End Custom Markdown Components ---

// Update OutputRenderer to accept props
const OutputRenderer: React.FC<OutputRendererProps> = ({ 
  onNodeExpand,
  expandingNodeId
}) => {
  // Select the output state to determine rendering mode
  const output = useAppStore((state) => state.output);

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
  if (isCognitionResponse(output)) {
    return (
      <div className="space-y-6">
        <ExplanationSection />
        <KnowledgeCardsSection />
        <VisualizationSection 
          onNodeExpand={onNodeExpand} 
          expandingNodeId={expandingNodeId} 
        />
        <QuizSection />
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