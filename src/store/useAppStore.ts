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
import type { ChatSlice, ChatMessage } from './chatSlice';
import { createChatSlice } from './chatSlice';
import type {
  NodeObject,
  LinkObject,
  KnowledgeCard,
  GraphData,
  IntelleaResponse,
  ExpansionResponse,
  ExpandedConceptData
} from '@/types/intellea';
export type {
  NodeObject,
  LinkObject,
  KnowledgeCard,
  GraphData,
  IntelleaResponse,
  ExpansionResponse,
  ExpandedConceptData,
  ChatMessage
};
import type { ConceptSlice } from './conceptSlice';
import { createConceptSlice } from './conceptSlice';
import { calculateFocusPath } from '@/lib/focusPath';

// Define SessionSummary if not already globally available or imported
export interface SessionSummary {
  id: string;
  title: string | null;
  last_updated_at: string;
  last_prompt: string | null;
}

// --- Data Structure Types ---

export interface AppState extends GraphSlice, SessionSlice, BillingSlice, ConceptSlice, ChatSlice {
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
      ...createConceptSlice(set, get),
      ...createChatSlice(set, get),
      // Focus state
      activeFocusPathIds: null,
      focusedNodeId: null,
      activeClickedNodeId: null,
      // Error state
      error: null,
      // Graph state
      isGraphFullscreen: false,

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
        if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log(`[Store Action] setActiveFocusPath called. nodeId: ${nodeId}, hasVizData: ${!!vizData}`);
        if (!nodeId) {
          if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log("[Store Action] Clearing focus path and clicked node ID.");
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
          if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log(`[Store Action] Setting full focus path (size: ${pathIds.size}) for clicked node: ${nodeId}`);
          set({ activeFocusPathIds: pathIds, activeClickedNodeId: nodeId });
        } else {
          if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log(`[Store Action] Setting only activeClickedNodeId: ${nodeId}, clearing path.`);
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
  ));

// Add Supabase client instance to the store dynamically (or handle differently)
// This is a placeholder - you'll likely pass supabase client into actions that need it
// like fetchSessions, loadSession, etc., as already implemented.
// Adding a placeholder property to satisfy the saveSession call within addGraphExpansion.
// This should ideally be handled by ensuring actions needing supabase receive it as an arg.
useAppStore.setState({ supabase: null as SupabaseClient | null } as any);

export default useAppStore;
