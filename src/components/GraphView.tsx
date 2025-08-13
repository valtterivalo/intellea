'use client';

import React, { useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import OutputRenderer from '@/components/OutputRenderer';
import Breadcrumbs from '@/components/Breadcrumbs';
import FullscreenGraphContainer from '@/components/FullscreenGraphContainer';
import ExpandedConceptCard from '@/components/ExpandedConceptCard';
import StickyKnowledgeCard from '@/components/StickyKnowledgeCard';
import OnboardingModal from '@/components/OnboardingModal';
import NewSessionPrompt from '@/components/NewSessionPrompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useShallow } from 'zustand/react/shallow';
import { useNodeExpansion } from './hooks/useNodeExpansion';

interface GraphViewProps {
  onSubscribe: () => Promise<void>;
  isCheckoutLoading: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (b: boolean) => void;
}

const GraphView: React.FC<GraphViewProps> = ({
  onSubscribe,
  isCheckoutLoading,
  showOnboarding,
  setShowOnboarding,
}) => {
  const {
    output,
    isLoading,
    isSessionLoading,
    subscriptionStatus,
    isSubscriptionLoading,
    forceExpandRequest,
    currentSessionTitle,
  } = useAppStore(
    useShallow((state) => ({
      output: state.output,
      isLoading: state.isLoading,
      isSessionLoading: state.isSessionLoading,
      subscriptionStatus: state.subscriptionStatus,
      isSubscriptionLoading: state.isSubscriptionLoading,
      forceExpandRequest: state.forceExpandRequest,
      currentSessionTitle: state.currentSessionTitle,
    }))
  );

  const {
    setForceExpandRequest,
    removeUnpinnedChildren,
    setKnowledgeCardsRef,
    setGraphRef,
  } = useAppStore.getState();

  const { handleNodeExpand, localExpandingNodeId } = useNodeExpansion();

  const knowledgeCardsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const setKnowledgeCardsRefCallback = useCallback(
    (el: HTMLDivElement | null) => {
      setKnowledgeCardsRef(el);
      knowledgeCardsRef.current = el;
    },
    [setKnowledgeCardsRef]
  );

  const handleForceExpandConfirm = () => {
    if (forceExpandRequest) {
      const { nodeId } = forceExpandRequest;
      removeUnpinnedChildren(nodeId);
      const out = useAppStore.getState().output;
      const vizData = out && typeof out === 'object' ? out.visualizationData : null;
      const nodeToExpand = vizData?.nodes.find((n) => n.id === nodeId);
      if (nodeToExpand) {
        handleNodeExpand(nodeId, nodeToExpand.label || '');
      }
      setForceExpandRequest(null);
    }
  };

  const getSessionTitle = (): string => {
    return currentSessionTitle || 'Untitled Session';
  };

  return (
    <main className="flex-1 overflow-hidden flex flex-col min-h-0">
      <div className="flex-1 overflow-hidden flex flex-col max-w-6xl mx-auto w-full min-h-0">
        {output && typeof output === 'object' ? (
          <Card className="m-4 flex-1 flex flex-col overflow-hidden min-h-0">
            <CardHeader className="flex-shrink-0">
              <CardTitle>{getSessionTitle()}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <ScrollArea className="h-full w-full" ref={scrollContainerRef}>
                <div className="p-4 max-w-full overflow-hidden">
                  <Breadcrumbs />
                  <OutputRenderer
                    onNodeExpand={handleNodeExpand}
                    expandingNodeId={localExpandingNodeId}
                    knowledgeCardsRef={setKnowledgeCardsRefCallback}
                    graphRef={setGraphRef}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : output && typeof output === 'string' ? (
          <Card className="m-4 flex-1 flex flex-col overflow-hidden min-h-0">
            <CardHeader className="flex-shrink-0">
              <CardTitle>{getSessionTitle()}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <ScrollArea className="h-full w-full" ref={scrollContainerRef}>
                <div className="p-4 max-w-full overflow-hidden">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Generation Error</AlertTitle>
                    <AlertDescription>{output}</AlertDescription>
                  </Alert>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {isLoading || isSessionLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>{isSessionLoading ? 'Loading session...' : 'Generating response...'}</span>
              </div>
            ) : isSubscriptionLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Loading subscription status...</span>
              </div>
            ) : subscriptionStatus !== 'active' ? (
              <div className="text-center space-y-2">
                <p>An active subscription is required to explore.</p>
                <Button variant="default" onClick={onSubscribe} disabled={isCheckoutLoading}>
                  {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Subscribe Now
                </Button>
              </div>
            ) : (
              <NewSessionPrompt />
            )}
          </div>
        )}
      </div>
      <FullscreenGraphContainer onNodeExpand={handleNodeExpand} expandingNodeId={localExpandingNodeId} />
      <ExpandedConceptCard />
      <OnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <AlertDialog
        open={!!forceExpandRequest}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) {
            setForceExpandRequest(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to re-expand this node?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all direct child nodes that you haven&apos;t pinned and generate new ones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceExpandConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <StickyKnowledgeCard knowledgeCardsRef={knowledgeCardsRef} scrollContainerRef={scrollContainerRef} />
    </main>
  );
};

export default GraphView;
