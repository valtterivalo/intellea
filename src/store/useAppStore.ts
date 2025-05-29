import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Session } from '@supabase/supabase-js';
import { UseBoundStore, StoreApi } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { computeClusters } from '@/lib/graphCluster';
import type { GraphSlice } from './graphSlice';
import { createGraphSlice } from './graphSlice';
import type { SessionSlice } from './sessionSlice';
import { createSessionSlice } from './sessionSlice';
import type { BillingSlice } from './billingSlice';
import { createBillingSlice } from './billingSlice';

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
  x?: number;
  y?: number;
  z?: number;
  [key: string]: any; // Allow arbitrary properties for flexibility
}

export interface LinkObject {
  source: string | NodeObject;
  target: string | NodeObject;
  [key: string]: any;
}

// Define structure for Knowledge Cards
export interface KnowledgeCard {
  nodeId: string;
  title: string;
  description: string;
}

// Define structure for the visualization part of the response (nodes/links)
export interface GraphData {
  nodes: NodeObject[];
  links: LinkObject[];
}

// Define the expected structure of the response from the LLM
export interface IntelleaResponse {
  explanationMarkdown: string | null;
  knowledgeCards: KnowledgeCard[] | null;
  visualizationData: GraphData;
  quiz?: { question: string; options: string[]; correctAnswerLetter: string };
}

export interface ExpansionResponse {
  updatedVisualizationData: GraphData;
  newKnowledgeCards: KnowledgeCard[];
}

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

export interface AppState extends GraphSlice, SessionSlice, BillingSlice {
  prompt: string;
  activePrompt: string | null;
  output: IntelleaResponse | string | null;
  isLoading: boolean;
  // Focus State
  activeFocusPathIds: Set<string> | null;
  focusedNodeId: string | null;
  activeClickedNodeId: string | null;
  // Error State
  error: string | null;
  // Graph State
  isGraphFullscreen: boolean;
  // Expanded Concept State
  expandedConceptData: ExpandedConceptData | null;
  isExpandingConcept: boolean;
  expandedConceptCache: Map<string, { data: ExpandedConceptData; graphHash: string }>;

  // --- Actions ---
  setPrompt: (prompt: string) => void;
  setOutput: (output: IntelleaResponse | string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setActivePrompt: (prompt: string | null) => void;

  // Focus Actions
  setActiveFocusPath: (nodeId: string | null, vizData: GraphData | null) => void;
  setFocusedNodeId: (nodeId: string | null) => void;

  // Graph Expansion
  addGraphExpansion: (expansionResponse: ExpansionResponse, clickedNodeId: string, supabase: SupabaseClient) => void;
  toggleGraphFullscreen: () => void;

  // Error Handling
  setError: (error: string | null) => void;

  // Concept Expansion
  expandConcept: (nodeId: string, nodeLabel: string, supabase: SupabaseClient) => Promise<void>;
  clearExpandedConcept: () => void;

  loadExpandedConcepts: (sessionId: string, supabase: SupabaseClient) => Promise<void>;
}

export const useAppStore: UseBoundStore<StoreApi<AppState>> = create<AppState>()(
  persist(
    (set, get) => ({
      prompt: '',
      activePrompt: null,
      output: null,
      isLoading: false,
      ...createSessionSlice(set, get),
      ...createGraphSlice(set, get),
      ...createBillingSlice(set, get),
      // Focus state
      activeFocusPathIds: null,
      focusedNodeId: null,
      activeClickedNodeId: null,
      // Error state
      error: null,
      // Graph state
      isGraphFullscreen: false,
      // Expanded concept state
      expandedConceptData: null,
      isExpandingConcept: false,
      expandedConceptCache: new Map(),

      // --- Base Action Implementations ---
      setPrompt: (prompt) => set({ prompt }),
      setOutput: (output) => {
        const clusters =
          output && typeof output !== 'string'
            ? computeClusters(output.visualizationData)
            : {};
        set({ output, clusters });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setActivePrompt: (prompt) => set({ activePrompt: prompt }),
      setActiveFocusPath: (nodeId, vizData) => {
        console.log(`[Store Action] setActiveFocusPath called. nodeId: ${nodeId}, hasVizData: ${!!vizData}`);
        if (!nodeId) {
          console.log("[Store Action] Clearing focus path and clicked node ID.");
          set({ activeFocusPathIds: null, activeClickedNodeId: null });
          return;
        }
        if (vizData && vizData.nodes && vizData.links) {
          const pathIds = new Set<string>();
          pathIds.add(nodeId);
          vizData.links.forEach(link => {
            const sourceId = typeof link.source === 'object' && link.source !== null ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' && link.target !== null ? link.target.id : link.target;
            if (sourceId === nodeId && targetId) pathIds.add(targetId as string);
            if (targetId === nodeId && sourceId) pathIds.add(sourceId as string);
          });
          console.log(`[Store Action] Setting full focus path (size: ${pathIds.size}) for clicked node: ${nodeId}`);
          set({ activeFocusPathIds: pathIds, activeClickedNodeId: nodeId });
        } else {
          console.log(`[Store Action] Setting only activeClickedNodeId: ${nodeId}, clearing path.`);
          set({ activeFocusPathIds: null, activeClickedNodeId: nodeId });
        }
        if (nodeId) {
          get().setFocusedNodeId(nodeId);
        }
      },

      setFocusedNodeId: (nodeId) => {
        set({ focusedNodeId: nodeId });
      },

      addGraphExpansion: (expansionResponse, clickedNodeId, supabase) => {
        set((state) => {
          if (!state.output || typeof state.output === 'string') {
            console.error("addGraphExpansion: Cannot add expansion, current output is not a valid IntelleaResponse object.");
            return {};
          }
          const updatedVizData = expansionResponse.updatedVisualizationData;
          const existingCardIds = new Set(state.output.knowledgeCards?.map(card => card.nodeId) || []);
          const uniqueNewCards = expansionResponse.newKnowledgeCards.filter(card => !existingCardIds.has(card.nodeId));
          const mergedKnowledgeCards = [ ...(state.output.knowledgeCards || []), ...uniqueNewCards ];
          const newOutputState: IntelleaResponse = {
            ...state.output,
            visualizationData: updatedVizData,
            knowledgeCards: mergedKnowledgeCards,
          };
          const clusters = computeClusters(updatedVizData);
          const latestState = { ...state, output: newOutputState };
          const latestVizData = latestState.output && typeof latestState.output !== 'string' ? latestState.output.visualizationData : null;
          let newFocusPathIds = state.activeFocusPathIds;
          let newActiveClickedNodeId = state.activeClickedNodeId;
          if (clickedNodeId && latestVizData) {
            const pathResult = calculateFocusPath(clickedNodeId, latestVizData);
            newFocusPathIds = pathResult.focusPathIds;
            newActiveClickedNodeId = clickedNodeId;
          }
          return {
            output: newOutputState,
            clusters,
            isLoading: false,
            activeFocusPathIds: newFocusPathIds,
            activeClickedNodeId: newActiveClickedNodeId,
            focusedNodeId: clickedNodeId,
            error: null,
          };
        });
        get().saveSession(supabase);
      },

      toggleGraphFullscreen: () => set((state) => ({ isGraphFullscreen: !state.isGraphFullscreen })),

      setError: (error) => set({ error }),

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
        onboardingDismissed: state.onboardingDismissed,
        nodeNotes: state.nodeNotes,
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
