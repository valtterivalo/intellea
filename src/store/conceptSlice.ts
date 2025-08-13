/**
 * @fileoverview Zustand store slice.
 * Exports: createConceptSlice, interface
 */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore

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
import type { NodeObject } from '@/types/intellea';

export interface ConceptSlice {
  expandedConceptData: ExpandedConceptData | null;
  isExpandingConcept: boolean;
  streamingContent: string;
  expandedConceptCache: Map<string, { data: ExpandedConceptData; graphHash: string }>;

  expandConcept: (nodeId: string, nodeLabel: string) => Promise<void>;
  expandConceptWithStreaming: (nodeId: string, nodeLabel: string) => Promise<void>;
  clearExpandedConcept: () => void;
  loadExpandedConcepts: (sessionId: string) => Promise<void>;
}

/**
 * @description Create the concept management slice for handling expanded concepts.
 */
export const createConceptSlice: StateCreator<AppState, [], [], ConceptSlice> = (set, get) => ({
  expandedConceptData: null,
  isExpandingConcept: false,
  streamingContent: '',
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
            const source = typeof l.source === 'object' && l.source ? (l.source as NodeObject).id : l.source;
            const target = typeof l.target === 'object' && l.target ? (l.target as NodeObject).id : l.target;
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
          const source = typeof link.source === 'object' && link.source ? (link.source as NodeObject).id : link.source;
          const target = typeof link.target === 'object' && link.target ? (link.target as NodeObject).id : link.target;
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

  expandConceptWithStreaming: async (nodeId: string, nodeLabel: string) => {
    const state = get();

    set({ isExpandingConcept: true, streamingContent: '', error: null });

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
            const source = typeof l.source === 'object' && l.source ? (l.source as NodeObject).id : l.source;
            const target = typeof l.target === 'object' && l.target ? (l.target as NodeObject).id : l.target;
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
          set({ expandedConceptData: cachedItem.data, isExpandingConcept: false, streamingContent: '' });
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
          const source = typeof link.source === 'object' && link.source ? (link.source as NodeObject).id : link.source;
          const target = typeof link.target === 'object' && link.target ? (link.target as NodeObject).id : link.target;
          return { source, target };
        });
        sanitizedVizData = { nodes: sanitizedNodes, links: sanitizedLinks };
      }

      // Check database cache first
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
              set({ expandedConceptData: expandedData, isExpandingConcept: false, streamingContent: '', expandedConceptCache: updatedCache });
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

      // Start streaming
      const response = await fetch('/api/expand-concept/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          nodeLabel,
          visualizationData: sanitizedVizData,
          knowledgeCards: output && typeof output === 'object' && 'knowledgeCards' in output ? output.knowledgeCards : null,
          sessionId: get().currentSessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming concept expansion.');
      }

      if (!response.body) {
        throw new Error('No response body available for streaming.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                
                if (eventData.type === 'chunk') {
                  // Debug: Log what we're receiving
                  if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('Client received chunk:', typeof eventData.content, eventData.content);
                  
                  // Try to extract meaningful content from JSON streaming
                  const rawChunk = eventData.content;
                  let meaningfulContent = rawChunk;
                  
                  // If this looks like JSON content, try to extract the text parts
                  if (rawChunk.includes('"content"') || rawChunk.includes('##') || rawChunk.includes('\\n')) {
                    // Remove JSON syntax and extract readable content
                    meaningfulContent = rawChunk
                      .replace(/^\s*{\s*"title":\s*"[^"]*",?\s*"content":\s*"/, '') // Remove JSON prefix
                      .replace(/",?\s*"relatedConcepts".*$/, '') // Remove JSON suffix
                      .replace(/\\n/g, '\n') // Convert escaped newlines
                      .replace(/\\"/g, '"') // Convert escaped quotes
                      .replace(/^"|"$/g, ''); // Remove surrounding quotes
                  }
                  
                  // Update streaming content
                  set(state => ({ 
                    streamingContent: state.streamingContent + meaningfulContent 
                  }));
                } else if (eventData.type === 'complete') {
                  // Final structured data received
                  const expandedData = eventData.data;
                  
                  if (graphHash && typeof output === 'object' && output && 'visualizationData' in output) {
                    const updatedCache = new Map(state.expandedConceptCache);
                    updatedCache.set(nodeId, { data: expandedData, graphHash });
                    set({ 
                      expandedConceptData: expandedData, 
                      isExpandingConcept: false, 
                      streamingContent: '',
                      expandedConceptCache: updatedCache 
                    });
                    get().setFocusedNodeId(nodeId);
                    get().setActiveFocusPath(nodeId, output.visualizationData);
                    
                    // Save to database
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
                    set({ 
                      expandedConceptData: expandedData, 
                      isExpandingConcept: false, 
                      streamingContent: '' 
                    });
                  }
                  return;
                } else if (eventData.type === 'error') {
                  throw new Error(eventData.error);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: unknown) {
      console.error('Error expanding concept with streaming:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to expand concept: ${errorMessage}`, isExpandingConcept: false, streamingContent: '' });
    }
  },

  clearExpandedConcept: () => set({ expandedConceptData: null, streamingContent: '' }),

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
      responseData.expandedConcepts.forEach((concept: {nodeId: string; title: string; content: string; relatedConcepts: ExpandedConceptData['relatedConcepts']; graphHash: string}) => {
        if (!concept.nodeId || !concept.title || !concept.content || !concept.relatedConcepts || !concept.graphHash) {
          return;
        }
        newCache.set(concept.nodeId, {
          data: {
            title: concept.title,
            content: concept.content,
            relatedConcepts: concept.relatedConcepts as ExpandedConceptData['relatedConcepts'],
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

