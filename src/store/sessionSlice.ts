import { StateCreator } from 'zustand';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeClusters } from '@/lib/graphCluster';
import type { IntelleaResponse, NodeObject, SessionSummary, ExpansionResponse } from './useAppStore';

export interface SessionSlice {
  sessionsList: SessionSummary[] | null;
  isSessionListLoading: boolean;
  currentSessionId: string | null;
  currentSessionTitle: string | null;
  isSessionLoading: boolean;
  isSavingSession: boolean;

  fetchSessions: (supabase: SupabaseClient, userId: string) => Promise<void>;
  loadSession: (sessionId: string, supabase: SupabaseClient) => Promise<void>;
  createSession: (supabase: SupabaseClient, userId: string, initialPrompt: string) => Promise<string | null>;
  saveSession: (supabase: SupabaseClient) => Promise<void>;
  deleteSession: (sessionId: string, supabase: SupabaseClient) => Promise<void>;
  updateSessionTitleLocally: (title: string) => void;
  resetActiveSessionState: () => void;
}

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set, get) => ({
  sessionsList: null,
  isSessionListLoading: false,
  currentSessionId: null,
  currentSessionTitle: null,
  isSessionLoading: false,
  isSavingSession: false,

  fetchSessions: async (supabase, userId) => {
    set({ isSessionListLoading: true, error: null } as any);
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
      set({ error: `Failed to fetch sessions: ${error.message}`, isSessionListLoading: false } as any);
    }
  },

  loadSession: async (sessionId, supabase) => {
    set({
      isSessionLoading: true,
      error: null,
      activeFocusPathIds: null,
      focusedNodeId: null,
      activeClickedNodeId: null,
    } as any);
    try {
      const { data: loadedData, error } = await supabase
        .from('sessions')
        .select('id, title, session_data, last_prompt')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!loadedData) throw new Error('Session not found.');

      const sessionData = loadedData.session_data as any;
      if (
        !sessionData ||
        typeof sessionData !== 'object' ||
        !sessionData.explanationMarkdown ||
        !sessionData.knowledgeCards ||
        !Array.isArray(sessionData.knowledgeCards) ||
        !sessionData.visualizationData ||
        typeof sessionData.visualizationData !== 'object' ||
        !sessionData.visualizationData.nodes ||
        !Array.isArray(sessionData.visualizationData.nodes) ||
        !sessionData.visualizationData.links ||
        !Array.isArray(sessionData.visualizationData.links)
      ) {
        console.error('Loaded session data has invalid structure:', sessionData);
        throw new Error('Loaded session data has an invalid or outdated structure.');
      }

      const clusters = computeClusters(sessionData.visualizationData);
      set({
        output: sessionData as IntelleaResponse,
        activePrompt: loadedData.last_prompt,
        currentSessionId: sessionId,
        currentSessionTitle: loadedData.title,
        isSessionLoading: false,
        activeFocusPathIds: null,
        focusedNodeId: null,
        activeClickedNodeId: null,
        clusters,
      } as any);

      await get().loadExpandedConcepts(sessionId, supabase);
    } catch (error: any) {
      console.error('Error loading session:', error);
      get().resetActiveSessionState();
      set({ error: `Failed to load session: ${error.message}`, currentSessionId: null, currentSessionTitle: null, isSessionLoading: false } as any);
    }
  },

  createSession: async (supabase, userId, initialPrompt) => {
    if (!initialPrompt?.trim()) {
      set({ error: 'Cannot create session: Initial topic/prompt is required.' } as any);
      return null;
    }
    const currentStatus = get().subscriptionStatus as any;
    if (currentStatus !== 'active') {
      set({ error: 'An active subscription is required to create new sessions.' } as any);
      return null;
    }
    set({ isSessionLoading: true, isLoading: true, error: null } as any);
    let newSessionId: string | null = null;
    let sessionTitle: string = 'Untitled Session';
    try {
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

      const { data, error: dbError } = await supabase
        .from('sessions')
        .insert({ user_id: userId, title: sessionTitle, session_data: initialOutput, last_prompt: initialPrompt })
        .select('id')
        .single();
      if (dbError) throw dbError;
      if (!data) throw new Error('Failed to create session record in database.');
      newSessionId = data.id;

      get().resetActiveSessionState();
      const clusters = computeClusters(initialOutput.visualizationData);
      set({
        currentSessionId: newSessionId,
        currentSessionTitle: sessionTitle,
        output: initialOutput,
        activePrompt: initialPrompt,
        isSessionLoading: false,
        isLoading: false,
        activeFocusPathIds: null,
        focusedNodeId: null,
        activeClickedNodeId: null,
        clusters,
        error: null,
      } as any);
      await get().fetchSessions(supabase, userId);
      return newSessionId;
    } catch (error: any) {
      console.error('Error during session creation process:', error);
      if (newSessionId) {
        await supabase.from('sessions').delete().eq('id', newSessionId);
      }
      get().resetActiveSessionState();
      set({ error: `Failed to create session: ${error.message}`, isSessionLoading: false, isLoading: false } as any);
      return null;
    }
  },

  saveSession: async (supabase) => {
    const { currentSessionId, currentSessionTitle, output, activePrompt, subscriptionStatus } = get() as any;
    if (!currentSessionId) {
      console.warn('Attempted to save without an active session ID.');
      return;
    }
    if (subscriptionStatus !== 'active') {
      console.warn('Attempted to save session without an active subscription.');
    }

    set({ isSavingSession: true, error: null } as any);
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
    } catch (error: any) {
      console.error('Error saving session:', error);
      set({ error: `Failed to save session: ${error.message}`, isSavingSession: false } as any);
    }
  },

  deleteSession: async (sessionId, supabase) => {
    set({ isSessionListLoading: true } as any);
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) throw error;
      if (get().currentSessionId === sessionId) {
        get().resetActiveSessionState();
      }
      set((state: any) => ({
        sessionsList: state.sessionsList?.filter((s: any) => s.id !== sessionId) ?? null,
        isSessionListLoading: false,
      }));
    } catch (error: any) {
      console.error('Error deleting session:', error);
      set({ error: `Failed to delete session: ${error.message}`, isSessionListLoading: false } as any);
    }
  },

  updateSessionTitleLocally: (title) => {
    set({ currentSessionTitle: title });
  },

  resetActiveSessionState: () =>
    set({
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
      expandedConceptCache: new Map(),
      clusters: {},
      visitedNodeIds: [],
    } as any),
});

