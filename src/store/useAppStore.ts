import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the structure for nodes and links (reuse from API)
interface GraphNode {
  id: string;
  label: string;
  [key: string]: any;
}

interface GraphLink {
  source: string;
  target: string;
  [key: string]: any;
}

interface GraphExpansionData {
    nodes: GraphNode[];
    links: GraphLink[];
    knowledgeCards?: KnowledgeCard[]; // Added optional field
}

// Define structure for Knowledge Cards (matches API route)
interface KnowledgeCard {
  id: string; // Corresponds to a node ID
  title: string;
  description: string;
}

// Define the structure for the output we expect from the API
// Mirroring the interface in the API route
export interface CognitionResponse {
  explanationMarkdown: string;
  knowledgeCards?: KnowledgeCard[]; // Updated field
  visualizationData?: GraphExpansionData;
  quiz?: { question: string; options: string[]; correctAnswerLetter: string };
}

// Define the structure for items in the session list
interface SessionListItem {
  id: string;
  title: string;
  last_updated_at: string; // Comes as string from JSON
  last_prompt: string | null;
}

// Define the overall application state
interface AppState {
  // == Core Session State ==
  sessionsList: SessionListItem[];
  setSessionsList: (list: SessionListItem[]) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  currentSessionTitle: string | null;
  setCurrentSessionTitle: (title: string | null) => void;

  // == Current Active Session Data ==
  prompt: string; // Input field content
  setPrompt: (prompt: string) => void;
  activePrompt: string | null; // The prompt that generated the current output (part of saved data)
  setActivePrompt: (prompt: string | null) => void;
  output: CognitionResponse | null | string; // Main data/error (part of saved data)
  setOutput: (output: CognitionResponse | null | string) => void;

  // == UI / Loading States ==
  isLoading: boolean; // For generating AI response
  setIsLoading: (loading: boolean) => void;
  isSessionListLoading: boolean;
  setIsSessionListLoading: (loading: boolean) => void;
  isSessionLoading: boolean; // For loading a full session
  setIsSessionLoading: (loading: boolean) => void;
  isSavingSession: boolean;
  setIsSavingSession: (saving: boolean) => void;

  // == Graph Interaction State (Keep as is, relates to active session) ==
  focusedNodeId: string | null;
  setFocusedNodeId: (id: string | null) => void;
  expandingNodeId: string | null;
  setExpandingNodeId: (id: string | null) => void;

  // == Error State ==
  error: string | null; // Store API or other errors
  setError: (error: string | null) => void;

  // == Actions ==
  // Existing graph actions
  addGraphExpansion: (expansionData: GraphExpansionData) => void;
  updateNodePositions: (nodesWithPositions: GraphNode[]) => void;
  // Session management actions (implementations later)
  fetchSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  createSession: (initialTitle?: string) => Promise<string | null>; // Returns new session ID or null on error
  saveSession: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  resetActiveSessionState: () => void; // Renamed from resetSession
}

// Define initial state values explicitly
const initialState = {
  sessionsList: [],
  currentSessionId: null,
  currentSessionTitle: null,
  prompt: '',
  activePrompt: null,
  output: null,
  isLoading: false,
  isSessionListLoading: false,
  isSessionLoading: false,
  isSavingSession: false,
  focusedNodeId: null,
  expandingNodeId: null,
  error: null,
};


// Update the create call
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState, // Spread initial state values

      // Simple setters
      setSessionsList: (list) => set({ sessionsList: list }),
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
      setCurrentSessionTitle: (title) => set({ currentSessionTitle: title }),
      setPrompt: (prompt) => set({ prompt }),
      setActivePrompt: (activePrompt) => set({ activePrompt }),
      setOutput: (output) => set({ output, error: null }), // Clear error on new output
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsSessionListLoading: (loading) => set({ isSessionListLoading: loading }),
      setIsSessionLoading: (loading) => set({ isSessionLoading: loading }),
      setIsSavingSession: (saving) => set({ isSavingSession: saving }),
      setFocusedNodeId: (id) => set({ focusedNodeId: id }),
      setExpandingNodeId: (id) => set({ expandingNodeId: id }),
      setError: (error) => set({ error }),


      // Graph Actions (Keep existing implementations)
      addGraphExpansion: (expansionData) => {
         const currentOutput = get().output; // Get current state
        
        // Check if currentOutput is valid and contains visualizationData
        if (typeof currentOutput === 'object' && currentOutput !== null && currentOutput.visualizationData) {
          const existingNodes = currentOutput.visualizationData.nodes || [];
          const existingLinks = currentOutput.visualizationData.links || [];
          // Extract nodes, links, and potentially knowledge cards from expansion data
          const { nodes: newNodes, links: newLinks, knowledgeCards: newKnowledgeCards } = expansionData;

          // --- Deduplicate Nodes --- 
          const existingNodeIds = new Set(existingNodes.map(n => n.id));
          const uniqueNewNodes = newNodes.filter(n => !existingNodeIds.has(n.id));

          // --- Deduplicate Links --- 
          const existingLinkKeys = new Set(existingLinks.map(l => `${l.source}->${l.target}`));
          const uniqueNewLinks = newLinks.filter(l => {
              // Ensure source/target are properly resolved to string IDs
              const sourceId = (typeof l.source === 'object' && l.source !== null) ? (l.source as GraphNode).id : l.source;
              const targetId = (typeof l.target === 'object' && l.target !== null) ? (l.target as GraphNode).id : l.target;
              // Check if the string representation of the link exists
              return !existingLinkKeys.has(`${sourceId}->${targetId}`);
          });
          
          // --- Deduplicate Knowledge Cards --- 
          const existingKnowledgeCards = currentOutput.knowledgeCards || [];
          const existingCardIds = new Set(existingKnowledgeCards.map(c => c.id));
          const uniqueNewKnowledgeCards = (newKnowledgeCards || []).filter(c => !existingCardIds.has(c.id));

          // Check if there's anything new to add
          if (uniqueNewNodes.length === 0 && uniqueNewLinks.length === 0 && uniqueNewKnowledgeCards.length === 0) {
            console.log("addGraphExpansion: No new unique nodes, links, or knowledge cards to add.");
            return; // Nothing to update
          }

          // Create the new, merged visualization data
          const mergedVisualizationData: GraphExpansionData = {
            nodes: [...existingNodes, ...uniqueNewNodes],
            links: [...existingLinks, ...uniqueNewLinks],
            // knowledgeCards are handled separately in the main output object
          };
          
          // Create the new, merged knowledge cards array
          const mergedKnowledgeCards = [...existingKnowledgeCards, ...uniqueNewKnowledgeCards];

          // Create the updated output object immutably
          const updatedOutput: CognitionResponse = {
            ...currentOutput,
            visualizationData: mergedVisualizationData, // Updated graph data
            knowledgeCards: mergedKnowledgeCards, // Updated knowledge cards
          };

          console.log(`addGraphExpansion: Merged data. Total nodes: ${mergedVisualizationData.nodes.length}, Total links: ${mergedVisualizationData.links.length}, Total cards: ${mergedKnowledgeCards.length}`);
          
          // Update the state
          set({ output: updatedOutput });
        } else {
          console.error("addGraphExpansion: Cannot add expansion data because current output is not a valid object or lacks visualizationData.");
        }
      },
      updateNodePositions: (nodesWithPositions) => {
         const currentOutput = get().output;
        if (typeof currentOutput === 'object' && currentOutput !== null && currentOutput.visualizationData) {
            // Create a map for efficient lookup, including only necessary props + fx, fy, fz
            const positionMap = new Map(nodesWithPositions.map(node => [
                node.id,
                { 
                    x: node.x, y: node.y, z: node.z, 
                    fx: node.x, fy: node.y, fz: node.z // Set fixed positions
                }
            ]));
            
            // Create new nodes array with updated positions and fixed coordinates
            const updatedNodes = currentOutput.visualizationData.nodes.map(node => {
                const positionData = positionMap.get(node.id);
                if (positionData) {
                    // Create a *new* node object, merging original props with new positions
                    // Important: Exclude internal props like index, vx, vy, vz, __threeObj
                    const { index, vx, vy, vz, __threeObj, ...originalProps } = node;
                    return { 
                        ...originalProps, // Spread original properties (like id, label)
                        ...positionData  // Add x, y, z and fx, fy, fz
                    }; 
                }
                // If somehow a node doesn't have position data (shouldn't happen), return original
                console.warn(`updateNodePositions: Position data not found for node ${node.id}`);
                return node; 
            });

            // Create the updated output object immutably
            const updatedOutput: CognitionResponse = {
                ...currentOutput,
                visualizationData: {
                    ...currentOutput.visualizationData,
                    nodes: updatedNodes, // Use the nodes with updated fixed positions
                },
            };

            // Set the state, triggering persistence
            console.log("updateNodePositions: Updated store with fixed node positions (fx, fy, fz). First node:", updatedNodes[0]);
            set({ output: updatedOutput });
        } else {
             console.warn("updateNodePositions: Cannot update positions, current output is invalid or missing visualizationData.");
        }
      },


      // Session Management Actions (Implementations)
      fetchSessions: async () => {
        set({ isSessionListLoading: true, error: null });
        try {
          const response = await fetch('/api/sessions');
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to fetch sessions list' }));
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
          }
          const data: SessionListItem[] = await response.json();
          set({ sessionsList: data, isSessionListLoading: false });
        } catch (err: any) {
          console.error("Error fetching sessions:", err);
          set({ error: err.message || 'Failed to fetch sessions', isSessionListLoading: false });
        }
      },

      loadSession: async (sessionId) => {
        if (!sessionId) return;
        set({ isSessionLoading: true, error: null });
        get().resetActiveSessionState(); // Clear previous state before loading
        try {
          const response = await fetch(`/api/sessions/${sessionId}`);
          if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Failed to load session' }));
             throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          // Ensure session_data is parsed if it's a string (though API should return object)
          let parsedOutput: CognitionResponse | null = null;
          if (typeof data.session_data === 'string') {
              try {
                  parsedOutput = JSON.parse(data.session_data);
              } catch (parseError) {
                  console.error("Error parsing session_data:", parseError);
                  throw new Error("Failed to parse session data.");
              }
          } else if (typeof data.session_data === 'object' && data.session_data !== null) {
              parsedOutput = data.session_data;
          }

          set({
            currentSessionId: data.id,
            currentSessionTitle: data.title,
            output: parsedOutput,
            activePrompt: data.last_prompt, // Load last prompt into activePrompt
            prompt: '', // Clear the input prompt field
            isSessionLoading: false,
          });
        } catch (err: any) {
          console.error(`Error loading session ${sessionId}:`, err);
          set({ error: err.message || 'Failed to load session', isSessionLoading: false, currentSessionId: null }); // Clear ID on error
        }
      },

      createSession: async (initialTitle = 'Untitled Session') => {
          set({ isSavingSession: true, error: null }); // Use saving state for creation too
          try {
              const response = await fetch('/api/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  // body: JSON.stringify({ title: initialTitle }) // Adjust if API expects title
              });
              if (!response.ok) {
                   const errorData = await response.json().catch(() => ({ error: 'Failed to create session' }));
                   throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
              }
              const newSession: { id: string, title: string } = await response.json();

              // Reset state for the new session
              get().resetActiveSessionState();

              // Set new session details and add to list optimistically
              set(state => ({
                  currentSessionId: newSession.id,
                  currentSessionTitle: newSession.title,
                  // Add to list, assuming basic structure matches SessionListItem for now
                  sessionsList: [{ id: newSession.id, title: newSession.title, last_updated_at: new Date().toISOString(), last_prompt: null }, ...state.sessionsList],
                  isSavingSession: false,
              }));
               return newSession.id; // Return the new ID
          } catch (err: any) {
              console.error("Error creating session:", err);
              set({ error: err.message || 'Failed to create session', isSavingSession: false });
              return null; // Indicate failure
          }
      },

      saveSession: async () => {
        const { currentSessionId, currentSessionTitle, output, activePrompt } = get();
        if (!currentSessionId) {
          set({ error: "No active session to save."});
          console.warn("saveSession called without currentSessionId");
          return;
        }
        // Ensure output is not an error string before saving
        if (typeof output === 'string') {
            set({ error: "Cannot save session with an error state as output."});
            console.warn("saveSession attempted with error string in output state.");
            return;
        }

        set({ isSavingSession: true, error: null });
        try {
          const payload = {
            title: currentSessionTitle || 'Untitled Session', // Ensure title is never null
            session_data: output, // Send the main output object
            last_prompt: activePrompt || '' // Ensure prompt is never null
          };
          const response = await fetch(`/api/sessions/${currentSessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Failed to save session' }));
             throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
          }

          // Optimistically update the title in the sessionsList if it changed
          const savedData = await response.json();
          set(state => ({
              isSavingSession: false,
              sessionsList: state.sessionsList.map(session =>
                  session.id === currentSessionId
                      ? { ...session, title: payload.title, last_updated_at: new Date().toISOString(), last_prompt: payload.last_prompt } // Update timestamp locally too
                      : session
              )
          }));

        } catch (err: any) {
          console.error(`Error saving session ${currentSessionId}:`, err);
          set({ error: err.message || 'Failed to save session', isSavingSession: false });
        }
      },

      deleteSession: async (sessionId) => {
          if (!sessionId) return;
          // Optionally add a loading state for deletion
          set({ error: null });
          try {
              const response = await fetch(`/api/sessions/${sessionId}`, {
                  method: 'DELETE',
              });

              if (!response.ok) {
                  // Handle 204 No Content separately as it has no body
                  if (response.status === 204) {
                     // Success case handled below
                  } else {
                      const errorData = await response.json().catch(() => ({ error: 'Failed to delete session' }));
                      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                  }
              }

              // If deletion was successful (200 OK or 204 No Content)
              set(state => ({
                  sessionsList: state.sessionsList.filter(s => s.id !== sessionId),
                  // If the deleted session was the active one, reset the active state
                  ...(state.currentSessionId === sessionId ? initialState : {})
              }));

          } catch (err: any) {
               console.error(`Error deleting session ${sessionId}:`, err);
               set({ error: err.message || 'Failed to delete session' });
          }
      },


      // Action to reset only the active state, not the list
      resetActiveSessionState: () => {
          console.log("Resetting active session state...");
          set({
              prompt: initialState.prompt,
              activePrompt: initialState.activePrompt,
              output: initialState.output,
              isLoading: initialState.isLoading, // Reset loading states too
              isSessionLoading: initialState.isSessionLoading,
              isSavingSession: initialState.isSavingSession,
              focusedNodeId: initialState.focusedNodeId,
              expandingNodeId: initialState.expandingNodeId,
              currentSessionId: initialState.currentSessionId,
              currentSessionTitle: initialState.currentSessionTitle,
              error: initialState.error, // Clear errors too
          });
      },

    }),
    {
      name: 'cognition-app-storage', // Keep same name
      storage: createJSONStorage(() => localStorage),
      // *** IMPORTANT: Update persisted state ***
      partialize: (state: AppState): Pick<AppState, 'currentSessionId'> => ({
          currentSessionId: state.currentSessionId,
          // Only persist the ID of the last active session.
          // DO NOT persist sessionsList, output, activePrompt, prompt etc. here
      }),
    }
  )
); 