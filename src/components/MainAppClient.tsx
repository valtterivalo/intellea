'use client'; // Mark as a Client Component

import React, { useEffect, useState } from 'react';
import { useAppStore, IntelleaResponse, NodeObject, LinkObject, SessionSummary, GraphData, KnowledgeCard } from '@/store/useAppStore';
import OutputRenderer from '@/components/OutputRenderer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCcw, LogOut, PanelLeft, Plus, Trash2, Save, AlertCircle, Sparkles, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import FullscreenGraphContainer from '@/components/FullscreenGraphContainer';
import ExpandedConceptCard from '@/components/ExpandedConceptCard';
import { loadStripe } from '@stripe/stripe-js';
import { useShallow } from 'zustand/react/shallow';

// Ensure Stripe publishable key is set
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function MainAppClient() {
  const supabase = createClient();
  const router = useRouter();
  
  const {
    prompt,
    output,
    isLoading,
    activePrompt,
    sessionsList,
    currentSessionId,
    currentSessionTitle,
    isSessionListLoading,
    isSessionLoading,
    isSavingSession,
    error,
    subscriptionStatus,
    isSubscriptionLoading,
  } = useAppStore(useShallow((state) => ({
    prompt: state.prompt,
    output: state.output,
    isLoading: state.isLoading,
    activePrompt: state.activePrompt,
    sessionsList: state.sessionsList,
    currentSessionId: state.currentSessionId,
    currentSessionTitle: state.currentSessionTitle,
    isSessionListLoading: state.isSessionListLoading,
    isSessionLoading: state.isSessionLoading,
    isSavingSession: state.isSavingSession,
    error: state.error,
    subscriptionStatus: state.subscriptionStatus,
    isSubscriptionLoading: state.isSubscriptionLoading,
  })));

  const {
    setPrompt,
    setOutput,
    setLoading,
    setActivePrompt,
    addGraphExpansion,
    fetchSessions,
    loadSession,
    createSession,
    saveSession,
    deleteSession,
    updateSessionTitleLocally,
    resetActiveSessionState,
    setError,
    fetchSubscriptionStatus,
  } = useAppStore.getState();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [localExpandingNodeId, setLocalExpandingNodeId] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetActiveSessionState();
    router.refresh();
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;
    if (subscriptionStatus !== 'active') {
      setError("You need an active subscription to generate new content.");
      return;
    }
    const currentPrompt = prompt;
    let activeSessionId = useAppStore.getState().currentSessionId;

    console.log(`Submit triggered. Prompt: "${currentPrompt}", Current Session ID: ${activeSessionId}`);
    setLoading(true);
    setOutput(null);
    setActivePrompt(null);
    setError(null);

    try {
      let sessionCreatedOrUpdated = false;

      if (activeSessionId === null) {
        console.log("No active session ID, attempting to create new session...");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not logged in. Cannot create session.");
        }
        const newSessionId = await createSession(supabase, user.id, currentPrompt);
        if (newSessionId) {
          console.log("New session created and initial data loaded by store action. ID:", newSessionId);
          sessionCreatedOrUpdated = true;
        } else {
          console.error("handleSubmit: createSession action failed.");
        }
      } else {
        console.log(`Submitting follow-up prompt for existing session ${activeSessionId}`);
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: currentPrompt }),
        });
        if (!response.ok) {
          let errorData;
          try { errorData = await response.json(); } catch { /* ignore */ }
          throw new Error(errorData?.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setOutput(data.output as IntelleaResponse);
        setActivePrompt(currentPrompt);
        sessionCreatedOrUpdated = true;

        console.log(`Attempting auto-save for session ${activeSessionId} after follow-up generation.`);
        saveSession(supabase);
      }

    } catch (error) {
      console.error("Failed during handleSubmit:", error);
      const errorMessage = `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`;
      if (activeSessionId !== null) { 
         setOutput(errorMessage);
      }
      setError(errorMessage);
      setActivePrompt(currentPrompt);
    } finally {
      setLoading(false);
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

  const handleNodeExpand = async (nodeId: string, nodeLabel: string) => {
    if (isLoading || localExpandingNodeId) return; 
    if (subscriptionStatus !== 'active') {
      setError("You need an active subscription to expand the graph.");
      return;
    }
    console.log(`Expanding node: ID=${nodeId}, Label="${nodeLabel}"`);
    setLocalExpandingNodeId(nodeId);
    setError(null);

    const currentOutput = useAppStore.getState().output;
    let currentGraphData = null;
    if (typeof currentOutput === 'object' && currentOutput !== null && 'visualizationData' in currentOutput && currentOutput.visualizationData) {
      currentGraphData = currentOutput.visualizationData;
    } else {
      console.error("Cannot expand node: Current output is invalid or missing visualizationData.");
      setError("Cannot expand graph: visualization data is missing.");
      setLocalExpandingNodeId(null);
      return;
    }

    // **Clean the graph data before sending**
    const cleanedNodes = currentGraphData.nodes.map(({ id, label, fx, fy, fz, isRoot }) => ({ 
        id, 
        label, 
        fx, // Include fixed positions for context if needed (can be omitted if too large)
        fy, 
        fz, 
        isRoot // Keep isRoot flag
    }));
    const cleanedLinks = currentGraphData.links.map(({ source, target }) => ({ 
        source: typeof source === 'object' && source !== null ? (source as NodeObject).id : source as string, 
        target: typeof target === 'object' && target !== null ? (target as NodeObject).id : target as string 
    }));
    const cleanedVisualizationData = { nodes: cleanedNodes, links: cleanedLinks };

    // ADDED: Get current knowledge cards for the request context
    const currentKnowledgeCards = typeof currentOutput === 'object' && currentOutput !== null && 'knowledgeCards' in currentOutput && currentOutput.knowledgeCards
        ? currentOutput.knowledgeCards
        : [];

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          nodeLabel,
          // Send the FULL current visualization data and cards, now cleaned
          currentVisualizationData: cleanedVisualizationData, 
          currentKnowledgeCards: currentKnowledgeCards
        }),
      });
      if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } catch { /* ignore */ }
        throw new Error(errorData?.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      // UPDATED: Check for the new response structure and pass it to the store action
      // The response payload directly matches the ExpansionResponse interface from the store
      if (data && data.updatedVisualizationData && data.newKnowledgeCards) {
        // Pass supabase client to the action
        addGraphExpansion(data, nodeId, supabase); 
        console.log("Expansion successful, data processed by store.");
        // Autosave is now handled within the addGraphExpansion action itself
      } else {
        console.log("Expansion API returned an unexpected response structure or no new data.");
        // Optionally set an error or notification here
      }
    } catch (error) {
      console.error("Failed to fetch or process graph expansion:", error);
      const message = `Expansion Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(message);
    } finally {
      setLocalExpandingNodeId(null);
    }
  };

  const handleSubscribe = async () => {
    setIsCheckoutLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-checkout', { method: 'POST' });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.error || 'Failed to create checkout session');
      }
      const { sessionId } = await response.json();
      if (!sessionId) throw new Error('Missing session ID from checkout response');

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe.js failed to load');
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (err) {
      console.error("Subscribe error:", err);
      setError(`Subscription failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create portal session');
      }
      const { url } = await response.json();
      if (!url) throw new Error('Missing portal URL from response');
      window.location.href = url;
    } catch (err) {
      console.error("Manage subscription error:", err);
      setError(`Failed to open portal: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPortalLoading(false);
    }
  };

  useEffect(() => {
    console.log("MainAppClient mounted, attempting to fetch sessions and subscription status...");
    const getUserAndFetch = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
            console.log("User found, fetching sessions and status for ID:", session.user.id);
            fetchSessions(supabase, session.user.id);
            fetchSubscriptionStatus(supabase, session.user.id);
        } else {
            console.log("No active user session found, cannot fetch sessions or status.");
            resetActiveSessionState();
        }
    };
    getUserAndFetch();
  }, [fetchSessions, fetchSubscriptionStatus, supabase, resetActiveSessionState]);

  useEffect(() => {
    const persistedSessionId = useAppStore.getState().currentSessionId;
    console.log("Checking for persisted session ID on mount:", persistedSessionId);
    if (persistedSessionId) {
       const alreadyLoaded = useAppStore.getState().output !== null && useAppStore.getState().currentSessionId === persistedSessionId;
       if (!alreadyLoaded) {
           console.log(`Persisted session ID ${persistedSessionId} found, attempting to load...`);
           loadSession(persistedSessionId, supabase);
       } else {
           console.log(`Persisted session ID ${persistedSessionId} found, but session seems already loaded.`);
       }
    } else {
        console.log("No persisted session ID found.");
    }
  }, [loadSession, supabase]);

  const handleCreateSession = async () => {
    console.log("New Session button clicked. Resetting state.");
    setIsSheetOpen(false);
    resetActiveSessionState();
  };

  const handleLoadSession = async (sessionId: string) => {
    console.log("Load session clicked:", sessionId);
    setIsSheetOpen(false);
    if (sessionId !== currentSessionId) {
      await loadSession(sessionId, supabase);
    }
  };

   const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
        if (window.confirm(`Are you sure you want to delete the session "${sessionTitle || 'Untitled Session'}"?`)) {
            console.log("Deleting session:", sessionId);
            setIsSheetOpen(false);
            await deleteSession(sessionId, supabase);
        }
   };

   const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       updateSessionTitleLocally(event.target.value);
   }

   const handleTitleBlur = () => {
       if (currentSessionId && subscriptionStatus === 'active') {
           saveSession(supabase); 
       } else if (currentSessionId) {
           console.warn("Title blur: Not saving title as user is not subscribed.");
       }
   }

  const promptDisabled = isLoading || isSubscriptionLoading || (subscriptionStatus !== 'active' && !currentSessionId);
  const sendDisabled = promptDisabled || !prompt.trim();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] flex flex-col">
              <SheetHeader>
                <SheetTitle>Your Sessions</SheetTitle>
                <SheetDescription>
                  Create, load, or delete your exploration sessions.
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-grow pr-4">
                {isSessionListLoading || isSubscriptionLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error && !sessionsList ? (
                     <Alert variant="destructive">
                       <AlertCircle className="h-4 w-4" />
                       <AlertTitle>Error Loading</AlertTitle>
                       <AlertDescription>{error}</AlertDescription>
                     </Alert>
                ) : sessionsList && sessionsList.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No sessions found. Create one!</p>
                ) : sessionsList && sessionsList.length > 0 ? (
                  <div className="space-y-2">
                    {sessionsList.map((session: SessionSummary) => (
                      <div
                        key={session.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted ${
                          session.id === currentSessionId ? 'bg-muted font-semibold' : ''
                        }`}
                        onClick={() => handleLoadSession(session.id)}
                      >
                        <div className="flex flex-col overflow-hidden mr-2">
                           <span className="text-sm truncate" title={session.title ?? 'Untitled Session'}>
                                {session.title || 'Untitled Session'}
                           </span>
                           <span className="text-xs text-muted-foreground truncate">
                               Updated {formatDistanceToNow(new Date(session.last_updated_at), { addSuffix: true })}
                           </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id, session.title ?? 'Untitled Session');
                          }}
                          title="Delete Session"
                          disabled={isSessionLoading || isSavingSession}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </ScrollArea>
              <SheetFooter className="mt-auto pt-4 border-t">
                 <Button 
                    onClick={handleCreateSession} 
                    className="w-full" 
                    disabled={isSavingSession || isSessionLoading || isSubscriptionLoading || subscriptionStatus !== 'active'}
                    title={subscriptionStatus !== 'active' ? "Subscription required" : "Create new session"}
                 >
                   <Plus className="mr-2 h-4 w-4" />
                   New Session
                 </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          {currentSessionId ? (
            <Input 
              value={currentSessionTitle ?? ''} 
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              className="text-lg font-semibold leading-none tracking-tight w-auto max-w-md"
              disabled={isSavingSession || isSessionLoading}
            />
          ) : (
            <h1 className="text-lg font-semibold leading-none tracking-tight">New Session</h1>
          )}
          {isSavingSession && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          {isSubscriptionLoading ? (
             <Loader2 className="h-4 w-4 animate-spin" />
          ) : subscriptionStatus === 'active' ? (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
            >
              {isPortalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />} 
              Manage Billing
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleSubscribe}
              disabled={isCheckoutLoading}
            >
              {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} 
              Subscribe Now
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        {output && typeof output === 'object' ? (
          <Card className="m-4 flex-1 flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle>{formatPromptAsTitle(activePrompt)}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <Breadcrumbs />
              <OutputRenderer
                onNodeExpand={handleNodeExpand}
                expandingNodeId={localExpandingNodeId}
              />
            </CardContent>
          </Card>
        ) : output && typeof output === 'string' ? (
          <Card className="m-4 flex-1 flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle>{formatPromptAsTitle(activePrompt)}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
                <Alert variant="destructive">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Generation Error</AlertTitle>
                   <AlertDescription>{output}</AlertDescription>
                 </Alert>
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
                    <Button 
                      variant="default" 
                      onClick={handleSubscribe}
                      disabled={isCheckoutLoading}
                    >
                      {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} 
                      Subscribe Now
                    </Button>
                 </div>
              ) : (
                 <span>Enter a topic or question below to start exploring.</span>
            )}
          </div>
        )}
        <FullscreenGraphContainer 
            onNodeExpand={handleNodeExpand} 
            expandingNodeId={localExpandingNodeId} 
        />
        <ExpandedConceptCard />
      </main>

      <footer className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            placeholder={promptDisabled ? "Activate a subscription or load a session to explore." : "Ask about a topic, concept, or process..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={promptDisabled || isLoading}
            className="flex-1 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendDisabled) handleSubmit();
              }
            }}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={sendDisabled}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </Button>
        </div>
      </footer>
    </div>
  );
} 