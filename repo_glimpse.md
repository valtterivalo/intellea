Directory Structure:
└── README.md
└── components.json
├── docs/
  └── design_document.md
  ├── migrations/
    └── README.md
    └── create_expanded_concepts_table.sql
  └── technical_specification.md
└── eslint.config.mjs
└── next.config.ts
└── package.json
└── postcss.config.mjs
├── public/
  └── file.svg
  └── globe.svg
  └── next.svg
  └── vercel.svg
  └── window.svg
├── src/
  ├── app/
    ├── api/
      ├── expand-concept/
        └── route.ts
      ├── generate/
      ├── sessions/
        ├── [sessionId]/
          ├── expanded-concepts/
            ├── lookup/
              └── route.ts
            └── route.ts
          └── route.ts
        └── route.ts
        ├── stream/
          └── route.ts
      ├── stripe/
        ├── create-checkout/
        ├── create-portal-session/
        ├── webhook/
    ├── auth/
      ├── callback/
        └── route.ts
    └── globals.css
    └── layout.tsx
    └── page.tsx
  ├── components/
    └── AuthComponent.tsx
    └── CollapsedKnowledgeCard.tsx
    └── ExpandedConceptCard.tsx
    └── ExplanationSection.tsx
    └── FullscreenGraphContainer.tsx
    └── KnowledgeCard.tsx
    └── KnowledgeCardsSection.tsx
    └── MainAppClient.tsx
    └── OutputRenderer.tsx
    └── QuizComponent.tsx
    └── QuizSection.tsx
    └── SupabaseListener.tsx
    └── VisualizationComponent.tsx
    └── VisualizationSection.tsx
    ├── ui/
      └── alert.tsx
      └── button.tsx
      └── card.tsx
      └── input.tsx
      └── scroll-area.tsx
      └── separator.tsx
      └── sheet.tsx
      └── skeleton.tsx
      └── textarea.tsx
  ├── lib/
    └── database.types.ts
    └── stripe.ts
    ├── supabase/
      └── client.ts
    └── utils.ts
  ├── store/
    └── useAppStore.ts
└── tsconfig.json

File Contents:

File: docs/migrations/create_expanded_concepts_table.sql
================================================
-- Create expanded_concepts table
CREATE TABLE IF NOT EXISTS public.expanded_concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_concepts JSONB NOT NULL,
  graph_hash TEXT NOT NULL, -- SHA-256 hash of the graph structure (64 characters)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, node_id, graph_hash)
);

COMMENT ON COLUMN public.expanded_concepts.graph_hash IS 'SHA-256 hash of the graph structure for versioning. Previously this was the full node/link list but has been changed to a cryptographic hash to reduce URL length in queries.';

-- Add indexes
CREATE INDEX IF NOT EXISTS expanded_concepts_session_id_idx ON public.expanded_concepts(session_id);
CREATE INDEX IF NOT EXISTS expanded_concepts_node_id_idx ON public.expanded_concepts(node_id);
CREATE INDEX IF NOT EXISTS expanded_concepts_graph_hash_idx ON public.expanded_concepts(graph_hash);

-- Add RLS policies
ALTER TABLE public.expanded_concepts ENABLE ROW LEVEL SECURITY;

-- Policy for selecting - users can only select their own expanded concepts (via sessions)
CREATE POLICY select_expanded_concepts
  ON public.expanded_concepts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = expanded_concepts.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Policy for inserting - users can only insert expanded concepts for their own sessions
CREATE POLICY insert_expanded_concepts
  ON public.expanded_concepts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = expanded_concepts.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Policy for updating - users can only update their own expanded concepts
CREATE POLICY update_expanded_concepts
  ON public.expanded_concepts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = expanded_concepts.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Policy for deleting - users can only delete their own expanded concepts
CREATE POLICY delete_expanded_concepts
  ON public.expanded_concepts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = expanded_concepts.session_id
      AND sessions.user_id = auth.uid()
    )
  ); 

File: eslint.config.mjs
================================================
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;


File: src/app/api/sessions/[sessionId]/route.ts
================================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import type { IntelleaResponse } from '@/store/useAppStore';

interface Params {
  sessionId: string;
}

// GET handler for a specific session
export async function GET(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = createRouteHandlerClient<Database>({ cookies });

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // Verify user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Error retrieving session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch the specific session for the logged-in user
    const { data: sessionData, error: selectError } = await supabase
      .from('sessions')
      .select('id, title, session_data, last_prompt') // Fetch all relevant fields
      .eq('id', sessionId) // Match the session ID from the URL
      .eq('user_id', userId) // IMPORTANT: Ensure the session belongs to the user
      .single(); // Expect exactly one result or null

    if (selectError) {
      // Differentiate between 'not found' and other errors if possible
      // Supabase might return a specific code for PGROST016 (0 rows)
      if (selectError.code === 'PGRST116') {
          console.log(`Session not found or user mismatch: ${sessionId} for user ${userId}`);
          return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
      }
      console.error(`Error fetching session ${sessionId}:`, selectError);
      return NextResponse.json({ error: 'Failed to fetch session data' }, { status: 500 });
    }

    if (!sessionData) {
      // This case might be redundant due to .single() error handling above, but good for clarity
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Return the full session data
    return NextResponse.json(sessionData);

  } catch (error) {
    console.error(`Unexpected error in GET /api/sessions/${sessionId}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// We will add PUT and DELETE handlers here later 

// PUT handler to update/save a specific session
export async function PUT(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = createRouteHandlerClient<Database>({ cookies });

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // --- Payload Validation ---
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate required fields (adjust based on what frontend sends)
  // We expect session_data, title, and last_prompt
  const { session_data, title, last_prompt } = payload;
  if (!session_data || typeof title !== 'string' || typeof last_prompt !== 'string') {
    // Be more specific in validation if needed (e.g., check session_data structure)
    return NextResponse.json({ error: 'Missing required fields: session_data, title, last_prompt' }, { status: 400 });
  }

  try {
    // --- Authentication ---
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // --- Authorization & Update ---
    // The DB trigger handles last_updated_at automatically
    const { data, error: updateError } = await supabase
      .from('sessions')
      .update({
        session_data: session_data as any, // Cast to any to bypass strict type check
        title: title,
        last_prompt: last_prompt,
        // last_updated_at is handled by trigger
      })
      .eq('id', sessionId)
      .eq('user_id', userId) // IMPORTANT: Ensure user owns the session
      .select('id') // Select something to confirm the update happened
      .single(); // Use single to check if exactly one row was updated

    if (updateError) {
      // Check if the error is due to row not found (implies wrong session ID or user mismatch)
      // The error code might vary, PGRST116 is common for no rows matching filters.
      if (updateError.code === 'PGRST116') {
          console.log(`Update failed: Session not found or user mismatch: ${sessionId} for user ${userId}`);
          return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
      }
      // Log other update errors
      console.error(`Error updating session ${sessionId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    // If data is null here after .single(), it means the row wasn't found/updated.
    // This check might be redundant given the error handling above but adds safety.
     if (!data) {
         console.warn(`Update seemed successful but no data returned for session ${sessionId}`);
         // Consider if 404 is more appropriate if the update didn't affect any row
         return NextResponse.json({ error: 'Session not found or update failed' }, { status: 404 });
     }

    // --- Success Response ---
    // Return minimal confirmation or the updated fields if needed by frontend
    return NextResponse.json({ message: 'Session updated successfully', id: data.id }, { status: 200 });

  } catch (error) {
    // Catch unexpected errors like JSON parsing issues handled above or others
    console.error(`Unexpected error in PUT /api/sessions/${sessionId}:`, error);
    // Avoid leaking detailed error messages to the client unless necessary
    if (error instanceof SyntaxError) { // Specifically catch JSON parsing errors if not caught earlier
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE handler for a specific session
export async function DELETE(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = createRouteHandlerClient<Database>({ cookies });

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // --- Authentication ---
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // --- Authorization & Deletion ---
    // Attempt to delete the session matching BOTH id and user_id
    const { error: deleteError, count } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId); // IMPORTANT: Ensure user owns the session

    if (deleteError) {
      // Log unexpected delete errors
      console.error(`Error deleting session ${sessionId}:`, deleteError);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    // Check if any row was actually deleted
    // Supabase delete() might return a count. If count is 0, the session wasn't found or didn't belong to the user.
    if (count === 0) {
        console.log(`Delete failed: Session not found or user mismatch: ${sessionId} for user ${userId}`);
        // Return 404 Not Found if no rows were deleted
        return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

     // If deletion was successful (count > 0 or no error and count not checked)
     // Return 204 No Content, standard for successful DELETE with no body
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    // Catch unexpected errors
    console.error(`Unexpected error in DELETE /api/sessions/${sessionId}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 

File: src/components/KnowledgeCard.tsx
================================================
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Expand } from 'lucide-react'; // Add Expand icon
import { useAppStore, IntelleaResponse } from '@/store/useAppStore'; // Import the store and IntelleaResponse type
import { useShallow } from 'zustand/react/shallow'; // Import useShallow for multiple state slices
import type { KnowledgeCard as KnowledgeCardType, GraphData } from '@/store/useAppStore'; // Import types
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client'; // Import our client creator

// Helper type guard
function isIntelleaResponse(output: any): output is IntelleaResponse {
    return (
        typeof output === 'object' &&
        output !== null &&
        'visualizationData' in output && typeof output.visualizationData === 'object' && output.visualizationData !== null
    );
}

interface KnowledgeCardProps {
  card: KnowledgeCardType;
  variant?: 'default' | 'focused';
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ card, variant = 'default' }) => {
  // Get the necessary actions and data from the store
  const {
    setFocusedNodeId,
    setActiveFocusPath,
    expandConcept,
    isExpandingConcept,
    subscriptionStatus,
    visualizationData
  } = useAppStore(
    useShallow((state) => ({ // Use useShallow for multiple selections
      setFocusedNodeId: state.setFocusedNodeId,
      setActiveFocusPath: state.setActiveFocusPath,
      expandConcept: state.expandConcept,
      isExpandingConcept: state.isExpandingConcept,
      subscriptionStatus: state.subscriptionStatus,
      // Safely access visualizationData
      visualizationData: isIntelleaResponse(state.output) ? state.output.visualizationData : null,
    }))
  );

  // Create a stable supabase client
  const supabase = createClient();
  
  const handleFocusClick = () => {
    console.log(`Focus graph requested for node: ${card.nodeId}, setting active focus PATH.`);
    // Set transient camera focus trigger
    setFocusedNodeId(card.nodeId);
    // Set persistent focus path and clicked node ID, passing visualizationData
    setActiveFocusPath(card.nodeId, visualizationData);
  };

  const handleExpandClick = () => {
    console.log(`Expand concept requested for node: ${card.nodeId}, ${card.title}`);
    expandConcept(card.nodeId, card.title, supabase);
  };

  const isSubscriptionActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  return (
    <Card
      className={cn(
        "flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200",
        variant === 'focused'
          ? "min-w-[320px] max-w-[480px] w-full"
          : "min-w-[280px] max-w-[340px] flex-1"
      )}
    >
      <CardHeader className="pb-2 pt-3 px-4"> {/* Adjusted padding */}
        <CardTitle className="text-lg leading-tight">{card.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-grow px-4 pb-3"> {/* Adjusted padding */}
        <p>{card.description}</p>
      </CardContent>
      <div className="p-2 px-4 border-t flex gap-2"> {/* Button container with padding and border */}
         <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={handleFocusClick}
            // Disable button if vizData isn't available (should generally be available if cards are)
            disabled={!visualizationData} 
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" /> Focus
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={handleExpandClick}
            disabled={isExpandingConcept || !isSubscriptionActive}
          >
            <Expand className="mr-1.5 h-3.5 w-3.5" /> Expand
          </Button>
      </div>
    </Card>
  );
};

export default KnowledgeCard; 

File: src/components/MainAppClient.tsx
================================================
'use client'; // Mark as a Client Component

import React, { useEffect, useState } from 'react';
import { useAppStore, IntelleaResponse, NodeObject, LinkObject, SessionSummary, GraphData, KnowledgeCard } from '@/store/useAppStore';
import OutputRenderer from '@/components/OutputRenderer';
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

File: src/components/OutputRenderer.tsx
================================================
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';
// Import the interactive quiz component
import QuizComponent from './QuizComponent';
import VisualizationComponent from './VisualizationComponent';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from '@/components/ui/button';
import { Maximize } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useShallow } from 'zustand/react/shallow';
import { Loader2, Expand } from 'lucide-react';

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

// Type guard to check if the output is the structured IntelleaResponse
function isIntelleaResponse(output: any): output is IntelleaResponse {
  return (
    typeof output === 'object' &&
    output !== null &&
    ('explanationMarkdown' in output || 'visualizationData' in output || 'knowledgeCards' in output || 'quiz' in output)
  );
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
        <KnowledgeCardsSection />

        {/* Use motion.div to control visibility of the non-fullscreen graph */}
        <motion.div
          variants={graphContainerVariants}
          animate={isGraphFullscreen ? 'hidden' : 'visible'}
          initial={false} // Avoid initial animation unless isGraphFullscreen starts true
        >
          {output.visualizationData && (
            <section aria-labelledby="visualization-heading">
              <h2 id="visualization-heading" className="text-xl font-semibold mb-3">Knowledge Graph</h2>
              <div className="relative">
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

File: components.json
================================================
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}

File: src/app/api/sessions/route.ts
================================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types'; // Ensure this path is correct based on your project setup

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    // Get the current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Error retrieving session' }, { status: 500 });
    }

    if (!session) {
      // If no session, return an empty array or 401 depending on desired behavior for logged-out users
      // Returning empty array might be better for initial dashboard load before login state is fully confirmed?
      // Or strict 401 might be cleaner. Let's go with 401 for now.
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch sessions for the logged-in user
    // Select only the necessary columns for the list view
    const { data: sessions, error: selectError } = await supabase
      .from('sessions')
      .select('id, title, last_updated_at, last_prompt')
      .eq('user_id', userId)
      .order('last_updated_at', { ascending: false }); // Show newest first

    if (selectError) {
      // Log the actual error for debugging on the server
      console.error('Error fetching sessions:', selectError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Return the list of sessions, ensuring it's an array even if null/empty
    return NextResponse.json(sessions ?? []);

  } catch (error) {
    // Catch unexpected errors during the process
    console.error('Unexpected error in GET /api/sessions:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST handler to create a new session
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    // Get the current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Error retrieving session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // We could potentially allow passing an initial title in the body,
    // but for now, we'll just create one with the default title.
    // const body = await request.json().catch(() => ({})); // Optional: parse body for title
    // const initialTitle = body.title || 'Untitled Session';

    // Insert a new session for the logged-in user with the default title
    const { data: newSession, error: insertError } = await supabase
      .from('sessions')
      .insert({ user_id: userId }) // Defaults defined in DB schema handle title, timestamps etc.
      .select('id, title') // Select the ID and title of the new session
      .single(); // Expect only one row to be created

    if (insertError) {
      console.error('Error creating new session:', insertError);
      return NextResponse.json({ error: 'Failed to create new session' }, { status: 500 });
    }

    // Return the ID and title of the newly created session
    return NextResponse.json(newSession, { status: 201 }); // 201 Created status

  } catch (error) {
    console.error('Unexpected error in POST /api/sessions:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// We will add POST handler here later 

File: src/app/globals.css
================================================
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: Nunito, sans-serif;
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-weight-light: 700;
  --font-weight-normal: 700;
  --font-weight-medium: 700;
  --font-weight-semibold: 700;
  --font-serif: PT Serif, serif;
  --shadow-xs: 0 2px 0 0 var(--border);
  --shadow-sm: 0 2px 0 0 var(--border);
  --shadow-md: 0 2px 0 0 var(--border);
  --shadow-lg: 0 2px 0 0 var(--border);
  --shadow-xl: 0 2px 0 0 var(--border);
  --shadow-2xl: 0 2px 0 0 var(--border);
  --shadow-3xl: 0 2px 0 0 var(--border);
  --color-destructive-border: var(--destructive-border);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-primary-border: var(--primary-border);
}

:root {
  --radius: 0.625rem;
  --background: oklch(0.91 0.048 83.6);
  --foreground: oklch(0.41 0.077 78.9);
  --card: oklch(0.92 0.042 83.6);
  --card-foreground: oklch(0.41 0.077 74.3);
  --popover: oklch(0.92 0.042 83.6);
  --popover-foreground: oklch(0.41 0.077 74.3);
  --primary: oklch(0.71 0.097 111.7);
  --primary-foreground: oklch(0.98 0.005 0);
  --secondary: oklch(0.88 0.055 83.6);
  --secondary-foreground: oklch(0.51 0.077 78.9);
  --muted: oklch(0.86 0.064 83.7);
  --muted-foreground: oklch(0.51 0.077 74.3);
  --accent: oklch(0.86 0.055 83.6);
  --accent-foreground: oklch(0.26 0.016 0);
  --destructive: oklch(0.63 0.24 29.2);
  --border: oklch(0.74 0.063 80.8);
  --input: oklch(0.74 0.063 80.8);
  --ring: oklch(0.51 0.077 74.3);
  --chart-1: oklch(0.66 0.19 41.6);
  --chart-2: oklch(0.68 0.16 184.9);
  --chart-3: oklch(0.48 0.09 210.9);
  --chart-4: oklch(0.85 0.19 85.4);
  --chart-5: oklch(0.74 0.19 66.3);
  --sidebar: oklch(0.87 0.059 83.7);
  --sidebar-foreground: oklch(0.41 0.077 78.9);
  --sidebar-primary: oklch(0.26 0.016 0);
  --sidebar-primary-foreground: oklch(0.98 0.005 0);
  --sidebar-accent: oklch(0.83 0.058 83.6);
  --sidebar-accent-foreground: oklch(0.26 0.016 0);
  --sidebar-border: oklch(0.91 0.005 0);
  --sidebar-ring: oklch(0.71 0.005 0);
  --primary-border: oklch(0.59 0.096 111.8);
  --destructive-foreground: oklch(0.97 0.018 0);
  --destructive-border: oklch(0.43 0.24 29.2);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-weight: var(--font-weight-bold);
  }
  .border {
    border-width: 2px !important;
  }
  .border-l {
    border-left-width: 2px !important;
  }
  .border-r {
    border-right-width: 2px !important;
  }
  .border-t {
    border-top-width: 2px !important;
  }
  .border-b {
    border-bottom-width: 2px !important;
  }
  .shadow-primary {
    box-shadow: 0 2px 0 0 var(--primary-border);
  }
  .shadow-destructive {
    box-shadow: 0 2px 0 0 var(--destructive);
  }
  .shadow-destructive-border {
    box-shadow: 0 2px 0 0 var(--destructive-border);
  }
  .texture {
    background-image: url(https://matsu-theme.vercel.app/texture.jpg);
    background-size: 100% 100%;
    background-repeat: repeat;
    opacity: 0.12;
    mix-blend-mode: multiply;
    z-index: 100;
    isolation: isolate;
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    pointer-events: none;
  }
}

File: src/components/VisualizationSection.tsx
================================================
'use client';

import React from 'react';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';
import VisualizationComponent from './VisualizationComponent';
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// Helper type guard from useAppStore (might need to be exported from store)
function isIntelleaResponse(output: any): output is IntelleaResponse {
    return typeof output === 'object' && output !== null;
}

// --- Define Props for VisualizationSection ---
interface VisualizationSectionProps {
  onNodeExpand: (nodeId: string, nodeLabel: string) => void; // Function from page.tsx
  expandingNodeId: string | null; // State from store/page.tsx
}
// --- End Props Definition ---

// Update component signature to accept props
const VisualizationSection: React.FC<VisualizationSectionProps> = ({ 
    onNodeExpand,
    expandingNodeId
}) => {
    // Select necessary data from the store
    const visualizationData = useAppStore((state) => {
        if (isIntelleaResponse(state.output)) {
            return state.output.visualizationData;
        }
        return undefined;
    });

    if (!visualizationData) {
        return null;
    }

    return (
        <>
            <Separator />
            <section className="min-h-0">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Visualization</h2>
                    {expandingNodeId && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>
                
                <VisualizationComponent 
                    visualizationData={visualizationData} 
                    onNodeExpand={onNodeExpand}
                    expandingNodeId={expandingNodeId}
                />
            </section>
        </>
    );
};

export default VisualizationSection; 

File: postcss.config.mjs
================================================
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;


File: docs/technical_specification.md
================================================
**Technical Specification: Intellea - Interactive LLM-Based Learning Interface**

---

### **1. System Architecture Overview**
A modern web-based application that interfaces with multiple LLM APIs to generate dynamic, interactive learning content.

**Frontend:**
- Built with **React** + **TailwindCSS**
- Uses **Next.js** for SSR and routing
- Interactive animations via **Framer Motion** and **React Spring**
- Visual elements rendered using **SVG**, **Canvas API**, or lightweight libraries like **Recharts**, **VisX**, or **Konva**
- Quizzes and flashcards managed via local React state and contextual stores (e.g., Zustand)

**Backend:**
- **Node.js** service layer for request handling and orchestration (Next.js API Routes)
- **Node.js** adapter for LLM API handling
- Optional **Redis** cache layer for rate-limited API responses
- Vector store integration for local retrieval-based memory (e.g., **Weaviate**, **Qdrant**, or **Chroma**)

**APIs Supported:**
- OpenAI (gpt-4, gpt-4-turbo)
- Anthropic (Claude)
- Mistral (via third-party endpoints)
- DeepSeek
- xAI (via future plugin architecture)

**Deployment:**
- Initially deployed on **Vercel** or **Render**
- Plan for self-hostable version with Docker support

---

### **2. Core Components**

#### **Prompt Engine**
- Central module for converting user goals/questions into structured sub-requests
- Uses prompt templates for visual outputs, summaries, quiz generation, etc.
- Handles system prompt injection based on the type of content requested (diagram, animation description, etc.)

#### **UI Renderer Modules**
- **Visualizer:** Accepts structured data (e.g., graph or tree JSON) and renders it as a live SVG or Canvas visualization
- **KnowledgeCards:** Generates detailed cards corresponding to graph nodes from LLM output, supports focusing the graph view on the corresponding node.
- **AnimationPlayer:** Translates descriptive animation steps into JS-controlled transitions (e.g., Framer-based visual explainers)
- **Quiz Engine:** Converts concepts into MCQs or flashcard Q&A using predefined formats, handles correctness logic locally

#### **Memory & Session State**
- Local context retained in browser (sessionStorage or IndexedDB)
- Project sessions optionally persist to backend DB (e.g., SQLite, Postgres)
- Contextual memory cards rendered via dynamic panels with AI-summarized state

---

### **3. Prompt-Oriented Interactivity**
Every UI component (term, diagram node, quiz question) is tied to a lightweight prompt action.

Example:
- Clicking a term like "entropy" sends `"Explain entropy in simpler terms with a 2-step animation"`
- Selecting a node in a decision tree allows user to ask `"What happens if this node is removed?"`
- Finishing a quiz shows follow-up prompt: `"Give a challenge question based on what I got wrong"`

---

### **4. Tooling and Developer Experience**
- Dev server with **hot reload via Vite**
- Unified LLM request SDK with support for provider switching (OpenAI, Claude, etc.)
- Strict TypeScript support for all frontend and backend code
- Integrated prompt-testing utility (text-based preview before binding to UI)
- Markdown-based content mocking for rapid prototyping without live API usage

---

### **5. Future-Proofing and Extensibility**
- Plugin-style architecture to add new LLM providers
- Renderer system modularized for plugging in custom UI components (e.g., 3D visualizations)
- Scoped user auth and saved session sync (optional, but designed in)
- Analytics hooks to track how users engage with each type of learning output (for later personalization)

---

### **6. Tech Stack Summary**
| Area | Tech |
|------|------|
| Frontend Framework | React + TailwindCSS |
| Backend Runtime | Node.js (via Next.js) |
| Hosting | Vercel (frontend), optional Docker |
| LLM APIs | OpenAI, Anthropic, Mistral, DeepSeek, xAI |
| Visualizations | SVG, Canvas, Framer Motion |
| State Mgmt | Zustand + localStorage / DB fallback |
| DB (optional) | SQLite or Postgres |
| Vector Store (optional) | Chroma / Qdrant / Weaviate |
| **3D Visualization** | **react-force-graph / Three.js** |
| **Text Embeddings** | **OpenAI's text-embedding-3-small** |
| **Dimensionality Reduction** | **UMAP.js** |

---

### **7. Development Plan (MVP-Ready for Monetization)**

The MVP must deliver **real user value**, especially for learners with short attention spans or visual-first intellea styles. Our monetizable MVP will include:

1. **User-facing dashboard with new session creation**
2. **Prompt input + mode selector (visualize, quiz, explain)**
3. **Dynamic visual output: diagrams, trees, process maps**
4. **Interactive Knowledge Cards linked to graph nodes, with graph focusing.**
5. **Basic animation support (2-5 step visual explainers)**
6. **Lightweight quizzes (auto-generated from topic)**
7. **Session memory view with pinned cards and visual state**
8. **Frontend-only user login (email or magic link)**
9. **Basic Stripe integration: monthly subscription paywall for unlimited usage**
10. **Shareable public sessions (read-only)**

✅ This MVP can **launch and generate revenue.** It solves pain points, is sticky, and delivers a premium experience from day one.

---

### **7.1 Development Progress Log**

**Phase 1: Foundation Setup (Completed)**

*   **Project Initialization:**
    *   Created Next.js 15 project (`intellea`) using `create-next-app`.
    *   Configured with TypeScript, Tailwind CSS, ESLint, App Router (`/src`), and `@/*` alias.
*   **Core Dependencies:**
    *   Installed `zustand` for state management.
    *   Installed `framer-motion` for animations.
*   **Basic UI Layout:**
    *   Modified `layout.tsx` with project title, description, and basic dark theme.
    *   Created initial `page.tsx` structure with header, output area, mode selectors, prompt input, and send button.
*   **State Management Integration:**
    *   Created `src/store/useAppStore.ts` (Zustand store) to manage `prompt`, `mode`, `output`, and `isLoading` states.
    *   Integrated the store into `page.tsx`, connecting UI elements and implementing loading state indication.

**Phase 2: Core LLM Integration (Completed)**

*   **OpenAI SDK:**
    *   Installed the `openai` npm package.
*   **API Key Management:**
    *   Instructed user to create `.env.local` and store `OPENAI_API_KEY` securely.
*   **Backend API Route:**
    *   Created Next.js API route handler at `src/app/api/generate/route.ts`.
    *   Implemented logic to read API key from environment variables.
    *   Instantiated OpenAI client.
    *   Handles POST requests, parsing `prompt` and `mode`.
    *   Includes basic mode-based prompt engineering (using `gpt-4-turbo-preview`).
    *   Calls OpenAI Chat Completions API.
    *   Returns AI response (or error) as JSON `{ "output": "..." }`.
*   **Frontend API Call:**
    *   Modified `handleSubmit` in `page.tsx` to be `async`.
    *   Replaced placeholder logic with `fetch` call to `/api/generate` endpoint.
    *   Sends `prompt` and `mode` in the request body.
    *   Updates Zustand store (`output`, `isLoading`) based on API response or errors.
    *   Displays raw text output or error message in the main content area.
    *   Disables input elements during loading state.

**Phase 3: Output Rendering & JSON Mode (Superseded by Phase 4)**

*   ~~API Route Enhancement (JSON Mode)~~ 
*   ~~Output Renderer Component~~ 
*   ~~Frontend Integration~~ 

**Phase 4: Unified Response Refactor (Completed)**

*   **Conceptual Shift:**
    *   Removed distinct 'Visualize', 'Quiz', 'Explain' modes based on user feedback.
    *   Adopted a unified approach: AI attempts to provide multiple facets (explanation, terms, viz, quiz) for every prompt.
*   **API Route Refactor (`/api/generate/route.ts`):**
    *   Removed all mode-specific logic.
    *   Defined `IntelleaResponse` interface for the target structured JSON output.
    *   Implemented a new unified `SYSTEM_PROMPT` instructing the LLM to always return JSON matching `IntelleaResponse`.
    *   Enforced `response_format: { type: "json_object" }` for all requests.
    *   Added server-side parsing of the LLM's JSON response string with error handling for parse failures.
    *   Returns the *parsed* `IntelleaResponse` object or an error object (`{ error: ... }`).
*   **State Management Refactor (`useAppStore.ts`):**
    *   Removed `mode` and `setMode` from the state.
    *   Updated `output` type definition to `IntelleaResponse | null | string`.
    *   Exported `IntelleaResponse` interface for use in frontend components.
*   **UI Refactor (`page.tsx`):**
    *   Removed mode selector buttons and associated logic (`handleModeChange`, `getButtonClass`).
    *   Updated `handleSubmit` to only send `prompt` to the API.
    *   Updated textarea placeholder text.
*   **Output Renderer Refactor (`OutputRenderer.tsx`):**
    *   Updated expected `output` prop type.
    *   Added `isIntelleaResponse` type guard.
    *   Renders different sections (`Explanation`, `Key Terms`, `Visualization Data`, `Check Understanding`) based on the presence of data in the `IntelleaResponse` object.
    *   Uses `ReactMarkdown` with custom components (`h1`, `h2`, `h3`, `p`) and improved `prose` styling for `explanationMarkdown`.
    *   Renders `keyTerms` as styled cards.
    *   Uses existing `JsonRenderer` helper for `visualizationData`.
    *   Includes a basic, non-interactive placeholder for `quiz` data.
    *   Handles error string display and a final fallback for unexpected output format.

**Phase 5: Interactive Quiz & Prompt/Rendering Refinements (Completed)**

*   **Markdown Rendering:** Further improved markdown rendering in `OutputRenderer.tsx` by providing custom components for headings (`h1`-`h3`) and paragraphs (`p`) to `ReactMarkdown` for better styling control (whitespace, emphasis).
*   **System Prompt Refinement:** Updated `SYSTEM_PROMPT` in API route (`route.ts`) with stronger constraints to reduce redundancy between `explanationMarkdown` and `keyTerms`, and lowered temperature slightly (`0.5`).
*   **Interactive Quiz Component:**
    *   Created `src/components/QuizComponent.tsx`.
    *   Component accepts `quizData` prop.
    *   Manages state for selected answer and answered status.
    *   Renders question and options as interactive buttons.
    *   Provides visual feedback on selection and correctness after checking.
*   **Integration:** Integrated `QuizComponent` into `OutputRenderer.tsx`, replacing the static quiz placeholder.
*   **Dependency:** ~~Installed `reactflow` library for future visualization work.~~ (Dependency removed as we pivot to 3D graphs).

**Phase 6: Initial 3D Graph Visualization (Completed)**

*   **Conceptual Pivot:** Shifted from 2D React Flow visualization to a dynamic 3D knowledge graph as the primary interaction model.
*   **Dependencies:** Installed `react-force-graph`, `react-force-graph-3d`, `three`, `three-spritetext`.
*   **System Prompt:** Refined `SYSTEM_PROMPT` in API route (`route.ts`) to explicitly request `visualizationData` as a structured JSON object containing `nodes` (e.g., `{ id: '...', label: '...', ... }`) and `links` (e.g., `{ source: 'id1', target: 'id2', ... }`). Emphasized generating a *small*, core graph initially.
*   **Visualization Component (`VisualizationComponent.tsx`):**
    *   Refactored to use `react-force-graph-3d` via dynamic import (`next/dynamic`).
    *   Handles `{ nodes, links }` data structure.
    *   Includes basic node styling using `SpriteText` for labels and camera controls.
*   **Debugging Rendering Issues:**
    *   Identified that the graph component was not rendering initially.
    *   Troubleshooting steps included:
        *   Adding console logs to verify data flow (data was correct).
        *   Temporarily disabling `SpriteText` rendering (not the root cause).
        *   Temporarily setting fixed pixel `width` and `height` on the graph component, which resolved the issue, indicating a problem with dynamic sizing.
        *   Implementing a `ResizeObserver` with `setTimeout` to reliably measure the container `div`'s dimensions *after* browser layout calculation, ensuring the graph component receives correct `width` and `height` props.
        *   Restored dynamic container classes (`aspect-video w-full`).
*   **Current Status:** Component now renders the 3D graph correctly, sized to its container, with labels displayed using `SpriteText`.
*   **Integration:** Integrated the `VisualizationComponent` into `OutputRenderer.tsx`.

**Phase 7: UI Theme Integration & Styling (Completed - Minor Adjustments May Be Needed)**

*   **Theme Setup:**
    *   Initialized `shadcn/ui` using `npx shadcn@latest init`.
    *   Added Matsu theme via `npx shadcn@canary add https://matsu-theme.vercel.app/r/matsu-theme.json`.
    *   Added core components (`button`, `textarea`, `card`, `separator`) using `npx shadcn@latest add ...`.
*   **Global Styling (`layout.tsx`):**
    *   Replaced default fonts with Matsu theme fonts (`Nunito`, `PT_Sans`).
    *   Applied theme font variables and `.texture` class to `<body>`.
*   **Page Styling (`page.tsx`):**
    *   Replaced `<textarea>` and `<button>` with `shadcn/ui` `Textarea` and `Button`.
    *   Added `Loader2` icon to submit button for loading state.
    *   Wrapped main content area in a `Card` component.
    *   Simplified main `<h1>` header styling.
*   **Output Styling (`OutputRenderer.tsx`):**
    *   Applied `prose dark:prose-invert` for base Markdown styling.
    *   Added `Separator` components between sections.
    *   Styled Key Terms using `Card`, `CardHeader`, `CardTitle`, `CardContent` with refined padding (`py-1`, `p-1`).
    *   Applied consistent `h2` styling for section headers.
*   **Quiz Styling (`QuizComponent.tsx`):**
    *   Wrapped component in a `Card`.
    *   Replaced option buttons and check button with `shadcn/ui` `Button`.
    *   Used button variants (`default`, `destructive`, `secondary`, `outline`) and icons (`Check`, `X`) for selection/feedback states.
*   **Visualization Styling (`VisualizationComponent.tsx`):**
    *   Applied theme background (`bg-card`) to container (replaced with hex `#1F2937` temporarily due to parsing issues).
    *   Styled 3D graph elements (node colors/sizes, link styles, `SpriteText` label color) for visual clarity.
    *   Ensured controls are accessible and fit the theme.
*   **Linter Fixes:** Resolved import path errors after adding components and implicit `any` type errors on event handlers.

**Phase 8: Functional Refinements (Completed)**

*   **Dynamic Header (`page.tsx` & `useAppStore.ts`):**
    *   Added `activePrompt` state to Zustand store.
    *   Set `activePrompt` in `handleSubmit`.
    *   Displayed formatted `activePrompt` in main response `CardTitle`.
*   **Visualization Robustness (`route.ts`):**
    *   Updated `SYSTEM_PROMPT` to strongly require the `{ nodes: [...], links: [...] }` structure for `visualizationData`, specifying node properties like `id` and `label`, and link properties `source` and `target`.
*   **API Expansion Endpoint Logic (`route.ts`):**
    *   Added logic to the `/api/generate` route to detect expansion requests (based on `nodeId`, `nodeLabel`, `currentGraph` in the body).
    *   Implemented `EXPANSION_SYSTEM_PROMPT` to instruct the LLM to generate *only* new nodes and links relevant to the clicked node.
    *   Ensured the API returns only `{ expansionData: { nodes, links } }` for expansion requests.
*   **Store Expansion Logic (`useAppStore.ts`):**
    *   Implemented the `addGraphExpansion` action to merge new nodes and links (received from the API) into the existing `visualizationData` in the store, handling basic deduplication.
*   **Quiz Robustness (`QuizComponent.tsx` & `route.ts`):**
    *   Updated `SYSTEM_PROMPT` to require `A) ...` format for quiz options.
    *   Updated `getOptionLetter`/`getOptionText` regex to accept `A)` or `A.`.
    *   Added textual feedback message (`feedback` state) after answer submission.

**Phase 9: 3D Graph Interaction & Theming Refinements (Completed)**

*   **Theming (Warm Beige Theme):**
    *   Updated graph background color (`backgroundColor`) to match the warm beige page theme (`#FDF5E6`).
    *   Updated base node color (`nodeColor`) to use a muted dark khaki/brown (`#8B7D6B`).
    *   Updated link color (`linkColor`) to use a faint dark khaki/brown (`rgba(139, 125, 107, 0.3)`).
    *   Updated `SpriteText` label color to use a dark brown text color (`#5D4037`) for readability.
*   **Interaction:**
    *   Implemented node hover highlighting using `onNodeHover` and a lighter beige/tan color (`#D8C0A3`).
    *   Ensured node expansion highlighting (using `expandingNodeId` and color `#FBBF24`) takes precedence over hover.
    *   Changed camera navigation controls to `orbit` (`controlType="orbit"`) for potentially smoother exploration.
    *   Adjusted `SpriteText` `textHeight` for label clarity.

**Phase 10: Knowledge Cards & Graph Focusing (Completed)**

*   **Conceptual Refinement:** Replaced "Key Terms" with "Knowledge Cards" as the primary textual learning component, tightly coupled with the 3D graph nodes.
*   **State & API:** Updated `IntelleaResponse` interface and Zustand store (`useAppStore`) to use `knowledgeCards` structure, linking cards to nodes via IDs. Updated API prompt (`INITIAL_SYSTEM_PROMPT`) accordingly.
*   **Component Implementation:**
    *   Refactored `OutputRenderer` to use `KnowledgeCardsSection`.
    *   Created `KnowledgeCardsSection` to fetch and display cards.
    *   Created `KnowledgeCard` component to render individual card details (`title`, `description`) using `shadcn/ui`.
*   **Graph Focusing Interaction:**
    *   Added `focusedNodeId` state to Zustand store.
    *   Implemented "Focus on Graph" button in `KnowledgeCard` that updates `focusedNodeId`.
    *   Added `useEffect` in `VisualizationComponent` to observe `focusedNodeId` and use `cameraPosition` to smoothly animate the camera focus onto the corresponding node (using its stored fixed coordinates `fx`, `fy`, `fz`).
    *   Ensured focus is a one-time action per click, not sticky.
*   **Node Dragging Disabled:** Permanently disabled node dragging (`enableNodeDrag={false}`) in `VisualizationComponent` as it doesn't fit the interaction model and caused errors.

**Phase 11: Frontend User Authentication (Supabase - Completed)**

*   **Dependency Installation:** Added `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, `@supabase/auth-ui-react`, `@supabase/auth-ui-shared` using npm.
*   **Environment Setup:** Configured `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
*   **Supabase Client:** Created utility (`src/lib/supabase/client.ts`) using `createClientComponentClient`.
*   **Auth UI Component:** Created `AuthComponent.tsx` using `Auth` from `@supabase/auth-ui-react`, configured for magic link, Google, and GitHub providers.
*   **Callback Route:** Implemented `/auth/callback/route.ts` using `createRouteHandlerClient` to handle session exchange.
*   **Layout Integration:** Modified root `layout.tsx` to be `async`, fetch initial server session using `createServerComponentClient`, and include `SupabaseListener` component.
*   **Session Listener:** Created `SupabaseListener.tsx` client component to synchronize client/server session state using `onAuthStateChange` and trigger `router.refresh()`.
*   **Conditional Rendering:** Modified `page.tsx` to be `async`, check server session, and render either `AuthComponent` (no session) or `MainAppClient` (session exists).
*   **Main App Client Component:** Created `MainAppClient.tsx` containing the primary application UI/logic (previously in `page.tsx`), marked as `'use client'`, and added a `handleLogout` function using `supabase.auth.signOut()`.
*   **Documentation:** Updated spec to reflect use of Node.js instead of Bun.

**Phase 12: Backend Session Persistence & UI Integration (Completed)**

*   **Database Schema:**
    *   Created `sessions` table in Supabase with columns: `id`, `user_id` (FK to `auth.users`), `title`, `session_data` (JSONB), `last_prompt`, `created_at`, `last_updated_at`.
    *   Implemented strict Row Level Security (RLS) policies allowing users CRUD access only to their own sessions (`auth.uid() = user_id`).
    *   Added DB index on `user_id` and trigger for auto-updating `last_updated_at`.
*   **Backend API Routes:**
    *   Created `/api/sessions/route.ts` with:
        *   `GET`: Lists sessions (`id`, `title`, `last_updated_at`, `last_prompt`) for the logged-in user.
        *   `POST`: Creates a new session record for the logged-in user.
    *   Created `/api/sessions/[sessionId]/route.ts` with:
        *   `GET`: Fetches full session data (`id`, `title`, `session_data`, `last_prompt`) for a specific session ID owned by the user.
        *   `PUT`: Updates `title`, `session_data`, `last_prompt` for a specific session ID owned by the user.
        *   `DELETE`: Deletes a specific session ID owned by the user.
    *   Ensured all handlers use `createRouteHandlerClient` and include `user_id` checks alongside RLS for defense-in-depth.
*   **State Management (Zustand - `useAppStore.ts`):**
    *   Added state for `sessionsList`, `currentSessionId`, `currentSessionTitle`, loading states (`isSessionListLoading`, `isSessionLoading`, `isSavingSession`), and `error`.
    *   Implemented actions (`fetchSessions`, `loadSession`, `createSession`, `saveSession`, `deleteSession`) to call the backend API routes.
    *   Refactored `persist` middleware to only store `currentSessionId` in `localStorage`, making the database the source of truth for session data.
    *   Added `resetActiveSessionState` action to clear working state.
*   **Frontend Integration (`MainAppClient.tsx`):**
    *   Added `useEffect` hooks to fetch session list on mount and attempt loading persisted `currentSessionId`.
    *   Implemented a collapsible sidebar using `shadcn/ui` `Sheet` component:
        *   Displays `sessionsList` with loading/error states.
        *   Allows creating new sessions (`handleCreateSession`).
        *   Allows loading sessions by clicking (`handleLoadSession`).
        *   Allows deleting sessions with confirmation (`handleDeleteSession`).
        *   Highlights the `currentSessionId`.
    *   Modified header:
        *   Added `SheetTrigger` button.
        *   Made session title editable via `Input` bound to `currentSessionTitle`, saving on blur.
        *   Removed manual save button.
    *   Implemented auto-saving by calling `saveSession` after successful AI generation and graph expansion.
    *   Added global error display using `Alert`.
    *   Disabled prompt input if no session is active.
    *   Handled session reset on logout.
*   **Dependency Installation:** Added `date-fns` and `shadcn/ui` components (`sheet`, `scroll-area`, `alert`, `input`).
*   **Bug Fixes:**
    *   Resolved `DialogTrigger must be used within Dialog` error by restructuring `Sheet` component layout.
    *   Investigated and monitored (currently ignoring) `cookies()` warnings in development console.
    *   Confirmed OAuth linking behavior (same email across providers maps to same user/sessions) is intended.
    *   Fixed session not loading on refresh by adding `useEffect` hook.

**Phase 13: Graph Readability & Single-Node Focus Scoping (Completed)**

*   **Graph Layout & Readability:**
    *   Accessed graph instance (`graphRef`) in `VisualizationComponent.tsx`.
    *   Used `d3Force` method in `useEffect` to modify simulation forces:
        *   Increased node repulsion (negative `'charge'` strength to -120).
        *   Increased default link distance (`'link'` distance to 60).
    *   Adjusted default node size (`nodeVal`) slightly smaller.
    *   Modified `getNodeThreeObject` to calculate label Y-offset dynamically based on `nodeVal`, ensuring labels appear consistently above nodes of varying sizes.
*   **Information Scoping (Single Node):**
    *   Added `activeFocusNodeId` state and `setActiveFocusNodeId` setter to Zustand store (`useAppStore.ts`).
    *   Modified `KnowledgeCard.tsx` button (`handleFocusClick`) to set both transient camera focus (`focusedNodeId`) and persistent active focus (`activeFocusNodeId`).
    *   Updated `VisualizationComponent.tsx`:
        *   Read `activeFocusNodeId` from store.
        *   Implemented `getNodeColor` and `getNodeVal` callbacks to use `activeFocusNodeId` to highlight/enlarge the focused node and dim/shrink others.
        *   Corrected type definitions to align with `react-force-graph-3d` accessors (`NodeObject`) and refactored helper/callbacks.
    *   Updated `KnowledgeCardsSection.tsx`:
        *   Read `activeFocusNodeId` from store using `useShallow` (to fix re-render loop).
        *   Applied conditional `opacity` and `scale` via `motion.div` based on whether a card matches `activeFocusNodeId`.
*   **Bug Fixes:**
    *   Resolved infinite re-render loop in `KnowledgeCardsSection` by adding `useShallow` to the state selector.
    *   Cleaned up `useAppStore` by removing redundant `visualizationData`/`knowledgeCards` state/setters and correcting `resetActiveSessionState`.
    *   Installed `@types/three`.
    *   Ignored persistent, potentially spurious linter error in `VisualizationComponent.tsx` after multiple fix attempts.

**Phase 14: Path-Based Focusing & Session Creation Refactor (Completed)**

*   **Path-Based Focusing Implementation:**
    *   **Store (`useAppStore.ts`):** Replaced `activeFocusNodeId: string | null` with `activeFocusPathIds: Set<string> | null`. Added `setActiveFocusPath` action to calculate the path (clicked node ID + direct neighbor IDs based on `visualizationData.links`) and update the state.
    *   **Knowledge Card Interaction (`KnowledgeCard.tsx`):** Modified 'Focus on Graph' button to call the new `setActiveFocusPath` action.
    *   **Graph Styling (`VisualizationComponent.tsx`):** Updated `getNodeColor` and `getNodeVal` callbacks to read `activeFocusPathIds` from the store. Nodes whose IDs are *in* the set are highlighted (using `themeColors.nodeExpanding`) and enlarged, while nodes *not* in the set are visually muted (`themeColors.nodeMuted`) and shrunk. Label height (`getNodeThreeObject`) also adjusts based on path inclusion.
    *   **Card Collapsing (`KnowledgeCardsSection.tsx`):** Updated component to read `activeFocusPathIds`. Uses `framer-motion` to animate `opacity` and `scale` of cards: cards whose `nodeId` is *not* in the `activeFocusPathIds` set are dimmed and slightly shrunk, addressing screen real estate usage when focus is active.
*   **Session Creation Refactor & Root Node:**
    *   **API Route (`/api/generate/route.ts`):** Updated `INITIAL_SYSTEM_PROMPT` to instruct the LLM to identify the core topic, create a central root node (marked with `isRoot: true`), and link all other initial nodes directly from this root. Added corresponding server-side validation to ensure exactly one root node exists and initial links originate correctly.
    *   **Store Action (`createSession`):** Refactored the action to take `initialPrompt` as input. It now orchestrates the process: calls `/api/generate` with the prompt, waits for the response, finds the root node (`isRoot: true`), extracts its `label` to use as the session `title`, inserts the new session into Supabase (saving the `title` and the complete initial API `output` object as `session_data`), and finally updates the Zustand state with the new session details.
    *   **Frontend Flow (`MainAppClient.tsx`):** 
        *   'New Session' button functionality changed to simply reset the active UI state (`resetActiveSessionState`, clear `currentSessionId`/`Title`, clear prompt input) without calling the store's `createSession` action.
        *   `handleSubmit` function modified: Now checks if `currentSessionId` is `null`. If it is (indicating the first prompt for a new session), it calls the `createSession` store action (passing `supabase`, `userId`, and the `prompt` text). If `currentSessionId` exists, it proceeds with the previous logic of fetching updates for the existing session.
*   **API/Data Robustness:**
    *   Further strengthened API prompts and added more server-side validation (`/api/generate/route.ts`) to enforce that `knowledgeCards` are generated with valid `nodeId`s matching `visualizationData.nodes` and that counts match.
    *   Added filtering in `KnowledgeCardsSection.tsx` to only render cards with a valid `nodeId`, preventing key warnings and errors.
*   **Bug Fixes:**
    *   Resolved runtime error from accessing `.length` on potentially null `sessionsList` in `MainAppClient.tsx`.
    *   Resolved runtime errors in `QuizComponent.tsx` by adding checks for potentially undefined `correctAnswerLetter` and `options` array.
    *   Corrected logic in `MainAppClient.tsx` to ensure the prompt input and send button are enabled when starting a new session (i.e., when `currentSessionId` is `null`).

**Phase 15: Hierarchical Knowledge Card Layout (Completed)**

*   **Goal:** Improve clarity and space usage in the Knowledge Cards section when focus is active.
*   **State Refinement (`useAppStore.ts`):** Added `activeClickedNodeId` state to differentiate the specifically clicked node from the broader highlighted path (`activeFocusPathIds`). Modified `setActiveFocusPath` action to set both states correctly, requiring `visualizationData` as input.
*   **Click Handler Update (`KnowledgeCard.tsx`):** Modified the 'Focus on Graph' button handler to fetch `visualizationData` from the store and pass it to the updated `setActiveFocusPath` action.
*   **Layout Calculation (`KnowledgeCardsSection.tsx`):** 
    *   Implemented `useMemo` hook to calculate card groups based on `activeClickedNodeId`.
    *   Uses BFS traversal upwards from the clicked node to find all ancestors.
    *   Identifies direct children.
    *   Groups cards into `ancestorLevels`, `focusedCard`, `childCards`, and `otherCards`.
*   **Rendering Logic (`KnowledgeCardsSection.tsx`):**
    *   **Focus Active:**
        *   Renders ancestor levels (root -> parents -> grandparents...) using CSS Grid (`grid-cols-*`) for horizontal layout, with narrower max-width (`max-w-xl`) and centered content (`place-content-center`).
        *   Renders the focused card centered with a wider max-width (`max-w-3xl`).
        *   Renders direct children using CSS Grid, similar to ancestors (narrower, centered).
        *   Renders `otherCards` (not in the focused path) as `CollapsedKnowledgeCard` components within a horizontal scrolling container (`overflow-x-auto`, `flex-nowrap`) below the main focus path.
        *   Removed `motion.div` wrapper from ancestor/child grid items to prevent layout interference.
    *   **Focus Inactive:** Retains the original layout (root card centered, other cards in a responsive grid).
*   **Component Creation (`CollapsedKnowledgeCard.tsx`):** Created a minimal card component showing only the title and a focus button for collapsed items.
*   **Bug Fixing:** Resolved various layout issues related to flexbox vs. grid interactions, CSS class specificity (`w-full` override), and ensured correct centering (`place-content-center`).

**Phase 16: Fullscreen Graph View (Completed)**

*   **Goal:** Allow users to view the 3D knowledge graph in a near-fullscreen overlay for better focus and exploration.
*   **State Management (`useAppStore.ts`):**
    *   Added `isGraphFullscreen: boolean` state to manage the view mode.
    *   Added `toggleGraphFullscreen()` action to switch between normal and fullscreen views.
    *   Ensured `isGraphFullscreen` is reset in `resetActiveSessionState`.
*   **Initial Implementation Approach (Issues Encountered):**
    *   Created `FullscreenGraphContainer.tsx` component.
    *   Initially used `AnimatePresence` and conditional rendering (`{isGraphFullscreen && <VisualizationComponent />}`) to mount/unmount the graph component within the fullscreen container.
    *   Added a button to `OutputRenderer.tsx` to trigger `toggleGraphFullscreen`.
    *   **Issue 1 (WebGL Context Leak):** Rapidly toggling fullscreen caused "Too many active WebGL contexts" errors and eventual graph render failure. This indicated the underlying `VisualizationComponent` or `react-force-graph-3d` wasn't cleaning up WebGL resources on unmount.
    *   **Attempted Fix 1 (Dispose Renderer):** Added cleanup logic in `VisualizationComponent`'s `useEffect` hook (within the `ResizeObserver` effect) to call `graphRef.current?.renderer().dispose()` on unmount. This resolved the WebGL context leak error.
    *   **Issue 2 (Node Drifting):** Nodes slightly repositioned (drifted) every time the fullscreen view was closed and the original view was re-rendered. This also occurred on initial page load.
*   **Refined Implementation Approach (Addressing Drift):**
    *   **Hypothesis:** Unmounting/remounting or resizing was causing the force simulation to reset or recalculate, leading to drift.
    *   **Change 1 (Persistent Rendering):** Modified `FullscreenGraphContainer` and `OutputRenderer` to *always* render their respective `VisualizationComponent` instances if `visualizationData` exists. Visibility is now controlled using CSS (`opacity`, `pointer-events`) via `motion.div` variants, rather than mounting/unmounting components.
    *   **Change 2 (Remove Dispose Logic):** Removed the `renderer.dispose()` call added in Attempted Fix 1, as the component is no longer unmounted during toggling.
    *   **Investigation (Cooldown & Resize Sensitivity):**
        *   Added `cooldownTime={1000}` prop to `ForceGraph3DComponent` to encourage faster simulation stabilization. This fixed the drift on initial page load but *not* when closing fullscreen.
        *   Refined `ResizeObserver` logic in `VisualizationComponent` to only call `setDimensions` if the width/height actually changed, reducing sensitivity to minor layout shifts. This also did not fully resolve the close-fullscreen drift.
    *   **Final Fix (Opacity Toggle for Non-Fullscreen View):** Changed the hiding mechanism for the non-fullscreen graph container in `OutputRenderer` from using `display: hidden/block` (via `cn`) to using `opacity` and `pointer-events` managed by `motion.div`, mirroring the fullscreen container's approach. This prevented the layout shift that was likely triggering the simulation adjustment on close.
*   **Current Status:** Fullscreen view toggles smoothly without WebGL leaks or node drifting. The graph state is preserved across view changes.

**Phase 17: Stripe Subscription Integration (Completed)**

*   **Goal:** Implement a basic monthly subscription paywall using Stripe to monetize the application.
*   **Dependencies:** Installed `stripe` (backend) and `@stripe/stripe-js` (frontend).
*   **Environment Setup:** Configured `.env.local` with Stripe test keys (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`), the Price ID for the subscription (`STRIPE_PRICE_ID`), the webhook signing secret (`STRIPE_WEBHOOK_SECRET`), and the base site URL (`NEXT_PUBLIC_SITE_URL`).
*   **Database Schema:**
    *   Created `profiles` table in Supabase with columns `id` (FK to `auth.users`), `stripe_customer_id` (unique), `subscription_status`, `stripe_subscription_id` (unique).
    *   Enabled RLS and added policies for users to select/update their own profiles.
    *   **Fix:** Manually inserted profile rows for existing users created before the table existed.
    *   **Fix:** Removed incorrect `handle_updated_at` trigger from `profiles` table to resolve DB update errors (function name mismatch with column `updated_at`).
*   **Backend API Routes:**
    *   Created `/api/stripe/create-checkout/route.ts`:
        *   Fetches/creates Stripe customer ID (storing `supabaseUserId` in metadata).
        *   Creates a Stripe Checkout Session for the defined `STRIPE_PRICE_ID`.
        *   Redirects user back to the root path (`/`) on success/cancel (corrected from `/dashboard`).
    *   Created `/api/stripe/create-portal-session/route.ts`:
        *   Fetches user's `stripe_customer_id` from `profiles` table.
        *   Creates a Stripe Billing Portal Session for subscription management.
    *   Created `/api/stripe/webhook/route.ts`:
        *   Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`.
        *   Uses Supabase Admin Client (with `SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS for database updates.
        *   Handles `checkout.session.completed` event: Updates `profiles` table with `stripe_customer_id`, `stripe_subscription_id`, and sets `subscription_status` to `active`.
        *   Handles `customer.subscription.updated`/`deleted` events: Updates `subscription_status` in `profiles` based on the event.
        *   Added robust error handling and logging.
*   **Stripe Utility (`src/lib/stripe.ts`):**
    *   Initialized Stripe Node client.
    *   Created `getStripeCustomerId` helper function (though its DB update part might have been initially blocked by RLS).
*   **State Management (`useAppStore.ts`):**
    *   Added `subscriptionStatus` ('active', 'inactive', etc.) and `isSubscriptionLoading` state.
    *   Implemented `fetchSubscriptionStatus` action to query the `profiles` table for the user's status.
    *   Modified `createSession` action to check for 'active' status before proceeding.
*   **Frontend Integration (`MainAppClient.tsx`):**
    *   Loads Stripe.js using `loadStripe`.
    *   Calls `fetchSubscriptionStatus` on mount.
    *   Conditionally renders "Subscribe Now" or "Manage Billing" buttons based on `subscriptionStatus`.
    *   Implements `handleSubscribe` (calls create-checkout API, redirects to Stripe) and `handleManageSubscription` (calls create-portal API, redirects to Stripe).
    *   Disables core features (prompt input, expand button, new session button) if `subscriptionStatus` is not 'active'.
    *   Added loading states for checkout/portal redirection.
*   **API Route Protection:** Added check in `/api/generate/route.ts` to verify `subscription_status` is 'active' before calling the LLM, returning a 402 error if inactive.
*   **Debugging:**
    *   Resolved 406 error by ensuring user profile row exists.
    *   Resolved webhook DB update failures by using Service Role Key and removing the incorrect DB trigger.
    *   Corrected Stripe redirect URLs.

**Phase 18: Project Renaming & Stripe Portal Fix (Completed)**

*   **Project Renaming:**
    *   Changed project name from "Intellea" to "Intellea".
    *   Updated documentation (`design_document.md`, `technical_specification.md`) to reflect the new name.
    *   Refactored codebase: Renamed `IntelleaResponse` type to `IntelleaResponse` and updated all references in state (`useAppStore.ts`), API routes (`/api/generate`, `/api/sessions/[sessionId]`), and components (`OutputRenderer.tsx`). Fixed resulting type errors.
*   **Stripe Portal Return URL:**
    *   Updated `/api/stripe/create-portal-session/route.ts` to set the `return_url` to the root path (`/`) instead of the non-existent `/dashboard`, resolving the redirect issue after managing billing.

**Phase 19: Graph Expansion & Knowledge Card Improvements (Completed)**

**Phase 20: Semantic Graph Layout Implementation (Completed)**

*   **Goal:** Implement a semantically meaningful 3D layout where related concepts appear close to each other in the graph visualization.
*   **Technical Approach:**
    *   **Embedding Generation:** Using OpenAI's `text-embedding-3-small` model to create vector representations for each node/concept description.
    *   **Dimensionality Reduction:** Applied UMAP.js to transform high-dimensional embeddings into 3D coordinates.
    *   **Root-Centered Layout:** Implemented a post-processing step to center the graph around the root node (0,0,0).
    *   **Fixed Node Positioning:** Applied the calculated 3D coordinates as fixed positions (`fx`,`fy`,`fz`) to the graph nodes.
*   **Parameter Tuning:**
    *   Optimized UMAP parameters (`nNeighbors: 20`, `minDist: 0.05`, `spread: 1.2`) for better clustering of related concepts.
*   **Data Sanitization:**
    *   Implemented cleaning of graph data before sending to the LLM to prevent context length errors and minimize token usage.
    *   Removed internal ThreeJS objects (`__threeObj`) and other rendering-specific properties from API requests.
*   **Knowledge Card Hierarchy Improvements:**
    *   Fixed the ancestor/descendant relationship calculation to correctly identify the true root node.
    *   Ensured root node is always included in focus paths.
    *   Fixed multi-root bug in knowledge card display.
*   **Debug Logging:**
    *   Added console logging to track relationship changes during graph expansion.

**Phase 21: Persistent Concept Caching Implementation (Completed)**

*   **Goal:** Implement persistent storage of expanded concept data to maintain it across sessions and devices.
*   **Database Schema:**
    *   Created `expanded_concepts` table in Supabase with columns:
        *   `id`: UUID (Primary Key)
        *   `session_id`: UUID (Foreign Key to sessions table, with cascade delete)
        *   `node_id`: TEXT (ID of the node/concept)
        *   `title`: TEXT (Title of the concept)
        *   `content`: TEXT (Markdown content of the expanded concept)
        *   `related_concepts`: JSONB (Array of related concepts with relationships)
        *   `graph_hash`: TEXT (SHA-256 hash signature of the graph structure for versioning)
        *   `created_at`: TIMESTAMPTZ
    *   Implemented SHA-256 cryptographic hashing of the graph structure to create compact, consistent identifiers for graph state, replacing the previous approach of using full node/link listings (which caused URL length issues)
    *   Added unique constraint on `(session_id, node_id, graph_hash)` to prevent duplicates
    *   Added indexes on `session_id`, `node_id`, and `graph_hash` for query performance
    *   Enabled Row Level Security with appropriate policies for data isolation
    *   Created SQL migration script (`docs/migrations/create_expanded_concepts_table.sql`) that can be run in the Supabase SQL Editor to set up the table, indexes, and security policies with proper error handling using IF NOT EXISTS clauses
*   **API Implementation:**
    *   Created `/api/sessions/[sessionId]/expanded-concepts` endpoints:
        *   `GET`: Fetches all expanded concepts for a session
        *   `POST`: Creates a new expanded concept or updates an existing one
        *   `DELETE`: Removes a specific expanded concept by nodeId
    *   Created specialized `/api/sessions/[sessionId]/expanded-concepts/lookup` endpoint using POST requests to avoid URL length limitations with SHA-256 hash parameters
    *   Added authentication, authorization, and input validation
    *   Implemented data transformation between database and application formats
*   **Store Enhancement:**
    *   Added new state: `expandedConceptCache: Map<string, {data: ExpandedConceptData, graphHash: string}>`
    *   Implemented multi-level caching strategy: memory → database → API
    *   Enhanced `expandConcept` to:
        *   Check memory cache first
        *   Query database if not in cache
        *   Call API only when necessary, then persist result to database
    *   Added `loadExpandedConcepts` function to load concepts from database when a session is loaded
    *   Updated `resetActiveSessionState` to clear concept cache on session switch
    *   Added type-safe interfaces and error handling
*   **Integration:**
    *   Modified `loadSession` to load expanded concepts after session data
    *   Ensured data consistency with graph versioning using hash-based validation
    *   Implemented clean error handling and fallback mechanisms
*   **Benefits:**
    *   Significantly improved performance by reducing redundant API calls
    *   Enhanced user experience with consistent concept explanations
    *   Added cross-device and cross-session availability of expanded content
    *   Reduced API costs by reusing previously generated content

---

### **8. Current Status & Future Development**

#### **8.1 Semantic Layout Characteristics**

*   **Data-Driven Positioning:** Node placement is calculated using UMAP based on text embeddings.
*   **Semantic Relationships:** Positions reflect conceptual proximity - similar concepts appear closer together.
*   **Root-Centered Design:** All graphs are centered around the root node at (0,0,0).
*   **Adaptive Layout:** When expanding the graph, all node positions are recalculated to maintain semantic relationships.

#### **8.2 LLM-Generated Relationships**

*   **Dynamic Edge Creation:** The LLM can create cross-connections between nodes based on its knowledge.
*   **Non-Deterministic:** These connections represent the model's understanding and may occasionally differ from strict hierarchical taxonomies.
*   **Discovery-Oriented:** Cross-connections can reveal unexpected relationships between concepts that might not be immediately obvious.

#### **8.3 Performance Considerations**

*   **Initial Generation:** ~15-20 seconds for the complete initial graph generation.
*   **Node Expansion:** ~10 seconds for typical node expansion.
*   **Embedding Generation:** Adds some latency but delivers significantly improved graph quality.
*   **UMAP Calculation:** Scales with the number of nodes; may need optimization for very large graphs.

#### **8.4 Expandable Knowledge Cards**

*   **Interactive Feature:** Provides detailed explanations of individual concepts in a full-screen modal view.
*   **Related Concepts:** Shows related concepts from the knowledge graph with context-aware relationships.
*   **Markdown Content:** Renders formatted markdown with proper heading hierarchies and spacing.
*   **Performance Optimizations:**
    * Content caching mechanism based on graph structure fingerprinting
    * Immediate loading indicator display before content is available
    * Properly styled loading states to improve user experience

#### **8.5 Known Issues & Future Improvements**

*   **Expandable Knowledge Cards (Completed):**
    * Implementation of fullscreen modal view for detailed concept explanations
    * Related concepts display with context-aware relationships
    * In-memory caching of expanded content based on graph structure
    * Improved markdown rendering with proper styling for headings, paragraphs, and lists
    * Automatic focusing on the expanded concept in the graph view

*   **Persistent Concept Caching (Completed):**
    * Implementation of database schema with `expanded_concepts` table to store expanded concept data
    * Multi-level caching strategy (memory + database) with graph hash validation to ensure freshness
    * New API endpoints for storing, retrieving, and deleting expanded concepts
    * Enhanced Zustand store with functions to load expanded concepts when sessions are loaded
    * Row Level Security (RLS) policies to ensure data isolation and security
    * Cross-device and cross-session availability of previously expanded concepts
    * Significantly improved performance by avoiding redundant API calls

*   **Performance Optimization (Planned):**
    * Current latency from clicking expand button to content display is substantial
    * Future work: Investigate bottlenecks in the expansion process (API, LLM, rendering)
    * Consider implementing streaming response for concept explanations to improve perceived performance
    * Explore pre-fetching of likely-to-be-expanded concepts based on user interaction patterns

*   **Node Interaction Improvements (Planned):**
    * Currently clicking on a node directly attempts to expand the graph
    * Future work: Implement a context menu when clicking on nodes with options:
        * "Expand Graph" - Current functionality, adds sub-concepts to the knowledge graph
        * "Expand Concept" - Opens the detailed explanation modal (same as knowledge card "Expand" button)
        * "Focus on Node" - Centers and highlights the node (same as knowledge card "Focus" button)
    * Consider terminology improvements to clearly differentiate between graph expansion and concept explanation

*   **UI Polish:**
    * Removed double borders and improved container styling
    * Future work: Further refine loading animations and transitions between states

*   **Future Considerations:**
    * Server-side caching for expanded concept data
    * Visual transitions between knowledge card and expanded view
    * Ability to save and bookmark specific expanded concepts

#### **8.6 Next Steps**

*   **Performance Optimization:** Investigate caching strategies for embeddings and optimizing UMAP parameter defaults.
*   **Relationship Validation:** Consider adding an optional user confirmation step for unexpected cross-links.
*   **Animation Refinement:** Add smoother transitions when nodes reposition after expansion.
*   **LLM Model Selection:** Consider more efficient models for specific sub-tasks (e.g., embedding generation).
*   **Improved Layout Algorithm:** Research alternative layout algorithms or hybrid approaches for better results.

---

### **9. Implementation Notes**

#### **9.1 Key Data Structures**

*   **Graph Nodes:** Include semantic coordinates (`fx`, `fy`, `fz`) and role identifiers (e.g., `isRoot`).
*   **Focus Path:** Set of node IDs in the current focus path, including the selected node, its neighbors, and the root.
*   **Knowledge Card Hierarchies:** Organized into ancestor levels, focused card, direct children, and other concepts.

#### **9.2 API Workflow**

*   **Initial Generation:**
    1. LLM generates initial graph structure
    2. Backend generates embeddings using `text-embedding-3-small`
    3. UMAP transforms embeddings to 3D coordinates
    4. Root node centered at origin, other nodes positioned relative to it
    5. Positions stored as fixed coordinates (`fx`,`fy`,`fz`)
    
*   **Node Expansion:**
    1. Frontend sends clean graph data (without rendering artifacts)
    2. LLM generates new nodes and potential cross-connections
    3. Backend regenerates embeddings for ALL nodes
    4. UMAP recalculates positions for the entire graph
    5. Root node recentered at origin
    6. Updated complete graph returned to frontend

---

### **Conclusion**
This spec reflects the current state of development, focusing on delivering a unique, visually interactive learning experience with semantically meaningful graph layouts. The system now produces high-quality 3D knowledge graphs where the positioning of nodes reflects their conceptual relationships, making exploration more intuitive and insightful for users. 

File: README.md
================================================
# Intellea - Interactive LLM-Based Learning Interface

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Features

### Expandable Knowledge Cards

The knowledge cards in Intellea can now be expanded to show detailed information about each concept:

1. Each knowledge card has an "Expand" button alongside the "Focus" button
2. Clicking the "Expand" button opens a fullscreen modal with:
   - Comprehensive markdown-formatted explanation of the concept
   - List of related concepts with their relationships to the main concept
   - Ability to focus on related concepts directly from the expanded view
3. Content is generated dynamically using the LLM, taking into account the current state of the knowledge graph and other concepts
4. Requires an active subscription to use
"# intellea" 


File: src/components/ui/card.tsx
================================================
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}


File: src/components/ui/alert.tsx
================================================
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }


File: src/components/FullscreenGraphContainer.tsx
================================================
'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore, NodeObject, LinkObject, GraphData } from '@/store/useAppStore';
import VisualizationComponent from './VisualizationComponent';
import { Button } from '@/components/ui/button';

// Define props for the container
interface FullscreenGraphContainerProps {
    onNodeExpand: (nodeId: string, nodeLabel: string) => void;
    expandingNodeId: string | null;
}

const FullscreenGraphContainer: React.FC<FullscreenGraphContainerProps> = ({ 
    onNodeExpand, 
    expandingNodeId 
}) => {
    const isGraphFullscreen = useAppStore((state) => state.isGraphFullscreen);
    const toggleGraphFullscreen = useAppStore((state) => state.toggleGraphFullscreen);
    const output = useAppStore((state) => state.output);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                toggleGraphFullscreen();
            }
        };

        if (isGraphFullscreen) {
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
    }, [isGraphFullscreen, toggleGraphFullscreen]);

    // Extract visualization data, ensuring it conforms to GraphData
    let vizData: GraphData | null = null;
    if (typeof output === 'object' && output !== null && 'visualizationData' in output && output.visualizationData) {
        // Basic structural check
        if (output.visualizationData.nodes && output.visualizationData.links) {
            vizData = output.visualizationData as GraphData;
        }
    }

    const variants = {
        hidden: { opacity: 0, scale: 0.95, pointerEvents: 'none' as const },
        visible: { opacity: 1, scale: 1, pointerEvents: 'auto' as const },
    };

    return (
        <motion.div
            ref={containerRef}
            variants={variants}
            initial="hidden"
            animate={isGraphFullscreen && vizData ? "visible" : "hidden"}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            aria-modal={isGraphFullscreen}
            role="dialog"
            aria-hidden={!isGraphFullscreen}
        >
            {vizData && (
                <div className="relative h-[95vh] w-[95vw] rounded-lg border bg-card shadow-xl overflow-hidden">
                    <VisualizationComponent 
                        visualizationData={vizData} 
                        onNodeExpand={onNodeExpand}
                        expandingNodeId={expandingNodeId}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 text-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-full"
                        onClick={toggleGraphFullscreen}
                        aria-label="Close fullscreen graph view"
                        tabIndex={isGraphFullscreen ? 0 : -1}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </motion.div>
    );
};

export default FullscreenGraphContainer; 

File: public/vercel.svg
================================================
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#fff"/></svg>

File: public/globe.svg
================================================
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>

File: package.json
================================================
{
  "name": "intellea",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@stripe/stripe-js": "^7.0.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/auth-helpers-react": "^0.5.0",
    "@supabase/auth-ui-react": "^0.4.7",
    "@supabase/auth-ui-shared": "^0.1.8",
    "@supabase/supabase-js": "^2.49.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.6.2",
    "js-sha256": "^0.11.0",
    "lucide-react": "^0.486.0",
    "next": "15.2.4",
    "openai": "^4.90.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-force-graph": "^1.47.6",
    "react-force-graph-3d": "^1.26.1",
    "react-markdown": "^10.1.0",
    "reactflow": "^11.11.4",
    "remark-gfm": "^4.0.1",
    "stripe": "^18.0.0",
    "tailwind-merge": "^3.1.0",
    "three": "^0.175.0",
    "three-spritetext": "^1.9.5",
    "tiktoken": "^1.0.20",
    "tw-animate-css": "^1.2.5",
    "umap-js": "^1.4.0",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/three": "^0.175.0",
    "eslint": "^9",
    "eslint-config-next": "15.2.4",
    "supabase": "^2.20.5",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}


File: src/components/ui/textarea.tsx
================================================
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }


File: src/app/api/generate/route.ts
================================================
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UMAP } from 'umap-js'; // Import UMAP
import type { Database } from '@/lib/database.types';

// Define the expected structure for nodes and links in the graph
interface GraphNode {
  id: string; // Unique identifier for the node
  label: string; // Text label displayed for the node
  isRoot?: boolean; // Flag to identify the central root node
  fx?: number; // CHANGED: Use fx for fixed X coordinate
  fy?: number; // CHANGED: Use fy for fixed Y coordinate
  fz?: number; // CHANGED: Use fz for fixed Z coordinate
  // Keep x, y, z for potential dynamic simulation use if needed
  x?: number;
  y?: number;
  z?: number;
  // Add other potential node properties if needed later (e.g., color, size)
  [key: string]: any; // Allow arbitrary properties for flexibility
}

interface GraphLink {
  source: string; // ID of the source node
  target: string; // ID of the target node
  // Add other potential link properties if needed later (e.g., label, curvature)
  [key: string]: any; // Allow arbitrary properties for flexibility
}

// Define structure for Knowledge Cards
interface KnowledgeCard {
  nodeId: string; // Corresponds to a node ID in visualizationData.
  title: string; // Concept title (often matches node label)
  description: string; // Concise explanation of the concept (2-4 sentences)
}

// Define structure for visualization data (used in both initial and expansion)
// Note: GraphNode now includes optional x, y, z
interface VisualizationData {
    nodes: GraphNode[];
    links: GraphLink[];
}

// Define the structure returned by the LLM for expansion requests
interface LLMExpansionResponse {
    nodes: GraphNode[]; // New nodes only
    links: GraphLink[]; // New links only (can connect to existing nodes)
    knowledgeCards: KnowledgeCard[]; // New cards only (one per new node)
}

// Define the expected structure of the *complete* initial response (sent to client)
export interface IntelleaResponse {
  explanationMarkdown: string | null;
  knowledgeCards: KnowledgeCard[] | null; // All cards for the initial graph
  visualizationData: VisualizationData; // Includes nodes with calculated x, y, z
  quiz?: { question: string; options: string[]; correctAnswerLetter: string };
}

// Define the structure of the *complete* expansion response (sent to client)
// Contains the full updated graph and only the newly added cards
export interface ExpansionResponse {
    updatedVisualizationData: VisualizationData; // All nodes (with updated x, y, z) and all links
    newKnowledgeCards: KnowledgeCard[]; // Only the cards corresponding to the newly added nodes
}


// Ensure API keys are available
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Helper Functions ---

// Get text content for embedding (prioritize description, fallback to title/label)
function getNodeTextForEmbedding(node: GraphNode, cards: KnowledgeCard[]): string {
    const card = cards.find(c => c.nodeId === node.id);
    return card?.description || node.label || node.id; // Use description if available, else label, else ID
}

// Get embeddings from OpenAI
async function getNodeEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];
    try {
        console.log(`Requesting embeddings for ${texts.length} texts...`);
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small", // Efficient embedding model
            input: texts,
        });
        console.log(`Embeddings received.`);
        return response.data.map(emb => emb.embedding);
    } catch (error) {
        console.error("Error getting embeddings:", error);
        throw new Error("Failed to generate node embeddings.");
    }
}

// Calculate 3D positions using UMAP and center the root node
async function calculateNodePositions(
    embeddings: number[][],
    nodesForPositioning: GraphNode[] // Pass the raw nodes to find the root
): Promise<Array<{ fx: number; fy: number; fz: number }>> { 
    if (!embeddings || embeddings.length === 0 || embeddings.length !== nodesForPositioning.length) { 
        console.warn("Embeddings or nodes mismatch, returning empty positions.");
        return []; 
    }

    let rawPositions: Array<{ fx: number; fy: number; fz: number }>;

    // Handle edge case: only 1 node (must be root)
    if (embeddings.length === 1) {
        rawPositions = [{ fx: 0, fy: 0, fz: 0 }];
    } 
    // Handle edge case: 2 nodes (root and one other)
    else if (embeddings.length === 2) {
        const rootIndex = nodesForPositioning.findIndex(n => n.isRoot);
        const otherIndex = 1 - rootIndex;
        rawPositions = Array(2).fill({ fx: 0, fy: 0, fz: 0 });
        // Assign non-zero position to the non-root node
        if (rootIndex !== -1 && otherIndex !== -1) {
             rawPositions[rootIndex] = { fx: 0, fy: 0, fz: 0 };
             rawPositions[otherIndex] = { fx: 50, fy: 0, fz: 0 }; // Simple offset
        } else {
             // Fallback if root not found somehow
             rawPositions[0] = { fx: 0, fy: 0, fz: 0 };
             rawPositions[1] = { fx: 50, fy: 0, fz: 0 };
        }
    } 
    // Normal case: 3+ nodes
    else {
        try {
            console.log(`Calculating UMAP for ${embeddings.length} embeddings...`);
            const umap = new UMAP({
                nComponents: 3,
                nNeighbors: Math.min(20, embeddings.length - 1),
                minDist: 0.05,
                spread: 1.2,
            });
            const umapOutput = await umap.fitAsync(embeddings);
            console.log("UMAP calculation complete.");

            const scaleFactor = 150;
            rawPositions = umapOutput.map(pos => ({
                fx: pos[0] * scaleFactor,
                fy: pos[1] * scaleFactor,
                fz: pos[2] * scaleFactor,
            }));
        } catch (error) {
            console.error("Error calculating UMAP positions:", error);
            // Fallback: return origin for all on error
            return nodesForPositioning.map(() => ({ fx: 0, fy: 0, fz: 0 }));
        }
    }

    // --- Center the Root Node --- 
    const rootIndex = nodesForPositioning.findIndex(n => n.isRoot === true);
    if (rootIndex === -1 || !rawPositions[rootIndex]) {
        console.warn("Root node not found or missing position after UMAP. Skipping centering.");
        return rawPositions; // Return uncentered positions if root is missing
    }

    const rootPosition = rawPositions[rootIndex];
    const offsetX = rootPosition.fx;
    const offsetY = rootPosition.fy;
    const offsetZ = rootPosition.fz;

    console.log(`Centering graph around root node. Offset: (${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}, ${offsetZ.toFixed(2)})`);

    // Apply the offset to all nodes
    const centeredPositions = rawPositions.map(pos => ({
        fx: pos.fx - offsetX,
        fy: pos.fy - offsetY,
        fz: pos.fz - offsetZ,
    }));

    return centeredPositions;
}


// --- System Prompts ---

// System prompt for INITIAL 3D graph generation (Unchanged for now)
const INITIAL_SYSTEM_PROMPT = `You are Intellea, an expert AI assistant generating structured learning data for an interactive 3D graph visualization. Respond ONLY with a single, valid JSON object.

**Instructions:**
1.  Identify the core subject/topic from the user's prompt.
2.  Create a central "root" node representing this core topic. This node object MUST have the property \`"isRoot": true\`. All other nodes MUST NOT have this property or have it set to \`false\`.
3.  Generate 3-6 additional nodes representing key sub-concepts or initial aspects related to the root topic.
4.  Structure the \`visualizationData.links\` so that ALL generated sub-concept nodes link FROM the central root node (e.g., \`{ source: <root_node_id>, target: <sub_concept_node_id> }\`). Do not link sub-concepts to each other in this initial graph.
5.  Generate ONE \`knowledgeCard\` for EACH generated node (including the root node).
6.  Ensure every \`knowledgeCard.nodeId\` EXACTLY matches the \`id\` of its corresponding node.
7.  Provide a single-paragraph \`explanationMarkdown\` summarizing the overall topic.

**JSON Structure:**
{
  "explanationMarkdown": "string", // MANDATORY: 1 paragraph summary (3-4 sentences max). NO definitions.
  "knowledgeCards": [ { "nodeId": "string", "title": "string", "description": "string" } ], // MANDATORY: One card per node. 'nodeId' MUST match node 'id'. 'title' = node 'label'. 'description' = 2-4 sentences.
  "visualizationData": { // MANDATORY: Data for the graph.
    "nodes": [ { "id": "string", "label": "string", "isRoot": boolean } ], // List of nodes. Exactly ONE node MUST have "isRoot": true. Others MUST have "isRoot": false or omit it.
    "links": [ { "source": "string", "target": "string" } ] // Links list. ALL links MUST originate from the root node (\`source\` = root node ID).
   },
  "quiz": { /* ... (optional quiz structure) ... */ } // Optional.
}

**Constraint Checklist & Summary:**
*   Single JSON response.
*   Identify core topic -> Create root node with \`"isRoot": true\`.
*   Create 3-6 sub-concept nodes (no \`isRoot\` property or \`false\`).
*   Link ALL sub-concepts FROM the root node.
*   Generate ONE knowledge card per node (root + sub-concepts), linked via \`nodeId\` == \`id\`.
*   Provide brief \`explanationMarkdown\`.
*   Ensure all IDs match and constraints are met.
`;

// System prompt for GRAPH EXPANSION (UPDATED)
const EXPANSION_SYSTEM_PROMPT = `You are Intellea, an AI assistant expanding an existing knowledge graph. Given a clicked node (ID and Label) and the current graph structure (nodes and links), generate **ONLY new, relevant nodes, links, and corresponding knowledge cards** to expand the graph from the clicked node. Respond ONLY with a single, valid JSON object matching this structure:

{
  "nodes": [ { "id": "string", "label": "string" } ], // **NEW nodes ONLY**. 'id' MUST be unique within the ENTIRE graph (existing + new). 'label' is display text. Max 2-3 new nodes.
  "links": [ { "source": "string", "target": "string" } ], // **NEW links ONLY**. Include links connecting the clicked node to new nodes AND **potentially links connecting NEW nodes to OTHER EXISTING nodes** if a strong semantic relationship exists. 'source' and 'target' MUST match node IDs (either existing or new). Max 3-5 new links.
  "knowledgeCards": [ { "nodeId": "string", "title": "string", "description": "string" } ] // **NEW cards ONLY**. Generate ONE card for EACH new node. 'nodeId' MUST match the new node's 'id'. 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
}

**Constraint Checklist:**
1. Single JSON object ONLY.
2. Only include nodes/links/cards that are **directly relevant** and **add new information** based on the clicked node.
3. **Identify potential cross-connections:** Evaluate if any NEWLY generated node has a strong semantic relationship with any OTHER EXISTING node in the provided graph context (besides the clicked node). If yes, add a link in the "links" array connecting the new node to that existing node. Prioritize meaningful connections.
4. **CRITICAL: Generate EXACTLY ONE KnowledgeCard for EACH new node generated in the 'nodes' array.** The number of objects in 'knowledgeCards' MUST equal the number of objects in 'nodes'.
5. **Each generated KnowledgeCard object MUST have a 'nodeId' property that EXACTLY matches the 'id' of its corresponding node in the NEW 'nodes' list.** Card 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
6. **DO NOT** include the clicked node itself or any other existing nodes/links/cards in the response.
7. Ensure all new node IDs are unique strings across the entire graph context (existing + new).
8. Ensure all link source/target IDs exist in either the provided existing graph or the new nodes list.
9. Max 2-3 new nodes, 3-5 new links (including primary and cross-links), and their corresponding cards.
10. If no relevant expansion is possible, return { "nodes": [], "links": [], "knowledgeCards": [] }.
`;

// --- API Route Handler ---

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate User & Check Subscription
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.subscription_status !== 'active') {
      console.warn(`User ${user.id} attempted access without active subscription. Status: ${profile?.subscription_status ?? 'not found'}`);
      return NextResponse.json({ error: 'Active subscription required' }, { status: 402 }); // 402 Payment Required
    }

    // 2. Parse Request Body
    const body = await req.json();
    // ADDED: Expect full current graph data for expansion, including cards
    const { prompt, nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards } = body;

    let systemPrompt: string;
    let userPromptContent: string;
    let isExpansion = false;

    // --- Determine Request Type (Initial or Expansion) ---
    if (nodeId && nodeLabel && currentVisualizationData && currentKnowledgeCards) {
      // --- Expansion Request ---
      isExpansion = true;
      systemPrompt = EXPANSION_SYSTEM_PROMPT;
      // Provide only nodes and links context to the LLM for expansion prompt
      const contextGraph = { nodes: currentVisualizationData.nodes, links: currentVisualizationData.links };
      userPromptContent = `Expand the graph from the clicked node:\nNode ID: ${nodeId}\nNode Label: ${nodeLabel}\n\nCurrent Graph Structure (for context only, do not repeat):\n${JSON.stringify(contextGraph, null, 2)}`;
      console.log(`Calling OpenAI for EXPANSION on node: "${nodeLabel}" (ID: ${nodeId})`);

    } else if (prompt) {
      // --- Initial Request ---
      isExpansion = false;
      systemPrompt = INITIAL_SYSTEM_PROMPT;
      userPromptContent = prompt;
      console.log(`Calling OpenAI for INITIAL prompt: "${prompt.substring(0, 80)}..."`);

    } else {
      return NextResponse.json({ error: 'Request must include either a prompt or node details (nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards) for expansion' }, { status: 400 });
    }

    // 3. Call OpenAI LLM
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano', // Using a real cheap model now for testing
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPromptContent },
      ],
      response_format: { type: 'json_object' },
      temperature: isExpansion ? 0.4 : 0.5, // Adjusted slightly
    });

    const rawResult = completion.choices[0]?.message?.content;

    if (!rawResult) {
      return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }

    console.log(`OpenAI response received for ${isExpansion ? 'EXPANSION' : 'INITIAL'} request.`);

    // 4. Parse, Validate, and Process LLM Response
    try {
        const llmJson = JSON.parse(rawResult);

        if (isExpansion) {
            // --- Process Expansion Response ---
            const llmExpansionResponse: LLMExpansionResponse = llmJson;

            // Validate expansion structure
            if (!llmExpansionResponse.nodes || !llmExpansionResponse.links || !llmExpansionResponse.knowledgeCards) {
                throw new Error("Missing required fields from LLM expansion: nodes, links, or knowledgeCards");
            }
            if (llmExpansionResponse.nodes.length !== llmExpansionResponse.knowledgeCards.length) {
                throw new Error(`Validation Error: Number of new nodes (${llmExpansionResponse.nodes.length}) does not match number of new knowledge cards (${llmExpansionResponse.knowledgeCards.length}).`);
            }
            const newNodeIds = new Set(llmExpansionResponse.nodes.map(n => n.id));
            for (const card of llmExpansionResponse.knowledgeCards) {
                if (!card.nodeId || typeof card.nodeId !== 'string' || !newNodeIds.has(card.nodeId)) {
                    throw new Error(`Validation Error: New knowledge card with title "${card.title}" has missing, invalid, or non-matching nodeId "${card.nodeId}".`);
                }
            }
             // Simple validation for new link targets/sources (ensure they exist in combined graph)
            const existingNodeIds = new Set(currentVisualizationData.nodes.map((n: GraphNode) => n.id));
            const allNodeIds = new Set([...existingNodeIds, ...newNodeIds]);
            for (const link of llmExpansionResponse.links) {
                if (!allNodeIds.has(link.source) || !allNodeIds.has(link.target)) {
                     throw new Error(`Validation Error: New link connects non-existent node IDs: source="${link.source}", target="${link.target}".`);
                }
            }

            console.log(`LLM expansion validated: ${llmExpansionResponse.nodes.length} new nodes, ${llmExpansionResponse.links.length} new links, ${llmExpansionResponse.knowledgeCards.length} new cards.`);
            // --- DEBUG: Log LLM Links --- 
            console.log("DEBUG: Links received from LLM:", JSON.stringify(llmExpansionResponse.links));
            // --- END DEBUG --- 

            // Combine existing and new data
            const combinedNodesRaw = [...currentVisualizationData.nodes, ...llmExpansionResponse.nodes];
            const combinedLinks = [...currentVisualizationData.links, ...llmExpansionResponse.links];
            const combinedKnowledgeCards = [...currentKnowledgeCards, ...llmExpansionResponse.knowledgeCards];

            // --- DEBUG: Log Combined Links --- 
            console.log(`DEBUG: Existing Links Count: ${currentVisualizationData.links.length}`);
            console.log(`DEBUG: Combined Links Count (Before Deduplication if any): ${combinedLinks.length}`);
            // Optional: Log the full combined list if needed, but can be verbose
            // console.log("DEBUG: Final Combined Links:", JSON.stringify(combinedLinks)); 
            // --- END DEBUG --- 

            // Get text for embedding for ALL nodes
            const textsToEmbed = combinedNodesRaw.map(node => getNodeTextForEmbedding(node, combinedKnowledgeCards));

            // Calculate embeddings and positions for ALL nodes
            const allEmbeddings = await getNodeEmbeddings(textsToEmbed);
            const allPositions = await calculateNodePositions(allEmbeddings, combinedNodesRaw);

             // Create the final updated node list with new positions
            const finalNodes = combinedNodesRaw.map((node, index) => ({
                ...node,
                fx: allPositions[index]?.fx ?? node.fx ?? 0, // Use new fx, fallback to old fx, then 0
                fy: allPositions[index]?.fy ?? node.fy ?? 0, // Use new fy, fallback to old fy, then 0
                fz: allPositions[index]?.fz ?? node.fz ?? 0, // Use new fz, fallback to old fz, then 0
                // Keep original x,y,z if they existed, or let simulation handle them
                x: node.x,
                y: node.y,
                z: node.z,
            }));


            const updatedVisualizationData: VisualizationData = {
                nodes: finalNodes,
                links: combinedLinks, // Use the combined links directly
            };

            // Prepare response for the client
            const responsePayload: ExpansionResponse = {
                updatedVisualizationData: updatedVisualizationData,
                newKnowledgeCards: llmExpansionResponse.knowledgeCards, // Send only the new cards
            };

            console.log(`Expansion processed. Returning updated graph with ${finalNodes.length} total nodes and ${combinedLinks.length} total links.`);
            return NextResponse.json(responsePayload); // Return the structured expansion response

        } else {
            // --- Process Initial Response ---
            const initialResponseRaw: Omit<IntelleaResponse, 'visualizationData'> & { visualizationData: { nodes: GraphNode[], links: GraphLink[] }, knowledgeCards: KnowledgeCard[] } = llmJson;

            // Validate initial structure
             if (!initialResponseRaw.explanationMarkdown || !initialResponseRaw.visualizationData || !initialResponseRaw.knowledgeCards) {
                throw new Error("Missing required fields for initial response: explanationMarkdown, visualizationData, or knowledgeCards");
            }
            const nodes = initialResponseRaw.visualizationData.nodes;
            const cards = initialResponseRaw.knowledgeCards;
            const links = initialResponseRaw.visualizationData.links;

             if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
                throw new Error("Validation Error: visualizationData.nodes is missing, not an array, or empty.");
            }
             if (!cards || !Array.isArray(cards) || cards.length !== nodes.length) {
                 throw new Error(`Validation Error: knowledgeCards missing, not an array, or length (${cards.length}) doesn't match nodes length (${nodes.length}).`);
            }
             if (!links || !Array.isArray(links)) {
                throw new Error("Validation Error: visualizationData.links is missing or not an array.");
            }

            const nodeIds = new Set(nodes.map(n => n.id));
            for (const card of cards) {
                if (!card.nodeId || typeof card.nodeId !== 'string' || !nodeIds.has(card.nodeId)) {
                    throw new Error(`Validation Error: Knowledge card with title "${card.title}" has missing, invalid, or non-matching nodeId "${card.nodeId}".`);
                }
            }
            const rootNodes = nodes.filter(n => n.isRoot === true);
             if (rootNodes.length !== 1) {
                throw new Error(`Validation Error: Expected exactly 1 root node (with isRoot: true), but found ${rootNodes.length}.`);
            }
            const rootNodeId = rootNodes[0].id;
            // Validate initial links originate from root (optional check, could be removed if we want more complex starts)
            // if (links.length > 0 && nodes.length > 1) {
            //     for (const link of links) {
            //         if (link.source !== rootNodeId) {
            //             // Temporarily relax this for flexibility if needed
            //             // throw new Error(`Validation Error: Initial link source "${link.source}" does not match root node ID "${rootNodeId}".`);
            //         }
            //          if (!nodeIds.has(link.target)) {
            //              throw new Error(`Validation Error: Initial link target "${link.target}" does not exist.`);
            //          }
            //     }
            // }

            console.log(`Initial LLM response validated: Root="${rootNodes[0].label}", ${nodes.length} nodes, ${links.length} links, ${cards.length} cards.`);

            // Get text for embedding
            const textsToEmbed = nodes.map(node => getNodeTextForEmbedding(node, cards));

            // Calculate embeddings and positions
            const embeddings = await getNodeEmbeddings(textsToEmbed);
            const positions = await calculateNodePositions(embeddings, nodes);

            // Add positions to node objects
            const nodesWithPositions = nodes.map((node, index) => ({
                ...node,
                fx: positions[index]?.fx ?? 0, // Use fx
                fy: positions[index]?.fy ?? 0, // Use fy
                fz: positions[index]?.fz ?? 0, // Use fz
                // Initialize x,y,z for potential simulation start
                x: positions[index]?.fx ?? 0, 
                y: positions[index]?.fy ?? 0,
                z: positions[index]?.fz ?? 0, 
            }));

            // Construct the final response object
            const output: IntelleaResponse = {
                explanationMarkdown: initialResponseRaw.explanationMarkdown,
                knowledgeCards: initialResponseRaw.knowledgeCards,
                visualizationData: {
                    nodes: nodesWithPositions,
                    links: initialResponseRaw.visualizationData.links,
                },
                quiz: initialResponseRaw.quiz, // Include quiz if present
            };

            console.log(`Initial response processed with semantic positions.`);
            return NextResponse.json({ output }); // Return the standard initial response structure
        }

    } catch (parseOrProcessError: any) {
      console.error('Failed to parse, validate, or process LLM response:', parseOrProcessError);
      console.error('Raw LLM response string:', rawResult); // Log raw response for debugging
      return NextResponse.json({ error: `Error processing AI response: ${parseOrProcessError.message}` }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in /api/generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 

File: src/components/ui/separator.tsx
================================================
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }


File: src/components/ui/input.tsx
================================================
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }


File: src/components/KnowledgeCardsSection.tsx
================================================
'use client';

import React, { useCallback, useMemo } from 'react';
import { useAppStore, IntelleaResponse, KnowledgeCard as KnowledgeCardType } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { motion } from 'framer-motion';
import { Separator } from "@/components/ui/separator";
import KnowledgeCard from './KnowledgeCard';
import { CollapsedKnowledgeCard } from './CollapsedKnowledgeCard';
import type { GraphData, NodeObject, LinkObject } from '@/store/useAppStore';

// Helper type guard (ensure it's robust)
function isIntelleaResponse(output: any): output is IntelleaResponse {
    return (
        typeof output === 'object' &&
        output !== null &&
        'explanationMarkdown' in output &&
        'knowledgeCards' in output && Array.isArray(output.knowledgeCards) &&
        'visualizationData' in output && typeof output.visualizationData === 'object' && output.visualizationData !== null && 'nodes' in output.visualizationData && Array.isArray(output.visualizationData.nodes) && 'links' in output.visualizationData && Array.isArray(output.visualizationData.links) &&
        'quiz' in output
    );
}

const KnowledgeCardsSection: React.FC = () => {
    // Get raw output first to debug
    const rawOutput = useAppStore(state => state.output);
    
    // Add debug log to show what data we have in the store
    console.log("DEBUG KnowledgeCardsSection - Store output:", 
        typeof rawOutput === 'object' ? { 
            type: 'object', 
            hasCards: rawOutput?.knowledgeCards ? true : false,
            hasViz: rawOutput?.visualizationData ? true : false
        } : typeof rawOutput);

    // FIXED: Properly check the state structure
    const knowledgeCards = useAppStore(state => {
        const output = state.output;
        return (output && typeof output === 'object' && 'knowledgeCards' in output && Array.isArray(output.knowledgeCards)) 
            ? output.knowledgeCards 
            : [];
    });
    
    const visualizationData = useAppStore(state => {
        const output = state.output;
        return (output && typeof output === 'object' && 'visualizationData' in output && 
               typeof output.visualizationData === 'object' && output.visualizationData !== null)
            ? output.visualizationData
            : null;
    });
    
    const activeClickedNodeId = useAppStore(state => state.activeClickedNodeId);
    const setActiveFocusPath = useAppStore(state => state.setActiveFocusPath);

    // Debug the actual values we're getting from selectors
    console.log("DEBUG KnowledgeCardsSection - After selectors:", {
        cardsLength: knowledgeCards?.length || 0,
        hasVizData: !!visualizationData,
        activeClickedNodeId
    });

    const handleFocus = useCallback((nodeId: string) => {
        setActiveFocusPath(nodeId, visualizationData);
    }, [setActiveFocusPath, visualizationData]);

    // --- Refactored Memoization Logic ---
    const {
        rootCard,
        ancestorLevels, // Array of levels, each level is an array of cards
        focusedCard,
        childCards,
        otherCards,
        isFocusActive
    } = useMemo(() => {
        const validCards = knowledgeCards?.filter(
            (card): card is KnowledgeCardType =>
                card && typeof card.nodeId === 'string' && card.nodeId.trim() !== '' && typeof card.title === 'string'
        ) || [];
        
        const cardsMap = new Map(validCards.map(card => [card.nodeId, card]));
        const rootNode = visualizationData?.nodes.find((node: NodeObject) => node.isRoot);
        const rootCardData = rootNode?.id ? cardsMap.get(rootNode.id) : undefined;

        const currentFocusActive = activeClickedNodeId !== null && visualizationData !== null && cardsMap.has(activeClickedNodeId);
        
        let levels: KnowledgeCardType[][] = [];
        let focused: KnowledgeCardType | undefined;
        let children: KnowledgeCardType[] = [];
        let others: KnowledgeCardType[] = [];
        let allFocusPathIds = new Set<string>(); // IDs in focus path (ancestors, focused, children)

        if (currentFocusActive) {
            focused = cardsMap.get(activeClickedNodeId)!; // We know it exists from currentFocusActive check
            allFocusPathIds.add(activeClickedNodeId);

            // --- FIXED: Build parent/child relationships from links ---
            // We need two separate maps: one for parents and one for children
            const parentMap = new Map<string, Set<string>>(); // Map: childId -> Set(parentId1, parentId2, ...)
            const childMap = new Map<string, Set<string>>(); // Map: parentId -> Set(childId1, childId2, ...)
            
            // Process links to populate both maps correctly
            visualizationData.links.forEach((link: LinkObject) => {
                const sourceId = typeof link.source === 'object' && link.source !== null ? (link.source as NodeObject).id : link.source as string;
                const targetId = typeof link.target === 'object' && link.target !== null ? (link.target as NodeObject).id : link.target as string;
                
                if (sourceId && targetId) {
                    // Add to parent map (target's parent is source)
                    if (!parentMap.has(targetId)) parentMap.set(targetId, new Set());
                    parentMap.get(targetId)!.add(sourceId);
                    
                    // Add to child map (source's child is target)
                    if (!childMap.has(sourceId)) childMap.set(sourceId, new Set());
                    childMap.get(sourceId)!.add(targetId);
                }
            });

            // --- Find direct children using childMap ---
            const directChildIds = childMap.get(activeClickedNodeId) || new Set();
            directChildIds.forEach(childId => {
                const card = cardsMap.get(childId);
                if (card) {
                    children.push(card);
                    allFocusPathIds.add(childId);
                }
            });

            // --- BFS Upwards for Ancestors using parentMap, ensuring only the actual root is at the top level ---
            // Identify the true root node once and ensure it's the only one recognized as root
            const rootNodeId = rootNode?.id || '';
            const isRootNode = (id: string) => id === rootNodeId;
            
            let currentLevelIds = new Set<string>([activeClickedNodeId]);
            const visited = new Set<string>([activeClickedNodeId]);

            while (currentLevelIds.size > 0) {
                const parentLevelIds = new Set<string>();
                const parentLevelCards: KnowledgeCardType[] = [];

                // For each node in current level, find its parents
                currentLevelIds.forEach(childId => {
                    const parents = parentMap.get(childId) || new Set();
                    parents.forEach(parentId => {
                        // Skip if we've already visited this node or if it's the root
                        // Root will be handled separately to ensure it's always at the top level
                        if (!visited.has(parentId) && !isRootNode(parentId)) {
                            visited.add(parentId);
                            parentLevelIds.add(parentId);
                            allFocusPathIds.add(parentId);
                            const card = cardsMap.get(parentId);
                            if (card) parentLevelCards.push(card);
                        }
                    });
                });

                if (parentLevelCards.length > 0) {
                    levels.push(parentLevelCards);
                }
                currentLevelIds = parentLevelIds; // Move to the next level up
            }
            
            // Add the root node as the final (but will become first after reverse) level
            // But only if it's not already the focused node and it exists
            if (rootNodeId && rootNodeId !== activeClickedNodeId && !visited.has(rootNodeId)) {
                const rootCard = cardsMap.get(rootNodeId);
                if (rootCard) {
                    levels.push([rootCard]);
                    allFocusPathIds.add(rootNodeId);
                }
            }

            // --- Find Others (cards not in focus path) ---
            validCards.forEach(card => {
                if (!allFocusPathIds.has(card.nodeId)) {
                    others.push(card);
                }
            });

        } else {
            // Inactive state: treat all non-root as 'children' for initial grid
            validCards.forEach(card => {
                if (card.nodeId !== rootNode?.id) {
                    children.push(card);
                }
            });
        }

        return {
            rootCard: rootCardData,
            ancestorLevels: levels.reverse(), // Reverse so root is first element
            focusedCard: focused,
            childCards: children,
            otherCards: others,
            isFocusActive: currentFocusActive
        };
    }, [knowledgeCards, visualizationData, activeClickedNodeId]);
    // --- End Refactored Memoization ---

    // Add console log to inspect calculated data
    console.log("Knowledge Section Render - Focus Active:", isFocusActive, "Focused:", focusedCard?.nodeId, "Ancestors:", ancestorLevels, "Children:", childCards);

    // Only render if there's something to show
    if (!rootCard && ancestorLevels.length === 0 && !focusedCard && childCards.length === 0 && otherCards.length === 0) {
        if (knowledgeCards && knowledgeCards.length > 0) {
             console.warn("KnowledgeCardsSection: Cards present but none were mapped correctly.");
        }
        return null;
    }
    
    // --- Updated renderCardList Helper ---
    const renderCardList = (
        cards: KnowledgeCardType[],
        alwaysExpand: boolean = false,
        layoutDirection: 'vertical' | 'horizontal' = 'vertical',
        maxWidthClass: string = 'max-w-none',
        variant: 'default' | 'focused' = 'default'
    ) => {
        return cards.map((card, index) => {
            let baseClass = '';
            let useMotionDiv = true;

            if (layoutDirection === 'horizontal') {
                baseClass = 'flex-shrink-0 w-48';
            } else { // layoutDirection is 'vertical'
                if (maxWidthClass !== 'max-w-none') {
                    baseClass = maxWidthClass;
                    useMotionDiv = false;
                } else {
                    baseClass = 'w-full'; // Focused card
                }
            }

            const cardElement = alwaysExpand ? (
                <KnowledgeCard card={card} variant={variant} />
            ) : (
                <CollapsedKnowledgeCard
                    nodeId={card.nodeId}
                    title={card.title}
                    onFocus={handleFocus}
                />
            );

            if (useMotionDiv) {
                 return (
                    <motion.div
                        key={card.nodeId}
                        layout
                        initial={{ opacity: 0, y: layoutDirection === 'vertical' ? 10 : 0, x: layoutDirection === 'horizontal' ? 10 : 0 }}
                        animate={{ opacity: 1, y: 0, x: 0, transition: { delay: index * 0.03, duration: 0.2 } }}
                        className={baseClass}
                    >
                         {cardElement}
                    </motion.div>
                );
            } else {
                return (
                    <div
                        key={card.nodeId}
                        className={baseClass}
                    >
                        {cardElement}
                    </div>
                );
            }
        });
    }
    // --- End Updated Helper ---

    // Function to get level name (Root, Parents, Grandparents...)
    const getLevelName = (levelIndex: number, totalLevels: number): string => {
        if (levelIndex === 0) return "Root";
        const depth = totalLevels - levelIndex;
        if (depth === 1) return "Parents";
        if (depth === 2) return "Grandparents";
        return `Level ${levelIndex + 1} Ancestors`;
    }

    return (
        <>
            <Separator />
            <section className="mt-6 px-4 overflow-hidden">
                <h2 className="text-2xl font-semibold mb-6 text-center">Knowledge Cards</h2>

                {isFocusActive ? (
                    <div className="flex flex-col items-center gap-8">

                        {/* --- Render Ancestor Levels --- */}
                        {ancestorLevels.map((levelCards, levelIndex) => (
                            <React.Fragment key={`level-${levelIndex}`}> 
                                <p className="w-full text-center text-sm font-medium text-muted-foreground">{getLevelName(levelIndex, ancestorLevels.length)}</p>
                                <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl mx-auto">
                                    {renderCardList(levelCards, true, 'vertical', 'max-w-xl')}
                                </div>
                                {levelIndex < ancestorLevels.length && <Separator className="w-1/2 my-4"/>}
                            </React.Fragment>
                        ))}

                        {/* --- Render Focused Card --- */}
                        {focusedCard && (
                            <div key="focused" className="w-full flex flex-col items-center gap-3">
                                <p className="text-sm font-medium text-muted-foreground">Focused Concept</p>
                                <div className="flex justify-center w-full">
                                    <div className="min-w-[320px] max-w-[480px] w-full">
                                        {renderCardList([focusedCard], true, 'vertical', 'max-w-none', 'focused')}
                                    </div>
                                </div>
                                {(childCards.length > 0 || (ancestorLevels.length > 0 && focusedCard)) && <Separator className="w-1/2 my-4"/>}
                            </div>
                        )}

                        {/* --- Render Children Grid --- */}
                        {childCards.length > 0 && (
                            <React.Fragment key="children"> 
                                <p className="w-full text-center text-sm font-medium text-muted-foreground">Direct Children</p>
                                <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl mx-auto">
                                    {renderCardList(childCards, true, 'vertical', 'max-w-xl')}
                                </div>
                            </React.Fragment>
                        )}

                        {/* --- Render Other Collapsed Cards (Horizontal Scroll) --- */}
                        {otherCards.length > 0 && (
                            <div key="others" className="w-full flex flex-col items-center gap-2 mt-6 pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-2">Other Concepts</p>
                                <div className="w-full overflow-x-auto pb-4">
                                    <div className="min-w-fit mx-auto w-max flex flex-row flex-nowrap gap-3 px-2">
                                        {renderCardList(otherCards, false, 'horizontal')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // --- Focus INACTIVE Layout (Root + Grid) ---
                    <div className="flex flex-col items-center gap-6">
                        {rootCard && (
                            <motion.div 
                                key={`root-${rootCard.nodeId}`}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                                className="w-full flex justify-center"
                            > 
                                <KnowledgeCard card={rootCard} variant="focused" />
                            </motion.div>
                        )}
                        {childCards.length > 0 && (
                            <>
                                {rootCard && <Separator className="w-full max-w-4xl my-6"/>}
                                <h3 className="text-xl font-medium mb-4 text-center text-muted-foreground">Related Concepts</h3>
                                {/* Render initial children expanded in a grid */} 
                                <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl mx-auto">
                                    {renderCardList(childCards, true, 'vertical', 'max-w-xl')}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </section>
        </>
    );
};

export default React.memo(KnowledgeCardsSection); 

File: src/lib/database.types.ts
================================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      expanded_concepts: {
        Row: {
          id: string
          session_id: string
          node_id: string
          title: string
          content: string
          related_concepts: Json
          created_at: string
          graph_hash: string
        }
        Insert: {
          id?: string
          session_id: string
          node_id: string
          title: string
          content: string
          related_concepts: Json
          created_at?: string
          graph_hash: string
        }
        Update: {
          id?: string
          session_id?: string
          node_id?: string
          title?: string
          content?: string
          related_concepts?: Json
          created_at?: string
          graph_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "expanded_concepts_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          stripe_customer_id: string | null
          subscription_status: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          created_at: string
          id: string
          last_prompt: string | null
          last_updated_at: string
          session_data: Json | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_prompt?: string | null
          last_updated_at?: string
          session_data?: Json | null
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_prompt?: string | null
          last_updated_at?: string
          session_data?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never


File: src/app/auth/callback/route.ts
================================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    try {
        await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
        console.error("Error exchanging code for session:", error);
        // Handle the error appropriately - maybe redirect to an error page
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
} 

File: src/components/ui/scroll-area.tsx
================================================
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }


File: src/components/SupabaseListener.tsx
================================================
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client' // Use our browser client creator

export default function SupabaseListener({ serverAccessToken }: { serverAccessToken?: string }) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        // Server and client session mismatch. Refresh the page
        router.refresh();
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [serverAccessToken, router, supabase])

  return null // This component doesn't render anything
} 

File: src/lib/supabase/client.ts
================================================
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Define a function to create the client component client
export const createClient = () =>
  createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  }) 

File: tsconfig.json
================================================
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}


File: src/app/api/stripe/create-checkout/route.ts
================================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe, getStripeCustomerId } from '@/lib/stripe';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create the Stripe customer ID
    const customerId = await getStripeCustomerId(user.id, user.email!);

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // We'll set this up in the Stripe dashboard
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 

File: src/lib/utils.ts
================================================
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
}


File: docs/migrations/README.md
================================================
# Database Migrations

This folder contains SQL migration files that need to be applied to the Supabase database.

## Expanded Concepts Table Migration

The `create_expanded_concepts_table.sql` file creates the necessary table structure and security policies for storing expanded concept data, enabling persistence of expanded concepts across sessions.

### How to Apply the Migration

1. **Log in to your Supabase Dashboard**
   - Navigate to your project dashboard at https://app.supabase.com

2. **Open the SQL Editor**
   - In the left navigation, click on "SQL Editor"
   - Click "New Query"

3. **Run the Migration**
   - Copy the entire contents of `create_expanded_concepts_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL commands

4. **Verify the Table Creation**
   - In the left navigation, click on "Table Editor"
   - You should see the new `expanded_concepts` table in the list
   - Verify the table structure matches what's defined in the migration
   - Check that RLS policies have been correctly applied using the "Authentication" > "Policies" section

### What This Migration Does

1. **Creates the `expanded_concepts` table with the following structure:**
   - `id`: UUID (Primary Key)
   - `session_id`: UUID (Foreign Key to sessions table, with cascade delete)
   - `node_id`: Text (ID of the node in the knowledge graph)
   - `title`: Text (Title of the concept)
   - `content`: Text (Detailed content/explanation of the concept)
   - `related_concepts`: JSONB (Array of related concepts with relationships)
   - `graph_hash`: Text (Hash of the graph structure for versioning)
   - `created_at`: Timestamp

2. **Adds appropriate indexes** for performance optimization.

3. **Enables Row Level Security (RLS)** and creates policies to ensure:
   - Users can only access expanded concepts from their own sessions
   - Users can only insert expanded concepts for sessions they own
   - Users can only update or delete expanded concepts they own

### Troubleshooting

If you encounter any errors during the migration:

1. **Foreign Key Constraints**: Make sure the `sessions` table exists and has an `id` column of type UUID.
2. **RLS Policy Errors**: If you get errors about existing policies, you can remove the CREATE POLICY statements or add IF NOT EXISTS to them.
3. **Permission Issues**: Ensure you're running the SQL as a user with sufficient privileges. 

File: src/app/page.tsx
================================================
import React from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import AuthComponent from '@/components/AuthComponent';
import MainAppClient from '@/components/MainAppClient'; // We will create this next

// Make page component async
export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  // If no session, show the Auth component
  if (!session) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
             <h1 className="text-4xl font-bold mb-6">Welcome to Intellea</h1>
            <p className="text-lg text-muted-foreground mb-8">Please sign in to continue</p>
            <AuthComponent />
        </div>
    );
  }

  // If session exists, render the main app (via a client component wrapper)
  return <MainAppClient />;
}


File: src/components/QuizComponent.tsx
================================================
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from 'lucide-react';

interface QuizData {
  question: string;
  options: string[]; // e.g., ["A) Option 1", "B) Option 2", ...]
  correctAnswerLetter?: string; // Make optional if not already
}

interface QuizComponentProps {
  quizData: QuizData;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ quizData }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const checkAnswer = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    if (selectedOption === quizData.correctAnswerLetter?.toUpperCase()) {
      setFeedback("Correct!");
    } else {
      setFeedback(`Incorrect. The correct answer was ${quizData.correctAnswerLetter?.toUpperCase()}.`);
    }
  };

  const getOptionLetter = (option: string): string => {
    // Handles "A)" or "A." format
    return option?.match(/^([A-Za-z])[\.\)]/)?.[1] || '';
  };

  const getOptionText = (option: string): string => {
      // Remove A) or A. prefix and any leading space
      return option.replace(/^([A-Z])[\.\)]\s*/i, '');
  }

  // Safely get the correct answer letter
  const correctAnswerLetter = (quizData.correctAnswerLetter?.toUpperCase()) || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{quizData.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quizData.options && Array.isArray(quizData.options) && quizData.options.map((option, index) => {
            const letter = getOptionLetter(option);
            const text = getOptionText(option);
            const isSelected = selectedOption === letter;
            const isCorrect = letter === correctAnswerLetter;
            
            let variant: "default" | "secondary" | "outline" | "destructive" | "ghost" = "outline";
            let icon = null;
            let buttonTextClass = "text-card-foreground";

            if (isAnswered) {
              if (isSelected) {
                variant = isCorrect ? "default" : "destructive";
                icon = isCorrect ? <Check className="ml-auto h-5 w-5 text-green-500" /> : <X className="ml-auto h-5 w-5 text-white" />;
                buttonTextClass = isCorrect ? "text-primary-foreground" : "text-destructive-foreground";
              } else if (isCorrect) {
                variant = "secondary";
                icon = <Check className="ml-auto h-5 w-5 text-green-600" />;
                buttonTextClass = "text-secondary-foreground";
              } else {
                variant = "secondary";
                buttonTextClass = "text-muted-foreground";
              }
            } else {
              variant = isSelected ? "default" : "outline";
              buttonTextClass = isSelected ? "text-primary-foreground" : "text-card-foreground";
            }

            return (
              <Button
                key={index}
                variant={variant}
                onClick={() => handleOptionSelect(letter)}
                className={`w-full justify-start h-auto py-3 px-4 ${isAnswered ? 'opacity-90' : ''}`}
                disabled={isAnswered}
              >
                <span className={`font-mono mr-3 ${isSelected && !isAnswered ? 'text-primary-foreground' : isSelected ? buttonTextClass : 'text-muted-foreground'}`}>{letter})</span> 
                <span className={`flex-grow text-left whitespace-normal ${buttonTextClass}`}>{text}</span>
                {icon}
              </Button>
            );
          })}

          {!isAnswered ? (
            <Button
              onClick={checkAnswer}
              disabled={!selectedOption}
              className="mt-4 w-full sm:w-auto"
            >
              Check Answer
            </Button>
          ) : feedback && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 text-center font-medium p-2 rounded-md ${selectedOption === correctAnswerLetter ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}
            >
              {feedback}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuizComponent; 

File: docs/design_document.md
================================================
**Project Design Document: Interactive LLM-Based Learning Interface**

---

### **Project Title:**
**Intellea**

---

### **1. Purpose & Vision**
Modern chat-based LLM interfaces are poorly suited for learning and comprehension, especially for neurodivergent users or those who struggle with reading long blocks of text. *Intellea* aims to replace the wall-of-text output with a visually interactive, **dynamically expanding 3D knowledge graph** and complementary components, creating a learning environment that improves understanding, retention, and usability.

We aren't building a dev tool. We're building an **AI-assisted thinking and learning interface**, designed for people who want to intuitively grasp complex topics by exploring structured information visually, rather than parsing verbose LLM outputs.

---

### **2. Core Use Case**
**Scenario:** A user wants to understand a technical or conceptual topic (e.g., decision trees, blockchain, GDP growth, regex). Instead of being served a scrollable chat, the AI breaks the topic into:
- Flowcharts
- Animations
- Key-term cards
- Interactive components
- Dynamic quizzes
- Live diagrams that evolve with further questions

The UI becomes the learning assistant, not the bottleneck.

---

### **3. Who It's For (Product-Market Fit)**
- **Neurodivergent learners** (ADHD, dyslexia, etc.)
- **Students** and autodidacts who use AI to learn new topics
- **Founders, PMs, designers** trying to understand tech without reading docs
- **Casual learners** who want better intuition around complex systems

**Primary frustrations we solve:**
- Can't remember what AI said
- Don't understand complex concepts from pure text
- Hate scrolling through slow, verbose output
- Want actionable or explorable information

---

### **4. Core Features**
- **Dynamic 3D Knowledge Graph:** The primary interaction mode. Instead of static outputs, the AI generates an initial 3D graph (nodes and links) representing core concepts **structured around a central root node derived from the initial prompt**. Users click nodes to trigger further LLM calls that dynamically expand the graph with related sub-concepts, allowing for user-driven exploration. This serves as the **visual semantic map** of the topic. Rendered via `react-force-graph-3d`.
- **Unified Multi-Facet Response:** The AI still provides complementary components alongside the graph (explanation, Knowledge Cards, quiz) for a richer context, derived from the initial prompt.
- **Interactive Knowledge Cards:** Detailed cards corresponding to each node in the graph. They contain concise explanations, definitions, and potentially relationships to other concepts. These serve as the **primary source for deeper learning** about individual concepts within the map. Includes a button to **focus the 3D graph** on the corresponding node **and its immediate neighbors (path focusing)**, visually emphasizing related concepts while dimming others.
- **Lightweight Quizzing:** Interactive MCQ for concept checks based on the explored topic.
- **Contextual Memory:** Key ideas, terms, and the *state of the explored graph* persist across sessions (**Implemented via Supabase backend**). Session titles are **automatically generated** based on the root node label.
- **Non-linear Exploration:** The dynamic graph inherently facilitates non-linear navigation driven by user curiosity.

---

### **5. Competitive Differentiators**
- **Not chat-based:** Replaces the linear chat with an **explorable 3D knowledge space** tightly integrated with detailed **Knowledge Cards**.
- **Visually structured:** Information hierarchy and relationships are explicit and navigable in 3D.
- **Custom-built for learning and memory:** The graph structure aids understanding connections, and dynamic expansion caters to individual learning paths.
- Supports **incremental, user-driven exploration** over time, revealing complexity progressively rather than delivering flat, one-shot answers.

---

### **6. Marketing & Distribution Strategy**
#### Channels:
- Twitter/X (via demos, short clips, ADHD-friendly content)
- YouTube ("How I learned X in 3 minutes with this AI tool")
- Product Hunt launch
- Developer and startup communities (IndieHackers, Hacker News)
- Reddit (especially ADHD, productivity, edtech, and explainlikeimfive subreddits)

#### Hooks:
- "ChatGPT is great. Until you forget what it just said."
- "Learning something new? Don't read it. **See it.**"
- "The anti-chat interface for AI learning."

---

### **7. Future Possibilities**
- Multi-user collaborative whiteboards
- AI-curated learning journeys with saved progress
- Integration with note-taking tools (Obsidian, Notion, etc.)
- On-device or privacy-first model hosting
- Support for multiple LLMs with comparative outputs

---

### **Summary**
*Intellea* rethinks how people engage with LLMs to learn new concepts. By shifting from text to visual interactivity, we help users understand faster, remember longer, and stay engaged. This is a visual language for AI assistance—built for the way humans actually learn.



File: public/file.svg
================================================
<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clip-rule="evenodd" fill="#666" fill-rule="evenodd"/></svg>

File: src/app/layout.tsx
================================================
import type { Metadata } from "next";
// Remove Geist fonts
// import { Geist, Geist_Mono } from "next/font/google";
import { Nunito } from "next/font/google"; // Add Nunito
import { PT_Sans } from "next/font/google"; // Add PT_Sans
import "./globals.css";

// Import Supabase components
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import SupabaseListener from '@/components/SupabaseListener'; // We will create this component next

// Remove Geist font config
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
// 
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// Add Matsu font config
const nunito = Nunito({
variable: "--font-nunito",
subsets: ["latin"],
});

const ptSans = PT_Sans({
variable: "--font-pt-sans",
subsets: ["latin"],
weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Intellea - Interactive AI Learning", // Keep existing metadata
  description: "Learn complex topics visually with an interactive AI interface.",
};

// Make the layout component async
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en">
      {/* Update body className and add texture div */}
      <body
        className={`${nunito.variable} ${ptSans.variable} antialiased relative`}
      >
        {/* Add SupabaseListener to manage client-side session changes */}
        <SupabaseListener serverAccessToken={session?.access_token} />
        <div className="texture" /> 
        {children}
      </body>
    </html>
  );
}


File: src/app/api/stripe/webhook/route.ts
================================================
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Validate environment variables
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
}

// Create a Supabase client configured to use the Service Role Key
// This client bypasses RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer) {
            console.error(`Webhook Error: Customer ${customerId} not found.`);
            break;
        }
        if (customer.deleted) {
            console.error(`Webhook Error: Customer ${customerId} was deleted.`);
            break; 
        }
        const supabaseUserId = customer.metadata.supabaseUserId;

        if (!supabaseUserId) {
          console.error(`Webhook Error: supabaseUserId missing from metadata for customer ${customerId}`);
          break; 
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
          })
          .eq('id', supabaseUserId);

        if (updateError) {
          console.error(`Webhook DB Error (checkout.session.completed) for user ${supabaseUserId}:`, updateError);
        } else {
           console.log(`Webhook Success: Updated profile for user ${supabaseUserId} to active.`);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer) {
            console.error(`Webhook Error: Customer ${customerId} not found during update/delete.`);
            break;
        }
        if (customer.deleted) {
            console.error(`Webhook Error: Customer ${customerId} was deleted during update/delete.`);
            break; 
        }
        const supabaseUserId = customer.metadata.supabaseUserId;

        if (!supabaseUserId) {
          console.error(`Webhook Error: supabaseUserId missing from metadata for customer ${customerId} during subscription update/delete`);
          break; 
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: subscription.status, 
            stripe_subscription_id: subscription.id, 
          })
          .eq('id', supabaseUserId);

        if (updateError) {
            console.error(`Webhook DB Error (${event.type}) for user ${supabaseUserId}:`, updateError);
        } else {
            console.log(`Webhook Success: Updated subscription status to '${subscription.status}' for user ${supabaseUserId}.`);
        }
        break;
      }
      default: 
        console.log(`Webhook received unhandled event type: ${event.type}`);
    }

    // Return 200 OK to Stripe to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error: any) {
    // Handle signature verification errors or other issues
    console.error('Stripe Webhook Error:', error.message);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 400 } // Use 400 for signature/request errors
    );
  }
} 

File: src/components/AuthComponent.tsx
================================================
'use client';

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client'; // Import our client creator

const AuthComponent = () => {
  const supabase = createClient(); // Create the Supabase client instance

  return (
    <div className="w-full max-w-md mx-auto mt-8 p-4">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }} // Basic Supabase theme
        providers={['google', 'github']} // Add Google and GitHub to the providers list
        view="magic_link" // Start with magic link view
        showLinks={true} // Show links to switch between magic link / social
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`} // URL to redirect to after successful login
      />
    </div>
  );
};

export default AuthComponent; 

File: next.config.ts
================================================
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;


File: src/app/api/sessions/[sessionId]/expanded-concepts/lookup/route.ts
================================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';

interface Params {
  sessionId: string;
}

// POST handler to lookup an expanded concept by criteria (avoiding URL query param issues)
export async function POST(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = createRouteHandlerClient<Database>({ cookies });

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // Parse request body
    const payload = await request.json();
    const { nodeId, graphHash } = payload;

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId is required' }, { status: 400 });
    }

    if (!graphHash) {
      return NextResponse.json({ error: 'graphHash is required' }, { status: 400 });
    }

    // Verify user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Error retrieving session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // First verify the session belongs to the user
    const { data: sessionData, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionCheckError || !sessionData) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Look up the expanded concept using a direct query instead of REST API
    console.log(`Looking up expanded concept: sessionId=${sessionId}, nodeId=${nodeId}, graphHash=${graphHash.substring(0, 10)}...`);
    
    const { data: expandedConcept, error: lookupError } = await supabase
      .from('expanded_concepts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('node_id', nodeId)
      .eq('graph_hash', graphHash)
      .single();

    if (lookupError) {
      if (lookupError.code === 'PGRST116') {
        // Not found is normal - return empty for further processing
        return NextResponse.json({ found: false });
      }
      
      // Other errors should be reported
      console.error('Error looking up expanded concept:', lookupError);
      return NextResponse.json({ 
        error: `Error looking up expanded concept: ${lookupError.message}` 
      }, { status: 500 });
    }

    if (!expandedConcept) {
      return NextResponse.json({ found: false });
    }

    // Transform the response to match the client's expected format
    return NextResponse.json({
      found: true,
      data: {
        nodeId: expandedConcept.node_id,
        title: expandedConcept.title,
        content: expandedConcept.content,
        relatedConcepts: expandedConcept.related_concepts,
        graphHash: expandedConcept.graph_hash
      }
    });

  } catch (error: any) {
    console.error(`Unexpected error in expanded concepts lookup:`, error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 

File: src/components/CollapsedKnowledgeCard.tsx
================================================
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from 'lucide-react'; // Icon for the button

interface CollapsedKnowledgeCardProps {
  nodeId: string;
  title: string;
  onFocus: (nodeId: string) => void;
}

export const CollapsedKnowledgeCard: React.FC<CollapsedKnowledgeCardProps> = ({
  nodeId,
  title,
  onFocus,
}) => {
  const handleFocusClick = () => {
    onFocus(nodeId);
  };

  return (
    <Card className="flex-1 min-w-[200px] max-w-[240px] shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-1 pt-2 px-3">
        <CardTitle className="text-sm line-clamp-1">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 border-t mt-1">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs h-7"
          onClick={handleFocusClick}
        >
          <Camera className="mr-1 h-3 w-3" /> Focus
        </Button>
      </CardContent>
    </Card>
  );
}; 

File: public/window.svg
================================================
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666"/></svg>

File: src/app/api/sessions/stream/route.ts
================================================
import { NextRequest } from 'next/server'
import { OpenAIApi, Configuration } from 'openai'

// ... existing code (if any) ...

export async function POST(req: NextRequest) {
  try {
    // 1. Parse incoming request for user messages/prompt
    const { messages } = await req.json()

    // 2. Create the OpenAI client
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    const openai = new OpenAIApi(configuration)

    // 3. Set up the response headers for SSE
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        // 4. Make the streaming call to OpenAI
        const completion = await openai.createChatCompletion(
          {
            model: 'gpt-3.5-turbo',
            messages: messages,
            stream: true
          },
          { responseType: 'stream' }
        )

        // 5. Read and push chunks out as SSE
        for await (const chunk of completion.data as any) {
          // Extract the streamed text token
          const content = chunk.choices?.[0]?.delta?.content || ''
          const queue = encoder.encode(`data: ${content}\n\n`)
          controller.enqueue(queue)
        }

        // 6. Signal we’re done
        const doneQueue = encoder.encode('data: [DONE]\n\n')
        controller.enqueue(doneQueue)
        controller.close()
      }
    })

    // 7. Return the streaming response
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  } catch (err: any) {
    // Return an error response if needed
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

File: src/app/api/expand-concept/route.ts
================================================
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

// Simplified interface for visualization data
interface SanitizedNode {
  id: string;
  label: string;
  isRoot?: boolean;
}

interface SanitizedLink {
  source: string;
  target: string;
}

interface SanitizedVisualizationData {
  nodes: SanitizedNode[];
  links: SanitizedLink[];
}

// Knowledge Card interface
interface KnowledgeCard {
  nodeId: string;
  title: string;
  description: string;
}

// Response structure
interface ExpandedConceptResponse {
  title: string;
  content: string;
  relatedConcepts: Array<{
    nodeId: string;
    title: string;
    relation: string;
  }>;
}

// Ensure API keys are available
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for concept expansion
const EXPAND_CONCEPT_PROMPT = `You are Intellea, an expert AI assistant generating detailed information about a specific concept for an interactive learning tool. Respond ONLY with a single, valid JSON object.

**Context:**
The user is exploring a knowledge graph about a topic. They have clicked on a specific node to learn more about that concept in detail. You are given:
1. Information about the concept they want to explore (nodeId and nodeLabel)
2. The complete graph structure (nodes and their relationships)
3. Brief descriptions of all concepts in the graph (knowledgeCards)

**Instructions:**
1. Create a comprehensive, detailed explanation of the selected concept.
2. Structure the response as markdown with appropriate sections, lists, and formatting.
3. Reference related concepts that appear elsewhere in the knowledge graph.
4. Keep the explanation focused, educational, and engaging.
5. Do NOT repeat the basic information that's already in the knowledge card.
6. Aim for approximately 300-500 words of meaningful content.

Your response must be a valid JSON object with this structure:
{
  "title": "The full title of the concept",
  "content": "Comprehensive markdown-formatted explanation...",
  "relatedConcepts": [
    {
      "nodeId": "id-of-related-node",
      "title": "Title of related node",
      "relation": "Brief explanation of how this concept relates to the main concept"
    }
  ]
}`;

export async function POST(req: NextRequest) {
  // Create Supabase client
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    // Verify user subscription
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) {
      console.error("Authentication error:", authError?.message || "No user found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify subscription status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError.message);
      return NextResponse.json({ error: 'Error fetching subscription status' }, { status: 500 });
    }

    if (!profileData || (profileData.subscription_status !== 'active' && profileData.subscription_status !== 'trialing')) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 402 });
    }

    // Parse the request body
    const requestData = await req.json();
    const { nodeId, nodeLabel, visualizationData, knowledgeCards } = requestData;

    if (!nodeId || !nodeLabel) {
      return NextResponse.json({ error: 'Missing required fields: nodeId, nodeLabel' }, { status: 400 });
    }

    // Prepare the prompt for OpenAI
    const messages = [
      { role: 'system', content: EXPAND_CONCEPT_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          nodeToExpand: { id: nodeId, label: nodeLabel },
          visualizationData,
          knowledgeCards
        })
      }
    ];

    // Call the OpenAI API with enforced JSON response format
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages as any,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    // Extract and parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse and validate the response
    let expandedData: ExpandedConceptResponse;
    try {
      expandedData = JSON.parse(content);
      
      // Basic validation
      if (!expandedData.title || !expandedData.content || !Array.isArray(expandedData.relatedConcepts)) {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw response:', content);
      return NextResponse.json({ error: 'Failed to parse expanded concept data' }, { status: 500 });
    }

    // Return the expanded concept data
    return NextResponse.json(expandedData);
  } catch (error: any) {
    console.error('Error expanding concept:', error);
    return NextResponse.json({ error: error.message || 'Error expanding concept' }, { status: 500 });
  }
} 

File: src/components/QuizSection.tsx
================================================
'use client';

import React from 'react';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';
import QuizComponent from './QuizComponent';
import { Separator } from "@/components/ui/separator";

// Helper type guard
function isIntelleaResponse(output: any): output is IntelleaResponse {
    return typeof output === 'object' && output !== null;
}

const QuizSection: React.FC = () => {
    // Select only the quiz data from the store
    const quizData = useAppStore((state) => {
        if (isIntelleaResponse(state.output)) {
            return state.output.quiz;
        }
        return undefined;
    });

    // Only render if quizData exists
    if (!quizData) {
        return null;
    }

    return (
        <>
            <Separator />
            <section>
                <h2 className="text-2xl font-semibold mb-4">Check Understanding</h2>
                <QuizComponent quizData={quizData} />
            </section>
        </>
    );
};

export default React.memo(QuizSection); 

File: src/lib/stripe.ts
================================================
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil' as const,
});

export const getStripeCustomerId = async (userId: string, email: string) => {
  // First, check if we already have a Stripe customer ID in the profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // If not, create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabaseUserId: userId,
    },
  });

  // Save the Stripe customer ID to the profiles table
  await supabase
    .from('profiles')
    .upsert({
      id: userId,
      stripe_customer_id: customer.id,
    });

  return customer.id;
}; 

File: public/next.svg
================================================
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80"><path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"/><path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z"/></svg>

File: src/app/api/stripe/create-portal-session/route.ts
================================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's profile to find their Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer ID found' },
        { status: 400 }
      );
    }

    // Create a portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Error creating portal session' },
      { status: 500 }
    );
  }
} 

File: src/components/ExplanationSection.tsx
================================================
'use client';

import React from 'react';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

// Helper type guard (Consider exporting from store or a utils file)
function isIntelleaResponse(output: any): output is IntelleaResponse {
    return typeof output === 'object' && output !== null && 'explanationMarkdown' in output;
}

// --- Replicate Custom Markdown Components from OutputRenderer --- 
// (Ideally, extract these to a shared utility file)
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
const markdownComponents: Components = {
    p: CustomParagraph,
    h1: CustomH1,
    h2: CustomH2,
    h3: CustomH3,
};
// --- End Custom Markdown Components ---

const ExplanationSection: React.FC = () => {
    // Select only the explanationMarkdown from the store
    const explanationMarkdown = useAppStore((state) => {
        if (isIntelleaResponse(state.output)) {
            return state.output.explanationMarkdown;
        }
        return null; // Return null if not available
    });

    // Only render if explanationMarkdown exists
    if (!explanationMarkdown) {
        return null;
    }

    return (
        <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose dark:prose-invert max-w-none"
        >
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {explanationMarkdown}
            </ReactMarkdown>
        </motion.section>
    );
};

export default React.memo(ExplanationSection); 

File: src/components/ExpandedConceptCard.tsx
================================================
'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore, ExpandedConceptData } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const ExpandedConceptCard: React.FC = () => {
  const expandedConceptData = useAppStore((state) => state.expandedConceptData);
  const isExpandingConcept = useAppStore((state) => state.isExpandingConcept);
  const clearExpandedConcept = useAppStore((state) => state.clearExpandedConcept);
  const setFocusedNodeId = useAppStore((state) => state.setFocusedNodeId);
  const setActiveFocusPath = useAppStore((state) => state.setActiveFocusPath);
  const visualizationData = useAppStore(state => {
    const output = state.output;
    return (output && typeof output === 'object' && 'visualizationData' in output) 
      ? output.visualizationData 
      : null;
  });
  
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
      {/* Loading overlay - separate from content for immediate visibility */}
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
        <div className="flex flex-col items-center justify-center bg-card p-6 rounded-lg shadow-md border">
          <div className="loader mb-3"></div>
          <p className="text-lg">Expanding concept...</p>
        </div>
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
                <h1 className="text-2xl font-bold">{expandedConceptData.title}</h1>
              </div>
              <div className="flex-1 overflow-auto pr-2">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                      ul: ({ node, ...props }) => <ul className="mb-4 list-disc pl-6" {...props} />,
                      ol: ({ node, ...props }) => <ol className="mb-4 list-decimal pl-6" {...props} />,
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

File: src/app/api/sessions/[sessionId]/expanded-concepts/route.ts
================================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import type { ExpandedConceptData } from '@/store/useAppStore';

interface Params {
  sessionId: string;
}

// GET handler to fetch all expanded concepts for a specific session
export async function GET(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = createRouteHandlerClient<Database>({ cookies });

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // Verify user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Error retrieving session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // First verify the session belongs to the user
    const { data: sessionData, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionCheckError || !sessionData) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Fetch all expanded concepts for the session
    const { data: expandedConcepts, error: fetchError } = await supabase
      .from('expanded_concepts')
      .select('*')
      .eq('session_id', sessionId);

    if (fetchError) {
      console.error(`Error fetching expanded concepts for session ${sessionId}:`, fetchError);
      return NextResponse.json({ error: 'Failed to fetch expanded concepts' }, { status: 500 });
    }

    // Transform the database response to match the app's ExpandedConceptData format
    const formattedConcepts = expandedConcepts.map(concept => ({
      nodeId: concept.node_id,
      title: concept.title,
      content: concept.content,
      relatedConcepts: concept.related_concepts,
      graphHash: concept.graph_hash
    }));

    return NextResponse.json({ expandedConcepts: formattedConcepts });

  } catch (error) {
    console.error(`Unexpected error in GET /api/sessions/${sessionId}/expanded-concepts:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST handler to create a new expanded concept for a specific session
export async function POST(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = createRouteHandlerClient<Database>({ cookies });

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // Parse request body
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate required fields
  const { nodeId, title, content, relatedConcepts, graphHash } = payload;
  
  if (!nodeId) {
    return NextResponse.json({ error: 'Missing required field: nodeId' }, { status: 400 });
  }
  
  if (!title) {
    return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 });
  }
  
  if (!content) {
    return NextResponse.json({ error: 'Missing required field: content' }, { status: 400 });
  }
  
  if (!Array.isArray(relatedConcepts)) {
    return NextResponse.json({ error: 'Missing or invalid required field: relatedConcepts (must be an array)' }, { status: 400 });
  }
  
  if (!graphHash) {
    return NextResponse.json({ error: 'Missing required field: graphHash' }, { status: 400 });
  }
  
  // Validate graph hash format (for SHA-256 this would be a 64 character hex string)
  // But allow for fallback hash formats as well
  if (typeof graphHash !== 'string') {
    return NextResponse.json({ error: 'Invalid graphHash: must be a string' }, { status: 400 });
  }

  try {
    // Verify user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // First verify the session belongs to the user
    const { data: sessionData, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionCheckError || !sessionData) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Check if this expanded concept already exists
    const { data: existingConcept, error: checkError } = await supabase
      .from('expanded_concepts')
      .select('id')
      .eq('session_id', sessionId)
      .eq('node_id', nodeId)
      .eq('graph_hash', graphHash)
      .single();

    if (existingConcept) {
      // If it exists, update it using PUT logic
      const { data: updatedConcept, error: updateError } = await supabase
        .from('expanded_concepts')
        .update({
          title,
          content,
          related_concepts: relatedConcepts,
          graph_hash: graphHash
        })
        .eq('id', existingConcept.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating expanded concept:', updateError);
        return NextResponse.json({ error: 'Failed to update expanded concept' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Expanded concept updated',
        id: updatedConcept.id
      });
    }

    // Create a new expanded concept record
    const { data: newConcept, error: insertError } = await supabase
      .from('expanded_concepts')
      .insert({
        session_id: sessionId,
        node_id: nodeId,
        title,
        content,
        related_concepts: relatedConcepts,
        graph_hash: graphHash
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating expanded concept:', insertError);
      return NextResponse.json({ error: 'Failed to create expanded concept' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Expanded concept created',
      id: newConcept.id
    }, { status: 201 });

  } catch (error) {
    console.error(`Unexpected error in POST /api/sessions/${sessionId}/expanded-concepts:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE handler to remove an expanded concept by node ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const url = new URL(request.url);
  const nodeId = url.searchParams.get('nodeId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  if (!nodeId) {
    return NextResponse.json({ error: 'Node ID is required as a query parameter' }, { status: 400 });
  }

  try {
    // Verify user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // First verify the session belongs to the user
    const { data: sessionData, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionCheckError || !sessionData) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Delete the expanded concept
    const { error: deleteError } = await supabase
      .from('expanded_concepts')
      .delete()
      .eq('session_id', sessionId)
      .eq('node_id', nodeId);

    if (deleteError) {
      console.error('Error deleting expanded concept:', deleteError);
      return NextResponse.json({ error: 'Failed to delete expanded concept' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`Unexpected error in DELETE /api/sessions/${sessionId}/expanded-concepts:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 

File: src/components/ui/sheet.tsx
================================================
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}


File: src/components/ui/button.tsx
================================================
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }


File: src/components/ui/skeleton.tsx
================================================
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }


File: src/components/VisualizationComponent.tsx
================================================
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SpriteText from 'three-spritetext';
import { useAppStore } from '@/store/useAppStore';
import * as THREE from 'three'; // Keep THREE import for now, might be needed by dependencies
import { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-3d'; // Import library types

// Define our application-specific node structure, extending the library's base type
interface AppGraphNode extends NodeObject {
  id: string; // Ensure id is a string
  label?: string; // Make label optional
  // Add our specific optional properties
  x?: number; // Use x, y, z for calculated positions
  y?: number;
  z?: number;
  fx?: number; // Keep fx, fy, fz for potential future use (e.g., manual pinning)
  fy?: number;
  fz?: number;
}

// Define our application-specific link structure
interface AppGraphLink extends LinkObject {
  source: string | AppGraphNode; // Use string IDs or node objects
  target: string | AppGraphNode;
}

// Define the graph data structure using our types
interface GraphData {
  nodes: Array<AppGraphNode>;
  links: Array<AppGraphLink>;
}

interface VisualizationComponentProps {
  visualizationData?: GraphData;
  onNodeExpand?: (nodeId: string, nodeLabel: string) => void; 
  expandingNodeId?: string | null;
}

// Define theme colors
const themeColors = {
  background: '#FDF5E6',
  nodeBase: '#8B7D6B',
  nodeHover: '#D8C0A3',
  nodeExpanding: '#FBBF24', // Used for active focus and expansion
  nodeMuted: 'rgba(139, 125, 107, 0.3)',
  link: 'rgba(139, 125, 107, 0.3)',
  label: '#5D4037'
};

const ForceGraph3DComponent = dynamic(() => import('react-force-graph-3d').then(mod => mod.default),
    { ssr: false, loading: () => <p className="text-muted-foreground italic text-sm p-4">Loading 3D Graph...</p> }
);

// Type assertion helper (not memoized)
const asAppNode = (node: NodeObject): AppGraphNode => node as AppGraphNode;

const VisualizationComponent = ({ 
    visualizationData, 
    onNodeExpand, 
    expandingNodeId
}: VisualizationComponentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Use ForceGraphMethods type for the ref for better type safety
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined); // Initialize with undefined
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // --- Store State Selectors ---
  const focusedNodeId = useAppStore((state) => state.focusedNodeId); // For camera focus (transient)
  const activeFocusPathIds = useAppStore((state) => state.activeFocusPathIds); // Revert to implicit state type
  // --- End State Selectors ---

  // --- Node Color Logic ---
  const getNodeColor = useCallback((node: NodeObject) => {
    const appNode = asAppNode(node);
    // Highest priority: Expanding node
    if (expandingNodeId === appNode.id) {
      return themeColors.nodeExpanding;
    }
    // Next priority: Hovered node
    if (hoveredNodeId === appNode.id) {
      return themeColors.nodeHover;
    }
    // Next priority: Path focus
    if (activeFocusPathIds) {
      return activeFocusPathIds.has(appNode.id)
          ? themeColors.nodeExpanding // Highlight nodes in the path
          : themeColors.nodeMuted;     // Dim nodes outside the path
    }
    // Default color if no other state applies
    return themeColors.nodeBase;
  }, [activeFocusPathIds, hoveredNodeId, expandingNodeId]);
  // --- End Node Color Logic ---

  // --- Node Size Logic ---
  const getNodeVal = useCallback((node: NodeObject) => {
      const appNode = asAppNode(node);
      // Use path focus for size
      if (activeFocusPathIds) {
          return activeFocusPathIds.has(appNode.id) ? 15 : 5; // Larger for path nodes, smaller for others
      }
      // Default size if no path focus
      return 8;
  }, [activeFocusPathIds]);
  // --- End Node Size Logic ---

  // --- Node Label Object Logic ---
  const getNodeThreeObject = useCallback((node: NodeObject) => {
    const appNode = asAppNode(node);
    const sprite = new SpriteText(appNode.label || ''); // Use empty string if label is undefined
    sprite.material.depthWrite = false; // prevent sprite from occluding other objects
    sprite.color = themeColors.label;

    // Check if the node is part of the active focus path
    const isInFocusPath = activeFocusPathIds?.has(appNode.id) ?? false;

    sprite.textHeight = isInFocusPath ? 6 : 4; // Larger label for focused path nodes

    // Calculate node value based on focus path for offset
    const nodeVal = activeFocusPathIds 
        ? (isInFocusPath ? 15 : 5)
        : 8;
        
    // Increase multiplier and base offset for more clearance
    const yOffset = nodeVal * 1.0 + 8; // Increased from 0.8 and 5
    sprite.position.set(0, yOffset, 0); 

    return sprite;
  }, [activeFocusPathIds]);
  // --- End Node Label Object Logic ---

  // --- Adjust forces on mount --- 
  useEffect(() => {
    if (graphRef.current) {
      // Increase repulsion
      graphRef.current.d3Force('charge')?.strength(-120); // Default is often -30
      // Increase default link distance
      graphRef.current.d3Force('link')?.distance(60); // Default is often 30
      console.log("VisualizationComponent: Adjusted graph forces.");
    }
  }, []); // Run once on mount

  // Effect for dimensions using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect) {
          const newWidth = entry.contentRect.width;
          const newHeight = entry.contentRect.height;
          // Only update state if dimensions actually changed
          setDimensions(currentDimensions => {
              if (currentDimensions.width !== newWidth || currentDimensions.height !== newHeight) {
                  return { width: newWidth, height: newHeight };
              }
              return currentDimensions; // Return current state if no change
          });
        }
      }
    });

    resizeObserver.observe(container);
    const initialWidth = container.offsetWidth;
    const initialHeight = container.offsetHeight;
    if (initialWidth > 0 && initialHeight > 0) {
        setDimensions({ width: initialWidth, height: initialHeight });
    }

    // Cleanup function
    return () => {
      resizeObserver.disconnect();
      // Renderer disposal removed
    };
  }, []); // Dependencies remain empty

  // Effect for Camera Focus (remains the same, but uses graphRef type)
  useEffect(() => {
    const currentOutput = useAppStore.getState().output;
    const nodes = (typeof currentOutput === 'object' && currentOutput?.visualizationData?.nodes) 
                  ? currentOutput.visualizationData.nodes as AppGraphNode[] // Assert type here
                  : [];

    if (focusedNodeId && graphRef.current && nodes.length > 0) {
        const node = nodes.find(n => n.id === focusedNodeId);
        if (node) {
            const focusX = node.fx ?? node.x ?? 0; // Default to 0 if undefined
            const focusY = node.fy ?? node.y ?? 0;
            const focusZ = node.fz ?? node.z ?? 0;

            // Check if positions are reasonably defined (not all zero)
            if (focusX !== 0 || focusY !== 0 || focusZ !== 0) {
                const distance = 200; // INCREASED FOCUS DISTANCE from 60
                const distRatio = 1 + distance / Math.hypot(focusX, focusY, focusZ);
                const newCameraPosition = {
                    x: focusX * distRatio,
                    y: focusY * distRatio,
                    z: focusZ * distRatio,
                };
                const lookAtPosition = { x: focusX, y: focusY, z: focusZ };
                // Use graphRef with type safety
                graphRef.current.cameraPosition(newCameraPosition, lookAtPosition, 1000);
            } else {
                console.warn(`VisComp: Could not focus on node ${focusedNodeId} - position is at origin or undefined.`);
            }
        } else {
            console.warn(`VisComp: Could not focus on node ${focusedNodeId} - not found.`);
        }
    }
  }, [focusedNodeId]); 

  // Node click handler - Use prop and correct type
  const handleNodeClick = useCallback((node: NodeObject) => {
      const appNode = asAppNode(node);
      if (onNodeExpand && appNode.id) { 
          console.log(`VisualizationComponent: Node clicked, calling onNodeExpand for ${appNode.id}`);
          onNodeExpand(appNode.id, appNode.label || ''); // Use empty string if label is undefined
      } else {
          console.log("VisualizationComponent: Node clicked, but onNodeExpand not available or node.id missing.", appNode);
      }
  }, [onNodeExpand]);

  // Node hover handler - Use correct type
  const handleNodeHover = useCallback((node: NodeObject | null) => {
      setHoveredNodeId(node ? asAppNode(node).id : null);
  }, []);

  // --- Render --- 
  if (!visualizationData) {
    return <div ref={containerRef} className="w-full h-64 bg-muted flex items-center justify-center"><p className="text-muted-foreground italic text-sm">No visualization data available.</p></div>;
  }

  if (dimensions.width === 0 || dimensions.height === 0) {
      return (
          <div 
              ref={containerRef} 
              className="w-full aspect-video bg-card rounded-md border border-border shadow-sm min-h-[300px] flex items-center justify-center"
          >
              <p className="text-muted-foreground italic text-sm p-4">Measuring container...</p>
          </div>
      );
  }
  
  // console.log("[Render] Rendering ForceGraph3DComponent with dimensions:", dimensions);
  // console.log("[Render] Graph Data Nodes:", visualizationData.nodes.length, "Links:", visualizationData.links.length);

  return (
    <div 
        ref={containerRef} 
        className="w-full aspect-video bg-card rounded-md border border-border shadow-sm overflow-hidden relative min-h-[300px]"
    >
      <ForceGraph3DComponent
        ref={graphRef}
        graphData={visualizationData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={themeColors.background}
        cooldownTime={1000}
        // --- Node Styling ---
        nodeRelSize={6} 
        nodeVal={getNodeVal} 
        nodeLabel="label" // Tooltip label
        nodeColor={getNodeColor} 
        nodeOpacity={1}
        nodeThreeObjectExtend={true}
        nodeThreeObject={getNodeThreeObject} // Persistent label object
        // --- Link Styling ---
        linkColor={() => themeColors.link}
        linkWidth={0.5}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleSpeed={0.006}
        // --- Interaction ---
        onNodeClick={handleNodeClick} 
        onNodeHover={handleNodeHover} // Use the correctly typed hover handler
        enableNodeDrag={false}
        // --- Forces & Camera ---
        controlType="orbit"
        // Node Configuration
        nodeResolution={16} // Increase geometry detail
        // Performance / Simulation
        d3AlphaDecay={0.02} // Adjust decay rate if needed
      />
    </div>
  );
};

export default VisualizationComponent; 

File: src/store/useAppStore.ts
================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Session } from '@supabase/supabase-js';
import { UseBoundStore, StoreApi } from 'zustand'; // Import Zustand types
import { SupabaseClient } from '@supabase/supabase-js'; // Import Supabase type

// Define SessionSummary if not already globally available or imported
export interface SessionSummary {
  id: string;
  title: string | null;
  last_updated_at: string;
  last_prompt: string | null;
}

// --- Data Structure Types --- (Copied from API route for consistency)
// Define the expected structure for nodes and links in the graph
export interface NodeObject {
  id: string; // Unique identifier for the node
  label: string; // Text label displayed for the node
  isRoot?: boolean; // ADDED: Flag to identify the central root node
  fx?: number; // Use fx, fy, fz for fixed positions
  fy?: number;
  fz?: number;
  // Keep x, y, z for dynamic simulation state if needed
  x?: number;
  y?: number;
  z?: number;
  // Add other potential node properties if needed later (e.g., color, size)
  [key: string]: any; // Allow arbitrary properties for flexibility
}

export interface LinkObject {
  source: string | NodeObject; // ID of the source node (or node object itself)
  target: string | NodeObject; // ID of the target node (or node object itself)
  // Add other potential link properties if needed later (e.g., label, curvature)
  [key: string]: any; // Allow arbitrary properties for flexibility
}

// Define structure for Knowledge Cards
export interface KnowledgeCard {
  nodeId: string; // RENAMED from id. Corresponds to a node ID in visualizationData.
  title: string; // Concept title (often matches node label)
  description: string; // Concise explanation of the concept (2-4 sentences)
  // Add other potential fields later (e.g., relatedConcepts: string[])
}

// Define structure for the visualization part of the response (nodes/links)
export interface GraphData {
    nodes: NodeObject[];
    links: LinkObject[];
    // knowledgeCards removed from here, now top-level in IntelleaResponse
}

// Define the expected structure of the response from the LLM
export interface IntelleaResponse { // Exporting for frontend use
  explanationMarkdown: string | null;
  knowledgeCards: KnowledgeCard[] | null;
  visualizationData: GraphData; // Now mandatory, uses GraphData interface
  quiz?: { question: string; options: string[]; correctAnswerLetter: string };
}

// Define the structure of the *complete* expansion response (sent from API, used by store)
export interface ExpansionResponse {
    updatedVisualizationData: GraphData; // All nodes (with updated x, y, z) and all links
    newKnowledgeCards: KnowledgeCard[]; // Only the cards corresponding to the newly added nodes
}

// Define structure for expanded concept data
export interface ExpandedConceptData {
  title: string;
  content: string;
  relatedConcepts: Array<{
    nodeId: string;
    title: string;
    relation: string;
  }>;
}

// --- End Data Structure Types ---


export interface AppState {
  prompt: string;
  activePrompt: string | null; // Store the prompt that generated the current output
  output: IntelleaResponse | string | null; // Can be the structured response, an error string, or null
  isLoading: boolean;
  sessionsList: SessionSummary[] | null;
  isSessionListLoading: boolean;
  currentSessionId: string | null;
  currentSessionTitle: string | null;
  isSessionLoading: boolean;
  isSavingSession: boolean;
  // --- Focus State ---
  activeFocusPathIds: Set<string> | null; // IDs of node + neighbors for graph highlighting
  focusedNodeId: string | null; // For transient camera focus animation trigger
  activeClickedNodeId: string | null; // ID of the node the user clicked for card layout
  // --- Error State ---
  error: string | null;
  // --- Graph State ---
  isGraphFullscreen: boolean;
  // --- Billing State ---
  subscriptionStatus: 'active' | 'inactive' | 'trialing' | null; // Added
  isSubscriptionLoading: boolean; // Added

  // --- Expanded Concept State ---
  expandedConceptData: ExpandedConceptData | null;
  isExpandingConcept: boolean;
  expandedConceptCache: Map<string, {data: ExpandedConceptData, graphHash: string}>; // Cache with hash to detect changes

  // --- Actions ---
  setPrompt: (prompt: string) => void;
  setOutput: (output: IntelleaResponse | string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setActivePrompt: (prompt: string | null) => void; // Added action setter
  fetchSessions: (supabase: SupabaseClient, userId: string) => Promise<void>;
  loadSession: (sessionId: string, supabase: SupabaseClient) => Promise<void>;
  createSession: (supabase: SupabaseClient, userId: string, initialPrompt: string) => Promise<string | null>;
  saveSession: (supabase: SupabaseClient) => Promise<void>;
  deleteSession: (sessionId: string, supabase: SupabaseClient) => Promise<void>;
  updateSessionTitleLocally: (title: string) => void;
  resetActiveSessionState: () => void;

  // --- Focus Actions ---
  setActiveFocusPath: (nodeId: string | null, vizData: GraphData | null) => void;
  setFocusedNodeId: (nodeId: string | null) => void; // Trigger camera animation

  // --- Graph Expansion ---
  addGraphExpansion: (expansionResponse: ExpansionResponse, clickedNodeId: string, supabase: SupabaseClient) => void;
  toggleGraphFullscreen: () => void; // Action to toggle fullscreen

  // --- Error Handling ---
  setError: (error: string | null) => void;

  // --- Billing Actions --- // Added
  fetchSubscriptionStatus: (supabase: SupabaseClient, userId: string) => Promise<void>;

  // --- Concept Expansion ---
  expandConcept: (nodeId: string, nodeLabel: string, supabase: SupabaseClient) => Promise<void>;
  clearExpandedConcept: () => void;

  // Add a new function to load expanded concepts from the database
  loadExpandedConcepts: (sessionId: string, supabase: SupabaseClient) => Promise<void>;
}

// Explicitly type the store hook
export const useAppStore: UseBoundStore<StoreApi<AppState>> = create<AppState>()(
  persist(
    (set, get) => ({
      prompt: '',
      activePrompt: null,
      output: null,
      isLoading: false,
      sessionsList: null,
      isSessionListLoading: false,
      currentSessionId: null,
      currentSessionTitle: null,
      isSessionLoading: false,
      isSavingSession: false,
      // --- Focus State Init ---
      activeFocusPathIds: null,
      focusedNodeId: null,
      activeClickedNodeId: null,
      // --- Error State Init ---
      error: null,
      // --- Graph State Init ---
      isGraphFullscreen: false,
      // --- Billing State Init --- // Added
      subscriptionStatus: null,
      isSubscriptionLoading: false,

      // --- Expanded Concept State Init ---
      expandedConceptData: null,
      isExpandingConcept: false,
      expandedConceptCache: new Map(),

      // --- Action Implementations ---
      setPrompt: (prompt) => set({ prompt }),
      setOutput: (output) => set({ output }),
      setLoading: (isLoading) => set({ isLoading }),
      setActivePrompt: (prompt) => set({ activePrompt: prompt }),

      fetchSessions: async (supabase, userId) => {
        set({ isSessionListLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('sessions')
            .select('id, title, last_updated_at, last_prompt')
            .eq('user_id', userId)
            .order('last_updated_at', { ascending: false });

          if (error) throw error;
          set({ sessionsList: data as SessionSummary[], isSessionListLoading: false });
        } catch (error: any) {
          console.error('Error fetching sessions:', error);
          set({ error: `Failed to fetch sessions: ${error.message}`, isSessionListLoading: false });
        }
      },

      loadSession: async (sessionId, supabase) => {
        set({ 
          isSessionLoading: true, 
          error: null, 
          activeFocusPathIds: null, 
          focusedNodeId: null, 
          activeClickedNodeId: null 
        });
        try {
          const { data: loadedData, error } = await supabase
            .from('sessions')
            .select('id, title, session_data, last_prompt')
            .eq('id', sessionId)
            .single();

          if (error) throw error;
          if (!loadedData) throw new Error('Session not found.');

          // Basic validation of loaded session_data structure
          const sessionData = loadedData.session_data as any;
          if (!sessionData || typeof sessionData !== 'object' || 
              !sessionData.explanationMarkdown || 
              !sessionData.knowledgeCards || !Array.isArray(sessionData.knowledgeCards) ||
              !sessionData.visualizationData || typeof sessionData.visualizationData !== 'object' ||
              !sessionData.visualizationData.nodes || !Array.isArray(sessionData.visualizationData.nodes) ||
              !sessionData.visualizationData.links || !Array.isArray(sessionData.visualizationData.links)) {
            console.error('Loaded session data has invalid structure:', sessionData);
            throw new Error('Loaded session data has an invalid or outdated structure.');
          }

          set({
            output: sessionData as IntelleaResponse, // Cast to validated structure
            activePrompt: loadedData.last_prompt, 
            currentSessionId: sessionId,
            currentSessionTitle: loadedData.title,
            isSessionLoading: false,
            activeFocusPathIds: null, 
            focusedNodeId: null,
            activeClickedNodeId: null
          });

          // Load expanded concepts for this session
          await get().loadExpandedConcepts(sessionId, supabase);

        } catch (error: any) {
          console.error('Error loading session:', error);
          get().resetActiveSessionState(); 
          set({ error: `Failed to load session: ${error.message}`, currentSessionId: null, currentSessionTitle: null, isSessionLoading: false });
        }
      },

      createSession: async (supabase, userId, initialPrompt) => {
        if (!initialPrompt?.trim()) {
          set({ error: 'Cannot create session: Initial topic/prompt is required.' });
          return null;
        }
        // Check subscription status BEFORE making the API call
        const currentStatus = get().subscriptionStatus;
        if (currentStatus !== 'active') {
          set({ error: 'An active subscription is required to create new sessions.' });
          return null;
        }
        set({ isSessionLoading: true, isLoading: true, error: null });
        let newSessionId: string | null = null;
        let sessionTitle: string = 'Untitled Session';
        try {
          console.log("createSession: Calling API with initial prompt:", initialPrompt);
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: initialPrompt }),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'API Error' }));
            throw new Error(`API Error (${response.status}): ${errorData.error || 'Failed to generate initial data'}`);
          }
          const result = await response.json();
          if (result.error) throw new Error(`API Error: ${result.error}`);
          if (!result.output) throw new Error('API Error: Invalid response structure received.');
          const initialOutput: IntelleaResponse = result.output;
          const rootNode = initialOutput.visualizationData?.nodes?.find((n: NodeObject) => n.isRoot === true);
          if (rootNode && rootNode.label) sessionTitle = rootNode.label;
          else console.warn("createSession: Root node or label not found, using default title.");

          console.log("createSession: Inserting session into DB with title:", sessionTitle);
          const { data, error: dbError } = await supabase
            .from('sessions')
            .insert({ user_id: userId, title: sessionTitle, session_data: initialOutput, last_prompt: initialPrompt })
            .select('id').single();
          if (dbError) throw dbError;
          if (!data) throw new Error('Failed to create session record in database.');
          newSessionId = data.id;

          get().resetActiveSessionState();
          set({
            currentSessionId: newSessionId,
            currentSessionTitle: sessionTitle,
            output: initialOutput,
            activePrompt: initialPrompt,
            isSessionLoading: false, isLoading: false,
            activeFocusPathIds: null, focusedNodeId: null, activeClickedNodeId: null,
            error: null
          });
          console.log("createSession: Session created successfully, ID:", newSessionId);
          await get().fetchSessions(supabase, userId);
          return newSessionId;
        } catch (error: any) {
          console.error('Error during session creation process:', error);
          if (newSessionId) {
             console.warn("Attempting to clean up potentially created session record...");
             await supabase.from('sessions').delete().eq('id', newSessionId);
          }
          get().resetActiveSessionState();
          set({ error: `Failed to create session: ${error.message}`, isSessionLoading: false, isLoading: false });
          return null;
        }
      },

      saveSession: async (supabase) => {
        const { currentSessionId, currentSessionTitle, output, activePrompt, subscriptionStatus } = get();
        if (!currentSessionId) {
          console.warn('Attempted to save without an active session ID.');
          return;
        }
        if (subscriptionStatus !== 'active') {
          console.warn('Attempted to save session without an active subscription.');
          // Decide if saving should be blocked or allowed for inactive users
          // set({ error: 'Cannot save session without an active subscription.' });
          // return;
        }

        set({ isSavingSession: true, error: null });
        try {
          const { error } = await supabase
            .from('sessions')
            .update({
              title: currentSessionTitle,
              session_data: output,
              last_prompt: activePrompt,
              last_updated_at: new Date().toISOString(),
            })
            .eq('id', currentSessionId);
          if (error) throw error;
          set({ isSavingSession: false });
          // No need to fetch sessions list here usually, title is updated locally
        } catch (error: any) {
          console.error('Error saving session:', error);
          set({ error: `Failed to save session: ${error.message}`, isSavingSession: false });
        }
      },

      deleteSession: async (sessionId, supabase) => {
        set({ isSessionListLoading: true }); // Reuse list loading state
        try {
          const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
          if (error) throw error;

          // If the deleted session was the current one, reset the active state
          if (get().currentSessionId === sessionId) {
            get().resetActiveSessionState();
          }
          // Remove from list
          set((state) => ({
            sessionsList: state.sessionsList?.filter((s) => s.id !== sessionId) ?? null,
            isSessionListLoading: false,
          }));
        } catch (error: any) {
          console.error('Error deleting session:', error);
          set({ error: `Failed to delete session: ${error.message}`, isSessionListLoading: false });
        }
      },

      updateSessionTitleLocally: (title) => {
        set({ currentSessionTitle: title });
        // Saving happens on blur in the component now
      },

      resetActiveSessionState: () => set({
        prompt: '',
        activePrompt: null,
        output: null,
        currentSessionId: null,
        currentSessionTitle: null,
        activeFocusPathIds: null,
        focusedNodeId: null,
        activeClickedNodeId: null,
        isGraphFullscreen: false,
        expandedConceptData: null,
        expandedConceptCache: new Map() // Clear the cache when resetting session
      }),

      // --- Focus Action Implementations ---
      setActiveFocusPath: (nodeId, vizData) => {
        // --- DEBUG LOG ---
        console.log(`[Store Action] setActiveFocusPath called. nodeId: ${nodeId}, hasVizData: ${!!vizData}`);
        // ---------------
        if (!nodeId) { // Only check nodeId for clearing focus
          console.log("[Store Action] Clearing focus path and clicked node ID.");
          set({ activeFocusPathIds: null, activeClickedNodeId: null });
          return;
        }

        // If vizData is provided, calculate the full path
        if (vizData && vizData.nodes && vizData.links) {
            const pathIds = new Set<string>();
            pathIds.add(nodeId); // Add the clicked node itself

            // Add direct neighbors
            vizData.links.forEach(link => {
              const sourceId = typeof link.source === 'object' && link.source !== null ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' && link.target !== null ? link.target.id : link.target;
              if (sourceId === nodeId && targetId) pathIds.add(targetId as string); // Ensure string
              if (targetId === nodeId && sourceId) pathIds.add(sourceId as string); // Ensure string
            });
            console.log(`[Store Action] Setting full focus path (size: ${pathIds.size}) for clicked node: ${nodeId}`);
            set({ activeFocusPathIds: pathIds, activeClickedNodeId: nodeId });
        } else {
            // If only nodeId is provided (like from handleNodeExpand before API call),
            // just set the activeClickedNodeId and clear the path temporarily.
            console.log(`[Store Action] Setting only activeClickedNodeId: ${nodeId}, clearing path.`);
            set({ activeFocusPathIds: null, activeClickedNodeId: nodeId });
        }

        // Also trigger camera focus when setting path (only if node ID is set)
        if (nodeId) {
            get().setFocusedNodeId(nodeId);
        }
      },

      setFocusedNodeId: (nodeId) => {
        set({ focusedNodeId: nodeId });
      },

      // --- Graph Expansion Implementation ---
      addGraphExpansion: (expansionResponse, clickedNodeId, supabase) => {
        set((state) => {
          if (!state.output || typeof state.output === 'string') {
            console.error("addGraphExpansion: Cannot add expansion, current output is not a valid IntelleaResponse object.");
            return {}; // Return empty object to indicate no change
          }

          // Directly replace visualizationData with the updated one from the API
          const updatedVizData = expansionResponse.updatedVisualizationData;

          // Merge new knowledge cards, preventing duplicates based on nodeId
          const existingCardIds = new Set(state.output.knowledgeCards?.map(card => card.nodeId) || []);
          const uniqueNewCards = expansionResponse.newKnowledgeCards.filter(
            card => !existingCardIds.has(card.nodeId)
          );
          const mergedKnowledgeCards = [
            ...(state.output.knowledgeCards || []),
            ...uniqueNewCards,
          ];

          // Construct the new output state
          const newOutputState: IntelleaResponse = {
            ...state.output,
            visualizationData: updatedVizData,
            knowledgeCards: mergedKnowledgeCards,
          };

          // Trigger focus calculation AFTER state update
          // Need to use the updated data for accurate path calculation
          const latestState = { ...state, output: newOutputState }; // Simulate latest state for focus calc
          const latestVizData = latestState.output && typeof latestState.output !== 'string'
                                ? latestState.output.visualizationData : null;

          let newFocusPathIds = state.activeFocusPathIds; // Keep existing focus unless recalculated
          let newActiveClickedNodeId = state.activeClickedNodeId; // Keep existing focus unless recalculated
          
          if (clickedNodeId && latestVizData) {
              // Recalculate the focus path based on the new graph structure
              const pathResult = calculateFocusPath(clickedNodeId, latestVizData);
              newFocusPathIds = pathResult.focusPathIds;
              // Optionally, we could reset activeClickedNodeId here or keep it 
              // depending on desired UX after expansion. Let's keep it for now.
              newActiveClickedNodeId = clickedNodeId; 
          }


          return {
            output: newOutputState,
            isLoading: false, // Expansion is complete
            activeFocusPathIds: newFocusPathIds, // Update focus path
            activeClickedNodeId: newActiveClickedNodeId, // Update clicked node ID
            focusedNodeId: clickedNodeId, // Trigger camera focus on the clicked node
            error: null, // Clear any previous errors
          };
        });

        // Auto-save after successful expansion
        // Pass the supabase client received as an argument
        get().saveSession(supabase); 
      },

      toggleGraphFullscreen: () => set((state) => ({ isGraphFullscreen: !state.isGraphFullscreen })),

      // --- Error Handling Implementation ---
      setError: (error) => set({ error }),

      // --- Billing Action Implementation --- // Added
      fetchSubscriptionStatus: async (supabase, userId) => {
        set({ isSubscriptionLoading: true });
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', userId)
            .single();

          // If error occurs AND it's not the 'Row not found' error, throw it
          if (error && error.code !== 'PGRST116') { 
             throw error;
          }
          
          // If no profile found (PGRST116 or data is null), status is inactive
          const status = profile?.subscription_status;
          console.log("Fetched subscription status:", status);
          
          if (status === 'active' || status === 'trialing') { 
             set({ subscriptionStatus: 'active', isSubscriptionLoading: false });
          } else {
             set({ subscriptionStatus: 'inactive', isSubscriptionLoading: false }); // Default to inactive
          }

        } catch (error: any) {
          console.error('Error fetching subscription status:', error); // Log the full error object
          // Provide a more generic message if specific message is unavailable
          const errorMessage = error?.message ? error.message : 'An unexpected error occurred while checking your subscription.';
          set({ 
              error: `Failed to fetch subscription status: ${errorMessage}`,
              subscriptionStatus: 'inactive', // Assume inactive on error
              isSubscriptionLoading: false 
          });
        }
      },

      // --- Concept Expansion Actions ---
      expandConcept: async (nodeId: string, nodeLabel: string, supabase: SupabaseClient) => {
        const state = get();
        
        // Set initial loading state
        set({ isExpandingConcept: true, error: null });
        
        try {
          // Check subscription status
          if (state.subscriptionStatus !== 'active' && state.subscriptionStatus !== 'trialing') {
            throw new Error('Active subscription required to expand concepts.');
          }
          
          // Prepare sanitized data to send to the API
          const output = state.output;
          let sanitizedVizData = null;
          let graphHash = '';
          
          if (typeof output === 'object' && output !== null && 'visualizationData' in output) {
            // Create a hash of the graph structure to detect changes
            const nodeIds = output.visualizationData.nodes.map(n => n.id).sort().join(',');
            const linkPairs = output.visualizationData.links.map(l => {
              const source = typeof l.source === 'object' && l.source ? l.source.id : l.source;
              const target = typeof l.target === 'object' && l.target ? l.target.id : l.target;
              return `${source}->${target}`;
            }).sort().join(',');
            const fullGraphString = `${nodeIds}|${linkPairs}`;
            
            // Generate a cryptographic hash instead of using the full string
            try {
              // Convert the string to a Uint8Array
              const encoder = new TextEncoder();
              const data = encoder.encode(fullGraphString);
              
              // Generate the SHA-256 hash
              const hashBuffer = await crypto.subtle.digest('SHA-256', data);
              
              // Convert the hash to a hex string
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              graphHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              
              console.log(`Generated graph hash: ${graphHash} (from graph with ${output.visualizationData.nodes.length} nodes and ${output.visualizationData.links.length} links)`);
            } catch (error) {
              console.error('Error generating cryptographic hash:', error);
              // Fallback to a simpler hash approach if crypto API fails
              graphHash = String(fullGraphString.length) + '_' + 
                fullGraphString.split('').reduce((hash, char) => 
                  ((hash << 5) - hash) + char.charCodeAt(0), 0).toString(36);
              console.log(`Using fallback hash: ${graphHash}`);
            }
            
            // Check if we have a cached version for this concept with the same graph structure
            const cachedItem = state.expandedConceptCache.get(nodeId);
            if (cachedItem && cachedItem.graphHash === graphHash) {
              console.log(`Using cached expanded concept data for ${nodeLabel} (${nodeId})`);
              
              // Set the expanded data
              set({ 
                expandedConceptData: cachedItem.data, 
                isExpandingConcept: false 
              });
              
              // Also set focus on this node
              get().setFocusedNodeId(nodeId);
              if (output && typeof output === 'object' && 'visualizationData' in output) {
                get().setActiveFocusPath(nodeId, output.visualizationData);
              }
              
              return;
            }
            
            // Sanitize visualization data for API request
            const sanitizedNodes = output.visualizationData.nodes.map(node => ({
              id: node.id,
              label: node.label,
              isRoot: node.isRoot || false
            }));
            
            const sanitizedLinks = output.visualizationData.links.map(link => {
              const source = typeof link.source === 'object' && link.source ? link.source.id : link.source;
              const target = typeof link.target === 'object' && link.target ? link.target.id : link.target;
              return { source, target };
            });
            
            sanitizedVizData = { nodes: sanitizedNodes, links: sanitizedLinks };
          }

          // Check if we have the concept in the database before making an API call
          const currentSessionId = state.currentSessionId;
          if (currentSessionId) {
            try {
              // Use the new lookup endpoint instead of direct Supabase query
              const lookupResponse = await fetch(`/api/sessions/${currentSessionId}/expanded-concepts/lookup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  nodeId,
                  graphHash,
                }),
              });
              
              if (!lookupResponse.ok) {
                const errorData = await lookupResponse.json();
                console.warn("Error looking up concept in database:", errorData.error);
                // Continue with API call if lookup fails
              } else {
                const lookupResult = await lookupResponse.json();
                
                if (lookupResult.found && lookupResult.data) {
                  console.log(`Found expanded concept in database for ${nodeLabel} (${nodeId})`);
                  const expandedData = {
                    title: lookupResult.data.title,
                    content: lookupResult.data.content,
                    relatedConcepts: lookupResult.data.relatedConcepts
                  };
                  
                  // Cache the data locally
                  const updatedCache = new Map(state.expandedConceptCache);
                  updatedCache.set(nodeId, { data: expandedData, graphHash });
                  set({ 
                    expandedConceptData: expandedData, 
                    isExpandingConcept: false,
                    expandedConceptCache: updatedCache
                  });
                  
                  // Also set focus on this node
                  get().setFocusedNodeId(nodeId);
                  if (output && typeof output === 'object' && 'visualizationData' in output) {
                    get().setActiveFocusPath(nodeId, output.visualizationData);
                  }
                  
                  return;
                }
              }
            } catch (error) {
              console.warn("Error checking database for expanded concept:", error);
              // Continue with API call if database check fails
            }
          }
          
          // If not in cache or database, query the concept expansion API
          const response = await fetch('/api/expand-concept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nodeId,
              nodeLabel,
              visualizationData: sanitizedVizData,
              knowledgeCards: output && typeof output === 'object' && 'knowledgeCards' in output ? output.knowledgeCards : null
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to expand concept.');
          }
          
          const expandedData = await response.json();
          
          // Store in cache 
          if (graphHash && typeof output === 'object' && output !== null && 'visualizationData' in output) {
            const updatedCache = new Map(state.expandedConceptCache);
            updatedCache.set(nodeId, { data: expandedData, graphHash });
            set({ 
              expandedConceptData: expandedData, 
              isExpandingConcept: false,
              expandedConceptCache: updatedCache
            });
            
            // Also set focus on this node
            get().setFocusedNodeId(nodeId);
            if (output && typeof output === 'object' && 'visualizationData' in output) {
              get().setActiveFocusPath(nodeId, output.visualizationData);
            }
            
            // Persist to database if we have an active session
            if (currentSessionId) {
              try {
                const persistResponse = await fetch(`/api/sessions/${currentSessionId}/expanded-concepts`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    nodeId,
                    title: expandedData.title,
                    content: expandedData.content,
                    relatedConcepts: expandedData.relatedConcepts,
                    graphHash
                  }),
                });
                
                if (persistResponse.ok) {
                  console.log(`Saved expanded concept to database: ${nodeLabel} (${nodeId}) with hash ${graphHash.substring(0, 8)}...`);
                } else {
                  const persistError = await persistResponse.json();
                  console.error("Error response from database save:", persistError);
                }
              } catch (error) {
                console.error("Error saving expanded concept to database:", error);
                // Continue even if save fails - we have it in local cache
              }
            }
          } else {
            set({ expandedConceptData: expandedData, isExpandingConcept: false });
          }
        } catch (error: any) {
          console.error('Error expanding concept:', error);
          set({ error: `Failed to expand concept: ${error.message}`, isExpandingConcept: false });
        }
      },
      
      clearExpandedConcept: () => set({ expandedConceptData: null }),

      // Add a new function to load expanded concepts from the database
      loadExpandedConcepts: async (sessionId: string, supabase: SupabaseClient) => {
        try {
          console.log(`Loading expanded concepts for session: ${sessionId}`);
          
          // Fetch expanded concepts from the database API
          const response = await fetch(`/api/sessions/${sessionId}/expanded-concepts`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error fetching expanded concepts: ${errorData.error || response.statusText}`);
            return;
          }
          
          const responseData = await response.json();
          
          if (!responseData.expandedConcepts || !Array.isArray(responseData.expandedConcepts)) {
            console.warn("Invalid or empty expanded concepts data received:", responseData);
            return;
          }
          
          // Populate the local cache with database entries
          const newCache = new Map<string, {data: ExpandedConceptData, graphHash: string}>();
          
          // Count valid and invalid entries
          let validCount = 0;
          let invalidCount = 0;
          
          responseData.expandedConcepts.forEach((concept: any) => {
            // Verify the concept has all required fields
            if (!concept.nodeId || !concept.title || !concept.content || 
                !concept.relatedConcepts || !concept.graphHash) {
              console.warn(`Skipping invalid expanded concept entry:`, concept);
              invalidCount++;
              return;
            }
            
            newCache.set(concept.nodeId, {
              data: {
                title: concept.title,
                content: concept.content,
                relatedConcepts: concept.relatedConcepts
              },
              graphHash: concept.graphHash
            });
            validCount++;
          });
          
          // Update the store with the loaded concepts
          set({ expandedConceptCache: newCache });
          
          console.log(
            `Loaded ${validCount} expanded concepts into cache.` + 
            (invalidCount > 0 ? ` (Skipped ${invalidCount} invalid entries)` : '')
          );
        } catch (error) {
          console.error("Failed to load expanded concepts:", error);
        }
      },
    }),
    {
      name: 'intellea-session-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({
        currentSessionId: state.currentSessionId, // Only persist the current session ID
        // Removed other persisted items like output, prompt etc.
      }),
    }
  )
);

// Helper function for focus path calculation (extracted for clarity)
const calculateFocusPath = (nodeId: string, vizData: GraphData): { focusPathIds: Set<string> | null } => {
    if (!nodeId || !vizData || !vizData.nodes || !vizData.links) {
        return { focusPathIds: null };
    }

    const focusPathIds = new Set<string>([nodeId]);
    const links = vizData.links;

    // Find direct neighbors (source or target of links involving the clicked node)
    links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        if (sourceId === nodeId && targetId) {
            focusPathIds.add(targetId);
        } else if (targetId === nodeId && sourceId) {
            focusPathIds.add(sourceId);
        }
    });
    
    // Always include the root node in the focus path
    const rootNode = vizData.nodes.find(n => n.isRoot === true);
    if (rootNode) {
        console.log(`Adding root node ${rootNode.id} to focus path`);
        focusPathIds.add(rootNode.id);
    } else {
        console.warn("Root node not found in visualization data");
    }

    return { focusPathIds };
};

// Add Supabase client instance to the store dynamically (or handle differently)
// This is a placeholder - you'll likely pass supabase client into actions that need it
// like fetchSessions, loadSession, etc., as already implemented.
// Adding a placeholder property to satisfy the saveSession call within addGraphExpansion.
// This should ideally be handled by ensuring actions needing supabase receive it as an arg.
useAppStore.setState({ supabase: null as SupabaseClient | null } as any);

export default useAppStore;

// Helper type guard
export function isIntelleaResponse(obj: any): obj is IntelleaResponse {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    // Check for mandatory fields existence and basic types
    'explanationMarkdown' in obj && // Allow null
    'knowledgeCards' in obj && (obj.knowledgeCards === null || Array.isArray(obj.knowledgeCards)) &&
    'visualizationData' in obj && typeof obj.visualizationData === 'object' && obj.visualizationData !== null &&
    'nodes' in obj.visualizationData && Array.isArray(obj.visualizationData.nodes) &&
    'links' in obj.visualizationData && Array.isArray(obj.visualizationData.links)
    // Optional: Add deeper validation for node/link/card structure if needed
  );
} 

Summary:
Total files: 58
Total size: 293261 bytes
