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
    // knowledgeCards removed from here, now top-level in CognitionResponse
}

// Define the expected structure of the response from the LLM
export interface CognitionResponse { // Exporting for frontend use
  explanationMarkdown: string;
  knowledgeCards: KnowledgeCard[]; // Now mandatory, uses KnowledgeCard interface
  visualizationData: GraphData; // Now mandatory, uses GraphData interface
  quiz?: { question: string; options: string[]; correctAnswerLetter: string };
}
// --- End Data Structure Types ---


export interface AppState {
  prompt: string;
  activePrompt: string | null; // Store the prompt that generated the current output
  output: CognitionResponse | string | null; // Can be the structured response, an error string, or null
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

  // --- Actions ---
  setPrompt: (prompt: string) => void;
  setOutput: (output: CognitionResponse | string | null) => void;
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
  addGraphExpansion: (expansionData: GraphData & { knowledgeCards: KnowledgeCard[] }) => void; // Ensure expansion includes cards
  toggleGraphFullscreen: () => void; // Action to toggle fullscreen

  // --- Error Handling ---
  setError: (error: string | null) => void;

  // --- Billing Actions --- // Added
  fetchSubscriptionStatus: (supabase: SupabaseClient, userId: string) => Promise<void>;
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
            output: sessionData as CognitionResponse, // Cast to validated structure
            activePrompt: loadedData.last_prompt, 
            currentSessionId: sessionId,
            currentSessionTitle: loadedData.title,
            isSessionLoading: false,
            activeFocusPathIds: null, 
            focusedNodeId: null,
            activeClickedNodeId: null
          });
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
          const initialOutput: CognitionResponse = result.output;
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

      resetActiveSessionState: () => {
        set({
          output: null,
          activePrompt: null,
          prompt: '', // Clear prompt input as well
          isLoading: false,
          isSessionLoading: false,
          isSavingSession: false,
          currentSessionId: null, // Clear current session ID
          currentSessionTitle: null, // Clear current session title
          error: null,
          activeFocusPathIds: null,
          focusedNodeId: null,
          activeClickedNodeId: null,
          isGraphFullscreen: false, // Reset fullscreen state
          // Keep subscription status as is, don't reset it here
        });
      },

      // --- Focus Action Implementations ---
      setActiveFocusPath: (nodeId, vizData) => {
        if (!nodeId || !vizData || !vizData.nodes || !vizData.links) {
          set({ activeFocusPathIds: null, activeClickedNodeId: null });
          return;
        }
        const pathIds = new Set<string>();
        pathIds.add(nodeId); // Add the clicked node itself

        // Add direct neighbors
        vizData.links.forEach(link => {
          const sourceId = typeof link.source === 'object' && link.source !== null ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' && link.target !== null ? link.target.id : link.target;
          if (sourceId === nodeId && targetId) pathIds.add(targetId);
          if (targetId === nodeId && sourceId) pathIds.add(sourceId);
        });

        set({ activeFocusPathIds: pathIds, activeClickedNodeId: nodeId });
        // Also trigger camera focus when setting path
        get().setFocusedNodeId(nodeId);
      },

      setFocusedNodeId: (nodeId) => {
        set({ focusedNodeId: nodeId });
      },

      // --- Graph Expansion Implementation ---
      addGraphExpansion: (expansionData) => {
        const currentOutput = get().output;
        if (typeof currentOutput !== 'object' || !currentOutput?.visualizationData) {
          console.error("Cannot add expansion: Current output is invalid or missing visualizationData.");
          set({ error: "Cannot expand graph: current visualization data is missing." });
          return;
        }

        const existingNodes = currentOutput.visualizationData.nodes;
        const existingLinks = currentOutput.visualizationData.links;
        const existingCards = currentOutput.knowledgeCards;

        const newNodeMap = new Map(existingNodes.map(node => [node.id, node]));
        expansionData.nodes.forEach(node => newNodeMap.set(node.id, node));

        const newLinkSet = new Set(existingLinks.map(l => `${l.source}-${l.target}`)); // Simple dedupe
        expansionData.links.forEach(link => newLinkSet.add(`${link.source}-${link.target}`));
        const combinedLinks = Array.from(newLinkSet).map(linkStr => {
           const [source, target] = linkStr.split('-');
           return { source, target };
        });
        
        // Combine and deduplicate knowledge cards based on nodeId
        const newCardMap = new Map(existingCards.map(card => [card.nodeId, card]));
        expansionData.knowledgeCards.forEach(card => newCardMap.set(card.nodeId, card));

        set({
          output: {
            ...currentOutput,
            visualizationData: {
              nodes: Array.from(newNodeMap.values()),
              links: combinedLinks,
            },
            knowledgeCards: Array.from(newCardMap.values()),
          },
          error: null // Clear previous errors on successful expansion
        });
      },

      toggleGraphFullscreen: () => {
        set((state) => ({ isGraphFullscreen: !state.isGraphFullscreen }));
      },

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

    }),
    {
      name: 'cognition-storage', // name of the item in storage (must be unique)
      storage: createJSONStorage(() => localStorage), // Use localStorage
      partialize: (state) => ({ 
        currentSessionId: state.currentSessionId 
        // Only persist the currentSessionId. Other state is reloaded.
      }),
    }
  )
);

// Old Type Definitions (might be useful for reference, but using new ones above)
// export interface NodeObject { id: string; label?: string; isRoot?: boolean; [key: string]: any; }
// export interface LinkObject { source: string | NodeObject; target: string | NodeObject; [key: string]: any; }
// export interface KnowledgeCardData { nodeId: string; title: string; description: string; }
// export interface GraphData { nodes: NodeObject[]; links: LinkObject[]; knowledgeCards?: KnowledgeCardData[]; }
// export interface QuizQuestion { question: string; options: string[]; correctAnswer: string; }
// export interface QuizData { questions: QuizQuestion[]; }
// export interface CognitionResponse {
//   explanationMarkdown: string;
//   knowledgeCards: KnowledgeCardData[];
//   visualizationData: GraphData | null;
//   quiz: QuizData | null;
// } 