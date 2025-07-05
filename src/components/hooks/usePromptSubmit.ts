'use client';

import { useCallback } from 'react';
import { useAppStore, IntelleaResponse } from '@/store/useAppStore';
import { createClient } from '@/lib/supabase/client';

export function usePromptSubmit() {
  const supabase = createClient();

  const prompt = useAppStore(state => state.prompt);
  const isLoading = useAppStore(state => state.isLoading);
  const subscriptionStatus = useAppStore(state => state.subscriptionStatus);

  const {
    setLoading,
    setOutput,
    setActivePrompt,
    setError,
    createSession,
    saveSession,
  } = useAppStore.getState();

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;
    if (subscriptionStatus !== 'active') {
      setError('You need an active subscription to generate new content.');
      return;
    }
    const currentPrompt = prompt;
    const activeSessionId = useAppStore.getState().currentSessionId;
    if (process.env.NEXT_PUBLIC_DEBUG === 'true')
      console.log(`Submit triggered. Prompt: "${currentPrompt}", Current Session ID: ${activeSessionId}`);
    setLoading(true);
    setOutput(null);
    setActivePrompt(null);
    setError(null);
    try {
      if (activeSessionId === null) {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true')
          console.log('No active session ID, attempting to create new session...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not logged in. Cannot create session.');
        }
        const newSessionId = await createSession(supabase, user.id, currentPrompt);
        if (newSessionId) {
          if (process.env.NEXT_PUBLIC_DEBUG === 'true')
            console.log('New session created and initial data loaded by store action. ID:', newSessionId);
        } else {
          console.error('handleSubmit: createSession action failed.');
        }
      } else {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true')
          console.log(`Submitting follow-up prompt for existing session ${activeSessionId}`);
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: currentPrompt }),
        });
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            /* ignore */
          }
          throw new Error(errorData?.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setOutput(data.output as IntelleaResponse);
        setActivePrompt(currentPrompt);
        if (process.env.NEXT_PUBLIC_DEBUG === 'true')
          console.log(`Attempting auto-save for session ${activeSessionId} after follow-up generation.`);
        saveSession(supabase);
      }
    } catch (error) {
      console.error('Failed during handleSubmit:', error);
      const errorMessage = `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`;
      if (activeSessionId !== null) {
        setOutput(errorMessage);
      }
      setError(errorMessage);
      setActivePrompt(currentPrompt);
    } finally {
      setLoading(false);
    }
  }, [prompt, isLoading, subscriptionStatus, supabase, createSession, saveSession, setActivePrompt, setError, setLoading, setOutput]);

  return handleSubmit;
}
