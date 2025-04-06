'use client'; // Mark as a Client Component

import React, { useEffect, useState } from 'react';
import { useAppStore, CognitionResponse } from '@/store/useAppStore';
import OutputRenderer from '@/components/OutputRenderer';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCcw, LogOut, PanelLeft, Plus, Trash2, Save, AlertCircle } from "lucide-react";
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

export default function MainAppClient() {
  const supabase = createClient();
  const router = useRouter();
  
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
    updateNodePositions,
    sessionsList,
    fetchSessions,
    loadSession,
    createSession,
    saveSession,
    deleteSession,
    currentSessionId,
    currentSessionTitle,
    setCurrentSessionTitle,
    isSessionListLoading,
    isSessionLoading,
    isSavingSession,
    resetActiveSessionState,
    error,
    setError,
  } = useAppStore();

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetActiveSessionState();
    router.refresh();
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;
    const currentPrompt = prompt;
    const currentOutputBeforeSubmit = output;
    const activeSessionId = currentSessionId;

    console.log(`Submitting prompt: "${currentPrompt}" for session ${activeSessionId}`);
    setIsLoading(true);
    setOutput(null);
    setActivePrompt(null);
    setError(null);

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

      if (activeSessionId) {
        const titleToSave = useAppStore.getState().currentSessionTitle || 'Untitled Session';
        console.log(`Attempting auto-save for session ${activeSessionId} after generation.`);
        saveSession();
      } else {
        console.warn("No active session ID, cannot auto-save after generation.");
      }

    } catch (error) {
      console.error("Failed to fetch or process AI response:", error);
      const errorMessage = `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`;
      setOutput(errorMessage);
      setError(errorMessage);
      setActivePrompt(currentPrompt);
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

  const handleNodeExpand = async (nodeId: string, nodeLabel: string) => {
    if (isLoading || expandingNodeId) return; 
    console.log(`Expanding node: ID=${nodeId}, Label="${nodeLabel}"`);
    setExpandingNodeId(nodeId);
    setError(null);

    const currentOutput = useAppStore.getState().output;
    let currentGraphData = null;
    if (typeof currentOutput === 'object' && currentOutput !== null && currentOutput.visualizationData) {
      currentGraphData = currentOutput.visualizationData;
    } else {
      console.error("Cannot expand node: Current output is invalid or missing visualizationData.");
      setError("Cannot expand graph: visualization data is missing.");
      setExpandingNodeId(null);
      return;
    }
    let simplifiedGraphContext = null;
    if (currentGraphData && currentGraphData.nodes && currentGraphData.links) {
        simplifiedGraphContext = {
            nodes: currentGraphData.nodes.map(({ id, label }) => ({ id, label })).slice(0, 50),
            links: currentGraphData.links.map(({ source, target }) => ({
                source: typeof source === 'object' && source !== null ? (source as any).id : source,
                target: typeof target === 'object' && target !== null ? (target as any).id : target,
            })).slice(0, 100)
        };
    } else {
        console.warn("handleNodeExpand: currentGraphData or its nodes/links are missing, sending null context.");
    }
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          nodeLabel,
          currentGraph: simplifiedGraphContext 
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
      if (data.expansionData && (data.expansionData.nodes?.length > 0 || data.expansionData.links?.length > 0)) {
        addGraphExpansion(data.expansionData);
        console.log("Expansion successful, data merged into store.");
        if (currentSessionId) {
           console.log(`Attempting auto-save for session ${currentSessionId} after expansion.`);
           saveSession();
        } else {
            console.warn("No active session ID, cannot auto-save after expansion.");
        }
      } else {
        console.log("Expansion API returned no new nodes or links.");
      }
    } catch (error) {
      console.error("Failed to fetch or process graph expansion:", error);
      const message = `Expansion Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(message);
    } finally {
      setExpandingNodeId(null);
    }
  };

  useEffect(() => {
    console.log("MainAppClient mounted, fetching sessions...");
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    // Retrieve the persisted ID directly from the store on mount
    const persistedSessionId = useAppStore.getState().currentSessionId;
    console.log("Checking for persisted session ID on mount:", persistedSessionId);
    if (persistedSessionId) {
      // Check if the list already contains this session and data isn't loaded yet
      // Avoid reloading if already loaded (e.g., by direct navigation)
       const alreadyLoaded = useAppStore.getState().output !== null && useAppStore.getState().currentSessionId === persistedSessionId;
       if (!alreadyLoaded) {
           console.log(`Persisted session ID ${persistedSessionId} found, attempting to load...`);
           loadSession(persistedSessionId);
       } else {
           console.log(`Persisted session ID ${persistedSessionId} found, but session seems already loaded.`);
       }
    } else {
        console.log("No persisted session ID found.");
    }
    // Run only once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSession]); // Depend on loadSession action

  const handleCreateSession = async () => {
    setIsSheetOpen(false);
    const newId = await createSession();
    if (newId) {
        console.log("New session created with ID:", newId);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
     if (sessionId === currentSessionId) {
         setIsSheetOpen(false);
         return;
     }
     console.log("Requesting load session:", sessionId);
     setIsSheetOpen(false);
     await loadSession(sessionId);
  };

   const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
     if (window.confirm(`Are you sure you want to delete session "${sessionTitle}"? This cannot be undone.`)) {
       console.log("Requesting delete session:", sessionId);
       await deleteSession(sessionId);
     }
   };

   const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       setCurrentSessionTitle(event.target.value);
   }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div className="flex h-screen">

        <SheetContent side="left" className="w-[300px] sm:w-[400px] flex flex-col">
          <SheetHeader>
            <SheetTitle>Your Sessions</SheetTitle>
            <SheetDescription>
              Create, load, or delete your exploration sessions.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-grow pr-4">
            {isSessionListLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error && sessionsList.length === 0 ? (
                 <Alert variant="destructive">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Error Loading Sessions</AlertTitle>
                   <AlertDescription>{error}</AlertDescription>
                 </Alert>
            ) : sessionsList.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No sessions found. Create one!</p>
            ) : (
              <div className="space-y-2">
                {sessionsList.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted ${
                      session.id === currentSessionId ? 'bg-muted font-semibold' : ''
                    }`}
                    onClick={() => handleLoadSession(session.id)}
                  >
                    <div className="flex flex-col overflow-hidden mr-2">
                       <span className="text-sm truncate" title={session.title}>
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
                        handleDeleteSession(session.id, session.title);
                      }}
                      title="Delete Session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <SheetFooter className="mt-auto pt-4 border-t">
             <Button onClick={handleCreateSession} className="w-full" disabled={isSavingSession}>
               {isSavingSession && sessionsList.length === 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" /> }
               New Session
             </Button>
          </SheetFooter>
        </SheetContent>

        <main className="flex flex-col flex-grow">
           <div className="w-full max-w-5xl mx-auto flex flex-col flex-grow p-4">
               <header className="mb-4 flex justify-between items-center flex-shrink-0">
                 <div className="flex items-center gap-2">
                    <SheetTrigger asChild>
                       <Button variant="outline" size="icon" title="Manage Sessions">
                          <PanelLeft className="h-4 w-4" />
                       </Button>
                    </SheetTrigger>
                    {currentSessionId ? (
                        <Input
                          value={currentSessionTitle || ''}
                          onChange={handleTitleChange}
                          onBlur={() => saveSession()}
                          placeholder="Session Title"
                          className="text-lg font-bold flex-grow max-w-lg"
                          disabled={isSavingSession}
                        />
                    ) : (
                        <h1 className="text-3xl font-bold py-2">Cognition</h1>
                    )}
                 </div>
                 <div className="flex items-center gap-2">
                   <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
                     <LogOut className="h-4 w-4" />
                   </Button>
                 </div>
               </header>

                {error && !isSessionListLoading && (
                   <Alert variant="destructive" className="mb-4 flex-shrink-0">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                      <Button variant="ghost" size="sm" onClick={() => setError(null)} className="absolute top-1 right-1">
                         &times;
                      </Button>
                   </Alert>
                 )}

               <Card className="flex-grow flex flex-col mb-4 overflow-hidden">
                 <CardHeader className="flex-shrink-0">
                   <CardTitle>{currentSessionTitle ? `Exploring: ${currentSessionTitle}` : (activePrompt ? formatPromptAsTitle(activePrompt) : "Response")}</CardTitle>
                 </CardHeader>
                 <CardContent className="flex-grow overflow-y-auto p-4">
                    {isSessionLoading ? (
                       <div className="flex justify-center items-center h-full">
                           <Loader2 className="h-8 w-8 animate-spin text-primary" />
                           <p className="ml-2 text-muted-foreground">Loading session...</p>
                       </div>
                    ) : isLoading ? (
                      <div className="flex justify-center items-center h-full">
                         <p className="text-muted-foreground animate-pulse">Processing...</p>
                      </div>
                    ) : output ? (
                      <OutputRenderer
                        onNodeExpand={handleNodeExpand}
                        expandingNodeId={expandingNodeId}
                      />
                     ) : (
                         <div className="flex justify-center items-center h-full">
                            <p className="text-muted-foreground">
                                {currentSessionId ? "Submit a prompt to start exploring this session." : "Select a session or create a new one to begin."}
                            </p>
                         </div>
                     )}
                 </CardContent>
               </Card>

               <footer className="flex flex-col gap-3 flex-shrink-0">
                 <div className="flex gap-2">
                   <Textarea
                     className="flex-grow resize-none shadow-sm"
                     placeholder={currentSessionId ? "Ask a follow-up question or new topic..." : "Select or create a session first..."}
                     rows={3}
                     value={prompt}
                     onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                     onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleSubmit();
                       }
                     }}
                     disabled={isLoading || isSessionLoading || !currentSessionId}
                   />
                   <Button
                     onClick={handleSubmit}
                     disabled={isLoading || isSessionLoading || !prompt.trim() || !currentSessionId}
                     size="lg"
                   >
                     {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                   </Button>
                 </div>
               </footer>
           </div>
        </main>

      </div>
    </Sheet>
  );
} 