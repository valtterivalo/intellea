import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CognitionResponse,
  GraphData,
  KnowledgeCardData,
  NodeObject, // Assuming NodeObject is exported or defined here/imported
  LinkObject, // Assuming LinkObject is exported or defined here/imported
} from '@/types'; // Adjust import path if needed
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


interface AppState {
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
  activeFocusPathIds: Set<string> | null; // IDs of node + neighbors
  focusedNodeId: string | null; // For transient camera focus animation trigger
  // --- Error State ---
  error: string | null;

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
  setActiveFocusPath: (nodeId: string | null) => void; // Calculate and set the path
  setFocusedNodeId: (nodeId: string | null) => void; // Trigger camera animation

  // --- Graph Expansion ---
  addGraphExpansion: (expansionData: GraphData) => void;

  // --- Error Handling ---
  setError: (error: string | null) => void;
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
      // --- Error State Init ---
      error: null,

      // --- Action Implementations ---
      setPrompt: (prompt) => set({ prompt }),
      setOutput: (output) => set({ output }),
      setLoading: (isLoading) => set({ isLoading }),
      setActivePrompt: (prompt) => set({ activePrompt: prompt }), // Added implementation

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
        // Reset focus state when loading a new session
        set({ isSessionLoading: true, error: null, activeFocusPathIds: null, focusedNodeId: null });
        try {
          const { data: loadedData, error } = await supabase
            .from('sessions')
            .select('id, title, session_data, last_prompt')
            .eq('id', sessionId)
            .single();

          if (error) throw error;
          if (!loadedData) throw new Error('Session not found.');

          // Reset focus state again right before setting the loaded data
          set({
            output: loadedData.session_data as CognitionResponse,
            activePrompt: loadedData.last_prompt, // Load last prompt
            currentSessionId: sessionId,
            currentSessionTitle: loadedData.title,
            isSessionLoading: false,
            activeFocusPathIds: null, // Ensure focus is reset
            focusedNodeId: null
          });
        } catch (error: any) {
          console.error('Error loading session:', error);
          get().resetActiveSessionState(); // Also reset state fully on error
          set({ error: `Failed to load session: ${error.message}`, currentSessionId: null, currentSessionTitle: null, isSessionLoading: false });
        }
      },

      createSession: async (supabase, userId, initialPrompt) => {
        if (!initialPrompt?.trim()) {
          set({ error: 'Cannot create session: Initial topic/prompt is required.' });
          return null;
        }
        set({ isSessionLoading: true, isLoading: true, error: null }); // Indicate loading for creation AND API call
        let newSessionId: string | null = null;
        let sessionTitle: string = 'Untitled Session'; // Default title
        try {
          // --- Step 1: Call the API to get the initial graph and root node title --- 
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
          if (result.error) {
            throw new Error(`API Error: ${result.error}`);
          }
          if (!result.output) {
            throw new Error('API Error: Invalid response structure received.');
          }

          const initialOutput: CognitionResponse = result.output;

          // Find the root node to set the title
          const rootNode = initialOutput.visualizationData?.nodes?.find((n: NodeObject) => n.isRoot === true);
          if (rootNode && rootNode.label) {
            sessionTitle = rootNode.label; // Use root node label as title
            console.log("createSession: Using root node label as session title:", sessionTitle);
          } else {
            console.warn("createSession: Root node or label not found in API response, using default title.");
          }

          // --- Step 2: Insert the new session into Supabase with the derived title and initial data ---
          console.log("createSession: Inserting session into DB with title:", sessionTitle);
          const { data, error: dbError } = await supabase
            .from('sessions')
            .insert({ 
                user_id: userId, 
                title: sessionTitle, 
                session_data: initialOutput, // Store the initial API output
                last_prompt: initialPrompt  // Store the initial prompt
            })
            .select('id')
            .single();

          if (dbError) throw dbError; // Throw Supabase error
          if (!data) throw new Error('Failed to create session record in database.');

          newSessionId = data.id;

          // --- Step 3: Update Zustand store state --- 
          get().resetActiveSessionState(); // Clear previous session state fully
          set({
            currentSessionId: newSessionId,
            currentSessionTitle: sessionTitle,
            output: initialOutput, // Set the initial output
            activePrompt: initialPrompt, // Set the initial prompt as active
            isSessionLoading: false, // Creation DB insert finished
            isLoading: false, // API call finished
            error: null
          });

          console.log("createSession: Session created successfully, ID:", newSessionId);
          await get().fetchSessions(supabase, userId); // Refresh session list in sidebar
          return newSessionId;
        } catch (error: any) {
          console.error('Error during session creation process:', error);
          // Clean up potential partial state (e.g., if DB insert failed after API call)
          if (newSessionId) {
             // Optionally try to delete the potentially created DB entry if feasible
             console.warn("Attempting to clean up potentially created session record...");
             await supabase.from('sessions').delete().eq('id', newSessionId); 
          }
          get().resetActiveSessionState(); // Ensure state is reset on error
          set({ error: `Failed to create session: ${error.message}`, isSessionLoading: false, isLoading: false });
          return null;
        }
      },

      saveSession: async (supabase) => {
        const { currentSessionId, currentSessionTitle, output, activePrompt } = get();
        if (!currentSessionId) {
          console.warn('Attempted to save without an active session ID.');
          return; // Don't save if no session is active
        }

        set({ isSavingSession: true, error: null });
        try {
          const { error } = await supabase
            .from('sessions')
            .update({
              title: currentSessionTitle,
              session_data: output, // Save the entire output object (or string)
              last_prompt: activePrompt, // Save the last successful prompt
              last_updated_at: new Date().toISOString(), // Explicitly set update time
            })
            .eq('id', currentSessionId);

          if (error) throw error;
          set({ isSavingSession: false });
          // Optionally refresh session list to show updated timestamp
          // const session = await supabase.auth.getSession();
          // if (session.data.session?.user.id) {
          //   get().fetchSessions(supabase, session.data.session.user.id);
          // }
        } catch (error: any) {
          console.error('Error saving session:', error);
          set({ error: `Failed to save session: ${error.message}`, isSavingSession: false });
        }
      },

      deleteSession: async (sessionId, supabase) => {
        set({ isSessionLoading: true, error: null }); // Use isSessionLoading or a dedicated deleting state
        try {
          const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId);

          if (error) throw error;

          const { currentSessionId } = get();
          // If the deleted session was the active one, reset the app state
          if (currentSessionId === sessionId) {
            get().resetActiveSessionState();
            set({ currentSessionId: null, currentSessionTitle: null });
          }

          // Refresh session list after deletion
          const session = await supabase.auth.getSession();
          if (session.data.session?.user.id) {
            await get().fetchSessions(supabase, session.data.session.user.id);
          }
           set({ isSessionLoading: false }); // Deletion finished

        } catch (error: any) {
          console.error('Error deleting session:', error);
          set({ error: `Failed to delete session: ${error.message}`, isSessionLoading: false });
        }
      },

      updateSessionTitleLocally: (title) => set({ currentSessionTitle: title }),

      resetActiveSessionState: () => set({
        output: null,
        activePrompt: '', // Keep prompt input, but clear active/output
        isLoading: false,
        isSessionLoading: false,
        isSavingSession: false,
        error: null,
        activeFocusPathIds: null, // Reset focus path
        focusedNodeId: null,      // Reset transient camera focus trigger
      }),

      // --- Focus Actions Impl ---
      setActiveFocusPath: (nodeId) => { // Calculate and set the path
        if (nodeId === null) {
          set({ activeFocusPathIds: null }); // Clear focus path if null is passed
          return;
        }

        const output = get().output;
        // Ensure output is the CognitionResponse object and has visualizationData
        if (output && typeof output === 'object' && 'visualizationData' in output && output.visualizationData) {
          const { nodes, links } = output.visualizationData;
          const focusPath = new Set<string>();
          focusPath.add(nodeId); // Add the clicked node itself

          // Iterate through links to find direct neighbors
          links.forEach((link: LinkObject) => { // Explicitly type 'link'
            // Handle both string IDs and NodeObject references in links
            const sourceId = typeof link.source === 'object' ? (link.source as NodeObject).id : link.source;
            const targetId = typeof link.target === 'object' ? (link.target as NodeObject).id : link.target;

            if (sourceId === nodeId && targetId) {
                focusPath.add(targetId as string);
            } else if (targetId === nodeId && sourceId) {
                focusPath.add(sourceId as string);
            }
          });
          set({ activeFocusPathIds: focusPath });
        } else {
          // Fallback: If no graph data, just focus the single node
          const singleNodeSet = new Set<string>();
          singleNodeSet.add(nodeId);
          set({ activeFocusPathIds: singleNodeSet });
        }
      },

      setFocusedNodeId: (nodeId) => set({ focusedNodeId: nodeId }), // Only triggers camera animation

      // --- Graph Expansion Impl ---
       addGraphExpansion: (expansionData) => {
        set((state) => {
          const currentOutput = state.output;
          // Ensure we have a valid CognitionResponse object to update
          if (currentOutput && typeof currentOutput === 'object' && 'visualizationData' in currentOutput && currentOutput.visualizationData) {
            const existingNodes = new Map(currentOutput.visualizationData.nodes.map((n: NodeObject) => [n.id, n])); // Explicitly type 'n'
            // Create a set of string representations of links for efficient lookup
             const existingLinks = new Set(
               currentOutput.visualizationData.links.map((l: LinkObject) => { // Explicitly type 'l'
                 const sourceId = typeof l.source === 'object' ? (l.source as NodeObject).id : l.source;
                 const targetId = typeof l.target === 'object' ? (l.target as NodeObject).id : l.target;
                 // Sort IDs to ensure direction doesn't matter for uniqueness ('A-B' is same as 'B-A')
                 return [sourceId, targetId].sort().join('-');
               })
             );

            // Filter out nodes that already exist
            const newNodes = expansionData.nodes.filter((n: NodeObject) => n.id && !existingNodes.has(n.id)); // Explicitly type 'n'
            // Filter out links that already exist (checking both directions)
            const newLinks = expansionData.links.filter((l: LinkObject) => { // Explicitly type 'l'
               const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
               const targetId = typeof l.target === 'object' ? l.target.id : l.target;
               if (!sourceId || !targetId) return false; // Ignore links with missing IDs
               const linkStr = [sourceId, targetId].sort().join('-');
               return !existingLinks.has(linkStr);
             });

            // Filter out knowledge cards that already exist for a given nodeId
            const existingCardNodeIds = new Set(currentOutput.knowledgeCards?.map((kc: KnowledgeCardData) => kc.nodeId) ?? []); // Explicitly type 'kc'
            const newKnowledgeCards = expansionData.knowledgeCards?.filter(
                (kc: KnowledgeCardData) => kc.nodeId && !existingCardNodeIds.has(kc.nodeId) // Explicitly type 'kc'
            ) ?? [];

            // Construct the updated output object
            const updatedOutput: CognitionResponse = {
              ...currentOutput, // Spread existing fields (like explanationMarkdown, quiz)
              knowledgeCards: [
                ...(currentOutput.knowledgeCards ?? []), // Keep existing cards
                ...newKnowledgeCards,                   // Add new unique cards
              ],
              visualizationData: {
                nodes: [...currentOutput.visualizationData.nodes, ...newNodes],
                links: [...currentOutput.visualizationData.links, ...newLinks],
              },
            };
            return { output: updatedOutput };
          }
          // If current output is not in the expected format, return empty object (no state change)
          return {};
        });
       },

      // --- Error Handling Impl ---
      setError: (error) => set({ error }),
    }),
    {
      name: 'cognition-session-storage', // LocalStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentSessionId: state.currentSessionId }), // Only persist currentSessionId
    }
  )
);

// Ensure necessary types (like NodeObject, LinkObject, GraphData, KnowledgeCardData, CognitionResponse)
// are defined or imported correctly, matching their usage throughout the store.
// Example placeholder definitions if not imported from '@/types':

// UNCOMMENT and EXPORT these types
export interface NodeObject { id: string; label?: string; isRoot?: boolean; [key: string]: any; }
export interface LinkObject { source: string | NodeObject; target: string | NodeObject; [key: string]: any; }
export interface KnowledgeCardData { nodeId: string; title: string; description: string; }
export interface GraphData { nodes: NodeObject[]; links: LinkObject[]; knowledgeCards?: KnowledgeCardData[]; }
export interface QuizQuestion { question: string; options: string[]; correctAnswer: string; }
export interface QuizData { questions: QuizQuestion[]; }
export interface CognitionResponse {
  explanationMarkdown: string;
  knowledgeCards: KnowledgeCardData[];
  visualizationData: GraphData | null;
  quiz: QuizData | null;
} 