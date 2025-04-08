'use client'; // Mark as a Client Component

import React, { useEffect, useState } from 'react';
import { useAppStore, CognitionResponse, NodeObject, LinkObject, SessionSummary } from '@/store/useAppStore';
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
import FullscreenGraphContainer from '@/components/FullscreenGraphContainer';

export default function MainAppClient() {
  const supabase = createClient();
  const router = useRouter();
  
  const {
    prompt,
    setPrompt,
    output,
    setOutput,
    isLoading,
    setLoading,
    activePrompt,
    setActivePrompt,
    addGraphExpansion,
    sessionsList,
    fetchSessions,
    loadSession,
    createSession,
    saveSession,
    deleteSession,
    currentSessionId,
    currentSessionTitle,
    updateSessionTitleLocally,
    isSessionListLoading,
    isSessionLoading,
    isSavingSession,
    resetActiveSessionState,
    error,
    setError,
  } = useAppStore();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [localExpandingNodeId, setLocalExpandingNodeId] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetActiveSessionState();
    router.refresh();
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;
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
          throw new Error("Session creation failed.");
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
          throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setOutput(data.output as CognitionResponse);
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
    console.log(`Expanding node: ID=${nodeId}, Label="${nodeLabel}"`);
    setLocalExpandingNodeId(nodeId);
    setError(null);

    const currentOutput = useAppStore.getState().output;
    let currentGraphData = null;
    if (typeof currentOutput === 'object' && currentOutput !== null && currentOutput.visualizationData) {
      currentGraphData = currentOutput.visualizationData;
    } else {
      console.error("Cannot expand node: Current output is invalid or missing visualizationData.");
      setError("Cannot expand graph: visualization data is missing.");
      setLocalExpandingNodeId(null);
      return;
    }
    let simplifiedGraphContext = null;
    if (currentGraphData && currentGraphData.nodes && currentGraphData.links) {
        simplifiedGraphContext = {
            nodes: currentGraphData.nodes.map(({ id, label }: NodeObject) => ({ id, label })).slice(0, 50),
            links: currentGraphData.links.map(({ source, target }: LinkObject) => ({
                source: typeof source === 'object' && source !== null ? (source as NodeObject).id : source as string,
                target: typeof target === 'object' && target !== null ? (target as NodeObject).id : target as string,
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
           saveSession(supabase);
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
      setLocalExpandingNodeId(null);
    }
  };

  useEffect(() => {
    console.log("MainAppClient mounted, attempting to fetch sessions...");
    const getUserAndFetch = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
            console.log("User found, fetching sessions for ID:", session.user.id);
            fetchSessions(supabase, session.user.id);
        } else {
            console.log("No active user session found, cannot fetch sessions.");
            // Handle case where user isn't logged in - maybe clear list or set error?
            // useAppStore.getState().setSessionsList([]); // Example: clear list
        }
    };
    getUserAndFetch();
  }, [fetchSessions, supabase]);

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
           loadSession(persistedSessionId, supabase);
       } else {
           console.log(`Persisted session ID ${persistedSessionId} found, but session seems already loaded.`);
       }
    } else {
        console.log("No persisted session ID found.");
    }
    // Run only once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSession, supabase]);

  const handleCreateSession = async () => {
    console.log("New Session button clicked. Resetting state.");
    setIsSheetOpen(false);
    resetActiveSessionState(); // Reset output, active prompt, focus, etc.
    useAppStore.setState({ currentSessionId: null, currentSessionTitle: null, error: null }); // Clear session context
    setPrompt(''); // Clear the prompt input field
    
    // // OLD Logic - Removed:
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //     console.error("Cannot create session: User not logged in.");
    //     setError("You must be logged in to create a session.");
    //     return;
    // }
    // const initialPromptText = useAppStore.getState().prompt;
    // if (!initialPromptText?.trim()) {
    //     console.error("Cannot create session: Initial topic prompt is empty.");
    //     setError("Please enter a topic or question in the prompt area before creating a new session.");
    //     return; // Don't create if prompt is empty
    // }
    // const newId = await createSession(supabase, user.id, initialPromptText);
    // if (newId) {
    //     console.log("New session created with ID:", newId);
    //     setPrompt(''); 
    // }
  };

  const handleLoadSession = async (sessionId: string) => {
     if (sessionId === currentSessionId) {
         setIsSheetOpen(false);
         return;
     }
     console.log("Requesting load session:", sessionId);
     setIsSheetOpen(false);
     await loadSession(sessionId, supabase);
  };

   const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
     if (window.confirm(`Are you sure you want to delete session "${sessionTitle}"? This cannot be undone.`)) {
       console.log("Requesting delete session:", sessionId);
       await deleteSession(sessionId, supabase);
     }
   };

   const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       updateSessionTitleLocally(event.target.value);
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
            ) : error ? (
                 <Alert variant="destructive">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Error Loading Sessions</AlertTitle>
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
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </ScrollArea>
          <SheetFooter className="mt-auto pt-4 border-t">
             <Button onClick={handleCreateSession} className="w-full" disabled={isSavingSession}>
               {isSavingSession && sessionsList && sessionsList.length === 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" /> }
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
                          onBlur={() => saveSession(supabase)}
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
                        expandingNodeId={localExpandingNodeId}
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
                     placeholder={currentSessionId ? "Ask a follow-up question or new topic..." : "Enter a topic or question to start a new session..."}
                     rows={3}
                     value={prompt}
                     onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                     onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleSubmit();
                       }
                     }}
                     disabled={isLoading || isSessionLoading}
                   />
                   <Button
                     onClick={handleSubmit}
                     disabled={isLoading || isSessionLoading || !prompt.trim()}
                     size="lg"
                   >
                     {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                   </Button>
                 </div>
               </footer>
           </div>
        </main>

        {/* Add the fullscreen container here */}
        <FullscreenGraphContainer />

      </div>
    </Sheet>
  );
} 