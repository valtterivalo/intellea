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