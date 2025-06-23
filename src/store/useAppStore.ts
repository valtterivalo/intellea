import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
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
import type { VoiceSlice } from './voiceSlice';
import { createVoiceSlice } from './voiceSlice';
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
  [key: string]: any;
}

// --- Data Structure Types ---

export interface AppState extends GraphSlice, SessionSlice, BillingSlice, ConceptSlice, ChatSlice, VoiceSlice {
  prompt: string;
  activePrompt: string | null;
  output: IntelleaResponse | string | null;
  isLoading: boolean;
  supabase: SupabaseClient | null;
  // Focus State
  activeFocusPathIds: Set<string> | null;
  focusedNodeId: string | null;
  activeClickedNodeId: string | null;
  // Error State
  error: string | null;
  // Graph State
  isGraphFullscreen: boolean;
  // Force-expand state
  forceExpandRequest: { nodeId: string } | null;
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
  removeUnpinnedChildren: (nodeId: string) => void;

  // Force-expand action
  setForceExpandRequest: (request: { nodeId: string } | null) => void;

  // Section refs for smooth scrolling
  knowledgeCardsRef: HTMLElement | null;
  explanationRef: HTMLElement | null;
  setKnowledgeCardsRef: (el: HTMLElement | null) => void;
  setExplanationRef: (el: HTMLElement | null) => void;
  scrollToKnowledgeCards: () => void;
  scrollToExplanation: () => void;

  // Error Handling
  setError: (error: string | null) => void;

}

// In-memory fallback storage for environments without `window` or when a custom
// storage is provided. This mimics the `Storage` interface used by Zustand.
let memoryStore: Record<string, string> = {};
const inMemoryStorage: StateStorage = {
  getItem: (name) => (name in memoryStore ? memoryStore[name] : null),
  setItem: (name, value) => {
    memoryStore[name] = value;
  },
  removeItem: (name) => {
    delete memoryStore[name];
  }
};

// Allow tests to override the storage mechanism used by the persisted store.
let externalStorage: StateStorage | undefined;
export const setAppStoreStorage = (storage?: StateStorage) => {
  externalStorage = storage;
  useAppStore.persist.setOptions({
    storage: createJSONStorage(getStorage)
  });
};

const getStorage = (): StateStorage => {
  if (externalStorage) return externalStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return inMemoryStorage;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get, api) => ({
      prompt: '',
      activePrompt: null,
      output: null,
      isLoading: false,
      supabase: null,
      ...createSessionSlice(set, get, api),
      ...createGraphSlice(set, get, api),
      ...createBillingSlice(set, get, api),
      ...createConceptSlice(set, get, api),
      ...createChatSlice(set, get, api),
      ...createVoiceSlice(set, get, api),
      // Focus state
      activeFocusPathIds: null,
      focusedNodeId: null,
      activeClickedNodeId: null,
      // Error state
      error: null,
      // Graph state
      isGraphFullscreen: false,
      // Force-expand state
      forceExpandRequest: null,
      // Section refs
      knowledgeCardsRef: null,
      explanationRef: null,

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

      setForceExpandRequest: (request) => set({ forceExpandRequest: request }),

      removeUnpinnedChildren: (nodeId) => {
        set((state) => {
          if (!state.output || typeof state.output === 'string') {
            console.error(
              'removeUnpinnedChildren: Cannot proceed, current output is not a valid IntelleaResponse object.'
            );
            return {};
          }

          const { visualizationData, knowledgeCards } = state.output;
          const { pinnedNodes } = state;

          const childLinks = visualizationData.links.filter((link) => {
            const sourceId =
              typeof link.source === 'object' && link.source !== null
                ? (link.source as NodeObject).id
                : link.source;
            return sourceId === nodeId;
          });

          const unpinnedChildrenIds = new Set(
            childLinks
              .map((link) => {
                const targetId =
                  typeof link.target === 'object' && link.target !== null
                    ? (link.target as NodeObject).id
                    : (link.target as string);
                return targetId;
              })
              .filter((childId) => childId && !pinnedNodes[childId])
          );

          if (unpinnedChildrenIds.size === 0) {
            if (process.env.NEXT_PUBLIC_DEBUG === 'true')
              console.log(
                'No unpinned children found to remove for node:',
                nodeId
              );
            return {};
          }

          if (process.env.NEXT_PUBLIC_DEBUG === 'true')
            console.log(
              `Removing ${unpinnedChildrenIds.size} unpinned child nodes.`
            );

          const newNodes = visualizationData.nodes.filter(
            (node) => !unpinnedChildrenIds.has(node.id)
          );
          const newLinks = visualizationData.links.filter((link) => {
            const sourceId =
              typeof link.source === 'object' && link.source !== null
                ? link.source.id
                : link.source;
            const targetId =
              typeof link.target === 'object' && link.target !== null
                ? link.target.id
                : link.target;
            return (
              !unpinnedChildrenIds.has(sourceId) &&
              !unpinnedChildrenIds.has(targetId)
            );
          });
          const newKnowledgeCards = (knowledgeCards || []).filter(
            (card) => !unpinnedChildrenIds.has(card.nodeId)
          );

        const newOutputState: IntelleaResponse = {
          ...state.output,
          visualizationData: {
            nodes: newNodes,
            links: newLinks,
          },
          knowledgeCards: newKnowledgeCards,
        };

        return { output: newOutputState };
      });
      },

      setKnowledgeCardsRef: (el) => set({ knowledgeCardsRef: el }),
      setExplanationRef: (el) => set({ explanationRef: el }),
      scrollToKnowledgeCards: () => {
        const el = get().knowledgeCardsRef;
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      scrollToExplanation: () => {
        const el = get().explanationRef;
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },

      toggleGraphFullscreen: () => set((state) => ({ isGraphFullscreen: !state.isGraphFullscreen })),

      setError: (error) => set({ error }),
    }),
    {
      name: 'intellea-session-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(getStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId, // Only persist the current session ID
        onboardingDismissed: state.onboardingDismissed,
        nodeNotes: state.nodeNotes,
      }),
    }
  )
);
