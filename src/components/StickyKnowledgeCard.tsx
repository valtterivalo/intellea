'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import KnowledgeCard from './KnowledgeCard';

interface StickyKnowledgeCardProps {
  knowledgeCardsRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const StickyKnowledgeCard: React.FC<StickyKnowledgeCardProps> = ({
  knowledgeCardsRef,
  scrollContainerRef
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  const { activeClickedNodeId, output } = useAppStore(useShallow(state => ({
    activeClickedNodeId: state.activeClickedNodeId,
    output: state.output
  })));
  
  const knowledgeCards = useMemo(() => {
    return (output && typeof output === 'object' && 'knowledgeCards' in output && Array.isArray(output.knowledgeCards)) 
      ? output.knowledgeCards 
      : [];
  }, [output]);

  // Find the focused card
  const focusedCard = useMemo(() => {
    return activeClickedNodeId 
      ? knowledgeCards.find(card => card.nodeId === activeClickedNodeId) || null
      : null;
  }, [activeClickedNodeId, knowledgeCards]);

  const handleScroll = useCallback(() => {
    const knowledgeCardsElement = knowledgeCardsRef.current;
    const scrollContainer = scrollContainerRef.current;
    
    if (!knowledgeCardsElement || !scrollContainer) {
      setIsSticky(false);
      return;
    }

    const cardsRect = knowledgeCardsElement.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    
    // Check if knowledge cards section is out of view (above the visible area)
    const cardsOutOfView = cardsRect.bottom < containerRect.top + 100; // 100px buffer
    
    setIsSticky(cardsOutOfView);
  }, [knowledgeCardsRef, scrollContainerRef, activeClickedNodeId, isSticky]);

  // Set up portal container
  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  useEffect(() => {
    if (!knowledgeCardsRef.current || !scrollContainerRef.current || !activeClickedNodeId) {
      setIsSticky(false);
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Find the actual scrollable viewport inside ScrollArea
    const viewport = scrollContainer.querySelector('[data-radix-scroll-area-viewport]');
    const actualScrollElement = viewport || scrollContainer;

    actualScrollElement.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();

    return () => {
      actualScrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, activeClickedNodeId, knowledgeCardsRef, scrollContainerRef]);

  // Don't show if no focused card or no portal container
  if (!focusedCard || !activeClickedNodeId || !portalContainer) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isSticky && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 max-h-[70vh] overflow-hidden pointer-events-auto"
          style={{ 
            width: '300px', 
            maxWidth: 'calc(100vw - 2rem)'
          }}
        >
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden">
            <div className="text-xs text-muted-foreground px-3 py-2 border-b bg-muted/50">
              Focused Concept
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-3rem)]">
              <div className="p-3">
                <KnowledgeCard card={focusedCard} variant="sticky" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalContainer
  );
};

export default StickyKnowledgeCard;