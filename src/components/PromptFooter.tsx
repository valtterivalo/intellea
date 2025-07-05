'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { usePromptSubmit } from './hooks/usePromptSubmit';
import { useShallow } from 'zustand/react/shallow';

const PromptFooter: React.FC = () => {
  const handleSubmit = usePromptSubmit();

  const {
    prompt,
    setPrompt,
    isLoading,
    isSubscriptionLoading,
    subscriptionStatus,
    currentSessionId,
    viewMode,
    setViewMode,
  } = useAppStore(
    useShallow((state) => ({
      prompt: state.prompt,
      setPrompt: state.setPrompt,
      isLoading: state.isLoading,
      isSubscriptionLoading: state.isSubscriptionLoading,
      subscriptionStatus: state.subscriptionStatus,
      currentSessionId: state.currentSessionId,
      viewMode: state.viewMode,
      setViewMode: state.setViewMode,
    }))
  );

  const promptDisabled = isLoading || isSubscriptionLoading || (subscriptionStatus !== 'active' && !currentSessionId);
  const sendDisabled = promptDisabled || !prompt.trim();

  return (
    <footer className="p-4 border-t bg-background flex-shrink-0">
      <div className="max-w-6xl mx-auto w-full px-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-1 p-1 bg-muted rounded-lg flex-shrink-0">
            <Button
              variant={viewMode === 'graph' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('graph')}
              className="text-sm"
            >
              Knowledge Graph
            </Button>
            <Button
              variant={viewMode === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('chat')}
              className="text-sm"
            >
              Chat View
            </Button>
          </div>
          <div className="flex gap-2 flex-1">
            <Textarea
              placeholder={promptDisabled ? 'Activate a subscription or load a session to explore.' : 'Ask about a topic, concept, or process...'}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={promptDisabled || isLoading}
              className="flex-1 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!sendDisabled) handleSubmit();
                }
              }}
            />
            <Button onClick={handleSubmit} disabled={sendDisabled}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PromptFooter;
