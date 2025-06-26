interface ExpandedConceptData {
  title: string;
  content: string;
  relatedConcepts: Array<{
    nodeId: string;
    title: string;
    relation: string;
  }>;
}

import type { StateCreator } from 'zustand';
import { AppState } from './useAppStore';

export interface ConceptSlice {
  expandedConceptData: ExpandedConceptData | null;
  isExpandingConcept: boolean;
  expandedConceptCache: Map<string, { data: ExpandedConceptData; graphHash: string }>;

  expandConcept: (nodeId: string, nodeLabel: string) => Promise<void>;
  clearExpandedConcept: () => void;
  loadExpandedConcepts: (sessionId: string) => Promise<void>;
}

export const createConceptSlice: StateCreator<AppState, [], [], ConceptSlice> = (set, get) => ({
  expandedConceptData: null,
  isExpandingConcept: false,
  expandedConceptCache: new Map(),

  expandConcept: async (nodeId: string, nodeLabel: string) => {
    const state = get();

    set({ isExpandingConcept: true, error: null });

    try {
      if (state.subscriptionStatus !== 'active' && state.subscriptionStatus !== 'trialing') {
        throw new Error('Active subscription required to expand concepts.');
      }

      const output = state.output;
      let sanitizedVizData: unknown = null;
      let graphHash = '';

      if (typeof output === 'object' && output && 'visualizationData' in output) {
        const nodeIds = output.visualizationData.nodes.map((n: {id: string}) => n.id).sort().join(',');
        const linkPairs = output.visualizationData.links
          .map((l: {source: unknown; target: unknown}) => {
            const source = typeof l.source === 'object' && l.source ? l.source.id : l.source;
            const target = typeof l.target === 'object' && l.target ? l.target.id : l.target;
            return `${source}->${target}`;
          })
          .sort()
          .join(',');
        const fullGraphString = `${nodeIds}|${linkPairs}`;
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(fullGraphString);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          graphHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch {
          graphHash = String(fullGraphString.length) + '_' +
            fullGraphString.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0).toString(36);
        }

        const cachedItem = state.expandedConceptCache.get(nodeId);
        if (cachedItem && cachedItem.graphHash === graphHash) {
          set({ expandedConceptData: cachedItem.data, isExpandingConcept: false });
          get().setFocusedNodeId(nodeId);
          if (output && typeof output === 'object' && 'visualizationData' in output) {
            get().setActiveFocusPath(nodeId, output.visualizationData);
          }
          return;
        }

        const sanitizedNodes = output.visualizationData.nodes.map((node: {id: string; label: string; isRoot?: boolean}) => ({
          id: node.id,
          label: node.label,
          isRoot: node.isRoot || false,
        }));
        const sanitizedLinks = output.visualizationData.links.map((link: {source: unknown; target: unknown}) => {
          const source = typeof link.source === 'object' && link.source ? link.source.id : link.source;
          const target = typeof link.target === 'object' && link.target ? link.target.id : link.target;
          return { source, target };
        });
        sanitizedVizData = { nodes: sanitizedNodes, links: sanitizedLinks };
      }

      const currentSessionId = state.currentSessionId;
      if (currentSessionId) {
        try {
          const lookupResponse = await fetch(`/api/sessions/${currentSessionId}/expanded-concepts/lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodeId, graphHash })
          });

          if (lookupResponse.ok) {
            const lookupResult = await lookupResponse.json();
            if (lookupResult.found && lookupResult.data) {
              const expandedData = {
                title: lookupResult.data.title,
                content: lookupResult.data.content,
                relatedConcepts: lookupResult.data.relatedConcepts,
              } as ExpandedConceptData;
              const updatedCache = new Map(state.expandedConceptCache);
              updatedCache.set(nodeId, { data: expandedData, graphHash });
              set({ expandedConceptData: expandedData, isExpandingConcept: false, expandedConceptCache: updatedCache });
              get().setFocusedNodeId(nodeId);
              if (output && typeof output === 'object' && 'visualizationData' in output) {
                get().setActiveFocusPath(nodeId, output.visualizationData);
              }
              return;
            }
          }
        } catch (error) {
          console.warn('Error checking database for expanded concept:', error);
        }
      }

      const response = await fetch('/api/expand-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (graphHash && typeof output === 'object' && output && 'visualizationData' in output) {
        const updatedCache = new Map(state.expandedConceptCache);
        updatedCache.set(nodeId, { data: expandedData, graphHash });
        set({ expandedConceptData: expandedData, isExpandingConcept: false, expandedConceptCache: updatedCache });
        get().setFocusedNodeId(nodeId);
        if (output && typeof output === 'object' && 'visualizationData' in output) {
          get().setActiveFocusPath(nodeId, output.visualizationData);
        }
        if (currentSessionId) {
          try {
            await fetch(`/api/sessions/${currentSessionId}/expanded-concepts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nodeId,
                title: expandedData.title,
                content: expandedData.content,
                relatedConcepts: expandedData.relatedConcepts,
                graphHash,
              }),
            });
          } catch (error) {
            console.error('Error saving expanded concept to database:', error);
          }
        }
      } else {
        set({ expandedConceptData: expandedData, isExpandingConcept: false });
      }
    } catch (error: unknown) {
      console.error('Error expanding concept:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to expand concept: ${errorMessage}`, isExpandingConcept: false });
    }
  },

  clearExpandedConcept: () => set({ expandedConceptData: null }),

  loadExpandedConcepts: async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/expanded-concepts`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error fetching expanded concepts: ${errorData.error || response.statusText}`);
        return;
      }

      const responseData = await response.json();
      if (!responseData.expandedConcepts || !Array.isArray(responseData.expandedConcepts)) {
        console.warn('Invalid or empty expanded concepts data received:', responseData);
        return;
      }

      const newCache = new Map<string, { data: ExpandedConceptData; graphHash: string }>();
      responseData.expandedConcepts.forEach((concept: {nodeId: string; title: string; content: string; relatedConcepts: unknown; graphHash: string}) => {
        if (!concept.nodeId || !concept.title || !concept.content || !concept.relatedConcepts || !concept.graphHash) {
          return;
        }
        newCache.set(concept.nodeId, {
          data: {
            title: concept.title,
            content: concept.content,
            relatedConcepts: concept.relatedConcepts,
          },
          graphHash: concept.graphHash,
        });
      });

      set({ expandedConceptCache: newCache });
    } catch (error) {
      console.error('Failed to load expanded concepts:', error);
    }
  },
});

