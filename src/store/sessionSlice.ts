
import { StateCreator } from 'zustand';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeClusters } from '@/lib/graphCluster';
import type { AppState, IntelleaResponse, NodeObject, SessionSummary, LoadedSessionData } from './useAppStore';
import { isLoadedSessionData } from './utils';

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

/**
 * @description Create the session management slice of the store.
 */
export const createSessionSlice: StateCreator<AppState, [], [], SessionSlice> = (set, get) => ({
  sessionsList: null,
  isSessionListLoading: false,
  currentSessionId: null,
  currentSessionTitle: null,
  isSessionLoading: false,
  isSavingSession: false,

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
    } catch (error: unknown) {
      console.error('Error fetching sessions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to fetch sessions: ${errorMessage}`, isSessionListLoading: false });
    }
  },

  loadSession: async (sessionId, supabase) => {
    set({
      isSessionLoading: true,
      error: null,
      activeFocusPathIds: null,
      focusedNodeId: null,
      activeClickedNodeId: null,
    });
    try {
      const { data: loadedData, error } = await supabase
        .from('sessions')
        .select('id, title, session_data, last_prompt')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!loadedData) throw new Error('Session not found.');

      const sessionDataUnknown = loadedData.session_data as unknown;
      if (!isLoadedSessionData(sessionDataUnknown)) {
        console.error('Loaded session data has invalid structure:', sessionDataUnknown);
        throw new Error('Loaded session data has an invalid or outdated structure.');
      }

      const sessionData: LoadedSessionData = sessionDataUnknown;

      const clusters = computeClusters(sessionData.visualizationData);
      set({
        output: sessionData,
        activePrompt: loadedData.last_prompt,
        currentSessionId: sessionId,
        currentSessionTitle: loadedData.title,
        isSessionLoading: false,
        activeFocusPathIds: null,
        focusedNodeId: null,
        activeClickedNodeId: null,
        clusters,
      });

      await get().loadExpandedConcepts(sessionId);
    } catch (error: unknown) {
      console.error('Error loading session:', error);
      get().resetActiveSessionState();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to load session: ${errorMessage}`, currentSessionId: null, currentSessionTitle: null, isSessionLoading: false });
    }
  },

  createSession: async (supabase, userId, initialPrompt) => {
    if (!initialPrompt?.trim()) {
      set({ error: 'Cannot create session: Initial topic/prompt is required.' });
      return null;
    }
    const currentStatus = get().subscriptionStatus;
    if (currentStatus !== 'active') {
      set({ error: 'An active subscription is required to create new sessions.' });
      return null;
    }
    set({ isSessionLoading: true, isLoading: true, error: null });
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
      });
      await get().fetchSessions(supabase, userId);
      return newSessionId;
    } catch (error: unknown) {
      console.error('Error during session creation process:', error);
      if (newSessionId) {
        await supabase.from('sessions').delete().eq('id', newSessionId);
      }
      get().resetActiveSessionState();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to create session: ${errorMessage}`, isSessionLoading: false, isLoading: false });
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
    } catch (error: unknown) {
      console.error('Error saving session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to save session: ${errorMessage}`, isSavingSession: false });
    }
  },

  deleteSession: async (sessionId, supabase) => {
    set({ isSessionListLoading: true });
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) throw error;
      if (get().currentSessionId === sessionId) {
        get().resetActiveSessionState();
      }
      set((state) => ({
        sessionsList: state.sessionsList?.filter((s) => s.id !== sessionId) ?? null,
        isSessionListLoading: false,
      }));
    } catch (error: unknown) {
      console.error('Error deleting session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to delete session: ${errorMessage}`, isSessionListLoading: false });
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
    }),
});

