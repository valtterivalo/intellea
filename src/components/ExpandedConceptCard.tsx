'use client';
/**
 * @fileoverview React component.
 * Exports: ExpandedConceptCard
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';

const ExpandedConceptCard: React.FC = () => {
  const expandedConceptData = useAppStore((state) => state.expandedConceptData);
  const isExpandingConcept = useAppStore((state) => state.isExpandingConcept);
  const streamingContent = useAppStore((state) => state.streamingContent);
  const clearExpandedConcept = useAppStore((state) => state.clearExpandedConcept);
  const setFocusedNodeId = useAppStore((state) => state.setFocusedNodeId);
  const setActiveFocusPath = useAppStore((state) => state.setActiveFocusPath);
  const visualizationData = useAppStore(state => {
    const output = state.output;
    return (output && typeof output === 'object' && 'visualizationData' in output)
      ? output.visualizationData
      : null;
  });

  const focusedNodeId = useAppStore(state => state.focusedNodeId);
  const nodeNotes = useAppStore(state => state.nodeNotes);
  const setNodeNote = useAppStore(state => state.setNodeNote);
  const completedNodeIds = useAppStore(state => state.completedNodeIds);
  const toggleCompleted = useAppStore(state => state.toggleCompleted);

  const [noteValue, setNoteValue] = useState('');
  const isCompleted = focusedNodeId ? completedNodeIds.has(focusedNodeId) : false;

  useEffect(() => {
    if (focusedNodeId) {
      setNoteValue(nodeNotes[focusedNodeId] || '');
    }
  }, [focusedNodeId, nodeNotes]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearExpandedConcept();
      }
    };

    if (expandedConceptData) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [expandedConceptData, clearExpandedConcept]);

  const handleRelatedConceptClick = (nodeId: string) => {
    if (visualizationData) {
      // Set focus on the related concept
      setFocusedNodeId(nodeId);
      setActiveFocusPath(nodeId, visualizationData);
      // Close the expanded view
      clearExpandedConcept();
    }
  };

  return (
    <>
      {/* Loading/Streaming overlay - separate from content for immediate visibility */}
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.95, pointerEvents: 'none' as const },
          visible: { opacity: 1, scale: 1, pointerEvents: 'auto' as const },
        }}
        initial="hidden"
        animate={isExpandingConcept ? "visible" : "hidden"}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        aria-modal={isExpandingConcept}
        role="dialog"
        aria-hidden={!isExpandingConcept}
      >
        {streamingContent ? (
          <div className="relative h-[90vh] w-[90vw] rounded-lg border bg-card shadow-xl overflow-hidden">
            <div className="h-full flex flex-col overflow-hidden p-6">
              <div className="pb-2 pt-2 border-b mb-4 flex items-center gap-2">
                <div className="loader"></div>
                <h1 className="text-2xl font-bold">Generating concept explanation...</h1>
              </div>
              <div className="flex-1 overflow-auto pr-2">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                      h2: ({ ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                      h3: ({ ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                      p: ({ ...props }) => <p className="mb-4" {...props} />,
                      ul: ({ ...props }) => <ul className="mb-4 list-disc pl-6" {...props} />,
                      ol: ({ ...props }) => <ol className="mb-4 list-decimal pl-6" {...props} />,
                    }}
                  >
                    {streamingContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-full"
              onClick={clearExpandedConcept}
              aria-label="Close streaming concept view"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-card p-6 rounded-lg shadow-md border">
            <div className="loader mb-3"></div>
            <p className="text-lg">Expanding concept...</p>
          </div>
        )}
      </motion.div>

      {/* Content overlay - shown only when data is loaded */}
      <motion.div
        ref={containerRef}
        variants={{
          hidden: { opacity: 0, scale: 0.95, pointerEvents: 'none' as const },
          visible: { opacity: 1, scale: 1, pointerEvents: 'auto' as const },
        }}
        initial="hidden"
        animate={expandedConceptData && !isExpandingConcept ? "visible" : "hidden"}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        aria-modal={!!expandedConceptData && !isExpandingConcept}
        role="dialog"
        aria-hidden={!expandedConceptData || isExpandingConcept}
      >
        {expandedConceptData && (
          <div className="relative h-[90vh] w-[90vw] rounded-lg border bg-card shadow-xl overflow-hidden">
            <div className="h-full flex flex-col overflow-hidden p-6">
              <div className="pb-2 pt-2 border-b mb-4">
                <div className="flex items-center justify-between gap-3">
                  <h1 className="text-2xl font-bold">{expandedConceptData.title}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => focusedNodeId && toggleCompleted(focusedNodeId)}
                    className="flex items-center gap-2"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-sky-600" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                    {isCompleted ? 'Learned' : 'Mark learned'}
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto pr-2">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                      h2: ({ ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                      h3: ({ ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                      p: ({ ...props }) => <p className="mb-4" {...props} />,
                      ul: ({ ...props }) => <ul className="mb-4 list-disc pl-6" {...props} />,
                      ol: ({ ...props }) => <ol className="mb-4 list-decimal pl-6" {...props} />,
                    }}
                  >
                    {expandedConceptData.content}
                  </ReactMarkdown>
                </div>
                
                {expandedConceptData.relatedConcepts && expandedConceptData.relatedConcepts.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-bold mb-4">Related Concepts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {expandedConceptData.relatedConcepts.map((concept) => (
                        <Card key={concept.nodeId} className="hover:shadow-md transition-shadow">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-base">{concept.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <p className="text-sm text-muted-foreground">{concept.relation}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2 text-xs"
                              onClick={() => handleRelatedConceptClick(concept.nodeId)}
                            >
                              Focus on this concept
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                <Separator className="my-6" />
                <h3 className="text-xl font-bold mb-2">Your Notes</h3>
                <Textarea
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  className="mb-2"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => focusedNodeId && setNodeNote(focusedNodeId, noteValue)}
                >
                  Save Note
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-full"
              onClick={clearExpandedConcept}
              aria-label="Close expanded concept view"
              tabIndex={expandedConceptData ? 0 : -1}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </motion.div>

      <style jsx global>{`
        .loader {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid #4f46e5;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ExpandedConceptCard; 
